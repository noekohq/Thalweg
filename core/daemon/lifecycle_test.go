package daemon

import (
	"encoding/json"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestIdentityPersistsAcrossDaemonRestarts(t *testing.T) {
	root := t.TempDir()
	dbPath := filepath.Join(root, "storage", "badger")

	first, err := New(filepath.Join(root, "first.sock"), dbPath)
	if err != nil {
		t.Fatalf("create first daemon: %v", err)
	}
	firstID := first.deviceID
	if err := first.Close(); err != nil {
		t.Fatalf("close first daemon: %v", err)
	}

	info, err := os.Stat(identityPath(dbPath))
	if err != nil {
		t.Fatalf("stat identity: %v", err)
	}
	if got := info.Mode().Perm(); got != 0o600 {
		t.Fatalf("identity permissions = %o, want 600", got)
	}

	second, err := New(filepath.Join(root, "second.sock"), dbPath)
	if err != nil {
		t.Fatalf("create second daemon: %v", err)
	}
	t.Cleanup(func() {
		_ = second.Close()
	})
	if second.deviceID != firstID {
		t.Fatalf("device identity changed across restart: %s != %s", second.deviceID, firstID)
	}
}

func TestConfiguredP2PListenAddressPersistsAcrossRestart(t *testing.T) {
	reservation, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("reserve TCP port: %v", err)
	}
	_, port, err := net.SplitHostPort(reservation.Addr().String())
	if err != nil {
		reservation.Close()
		t.Fatalf("read reserved TCP port: %v", err)
	}
	if err := reservation.Close(); err != nil {
		t.Fatalf("release TCP port: %v", err)
	}

	root := t.TempDir()
	config := Config{
		SocketPath:         filepath.Join(root, "daemon.sock"),
		DBPath:             filepath.Join(root, "storage", "badger"),
		P2PListenAddresses: []string{"/ip4/127.0.0.1/tcp/" + port},
	}
	first, err := NewWithConfig(config)
	if err != nil {
		t.Fatalf("create configured daemon: %v", err)
	}
	firstID := first.deviceID
	assertListenAddress(t, first, config.P2PListenAddresses[0])
	if err := first.Close(); err != nil {
		t.Fatalf("close first daemon: %v", err)
	}

	second, err := NewWithConfig(config)
	if err != nil {
		t.Fatalf("restart configured daemon: %v", err)
	}
	defer second.Close()
	if second.deviceID != firstID {
		t.Fatalf("configured daemon identity changed across restart")
	}
	assertListenAddress(t, second, config.P2PListenAddresses[0])
}

func assertListenAddress(t *testing.T, d *Daemon, want string) {
	t.Helper()
	for _, address := range d.p2p.Addrs() {
		if address.String() == want {
			return
		}
	}
	t.Fatalf("listen addresses = %v, want %s", d.p2p.Addrs(), want)
}

