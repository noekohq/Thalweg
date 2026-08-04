package daemon

import (
	"encoding/json"
	"path/filepath"
	"strconv"
	"strings"
	"testing"

	"github.com/dgraph-io/badger/v4"
)

func TestNewPersistsStorageSchemaVersion(t *testing.T) {
	root := t.TempDir()
	dbPath := filepath.Join(root, "storage", "badger")
	d, err := New(filepath.Join(root, "daemon.sock"), dbPath)
	if err != nil {
		t.Fatalf("create daemon: %v", err)
	}
	if err := d.Close(); err != nil {
		t.Fatalf("close daemon: %v", err)
	}

	db, err := badger.Open(badger.DefaultOptions(dbPath).WithLogger(nil))
	if err != nil {
		t.Fatalf("reopen badger: %v", err)
	}
	defer db.Close()

	var version string
	if err := db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(storageSchemaVersionKey))
		if err != nil {
			return err
		}
		return item.Value(func(value []byte) error {
			version = string(value)
			return nil
		})
	}); err != nil {
		t.Fatalf("read storage schema version: %v", err)
	}
	if version != strconv.Itoa(currentStorageSchemaVersion) {
		t.Fatalf("storage schema version = %q, want %d", version, currentStorageSchemaVersion)
	}
}

func TestNewRejectsUnsupportedStorageSchema(t *testing.T) {
	root := t.TempDir()
	dbPath := filepath.Join(root, "storage", "badger")
	db, err := badger.Open(badger.DefaultOptions(dbPath).WithLogger(nil))
	if err != nil {
		t.Fatalf("open badger: %v", err)
	}
	if err := db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(storageSchemaVersionKey), []byte("999"))
	}); err != nil {
		t.Fatalf("write unsupported schema: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("close badger: %v", err)
	}

	_, err = New(filepath.Join(root, "daemon.sock"), dbPath)
	if err == nil {
		t.Fatal("expected unsupported storage schema error")
	}
	if !strings.Contains(err.Error(), "unsupported storage schema version 999") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestNewMigratesStorageSchemaOneHLCState(t *testing.T) {
	root := t.TempDir()
	dbPath := filepath.Join(root, "storage", "badger")
	db, err := badger.Open(badger.DefaultOptions(dbPath).WithLogger(nil))
	if err != nil {
		t.Fatalf("open badger: %v", err)
	}
	event := ThalwegEvent{
		ID:         "legacy-event",
		Network:    "test",
		Stream:     "user:note",
		OccurredAt: "2026-01-01T00:00:00Z",
		InsertedAt: "2026-01-01T01:30:00-05:00",
		Counter:    7,
		DeviceID:   "legacy-device",
		Payload:    json.RawMessage(`{}`),
	}
	value, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("marshal event: %v", err)
	}
	if err := db.Update(func(txn *badger.Txn) error {
		if err := txn.Set([]byte(storageSchemaVersionKey), []byte("1")); err != nil {
			return err
		}
		return txn.Set([]byte(legacyEventKey(event)), value)
	}); err != nil {
		t.Fatalf("seed schema one storage: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("close seeded badger: %v", err)
	}

	d, err := New(filepath.Join(root, "daemon.sock"), dbPath)
	if err != nil {
		t.Fatalf("open and migrate daemon: %v", err)
	}
	defer d.Close()

	want := hlcTimestamp{Physical: "2026-01-01T06:30:00.000000000Z", Logical: 7}
	if d.hlc.state != want {
		t.Fatalf("migrated HLC state = %#v, want %#v", d.hlc.state, want)
	}
	if version, exists, err := readStorageSchemaVersion(d.store); err != nil {
		t.Fatalf("read migrated version: %v", err)
	} else if !exists || version != currentStorageSchemaVersion {
		t.Fatalf("migrated version = %d, exists=%v; want %d", version, exists, currentStorageSchemaVersion)
	}
	migratedEvent := event
	migratedEvent.OccurredAt = "2026-01-01T00:00:00.000000000Z"
	migratedEvent.InsertedAt = "2026-01-01T06:30:00.000000000Z"
	if err := d.store.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(eventIDKey(event.Network, event.ID)))
		if err != nil {
			return err
		}
		return item.Value(func(indexedPrimaryKey []byte) error {
			if string(indexedPrimaryKey) != eventKey(migratedEvent) {
				t.Fatalf("indexed primary key = %q, want %q", indexedPrimaryKey, eventKey(migratedEvent))
			}
			return nil
		})
	}); err != nil {
		t.Fatalf("read migrated event ID index: %v", err)
	}
}

