package daemon

import (
	"encoding/json"
	"path/filepath"
	"testing"
	"time"
)

func TestDurableSiphonReplaysAcknowledgesAndSkipsOtherStreams(t *testing.T) {
	d := newDurableTestDaemon(t, t.TempDir())
	defer d.Close()
	if _, err := d.createDurableSiphon("home", "notes", []string{"user:note"}, "earliest"); err != nil {
		t.Fatalf("create durable siphon: %v", err)
	}
	first := ingestDurableTestEvent(t, d, "user:note", "first", "2026-08-03T12:00:01Z")
	_ = ingestDurableTestEvent(t, d, "system:ignored", "ignored", "2026-08-03T12:00:02Z")
	second := ingestDurableTestEvent(t, d, "user:note", "second", "2026-08-03T12:00:03Z")

	delivery, err := d.pollDurableSiphon("home", "notes", 1)
	if err != nil {
		t.Fatalf("poll first: %v", err)
	}
	if delivery.DeliveryID == "" || delivery.Attempt != 1 || delivery.CursorFrom != 0 || delivery.CursorThrough != 1 || len(delivery.Events) != 1 || delivery.Events[0].ID != first.ID {
		t.Fatalf("first delivery = %#v", delivery)
	}
	retry, err := d.pollDurableSiphon("home", "notes", 100)
	if err != nil {
		t.Fatalf("retry first: %v", err)
	}
	if retry.DeliveryID != delivery.DeliveryID || retry.Attempt != 2 || len(retry.Events) != 1 || retry.Events[0].ID != first.ID {
		t.Fatalf("retried delivery = %#v", retry)
	}
	info, err := d.acknowledgeDurableSiphon("home", "notes", delivery.DeliveryID)
	if err != nil {
		t.Fatalf("ack first: %v", err)
	}
	if info.Cursor != 1 || info.PendingDeliveryID != "" {
		t.Fatalf("info after first ack = %#v", info)
	}

	delivery, err = d.pollDurableSiphon("home", "notes", 10)
	if err != nil {
		t.Fatalf("poll second: %v", err)
	}
	if delivery.CursorFrom != 1 || delivery.CursorThrough != 3 || len(delivery.Events) != 1 || delivery.Events[0].ID != second.ID {
		t.Fatalf("second delivery = %#v", delivery)
	}
	if _, err := d.acknowledgeDurableSiphon("home", "notes", delivery.DeliveryID); err != nil {
		t.Fatalf("ack second: %v", err)
	}
	empty, err := d.pollDurableSiphon("home", "notes", 10)
	if err != nil {
		t.Fatalf("poll empty: %v", err)
	}
	if empty.DeliveryID != "" || len(empty.Events) != 0 || empty.CursorFrom != 3 || empty.CursorThrough != 3 {
		t.Fatalf("empty delivery = %#v", empty)
	}
}

func TestDurableSiphonPendingDeliverySurvivesRestart(t *testing.T) {
	root := t.TempDir()
	d := newDurableTestDaemon(t, root)
	if _, err := d.createDurableSiphon("home", "archive", nil, "earliest"); err != nil {
		t.Fatalf("create durable siphon: %v", err)
	}
	event := ingestDurableTestEvent(t, d, "voice:transcript", "transcript", "2026-08-03T12:00:01Z")
	first, err := d.pollDurableSiphon("home", "archive", 10)
	if err != nil {
		t.Fatalf("poll before restart: %v", err)
	}
	if err := d.Close(); err != nil {
		t.Fatalf("close first daemon: %v", err)
	}

	restarted, err := New(filepath.Join(root, "restarted.sock"), filepath.Join(root, "badger"))
	if err != nil {
		t.Fatalf("restart daemon: %v", err)
	}
	defer restarted.Close()
	retry, err := restarted.pollDurableSiphon("home", "archive", 10)
	if err != nil {
		t.Fatalf("poll after restart: %v", err)
	}
	if retry.DeliveryID != first.DeliveryID || retry.Attempt != 2 || len(retry.Events) != 1 || retry.Events[0].ID != event.ID {
		t.Fatalf("restarted delivery = %#v, first %#v", retry, first)
	}
	if _, err := restarted.acknowledgeDurableSiphon("home", "archive", retry.DeliveryID); err != nil {
		t.Fatalf("ack restarted delivery: %v", err)
	}
}

