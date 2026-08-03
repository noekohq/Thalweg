package lab

import (
	"context"
	"encoding/json"
	"reflect"
	"testing"
	"time"
)

type fakeCaller struct {
	deviceID string
	events   []map[string]any
}

func (f *fakeCaller) Call(_ context.Context, action string, payload, target any) error {
	switch action {
	case "network_status":
		encoded, _ := json.Marshal(map[string]any{"deviceId": f.deviceID})
		return json.Unmarshal(encoded, target)
	case "network_list":
		encoded, _ := json.Marshal([]map[string]any{{"name": "home", "id": "home-id"}})
		return json.Unmarshal(encoded, target)
	case "event_ingest":
		request := payload.(map[string]any)
		f.events = append(f.events, request)
		encoded, _ := json.Marshal(map[string]any{"id": request["eventId"]})
		return json.Unmarshal(encoded, target)
	case "event_query":
		envelopes := make([]map[string]any, 0, len(f.events))
		for _, event := range f.events {
			envelopes = append(envelopes, map[string]any{"payload": event["payload"]})
		}
		encoded, _ := json.Marshal(envelopes)
		return json.Unmarshal(encoded, target)
	default:
		panic("unexpected action " + action)
	}
}

func TestPublishCreatesDeterministicRetrySafeEvents(t *testing.T) {
	caller := &fakeCaller{deviceID: "device-a"}
	now := time.Date(2026, 8, 3, 12, 0, 0, 0, time.UTC)
	manifest, err := Publish(context.Background(), caller, now, PublishRequest{
		Network: "home",
		Count:   3,
		RunID:   "run-one",
		Message: "cross-device check",
		Data:    json.RawMessage(`{"shape":"generic"}`),
	})
	if err != nil {
		t.Fatalf("publish: %v", err)
	}
	if manifest.RunID != "run-one" || manifest.OriginDeviceID != "device-a" || len(manifest.Events) != 3 {
		t.Fatalf("manifest = %#v", manifest)
	}
	if got := manifest.Events[2].ID; got != "mesh-test:run-one:device-a:0003" {
		t.Fatalf("third event ID = %q", got)
	}
	if got := caller.events[0]["stream"]; got != DefaultStream {
		t.Fatalf("default stream = %#v", got)
	}
}

func TestVerifyReportsMissingSequencesAndOriginScope(t *testing.T) {
	caller := &fakeCaller{deviceID: "device-a"}
	for _, sequence := range []int{1, 3} {
		caller.events = append(caller.events, map[string]any{"payload": testPayload{
			Kind: "thalweg.mesh_test.v1", RunID: "run-one", OriginDeviceID: "device-a", Sequence: sequence, Total: 3, Data: json.RawMessage(`{}`),
		}})
	}
	caller.events = append(caller.events, map[string]any{"payload": testPayload{
		Kind: "thalweg.mesh_test.v1", RunID: "run-one", OriginDeviceID: "device-b", Sequence: 2, Total: 3, Data: json.RawMessage(`{}`),
	}})
	result, err := Verify(context.Background(), caller, VerifyRequest{
		Network: "home", RunID: "run-one", OriginDeviceID: "device-a", Expected: 3,
	})
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if result.Complete || result.Seen != 2 || !reflect.DeepEqual(result.Sequences, []int{1, 3}) || !reflect.DeepEqual(result.Missing, []int{2}) {
		t.Fatalf("verification = %#v", result)
	}
}

func TestPublishValidatesBoundedGenericInput(t *testing.T) {
	caller := &fakeCaller{deviceID: "device-a"}
	for _, request := range []PublishRequest{
		{Network: "", Count: 1},
		{Network: "home", Count: MaxEventCount + 1},
		{Network: "home", Count: 1, Data: json.RawMessage(`{`)},
		{Network: "home", Count: 1, RunID: "bad:id"},
	} {
		if _, err := Publish(context.Background(), caller, time.Now(), request); err == nil {
			t.Fatalf("publish unexpectedly accepted %#v", request)
		}
	}
	if _, err := Publish(context.Background(), caller, time.Now(), PublishRequest{Network: "work", Count: 1}); err == nil {
		t.Fatal("publish unexpectedly accepted an unmounted network")
	}
}