func TestSchemaThreeMigrationRejectsLegacyEventIDCollision(t *testing.T) {
	root := t.TempDir()
	dbPath := filepath.Join(root, "storage", "badger")
	db, err := badger.Open(badger.DefaultOptions(dbPath).WithLogger(nil))
	if err != nil {
		t.Fatalf("open badger: %v", err)
	}
	first := ThalwegEvent{
		ID:         "duplicate",
		Network:    "test",
		Stream:     "stream:one",
		OccurredAt: "2026-01-01T00:00:00.000000000Z",
		InsertedAt: "2026-01-01T00:00:00.000000000Z",
		DeviceID:   "legacy-device",
		Payload:    json.RawMessage(`{}`),
	}
	second := first
	second.Stream = "stream:two"
	for _, event := range []ThalwegEvent{first, second} {
		value, err := json.Marshal(event)
		if err != nil {
			t.Fatalf("marshal event: %v", err)
		}
		if err := db.Update(func(txn *badger.Txn) error {
			return txn.Set([]byte(legacyEventKey(event)), value)
		}); err != nil {
			t.Fatalf("seed event: %v", err)
		}
	}
	if err := db.Update(func(txn *badger.Txn) error {
		if err := txn.Set([]byte(storageSchemaVersionKey), []byte("2")); err != nil {
			return err
		}
		return setHLCState(txn, hlcTimestamp{
			Physical: "2026-01-01T00:00:00.000000000Z",
		})
	}); err != nil {
		t.Fatalf("seed schema metadata: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("close seeded badger: %v", err)
	}

	_, err = New(filepath.Join(root, "daemon.sock"), dbPath)
	if err == nil {
		t.Fatal("expected duplicate event ID migration error")
	}
	if !strings.Contains(err.Error(), `duplicate event ID "duplicate"`) {
		t.Fatalf("unexpected migration error: %v", err)
	}
}

func TestSchemaFourMigrationBackfillsDeterministicArrivalIndex(t *testing.T) {
	root := t.TempDir()
	dbPath := filepath.Join(root, "storage", "badger")
	db, err := badger.Open(badger.DefaultOptions(dbPath).WithLogger(nil))
	if err != nil {
		t.Fatalf("open badger: %v", err)
	}
	events := []ThalwegEvent{
		{ID: "later", Network: "home", Stream: "user:note", OccurredAt: "2026-08-03T12:00:02.000000000Z", InsertedAt: "2026-08-03T12:00:02.000000000Z", PropagatedAt: "2026-08-03T12:00:02.000000000Z", DeviceID: "device-a", Payload: json.RawMessage(`{}`)},
		{ID: "earlier", Network: "home", Stream: "user:note", OccurredAt: "2026-08-03T12:00:01.000000000Z", InsertedAt: "2026-08-03T12:00:01.000000000Z", PropagatedAt: "2026-08-03T12:00:01.000000000Z", DeviceID: "device-a", Payload: json.RawMessage(`{}`)},
	}
	if err := db.Update(func(txn *badger.Txn) error {
		if err := txn.Set([]byte(storageSchemaVersionKey), []byte("3")); err != nil {
			return err
		}
		if err := setHLCState(txn, hlcTimestamp{Physical: "2026-08-03T12:00:02.000000000Z"}); err != nil {
			return err
		}
		for _, event := range events {
			value, err := json.Marshal(event)
			if err != nil {
				return err
			}
			primary := eventKey(event)
			if err := txn.Set([]byte(primary), value); err != nil {
				return err
			}
			if err := txn.Set([]byte(eventIDKey(event.Network, event.ID)), []byte(primary)); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		t.Fatalf("seed schema three: %v", err)
	}
	if err := db.Close(); err != nil {
		t.Fatalf("close seeded badger: %v", err)
	}

	d, err := New(filepath.Join(root, "daemon.sock"), dbPath)
	if err != nil {
		t.Fatalf("migrate schema four: %v", err)
	}
	defer d.Close()
	if err := d.store.View(func(txn *badger.Txn) error {
		sequence, err := readArrivalSequence(txn)
		if err != nil {
			return err
		}
		if sequence != 2 {
			t.Fatalf("arrival sequence = %d, want 2", sequence)
		}
		first, err := txn.Get([]byte(arrivalIndexKey("home", 1)))
		if err != nil {
			return err
		}
		return first.Value(func(value []byte) error {
			if string(value) != eventKey(events[1]) {
				t.Fatalf("first arrival points to %q, want earlier event", value)
			}
			return nil
		})
	}); err != nil {
		t.Fatalf("inspect arrival migration: %v", err)
	}
}
