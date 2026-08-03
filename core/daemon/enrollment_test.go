package daemon

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"testing"
	"time"
)

func TestEnrollmentRequiresApprovalThenJoinsAndSyncs(t *testing.T) {
	first := newEnrollmentTestDaemon(t, "first")
	second := newEnrollmentTestDaemon(t, "second")
	membership, _, err := first.memberships.create("home")
	if err != nil {
		t.Fatalf("create home network: %v", err)
	}
	offer := enrollmentOffer{
		ID:        "offer-home",
		Network:   membership,
		ExpiresAt: time.Now().Add(time.Minute).UTC().Format(time.RFC3339Nano),
	}
	first.enrollmentOffers[offer.ID] = offer
	target := enrollmentTestAddress(t, first)

	result := make(chan error, 1)
	go func() {
		_, err := second.requestEnrollment(target, offer.ID, "Second Mac", true)
		result <- err
	}()

	request := waitForEnrollmentRequest(t, first)
	if request.info.Network != membership || request.info.DeviceName != "Second Mac" {
		t.Fatalf("pending request = %#v", request.info)
	}
	if _, err := first.decideEnrollment(
		json.RawMessage(fmt.Sprintf(`{"requestId":%q}`, request.info.ID)),
		true,
	); err != nil {
		t.Fatalf("approve enrollment: %v", err)
	}
	select {
	case err := <-result:
		if err != nil {
			t.Fatalf("approved enrollment failed: %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("approved enrollment did not complete")
	}
	joined, exists := second.memberships.get("home")
	if !exists || joined.info() != membership {
		t.Fatalf("second daemon membership = %#v, exists=%t", joined.info(), exists)
	}
	firstPeers, err := first.listMeshPeers("home")
	if err != nil || len(firstPeers) != 1 || firstPeers[0].PeerID != second.p2p.ID().String() {
		t.Fatalf("approver peers = %#v, %v", firstPeers, err)
	}
	secondPeers, err := second.listMeshPeers("home")
	if err != nil || len(secondPeers) != 1 || secondPeers[0].PeerID != first.p2p.ID().String() {
		t.Fatalf("joining peers = %#v, %v", secondPeers, err)
	}

	first.meshSyncDebounce = 10 * time.Millisecond
	first.backgroundWG.Add(1)
	go first.meshEventSyncLoop()
	if _, err := first.ingest("home", "system:test", "", "approver-event", json.RawMessage(`{"direction":"approver-to-joiner"}`)); err != nil {
		t.Fatalf("ingest approver event: %v", err)
	}
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		events, queryErr := second.query("home", []string{"system:test"}, "", "", 0)
		if queryErr == nil && len(events) == 1 && events[0].ID == "approver-event" {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("approver event did not synchronize to joining peer")
}

func TestEnrollmentDenialDoesNotMountMembership(t *testing.T) {
	first := newEnrollmentTestDaemon(t, "first")
	second := newEnrollmentTestDaemon(t, "second")
	membership, _, err := first.memberships.create("home")
	if err != nil {
		t.Fatalf("create home network: %v", err)
	}
	offer := enrollmentOffer{
		ID:        "offer-deny",
		Network:   membership,
		ExpiresAt: time.Now().Add(time.Minute).UTC().Format(time.RFC3339Nano),
	}
	first.enrollmentOffers[offer.ID] = offer

	result := make(chan error, 1)
	go func() {
		_, err := second.requestEnrollment(enrollmentTestAddress(t, first), offer.ID, "Denied Mac", false)
		result <- err
	}()
	request := waitForEnrollmentRequest(t, first)
	if _, err := first.decideEnrollment(
		json.RawMessage(fmt.Sprintf(`{"requestId":%q}`, request.info.ID)),
		false,
	); err != nil {
		t.Fatalf("deny enrollment: %v", err)
	}
	select {
	case err := <-result:
		if err == nil || err.Error() != "enrollment denied" {
			t.Fatalf("denied enrollment error = %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("denied enrollment did not complete")
	}
	if _, exists := second.memberships.get("home"); exists {
		t.Fatal("denied daemon mounted the network")
	}
}

func TestManualEnrollmentQueryListsOnlyActiveOffers(t *testing.T) {
	first := newEnrollmentTestDaemon(t, "first")
	second := newEnrollmentTestDaemon(t, "second")
	membership, _, err := first.memberships.create("home")
	if err != nil {
		t.Fatalf("create home network: %v", err)
	}
	first.enrollmentOffers["active"] = enrollmentOffer{
		ID: "active", Network: membership,
		ExpiresAt: time.Now().Add(time.Minute).UTC().Format(time.RFC3339Nano),
	}
	first.enrollmentOffers["expired"] = enrollmentOffer{
		ID: "expired", Network: membership,
		ExpiresAt: time.Now().Add(-time.Minute).UTC().Format(time.RFC3339Nano),
	}
	candidates, err := second.queryEnrollmentAddress(enrollmentTestAddress(t, first), true)
	if err != nil {
		t.Fatalf("query manual enrollment address: %v", err)
	}
	if len(candidates) != 1 || candidates[0].Offer.ID != "active" {
		t.Fatalf("candidates = %#v", candidates)
	}
}

func newEnrollmentTestDaemon(t *testing.T, name string) *Daemon {
	t.Helper()
	root := t.TempDir()
	d, err := NewWithConfig(Config{
		SocketPath:         filepath.Join(root, name+".sock"),
		DBPath:             filepath.Join(root, "storage", "badger"),
		P2PListenAddresses: []string{"/ip4/127.0.0.1/tcp/0"},
	})
	if err != nil {
		t.Fatalf("create enrollment test daemon: %v", err)
	}
	t.Cleanup(func() { _ = d.Close() })
	return d
}

func enrollmentTestAddress(t *testing.T, d *Daemon) string {
	t.Helper()
	if len(d.p2p.Addrs()) == 0 {
		t.Fatal("test daemon has no p2p address")
	}
	return fmt.Sprintf("%s/p2p/%s", d.p2p.Addrs()[0], d.p2p.ID())
}

func waitForEnrollmentRequest(t *testing.T, d *Daemon) *pendingEnrollment {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		d.enrollmentMu.Lock()
		for _, pending := range d.enrollmentRequests {
			d.enrollmentMu.Unlock()
			return pending
		}
		d.enrollmentMu.Unlock()
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("enrollment request did not become pending")
	return nil
}
