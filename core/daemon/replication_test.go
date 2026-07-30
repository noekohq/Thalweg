package daemon

import (
	"encoding/json"
	"errors"
	"math"
	"strings"
	"testing"
	"time"

	"github.com/dgraph-io/badger/v4"
)

func TestIngestReplicatedPreservesOriginAndMergesRemoteHLC(t *testing.T) {
	d := newTestDaemon(t)
	d.now = fixedTime("2026-01-01T10:00:00Z")

	if _, err := d.ingest("test", "local", "", "local-before", json.RawMessage(`{}`)); err != nil {
		t.Fatalf("seed local HLC: %v", err)
	}

	incoming := replicatedTestEvent()
	stored, created, err := d.ingestReplicated(incoming)
	if err != nil {
		t.Fatalf("ingest replicated: %v", err)
	}
	if !created {
		t.Fatal("new replicated event was reported as a duplicate")
	}
	if stored.InsertedAt != "2026-01-01T11:00:00.000000000Z" ||
		stored.Counter != 4 ||
		stored.DeviceID != "remote-device" {
		t.Fatalf("origin envelope was rewritten: %#v", stored)
	}
	wantState := (hlcTimestamp{Physical: "2026-01-01T11:00:00.000000000Z", Logical: 5})
	if d.hlc.state != wantState {
		t.Fatalf("merged HLC = %#v, want %#v", d.hlc.state, wantState)
	}

	next, err := d.ingest("test", "local", "", "local-after", json.RawMessage(`{}`))
	if err != nil {
		t.Fatalf("ingest after replicated event: %v", err)
	}
	if next.InsertedAt != wantState.Physical || next.Counter != 6 {
		t.Fatalf("next local HLC = (%s, %d), want (%s, 6)", next.InsertedAt, next.Counter, wantState.Physical)
	}
}

func TestIngestReplicatedMergesOlderRemoteHLC(t *testing.T) {
	d := newTestDaemon(t)
	d.hlc.state = hlcTimestamp{Physical: "2026-01-01T11:00:00.000000000Z", Logical: 2}
	d.now = fixedTime("2026-01-01T09:00:00Z")

	incoming := replicatedTestEvent()
	incoming.InsertedAt = "2026-01-01T10:00:00Z"
	incoming.Counter = 9
	if _, created, err := d.ingestReplicated(incoming); err != nil {
		t.Fatalf("ingest replicated: %v", err)
	} else if !created {
		t.Fatal("new replicated event was reported as a duplicate")
	}

	want := (hlcTimestamp{Physical: "2026-01-01T11:00:00.000000000Z", Logical: 3})
	if d.hlc.state != want {
		t.Fatalf("merged HLC = %#v, want %#v", d.hlc.state, want)
	}
}

func TestIngestReplicatedDuplicateIsIdempotentAndConflictIsRejected(t *testing.T) {
	d := newTestDaemon(t)
	d.now = fixedTime("2026-01-01T10:00:00Z")
	incoming := replicatedTestEvent()

	first, created, err := d.ingestReplicated(incoming)
	if err != nil || !created {
		t.Fatalf("first replicated ingest = (%#v, %t, %v)", first, created, err)
	}
	stateAfterFirst := d.hlc.state

	retry := incoming
	retry.OccurredAt = "2025-12-31T19:00:00-05:00"
	retry.Payload = json.RawMessage(`{"nested":{"a":1,"b":2},"value":"same"}`)
	second, created, err := d.ingestReplicated(retry)
	if err != nil {
		t.Fatalf("replicated retry: %v", err)
	}
	if created {
		t.Fatal("replicated retry was reported as newly created")
	}
	if second.InsertedAt != first.InsertedAt || d.hlc.state != stateAfterFirst {
		t.Fatal("replicated retry changed the event or advanced the local HLC")
	}

	conflict := incoming
	conflict.Payload = json.RawMessage(`{"value":"different"}`)
	if _, _, err := d.ingestReplicated(conflict); err == nil {
		t.Fatal("expected conflicting origin envelope to be rejected")
	}
	if d.hlc.state != stateAfterFirst {
		t.Fatal("conflict advanced the local HLC")
	}
	events, err := d.query("test", nil, "", "", 0)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(events) != 1 {
		t.Fatalf("expected one stored event, got %d", len(events))
	}
}

func TestIngestReplicatedValidatesEnvelope(t *testing.T) {
	base := replicatedTestEvent()
	tests := []struct {
		name   string
		mutate func(*ThalwegEvent)
		want   string
	}{
		{name: "id", mutate: func(event *ThalwegEvent) { event.ID = "" }, want: "id is required"},
		{name: "network", mutate: func(event *ThalwegEvent) { event.Network = "" }, want: "network is required"},
		{name: "stream", mutate: func(event *ThalwegEvent) { event.Stream = "" }, want: "stream is required"},
		{name: "device", mutate: func(event *ThalwegEvent) { event.DeviceID = "" }, want: "deviceId is required"},
		{name: "occurred", mutate: func(event *ThalwegEvent) { event.OccurredAt = "bad" }, want: "occurredAt must be"},
		{name: "inserted", mutate: func(event *ThalwegEvent) { event.InsertedAt = "bad" }, want: "insertedAt must be"},
		{name: "propagated", mutate: func(event *ThalwegEvent) { event.PropagatedAt = "bad" }, want: "propagatedAt must be"},
		{name: "payload", mutate: func(event *ThalwegEvent) { event.Payload = json.RawMessage(`{`) }, want: "payload must be"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := newTestDaemon(t)
			event := base
			tt.mutate(&event)
			if _, _, err := d.ingestReplicated(event); err == nil || !strings.Contains(err.Error(), tt.want) {
				t.Fatalf("error = %v, want substring %q", err, tt.want)
			}
		})
	}
}

