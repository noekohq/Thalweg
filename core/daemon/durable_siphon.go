package daemon

import (
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/dgraph-io/badger/v4"
)

const (
	arrivalSequenceKey        = "meta:event-arrival-sequence"
	durableSiphonVersion      = 1
	durableSiphonMaxBatch     = 100
	durableSiphonDefaultBatch = 25
)

type DurableSiphonInfo struct {
	Version           int      `json:"version"`
	Name              string   `json:"name"`
	Network           string   `json:"network"`
	Streams           []string `json:"streams"`
	Cursor            uint64   `json:"cursor"`
	CreatedAt         string   `json:"createdAt"`
	UpdatedAt         string   `json:"updatedAt"`
	PendingDeliveryID string   `json:"pendingDeliveryId,omitempty"`
	PendingCount      int      `json:"pendingCount"`
	PendingAttempts   int      `json:"pendingAttempts"`
}

type DurableSiphonDelivery struct {
	Version       int            `json:"version"`
	Name          string         `json:"name"`
	Network       string         `json:"network"`
	DeliveryID    string         `json:"deliveryId,omitempty"`
	CursorFrom    uint64         `json:"cursorFrom"`
	CursorThrough uint64         `json:"cursorThrough"`
	Attempt       int            `json:"attempt"`
	Events        []ThalwegEvent `json:"events"`
}

type durableSiphonDefinition struct {
	Version   int                   `json:"version"`
	Name      string                `json:"name"`
	Network   string                `json:"network"`
	Streams   []string              `json:"streams"`
	Cursor    uint64                `json:"cursor"`
	CreatedAt string                `json:"createdAt"`
	UpdatedAt string                `json:"updatedAt"`
	Pending   *durableSiphonPending `json:"pending,omitempty"`
}

type durableSiphonPending struct {
	ID            string   `json:"id"`
	CursorFrom    uint64   `json:"cursorFrom"`
	CursorThrough uint64   `json:"cursorThrough"`
	EventKeys     []string `json:"eventKeys"`
	CreatedAt     string   `json:"createdAt"`
	Attempts      int      `json:"attempts"`
}

func arrivalIndexPrefix(network string) string {
	return fmt.Sprintf("event-arrival-v1:%s:", encodeKeyPart(network))
}

func arrivalIndexKey(network string, sequence uint64) string {
	return fmt.Sprintf("%s%020d", arrivalIndexPrefix(network), sequence)
}

func durableSiphonPrefix(network string) string {
	if network == "" {
		return "durable-siphon-v1:"
	}
	return fmt.Sprintf("durable-siphon-v1:%s:", encodeKeyPart(network))
}

func durableSiphonKey(network, name string) string {
	return durableSiphonPrefix(network) + encodeKeyPart(name)
}

func appendArrivalIndex(txn *badger.Txn, event ThalwegEvent, primaryKey string) error {
	sequence, err := readArrivalSequence(txn)
	if err != nil {
		return err
	}
	if sequence == ^uint64(0) {
		return fmt.Errorf("event arrival sequence exhausted")
	}
	sequence++
	if err := txn.Set([]byte(arrivalIndexKey(event.Network, sequence)), []byte(primaryKey)); err != nil {
		return fmt.Errorf("write event arrival index: %w", err)
	}
	if err := txn.Set([]byte(arrivalSequenceKey), []byte(strconv.FormatUint(sequence, 10))); err != nil {
		return fmt.Errorf("write event arrival sequence: %w", err)
	}
	return nil
}

func readArrivalSequence(txn *badger.Txn) (uint64, error) {
	item, err := txn.Get([]byte(arrivalSequenceKey))
	if errors.Is(err, badger.ErrKeyNotFound) {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("read event arrival sequence: %w", err)
	}
	value, err := item.ValueCopy(nil)
	if err != nil {
		return 0, fmt.Errorf("read event arrival sequence value: %w", err)
	}
	sequence, err := strconv.ParseUint(string(value), 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid event arrival sequence %q: %w", value, err)
	}
	return sequence, nil
}

