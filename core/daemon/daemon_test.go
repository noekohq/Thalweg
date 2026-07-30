package daemon

import (
	"encoding/json"
	"testing"

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

func newTestDaemon(t *testing.T) *Daemon {
	t.Helper()

	db, err := badger.Open(badger.DefaultOptions(t.TempDir()).WithLogger(nil))
	if err != nil {
		t.Fatalf("open badger: %v", err)
	}
	d := &Daemon{
		store:         db,
		deviceID:      "test-device",
		subscriptions: make(map[string]*subscription),
	}
	t.Cleanup(func() {
		_ = d.store.Close()
	})
	return d
}
