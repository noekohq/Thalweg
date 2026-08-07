package cli

import (
	"bytes"
	"encoding/json"
	"errors"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	coredaemon "thalweg/core/daemon"
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
	if code := Run([]string{"init"}, strings.NewReader(""), &stdout, &stderr); code != 0 {
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
	if code := Run([]string{"init"}, strings.NewReader(""), &stdout, &stderr); code != 0 {
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
	code := Run([]string{"init", "--force"}, strings.NewReader(""), &stdout, &stderr)
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
	code := Run(
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
	code := Run(
		[]string{"network", "join"},
		strings.NewReader(" thalweg1:pasted\n"),
		&stdout,
		&stderr,
	)
	if code != 0 {
		t.Fatalf("exit = %d, stderr = %s", code, stderr.String())
	}
}

func TestNetworkInviteCommandUsesDaemonIPC(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "network_invite" {
			t.Fatalf("action = %q, want network_invite", request.Action)
		}
		payload := request.Payload.(map[string]any)
		if payload["name"] != "home" {
			t.Fatalf("payload = %#v", payload)
		}
		return map[string]any{
			"membership":     map[string]any{"name": "home", "id": "network-id"},
			"invitation":     "thalweg1:reissued",
			"credentialMode": "shared-bearer",
		}, ""
	})
	setTestConfig(t, socketPath)

	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"network", "invite", "home"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 0 {
		t.Fatalf("exit = %d, stderr = %s", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), `"credentialMode": "shared-bearer"`) ||
		!strings.Contains(stdout.String(), `"invitation": "thalweg1:reissued"`) {
		t.Fatalf("stdout = %q", stdout.String())
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
	code := Run([]string{
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

func TestEventConflictResolveCommandUsesDaemonIPC(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "event_conflict_resolve" {
			t.Fatalf("action = %q, want event_conflict_resolve", request.Action)
		}
		payload := request.Payload.(map[string]any)
		if payload["network"] != "home" || payload["eventId"] != "collision" ||
			payload["strategy"] != "preserve-both" {
			t.Fatalf("payload = %#v", payload)
		}
		return map[string]any{"eventId": "collision", "strategy": "preserve-both"}, ""
	})
	setTestConfig(t, socketPath)

	var stdout, stderr bytes.Buffer
	code := Run([]string{
		"event", "conflicts", "resolve",
		"--network", "home",
		"--id", "collision",
	}, strings.NewReader(""), &stdout, &stderr)
	if code != 0 {
		t.Fatalf("exit = %d, stderr = %s", code, stderr.String())
	}
	if !strings.Contains(stdout.String(), `"strategy": "preserve-both"`) {
		t.Fatalf("stdout = %q", stdout.String())
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
	code := Run([]string{
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

func TestPeerListCommandSupportsNetworkFilter(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "mesh_peer_list" {
			t.Fatalf("action = %q, want mesh_peer_list", request.Action)
		}
		payload := request.Payload.(map[string]any)
		if payload["network"] != "home" {
			t.Fatalf("payload = %#v", payload)
		}
		return []map[string]any{{"peerId": "peer-id", "state": "healthy"}}, ""
	})
	setTestConfig(t, socketPath)
	var stdout, stderr bytes.Buffer
	code := Run([]string{"peer", "list", "--network", "home"}, strings.NewReader(""), &stdout, &stderr)
	if code != 0 || !strings.Contains(stdout.String(), `"state": "healthy"`) {
		t.Fatalf("exit = %d, stdout = %q, stderr = %q", code, stdout.String(), stderr.String())
	}
}

func TestSiphonCreateCommandMapsDurableDefinition(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "durable_siphon_create" {
			t.Fatalf("action = %q, want durable_siphon_create", request.Action)
		}
		payload := request.Payload.(map[string]any)
		streams := payload["streams"].([]any)
		if payload["network"] != "home" || payload["name"] != "transcripts" || payload["start"] != "earliest" || len(streams) != 2 {
			t.Fatalf("payload = %#v", payload)
		}
		return map[string]any{"name": "transcripts", "cursor": 0}, ""
	})
	setTestConfig(t, socketPath)
	var stdout, stderr bytes.Buffer
	code := Run([]string{
		"siphon", "create", "--network", "home", "--streams", "voice:transcript,user:note", "transcripts",
	}, strings.NewReader(""), &stdout, &stderr)
	if code != 0 || !strings.Contains(stdout.String(), `"name": "transcripts"`) {
		t.Fatalf("exit = %d, stdout = %q, stderr = %q", code, stdout.String(), stderr.String())
	}
}

func TestSiphonAckCommandMapsDeliveryIdentity(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "durable_siphon_ack" {
			t.Fatalf("action = %q, want durable_siphon_ack", request.Action)
		}
		payload := request.Payload.(map[string]any)
		if payload["network"] != "home" || payload["name"] != "transcripts" || payload["deliveryId"] != "delivery-1" {
			t.Fatalf("payload = %#v", payload)
		}
		return map[string]any{"name": "transcripts", "cursor": 3}, ""
	})
	setTestConfig(t, socketPath)
	var stdout, stderr bytes.Buffer
	code := Run([]string{
		"siphon", "ack", "--network", "home", "--delivery", "delivery-1", "transcripts",
	}, strings.NewReader(""), &stdout, &stderr)
	if code != 0 || !strings.Contains(stdout.String(), `"cursor": 3`) {
		t.Fatalf("exit = %d, stdout = %q, stderr = %q", code, stdout.String(), stderr.String())
	}
}

func TestNetworkLeaveRequiresConfirmationAndUsesDaemonIPC(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "network_leave" {
			t.Fatalf("action = %q, want network_leave", request.Action)
		}
		payload := request.Payload.(map[string]any)
		if payload["name"] != "home" {
			t.Fatalf("payload = %#v", payload)
		}
		return map[string]any{"left": true}, ""
	})
	setTestConfig(t, socketPath)
	var stdout, stderr bytes.Buffer
	if code := Run([]string{"network", "leave", "home"}, strings.NewReader(""), &stdout, &stderr); code == 0 {
		t.Fatal("network leave succeeded without --yes")
	}
	stdout.Reset()
	stderr.Reset()
	code := Run([]string{"network", "leave", "--yes", "home"}, strings.NewReader(""), &stdout, &stderr)
	if code != 0 || !strings.Contains(stdout.String(), `"left": true`) {
		t.Fatalf("exit = %d, stdout = %q, stderr = %q", code, stdout.String(), stderr.String())
	}
}

