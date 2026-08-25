package registry

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

type fakeHost struct {
	mu        sync.Mutex
	ingested  []Event
	delivery  DeliveryBatch
	created   []string
	acked     []string
	deleted   []string
	delivered bool
}

func (h *fakeHost) Ingest(_ context.Context, network, stream, occurredAt, eventID string, payload json.RawMessage) (Event, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	event := Event{ID: eventID, Network: network, Stream: stream, OccurredAt: occurredAt, Payload: append(json.RawMessage(nil), payload...)}
	h.ingested = append(h.ingested, event)
	return event, nil
}

func (h *fakeHost) CreateDurable(_ context.Context, _, name string, _ []string, _ string) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.created = append(h.created, name)
	return nil
}

func (h *fakeHost) PollDurable(ctx context.Context, _, _ string, _ int, _ time.Duration) (DeliveryBatch, error) {
	h.mu.Lock()
	if !h.delivered && h.delivery.DeliveryID != "" {
		h.delivered = true
		delivery := h.delivery
		h.mu.Unlock()
		return delivery, nil
	}
	h.mu.Unlock()
	select {
	case <-ctx.Done():
		return DeliveryBatch{}, ctx.Err()
	case <-time.After(10 * time.Millisecond):
		return DeliveryBatch{}, nil
	}
}

func (h *fakeHost) AcknowledgeDurable(_ context.Context, _, _, deliveryID string) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.acked = append(h.acked, deliveryID)
	return nil
}

func (h *fakeHost) DeleteDurable(_ context.Context, _, name string) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.deleted = append(h.deleted, name)
	return nil
}

func TestRuntimeRunsOnceSourceAndUsesAcceptedSnapshot(t *testing.T) {
	root := registryTestRoot(t)
	path := filepath.Join(root, "sources", "notes.yaml")
	writeRegistryFile(t, path, sourceDefinition("notes", "one"))
	host := &fakeHost{}
	runtime := newTestRuntime(t, root, host)
	if err := runtime.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	defer runtime.Close()
	waitFor(t, func() bool { return runtime.Status().Definitions[0].RuntimeState == "completed" })
	host.mu.Lock()
	if len(host.ingested) != 1 || string(host.ingested[0].Payload) != `{"value":"one"}` {
		t.Fatalf("ingested = %#v", host.ingested)
	}
	host.mu.Unlock()

	writeRegistryFile(t, path, "not: valid: yaml")
	if _, err := runtime.Reload(); err == nil {
		t.Fatal("expected invalid reload")
	}
	if runtime.Status().Definitions[0].Digest == "" {
		t.Fatal("accepted definition was lost")
	}
}

func TestRuntimeSinkAcknowledgesSuccessfulDelivery(t *testing.T) {
	root := registryTestRoot(t)
	writeRegistryFile(t, filepath.Join(root, "sinks", "archive.yaml"), `
apiVersion: thalweg.dev/v1alpha1
kind: Sink
metadata: {name: archive}
spec:
  network: home
  events: {streams: [note], start: earliest}
  delivery: {maxEvents: 5, wait: 10ms}
  runner: {type: exec, command: [/bin/sh, -c, "cat >/dev/null"]}
`)
	host := &fakeHost{delivery: DeliveryBatch{
		Version: 1, DeliveryID: "delivery-1", Attempt: 1, CursorThrough: 1,
		Events: []Event{{ID: "event-1", Network: "home", Stream: "note", Payload: json.RawMessage(`{"ok":true}`)}},
	}}
	runtime := newTestRuntime(t, root, host)
	if err := runtime.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	defer runtime.Close()
	waitFor(t, func() bool {
		host.mu.Lock()
		defer host.mu.Unlock()
		return len(host.acked) == 1
	})
	if got := runtime.Status().Definitions[0].Processed; got != 1 {
		t.Fatalf("processed = %d", got)
	}
}

func TestProcessorOutputIdentityIsDeterministic(t *testing.T) {
	definition := Definition{Kind: KindProcessor, Metadata: Metadata{Name: "triage"}, Spec: Spec{Network: "home"}}
	first := deterministicOutputID(definition, "delivery-1", 2)
	second := deterministicOutputID(definition, "delivery-1", 2)
	if first != second || first == deterministicOutputID(definition, "delivery-1", 3) {
		t.Fatalf("unexpected deterministic identities: %q %q", first, second)
	}
}

func TestRuntimeResetDeletesConsumerState(t *testing.T) {
	root := registryTestRoot(t)
	writeRegistryFile(t, filepath.Join(root, "sinks", "archive.yaml"), `
apiVersion: thalweg.dev/v1alpha1
kind: Sink
metadata: {name: archive}
spec:
  network: home
  events: {streams: [note], start: latest}
  runner: {type: exec, command: [/usr/bin/true]}
`)
	host := &fakeHost{}
	runtime := newTestRuntime(t, root, host)
	if err := runtime.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	defer runtime.Close()
	if err := runtime.ResetDefinition("archive"); err != nil {
		t.Fatal(err)
	}
	host.mu.Lock()
	defer host.mu.Unlock()
	if len(host.deleted) != 1 || host.deleted[0] != "thalweg.registry.v1.sink.archive" {
		t.Fatalf("deleted = %#v", host.deleted)
	}
}

func TestRuntimeRequiresResetWhenLeavingStatefulDefinition(t *testing.T) {
	root := registryTestRoot(t)
	path := filepath.Join(root, "sinks", "archive.yaml")
	writeRegistryFile(t, path, `
apiVersion: thalweg.dev/v1alpha1
kind: Sink
metadata: {name: archive}
spec:
  network: home
  events: {streams: [note], start: earliest}
  delivery: {wait: 10ms}
  runner: {type: exec, command: [/usr/bin/true]}
`)
	host := &fakeHost{}
	runtime := newTestRuntime(t, root, host)
	if err := runtime.Start(context.Background()); err != nil {
		t.Fatal(err)
	}
	defer runtime.Close()
	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	writeRegistryFile(t, filepath.Join(root, "sources", "archive.yaml"), sourceDefinition("archive", "changed"))
	if _, err := runtime.Reload(); err == nil {
		t.Fatal("expected stateful kind change to require reset")
	}
	if err := runtime.ResetDefinition("archive"); err != nil {
		t.Fatal(err)
	}
	if _, err := runtime.Reload(); err != nil {
		t.Fatal(err)
	}
	waitFor(t, func() bool { return runtime.Status().Definitions[0].RuntimeState == "completed" })
}

func newTestRuntime(t *testing.T, root string, host Host) *Runtime {
	t.Helper()
	state := filepath.Join(t.TempDir(), "runtime")
	runtime, err := New(Config{
		RegistryPath: root, SnapshotPath: filepath.Join(state, "accepted-v1.json"),
		LogPath: filepath.Join(state, "logs"), Host: host,
	})
	if err != nil {
		t.Fatal(err)
	}
	return runtime
}

func sourceDefinition(name, value string) string {
	return `apiVersion: thalweg.dev/v1alpha1
kind: Source
metadata: {name: ` + name + `}
spec:
  network: home
  stream: note
  runner:
    type: exec
    command: [/bin/echo, '{"value":"` + value + `"}']
    mode: once
`
}

func waitFor(t *testing.T, condition func() bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if condition() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("condition was not met")
}
