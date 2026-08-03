package console

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"time"
)

const (
	defaultEventLimit = 100
	recentEventWindow = 24 * time.Hour
)

type Service struct {
	Caller     Caller
	Now        func() time.Time
	EventLimit int
}

type Snapshot struct {
	CapturedAt      string          `json:"capturedAt"`
	State           string          `json:"state"`
	Error           string          `json:"error,omitempty"`
	Status          NodeStatus      `json:"status"`
	Networks        []Network       `json:"networks"`
	Peers           []MeshPeer      `json:"peers"`
	SelectedNetwork string          `json:"selectedNetwork,omitempty"`
	Events          []Event         `json:"events"`
	Streams         []StreamSummary `json:"streams"`
	Warnings        []string        `json:"warnings"`
	Features        []Feature       `json:"features"`
}

type NodeStatus struct {
	PeerID                string              `json:"peerId"`
	DeviceID              string              `json:"deviceId"`
	Addresses             []string            `json:"addresses"`
	AddressGroups         map[string][]string `json:"addressGroups"`
	DaemonVersion         string              `json:"daemonVersion"`
	ProtocolVersion       int                 `json:"protocolVersion"`
	StorageSchemaVersion  int                 `json:"storageSchemaVersion"`
	MeshProtocolVersion   int                 `json:"meshProtocolVersion"`
	MembershipFileVersion int                 `json:"membershipFileVersion"`
}

type Network struct {
	Name string `json:"name"`
	ID   string `json:"id"`
}

type MeshPeer struct {
	Network struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	} `json:"network"`
	PeerID              string `json:"peerId"`
	Address             string `json:"address"`
	State               string `json:"state"`
	Connected           bool   `json:"connected"`
	LastAttemptAt       string `json:"lastAttemptAt,omitempty"`
	LastSuccessAt       string `json:"lastSuccessAt,omitempty"`
	LastError           string `json:"lastError,omitempty"`
	NextAttemptAt       string `json:"nextAttemptAt,omitempty"`
	ConsecutiveFailures int    `json:"consecutiveFailures"`
}

type Event struct {
	ID           string          `json:"id"`
	Network      string          `json:"network"`
	Stream       string          `json:"stream"`
	OccurredAt   string          `json:"occurredAt"`
	InsertedAt   string          `json:"insertedAt"`
	PropagatedAt string          `json:"propagatedAt"`
	Counter      uint64          `json:"counter"`
	DeviceID     string          `json:"deviceId"`
	Payload      json.RawMessage `json:"payload"`
}

type StreamSummary struct {
	Name       string `json:"name"`
	EventCount int    `json:"eventCount"`
	LatestAt   string `json:"latestAt,omitempty"`
}

type Feature struct {
	Name      string `json:"name"`
	Supported bool   `json:"supported"`
	Detail    string `json:"detail"`
}

func NewService(socketPath string) Service {
	return Service{
		Caller: IPCClient{SocketPath: socketPath},
		Now:    time.Now,
	}
}

func (s Service) Snapshot(ctx context.Context, requestedNetwork string) Snapshot {
	now := time.Now()
	if s.Now != nil {
		now = s.Now()
	}
	result := Snapshot{
		CapturedAt: now.UTC().Format(time.RFC3339Nano),
		State:      "online",
		Status: NodeStatus{
			Addresses:     make([]string, 0),
			AddressGroups: make(map[string][]string),
		},
		Networks: make([]Network, 0),
		Peers:    make([]MeshPeer, 0),
		Events:   make([]Event, 0),
		Streams:  make([]StreamSummary, 0),
		Warnings: []string{
			"Local events trigger coalesced synchronization to authorized peers; periodic anti-entropy remains the delivery fallback.",
			"Near-immediate replication does not yet provide siphon watermarks or late-window replay guarantees.",
			"Event results are limited to a recent 24-hour diagnostic window.",
		},
		Features: prototypeFeatures(),
	}
	if s.Caller == nil {
		result.State = "offline"
		result.Error = "console daemon caller is not configured"
		return result
	}
	if err := s.Caller.Call(ctx, "network_status", map[string]any{}, &result.Status); err != nil {
		result.State = "offline"
		result.Error = err.Error()
		return result
	}
	if result.Status.AddressGroups == nil {
		result.Status.AddressGroups = map[string][]string{}
	}

	if err := s.Caller.Call(ctx, "network_list", map[string]any{}, &result.Networks); err != nil {
		result.State = "degraded"
		result.Error = fmt.Sprintf("network list unavailable: %v", err)
		return result
	}
	sort.Slice(result.Networks, func(i, j int) bool {
		return result.Networks[i].Name < result.Networks[j].Name
	})

	result.SelectedNetwork = selectNetwork(result.Networks, requestedNetwork)
	if requestedNetwork != "" && result.SelectedNetwork != requestedNetwork {
		result.Warnings = append(
			result.Warnings,
			fmt.Sprintf("Requested network %q is not mounted; showing %q.", requestedNetwork, result.SelectedNetwork),
		)
	}
	if result.SelectedNetwork == "" {
		return result
	}
	if err := s.Caller.Call(ctx, "mesh_peer_list", map[string]any{"network": result.SelectedNetwork}, &result.Peers); err != nil {
		result.Warnings = append(result.Warnings, fmt.Sprintf("Peer health unavailable: %v", err))
	}
	if result.Peers == nil {
		result.Peers = make([]MeshPeer, 0)
	}

	limit := s.EventLimit
	if limit <= 0 {
		limit = defaultEventLimit
	}
	payload := map[string]any{
		"network": result.SelectedNetwork,
		"streams": []string{},
		"from":    now.Add(-recentEventWindow).UTC().Format(time.RFC3339Nano),
		"to":      "",
		"limit":   limit,
		"order":   "desc",
	}
	if err := s.Caller.Call(ctx, "event_query", payload, &result.Events); err != nil {
		result.State = "degraded"
		result.Error = fmt.Sprintf("recent events unavailable: %v", err)
		return result
	}
	if result.Events == nil {
		result.Events = make([]Event, 0)
	}
	result.Streams = summarizeStreams(result.Events)
	return result
}

func selectNetwork(networks []Network, requested string) string {
	for _, network := range networks {
		if network.Name == requested {
			return requested
		}
	}
	if len(networks) == 0 {
		return ""
	}
	return networks[0].Name
}

func summarizeStreams(events []Event) []StreamSummary {
	byName := make(map[string]StreamSummary)
	for _, event := range events {
		summary := byName[event.Stream]
		summary.Name = event.Stream
		summary.EventCount++
		if event.OccurredAt > summary.LatestAt {
			summary.LatestAt = event.OccurredAt
		}
		byName[event.Stream] = summary
	}
	result := make([]StreamSummary, 0, len(byName))
	for _, summary := range byName {
		result = append(result, summary)
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].LatestAt == result[j].LatestAt {
			return result[i].Name < result[j].Name
		}
		return result[i].LatestAt > result[j].LatestAt
	})
	return result
}

func prototypeFeatures() []Feature {
	return []Feature{
		{Name: "Local timeline", Supported: true, Detail: "Status, memberships, streams, and recent events"},
		{Name: "Enrollment", Supported: true, Detail: "Available through the operator CLI"},
		{Name: "Peer health", Supported: true, Detail: "Known peer connection, retry, and last-sync state"},
		{Name: "Storage summary", Supported: false, Detail: "Daemon aggregate read contract is not implemented"},
		{Name: "Processing health", Supported: false, Detail: "Durable siphons and executions are not implemented"},
	}
}
