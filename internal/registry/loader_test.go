package registry

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLoadAppliesStrictSourceDefaults(t *testing.T) {
	root := registryTestRoot(t)
	writeRegistryFile(t, filepath.Join(root, "sources", "notes.yaml"), `
apiVersion: thalweg.dev/v1alpha1
kind: Source
metadata:
  name: notes
spec:
  network: home
  stream: user:note
  runner:
    type: exec
    command: [/bin/echo, '{"content":"hello"}']
    mode: once
`)
	snapshot, err := Load(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(snapshot.Definitions) != 1 {
		t.Fatalf("definitions = %d", len(snapshot.Definitions))
	}
	definition := snapshot.Definitions[0]
	if definition.Spec.Input.Format != "raw-ndjson" || definition.Digest == "" {
		t.Fatalf("defaults/digest missing: %#v", definition)
	}
	if definition.Spec.Runner.WorkingDirectory != filepath.Join(root, "sources") {
		t.Fatalf("working directory = %q", definition.Spec.Runner.WorkingDirectory)
	}
}

func TestLoadRejectsUnknownFieldsAndMultipleDocuments(t *testing.T) {
	for name, content := range map[string]string{
		"unknown": `apiVersion: thalweg.dev/v1alpha1
kind: Source
metadata: {name: notes}
spec:
  network: home
  stream: note
  mystery: true
  runner: {type: exec, command: [/bin/echo], mode: once}
`,
		"multiple": `apiVersion: thalweg.dev/v1alpha1
kind: Source
metadata: {name: notes}
spec:
  network: home
  stream: note
  runner: {type: exec, command: [/bin/echo], mode: once}
---
{}
`,
	} {
		t.Run(name, func(t *testing.T) {
			root := registryTestRoot(t)
			writeRegistryFile(t, filepath.Join(root, "sources", "notes.yaml"), content)
			if _, err := Load(root); err == nil {
				t.Fatal("expected validation failure")
			}
		})
	}
}

func TestLoadRejectsDuplicateNamesAcrossKindsAndUnsafeFiles(t *testing.T) {
	root := registryTestRoot(t)
	source := `apiVersion: thalweg.dev/v1alpha1
kind: Source
metadata: {name: shared}
spec:
  network: home
  stream: note
  runner: {type: exec, command: [/bin/echo], mode: once}
`
	sink := `apiVersion: thalweg.dev/v1alpha1
kind: Sink
metadata: {name: shared}
spec:
  network: home
  events: {streams: [note], start: latest}
  runner: {type: exec, command: [/usr/bin/true]}
`
	writeRegistryFile(t, filepath.Join(root, "sources", "source.yaml"), source)
	writeRegistryFile(t, filepath.Join(root, "sinks", "sink.yaml"), sink)
	if _, err := Load(root); err == nil || !strings.Contains(err.Error(), "duplicate") {
		t.Fatalf("duplicate error = %v", err)
	}
	if err := os.Remove(filepath.Join(root, "sinks", "sink.yaml")); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(root, "sources", "source.yaml")
	if err := os.Chmod(path, 0o666); err != nil {
		t.Fatal(err)
	}
	if _, err := Load(root); err == nil || !strings.Contains(err.Error(), "writable") {
		t.Fatalf("permission error = %v", err)
	}
}

func TestLoadResolvesRestrictedEnvironmentFilesAndExpansion(t *testing.T) {
	root := registryTestRoot(t)
	envPath := filepath.Join(filepath.Dir(root), "env.d", "local.env")
	if err := os.WriteFile(envPath, []byte("TOOL=/bin/echo\nVALUE=hello\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	writeRegistryFile(t, filepath.Join(root, "sources", "notes.yaml"), `
apiVersion: thalweg.dev/v1alpha1
kind: Source
metadata: {name: notes}
spec:
  network: home
  stream: note
  environment:
    inherit: false
    from: [local]
  runner:
    type: exec
    command: ["${TOOL}", "${VALUE}"]
    mode: once
`)
	snapshot, err := Load(root)
	if err != nil {
		t.Fatal(err)
	}
	definition := snapshot.Definitions[0]
	if got := definition.Spec.Runner.Command; len(got) != 2 || got[0] != "/bin/echo" || got[1] != "hello" {
		t.Fatalf("expanded command = %#v", got)
	}
}

func registryTestRoot(t *testing.T) string {
	t.Helper()
	root := filepath.Join(t.TempDir(), "registry.d")
	if err := EnsureDirectories(root); err != nil {
		t.Fatal(err)
	}
	return root
}

func writeRegistryFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(strings.TrimSpace(content)+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
}
