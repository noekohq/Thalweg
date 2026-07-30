package daemon

import (
	"encoding/json"
	"sync"
	"testing"
	"time"

	"github.com/dgraph-io/badger/v4"
)

func TestIngestAndQueryChronologicalOrder(t *testing.T) {
	d := newTestDaemon(t)

	_, err := d.ingest("test", "user:note", "2026-01-01T00:10:00Z", "later", json.RawMessage(`{"content":"later"}`))
	if err != nil {
		t.Fatalf("ingest later: %v", err)
	}
	_, err = d.ingest("test", "system:app_activity", "2026-01-01T00:01:00Z", "earlier", json.RawMessage(`{"appName":"Cursor"}`))
	if err != nil {
		t.Fatalf("ingest earlier: %v", err)
	}

	events, err := d.query("test", []string{"user:note", "system:app_activity"}, "", "", 0)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(events) != 2 {
		t.Fatalf("expected 2 events, got %d", len(events))
	}
	if events[0].ID != "earlier" || events[1].ID != "later" {
		t.Fatalf("events not chronological: %s, %s", events[0].ID, events[1].ID)
	}
}

func TestEmptyQuerySerializesAsArray(t *testing.T) {
	d := newTestDaemon(t)
	events, err := d.query("empty", nil, "", "", 0)
	if err != nil {
		t.Fatalf("query empty network: %v", err)
	}
	encoded, err := json.Marshal(events)
	if err != nil {
		t.Fatalf("encode empty query: %v", err)
	}
	if string(encoded) != "[]" {
		t.Fatalf("empty query JSON = %s, want []", encoded)
	}
}

func TestQueryFiltersByRangeAndStream(t *testing.T) {
	d := newTestDaemon(t)

	_, err := d.ingest("test", "user:note", "2026-01-01T00:01:00Z", "note-1", json.RawMessage(`{"content":"one"}`))
	if err != nil {
		t.Fatalf("ingest note: %v", err)
	}
	_, err = d.ingest("test", "system:app_activity", "2026-01-01T00:02:00Z", "activity-1", json.RawMessage(`{"appName":"Cursor"}`))
	if err != nil {
		t.Fatalf("ingest activity: %v", err)
	}

	events, err := d.query("test", []string{"user:note"}, "2026-01-01T00:00:30Z", "2026-01-01T00:01:30Z", 0)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(events) != 1 {
		t.Fatalf("expected 1 event, got %d", len(events))
	}
	if events[0].Stream != "user:note" {
		t.Fatalf("expected user:note, got %s", events[0].Stream)
	}
}

func TestIngestRejectsInvalidOccurredAt(t *testing.T) {
	d := newTestDaemon(t)

	_, err := d.ingest("test", "user:note", "not-a-time", "bad", json.RawMessage(`{}`))
	if err == nil {
		t.Fatal("expected invalid occurredAt error")
	}
}

func TestIngestNormalizesOccurredAtToUTC(t *testing.T) {
	d := newTestDaemon(t)

	event, err := d.ingest(
		"test",
		"user:note",
		"2026-01-01T01:30:00.123400-05:00",
		"normalized",
		json.RawMessage(`{}`),
	)
	if err != nil {
		t.Fatalf("ingest: %v", err)
	}
	if event.OccurredAt != "2026-01-01T06:30:00.123400000Z" {
		t.Fatalf("occurredAt = %q, want canonical UTC", event.OccurredAt)
	}
}

func TestQueryNormalizesBoundsAndStoredTimestamps(t *testing.T) {
	d := newTestDaemon(t)

	event := ThalwegEvent{
		ID:         "legacy-offset",
		Network:    "test",
		Stream:     "user:note",
		OccurredAt: "2026-01-01T01:30:00-05:00",
		DeviceID:   "test-device",
		Payload:    json.RawMessage(`{}`),
	}
	value, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("marshal legacy event: %v", err)
	}
	if err := d.store.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(eventKey(event)), value)
	}); err != nil {
		t.Fatalf("store legacy event: %v", err)
	}

	events, err := d.query(
		"test",
		[]string{"user:note"},
		"2026-01-01T06:29:59.999Z",
		"2026-01-01T07:30:00+01:00",
		0,
	)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(events) != 1 {
		t.Fatalf("expected one event, got %d", len(events))
	}
	if events[0].OccurredAt != "2026-01-01T06:30:00.000000000Z" {
		t.Fatalf("returned occurredAt = %q, want canonical UTC", events[0].OccurredAt)
	}
}

func TestQueryOrdersFractionalSecondsChronologically(t *testing.T) {
	d := newTestDaemon(t)

	_, err := d.ingest("test", "user:note", "2026-01-01T00:00:00.9Z", "later-fraction", json.RawMessage(`{}`))
	if err != nil {
		t.Fatalf("ingest later fraction: %v", err)
	}
	_, err = d.ingest("test", "user:note", "2026-01-01T00:00:00.1Z", "earlier-fraction", json.RawMessage(`{}`))
	if err != nil {
		t.Fatalf("ingest earlier fraction: %v", err)
	}

	events, err := d.query("test", []string{"user:note"}, "", "", 0)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(events) != 2 {
		t.Fatalf("expected two events, got %d", len(events))
	}
	if events[0].ID != "earlier-fraction" || events[1].ID != "later-fraction" {
		t.Fatalf("fractional events not chronological: %s, %s", events[0].ID, events[1].ID)
	}
}

