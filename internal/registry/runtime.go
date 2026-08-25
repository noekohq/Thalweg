package registry

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"sync"
)

type Config struct {
	RegistryPath string
	SnapshotPath string
	LogPath      string
	Host         Host
}

type Runtime struct {
	config Config

	mu           sync.Mutex
	ctx          context.Context
	cancel       context.CancelFunc
	snapshot     Snapshot
	workers      map[string]*worker
	manualStop   map[string]bool
	resetAllowed map[string]bool
	started      bool
	lastError    string
}

func New(config Config) (*Runtime, error) {
	if config.RegistryPath == "" || config.SnapshotPath == "" || config.LogPath == "" {
		return nil, fmt.Errorf("registry, snapshot, and log paths are required")
	}
	if config.Host == nil {
		return nil, fmt.Errorf("registry host is required")
	}
	return &Runtime{
		config: config, workers: make(map[string]*worker), manualStop: make(map[string]bool),
		resetAllowed: make(map[string]bool),
	}, nil
}

func (r *Runtime) Start(parent context.Context) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.started {
		return fmt.Errorf("registry runtime is already started")
	}
	r.ctx, r.cancel = context.WithCancel(parent)
	snapshot, found, err := LoadSnapshot(r.config.SnapshotPath)
	if err != nil {
		r.lastError = err.Error()
		r.started = true
		return err
	}
	if !found {
		snapshot, err = Load(r.config.RegistryPath)
		if err != nil {
			r.lastError = err.Error()
			r.started = true
			return err
		}
		if err := WriteSnapshot(r.config.SnapshotPath, snapshot); err != nil {
			r.lastError = err.Error()
			r.started = true
			return err
		}
	}
	r.snapshot = snapshot
	r.started = true
	r.reconcileLocked(snapshot)
	return nil
}

func (r *Runtime) Close() error {
	r.mu.Lock()
	if !r.started {
		r.mu.Unlock()
		return nil
	}
	if r.cancel != nil {
		r.cancel()
	}
	workers := make([]*worker, 0, len(r.workers))
	for _, current := range r.workers {
		workers = append(workers, current)
	}
	r.workers = make(map[string]*worker)
	r.started = false
	r.mu.Unlock()
	for _, current := range workers {
		current.stop()
	}
	return nil
}

func (r *Runtime) Reload() (Status, error) {
	candidate, err := Load(r.config.RegistryPath)
	if err != nil {
		r.recordError(err)
		return r.Status(), err
	}
	r.mu.Lock()
	if !r.started {
		r.mu.Unlock()
		return Status{}, fmt.Errorf("registry runtime is not started")
	}
	old := definitionsByName(r.snapshot.Definitions)
	for _, definition := range candidate.Definitions {
		previous, exists := old[definition.Name()]
		if !exists || previous.Kind == KindSource || previous.Digest == definition.Digest {
			continue
		}
		if statefulSelectionChanged(previous, definition) && !r.resetAllowed[definition.Name()] {
			r.mu.Unlock()
			err := fmt.Errorf("stateful selection for %q changed; run `thalweg registry reset --yes %s` before reloading", definition.Name(), definition.Name())
			r.recordError(err)
			return r.Status(), err
		}
	}
	if err := WriteSnapshot(r.config.SnapshotPath, candidate); err != nil {
		r.mu.Unlock()
		r.recordError(err)
		return r.Status(), err
	}
	r.snapshot = candidate
	r.lastError = ""
	r.manualStop = make(map[string]bool)
	r.resetAllowed = make(map[string]bool)
	r.reconcileLocked(candidate)
	r.mu.Unlock()
	return r.Status(), nil
}

func (r *Runtime) StartDefinition(name string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	definition, found := findDefinition(r.snapshot.Definitions, name)
	if !found {
		return fmt.Errorf("registry definition %q is not accepted", name)
	}
	if !definition.Enabled() {
		return fmt.Errorf("registry definition %q is disabled in YAML", name)
	}
	delete(r.manualStop, name)
	if current := r.workers[name]; current != nil {
		return nil
	}
	r.startWorkerLocked(definition)
	return nil
}

func (r *Runtime) StopDefinition(name string) error {
	r.mu.Lock()
	definition, found := findDefinition(r.snapshot.Definitions, name)
	if !found {
		r.mu.Unlock()
		return fmt.Errorf("registry definition %q is not accepted", name)
	}
	r.manualStop[name] = true
	current := r.workers[name]
	delete(r.workers, name)
	r.mu.Unlock()
	if current != nil {
		current.stop()
	}
	_ = definition
	return nil
}

func (r *Runtime) RestartDefinition(name string) error {
	if err := r.StopDefinition(name); err != nil {
		return err
	}
	return r.StartDefinition(name)
}

func (r *Runtime) ResetDefinition(name string) error {
	r.mu.Lock()
	definition, found := findDefinition(r.snapshot.Definitions, name)
	if !found {
		r.mu.Unlock()
		return fmt.Errorf("registry definition %q is not accepted", name)
	}
	r.manualStop[name] = true
	r.resetAllowed[name] = true
	current := r.workers[name]
	delete(r.workers, name)
	r.mu.Unlock()
	if current != nil {
		current.stop()
	}
	if definition.Kind == KindSink || definition.Kind == KindProcessor {
		if err := r.config.Host.DeleteDurable(context.Background(), definition.Spec.Network, definition.DurableName()); err != nil {
			return err
		}
	}
	return nil
}

