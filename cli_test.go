package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestInitWritesRestrictedIdempotentConfig(t *testing.T) {
	root := t.TempDir()
	configPath := filepath.Join(root, "config", "config.json")
	dataRoot := filepath.Join(root, "data")
	t.Setenv("THALWEG_CONFIG_PATH", configPath)
	t.Setenv("XDG_DATA_HOME", dataRoot)
	t.Setenv("THALWEG_SOCKET_PATH", "")
	t.Setenv("THALWEG_STORAGE_PATH", "")
	t.Setenv("THALWEG_P2P_LISTEN_ADDRS", "")

	var stdout, stderr bytes.Buffer
	if code := runCLI([]string{"init"}, strings.NewReader(""), &stdout, &stderr); code != 0 {
		t.Fatalf("init exit = %d, stderr = %s", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), "Initialized Thalweg") {
		t.Fatalf("init output = %q", stdout.String())
	}

	info, err := os.Stat(configPath)
	if err != nil {
		t.Fatalf("stat config: %v", err)
	}
	if got := info.Mode().Perm(); got != 0o600 {
		t.Fatalf("config permissions = %o, want 600", got)
	}
	config, _, err := loadLocalConfig()
	if err != nil {
		t.Fatalf("load config: %v", err)
	}
	if config.SocketPath != defaultSocketPath {
		t.Fatalf("socket path = %q, want %q", config.SocketPath, defaultSocketPath)
	}
	wantStorage := filepath.Join(dataRoot, "thalweg", "storage", "badger")
	if config.StoragePath != wantStorage {
		t.Fatalf("storage path = %q, want %q", config.StoragePath, wantStorage)
	}
	if len(config.P2PListenAddresses) != 1 || config.P2PListenAddresses[0] != defaultP2PListen {
		t.Fatalf("p2p addresses = %#v", config.P2PListenAddresses)
	}

	stdout.Reset()
	stderr.Reset()
	if code := runCLI([]string{"init"}, strings.NewReader(""), &stdout, &stderr); code != 0 {
		t.Fatalf("repeat init exit = %d, stderr = %s", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), "already initialized") {
		t.Fatalf("repeat init output = %q", stdout.String())
	}
}

func TestInitRefusesSymlinkConfig(t *testing.T) {
	root := t.TempDir()
	target := filepath.Join(root, "target.json")
	if err := os.WriteFile(target, []byte("{}"), 0o600); err != nil {
		t.Fatalf("write target: %v", err)
	}
	configPath := filepath.Join(root, "config.json")
	if err := os.Symlink(target, configPath); err != nil {
		t.Fatalf("create config symlink: %v", err)
	}
	t.Setenv("THALWEG_CONFIG_PATH", configPath)

	var stdout, stderr bytes.Buffer
	code := runCLI([]string{"init", "--force"}, strings.NewReader(""), &stdout, &stderr)
	if code != 1 {
		t.Fatalf("init exit = %d, want 1", code)
	}
	if !strings.Contains(stderr.String(), "refusing to replace symlink") {
		t.Fatalf("stderr = %q", stderr.String())
	}
}

func TestNetworkCreateCommandUsesDaemonIPC(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "network_create" {
			t.Fatalf("action = %q, want network_create", request.Action)
		}
		payload := request.Payload.(map[string]any)
		if payload["name"] != "home" {
			t.Fatalf("payload = %#v", payload)
		}
		return map[string]any{
			"membership": map[string]any{"name": "home", "id": "network-id"},
			"invitation": "thalweg1:secret",
		}, ""
	})
	setTestConfig(t, socketPath)

	var stdout, stderr bytes.Buffer
	code := runCLI(
		[]string{"network", "create", "home"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 0 {
		t.Fatalf("exit = %d, stderr = %s", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), `"invitation": "thalweg1:secret"`) {
		t.Fatalf("stdout = %q", stdout.String())
	}
}

func TestNetworkJoinReadsInvitationFromStdin(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "network_join" {
			t.Fatalf("action = %q, want network_join", request.Action)
		}
		payload := request.Payload.(map[string]any)
		if payload["invitation"] != "thalweg1:pasted" {
			t.Fatalf("payload = %#v", payload)
		}
		return map[string]any{"joined": true}, ""
	})
	setTestConfig(t, socketPath)

	var stdout, stderr bytes.Buffer
	code := runCLI(
		[]string{"network", "join"},
		strings.NewReader(" thalweg1:pasted\n"),
		&stdout,
		&stderr,
	)
	if code != 0 {
		t.Fatalf("exit = %d, stderr = %s", code, stderr.String())
	}
}

