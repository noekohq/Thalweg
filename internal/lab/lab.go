package lab

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"
)

const (
	DefaultStream = "system:mesh_test"
	MaxEventCount = 100
)

type Caller interface {
	Call(context.Context, string, any, any) error
}

type PublishRequest struct {
	Network string          `json:"network"`
	Stream  string          `json:"stream,omitempty"`
	Count   int             `json:"count,omitempty"`
	RunID   string          `json:"runId,omitempty"`
	Message string          `json:"message,omitempty"`
	Data    json.RawMessage `json:"data,omitempty"`
}

type EventReference struct {
	ID       string `json:"id"`
	Sequence int    `json:"sequence"`
}

type RunManifest struct {
	Version        int              `json:"version"`
	RunID          string           `json:"runId"`
	Network        string           `json:"network"`
	Stream         string           `json:"stream"`
	OriginDeviceID string           `json:"originDeviceId"`
	Expected       int              `json:"expected"`
	PublishedAt    string           `json:"publishedAt"`
	Events         []EventReference `json:"events"`
}

type VerifyRequest struct {
	Network        string `json:"network"`
	Stream         string `json:"stream,omitempty"`
	RunID          string `json:"runId"`
	OriginDeviceID string `json:"originDeviceId,omitempty"`
	Expected       int    `json:"expected"`
}

type VerifyResult struct {
	Version              int    `json:"version"`
	RunID                string `json:"runId"`
	Network              string `json:"network"`
	Stream               string `json:"stream"`
	OriginDeviceID       string `json:"originDeviceId,omitempty"`
	ObserverDeviceID     string `json:"observerDeviceId"`
	Expected             int    `json:"expected"`
	Seen                 int    `json:"seen"`
	Sequences            []int  `json:"sequences"`
	Missing              []int  `json:"missing"`
	Duplicates           []int  `json:"duplicates"`
	Unexpected           []int  `json:"unexpected"`
	PublishedAt          string `json:"publishedAt,omitempty"`
	CheckedAt            string `json:"checkedAt"`
	ObservedWithinMillis *int64 `json:"observedWithinMillis,omitempty"`
	Attempts             int    `json:"attempts"`
	WaitedMillis         int64  `json:"waitedMillis"`
	Complete             bool   `json:"complete"`
}

type WaitOptions struct {
	Timeout      time.Duration
	PollInterval time.Duration
}

type nodeStatus struct {
	DeviceID string `json:"deviceId"`
}

type networkMembership struct {
	Name string `json:"name"`
}

type eventEnvelope struct {
	Payload json.RawMessage `json:"payload"`
}

type testPayload struct {
	Kind           string          `json:"kind"`
	RunID          string          `json:"runId"`
	OriginDeviceID string          `json:"originDeviceId"`
	Sequence       int             `json:"sequence"`
	Total          int             `json:"total"`
	Message        string          `json:"message,omitempty"`
	SentAt         string          `json:"sentAt"`
	Data           json.RawMessage `json:"data"`
}

