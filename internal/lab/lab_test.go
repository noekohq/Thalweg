package lab

import (
	"context"
	"encoding/json"
	"reflect"
	"testing"
	"time"
)

type fakeCaller struct {
	deviceID     string
	events       []map[string]any
	queryCount   int
	visibleAfter int
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
		f.queryCount++
		envelopes := make([]map[string]any, 0, len(f.events))
		if f.queryCount > f.visibleAfter {
			for _, event := range f.events {
				envelopes = append(envelopes, map[string]any{"payload": event["payload"]})
			}
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

func TestVerifyReportsObserverTimingDuplicatesAndUnexpectedSequences(t *testing.T) {
	caller := &fakeCaller{deviceID: "observer-b"}
	sentAt := "2026-08-03T12:00:00Z"
	for _, sequence := range []int{1, 1, 2, 4} {
		caller.events = append(caller.events, map[string]any{"payload": testPayload{
			Kind: "thalweg.mesh_test.v1", RunID: "run-one", OriginDeviceID: "device-a", Sequence: sequence, Total: 3, SentAt: sentAt, Data: json.RawMessage(`{}`),
		}})
	}
	result, err := verifyAt(context.Background(), caller, VerifyRequest{
		Network: "home", RunID: "run-one", OriginDeviceID: "device-a", Expected: 3,
	}, time.Date(2026, 8, 3, 12, 0, 1, 250_000_000, time.UTC))
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if result.ObserverDeviceID != "observer-b" || result.ObservedWithinMillis == nil || *result.ObservedWithinMillis != 1250 {
		t.Fatalf("observer report = %#v", result)
	}
	if result.Complete || !reflect.DeepEqual(result.Duplicates, []int{1}) || !reflect.DeepEqual(result.Unexpected, []int{4}) || !reflect.DeepEqual(result.Missing, []int{3}) {
		t.Fatalf("verification integrity = %#v", result)
	}
}

func TestWaitForConvergencePollsUntilEventsAreVisible(t *testing.T) {
	caller := &fakeCaller{deviceID: "observer-b", visibleAfter: 2}
	for _, sequence := range []int{1, 2, 3} {
		caller.events = append(caller.events, map[string]any{"payload": testPayload{
			Kind: "thalweg.mesh_test.v1", RunID: "run-one", OriginDeviceID: "device-a", Sequence: sequence, Total: 3, SentAt: time.Now().UTC().Format(time.RFC3339Nano), Data: json.RawMessage(`{}`),
		}})
	}
	result, err := WaitForConvergence(context.Background(), caller, VerifyRequest{
		Network: "home", RunID: "run-one", OriginDeviceID: "device-a", Expected: 3,
	}, WaitOptions{Timeout: time.Second, PollInterval: 25 * time.Millisecond})
	if err != nil {
		t.Fatalf("wait: %v", err)
	}
	if !result.Complete || result.Attempts != 3 || caller.queryCount != 3 || result.WaitedMillis < 25 {
		t.Fatalf("convergence report = %#v (queries %d)", result, caller.queryCount)
	}
}

func TestWaitForConvergenceReturnsLastIncompleteReportAtTimeout(t *testing.T) {
	caller := &fakeCaller{deviceID: "observer-b", visibleAfter: 100}
	result, err := WaitForConvergence(context.Background(), caller, VerifyRequest{
		Network: "home", RunID: "run-one", Expected: 1,
	}, WaitOptions{Timeout: 30 * time.Millisecond, PollInterval: 25 * time.Millisecond})
	if err != nil {
		t.Fatalf("wait: %v", err)
	}
	if result.Complete || result.Attempts < 2 || !reflect.DeepEqual(result.Missing, []int{1}) {
		t.Fatalf("timeout report = %#v", result)
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