func (d *Daemon) createDurableSiphon(network, name string, streams []string, start string) (DurableSiphonInfo, error) {
	if _, exists := d.memberships.get(network); !exists {
		return DurableSiphonInfo{}, fmt.Errorf("network %q is not mounted", network)
	}
	if err := validateDurableSiphonName(name); err != nil {
		return DurableSiphonInfo{}, err
	}
	streams, err := normalizeDurableStreams(streams)
	if err != nil {
		return DurableSiphonInfo{}, err
	}
	if start == "" {
		start = "earliest"
	}
	if start != "earliest" && start != "latest" {
		return DurableSiphonInfo{}, fmt.Errorf("start must be \"earliest\" or \"latest\"")
	}

	d.durableMu.Lock()
	defer d.durableMu.Unlock()
	var definition durableSiphonDefinition
	err = d.store.Update(func(txn *badger.Txn) error {
		existing, found, err := readDurableSiphon(txn, network, name)
		if err != nil {
			return err
		}
		if found {
			if !equalStrings(existing.Streams, streams) {
				return fmt.Errorf("durable siphon %q already exists with different streams", name)
			}
			definition = existing
			return nil
		}
		cursor := uint64(0)
		if start == "latest" {
			cursor, err = readArrivalSequence(txn)
			if err != nil {
				return err
			}
		}
		now := d.clockNow().UTC().Format(canonicalTimestampLayout)
		definition = durableSiphonDefinition{
			Version: durableSiphonVersion, Name: name, Network: network,
			Streams: streams, Cursor: cursor, CreatedAt: now, UpdatedAt: now,
		}
		return writeDurableSiphon(txn, definition)
	})
	if err != nil {
		return DurableSiphonInfo{}, err
	}
	return definition.info(), nil
}

