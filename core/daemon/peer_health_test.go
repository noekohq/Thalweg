package daemon

import (
	"encoding/json"
	"fmt"
	"net"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multiaddr"
)

func TestMeshPeerHealthTracksSuccessAndFailure(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	_, invitation, err := first.memberships.create("home")
	if err != nil {
		t.Fatalf("create network: %v", err)
	}
	if _, _, err := second.memberships.join(invitation); err != nil {
		t.Fatalf("join network: %v", err)
	}
	target := fmt.Sprintf("%s/p2p/%s", second.p2p.Addrs()[0], second.p2p.ID())
	payload, _ := json.Marshal(map[string]any{"targetAddr": target, "network": "home"})
	if _, err := first.routes["mesh_sync"](nil, payload); err != nil {
		t.Fatalf("initial sync: %v", err)
	}
	statuses, err := first.listMeshPeers("home")
	if err != nil || len(statuses) != 1 {
		t.Fatalf("healthy peer statuses = %#v, %v", statuses, err)
	}
	if statuses[0].State != "healthy" || statuses[0].LastSuccessAt == "" || statuses[0].LastResult == nil {
		t.Fatalf("healthy peer status = %#v", statuses[0])
	}

	if err := second.p2p.Close(); err != nil {
		t.Fatalf("close remote peer: %v", err)
	}
	if _, err := first.routes["mesh_sync"](nil, payload); err == nil {
		t.Fatal("sync unexpectedly succeeded after remote peer closed")
	}
	statuses, err = first.listMeshPeers("home")
	if err != nil || len(statuses) != 1 {
		t.Fatalf("degraded peer statuses = %#v, %v", statuses, err)
	}
	if statuses[0].State != "degraded" || statuses[0].ConsecutiveFailures != 1 || statuses[0].NextAttemptAt == "" {
		t.Fatalf("degraded peer status = %#v", statuses[0])
	}
}