func Publish(ctx context.Context, caller Caller, now time.Time, request PublishRequest) (RunManifest, error) {
	request.Network = strings.TrimSpace(request.Network)
	request.Stream = strings.TrimSpace(request.Stream)
	request.RunID = strings.TrimSpace(request.RunID)
	if request.Network == "" {
		return RunManifest{}, fmt.Errorf("network is required")
	}
	if request.Stream == "" {
		request.Stream = DefaultStream
	}
	if request.Count == 0 {
		request.Count = 1
	}
	if request.Count < 1 || request.Count > MaxEventCount {
		return RunManifest{}, fmt.Errorf("count must be between 1 and %d", MaxEventCount)
	}
	if len(request.Data) == 0 {
		request.Data = json.RawMessage(`{}`)
	}
	if !json.Valid(request.Data) {
		return RunManifest{}, fmt.Errorf("data must be valid JSON")
	}
	if request.RunID == "" {
		generated, err := randomRunID()
		if err != nil {
			return RunManifest{}, err
		}
		request.RunID = generated
	}
	if strings.ContainsAny(request.RunID, " \t\r\n:") {
		return RunManifest{}, fmt.Errorf("run ID may not contain whitespace or colons")
	}

	var status nodeStatus
	if err := caller.Call(ctx, "network_status", map[string]any{}, &status); err != nil {
		return RunManifest{}, fmt.Errorf("read device identity: %w", err)
	}
	if status.DeviceID == "" {
		return RunManifest{}, fmt.Errorf("daemon returned an empty device identity")
	}
	var memberships []networkMembership
	if err := caller.Call(ctx, "network_list", map[string]any{}, &memberships); err != nil {
		return RunManifest{}, fmt.Errorf("list mounted networks: %w", err)
	}
	mounted := false
	for _, membership := range memberships {
		if membership.Name == request.Network {
			mounted = true
			break
		}
	}
	if !mounted {
		return RunManifest{}, fmt.Errorf("network %q is not mounted", request.Network)
	}
	now = now.UTC()
	manifest := RunManifest{
		Version:        1,
		RunID:          request.RunID,
		Network:        request.Network,
		Stream:         request.Stream,
		OriginDeviceID: status.DeviceID,
		Expected:       request.Count,
		PublishedAt:    now.Format(time.RFC3339Nano),
		Events:         make([]EventReference, 0, request.Count),
	}
	for sequence := 1; sequence <= request.Count; sequence++ {
		eventID := fmt.Sprintf("mesh-test:%s:%s:%04d", request.RunID, status.DeviceID, sequence)
		payload := testPayload{
			Kind:           "thalweg.mesh_test.v1",
			RunID:          request.RunID,
			OriginDeviceID: status.DeviceID,
			Sequence:       sequence,
			Total:          request.Count,
			Message:        request.Message,
			SentAt:         manifest.PublishedAt,
			Data:           request.Data,
		}
		var stored any
		if err := caller.Call(ctx, "event_ingest", map[string]any{
			"network": request.Network,
			"stream":  request.Stream,
			"eventId": eventID,
			"payload": payload,
		}, &stored); err != nil {
			return manifest, fmt.Errorf("publish sequence %d (rerun with --run-id %s to retry safely): %w", sequence, request.RunID, err)
		}
		manifest.Events = append(manifest.Events, EventReference{ID: eventID, Sequence: sequence})
	}
	return manifest, nil
}

func Verify(ctx context.Context, caller Caller, request VerifyRequest) (VerifyResult, error) {
	return verifyAt(ctx, caller, request, time.Now())
}

