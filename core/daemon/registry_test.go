package daemon

import (
	"encoding/json"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	"thalweg/internal/registry"
)

func TestDaemonRegistryRunsSourceAndExposesStatus(t *testing.T) {
	root := t.TempDir()
	registryPath := filepath.Join(root, "config", "registry.d")
	if err := registry.EnsureDirectories(registryPath); err != nil {
		t.Fatal(err)
	}
	definition := `apiVersion: thalweg.dev/v1alpha1
kind: Source
metadata: {name: daemon-smoke}
spec:
  network: home
  stream: system:registry_test
  runner:
    type: exec
    command: [/bin/echo, '{"working":true}']
    mode: once
`
	if err := os.WriteFile(filepath.Join(registryPath, "sources", "smoke.yaml"), []byte(definition), 0o600); err != nil {
		t.Fatal(err)
	}
	socketPath := shortSocketPath(t, "registry.sock")
	d, err := NewWithConfig(Config{
		SocketPath: socketPath, DBPath: filepath.Join(root, "storage", "badger"),
		P2PListenAddresses: []string{"/ip4/127.0.0.1/tcp/0"}, RegistryPath: registryPath,
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, _, err := d.memberships.create("home"); err != nil {
		t.Fatal(err)
	}
	startErr := make(chan error, 1)
	go func() { startErr <- d.Start() }()
	conn := waitForDaemonSocket(t, socketPath, startErr)
	defer conn.Close()
	defer d.Close()

	deadline := time.Now().Add(3 * time.Second)
	for {
		events, err := d.queryOrdered("home", []string{"system:registry_test"}, "", "", 10, "asc")
		if err != nil {
			t.Fatal(err)
		}
		if len(events) == 1 {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("registry source did not ingest an event")
		}
		time.Sleep(10 * time.Millisecond)
	}

	request := Message{ID: "registry-status", ProtocolVersion: currentLocalProtocolVersion, Action: "registry_status", Payload: json.RawMessage(`{}`)}
	if err := json.NewEncoder(conn).Encode(request); err != nil {
		t.Fatal(err)
	}
	var response Response
	if err := json.NewDecoder(conn).Decode(&response); err != nil {
		t.Fatal(err)
	}
	if !response.Success {
		t.Fatalf("registry status failed: %#v", response)
	}
	encoded, err := json.Marshal(response.Data)
	if err != nil {
		t.Fatal(err)
	}
	var status registry.Status
	if err := json.Unmarshal(encoded, &status); err != nil {
		t.Fatal(err)
	}
	if len(status.Definitions) != 1 || status.Definitions[0].Name != "daemon-smoke" {
		t.Fatalf("registry status = %#v", status)
	}
}

func TestPublicDurableSiphonCannotUseRegistryNamespace(t *testing.T) {
	d := newTestDaemon(t)
	client, server := net.Pipe()
	done := make(chan struct{})
	go func() {
		d.Handle(server)
		close(done)
	}()
	request := Message{
		ID: "reserved", ProtocolVersion: currentLocalProtocolVersion, Action: "durable_siphon_create",
		Payload: json.RawMessage(`{"network":"home","name":"thalweg.registry.v1.sink.hidden","start":"latest"}`),
	}
	if err := json.NewEncoder(client).Encode(request); err != nil {
		t.Fatal(err)
	}
	var response Response
	if err := json.NewDecoder(client).Decode(&response); err != nil {
		t.Fatal(err)
	}
	if response.Success {
		t.Fatal("reserved durable siphon name was accepted")
	}
	client.Close()
	<-done
}