func TestBackgroundMeshRetrySynchronizesKnownPeer(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	first.meshSyncInterval = 10 * time.Millisecond
	_, invitation, err := first.memberships.create("home")
	if err != nil {
		t.Fatalf("create network: %v", err)
	}
	if _, _, err := second.memberships.join(invitation); err != nil {
		t.Fatalf("join network: %v", err)
	}
	if _, err := second.ingest("home", "system:test", "", "background-event", json.RawMessage(`{"ok":true}`)); err != nil {
		t.Fatalf("ingest remote event: %v", err)
	}
	target := fmt.Sprintf("%s/p2p/%s", second.p2p.Addrs()[0], second.p2p.ID())
	if err := first.persistMeshPeer("home", second.p2p.ID(), target); err != nil {
		t.Fatalf("persist known peer: %v", err)
	}
	first.backgroundWG.Add(1)
	go first.meshRetryLoop()

	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		events, err := first.query("home", nil, "", "", 0)
		if err == nil && len(events) == 1 && events[0].ID == "background-event" {
			statuses, statusErr := first.listMeshPeers("home")
			if statusErr != nil || len(statuses) != 1 || statuses[0].LastSuccessAt == "" {
				t.Fatalf("background sync status = %#v, %v", statuses, statusErr)
			}
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("known peer did not synchronize in the background")
}

func TestLocalIngestTriggersConnectedPeerSynchronization(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	first.meshSyncDebounce = 10 * time.Millisecond
	first.meshSyncInterval = time.Hour
	_, invitation, err := first.memberships.create("home")
	if err != nil {
		t.Fatalf("create network: %v", err)
	}
	if _, _, err := second.memberships.join(invitation); err != nil {
		t.Fatalf("join network: %v", err)
	}
	target := fmt.Sprintf("%s/p2p/%s", second.p2p.Addrs()[0], second.p2p.ID())
	payload, _ := json.Marshal(map[string]any{"targetAddr": target, "network": "home"})
	if _, err := first.routes["mesh_sync"](nil, payload); err != nil {
		t.Fatalf("establish known peer: %v", err)
	}
	first.backgroundWG.Add(1)
	go first.meshEventSyncLoop()
	sub := &subscription{
		id:      "remote-consumer",
		network: "home",
		streams: map[string]bool{"system:test": true},
		queue:   make(chan StreamMessage, 1),
	}
	second.subMu.Lock()
	second.subscriptions[sub.id] = sub
	second.subMu.Unlock()
	defer second.removeSubscription(sub.id, sub)

	if _, err := first.ingest("home", "system:test", "", "event-triggered", json.RawMessage(`{"ok":true}`)); err != nil {
		t.Fatalf("ingest local event: %v", err)
	}
	select {
	case message := <-sub.queue:
		if message.Event.ID != "event-triggered" {
			t.Fatalf("subscription event = %#v", message.Event)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("connected peer subscriber did not receive the local event")
	}
	events, err := second.query("home", []string{"system:test"}, "", "", 0)
	if err != nil || len(events) != 1 || events[0].ID != "event-triggered" {
		t.Fatalf("replicated query = %#v, %v", events, err)
	}
}

func TestReplicatedIngestDoesNotTriggerMeshEcho(t *testing.T) {
	d := newMeshTestDaemon(t)
	event := ThalwegEvent{
		ID:           "remote-event",
		Network:      "home",
		Stream:       "system:test",
		OccurredAt:   "2026-08-03T12:00:00.000000000Z",
		InsertedAt:   "2026-08-03T12:00:00.000000000Z",
		PropagatedAt: "2026-08-03T12:00:00.000000000Z",
		DeviceID:     "remote-device",
		Payload:      json.RawMessage(`{"ok":true}`),
	}
	if _, created, err := d.ingestReplicated(event); err != nil || !created {
		t.Fatalf("ingest replicated event = created %v, err %v", created, err)
	}
	if networks := d.takeMeshWakeNetworks(); len(networks) != 0 {
		t.Fatalf("replicated ingest queued mesh echo for %v", networks)
	}
}

func TestMeshSyncSignalsCoalesceByNetwork(t *testing.T) {
	d := newMeshTestDaemon(t)
	for range 100 {
		d.signalMeshSync("home")
	}
	if networks := d.takeMeshWakeNetworks(); len(networks) != 1 || networks[0] != "home" {
		t.Fatalf("coalesced networks = %v", networks)
	}
}

func TestPeerAddressScorePrefersReachableLANListener(t *testing.T) {
	loopback, _ := multiaddr.NewMultiaddr("/ip4/127.0.0.1/tcp/42422")
	lan, _ := multiaddr.NewMultiaddr("/ip4/192.168.68.57/tcp/42422")
	public, _ := multiaddr.NewMultiaddr("/ip4/203.0.113.10/tcp/42422")
	ephemeralUDP, _ := multiaddr.NewMultiaddr("/ip4/192.168.68.57/udp/55000")
	if peerAddressScore(lan) <= peerAddressScore(public) || peerAddressScore(public) <= peerAddressScore(loopback) {
		t.Fatalf("address scores lan=%d public=%d loopback=%d", peerAddressScore(lan), peerAddressScore(public), peerAddressScore(loopback))
	}
	if peerAddressScore(ephemeralUDP) != 0 {
		t.Fatalf("non-TCP address score = %d", peerAddressScore(ephemeralUDP))
	}
}

func TestPreferredPeerAddressMatchesAuthenticatedConnectionIP(t *testing.T) {
	virtual, _ := multiaddr.NewMultiaddr("/ip4/192.168.117.0/tcp/42422")
	wifi, _ := multiaddr.NewMultiaddr("/ip4/192.168.68.57/tcp/42422")
	ephemeral, _ := multiaddr.NewMultiaddr("/ip4/192.168.68.57/tcp/55000")
	peerID := peer.ID("peer-test")
	selected := selectPreferredPeerAddress(
		[]multiaddr.Multiaddr{virtual, wifi, ephemeral},
		2,
		net.ParseIP("192.168.68.57"),
		peerID,
	)
	want := fmt.Sprintf("/ip4/192.168.68.57/tcp/42422/p2p/%s", peerID)
	if selected != want {
		t.Fatalf("selected address = %q, want %q", selected, want)
	}
}

func TestNetworkLeaveRemovesMembershipAndKnownPeers(t *testing.T) {
	d := newMeshTestDaemon(t)
	if _, _, err := d.memberships.create("home"); err != nil {
		t.Fatalf("create network: %v", err)
	}
	remote := newMeshTestDaemon(t)
	target := fmt.Sprintf("%s/p2p/%s", remote.p2p.Addrs()[0], remote.p2p.ID())
	if err := d.persistMeshPeer("home", remote.p2p.ID(), target); err != nil {
		t.Fatalf("persist peer: %v", err)
	}
	result, err := d.routes["network_leave"](nil, json.RawMessage(`{"name":"home"}`))
	if err != nil {
		t.Fatalf("leave network: %v", err)
	}
	if result.(map[string]any)["left"] != true {
		t.Fatalf("leave result = %#v", result)
	}
	if _, exists := d.memberships.get("home"); exists {
		t.Fatal("membership remains mounted after leave")
	}
	records, err := d.loadMeshPeers()
	if err != nil || len(records) != 0 {
		t.Fatalf("persisted peers after leave = %#v, %v", records, err)
	}
}

func TestNetworkLeaveRefusesActiveSynchronization(t *testing.T) {
	d := newMeshTestDaemon(t)
	if _, _, err := d.memberships.create("home"); err != nil {
		t.Fatalf("create network: %v", err)
	}
	remote := newMeshTestDaemon(t)
	if !d.startMeshPeerSync("home", remote.p2p.ID()) {
		t.Fatal("could not mark test synchronization active")
	}
	defer d.finishMeshPeerSync("home", remote.p2p.ID())

	if _, err := d.routes["network_leave"](nil, json.RawMessage(`{"name":"home"}`)); err == nil || !strings.Contains(err.Error(), "synchronization in progress") {
		t.Fatalf("leave during synchronization error = %v", err)
	}
	if _, exists := d.memberships.get("home"); !exists {
		t.Fatal("membership was removed during active synchronization")
	}
}

func TestLocalProtocolErrorsIncludeMachineReadableDetails(t *testing.T) {
	root := t.TempDir()
	d, err := New(filepath.Join(root, "daemon.sock"), filepath.Join(root, "badger"))
	if err != nil {
		t.Fatalf("create daemon: %v", err)
	}
	defer d.Close()
	server, client := net.Pipe()
	done := make(chan struct{})
	go func() {
		d.Handle(server)
		close(done)
	}()
	request := Message{ID: "unknown-1", ProtocolVersion: 1, Action: "does_not_exist", Payload: json.RawMessage(`{}`)}
	if err := json.NewEncoder(client).Encode(request); err != nil {
		t.Fatalf("send request: %v", err)
	}
	var response Response
	if err := json.NewDecoder(client).Decode(&response); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if response.Success || response.ErrorDetails == nil || response.ErrorDetails.Code != "unknown_action" || response.ErrorDetails.Retryable {
		t.Fatalf("structured error response = %#v", response)
	}
	if !strings.Contains(response.Error, "unknown action") || response.ErrorDetails.Message != response.Error {
		t.Fatalf("legacy and structured messages differ: %#v", response)
	}
	_ = client.Close()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("local handler did not close")
	}
}