func (r *Runtime) Status() Status {
	r.mu.Lock()
	defer r.mu.Unlock()
	status := Status{
		Version: SnapshotVersion, State: "healthy", RegistryPath: r.config.RegistryPath,
		SnapshotPath: r.config.SnapshotPath, AcceptedAt: r.snapshot.AcceptedAt,
		Definitions: make([]DefinitionStatus, 0, len(r.snapshot.Definitions)), LastError: r.lastError,
	}
	if !r.started {
		status.State = "stopped"
	}
	for _, definition := range r.snapshot.Definitions {
		var item DefinitionStatus
		if current := r.workers[definition.Name()]; current != nil {
			item = current.status()
		} else {
			state := "disabled"
			if definition.Enabled() && r.manualStop[definition.Name()] {
				state = "stopped"
			} else if definition.Enabled() {
				state = "inactive"
			}
			item = baseStatus(definition, state)
		}
		status.Definitions = append(status.Definitions, item)
		switch item.RuntimeState {
		case "running", "waiting", "completed":
			status.Healthy++
		case "backoff", "failed":
			status.Degraded++
		default:
			status.Stopped++
		}
	}
	if disk, err := Load(r.config.RegistryPath); err != nil {
		status.PendingReload = true
	} else {
		status.PendingReload = snapshotDigest(disk) != snapshotDigest(r.snapshot)
	}
	if status.State != "stopped" && (status.Degraded > 0 || status.LastError != "") {
		status.State = "degraded"
	}
	return status
}

func (r *Runtime) Inspect(name string) (DefinitionStatus, error) {
	status := r.Status()
	for _, definition := range status.Definitions {
		if definition.Name == name {
			return definition, nil
		}
	}
	return DefinitionStatus{}, fmt.Errorf("registry definition %q is not accepted", name)
}

func (r *Runtime) LogPath(name string) (string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, found := findDefinition(r.snapshot.Definitions, name); !found {
		return "", fmt.Errorf("registry definition %q is not accepted", name)
	}
	return filepath.Join(r.config.LogPath, name+".log"), nil
}

func (r *Runtime) reconcileLocked(snapshot Snapshot) {
	desired := definitionsByName(snapshot.Definitions)
	for name, current := range r.workers {
		definition, exists := desired[name]
		if !exists || !definition.Enabled() || definition.Digest != current.definition.Digest {
			delete(r.workers, name)
			current.stop()
		}
	}
	for _, definition := range snapshot.Definitions {
		if !definition.Enabled() || r.manualStop[definition.Name()] || r.workers[definition.Name()] != nil {
			continue
		}
		r.startWorkerLocked(definition)
	}
}

func (r *Runtime) startWorkerLocked(definition Definition) {
	current := newWorker(r.ctx, definition, r.config.Host, r.config.LogPath)
	r.workers[definition.Name()] = current
	current.start()
}

func (r *Runtime) recordError(err error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.lastError = err.Error()
}

func baseStatus(definition Definition, state string) DefinitionStatus {
	desired := "running"
	if !definition.Enabled() {
		desired = "disabled"
	}
	return DefinitionStatus{
		Name: definition.Name(), Kind: definition.Kind, DesiredState: desired, RuntimeState: state,
		Network: definition.Spec.Network, Stream: definition.Spec.Stream,
		Streams: append([]string(nil), definition.Spec.Events.Streams...), Labels: definition.Metadata.Labels,
		Digest: definition.Digest, SourceFile: definition.SourceFile,
	}
}

func definitionsByName(definitions []Definition) map[string]Definition {
	result := make(map[string]Definition, len(definitions))
	for _, definition := range definitions {
		result[definition.Name()] = definition
	}
	return result
}

func findDefinition(definitions []Definition, name string) (Definition, bool) {
	for _, definition := range definitions {
		if definition.Name() == name {
			return definition, true
		}
	}
	return Definition{}, false
}

func statefulSelectionChanged(first, second Definition) bool {
	if first.Kind != second.Kind || first.Spec.Network != second.Spec.Network || first.Spec.Events.Start != second.Spec.Events.Start {
		return true
	}
	return !equalStringSlices(first.Spec.Events.Streams, second.Spec.Events.Streams)
}

func equalStringSlices(first, second []string) bool {
	if len(first) != len(second) {
		return false
	}
	a := append([]string(nil), first...)
	b := append([]string(nil), second...)
	sort.Strings(a)
	sort.Strings(b)
	for index := range a {
		if a[index] != b[index] {
			return false
		}
	}
	return true
}

func snapshotDigest(snapshot Snapshot) string {
	definitions := append([]Definition(nil), snapshot.Definitions...)
	for index := range definitions {
		definitions[index].SourceFile = ""
	}
	encoded, _ := json.Marshal(definitions)
	return string(encoded)
}

func EnsureDirectories(root string) error {
	paths := []string{root, filepath.Join(root, "sources"), filepath.Join(root, "sinks"), filepath.Join(root, "processors"), filepath.Join(filepath.Dir(root), "env.d")}
	for _, path := range paths {
		if err := os.MkdirAll(path, 0o700); err != nil {
			return err
		}
		if err := os.Chmod(path, 0o700); err != nil {
			return err
		}
	}
	return nil
}
