package daemon

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"github.com/dgraph-io/badger/v4"
)

const (
	daemonVersion               = "0.1.0-dev"
	currentLocalProtocolVersion = 1
	currentStorageSchemaVersion = 3
	storageSchemaVersionKey     = "meta:storage-schema-version"
)

// Version returns the daemon and CLI release version.
func Version() string {
	return daemonVersion
}

func ensureStorageSchema(db *badger.DB) error {
	storedVersion, exists, err := readStorageSchemaVersion(db)
	if err != nil {
		return err
	}
	if !exists {
		if err := writeStorageSchemaVersion(db, 1); err != nil {
			return err
		}
		storedVersion = 1
	}
	if storedVersion > currentStorageSchemaVersion {
		return fmt.Errorf(
			"unsupported storage schema version %d (daemon supports %d)",
			storedVersion,
			currentStorageSchemaVersion,
		)
	}

	for storedVersion < currentStorageSchemaVersion {
		switch storedVersion {
		case 1:
			if err := migrateStorageV1ToV2(db); err != nil {
				return fmt.Errorf("migrate storage schema 1 to 2: %w", err)
			}
			storedVersion = 2
		case 2:
			if err := migrateStorageV2ToV3(db); err != nil {
				return fmt.Errorf("migrate storage schema 2 to 3: %w", err)
			}
			storedVersion = 3
		default:
			return fmt.Errorf("no migration from storage schema version %d", storedVersion)
		}
	}
	return nil
}

func readStorageSchemaVersion(db *badger.DB) (int, bool, error) {
	var storedVersion int
	err := db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(storageSchemaVersionKey))
		if err != nil {
			return err
		}
		return item.Value(func(value []byte) error {
			parsed, err := strconv.Atoi(string(value))
			if err != nil {
				return fmt.Errorf("invalid storage schema version %q: %w", value, err)
			}
			storedVersion = parsed
			return nil
		})
	})
	if errors.Is(err, badger.ErrKeyNotFound) {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, fmt.Errorf("read storage schema version: %w", err)
	}
	return storedVersion, true, nil
}

func writeStorageSchemaVersion(db *badger.DB, version int) error {
	return db.Update(func(txn *badger.Txn) error {
		return txn.Set(
			[]byte(storageSchemaVersionKey),
			[]byte(strconv.Itoa(version)),
		)
	})
}

func migrateStorageV1ToV2(db *badger.DB) error {
	return db.Update(func(txn *badger.Txn) error {
		state := hlcTimestamp{}
		options := badger.DefaultIteratorOptions
		options.PrefetchValues = true
		it := txn.NewIterator(options)
		defer it.Close()

		prefix := []byte("event:")
		for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
			var event ThalwegEvent
			if err := it.Item().Value(func(value []byte) error {
				return json.Unmarshal(value, &event)
			}); err != nil {
				return fmt.Errorf("decode event during HLC migration: %w", err)
			}
			physical, err := normalizeTimestamp("stored insertedAt", event.InsertedAt)
			if err != nil {
				return err
			}
			if physical > state.Physical || (physical == state.Physical && event.Counter > state.Logical) {
				state = hlcTimestamp{Physical: physical, Logical: event.Counter}
			}
		}
		if err := setHLCState(txn, state); err != nil {
			return err
		}
		return txn.Set([]byte(storageSchemaVersionKey), []byte("2"))
	})
}

func migrateStorageV2ToV3(db *badger.DB) error {
	type migratedEvent struct {
		oldKey     []byte
		primaryKey string
		indexKey   string
		value      []byte
	}

	return db.Update(func(txn *badger.Txn) error {
		var events []migratedEvent
		indexes := make(map[string]string)
		primaryKeys := make(map[string]string)
		options := badger.DefaultIteratorOptions
		options.PrefetchValues = true
		it := txn.NewIterator(options)

		prefix := []byte("event:")
		for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
			var event ThalwegEvent
			value, err := it.Item().ValueCopy(nil)
			if err != nil {
				it.Close()
				return fmt.Errorf("read event during ID-index migration: %w", err)
			}
			if err := json.Unmarshal(value, &event); err != nil {
				it.Close()
				return fmt.Errorf("decode event during ID-index migration: %w", err)
			}
			normalizedOccurredAt, err := normalizeTimestamp("stored occurredAt", event.OccurredAt)
			if err != nil {
				it.Close()
				return err
			}
			event.OccurredAt = normalizedOccurredAt
			normalizedInsertedAt, err := normalizeTimestamp("stored insertedAt", event.InsertedAt)
			if err != nil {
				it.Close()
				return err
			}
			event.InsertedAt = normalizedInsertedAt
			if event.PropagatedAt != "" {
				normalizedPropagatedAt, err := normalizeTimestamp("stored propagatedAt", event.PropagatedAt)
				if err != nil {
					it.Close()
					return err
				}
				event.PropagatedAt = normalizedPropagatedAt
			}
			normalizedValue, err := json.Marshal(event)
			if err != nil {
				it.Close()
				return fmt.Errorf("encode migrated event: %w", err)
			}
			indexKey := eventIDKey(event.Network, event.ID)
			primaryKey := eventKey(event)
			oldPrimaryKey := string(it.Item().KeyCopy(nil))
			if existing, exists := indexes[indexKey]; exists && existing != oldPrimaryKey {
				it.Close()
				return fmt.Errorf(
					"duplicate event ID %q in network %q prevents migration",
					event.ID,
					event.Network,
				)
			}
			if existing, exists := primaryKeys[primaryKey]; exists && existing != oldPrimaryKey {
				it.Close()
				return fmt.Errorf("event key collision prevents migration: %s", primaryKey)
			}
			indexes[indexKey] = oldPrimaryKey
			primaryKeys[primaryKey] = oldPrimaryKey
			events = append(events, migratedEvent{
				oldKey:     it.Item().KeyCopy(nil),
				primaryKey: primaryKey,
				indexKey:   indexKey,
				value:      normalizedValue,
			})
		}
		it.Close()

		for _, event := range events {
			if err := txn.Set([]byte(event.primaryKey), event.value); err != nil {
				return fmt.Errorf("write migrated event: %w", err)
			}
			if err := txn.Set([]byte(event.indexKey), []byte(event.primaryKey)); err != nil {
				return fmt.Errorf("write migrated event ID index: %w", err)
			}
			if err := txn.Delete(event.oldKey); err != nil {
				return fmt.Errorf("delete legacy event key: %w", err)
			}
		}
		return txn.Set([]byte(storageSchemaVersionKey), []byte("3"))
	})
}