func TestDaemonErrorBecomesCLIError(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		return nil, "network already exists"
	})
	setTestConfig(t, socketPath)

	var stdout, stderr bytes.Buffer
	code := Run(
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
	got := detachedDaemonArgs(config, false)
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

func TestDetachedDaemonArgsPropagateDebug(t *testing.T) {
	config := localConfig{
		SocketPath:         "/tmp/thalweg-test.sock",
		StoragePath:        "/tmp/thalweg-test-storage",
		P2PListenAddresses: []string{"/ip4/0.0.0.0/tcp/42422"},
	}
	got := detachedDaemonArgs(config, true)
	if got[len(got)-1] != "--debug" {
		t.Fatalf("detached debug args = %#v", got)
	}
}

func TestManagedDaemonStartRejectsConflictingModes(t *testing.T) {
	setTestConfig(t, "/tmp/thalweg-managed-start-test.sock")
	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"daemon", "start", "--foreground", "-d"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 1 || !strings.Contains(stderr.String(), "--foreground and -d") {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
}

func TestConsoleWebRejectsNetworkAccessibleListenAddress(t *testing.T) {
	setTestConfig(t, "/tmp/thalweg-console-test.sock")
	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"console", "web", "--listen", "0.0.0.0:42424"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 1 || !strings.Contains(stderr.String(), "may only listen on loopback") {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
}

func TestConsoleTUIRejectsUnsafeRefreshInterval(t *testing.T) {
	setTestConfig(t, "/tmp/thalweg-console-test.sock")
	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"console", "tui", "--refresh", "10ms"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 1 || !strings.Contains(stderr.String(), "--refresh must be between") {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
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

func TestDaemonStateIsRestrictedOwnedAndRejectsSymlink(t *testing.T) {
	root := t.TempDir()
	config := localConfig{StoragePath: filepath.Join(root, "storage", "badger")}
	statePath := daemonStatePath(config)
	state := daemonState{
		Version:       daemonStateVersion,
		PID:           4242,
		StartedAt:     time.Now().UTC(),
		SocketPath:    filepath.Join(root, "daemon.sock"),
		StoragePath:   config.StoragePath,
		Executable:    "/tmp/thalweg",
		DaemonVersion: "test",
	}
	if err := writeDaemonState(statePath, state); err != nil {
		t.Fatalf("write daemon state: %v", err)
	}
	info, err := os.Stat(statePath)
	if err != nil {
		t.Fatalf("stat daemon state: %v", err)
	}
	if got := info.Mode().Perm(); got != 0o600 {
		t.Fatalf("daemon state permissions = %o, want 600", got)
	}
	loaded, err := loadDaemonState(statePath)
	if err != nil {
		t.Fatalf("load daemon state: %v", err)
	}
	if loaded.PID != state.PID || loaded.SocketPath != state.SocketPath {
		t.Fatalf("loaded daemon state = %#v", loaded)
	}
	if err := removeDaemonStateIfOwned(statePath, state.PID+1); err != nil {
		t.Fatalf("ignore differently owned state: %v", err)
	}
	if _, err := os.Stat(statePath); err != nil {
		t.Fatalf("differently owned state was removed: %v", err)
	}
	if err := removeDaemonStateIfOwned(statePath, state.PID); err != nil {
		t.Fatalf("remove owned daemon state: %v", err)
	}
	if _, err := os.Stat(statePath); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("owned daemon state still exists: %v", err)
	}

	target := filepath.Join(root, "state-target.json")
	if err := os.WriteFile(target, []byte("{}"), 0o600); err != nil {
		t.Fatalf("write daemon state target: %v", err)
	}
	if err := os.Symlink(target, statePath); err != nil {
		t.Fatalf("create daemon state symlink: %v", err)
	}
	if err := writeDaemonState(statePath, state); err == nil ||
		!strings.Contains(err.Error(), "refusing to replace symlink") {
		t.Fatalf("expected daemon state symlink rejection, got %v", err)
	}
}

func TestDaemonLifecycleStatusReportsLiveUnmanagedDaemon(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "network_status" {
			t.Fatalf("action = %q, want network_status", request.Action)
		}
		return map[string]any{"deviceId": "device-1"}, ""
	})
	setTestConfig(t, socketPath)
	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"daemon", "status"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 0 {
		t.Fatalf("exit=%d stderr=%q", code, stderr.String())
	}
	var status daemonLifecycleStatus
	if err := json.Unmarshal(stdout.Bytes(), &status); err != nil {
		t.Fatalf("decode lifecycle status: %v\n%s", err, stdout.String())
	}
	if !status.Running || status.Managed {
		t.Fatalf("lifecycle status = %#v", status)
	}
}

func TestDaemonStopUsesGracefulLocalIPC(t *testing.T) {
	root := t.TempDir()
	socketFile, err := os.CreateTemp("", "thalweg-stop-*.sock")
	if err != nil {
		t.Fatalf("reserve daemon socket: %v", err)
	}
	socketPath := socketFile.Name()
	if err := socketFile.Close(); err != nil {
		t.Fatalf("close reserved daemon socket: %v", err)
	}
	if err := os.Remove(socketPath); err != nil {
		t.Fatalf("remove reserved daemon socket: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Remove(socketPath)
	})
	d, err := coredaemon.NewWithConfig(coredaemon.Config{
		SocketPath:         socketPath,
		DBPath:             filepath.Join(root, "storage", "badger"),
		P2PListenAddresses: []string{"/ip4/127.0.0.1/tcp/0"},
	})
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
	deadline := time.Now().Add(2 * time.Second)
	for !daemonSocketActive(socketPath) && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if !daemonSocketActive(socketPath) {
		t.Fatal("daemon socket did not become active")
	}

	setTestConfig(t, socketPath)
	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"daemon", "stop"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 0 {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
	if !strings.Contains(stdout.String(), "Stopped Thalweg daemon") {
		t.Fatalf("stop output = %q", stdout.String())
	}
	select {
	case err := <-startErr:
		if err != nil {
			t.Fatalf("daemon start returned after stop: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("daemon did not stop")
	}
}

func TestDaemonLogsPrintsOnlyRequestedTail(t *testing.T) {
	root := t.TempDir()
	logPath := filepath.Join(root, "daemon.log")
	if err := os.WriteFile(logPath, []byte("one\ntwo\nthree\nfour\n"), 0o600); err != nil {
		t.Fatalf("write daemon log: %v", err)
	}
	var output bytes.Buffer
	if err := printDaemonLogTail(logPath, 2, &output); err != nil {
		t.Fatalf("print daemon log tail: %v", err)
	}
	if strings.Contains(output.String(), "one\n") || strings.Contains(output.String(), "two\n") {
		t.Fatalf("log tail included old lines: %q", output.String())
	}
	if !strings.HasSuffix(output.String(), "three\nfour\n") {
		t.Fatalf("log tail = %q", output.String())
	}
}

func TestInstallRecordRejectsSymlinkAndUnsupportedVersion(t *testing.T) {
	root := t.TempDir()
	target := filepath.Join(root, "record.json")
	if err := os.WriteFile(target, []byte(`{"version":99}`), 0o600); err != nil {
		t.Fatalf("write installation record: %v", err)
	}
	if _, err := loadInstallRecord(target); err == nil ||
		!strings.Contains(err.Error(), "unsupported installation record version") {
		t.Fatalf("expected installation record version rejection, got %v", err)
	}

	link := filepath.Join(root, "record-link.json")
	if err := os.Symlink(target, link); err != nil {
		t.Fatalf("create installation record symlink: %v", err)
	}
	if _, err := loadInstallRecord(link); err == nil ||
		!strings.Contains(err.Error(), "refusing to read symlink") {
		t.Fatalf("expected installation record symlink rejection, got %v", err)
	}
}

func TestUpgradeCheckUsesTrackedSourceCommit(t *testing.T) {
	sourcePath, commit := createUpgradeTestRepository(t)
	recordPath := filepath.Join(t.TempDir(), "install.json")
	record := installRecord{
		Version:          installRecordVersion,
		Channel:          "source",
		SourcePath:       sourcePath,
		BinaryPath:       filepath.Join(t.TempDir(), "thalweg"),
		Commit:           commit,
		InstalledVersion: "test",
		InstalledAt:      time.Now().UTC(),
	}
	content, err := json.Marshal(record)
	if err != nil {
		t.Fatalf("encode installation record: %v", err)
	}
	if err := os.WriteFile(recordPath, content, 0o600); err != nil {
		t.Fatalf("write installation record: %v", err)
	}
	t.Setenv("THALWEG_INSTALL_RECORD_PATH", recordPath)

	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"upgrade", "--check"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 0 {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
	if !strings.Contains(stdout.String(), "Thalweg is up to date") {
		t.Fatalf("upgrade check output = %q", stdout.String())
	}

	record.Commit = "older-commit"
	content, err = json.Marshal(record)
	if err != nil {
		t.Fatalf("encode stale installation record: %v", err)
	}
	if err := os.WriteFile(recordPath, content, 0o600); err != nil {
		t.Fatalf("write stale installation record: %v", err)
	}
	stdout.Reset()
	stderr.Reset()
	code = Run(
		[]string{"upgrade", "--check"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 0 || !strings.Contains(stdout.String(), "Upgrade available") {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
}

func TestUpgradeRefusesDirtySourceCheckout(t *testing.T) {
	sourcePath, commit := createUpgradeTestRepository(t)
	recordPath := filepath.Join(t.TempDir(), "install.json")
	record := installRecord{
		Version:          installRecordVersion,
		Channel:          "source",
		SourcePath:       sourcePath,
		BinaryPath:       filepath.Join(t.TempDir(), "thalweg"),
		Commit:           commit,
		InstalledVersion: "test",
		InstalledAt:      time.Now().UTC(),
	}
	content, err := json.Marshal(record)
	if err != nil {
		t.Fatalf("encode installation record: %v", err)
	}
	if err := os.WriteFile(recordPath, content, 0o600); err != nil {
		t.Fatalf("write installation record: %v", err)
	}
	if err := os.WriteFile(filepath.Join(sourcePath, "local.txt"), []byte("dirty"), 0o600); err != nil {
		t.Fatalf("dirty source checkout: %v", err)
	}
	t.Setenv("THALWEG_INSTALL_RECORD_PATH", recordPath)

	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"upgrade", "--check"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 1 || !strings.Contains(stderr.String(), "source checkout has local changes") {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
}

func TestUpgradeInstallsStaleCleanSource(t *testing.T) {
	sourcePath, _ := createUpgradeTestRepository(t)
	installRoot := t.TempDir()
	recordPath := filepath.Join(installRoot, "install.json")
	binaryPath := filepath.Join(installRoot, "bin", "thalweg")
	record := installRecord{
		Version:          installRecordVersion,
		Channel:          "source",
		SourcePath:       sourcePath,
		BinaryPath:       binaryPath,
		Commit:           "older-commit",
		InstalledVersion: "test",
		InstalledAt:      time.Now().UTC(),
	}
	content, err := json.Marshal(record)
	if err != nil {
		t.Fatalf("encode installation record: %v", err)
	}
	if err := os.WriteFile(recordPath, content, 0o600); err != nil {
		t.Fatalf("write installation record: %v", err)
	}
	t.Setenv("THALWEG_INSTALL_RECORD_PATH", recordPath)

	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"upgrade", "--no-restart"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 0 {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
	marker := filepath.Join(filepath.Dir(binaryPath), "upgrade-marker")
	if content, err := os.ReadFile(marker); err != nil || string(content) != "installed\n" {
		t.Fatalf("upgrade marker content=%q err=%v", content, err)
	}
}

func TestDoctorReportsHealthyRunningDaemonAsJSON(t *testing.T) {
	socketFile, err := os.CreateTemp("", "thalweg-doctor-*.sock")
	if err != nil {
		t.Fatalf("reserve doctor socket: %v", err)
	}
	socketPath := socketFile.Name()
	if err := socketFile.Close(); err != nil {
		t.Fatalf("close doctor socket reservation: %v", err)
	}
	if err := os.Remove(socketPath); err != nil {
		t.Fatalf("remove doctor socket reservation: %v", err)
	}
	t.Cleanup(func() {
		_ = os.Remove(socketPath)
	})
	setTestConfig(t, socketPath)
	t.Setenv("XDG_DATA_HOME", t.TempDir())
	config, _, err := loadLocalConfig()
	if err != nil {
		t.Fatalf("load doctor test config: %v", err)
	}
	if err := os.Chmod(filepath.Dir(config.StoragePath), 0o700); err != nil {
		t.Fatalf("restrict doctor test storage: %v", err)
	}
	d, err := coredaemon.NewWithConfig(coredaemon.Config{
		SocketPath:         config.SocketPath,
		DBPath:             config.StoragePath,
		P2PListenAddresses: config.P2PListenAddresses,
	})
	if err != nil {
		t.Fatalf("create doctor test daemon: %v", err)
	}
	t.Cleanup(func() {
		_ = d.Close()
	})
	startErr := make(chan error, 1)
	go func() {
		startErr <- d.Start()
	}()
	deadline := time.Now().Add(2 * time.Second)
	for !daemonSocketActive(socketPath) && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if !daemonSocketActive(socketPath) {
		t.Fatal("doctor test daemon socket did not become active")
	}

	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"doctor", "--json"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 0 {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
	var report doctorReport
	if err := json.Unmarshal(stdout.Bytes(), &report); err != nil {
		t.Fatalf("decode doctor report: %v\n%s", err, stdout.String())
	}
	if !report.Healthy || report.Summary.Failed != 0 {
		t.Fatalf("doctor report = %#v", report)
	}
	if check := findDoctorCheck(report.Checks, "daemon.reachable"); check.Status != "pass" {
		t.Fatalf("daemon reachable check = %#v", check)
	}

	if err := d.Close(); err != nil {
		t.Fatalf("close doctor test daemon: %v", err)
	}
	select {
	case err := <-startErr:
		if err != nil {
			t.Fatalf("doctor test daemon returned: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("doctor test daemon did not stop")
	}
}

func TestDoctorFailureReturnsMachineReadableReportWithoutExtraError(t *testing.T) {
	socketPath := filepath.Join(t.TempDir(), "doctor.sock")
	setTestConfig(t, socketPath)
	configPath := os.Getenv("THALWEG_CONFIG_PATH")
	if err := os.Chmod(configPath, 0o644); err != nil {
		t.Fatalf("broaden doctor test config: %v", err)
	}
	t.Setenv("XDG_DATA_HOME", t.TempDir())

	var stdout, stderr bytes.Buffer
	code := Run(
		[]string{"doctor", "--json"},
		strings.NewReader(""),
		&stdout,
		&stderr,
	)
	if code != 1 {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
	if stderr.Len() != 0 {
		t.Fatalf("doctor JSON wrote extra stderr: %q", stderr.String())
	}
	var report doctorReport
	if err := json.Unmarshal(stdout.Bytes(), &report); err != nil {
		t.Fatalf("decode failed doctor report: %v\n%s", err, stdout.String())
	}
	if report.Healthy || report.Summary.Failed == 0 {
		t.Fatalf("doctor report = %#v", report)
	}
	if check := findDoctorCheck(report.Checks, "config.file"); check.Status != "fail" {
		t.Fatalf("config check = %#v", check)
	}
}

func TestDoctorDebugDetectsP2PPortConflict(t *testing.T) {
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("reserve conflicting p2p port: %v", err)
	}
	defer listener.Close()
	_, port, err := net.SplitHostPort(listener.Addr().String())
	if err != nil {
		t.Fatalf("parse conflicting p2p port: %v", err)
	}
	runner := doctorRunner{
		debug: true,
		report: doctorReport{
			Healthy: true,
			Checks:  make([]doctorCheck, 0),
		},
	}
	runner.checkP2P(
		localConfig{P2PListenAddresses: []string{"/ip4/127.0.0.1/tcp/" + port}},
		doctorNetworkStatus{},
		false,
	)
	check := findDoctorCheck(runner.report.Checks, "p2p.bind")
	if check.Status != "fail" || !strings.Contains(check.Summary, "unavailable") {
		t.Fatalf("p2p bind check = %#v", check)
	}
}

func findDoctorCheck(checks []doctorCheck, id string) doctorCheck {
	for _, check := range checks {
		if check.ID == id {
			return check
		}
	}
	return doctorCheck{}
}