func (d *Daemon) listDurableSiphons(network string) ([]DurableSiphonInfo, error) {
	definitions := make([]DurableSiphonInfo, 0)
	err := d.store.View(func(txn *badger.Txn) error {
		prefix := []byte(durableSiphonPrefix(network))
		it := txn.NewIterator(badger.DefaultIteratorOptions)
		defer it.Close()
		for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
			var definition durableSiphonDefinition
			if err := it.Item().Value(func(value []byte) error {
				return json.Unmarshal(value, &definition)
			}); err != nil {
				return fmt.Errorf("decode durable siphon: %w", err)
			}
			if definition.Version != durableSiphonVersion {
				return fmt.Errorf("unsupported durable siphon version %d", definition.Version)
			}
			definitions = append(definitions, definition.info())
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	sort.Slice(definitions, func(i, j int) bool {
		if definitions[i].Network == definitions[j].Network {
			return definitions[i].Name < definitions[j].Name
		}
		return definitions[i].Network < definitions[j].Network
	})
	return definitions, nil
}

func (d *Daemon) pollDurableSiphon(network, name string, limit int) (DurableSiphonDelivery, error) {
	if limit == 0 {
		limit = durableSiphonDefaultBatch
	}
	if limit < 1 || limit > durableSiphonMaxBatch {
		return DurableSiphonDelivery{}, fmt.Errorf("limit must be between 1 and %d", durableSiphonMaxBatch)
	}
	d.durableMu.Lock()
	defer d.durableMu.Unlock()
	var delivery DurableSiphonDelivery
	err := d.store.Update(func(txn *badger.Txn) error {
		definition, found, err := readDurableSiphon(txn, network, name)
		if err != nil {
			return err
		}
		if !found {
			return fmt.Errorf("durable siphon %q is not registered in network %q", name, network)
		}
		if definition.Pending == nil {
			if err := d.prepareDurableDelivery(txn, &definition, limit); err != nil {
				return err
			}
		} else {
			definition.Pending.Attempts++
			definition.UpdatedAt = d.clockNow().UTC().Format(canonicalTimestampLayout)
			if err := writeDurableSiphon(txn, definition); err != nil {
				return err
			}
		}
		delivery, err = durableDeliveryFromDefinition(txn, definition)
		return err
	})
	if err != nil {
		return DurableSiphonDelivery{}, err
	}
	return delivery, nil
}

func (d *Daemon) waitForDurableSiphon(network, name string, limit int, wait time.Duration) (DurableSiphonDelivery, error) {
	if wait <= 0 {
		return d.pollDurableSiphon(network, name, limit)
	}
	deadline := time.NewTimer(wait)
	defer deadline.Stop()
	for {
		wake := d.durableSiphonWakeChannel()
		delivery, err := d.pollDurableSiphon(network, name, limit)
		if err != nil || delivery.DeliveryID != "" {
			return delivery, err
		}
		select {
		case <-wake:
			continue
		case <-deadline.C:
			return delivery, nil
		case <-d.ctx.Done():
			return DurableSiphonDelivery{}, d.ctx.Err()
		}
	}
}

func (d *Daemon) durableSiphonWakeChannel() <-chan struct{} {
	d.durableWakeMu.Lock()
	defer d.durableWakeMu.Unlock()
	if d.durableWake == nil {
		d.durableWake = make(chan struct{})
	}
	return d.durableWake
}

func (d *Daemon) signalDurableSiphons() {
	d.durableWakeMu.Lock()
	if d.durableWake != nil {
		close(d.durableWake)
	}
	d.durableWake = make(chan struct{})
	d.durableWakeMu.Unlock()
}

func (d *Daemon) prepareDurableDelivery(txn *badger.Txn, definition *durableSiphonDefinition, limit int) error {
	resolutions, err := conflictResolutionsTxn(txn, definition.Network)
	if err != nil {
		return err
	}
	streamSet := make(map[string]struct{}, len(definition.Streams))
	for _, stream := range definition.Streams {
		streamSet[stream] = struct{}{}
	}
	prefix := []byte(arrivalIndexPrefix(definition.Network))
	seek := []byte(arrivalIndexKey(definition.Network, definition.Cursor+1))
	it := txn.NewIterator(badger.DefaultIteratorOptions)
	defer it.Close()
	through := definition.Cursor
	eventKeys := make([]string, 0, limit)
	for it.Seek(seek); it.ValidForPrefix(prefix); it.Next() {
		sequence, err := arrivalSequenceFromKey(prefix, it.Item().Key())
		if err != nil {
			return err
		}
		through = sequence
		primaryKey, err := it.Item().ValueCopy(nil)
		if err != nil {
			return fmt.Errorf("read event arrival index: %w", err)
		}
		event, err := readEventAtKey(txn, primaryKey)
		if err != nil {
			return err
		}
		if _, superseded := resolutions[event.ID]; superseded {
			continue
		}
		if len(streamSet) > 0 {
			if _, matches := streamSet[event.Stream]; !matches {
				continue
			}
		}
		eventKeys = append(eventKeys, string(primaryKey))
		if len(eventKeys) == limit {
			break
		}
	}
	if len(eventKeys) == 0 {
		if through > definition.Cursor {
			definition.Cursor = through
			definition.UpdatedAt = d.clockNow().UTC().Format(canonicalTimestampLayout)
			return writeDurableSiphon(txn, *definition)
		}
		return nil
	}
	now := d.clockNow().UTC().Format(canonicalTimestampLayout)
	definition.Pending = &durableSiphonPending{
		ID: randomID("delivery"), CursorFrom: definition.Cursor,
		CursorThrough: through, EventKeys: eventKeys, CreatedAt: now, Attempts: 1,
	}
	definition.UpdatedAt = now
	return writeDurableSiphon(txn, *definition)
}

func (d *Daemon) acknowledgeDurableSiphon(network, name, deliveryID string) (DurableSiphonInfo, error) {
	if strings.TrimSpace(deliveryID) == "" {
		return DurableSiphonInfo{}, fmt.Errorf("delivery ID is required")
	}
	d.durableMu.Lock()
	defer d.durableMu.Unlock()
	var info DurableSiphonInfo
	err := d.store.Update(func(txn *badger.Txn) error {
		definition, found, err := readDurableSiphon(txn, network, name)
		if err != nil {
			return err
		}
		if !found {
			return fmt.Errorf("durable siphon %q is not registered in network %q", name, network)
		}
		if definition.Pending == nil {
			return fmt.Errorf("durable siphon %q has no pending delivery", name)
		}
		if definition.Pending.ID != deliveryID {
			return fmt.Errorf("delivery ID does not match the pending delivery")
		}
		definition.Cursor = definition.Pending.CursorThrough
		definition.Pending = nil
		definition.UpdatedAt = d.clockNow().UTC().Format(canonicalTimestampLayout)
		if err := writeDurableSiphon(txn, definition); err != nil {
			return err
		}
		info = definition.info()
		return nil
	})
	if err != nil {
		return DurableSiphonInfo{}, err
	}
	return info, nil
}

func readDurableSiphon(txn *badger.Txn, network, name string) (durableSiphonDefinition, bool, error) {
	item, err := txn.Get([]byte(durableSiphonKey(network, name)))
	if errors.Is(err, badger.ErrKeyNotFound) {
		return durableSiphonDefinition{}, false, nil
	}
	if err != nil {
		return durableSiphonDefinition{}, false, fmt.Errorf("read durable siphon: %w", err)
	}
	var definition durableSiphonDefinition
	if err := item.Value(func(value []byte) error { return json.Unmarshal(value, &definition) }); err != nil {
		return durableSiphonDefinition{}, false, fmt.Errorf("decode durable siphon: %w", err)
	}
	if definition.Version != durableSiphonVersion {
		return durableSiphonDefinition{}, false, fmt.Errorf("unsupported durable siphon version %d", definition.Version)
	}
	return definition, true, nil
}

func writeDurableSiphon(txn *badger.Txn, definition durableSiphonDefinition) error {
	value, err := json.Marshal(definition)
	if err != nil {
		return fmt.Errorf("encode durable siphon: %w", err)
	}
	if err := txn.Set([]byte(durableSiphonKey(definition.Network, definition.Name)), value); err != nil {
		return fmt.Errorf("write durable siphon: %w", err)
	}
	return nil
}

func durableDeliveryFromDefinition(txn *badger.Txn, definition durableSiphonDefinition) (DurableSiphonDelivery, error) {
	delivery := DurableSiphonDelivery{
		Version: durableSiphonVersion, Name: definition.Name, Network: definition.Network,
		CursorFrom: definition.Cursor, CursorThrough: definition.Cursor,
		Events: make([]ThalwegEvent, 0),
	}
	if definition.Pending == nil {
		return delivery, nil
	}
	delivery.DeliveryID = definition.Pending.ID
	delivery.CursorFrom = definition.Pending.CursorFrom
	delivery.CursorThrough = definition.Pending.CursorThrough
	delivery.Attempt = definition.Pending.Attempts
	for _, key := range definition.Pending.EventKeys {
		event, err := readEventAtKey(txn, []byte(key))
		if err != nil {
			return DurableSiphonDelivery{}, err
		}
		delivery.Events = append(delivery.Events, event)
	}
	return delivery, nil
}

func readEventAtKey(txn *badger.Txn, key []byte) (ThalwegEvent, error) {
	item, err := txn.Get(key)
	if errors.Is(err, badger.ErrKeyNotFound) {
		return ThalwegEvent{}, fmt.Errorf("event arrival index points to missing event: %s", key)
	}
	if err != nil {
		return ThalwegEvent{}, fmt.Errorf("read event from arrival index: %w", err)
	}
	var event ThalwegEvent
	if err := item.Value(func(value []byte) error { return json.Unmarshal(value, &event) }); err != nil {
		return ThalwegEvent{}, fmt.Errorf("decode event from arrival index: %w", err)
	}
	return event, nil
}

func arrivalSequenceFromKey(prefix, key []byte) (uint64, error) {
	if len(key) != len(prefix)+20 {
		return 0, fmt.Errorf("invalid event arrival index key %q", key)
	}
	sequence, err := strconv.ParseUint(string(key[len(prefix):]), 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid event arrival index key %q: %w", key, err)
	}
	return sequence, nil
}

func normalizeDurableStreams(streams []string) ([]string, error) {
	set := make(map[string]struct{}, len(streams))
	for _, stream := range streams {
		stream = strings.TrimSpace(stream)
		if stream == "" {
			return nil, fmt.Errorf("streams must not contain empty names")
		}
		set[stream] = struct{}{}
	}
	normalized := make([]string, 0, len(set))
	for stream := range set {
		normalized = append(normalized, stream)
	}
	sort.Strings(normalized)
	return normalized, nil
}

func validateDurableSiphonName(name string) error {
	if strings.TrimSpace(name) == "" {
		return fmt.Errorf("durable siphon name is required")
	}
	if name != strings.TrimSpace(name) {
		return fmt.Errorf("durable siphon name must not have leading or trailing whitespace")
	}
	if len(name) > 128 {
		return fmt.Errorf("durable siphon name must be at most 128 bytes")
	}
	return nil
}

func equalStrings(first, second []string) bool {
	if len(first) != len(second) {
		return false
	}
	for index := range first {
		if first[index] != second[index] {
			return false
		}
	}
	return true
}

func (definition durableSiphonDefinition) info() DurableSiphonInfo {
	info := DurableSiphonInfo{
		Version: definition.Version, Name: definition.Name, Network: definition.Network,
		Streams: append([]string(nil), definition.Streams...), Cursor: definition.Cursor,
		CreatedAt: definition.CreatedAt, UpdatedAt: definition.UpdatedAt,
	}
	if definition.Pending != nil {
		info.PendingDeliveryID = definition.Pending.ID
		info.PendingCount = len(definition.Pending.EventKeys)
		info.PendingAttempts = definition.Pending.Attempts
	}
	return info
}
