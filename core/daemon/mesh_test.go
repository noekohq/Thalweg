package daemon

import (
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/dgraph-io/badger/v4"
	"github.com/libp2p/go-libp2p/core/peer"
)

func TestMeshAuthenticationSupportsMultipleIsolatedNetworks(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)

	_, homeInvitation, err := first.memberships.create("home")
	if err != nil {
		t.Fatalf("create home network: %v", err)
	}
	if _, _, err := second.memberships.join(homeInvitation); err != nil {
		t.Fatalf("join home network: %v", err)
	}
	_, workInvitation, err := first.memberships.create("work")
	if err != nil {
		t.Fatalf("create work network: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	if err := first.authenticatePeer(ctx, second.p2p.ID(), "home"); err != nil {
		t.Fatalf("authenticate shared home network: %v", err)
	}
	if err := first.authenticatePeer(ctx, second.p2p.ID(), "work"); err == nil ||
		!strings.Contains(err.Error(), "membership authentication failed") {
		t.Fatalf("unshared work authentication error = %v", err)
	}

	if _, _, err := second.memberships.join(workInvitation); err != nil {
		t.Fatalf("join work network: %v", err)
	}
	if err := first.authenticatePeer(ctx, second.p2p.ID(), "work"); err != nil {
		t.Fatalf("authenticate shared work network: %v", err)
	}
}

func TestMeshAuthenticationRejectsWrongSecret(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	_, invitation, err := first.memberships.create("home")
	if err != nil {
		t.Fatalf("create network: %v", err)
	}
	if _, _, err := second.memberships.join(invitation); err != nil {
		t.Fatalf("join network: %v", err)
	}
	membership, _ := second.memberships.get("home")
	wrongSecret := bytes.Repeat([]byte{0x42}, networkSecretBytes)
	membership.Secret = base64.RawURLEncoding.EncodeToString(wrongSecret)
	second.memberships.mu.Lock()
	second.memberships.memberships["home"] = membership
	second.memberships.mu.Unlock()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	connectTestDaemons(t, ctx, first, second)
	if err := first.authenticatePeer(ctx, second.p2p.ID(), "home"); err == nil ||
		!strings.Contains(err.Error(), "membership authentication failed") {
		t.Fatalf("wrong-secret authentication error = %v", err)
	}
	target := fmt.Sprintf("%s/p2p/%s", second.p2p.Addrs()[0], second.p2p.ID())
	if _, err := first.routes["mesh_dial"](nil, json.RawMessage(fmt.Sprintf(
		`{"targetAddr":%q,"network":"home"}`,
		target,
	))); err == nil {
		t.Fatal("mesh_dial accepted wrong membership secret")
	}
	key := fmt.Sprintf("mesh-peer-v1:%s:%s", encodeKeyPart("home"), second.p2p.ID())
	if err := first.store.View(func(txn *badger.Txn) error {
		_, err := txn.Get([]byte(key))
		if err == badger.ErrKeyNotFound {
			return nil
		}
		if err == nil {
			return errors.New("unauthorized mesh peer was persisted")
		}
		return err
	}); err != nil {
		t.Fatalf("inspect unauthorized mesh peer: %v", err)
	}
}

func TestMeshDialRouteAuthenticatesBeforePersistingScopedPeer(t *testing.T) {
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
	result, err := first.routes["mesh_dial"](nil, json.RawMessage(fmt.Sprintf(
		`{"targetAddr":%q,"network":"home"}`,
		target,
	)))
	if err != nil {
		t.Fatalf("mesh_dial: %v", err)
	}
	response, ok := result.(map[string]any)
	if !ok || response["authorized"] != true || response["peerId"] != second.p2p.ID().String() {
		t.Fatalf("mesh_dial response = %#v", result)
	}

	key := fmt.Sprintf("mesh-peer-v1:%s:%s", encodeKeyPart("home"), second.p2p.ID())
	if err := first.store.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(key))
		if err != nil {
			return err
		}
		return item.Value(func(value []byte) error {
			var record persistedMeshPeer
			if err := json.Unmarshal(value, &record); err != nil {
				return err
			}
			if record.Network != "home" || record.Address != target {
				return fmt.Errorf("persisted mesh peer = %#v", record)
			}
			return nil
		})
	}); err != nil {
		t.Fatalf("inspect persisted mesh peer: %v", err)
	}
}