func TestEventIngestCommandPreservesStructuredPayload(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "event_ingest" {
			t.Fatalf("action = %q, want event_ingest", request.Action)
		}
		payload := request.Payload.(map[string]any)
		if payload["network"] != "home" || payload["stream"] != "user:note" {
			t.Fatalf("payload = %#v", payload)
		}
		eventPayload := payload["payload"].(map[string]any)
		if eventPayload["content"] != "hello" || eventPayload["priority"] != json.Number("2") {
			t.Fatalf("event payload = %#v", eventPayload)
		}
		return map[string]any{"id": "note-1"}, ""
	})
	setTestConfig(t, socketPath)

	var stdout, stderr bytes.Buffer
	code := runCLI([]string{
		"event", "ingest",
		"--network", "home",
		"--stream", "user:note",
		"--id", "note-1",
		"--payload", `{"content":"hello","priority":2}`,
	}, strings.NewReader(""), &stdout, &stderr)
	if code != 0 {
		t.Fatalf("exit = %d, stderr = %s", code, stderr.String())
	}
}

func TestPeerSyncCommandMapsPublicFlags(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "mesh_sync" {
			t.Fatalf("action = %q, want mesh_sync", request.Action)
		}
		payload := request.Payload.(map[string]any)
		if payload["network"] != "work" || payload["targetAddr"] != "/ip4/10.0.0.2/tcp/42422/p2p/peer" {
			t.Fatalf("payload = %#v", payload)
		}
		return map[string]any{"pushed": 1, "pulled": 2}, ""
	})
	setTestConfig(t, socketPath)

	var stdout, stderr bytes.Buffer
	code := runCLI([]string{
		"peer", "sync",
		"--network", "work",
		"--address", "/ip4/10.0.0.2/tcp/42422/p2p/peer",
	}, strings.NewReader(""), &stdout, &stderr)
	if code != 0 {
		t.Fatalf("exit = %d, stderr = %s", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), `"pulled": 2`) {
		t.Fatalf("stdout = %q", stdout.String())
	}
}

