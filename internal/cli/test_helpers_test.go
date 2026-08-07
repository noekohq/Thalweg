package cli

import (
	"bufio"
	"encoding/json"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func createUpgradeTestRepository(t *testing.T) (string, string) {
	t.Helper()
	root := t.TempDir()
	remotePath := filepath.Join(root, "remote.git")
	sourcePath := filepath.Join(root, "source")
	runTestCommand(t, root, "git", "init", "--bare", remotePath)
	runTestCommand(t, root, "git", "init", sourcePath)
	runTestCommand(t, sourcePath, "git", "config", "user.email", "thalweg@example.test")
	runTestCommand(t, sourcePath, "git", "config", "user.name", "Thalweg Test")
	if err := os.MkdirAll(filepath.Join(sourcePath, "scripts"), 0o700); err != nil {
		t.Fatalf("create test scripts directory: %v", err)
	}
	if err := os.WriteFile(
		filepath.Join(sourcePath, "scripts", "install.sh"),
		[]byte("#!/bin/sh\nset -eu\nmkdir -p \"$THALWEG_INSTALL_DIR\"\nprintf 'installed\\n' >\"$THALWEG_INSTALL_DIR/upgrade-marker\"\n"),
		0o700,
	); err != nil {
		t.Fatalf("write test installer: %v", err)
	}
	runTestCommand(t, sourcePath, "git", "add", "scripts/install.sh")
	runTestCommand(t, sourcePath, "git", "commit", "-m", "initial")
	runTestCommand(t, sourcePath, "git", "remote", "add", "origin", remotePath)
	runTestCommand(t, sourcePath, "git", "push", "-u", "origin", "HEAD")
	commit := strings.TrimSpace(runTestCommand(t, sourcePath, "git", "rev-parse", "HEAD"))
	return sourcePath, commit
}

func runTestCommand(t *testing.T, directory, name string, args ...string) string {
	t.Helper()
	command := exec.Command(name, args...)
	command.Dir = directory
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("%s %s: %v\n%s", name, strings.Join(args, " "), err, output)
	}
	return string(output)
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
