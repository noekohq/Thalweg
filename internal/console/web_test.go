package console

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestValidateLoopbackListen(t *testing.T) {
	for _, address := range []string{"127.0.0.1:42424", "[::1]:42424", "localhost:42424"} {
		if err := validateLoopbackListen(address); err != nil {
			t.Fatalf("validate %q: %v", address, err)
		}
	}
	for _, address := range []string{"0.0.0.0:42424", "192.168.1.4:42424", ":42424", "not-an-address"} {
		if err := validateLoopbackListen(address); err == nil {
			t.Fatalf("validate %q unexpectedly succeeded", address)
		}
	}
}

func TestWebServerRequiresSessionTokenAndServesReadOnlySnapshot(t *testing.T) {
	caller := &fakeCaller{responses: map[string]any{
		"network_status": NodeStatus{DeviceID: "device", AddressGroups: map[string][]string{}},
		"network_list":   []Network{},
	}}
	server := &WebServer{
		service: Service{Caller: caller},
		token:   "test-token",
		html:    []byte("<!doctype html><title>Console</title>"),
	}
	handler := server.Handler()

	wrong := httptest.NewRecorder()
	handler.ServeHTTP(wrong, httptest.NewRequest(http.MethodGet, "/session/wrong/api/snapshot", nil))
	if wrong.Code != http.StatusNotFound {
		t.Fatalf("wrong-token status = %d", wrong.Code)
	}

	index := httptest.NewRecorder()
	handler.ServeHTTP(index, httptest.NewRequest(http.MethodGet, "/session/test-token/", nil))
	if index.Code != http.StatusOK || !strings.Contains(index.Body.String(), "Console") {
		t.Fatalf("index response = %d %q", index.Code, index.Body.String())
	}
	if index.Header().Get("Content-Security-Policy") == "" || index.Header().Get("X-Frame-Options") != "DENY" {
		t.Fatalf("security headers = %#v", index.Header())
	}
	if strings.Contains(index.Header().Get("Content-Security-Policy"), "script-src 'self' 'unsafe-inline'") {
		t.Fatalf("console scripts should not require unsafe-inline: %q", index.Header().Get("Content-Security-Policy"))
	}

	asset := httptest.NewRecorder()
	handler.ServeHTTP(asset, httptest.NewRequest(http.MethodGet, "/session/test-token/assets/app.js", nil))
	if asset.Code != http.StatusOK || !strings.Contains(asset.Header().Get("Content-Type"), "javascript") {
		t.Fatalf("asset response = %d %#v", asset.Code, asset.Header())
	}

	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/session/test-token/api/snapshot", nil))
	if response.Code != http.StatusOK {
		t.Fatalf("snapshot status = %d", response.Code)
	}
	var snapshot Snapshot
	if err := json.Unmarshal(response.Body.Bytes(), &snapshot); err != nil {
		t.Fatalf("decode snapshot: %v", err)
	}
	if snapshot.State != "online" || snapshot.Status.DeviceID != "device" {
		t.Fatalf("snapshot = %#v", snapshot)
	}

	post := httptest.NewRecorder()
	handler.ServeHTTP(post, httptest.NewRequest(http.MethodPost, "/session/test-token/api/snapshot", nil))
	if post.Code != http.StatusMethodNotAllowed {
		t.Fatalf("POST status = %d", post.Code)
	}
}

func TestDiagnosticsAreDownloadableAndRedactedByContract(t *testing.T) {
	caller := &fakeCaller{responses: map[string]any{
		"network_status": NodeStatus{DeviceID: "public-device-id", AddressGroups: map[string][]string{}},
		"network_list":   []Network{{Name: "home", ID: "home-id"}},
		"event_query": []Event{{
			ID: "event-id", Network: "home", Stream: "secret:test",
			Payload: json.RawMessage(`{"apiKey":"secret-value"}`),
		}},
	}}
	server := &WebServer{service: Service{Caller: caller}, token: "token"}
	response := httptest.NewRecorder()
	server.Handler().ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/session/token/api/diagnostics?network=home", nil),
	)
	if response.Code != http.StatusOK {
		t.Fatalf("diagnostics status = %d", response.Code)
	}
	if !strings.Contains(response.Header().Get("Content-Disposition"), "thalweg-diagnostics.json") {
		t.Fatalf("content disposition = %q", response.Header().Get("Content-Disposition"))
	}
	if strings.Contains(response.Body.String(), "invitation") || strings.Contains(response.Body.String(), "secret-value") {
		t.Fatalf("diagnostics included credential-like fields: %s", response.Body.String())
	}
	if !strings.Contains(response.Body.String(), `"redacted": true`) {
		t.Fatalf("diagnostics did not mark payload redaction: %s", response.Body.String())
	}
}

func TestIPCClientHonorsCanceledContext(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	err := (IPCClient{SocketPath: "/tmp/does-not-exist.sock"}).Call(ctx, "network_status", map[string]any{}, &NodeStatus{})
	if err == nil {
		t.Fatal("canceled IPC call unexpectedly succeeded")
	}
}