func TestNewRejectsCorruptIdentity(t *testing.T) {
	root := t.TempDir()
	dbPath := filepath.Join(root, "storage", "badger")
	path := identityPath(dbPath)
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		t.Fatalf("create identity directory: %v", err)
	}
	if err := os.WriteFile(path, []byte("not-a-private-key"), 0o600); err != nil {
		t.Fatalf("write corrupt identity: %v", err)
	}

	_, err := New(filepath.Join(root, "daemon.sock"), dbPath)
	if err == nil {
		t.Fatal("expected corrupt identity error")
	}
	if !strings.Contains(err.Error(), "decode identity file") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestStartServesAndCloseStopsDaemon(t *testing.T) {
	root := t.TempDir()
	socketPath := shortSocketPath(t, "daemon.sock")
	d, err := New(socketPath, filepath.Join(root, "storage", "badger"))
	if err != nil {
		t.Fatalf("create daemon: %v", err)
	}
	t.Cleanup(func() {
		_ = d.Close()
	})

	startErr := make(chan error, 1)
	go func() {
		startErr <- d.Start()
	}()

	conn := waitForDaemonSocket(t, socketPath, startErr)
	defer conn.Close()

	info, err := os.Stat(socketPath)
	if err != nil {
		t.Fatalf("stat socket: %v", err)
	}
	if got := info.Mode().Perm(); got != 0o600 {
		t.Fatalf("socket permissions = %o, want 600", got)
	}

	request := Message{
		ID:              "status-1",
		ProtocolVersion: currentLocalProtocolVersion,
		Action:          "network_status",
		Payload:         json.RawMessage(`{}`),
	}
	if err := json.NewEncoder(conn).Encode(request); err != nil {
		t.Fatalf("send status request: %v", err)
	}
	var response Response
	if err := json.NewDecoder(conn).Decode(&response); err != nil {
		t.Fatalf("read status response: %v", err)
	}
	if !response.Success || response.ID != request.ID {
		t.Fatalf("unexpected status response: %#v", response)
	}
	if response.ProtocolVersion != currentLocalProtocolVersion {
		t.Fatalf(
			"response protocol version = %d, want %d",
			response.ProtocolVersion,
			currentLocalProtocolVersion,
		)
	}
	status, ok := response.Data.(map[string]any)
	if !ok {
		t.Fatalf("status response data has type %T", response.Data)
	}
	if status["daemonVersion"] != daemonVersion {
		t.Fatalf("daemonVersion = %#v, want %q", status["daemonVersion"], daemonVersion)
	}
	if status["protocolVersion"] != float64(currentLocalProtocolVersion) {
		t.Fatalf("protocolVersion = %#v, want %d", status["protocolVersion"], currentLocalProtocolVersion)
	}
	if status["storageSchemaVersion"] != float64(currentStorageSchemaVersion) {
		t.Fatalf(
			"storageSchemaVersion = %#v, want %d",
			status["storageSchemaVersion"],
			currentStorageSchemaVersion,
		)
	}
	addressGroups, ok := status["addressGroups"].(map[string]any)
	if !ok {
		t.Fatalf("addressGroups has type %T", status["addressGroups"])
	}
	if loopback, ok := addressGroups["loopback"].([]any); !ok || len(loopback) != 1 {
		t.Fatalf("loopback addresses = %#v, want one address", addressGroups["loopback"])
	}

	if err := d.Close(); err != nil {
		t.Fatalf("close daemon: %v", err)
	}
	select {
	case err := <-startErr:
		if err != nil {
			t.Fatalf("start returned an error after close: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("daemon did not stop within two seconds")
	}
	if _, err := os.Lstat(socketPath); !os.IsNotExist(err) {
		t.Fatalf("socket still exists after close: %v", err)
	}
}

func TestStartDoesNotRemoveActiveSocket(t *testing.T) {
	root := t.TempDir()
	socketPath := shortSocketPath(t, "active.sock")
	active, err := net.Listen("unix", socketPath)
	if err != nil {
		t.Fatalf("create active socket: %v", err)
	}
	defer active.Close()

	d, err := New(socketPath, filepath.Join(root, "storage", "badger"))
	if err != nil {
		t.Fatalf("create daemon: %v", err)
	}
	if err := d.Start(); err == nil || !strings.Contains(err.Error(), "already active") {
		t.Fatalf("expected active socket error, got %v", err)
	}
	if err := d.Close(); err != nil {
		t.Fatalf("close daemon: %v", err)
	}

	conn, err := net.DialTimeout("unix", socketPath, time.Second)
	if err != nil {
		t.Fatalf("original socket was removed or closed: %v", err)
	}
	_ = conn.Close()
}

func TestStartRemovesStaleSocket(t *testing.T) {
	root := t.TempDir()
	socketPath := shortSocketPath(t, "stale.sock")
	stale, err := net.ListenUnix("unix", &net.UnixAddr{Name: socketPath, Net: "unix"})
	if err != nil {
		t.Fatalf("create stale socket: %v", err)
	}
	stale.SetUnlinkOnClose(false)
	if err := stale.Close(); err != nil {
		t.Fatalf("close stale socket: %v", err)
	}
	if _, err := os.Lstat(socketPath); err != nil {
		t.Fatalf("stale socket path was not retained: %v", err)
	}

	d, err := New(socketPath, filepath.Join(root, "storage", "badger"))
	if err != nil {
		t.Fatalf("create daemon: %v", err)
	}
	t.Cleanup(func() {
		_ = d.Close()
	})

	startErr := make(chan error, 1)
	go func() {
		startErr <- d.Start()
	}()
	conn := waitForDaemonSocket(t, socketPath, startErr)
	_ = conn.Close()

	if err := d.Close(); err != nil {
		t.Fatalf("close daemon: %v", err)
	}
	select {
	case err := <-startErr:
		if err != nil {
			t.Fatalf("start returned an error after close: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("daemon did not stop within two seconds")
	}
}

func TestStartRefusesNonSocketPath(t *testing.T) {
	root := t.TempDir()
	socketPath := filepath.Join(root, "do-not-remove")
	if err := os.WriteFile(socketPath, []byte("user data"), 0o600); err != nil {
		t.Fatalf("write sentinel file: %v", err)
	}

	d, err := New(socketPath, filepath.Join(root, "storage", "badger"))
	if err != nil {
		t.Fatalf("create daemon: %v", err)
	}
	if err := d.Start(); err == nil || !strings.Contains(err.Error(), "refusing to remove non-socket") {
		t.Fatalf("expected non-socket path error, got %v", err)
	}
	if err := d.Close(); err != nil {
		t.Fatalf("close daemon: %v", err)
	}
	data, err := os.ReadFile(socketPath)
	if err != nil {
		t.Fatalf("sentinel file was removed: %v", err)
	}
	if string(data) != "user data" {
		t.Fatalf("sentinel file changed: %q", data)
	}
}

func TestHandleRejectsExplicitProtocolMismatch(t *testing.T) {
	server, client := net.Pipe()
	d := &Daemon{}
	done := make(chan struct{})
	go func() {
		d.Handle(server)
		close(done)
	}()

	request := Message{
		ID:              "mismatch",
		ProtocolVersion: 999,
		Action:          "network_status",
		Payload:         json.RawMessage(`{}`),
	}
	if err := json.NewEncoder(client).Encode(request); err != nil {
		t.Fatalf("send mismatched request: %v", err)
	}
	var response Response
	if err := json.NewDecoder(client).Decode(&response); err != nil {
		t.Fatalf("read mismatch response: %v", err)
	}
	if response.Success || response.ID != request.ID {
		t.Fatalf("unexpected mismatch response: %#v", response)
	}
	if response.ProtocolVersion != currentLocalProtocolVersion {
		t.Fatalf(
			"response protocol version = %d, want %d",
			response.ProtocolVersion,
			currentLocalProtocolVersion,
		)
	}
	if !strings.Contains(response.Error, "unsupported protocol version 999") {
		t.Fatalf("unexpected mismatch error: %q", response.Error)
	}
	_ = client.Close()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("handler did not stop after client close")
	}
}

func TestSubscriptionPushIncludesProtocolVersion(t *testing.T) {
	root := t.TempDir()
	socketPath := shortSocketPath(t, "subscription.sock")
	d, err := New(socketPath, filepath.Join(root, "storage", "badger"))
	if err != nil {
		t.Fatalf("create daemon: %v", err)
	}
	t.Cleanup(func() {
		_ = d.Close()
	})
	startErr := make(chan error, 1)
	go func() {
		startErr <- d.Start()
	}()

	subscriber := waitForDaemonSocket(t, socketPath, startErr)
	defer subscriber.Close()
	subscribe := Message{
		ID:              "subscribe",
		ProtocolVersion: currentLocalProtocolVersion,
		Action:          "siphon_register",
		Payload:         json.RawMessage(`{"network":"test","streams":["user:note"]}`),
	}
	if err := json.NewEncoder(subscriber).Encode(subscribe); err != nil {
		t.Fatalf("send subscription request: %v", err)
	}
	var subscribeResponse Response
	if err := json.NewDecoder(subscriber).Decode(&subscribeResponse); err != nil {
		t.Fatalf("read subscription response: %v", err)
	}
	if !subscribeResponse.Success {
		t.Fatalf("subscription failed: %#v", subscribeResponse)
	}

	producer, err := net.Dial("unix", socketPath)
	if err != nil {
		t.Fatalf("connect producer: %v", err)
	}
	defer producer.Close()
	ingest := Message{
		ID:              "ingest",
		ProtocolVersion: currentLocalProtocolVersion,
		Action:          "event_ingest",
		Payload: json.RawMessage(
			`{"network":"test","stream":"user:note","eventId":"push-version","payload":{"content":"hello"}}`,
		),
	}
	if err := json.NewEncoder(producer).Encode(ingest); err != nil {
		t.Fatalf("send ingest request: %v", err)
	}
	var ingestResponse Response
	if err := json.NewDecoder(producer).Decode(&ingestResponse); err != nil {
		t.Fatalf("read ingest response: %v", err)
	}
	if !ingestResponse.Success {
		t.Fatalf("ingest failed: %#v", ingestResponse)
	}

	var push StreamMessage
	if err := json.NewDecoder(subscriber).Decode(&push); err != nil {
		t.Fatalf("read subscription push: %v", err)
	}
	if push.ProtocolVersion != currentLocalProtocolVersion {
		t.Fatalf(
			"push protocol version = %d, want %d",
			push.ProtocolVersion,
			currentLocalProtocolVersion,
		)
	}
	if push.Event.ID != "push-version" {
		t.Fatalf("unexpected pushed event: %#v", push.Event)
	}
}

func shortSocketPath(t *testing.T, name string) string {
	t.Helper()
	dir, err := os.MkdirTemp("/tmp", "thalweg-test-")
	if err != nil {
		t.Fatalf("create short socket directory: %v", err)
	}
	t.Cleanup(func() {
		_ = os.RemoveAll(dir)
	})
	return filepath.Join(dir, name)
}

func waitForDaemonSocket(t *testing.T, path string, startErr <-chan error) net.Conn {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		select {
		case err := <-startErr:
			t.Fatalf("daemon stopped before socket became ready: %v", err)
		default:
		}
		conn, err := net.DialTimeout("unix", path, 50*time.Millisecond)
		if err == nil {
			return conn
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("daemon socket %s did not become ready", path)
	return nil
}
