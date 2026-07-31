package console

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestTUIViewUsesSharedSnapshotSections(t *testing.T) {
	model := tuiModel{
		width:  110,
		height: 50,
		snapshot: Snapshot{
			State:           "online",
			CapturedAt:      "2026-07-30T18:00:00Z",
			SelectedNetwork: "home",
			Status: NodeStatus{
				DeviceID: "12D3KooW1234567890",
				AddressGroups: map[string][]string{
					"lan": {"/ip4/192.168.1.2/tcp/42422/p2p/peer"},
				},
				DaemonVersion: "0.1.0-dev", ProtocolVersion: 1, StorageSchemaVersion: 3, MeshProtocolVersion: 1,
			},
			Networks: []Network{{Name: "home", ID: "home-id"}, {Name: "work", ID: "work-id"}},
			Streams:  []StreamSummary{{Name: "voice:note", EventCount: 1, LatestAt: "2026-07-30T17:00:00Z"}},
			Events: []Event{{
				ID: "event-one", Network: "home", Stream: "voice:note", OccurredAt: "2026-07-30T17:00:00Z",
				DeviceID: "12D3KooW1234567890", Payload: json.RawMessage(`{"text":"hello"}`),
			}},
			Warnings: []string{"Prototype warning"},
		},
	}
	view := model.View()
	for _, expected := range []string{
		"THALWEG CONSOLE", "Overview", "Topology", "Streams · home",
		"Recent events · home", "voice:note", "Prototype warning",
	} {
		if !strings.Contains(view, expected) {
			t.Fatalf("view missing %q:\n%s", expected, view)
		}
	}
}

func TestAdjacentNetworkWraps(t *testing.T) {
	networks := []Network{{Name: "home"}, {Name: "work"}}
	if got := adjacentNetwork(networks, "home", -1); got != "work" {
		t.Fatalf("previous from home = %q", got)
	}
	if got := adjacentNetwork(networks, "work", 1); got != "home" {
		t.Fatalf("next from work = %q", got)
	}
}

func TestTUIViewportKeepsHeaderAndSlicesBody(t *testing.T) {
	view := renderTUIViewport(
		"fixed header",
		[]string{"line one\nline two\nline three\nline four\nline five"},
		80,
		5,
		2,
	)
	if !strings.Contains(view, "fixed header") ||
		!strings.Contains(view, "line three") ||
		!strings.Contains(view, "line four") ||
		strings.Contains(view, "line one") {
		t.Fatalf("viewport = %q", view)
	}
	if !strings.Contains(view, "scroll 2/3") {
		t.Fatalf("viewport footer = %q", view)
	}
}