func TestDaemonErrorBecomesCLIError(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		return nil, "network already exists"
	})
	setTestConfig(t, socketPath)

	var stdout, stderr bytes.Buffer
	code := runCLI(
		[]string{"network", "create", "home"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 1 {
		t.Fatalf("exit = %d, want 1", code)
	}
	if !strings.Contains(stderr.String(), "network already exists") {
		t.Fatalf("stderr = %q", stderr.String())
	}
}

func TestDetachedDaemonArgsResolveConfiguration(t *testing.T) {
	config := localConfig{
		SocketPath:         "/tmp/thalweg-test.sock",
		StoragePath:        "/tmp/thalweg-test-storage",
		P2PListenAddresses: []string{"/ip4/127.0.0.1/tcp/42421", "/ip6/::1/tcp/42421"},
	}
	got := detachedDaemonArgs(config)
	want := []string{
		"daemon",
		"--socket", config.SocketPath,
		"--storage", config.StoragePath,
		"--p2p-listen", strings.Join(config.P2PListenAddresses, ","),
	}
	if strings.Join(got, "\x00") != strings.Join(want, "\x00") {
		t.Fatalf("detached args = %#v, want %#v", got, want)
	}
	for _, arg := range got {
		if arg == "-d" {
			t.Fatal("detached child would recursively daemonize")
		}
	}
}

func TestOpenDaemonLogIsRestrictedAndRejectsSymlink(t *testing.T) {
	root := t.TempDir()
	logPath := filepath.Join(root, "logs", "daemon.log")
	logFile, err := openDaemonLog(logPath)
	if err != nil {
		t.Fatalf("open daemon log: %v", err)
	}
	if err := logFile.Close(); err != nil {
		t.Fatalf("close daemon log: %v", err)
	}
	info, err := os.Stat(logPath)
	if err != nil {
		t.Fatalf("stat daemon log: %v", err)
	}
	if got := info.Mode().Perm(); got != 0o600 {
		t.Fatalf("daemon log permissions = %o, want 600", got)
	}

	target := filepath.Join(root, "target.log")
	if err := os.WriteFile(target, []byte("keep"), 0o600); err != nil {
		t.Fatalf("write symlink target: %v", err)
	}
	symlinkPath := filepath.Join(root, "daemon-symlink.log")
	if err := os.Symlink(target, symlinkPath); err != nil {
		t.Fatalf("create daemon log symlink: %v", err)
	}
	if _, err := openDaemonLog(symlinkPath); err == nil ||
		!strings.Contains(err.Error(), "refusing to open symlink") {
		t.Fatalf("expected symlink rejection, got %v", err)
	}
}

func startFakeDaemon(
	t *testing.T,
	handler func(request ipcRequest) (data any, errorMessage string),
) string {
	t.Helper()
	socketFile, err := os.CreateTemp("", "thalweg-cli-*.sock")
	if err != nil {
		t.Fatalf("reserve fake daemon socket path: %v", err)
	}
	socketPath := socketFile.Name()
	if err := socketFile.Close(); err != nil {
		t.Fatalf("close socket path reservation: %v", err)
	}
	if err := os.Remove(socketPath); err != nil {
		t.Fatalf("release fake daemon socket path: %v", err)
	}
	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		t.Fatalf("listen on fake daemon socket: %v", err)
	}
	t.Cleanup(func() {
		_ = listener.Close()
		_ = os.Remove(socketPath)
	})

	done := make(chan struct{})
	go func() {
		defer close(done)
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		defer conn.Close()
		var request ipcRequest
		decoder := json.NewDecoder(bufio.NewReader(conn))
		decoder.UseNumber()
		if err := decoder.Decode(&request); err != nil {
			t.Errorf("decode request: %v", err)
			return
		}
		data, errorMessage := handler(request)
		response := map[string]any{
			"id":              request.ID,
			"protocolVersion": localProtocolVersion,
			"success":         errorMessage == "",
		}
		if errorMessage == "" {
			response["data"] = data
		} else {
			response["error"] = errorMessage
		}
		if err := json.NewEncoder(conn).Encode(response); err != nil {
			t.Errorf("encode response: %v", err)
		}
	}()
	t.Cleanup(func() {
		select {
		case <-done:
		case <-time.After(2 * time.Second):
			t.Error("fake daemon did not complete")
		}
	})
	return socketPath
}

func setTestConfig(t *testing.T, socketPath string) {
	t.Helper()
	configPath := filepath.Join(t.TempDir(), "config.json")
	content, err := json.Marshal(localConfig{
		SocketPath:         socketPath,
		StoragePath:        filepath.Join(t.TempDir(), "badger"),
		P2PListenAddresses: []string{"/ip4/127.0.0.1/tcp/0"},
	})
	if err != nil {
		t.Fatalf("encode test config: %v", err)
	}
	if err := os.WriteFile(configPath, content, 0o600); err != nil {
		t.Fatalf("write test config: %v", err)
	}
	t.Setenv("THALWEG_CONFIG_PATH", configPath)
	t.Setenv("THALWEG_SOCKET_PATH", "")
	t.Setenv("THALWEG_STORAGE_PATH", "")
	t.Setenv("THALWEG_P2P_LISTEN_ADDRS", "")
}