func TestIngestReplicatedDoesNotPartiallyWriteWhenHLCMergeFails(t *testing.T) {
	d := newTestDaemon(t)
	d.hlc.state = hlcTimestamp{
		Physical: "2026-01-01T11:00:00.000000000Z",
		Logical:  math.MaxUint64,
	}
	if err := d.store.Update(func(txn *badger.Txn) error {
		return setHLCState(txn, d.hlc.state)
	}); err != nil {
		t.Fatalf("persist initial HLC: %v", err)
	}
	d.now = fixedTime("2026-01-01T10:00:00Z")
	incoming := replicatedTestEvent()
	incoming.Counter = math.MaxUint64

	if _, _, err := d.ingestReplicated(incoming); err == nil {
		t.Fatal("expected HLC overflow")
	}
	events, err := d.query(incoming.Network, nil, "", "", 0)
	if err != nil {
		t.Fatalf("query after failed merge: %v", err)
	}
	if len(events) != 0 {
		t.Fatalf("failed merge partially stored %d events", len(events))
	}
	if d.hlc.state.Logical != math.MaxUint64 {
		t.Fatal("failed merge changed in-memory HLC")
	}
	persisted, err := loadHLC(d.store)
	if err != nil {
		t.Fatalf("reload HLC after failed merge: %v", err)
	}
	if persisted.state != d.hlc.state {
		t.Fatalf("failed merge changed persistent HLC to %#v", persisted.state)
	}
	if err := d.store.View(func(txn *badger.Txn) error {
		indexed, err := findEventByID(txn, incoming.Network, incoming.ID)
		if err != nil {
			return err
		}
		if indexed != nil {
			return errors.New("failed merge partially stored an event ID index")
		}
		return nil
	}); err != nil {
		t.Fatalf("ID lookup after failed merge: %v", err)
	}
}

func TestIngestReplicatedPersistsEventIndexAndMergedHLC(t *testing.T) {
	dbPath := t.TempDir()
	open := func() (*Daemon, error) {
		db, err := badger.Open(badger.DefaultOptions(dbPath).WithLogger(nil))
		if err != nil {
			return nil, err
		}
		if err := ensureStorageSchema(db); err != nil {
			_ = db.Close()
			return nil, err
		}
		clock, err := loadHLC(db)
		if err != nil {
			_ = db.Close()
			return nil, err
		}
		return &Daemon{
			store:         db,
			deviceID:      "local-device",
			hlc:           clock,
			now:           fixedTime("2026-01-01T10:00:00Z"),
			subscriptions: make(map[string]*subscription),
		}, nil
	}

	first, err := open()
	if err != nil {
		t.Fatalf("open first daemon: %v", err)
	}
	incoming := replicatedTestEvent()
	if _, created, err := first.ingestReplicated(incoming); err != nil || !created {
		t.Fatalf("ingest replicated = (created %t, %v)", created, err)
	}
	wantState := first.hlc.state
	if err := first.store.Close(); err != nil {
		t.Fatalf("close first store: %v", err)
	}

	restarted, err := open()
	if err != nil {
		t.Fatalf("open restarted daemon: %v", err)
	}
	defer restarted.store.Close()
	if restarted.hlc.state != wantState {
		t.Fatalf("restarted HLC = %#v, want %#v", restarted.hlc.state, wantState)
	}
	stored, created, err := restarted.ingestReplicated(incoming)
	if err != nil {
		t.Fatalf("retry after restart: %v", err)
	}
	if created || stored.ID != incoming.ID {
		t.Fatalf("retry after restart = (%#v, created %t)", stored, created)
	}
}

func replicatedTestEvent() ThalwegEvent {
	return ThalwegEvent{
		ID:           "remote-event",
		Network:      "test",
		Stream:       "remote:error",
		OccurredAt:   "2026-01-01T00:00:00Z",
		InsertedAt:   "2026-01-01T11:00:00Z",
		PropagatedAt: "2026-01-01T11:00:01Z",
		Counter:      4,
		DeviceID:     "remote-device",
		Payload:      json.RawMessage(`{"value":"same","nested":{"b":2,"a":1}}`),
	}
}

func fixedTime(value string) func() time.Time {
	parsed := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	if candidate, err := time.Parse(time.RFC3339Nano, value); err == nil {
		parsed = candidate
	}
	return func() time.Time { return parsed }
}
