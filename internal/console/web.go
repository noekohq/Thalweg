package console

import (
	"context"
	"crypto/rand"
	"embed"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

//go:embed web/index.html web/assets/*
var webAssets embed.FS

type WebOptions struct {
	Service Service
	Listen  string
	Network string
	Output  io.Writer
}

type WebServer struct {
	service Service
	token   string
	html    []byte
}

func RunWeb(ctx context.Context, options WebOptions) error {
	address := options.Listen
	if address == "" {
		address = "127.0.0.1:42424"
	}
	if err := validateLoopbackListen(address); err != nil {
		return err
	}
	token, err := randomSessionToken()
	if err != nil {
		return err
	}
	html, err := webAssets.ReadFile("web/index.html")
	if err != nil {
		return fmt.Errorf("read embedded console UI: %w", err)
	}
	app := &WebServer{service: options.Service, token: token, html: html}
	listener, err := net.Listen("tcp", address)
	if err != nil {
		return fmt.Errorf("listen for console on %s: %w", address, err)
	}
	defer listener.Close()

	sessionPath := "/session/" + token + "/"
	displayHost := listener.Addr().String()
	if host, port, splitErr := net.SplitHostPort(displayHost); splitErr == nil && strings.Contains(host, ":") {
		displayHost = net.JoinHostPort(host, port)
	}
	consoleLocation := &url.URL{Scheme: "http", Host: displayHost, Path: sessionPath}
	if options.Network != "" {
		query := consoleLocation.Query()
		query.Set("network", options.Network)
		consoleLocation.RawQuery = query.Encode()
	}
	consoleURL := consoleLocation.String()
	if options.Output != nil {
		fmt.Fprintf(options.Output, "Thalweg Console: %s\n", consoleURL)
		fmt.Fprintln(options.Output, "Bound to loopback only. Press Ctrl-C to stop.")
	}

	server := &http.Server{
		Handler:           app.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       30 * time.Second,
		MaxHeaderBytes:    16 * 1024,
	}
	errs := make(chan error, 1)
	go func() {
		errs <- server.Serve(listener)
	}()
	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			return fmt.Errorf("stop console server: %w", err)
		}
		return nil
	case err := <-errs:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}

func (s *WebServer) Handler() http.Handler {
	sessionRoot := "/session/" + s.token + "/"
	mux := http.NewServeMux()
	mux.HandleFunc(sessionRoot, s.serveIndex)
	mux.HandleFunc(sessionRoot+"assets/", s.serveAsset)
	mux.HandleFunc(sessionRoot+"api/snapshot", s.serveSnapshot)
	mux.HandleFunc(sessionRoot+"api/diagnostics", s.serveDiagnostics)
	return securityHeaders(mux)
}

func (s *WebServer) serveAsset(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		writer.Header().Set("Allow", http.MethodGet)
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	sessionRoot := "/session/" + s.token + "/"
	name := strings.TrimPrefix(request.URL.Path, sessionRoot)
	if name != "assets/app.js" && name != "assets/app.css" {
		http.NotFound(writer, request)
		return
	}
	asset, err := webAssets.ReadFile("web/" + name)
	if err != nil {
		http.NotFound(writer, request)
		return
	}
	switch {
	case strings.HasSuffix(name, ".css"):
		writer.Header().Set("Content-Type", "text/css; charset=utf-8")
	case strings.HasSuffix(name, ".js"):
		writer.Header().Set("Content-Type", "text/javascript; charset=utf-8")
	default:
		writer.Header().Set("Content-Type", "application/json; charset=utf-8")
	}
	writer.Header().Set("Cache-Control", "no-store")
	_, _ = writer.Write(asset)
}

func (s *WebServer) serveIndex(writer http.ResponseWriter, request *http.Request) {
	expected := "/session/" + s.token + "/"
	if request.Method != http.MethodGet || request.URL.Path != expected {
		http.NotFound(writer, request)
		return
	}
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	writer.Header().Set("Cache-Control", "no-store")
	_, _ = writer.Write(s.html)
}

func (s *WebServer) serveSnapshot(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		writer.Header().Set("Allow", http.MethodGet)
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	snapshot := s.service.Snapshot(request.Context(), request.URL.Query().Get("network"))
	writeJSON(writer, snapshot)
}

func (s *WebServer) serveDiagnostics(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		writer.Header().Set("Allow", http.MethodGet)
		http.Error(writer, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	snapshot := s.service.Snapshot(request.Context(), request.URL.Query().Get("network"))
	redactDiagnostics(&snapshot)
	writer.Header().Set("Content-Disposition", `attachment; filename="thalweg-diagnostics.json"`)
	writeJSON(writer, snapshot)
}

func redactDiagnostics(snapshot *Snapshot) {
	for index := range snapshot.Events {
		snapshot.Events[index].Payload = json.RawMessage(`{"redacted":true}`)
	}
	snapshot.Warnings = append(
		snapshot.Warnings,
		"Diagnostics export redacts event payloads and never includes membership credentials.",
	)
}

func writeJSON(writer http.ResponseWriter, value any) {
	writer.Header().Set("Content-Type", "application/json; charset=utf-8")
	writer.Header().Set("Cache-Control", "no-store")
	encoder := json.NewEncoder(writer)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(value); err != nil {
		http.Error(writer, "encode response", http.StatusInternalServerError)
	}
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set(
			"Content-Security-Policy",
			"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
		)
		writer.Header().Set("Referrer-Policy", "no-referrer")
		writer.Header().Set("X-Content-Type-Options", "nosniff")
		writer.Header().Set("X-Frame-Options", "DENY")
		next.ServeHTTP(writer, request)
	})
}

func validateLoopbackListen(address string) error {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return fmt.Errorf("console listen address must be host:port: %w", err)
	}
	if strings.EqualFold(host, "localhost") {
		return nil
	}
	ip := net.ParseIP(host)
	if ip == nil || !ip.IsLoopback() {
		return fmt.Errorf("console may only listen on loopback; got %q", host)
	}
	return nil
}

func randomSessionToken() (string, error) {
	var value [24]byte
	if _, err := rand.Read(value[:]); err != nil {
		return "", fmt.Errorf("generate console session token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(value[:]), nil
}
