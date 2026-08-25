package cli

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"thalweg/internal/registry"
)

func TestRegistryValidateRunsOffline(t *testing.T) {
	root := filepath.Join(t.TempDir(), "registry.d")
	if err := registry.EnsureDirectories(root); err != nil {
		t.Fatal(err)
	}
	definition := `apiVersion: thalweg.dev/v1alpha1
kind: Source
metadata: {name: notes}
spec:
  network: home
  stream: note
  runner: {type: exec, command: [/bin/echo, '{}'], mode: once}
`
	if err := os.WriteFile(filepath.Join(root, "sources", "notes.yaml"), []byte(definition), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("THALWEG_REGISTRY_PATH", root)
	var stdout, stderr bytes.Buffer
	code := Run([]string{"registry", "validate"}, strings.NewReader(""), &stdout, &stderr)
	if code != 0 || !strings.Contains(stdout.String(), "1 definition") {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
}

func TestRegistryStatusUsesDaemonIPC(t *testing.T) {
	socketPath := startFakeDaemon(t, func(request ipcRequest) (any, string) {
		if request.Action != "registry_status" {
			t.Fatalf("action = %q", request.Action)
		}
		return registry.Status{
			Version: 1, State: "running", Healthy: 1,
			Definitions: []registry.DefinitionStatus{{Name: "notes", Kind: "Source", RuntimeState: "running", Network: "home"}},
		}, ""
	})
	setTestConfig(t, socketPath)
	var stdout, stderr bytes.Buffer
	code := Run([]string{"registry", "status"}, strings.NewReader(""), &stdout, &stderr)
	if code != 0 || !strings.Contains(stdout.String(), "notes") || !strings.Contains(stdout.String(), "1 healthy") {
		t.Fatalf("exit=%d stdout=%q stderr=%q", code, stdout.String(), stderr.String())
	}
}

func TestRegistryResetRequiresConfirmation(t *testing.T) {
	setTestConfig(t, "/tmp/not-used.sock")
	var stdout, stderr bytes.Buffer
	code := Run([]string{"registry", "reset", "archive"}, strings.NewReader(""), &stdout, &stderr)
	if code == 0 || !strings.Contains(stderr.String(), "--yes") {
		t.Fatalf("exit=%d stderr=%q", code, stderr.String())
	}
}
