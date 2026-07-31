package daemon

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestSynchronizePeerConvergesBidirectionallyAcrossMultiplePages(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	mountSharedNetwork(t, first, second, "home")

	for index := range 70 {
		if _, err := first.ingest(
			"home",
			"notes",
			fmt.Sprintf("2026-01-01T00:%02d:%02dZ", index/60, index%60),
			fmt.Sprintf("first-%03d", index),
			json.RawMessage(fmt.Sprintf(`{"owner":"first","index":%d}`, index)),
		); err != nil {
			t.Fatalf("ingest first event %d: %v", index, err)
		}
	}
	for index := range 75 {
		if _, err := second.ingest(
			"home",
			"errors",
			fmt.Sprintf("2026-01-02T00:%02d:%02dZ", index/60, index%60),
			fmt.Sprintf("second-%03d", index),
			json.RawMessage(fmt.Sprintf(`{"owner":"second","index":%d}`, index)),
		); err != nil {
			t.Fatalf("ingest second event %d: %v", index, err)
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	result, err := first.synchronizePeer(ctx, second.p2p.ID(), "home")
	if err != nil {
		t.Fatalf("synchronize peers: %v", err)
	}
	if result.Pushed != 70 || result.Pulled != 75 {
		t.Fatalf("sync result = %#v, want 70 pushed and 75 pulled", result)
	}
	assertEventCount(t, first, "home", 145)
	assertEventCount(t, second, "home", 145)

	retry, err := first.synchronizePeer(ctx, second.p2p.ID(), "home")
	if err != nil {
		t.Fatalf("repeat synchronization: %v", err)
	}
	if retry.Pushed != 0 || retry.Pulled != 0 || retry.Duplicates != 0 {
		t.Fatalf("repeat synchronization transferred events: %#v", retry)
	}
}

func TestSynchronizePeerHandlesTwoEmptyHistories(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	mountSharedNetwork(t, first, second, "home")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	result, err := first.synchronizePeer(ctx, second.p2p.ID(), "home")
	if err != nil {
		t.Fatalf("synchronize empty histories: %v", err)
	}
	if result.Inventoried != 0 || result.Pushed != 0 || result.Pulled != 0 {
		t.Fatalf("empty synchronization result = %#v", result)
	}
}

func TestSynchronizePeerNeverCrossesAuthenticatedNetwork(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	mountSharedNetwork(t, first, second, "home")
	mountSharedNetwork(t, first, second, "work")

	if _, err := first.ingest("home", "notes", "", "home-event", json.RawMessage(`{"scope":"home"}`)); err != nil {
		t.Fatalf("ingest home event: %v", err)
	}
	if _, err := first.ingest("work", "errors", "", "work-event", json.RawMessage(`{"scope":"work"}`)); err != nil {
		t.Fatalf("ingest work event: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	if _, err := first.synchronizePeer(ctx, second.p2p.ID(), "home"); err != nil {
		t.Fatalf("synchronize home: %v", err)
	}
	assertEventCount(t, second, "home", 1)
	assertEventCount(t, second, "work", 0)

	if _, err := first.synchronizePeer(ctx, second.p2p.ID(), "work"); err != nil {
		t.Fatalf("synchronize work: %v", err)
	}
	assertEventCount(t, second, "work", 1)
}

func TestSynchronizePeerQuarantinesSameIDConflictAndConvergesOtherEvents(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	mountSharedNetwork(t, first, second, "home")

	if _, err := first.ingest("home", "notes", "", "collision", json.RawMessage(`{"owner":"first"}`)); err != nil {
		t.Fatalf("ingest first collision: %v", err)
	}
	if _, err := second.ingest("home", "notes", "", "collision", json.RawMessage(`{"owner":"second"}`)); err != nil {
		t.Fatalf("ingest second collision: %v", err)
	}
	if _, err := first.ingest("home", "notes", "", "first-only", json.RawMessage(`{"owner":"first-only"}`)); err != nil {
		t.Fatalf("ingest first-only event: %v", err)
	}
	if _, err := second.ingest("home", "notes", "", "second-only", json.RawMessage(`{"owner":"second-only"}`)); err != nil {
		t.Fatalf("ingest second-only event: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	result, err := first.synchronizePeer(ctx, second.p2p.ID(), "home")
	if err != nil {
		t.Fatalf("synchronize around conflict: %v", err)
	}
	if len(result.Conflicts) != 1 || result.Conflicts[0] != "collision" {
		t.Fatalf("sync conflicts = %v, want [collision]", result.Conflicts)
	}
	if result.Pushed != 1 || result.Pulled != 1 {
		t.Fatalf("sync result = %#v, want one non-conflicting event each way", result)
	}
	assertEventCount(t, first, "home", 3)
	assertEventCount(t, second, "home", 3)
	assertEventPayloadOwner(t, first, "home", "first")
	assertEventPayloadOwner(t, second, "home", "second")

	firstConflicts, err := first.listEventConflicts("home")
	if err != nil {
		t.Fatalf("list first conflicts: %v", err)
	}
	secondConflicts, err := second.listEventConflicts("home")
	if err != nil {
		t.Fatalf("list second conflicts: %v", err)
	}
	if len(firstConflicts) != 1 || firstConflicts[0].EventID != "collision" || firstConflicts[0].Resolved {
		t.Fatalf("first conflict list = %#v", firstConflicts)
	}
	if len(secondConflicts) != 1 || secondConflicts[0].EventID != "collision" || secondConflicts[0].Resolved {
		t.Fatalf("second conflict list = %#v", secondConflicts)
	}

	resolution, err := first.resolveEventConflict("home", "collision", conflictResolutionStrategy)
	if err != nil {
		t.Fatalf("resolve conflict: %v", err)
	}
	if resolution.AlreadyResolved || resolution.RecoveredEvent.ID == "collision" {
		t.Fatalf("resolution result = %#v", resolution)
	}
	repeatedResolution, err := first.resolveEventConflict("home", "collision", conflictResolutionStrategy)
	if err != nil {
		t.Fatalf("repeat conflict resolution: %v", err)
	}
	if !repeatedResolution.AlreadyResolved || repeatedResolution.RecoveredEvent.ID != resolution.RecoveredEvent.ID ||
		repeatedResolution.ResolutionEvent.ID != resolution.ResolutionEvent.ID {
		t.Fatalf("repeated resolution result = %#v", repeatedResolution)
	}
	resolvedSync, err := first.synchronizePeer(ctx, second.p2p.ID(), "home")
	if err != nil {
		t.Fatalf("synchronize resolution: %v", err)
	}
	if len(resolvedSync.Conflicts) != 0 || resolvedSync.Pushed != 2 || resolvedSync.Pulled != 1 {
		t.Fatalf("resolved sync result = %#v, want 2 pushed and 1 pulled", resolvedSync)
	}
	assertMatchingVisibleHistories(t, first, second, "home")
	assertEventIDAbsent(t, first, "home", "collision")
	assertEventIDAbsent(t, second, "home", "collision")

	resolvedConflicts, err := second.listEventConflicts("home")
	if err != nil {
		t.Fatalf("list resolved conflicts: %v", err)
	}
	if len(resolvedConflicts) != 1 || !resolvedConflicts[0].Resolved || resolvedConflicts[0].RecoveredEventID == "" {
		t.Fatalf("resolved conflict list = %#v", resolvedConflicts)
	}
	converged, err := first.synchronizePeer(ctx, second.p2p.ID(), "home")
	if err != nil {
		t.Fatalf("repeat resolved synchronization: %v", err)
	}
	if len(converged.Conflicts) != 0 || converged.Pushed != 0 || converged.Pulled != 0 {
		t.Fatalf("resolved histories did not remain converged: %#v", converged)
	}
}

func TestResolveEventConflictRejectsUnobservedEvent(t *testing.T) {
	d := newTestDaemon(t)
	if _, err := d.ingest("test", "notes", "", "ordinary", json.RawMessage(`{"value":1}`)); err != nil {
		t.Fatalf("ingest ordinary event: %v", err)
	}
	if _, err := d.resolveEventConflict("test", "ordinary", conflictResolutionStrategy); err == nil ||
		!strings.Contains(err.Error(), "no observed conflict") {
		t.Fatalf("unobserved resolution error = %v", err)
	}
}

func TestSynchronizePeerResumesAfterPartialDelivery(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	membership := mountSharedNetwork(t, first, second, "home")
	for index := range 70 {
		if _, err := first.ingest(
			"home",
			"notes",
			"",
			fmt.Sprintf("resume-%03d", index),
			json.RawMessage(fmt.Sprintf(`{"index":%d}`, index)),
		); err != nil {
			t.Fatalf("ingest event %d: %v", index, err)
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	stream, reader, _, err := first.openAuthenticatedMeshStream(ctx, second.p2p.ID(), "home")
	if err != nil {
		t.Fatalf("open authenticated stream: %v", err)
	}
	entries, _, _, err := first.inventoryPage("home", "", syncPageSize)
	if err != nil {
		t.Fatalf("build first inventory page: %v", err)
	}
	if err := writeSyncFrame(stream, inventoryOffer{
		Type:            "inventory_offer",
		ProtocolVersion: syncProtocolVersion,
		NetworkID:       membership.ID,
		Entries:         entries,
	}); err != nil {
		t.Fatalf("send partial inventory: %v", err)
	}
	var need inventoryNeed
	if err := readSyncResponse(reader, membership.ID, "inventory_need", &need); err != nil {
		t.Fatalf("read partial need: %v", err)
	}
	partialIDs := need.IDs[:10]
	events, err := first.eventsByIDs("home", partialIDs)
	if err != nil {
		t.Fatalf("load partial events: %v", err)
	}
	if err := writeSyncFrame(stream, eventsPush{
		Type:            "events_push",
		ProtocolVersion: syncProtocolVersion,
		NetworkID:       membership.ID,
		Events:          events,
	}); err != nil {
		t.Fatalf("push partial events: %v", err)
	}
	var ack eventsAck
	if err := readSyncResponse(reader, membership.ID, "events_ack", &ack); err != nil {
		t.Fatalf("read partial ack: %v", err)
	}
	if ack.Created != 10 {
		t.Fatalf("partial ack = %#v", ack)
	}
	if err := stream.Close(); err != nil {
		t.Fatalf("interrupt sync stream: %v", err)
	}
	assertEventCount(t, second, "home", 10)

	result, err := first.synchronizePeer(ctx, second.p2p.ID(), "home")
	if err != nil {
		t.Fatalf("resume synchronization: %v", err)
	}
	if result.Pushed != 60 {
		t.Fatalf("resume result = %#v, want 60 remaining pushes", result)
	}
	assertEventCount(t, second, "home", 70)
}

func TestAuthenticatedSyncStreamRejectsCrossNetworkEventFrame(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	membership := mountSharedNetwork(t, first, second, "home")
	workEvent, err := first.ingest(
		"work",
		"errors",
		"",
		"cross-network",
		json.RawMessage(`{"scope":"work"}`),
	)
	if err != nil {
		t.Fatalf("ingest work event: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	stream, reader, _, err := first.openAuthenticatedMeshStream(ctx, second.p2p.ID(), "home")
	if err != nil {
		t.Fatalf("open authenticated stream: %v", err)
	}
	defer stream.Close()
	if err := writeSyncFrame(stream, eventsPush{
		Type:            "events_push",
		ProtocolVersion: syncProtocolVersion,
		NetworkID:       membership.ID,
		Events:          []ThalwegEvent{workEvent},
	}); err != nil {
		t.Fatalf("send cross-network event: %v", err)
	}
	var ack eventsAck
	if err := readSyncResponse(reader, membership.ID, "events_ack", &ack); err == nil ||
		!strings.Contains(err.Error(), "cross-network") {
		t.Fatalf("cross-network response error = %v", err)
	}
	assertEventCount(t, second, "work", 0)
}

func TestSynchronizePeerHandlesSimultaneousBidirectionalSessions(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	mountSharedNetwork(t, first, second, "home")
	for index := range 10 {
		if _, err := first.ingest(
			"home",
			"notes",
			"",
			fmt.Sprintf("simultaneous-first-%02d", index),
			json.RawMessage(fmt.Sprintf(`{"index":%d}`, index)),
		); err != nil {
			t.Fatalf("ingest first event: %v", err)
		}
		if _, err := second.ingest(
			"home",
			"notes",
			"",
			fmt.Sprintf("simultaneous-second-%02d", index),
			json.RawMessage(fmt.Sprintf(`{"index":%d}`, index)),
		); err != nil {
			t.Fatalf("ingest second event: %v", err)
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	var wait sync.WaitGroup
	errs := make(chan error, 2)
	for _, direction := range []struct {
		local  *Daemon
		remote *Daemon
	}{
		{local: first, remote: second},
		{local: second, remote: first},
	} {
		wait.Add(1)
		go func() {
			defer wait.Done()
			_, err := direction.local.synchronizePeer(
				ctx,
				direction.remote.p2p.ID(),
				"home",
			)
			errs <- err
		}()
	}
	wait.Wait()
	close(errs)
	for err := range errs {
		if err != nil {
			t.Fatalf("simultaneous synchronization: %v", err)
		}
	}
	assertEventCount(t, first, "home", 20)
	assertEventCount(t, second, "home", 20)
}

func TestSynchronizePeerRejectsOversizedEventPageWithoutPartialDelivery(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	mountSharedNetwork(t, first, second, "home")
	payload, err := json.Marshal(map[string]string{
		"value": strings.Repeat("x", syncMaxFrameBytes),
	})
	if err != nil {
		t.Fatalf("encode oversized payload: %v", err)
	}
	if _, err := first.ingest("home", "large", "", "oversized", payload); err != nil {
		t.Fatalf("ingest oversized local event: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	if _, err := first.synchronizePeer(ctx, second.p2p.ID(), "home"); err == nil ||
		!strings.Contains(err.Error(), "exceeds") {
		t.Fatalf("oversized synchronization error = %v", err)
	}
	assertEventCount(t, second, "home", 0)
}

func mountSharedNetwork(
	t *testing.T,
	first *Daemon,
	second *Daemon,
	name string,
) networkMembership {
	t.Helper()
	info, invitation, err := first.memberships.create(name)
	if err != nil {
		t.Fatalf("create network %q: %v", name, err)
	}
	if _, _, err := second.memberships.join(invitation); err != nil {
		t.Fatalf("join network %q: %v", name, err)
	}
	membership, exists := first.memberships.get(name)
	if !exists || membership.ID != info.ID {
		t.Fatalf("mounted network %q is missing", name)
	}
	return membership
}

func assertEventCount(t *testing.T, d *Daemon, networkName string, want int) {
	t.Helper()
	events, err := d.query(networkName, nil, "", "", 0)
	if err != nil {
		t.Fatalf("query %q: %v", networkName, err)
	}
	if len(events) != want {
		t.Fatalf("network %q event count = %d, want %d", networkName, len(events), want)
	}
}

func assertEventPayloadOwner(t *testing.T, d *Daemon, networkName string, want string) {
	t.Helper()
	events, err := d.query(networkName, nil, "", "", 0)
	if err != nil {
		t.Fatalf("query conflict: %v", err)
	}
	var conflict *ThalwegEvent
	for index := range events {
		if events[index].ID == "collision" {
			conflict = &events[index]
			break
		}
	}
	if conflict == nil {
		t.Fatal("conflict event is missing")
	}
	var payload struct {
		Owner string `json:"owner"`
	}
	if err := json.Unmarshal(conflict.Payload, &payload); err != nil {
		t.Fatalf("decode conflict payload: %v", err)
	}
	if payload.Owner != want {
		t.Fatalf("conflict payload owner = %q, want %q", payload.Owner, want)
	}
}

func assertMatchingVisibleHistories(t *testing.T, first, second *Daemon, networkName string) {
	t.Helper()
	firstEvents, err := first.query(networkName, nil, "", "", 0)
	if err != nil {
		t.Fatalf("query first history: %v", err)
	}
	secondEvents, err := second.query(networkName, nil, "", "", 0)
	if err != nil {
		t.Fatalf("query second history: %v", err)
	}
	if len(firstEvents) != len(secondEvents) {
		t.Fatalf("visible history lengths differ: %d != %d", len(firstEvents), len(secondEvents))
	}
	for index := range firstEvents {
		firstDigest, err := eventDigest(firstEvents[index])
		if err != nil {
			t.Fatalf("digest first event: %v", err)
		}
		secondDigest, err := eventDigest(secondEvents[index])
		if err != nil {
			t.Fatalf("digest second event: %v", err)
		}
		if firstEvents[index].ID != secondEvents[index].ID || firstDigest != secondDigest {
			t.Fatalf("histories differ at %d: %#v != %#v", index, firstEvents[index], secondEvents[index])
		}
	}
}

func assertEventIDAbsent(t *testing.T, d *Daemon, networkName, eventID string) {
	t.Helper()
	events, err := d.query(networkName, nil, "", "", 0)
	if err != nil {
		t.Fatalf("query visible history: %v", err)
	}
	for _, event := range events {
		if event.ID == eventID {
			t.Fatalf("superseded event %q remains visible", eventID)
		}
	}
}