func TestDurableSiphonLatestStartsAfterExistingEventsAndSeesLateHistory(t *testing.T) {
	d := newDurableTestDaemon(t, t.TempDir())
	defer d.Close()
	_ = ingestDurableTestEvent(t, d, "user:note", "old", "2026-08-03T12:00:02Z")
	info, err := d.createDurableSiphon("home", "future", nil, "latest")
	if err != nil {
		t.Fatalf("create latest siphon: %v", err)
	}
	if info.Cursor != 1 {
		t.Fatalf("latest cursor = %d, want 1", info.Cursor)
	}
	if delivery, err := d.pollDurableSiphon("home", "future", 10); err != nil || len(delivery.Events) != 0 {
		t.Fatalf("existing event leaked into latest delivery: %#v, %v", delivery, err)
	}

	late := ThalwegEvent{
		ID: "late-remote", Network: "home", Stream: "user:note",
		OccurredAt: "2026-08-03T11:00:00Z", InsertedAt: "2026-08-03T11:00:01Z",
		PropagatedAt: "2026-08-03T11:00:01Z", DeviceID: "remote-device",
		Payload: json.RawMessage(`{"message":"late history"}`),
	}
	if _, created, err := d.ingestReplicated(late); err != nil || !created {
		t.Fatalf("ingest late replicated event: created=%v err=%v", created, err)
	}
	delivery, err := d.pollDurableSiphon("home", "future", 10)
	if err != nil {
		t.Fatalf("poll late event: %v", err)
	}
	if len(delivery.Events) != 1 || delivery.Events[0].ID != late.ID || delivery.CursorFrom != 1 || delivery.CursorThrough != 2 {
		t.Fatalf("late delivery = %#v", delivery)
	}
}

func TestDurableSiphonRejectsMismatchedAcknowledgement(t *testing.T) {
	d := newDurableTestDaemon(t, t.TempDir())
	defer d.Close()
	if _, err := d.createDurableSiphon("home", "worker", nil, "earliest"); err != nil {
		t.Fatalf("create durable siphon: %v", err)
	}
	_ = ingestDurableTestEvent(t, d, "user:note", "one", "2026-08-03T12:00:00Z")
	if _, err := d.pollDurableSiphon("home", "worker", 10); err != nil {
		t.Fatalf("poll: %v", err)
	}
	if _, err := d.acknowledgeDurableSiphon("home", "worker", "wrong-delivery"); err == nil {
		t.Fatal("mismatched acknowledgement unexpectedly succeeded")
	}
	retry, err := d.pollDurableSiphon("home", "worker", 10)
	if err != nil || retry.Attempt != 2 || len(retry.Events) != 1 {
		t.Fatalf("pending delivery changed after bad ack: %#v, %v", retry, err)
	}
}

func TestDurableSiphonWaitWakesForNewMatchingEvent(t *testing.T) {
	d := newDurableTestDaemon(t, t.TempDir())
	defer d.Close()
	if _, err := d.createDurableSiphon("home", "reactive", []string{"user:note"}, "latest"); err != nil {
		t.Fatalf("create durable siphon: %v", err)
	}
	d.now = func() time.Time { return time.Date(2026, 8, 3, 12, 30, 0, 0, time.UTC) }
	result := make(chan DurableSiphonDelivery, 1)
	errs := make(chan error, 1)
	go func() {
		delivery, err := d.waitForDurableSiphon("home", "reactive", 10, time.Second)
		if err != nil {
			errs <- err
			return
		}
		result <- delivery
	}()
	time.Sleep(25 * time.Millisecond)
	event, err := d.ingest("home", "user:note", "2026-08-03T12:00:00Z", "wake", json.RawMessage(`{"ok":true}`))
	if err != nil {
		t.Fatalf("ingest wake event: %v", err)
	}
	select {
	case err := <-errs:
		t.Fatalf("wait failed: %v", err)
	case delivery := <-result:
		if delivery.DeliveryID == "" || len(delivery.Events) != 1 || delivery.Events[0].ID != event.ID {
			t.Fatalf("woken delivery = %#v", delivery)
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("durable wait did not wake for ingestion")
	}
}

func TestDurableSiphonWaitReturnsEmptyAtDeadline(t *testing.T) {
	d := newDurableTestDaemon(t, t.TempDir())
	defer d.Close()
	if _, err := d.createDurableSiphon("home", "quiet", nil, "latest"); err != nil {
		t.Fatalf("create durable siphon: %v", err)
	}
	started := time.Now()
	delivery, err := d.waitForDurableSiphon("home", "quiet", 10, 25*time.Millisecond)
	if err != nil {
		t.Fatalf("wait: %v", err)
	}
	if delivery.DeliveryID != "" || len(delivery.Events) != 0 || time.Since(started) < 20*time.Millisecond {
		t.Fatalf("deadline delivery = %#v after %s", delivery, time.Since(started))
	}
}

func newDurableTestDaemon(t *testing.T, root string) *Daemon {
	t.Helper()
	d, err := New(filepath.Join(root, "daemon.sock"), filepath.Join(root, "badger"))
	if err != nil {
		t.Fatalf("create daemon: %v", err)
	}
	if _, _, err := d.memberships.create("home"); err != nil {
		d.Close()
		t.Fatalf("create membership: %v", err)
	}
	return d
}

func ingestDurableTestEvent(t *testing.T, d *Daemon, stream, id, occurredAt string) ThalwegEvent {
	t.Helper()
	d.now = func() time.Time { return time.Date(2026, 8, 3, 12, 30, 0, 0, time.UTC) }
	event, err := d.ingest("home", stream, occurredAt, id, json.RawMessage(`{"ok":true}`))
	if err != nil {
		t.Fatalf("ingest %s: %v", id, err)
	}
	return event
}
