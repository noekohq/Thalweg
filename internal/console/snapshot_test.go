package console

import (
	"context"
	"encoding/json"
	"errors"
	"reflect"
	"strings"
	"testing"
	"time"
)

type fakeCall struct {
	action  string
	payload any
}

type fakeCaller struct {
	responses map[string]any
	errors    map[string]error
	calls     []fakeCall
}

func (f *fakeCaller) Call(_ context.Context, action string, payload, target any) error {
	f.calls = append(f.calls, fakeCall{action: action, payload: payload})
	if err := f.errors[action]; err != nil {
		return err
	}
	data, err := json.Marshal(f.responses[action])
	if err != nil {
		return err
	}
	return json.Unmarshal(data, target)
}

func TestSnapshotLoadsSharedConsoleState(t *testing.T) {
	now := time.Date(2026, 7, 30, 18, 0, 0, 0, time.UTC)
	caller := &fakeCaller{responses: map[string]any{
		"network_status": NodeStatus{
			PeerID: "peer-local", DeviceID: "device-local", DaemonVersion: "0.1.0-dev",
			ProtocolVersion: 1, StorageSchemaVersion: 4,
			AddressGroups: map[string][]string{"lan": {"/ip4/192.168.1.2/tcp/42422/p2p/peer-local"}},
		},
		"network_list":        []Network{{Name: "work", ID: "network-work"}, {Name: "home", ID: "network-home"}},
		"mesh_peer_list":      []MeshPeer{},
		"durable_siphon_list": []DurableSiphon{{Name: "archive", Network: "home", Cursor: 3}},
		"event_query": []Event{
			{ID: "one", Network: "home", Stream: "voice:note", OccurredAt: "2026-07-30T17:00:00.000000000Z", DeviceID: "device-local", Payload: json.RawMessage(`{"text":"hello"}`)},
			{ID: "two", Network: "home", Stream: "system:error", OccurredAt: "2026-07-30T17:30:00.000000000Z", DeviceID: "device-remote", Payload: json.RawMessage(`{"code":500}`)},
			{ID: "three", Network: "home", Stream: "voice:note", OccurredAt: "2026-07-30T17:45:00.000000000Z", DeviceID: "device-local", Payload: json.RawMessage(`{"text":"again"}`)},
		},
	}}
	service := Service{Caller: caller, Now: func() time.Time { return now }, EventLimit: 25}
	snapshot := service.Snapshot(context.Background(), "home")

	if snapshot.State != "online" || snapshot.SelectedNetwork != "home" {
		t.Fatalf("snapshot state/network = %q/%q", snapshot.State, snapshot.SelectedNetwork)
	}
	if got := []string{snapshot.Networks[0].Name, snapshot.Networks[1].Name}; !reflect.DeepEqual(got, []string{"home", "work"}) {
		t.Fatalf("sorted networks = %#v", got)
	}
	if len(snapshot.Streams) != 2 || snapshot.Streams[0].Name != "voice:note" || snapshot.Streams[0].EventCount != 2 {
		t.Fatalf("stream summaries = %#v", snapshot.Streams)
	}
	if len(snapshot.DurableSiphons) != 1 || snapshot.DurableSiphons[0].Name != "archive" {
		t.Fatalf("durable siphons = %#v", snapshot.DurableSiphons)
	}
	query := caller.calls[4].payload.(map[string]any)
	if query["network"] != "home" || query["limit"] != 25 || query["order"] != "desc" {
		t.Fatalf("event query payload = %#v", query)
	}
	if query["from"] != "2026-07-29T18:00:00Z" {
		t.Fatalf("event query from = %#v", query["from"])
	}
}

func TestSnapshotMakesDaemonFailureExplicit(t *testing.T) {
	caller := &fakeCaller{errors: map[string]error{"network_status": errors.New("socket unavailable")}}
	snapshot := (Service{Caller: caller}).Snapshot(context.Background(), "")
	if snapshot.State != "offline" || !strings.Contains(snapshot.Error, "socket unavailable") {
		t.Fatalf("offline snapshot = %#v", snapshot)
	}
	if snapshot.Events == nil || snapshot.Networks == nil || snapshot.Peers == nil || snapshot.Status.AddressGroups == nil {
		t.Fatalf("offline collections must encode as arrays: %#v", snapshot)
	}
}

func TestSnapshotFallsBackFromUnknownNetwork(t *testing.T) {
	caller := &fakeCaller{responses: map[string]any{
		"network_status":      NodeStatus{},
		"network_list":        []Network{{Name: "home", ID: "home-id"}},
		"mesh_peer_list":      []MeshPeer{},
		"durable_siphon_list": []DurableSiphon{},
		"event_query":         []Event{},
	}}
	snapshot := (Service{Caller: caller}).Snapshot(context.Background(), "missing")
	if snapshot.SelectedNetwork != "home" {
		t.Fatalf("selected network = %q", snapshot.SelectedNetwork)
	}
	if !strings.Contains(strings.Join(snapshot.Warnings, "\n"), `Requested network "missing"`) {
		t.Fatalf("warnings = %#v", snapshot.Warnings)
	}
}