func TestCloseWaitsForRestoredMeshSynchronization(t *testing.T) {
	first := newMeshTestDaemon(t)
	second := newMeshTestDaemon(t)
	mountSharedNetwork(t, first, second, "home")
	target := fmt.Sprintf("%s/p2p/%s", second.p2p.Addrs()[0], second.p2p.ID())
	if err := first.persistMeshPeer("home", second.p2p.ID(), target); err != nil {
		t.Fatalf("persist mesh peer: %v", err)
	}
	first.socketPath = shortSocketPath(t, "restore-sync.sock")

	startErr := make(chan error, 1)
	go func() {
		startErr <- first.Start()
	}()
	conn := waitForDaemonSocket(t, first.socketPath, startErr)
	_ = conn.Close()
	if err := first.Close(); err != nil {
		t.Fatalf("close during restored synchronization: %v", err)
	}
	select {
	case err := <-startErr:
		if err != nil {
			t.Fatalf("start after close: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("daemon close did not wait for restored synchronization")
	}
}

func TestMeshProofBindsPeerIDsNetworkAndFreshChallenge(t *testing.T) {
	secret := base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{0x11}, networkSecretBytes))
	first := meshProof(secret, "responder", "network-id", "peer-a", "peer-b", "init", "response-1")
	tests := []string{
		meshProof(secret, "responder", "other-network", "peer-a", "peer-b", "init", "response-1"),
		meshProof(secret, "responder", "network-id", "peer-x", "peer-b", "init", "response-1"),
		meshProof(secret, "responder", "network-id", "peer-a", "peer-b", "init", "response-2"),
		meshProof(secret, "initiator", "network-id", "peer-a", "peer-b", "init", "response-1"),
	}
	for _, candidate := range tests {
		if proofsEqual(first, candidate) {
			t.Fatal("proof remained valid after changing its authenticated transcript")
		}
	}
	if !proofsEqual(first, first) {
		t.Fatal("proof did not verify against itself")
	}
}

func TestMeshFramesAreBoundedAndStrict(t *testing.T) {
	valid := meshHello{
		Type:            "hello",
		ProtocolVersion: meshProtocolVersion,
		Network:         "home",
	}
	var encoded bytes.Buffer
	if err := writeMeshFrame(&encoded, valid); err != nil {
		t.Fatalf("write valid frame: %v", err)
	}
	var decoded meshHello
	if err := readMeshFrame(bufio.NewReaderSize(&encoded, meshMaxFrameBytes+1), &decoded); err != nil {
		t.Fatalf("read valid frame: %v", err)
	}
	if decoded.Type != valid.Type || decoded.Network != valid.Network {
		t.Fatalf("decoded frame = %#v", decoded)
	}

	unknown := []byte(`{"type":"hello","protocolVersion":1,"unknown":true}` + "\n")
	if err := readMeshFrame(
		bufio.NewReaderSize(bytes.NewReader(unknown), meshMaxFrameBytes+1),
		&decoded,
	); err == nil {
		t.Fatal("expected unknown field rejection")
	}

	oversized := bytes.Repeat([]byte{'x'}, meshMaxFrameBytes+1)
	oversized = append(oversized, '\n')
	if err := readMeshFrame(
		bufio.NewReaderSize(bytes.NewReader(oversized), meshMaxFrameBytes+1),
		&decoded,
	); err == nil || !strings.Contains(err.Error(), "exceeds") {
		t.Fatalf("oversized frame error = %v", err)
	}

	tooLarge := map[string]string{"value": strings.Repeat("x", meshMaxFrameBytes)}
	if err := writeMeshFrame(&bytes.Buffer{}, tooLarge); err == nil {
		t.Fatal("expected oversized outbound frame rejection")
	}
}

func TestMeshWelcomeRejectsStaleResponderProof(t *testing.T) {
	secret := base64.RawURLEncoding.EncodeToString(bytes.Repeat([]byte{0x33}, networkSecretBytes))
	oldProof := meshProof(secret, "responder", "network-id", "peer-a", "peer-b", "hello", "old")
	newProof := meshProof(secret, "responder", "network-id", "peer-a", "peer-b", "hello", "new")
	if proofsEqual(newProof, oldProof) {
		t.Fatal("a proof from an old responder challenge was accepted")
	}
}

func newMeshTestDaemon(t *testing.T) *Daemon {
	t.Helper()
	root := t.TempDir()
	d, err := New(filepath.Join(root, "thalweg.sock"), filepath.Join(root, "badger"))
	if err != nil {
		t.Fatalf("create mesh test daemon: %v", err)
	}
	t.Cleanup(func() {
		if err := d.Close(); err != nil {
			t.Errorf("close mesh test daemon: %v", err)
		}
	})
	return d
}

func connectTestDaemons(
	t *testing.T,
	ctx context.Context,
	first *Daemon,
	second *Daemon,
) {
	t.Helper()
	info := peer.AddrInfo{ID: second.p2p.ID(), Addrs: second.p2p.Addrs()}
	if err := first.p2p.Connect(ctx, info); err != nil {
		t.Fatalf("connect test daemons: %v", err)
	}
}

func TestMeshHandshakeMessageJSONDoesNotContainMembershipSecret(t *testing.T) {
	hello := meshHello{
		Type:            "hello",
		ProtocolVersion: meshProtocolVersion,
		Network:         "home",
		NetworkID:       "public-id",
		Nonce:           "nonce",
		Proof:           "proof",
	}
	encoded, err := json.Marshal(hello)
	if err != nil {
		t.Fatalf("marshal hello: %v", err)
	}
	if strings.Contains(string(encoded), "secret") {
		t.Fatalf("mesh hello contains secret material: %s", encoded)
	}
}
