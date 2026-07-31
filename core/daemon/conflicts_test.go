package daemon

import (
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"
)

func TestConflictResolutionSurvivesRestart(t *testing.T) {
	root := t.TempDir()
	socketPath := filepath.Join(root, "thalweg.sock")
	dbPath := filepath.Join(root, "badger")
	first, err := New(socketPath, dbPath)
	if err != nil {
		t.Fatalf("create first daemon: %v", err)
	}
	if _, _, err := first.memberships.create("home"); err != nil {
		t.Fatalf("create membership: %v", err)
	}
	event, err := first.ingest("home", "notes", "", "collision", json.RawMessage(`{"owner":"first"}`))
	if err != nil {
		t.Fatalf("ingest conflict: %v", err)
	}
	localDigest, err := eventDigest(event)
	if err != nil {
		t.Fatalf("digest conflict: %v", err)
	}
	if err := first.recordEventConflicts("home", []conflictObservation{{
		EventID:      "collision",
		LocalDigest:  localDigest,
		RemoteDigest: strings.Repeat("A", 43),
	}}); err != nil {
		t.Fatalf("record conflict: %v", err)
	}
	resolution, err := first.resolveEventConflict("home", "collision", conflictResolutionStrategy)
	if err != nil {
		t.Fatalf("resolve conflict: %v", err)
	}
	if err := first.Close(); err != nil {
		t.Fatalf("close first daemon: %v", err)
	}

	second, err := New(socketPath, dbPath)
	if err != nil {
		t.Fatalf("reopen daemon: %v", err)
	}
	t.Cleanup(func() { _ = second.Close() })
	events, err := second.query("home", nil, "", "", 0)
	if err != nil {
		t.Fatalf("query reopened history: %v", err)
	}
	seenRecovered := false
	for _, stored := range events {
		if stored.ID == "collision" {
			t.Fatal("superseded conflict became visible after restart")
		}
		if stored.ID == resolution.RecoveredEvent.ID {
			seenRecovered = true
		}
	}
	if !seenRecovered {
		t.Fatal("recovered conflict variant is missing after restart")
	}
	conflicts, err := second.listEventConflicts("home")
	if err != nil {
		t.Fatalf("list reopened conflicts: %v", err)
	}
	if len(conflicts) != 1 || !conflicts[0].Resolved {
		t.Fatalf("reopened conflict state = %#v", conflicts)
	}
}

func TestPublicIngestRejectsReservedConflictResolutionStream(t *testing.T) {
	d := newTestDaemon(t)
	if _, err := d.ingest("test", conflictResolutionStream, "", "", json.RawMessage(`{}`)); err == nil ||
		!strings.Contains(err.Error(), "reserved") {
		t.Fatalf("reserved stream error = %v", err)
	}
}

func TestReplicatedConflictResolutionRequiresValidPayload(t *testing.T) {
	d := newTestDaemon(t)
	incoming := replicatedTestEvent()
	incoming.Stream = conflictResolutionStream
	incoming.Payload = json.RawMessage(`{"version":1,"eventId":"collision","strategy":"discard"}`)
	if _, _, err := d.ingestReplicated(incoming); err == nil || !strings.Contains(err.Error(), "invalid conflict resolution") {
		t.Fatalf("invalid replicated resolution error = %v", err)
	}
	assertEventCount(t, d, incoming.Network, 0)
}
