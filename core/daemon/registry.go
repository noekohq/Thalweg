package daemon

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"thalweg/internal/registry"
)

type daemonRegistryHost struct {
	daemon *Daemon
}

func (h daemonRegistryHost) Ingest(_ context.Context, network, stream, occurredAt, eventID string, payload json.RawMessage) (registry.Event, error) {
	event, err := h.daemon.ingest(network, stream, occurredAt, eventID, payload)
	if err != nil {
		return registry.Event{}, err
	}
	return registry.Event{
		ID: event.ID, Network: event.Network, Stream: event.Stream,
		OccurredAt: event.OccurredAt, InsertedAt: event.InsertedAt,
		PropagatedAt: event.PropagatedAt, Counter: event.Counter,
		DeviceID: event.DeviceID, Payload: event.Payload,
	}, nil
}

func (h daemonRegistryHost) CreateDurable(_ context.Context, network, name string, streams []string, start string) error {
	_, err := h.daemon.createDurableSiphon(network, name, streams, start)
	return err
}

func (h daemonRegistryHost) PollDurable(ctx context.Context, network, name string, limit int, wait time.Duration) (registry.DeliveryBatch, error) {
	delivery, err := h.daemon.waitForDurableSiphonContext(ctx, network, name, limit, wait)
	if err != nil {
		return registry.DeliveryBatch{}, err
	}
	events := make([]registry.Event, 0, len(delivery.Events))
	for _, event := range delivery.Events {
		events = append(events, registry.Event{
			ID: event.ID, Network: event.Network, Stream: event.Stream,
			OccurredAt: event.OccurredAt, InsertedAt: event.InsertedAt,
			PropagatedAt: event.PropagatedAt, Counter: event.Counter,
			DeviceID: event.DeviceID, Payload: event.Payload,
		})
	}
	return registry.DeliveryBatch{
		Version: delivery.Version, Name: delivery.Name, Network: delivery.Network,
		DeliveryID: delivery.DeliveryID, CursorFrom: delivery.CursorFrom,
		CursorThrough: delivery.CursorThrough, Attempt: delivery.Attempt, Events: events,
	}, nil
}

func (h daemonRegistryHost) AcknowledgeDurable(_ context.Context, network, name, deliveryID string) error {
	_, err := h.daemon.acknowledgeDurableSiphon(network, name, deliveryID)
	return err
}

func (h daemonRegistryHost) DeleteDurable(_ context.Context, network, name string) error {
	return h.daemon.deleteDurableSiphon(network, name)
}

func (d *Daemon) registerRegistryRoutes() {
	d.Register("registry_status", func(_ *clientConn, _ json.RawMessage) (any, error) {
		if d.registry == nil {
			return nil, fmt.Errorf("registry runtime is not configured")
		}
		return d.registry.Status(), nil
	})
	d.Register("registry_list", func(_ *clientConn, _ json.RawMessage) (any, error) {
		if d.registry == nil {
			return nil, fmt.Errorf("registry runtime is not configured")
		}
		return d.registry.Status().Definitions, nil
	})
	d.Register("registry_inspect", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Name string `json:"name"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		if d.registry == nil {
			return nil, fmt.Errorf("registry runtime is not configured")
		}
		return d.registry.Inspect(args.Name)
	})
	d.Register("registry_reload", func(_ *clientConn, _ json.RawMessage) (any, error) {
		if d.registry == nil {
			return nil, fmt.Errorf("registry runtime is not configured")
		}
		return d.registry.Reload()
	})
	for action, operation := range map[string]func(string) error{
		"registry_start":   d.registryStart,
		"registry_stop":    d.registryStop,
		"registry_restart": d.registryRestart,
		"registry_reset":   d.registryReset,
	} {
		action, operation := action, operation
		d.Register(action, func(_ *clientConn, payload json.RawMessage) (any, error) {
			var args struct {
				Name string `json:"name"`
			}
			if err := json.Unmarshal(payload, &args); err != nil {
				return nil, err
			}
			if err := operation(args.Name); err != nil {
				return nil, err
			}
			return d.registry.Inspect(args.Name)
		})
	}
	d.Register("registry_log", func(_ *clientConn, payload json.RawMessage) (any, error) {
		var args struct {
			Name  string `json:"name"`
			Lines int    `json:"lines"`
		}
		if err := json.Unmarshal(payload, &args); err != nil {
			return nil, err
		}
		if d.registry == nil {
			return nil, fmt.Errorf("registry runtime is not configured")
		}
		if args.Lines <= 0 {
			args.Lines = 100
		}
		if args.Lines > 5000 {
			return nil, fmt.Errorf("lines must not exceed 5000")
		}
		path, err := d.registry.LogPath(args.Name)
		if err != nil {
			return nil, err
		}
		content, err := os.ReadFile(path)
		if err != nil && !os.IsNotExist(err) {
			return nil, err
		}
		lines := strings.Split(strings.TrimSuffix(string(content), "\n"), "\n")
		if len(lines) > args.Lines {
			lines = lines[len(lines)-args.Lines:]
		}
		if len(content) == 0 {
			lines = []string{}
		}
		return map[string]any{"name": args.Name, "path": path, "lines": lines}, nil
	})
}

func (d *Daemon) registryStart(name string) error {
	if d.registry == nil {
		return fmt.Errorf("registry runtime is not configured")
	}
	return d.registry.StartDefinition(name)
}

func (d *Daemon) registryStop(name string) error {
	if d.registry == nil {
		return fmt.Errorf("registry runtime is not configured")
	}
	return d.registry.StopDefinition(name)
}

func (d *Daemon) registryRestart(name string) error {
	if d.registry == nil {
		return fmt.Errorf("registry runtime is not configured")
	}
	return d.registry.RestartDefinition(name)
}

func (d *Daemon) registryReset(name string) error {
	if d.registry == nil {
		return fmt.Errorf("registry runtime is not configured")
	}
	return d.registry.ResetDefinition(name)
}