func verifyAt(ctx context.Context, caller Caller, request VerifyRequest, now time.Time) (VerifyResult, error) {
	request.Network = strings.TrimSpace(request.Network)
	request.Stream = strings.TrimSpace(request.Stream)
	request.RunID = strings.TrimSpace(request.RunID)
	if request.Network == "" || request.RunID == "" {
		return VerifyResult{}, fmt.Errorf("network and run ID are required")
	}
	if request.Stream == "" {
		request.Stream = DefaultStream
	}
	if request.Expected < 1 || request.Expected > MaxEventCount {
		return VerifyResult{}, fmt.Errorf("expected must be between 1 and %d", MaxEventCount)
	}
	var status nodeStatus
	if err := caller.Call(ctx, "network_status", map[string]any{}, &status); err != nil {
		return VerifyResult{}, fmt.Errorf("read observer identity: %w", err)
	}
	var events []eventEnvelope
	if err := caller.Call(ctx, "event_query", map[string]any{
		"network": request.Network,
		"streams": []string{request.Stream},
		"order":   "asc",
	}, &events); err != nil {
		return VerifyResult{}, fmt.Errorf("query test events: %w", err)
	}
	seen := make(map[int]int)
	unexpected := make(map[int]struct{})
	publishedAt := ""
	for _, event := range events {
		var payload testPayload
		if json.Unmarshal(event.Payload, &payload) != nil || payload.Kind != "thalweg.mesh_test.v1" || payload.RunID != request.RunID {
			continue
		}
		if request.OriginDeviceID != "" && payload.OriginDeviceID != request.OriginDeviceID {
			continue
		}
		if publishedAt == "" || (payload.SentAt != "" && payload.SentAt < publishedAt) {
			publishedAt = payload.SentAt
		}
		if payload.Sequence >= 1 && payload.Sequence <= request.Expected {
			seen[payload.Sequence]++
		} else {
			unexpected[payload.Sequence] = struct{}{}
		}
	}
	now = now.UTC()
	result := VerifyResult{
		Version:          1,
		RunID:            request.RunID,
		Network:          request.Network,
		Stream:           request.Stream,
		OriginDeviceID:   request.OriginDeviceID,
		ObserverDeviceID: status.DeviceID,
		Expected:         request.Expected,
		Sequences:        make([]int, 0, len(seen)),
		Missing:          make([]int, 0),
		Duplicates:       make([]int, 0),
		Unexpected:       make([]int, 0, len(unexpected)),
		PublishedAt:      publishedAt,
		CheckedAt:        now.Format(time.RFC3339Nano),
		Attempts:         1,
	}
	for sequence, count := range seen {
		result.Sequences = append(result.Sequences, sequence)
		if count > 1 {
			result.Duplicates = append(result.Duplicates, sequence)
		}
	}
	sort.Ints(result.Sequences)
	sort.Ints(result.Duplicates)
	for sequence := range unexpected {
		result.Unexpected = append(result.Unexpected, sequence)
	}
	sort.Ints(result.Unexpected)
	for sequence := 1; sequence <= request.Expected; sequence++ {
		if _, exists := seen[sequence]; !exists {
			result.Missing = append(result.Missing, sequence)
		}
	}
	result.Seen = len(result.Sequences)
	result.Complete = result.Seen == request.Expected && len(result.Duplicates) == 0 && len(result.Unexpected) == 0
	if parsed, err := time.Parse(time.RFC3339Nano, result.PublishedAt); err == nil && now.After(parsed) {
		observedWithinMillis := now.Sub(parsed).Milliseconds()
		result.ObservedWithinMillis = &observedWithinMillis
	}
	return result, nil
}

func WaitForConvergence(ctx context.Context, caller Caller, request VerifyRequest, options WaitOptions) (VerifyResult, error) {
	if options.Timeout <= 0 {
		return Verify(ctx, caller, request)
	}
	if options.PollInterval <= 0 {
		options.PollInterval = 100 * time.Millisecond
	}
	if options.PollInterval < 25*time.Millisecond || options.PollInterval > 5*time.Second {
		return VerifyResult{}, fmt.Errorf("poll interval must be between 25ms and 5s")
	}
	started := time.Now()
	attempts := 0
	var last VerifyResult
	for {
		attempts++
		result, err := Verify(ctx, caller, request)
		if err != nil {
			return VerifyResult{}, err
		}
		result.Attempts = attempts
		result.WaitedMillis = time.Since(started).Milliseconds()
		last = result
		if result.Complete {
			return result, nil
		}
		remaining := options.Timeout - time.Since(started)
		if remaining <= 0 {
			return last, nil
		}
		wait := min(options.PollInterval, remaining)
		timer := time.NewTimer(wait)
		select {
		case <-ctx.Done():
			timer.Stop()
			return VerifyResult{}, ctx.Err()
		case <-timer.C:
		}
	}
}

func randomRunID() (string, error) {
	var value [12]byte
	if _, err := rand.Read(value[:]); err != nil {
		return "", fmt.Errorf("generate lab run ID: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(value[:]), nil
}