func TestIngestReturnsExistingEventForIdempotentRetry(t *testing.T) {
	d := newTestDaemon(t)

	first, err := d.ingest(
		"test",
		"user:note",
		"2026-01-01T01:30:00-05:00",
		"stable-id",
		json.RawMessage(`{"content":"same","nested":{"b":2,"a":1}}`),
	)
	if err != nil {
		t.Fatalf("first ingest: %v", err)
	}
	retry, err := d.ingest(
		"test",
		"user:note",
		"2026-01-01T06:30:00.000Z",
		"stable-id",
		json.RawMessage(`{ "nested": { "a": 1, "b": 2 }, "content": "same" }`),
	)
	if err != nil {
		t.Fatalf("retry ingest: %v", err)
	}
	if retry.InsertedAt != first.InsertedAt || retry.Counter != first.Counter || retry.DeviceID != first.DeviceID {
		t.Fatalf("retry returned a different stored event: first=%#v retry=%#v", first, retry)
	}

	events, err := d.query("test", nil, "", "", 0)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(events) != 1 {
		t.Fatalf("expected one stored event after retry, got %d", len(events))
	}
}

func TestIngestRetryMayOmitDaemonAssignedOccurredAt(t *testing.T) {
	d := newTestDaemon(t)

	first, err := d.ingest("test", "user:note", "", "daemon-time", json.RawMessage(`{"content":"same"}`))
	if err != nil {
		t.Fatalf("first ingest: %v", err)
	}
	retry, err := d.ingest("test", "user:note", "", "daemon-time", json.RawMessage(`{"content":"same"}`))
	if err != nil {
		t.Fatalf("retry ingest: %v", err)
	}
	if retry.OccurredAt != first.OccurredAt || retry.InsertedAt != first.InsertedAt {
		t.Fatalf("retry did not return the original daemon timestamps")
	}
}

func TestIngestRejectsConflictingEventID(t *testing.T) {
	tests := []struct {
		name       string
		stream     string
		occurredAt string
		payload    json.RawMessage
	}{
		{name: "stream", stream: "other:stream", occurredAt: "2026-01-01T00:00:00Z", payload: json.RawMessage(`{"value":1}`)},
		{name: "occurredAt", stream: "user:note", occurredAt: "2026-01-01T00:00:01Z", payload: json.RawMessage(`{"value":1}`)},
		{name: "payload", stream: "user:note", occurredAt: "2026-01-01T00:00:00Z", payload: json.RawMessage(`{"value":2}`)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := newTestDaemon(t)
			_, err := d.ingest(
				"test",
				"user:note",
				"2026-01-01T00:00:00Z",
				"conflict",
				json.RawMessage(`{"value":1}`),
			)
			if err != nil {
				t.Fatalf("first ingest: %v", err)
			}

			if _, err := d.ingest("test", tt.stream, tt.occurredAt, "conflict", tt.payload); err == nil {
				t.Fatal("expected event ID conflict")
			}
			events, err := d.query("test", nil, "", "", 0)
			if err != nil {
				t.Fatalf("query: %v", err)
			}
			if len(events) != 1 {
				t.Fatalf("conflict changed stored history: got %d events", len(events))
			}
		})
	}
}

func TestConcurrentIdempotentIngestStoresOneEvent(t *testing.T) {
	d := newTestDaemon(t)

	const workers = 16
	var wg sync.WaitGroup
	errors := make(chan error, workers)
	for range workers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := d.ingest(
				"test",
				"user:note",
				"2026-01-01T00:00:00Z",
				"concurrent",
				json.RawMessage(`{"value":1}`),
			)
			errors <- err
		}()
	}
	wg.Wait()
	close(errors)
	for err := range errors {
		if err != nil {
			t.Fatalf("concurrent ingest: %v", err)
		}
	}

	events, err := d.query("test", nil, "", "", 0)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(events) != 1 {
		t.Fatalf("expected one stored event, got %d", len(events))
	}
}

func TestIngestRejectsCorruptEventIDIndex(t *testing.T) {
	d := newTestDaemon(t)

	event, err := d.ingest(
		"test",
		"user:note",
		"2026-01-01T00:00:00Z",
		"corrupt-index",
		json.RawMessage(`{}`),
	)
	if err != nil {
		t.Fatalf("ingest: %v", err)
	}
	if err := d.store.Update(func(txn *badger.Txn) error {
		return txn.Delete([]byte(eventKey(event)))
	}); err != nil {
		t.Fatalf("delete indexed event: %v", err)
	}

	if _, err := d.ingest(
		"test",
		"user:note",
		"2026-01-01T00:00:00Z",
		"corrupt-index",
		json.RawMessage(`{}`),
	); err == nil {
		t.Fatal("expected corrupt event ID index error")
	}
}

func TestKeyEncodingSeparatesColonFromEscapedText(t *testing.T) {
	d := newTestDaemon(t)

	for _, id := range []string{"event:one", "event%3Aone"} {
		if _, err := d.ingest(
			"network:one",
			"stream:one",
			"2026-01-01T00:00:00Z",
			id,
			json.RawMessage(`{}`),
		); err != nil {
			t.Fatalf("ingest %q: %v", id, err)
		}
	}
	events, err := d.query("network:one", []string{"stream:one"}, "", "", 0)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(events) != 2 {
		t.Fatalf("expected two distinct events, got %d", len(events))
	}
}

func newTestDaemon(t *testing.T) *Daemon {
	t.Helper()

	db, err := badger.Open(badger.DefaultOptions(t.TempDir()).WithLogger(nil))
	if err != nil {
		t.Fatalf("open badger: %v", err)
	}
	d := &Daemon{
		store:         db,
		deviceID:      "test-device",
		hlc:           &hybridLogicalClock{},
		now:           time.Now,
		subscriptions: make(map[string]*subscription),
	}
	t.Cleanup(func() {
		_ = d.store.Close()
	})
	return d
}
