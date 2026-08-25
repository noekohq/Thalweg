package registry

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"strings"
	"sync"
	"syscall"
	"time"
)

const processShutdownGrace = 5 * time.Second

type worker struct {
	definition Definition
	host       Host
	logRoot    string
	ctx        context.Context
	cancel     context.CancelFunc
	done       chan struct{}

	mu         sync.Mutex
	statusData DefinitionStatus
}

func newWorker(parent context.Context, definition Definition, host Host, logRoot string) *worker {
	ctx, cancel := context.WithCancel(parent)
	return &worker{
		definition: definition, host: host, logRoot: logRoot, ctx: ctx, cancel: cancel,
		done: make(chan struct{}), statusData: baseStatus(definition, "starting"),
	}
}

func (w *worker) start() {
	go func() {
		defer close(w.done)
		if w.definition.Kind == KindSource {
			w.runSource()
		} else {
			w.runConsumer()
		}
	}()
}

func (w *worker) stop() {
	w.cancel()
	<-w.done
}

func (w *worker) status() DefinitionStatus {
	w.mu.Lock()
	defer w.mu.Unlock()
	result := w.statusData
	result.Streams = append([]string(nil), result.Streams...)
	result.Labels = cloneMap(result.Labels)
	return result
}

func (w *worker) runSource() {
	mode := w.definition.Spec.Runner.Mode
	for {
		if w.ctx.Err() != nil {
			w.setState("stopped")
			return
		}
		err := w.runSourceAttempt()
		if w.ctx.Err() != nil {
			w.setState("stopped")
			return
		}
		if err != nil {
			if w.definition.Spec.Retry.Policy == "never" {
				w.recordFailure(err, time.Time{})
				w.setState("failed")
				return
			}
			if !w.backoff(err) {
				return
			}
			continue
		}
		w.recordSuccess(0)
		if mode == "once" || (mode == "stream" && w.definition.Spec.Retry.Policy != "always") {
			w.setState("completed")
			return
		}
		wait := w.definition.Spec.Runner.Interval.Duration
		if mode == "stream" {
			wait = w.definition.Spec.Retry.InitialBackoff.Duration
		}
		w.setState("waiting")
		if !waitContext(w.ctx, wait) {
			w.setState("stopped")
			return
		}
	}
}

func (w *worker) runSourceAttempt() error {
	log, err := openRotatingLog(w.logRoot, w.definition.Name())
	if err != nil {
		return err
	}
	defer log.Close()
	ctx, cancel := definitionContext(w.ctx, w.definition.Spec.Timeout.Duration)
	defer cancel()
	command := commandFor(w.definition)
	stdout, err := command.StdoutPipe()
	if err != nil {
		return err
	}
	command.Stderr = log
	running, err := startCommand(ctx, command)
	if err != nil {
		return err
	}
	w.recordStarted(command.Process.Pid)
	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 64*1024), MaxRecordBytes)
	for scanner.Scan() {
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 {
			continue
		}
		payload, eventID, occurredAt, err := decodeSourceRecord(w.definition.Spec.Input.Format, line)
		if err != nil {
			running.terminate()
			_ = running.wait()
			return err
		}
		if eventID == "" {
			eventID, err = randomEventID()
			if err != nil {
				running.terminate()
				_ = running.wait()
				return err
			}
		}
		if _, err := w.host.Ingest(ctx, w.definition.Spec.Network, w.definition.Spec.Stream, occurredAt, eventID, payload); err != nil {
			running.terminate()
			_ = running.wait()
			return fmt.Errorf("ingest source event: %w", err)
		}
		w.recordSuccess(1)
	}
	if err := scanner.Err(); err != nil {
		running.terminate()
		_ = running.wait()
		return fmt.Errorf("read source NDJSON: %w", err)
	}
	if err := running.wait(); err != nil {
		return err
	}
	return nil
}

func (w *worker) runConsumer() {
	definition := w.definition
	if err := w.host.CreateDurable(w.ctx, definition.Spec.Network, definition.DurableName(), definition.Spec.Events.Streams, definition.Spec.Events.Start); err != nil {
		w.recordFailure(err, time.Time{})
		w.setState("failed")
		return
	}
	for {
		if w.ctx.Err() != nil {
			w.setState("stopped")
			return
		}
		w.setState("waiting")
		delivery, err := w.host.PollDurable(
			w.ctx, definition.Spec.Network, definition.DurableName(),
			definition.Spec.Delivery.MaxEvents, definition.Spec.Delivery.Wait.Duration,
		)
		if w.ctx.Err() != nil {
			w.setState("stopped")
			return
		}
		if err != nil {
			if definition.Spec.Retry.Policy == "never" || !w.backoff(err) {
				w.setState("failed")
				return
			}
			continue
		}
		if delivery.DeliveryID == "" {
			continue
		}
		w.setDelivery(delivery.DeliveryID)
		if err := w.runDelivery(delivery); err != nil {
			if w.ctx.Err() != nil {
				w.setState("stopped")
				return
			}
			if definition.Spec.Retry.Policy == "never" || !w.backoff(err) {
				w.setState("failed")
				return
			}
			continue
		}
		if err := w.host.AcknowledgeDurable(w.ctx, definition.Spec.Network, definition.DurableName(), delivery.DeliveryID); err != nil {
			if !w.backoff(fmt.Errorf("acknowledge delivery: %w", err)) {
				return
			}
			continue
		}
		w.clearDelivery()
		w.recordSuccess(uint64(len(delivery.Events)))
	}
}

type deliveryInput struct {
	Version       int                `json:"version"`
	Definition    deliveryDefinition `json:"definition"`
	DeliveryID    string             `json:"deliveryId"`
	Attempt       int                `json:"attempt"`
	CursorFrom    uint64             `json:"cursorFrom"`
	CursorThrough uint64             `json:"cursorThrough"`
	Events        []Event            `json:"events"`
}

type deliveryDefinition struct {
	Name    string            `json:"name"`
	Kind    string            `json:"kind"`
	Network string            `json:"network"`
	Labels  map[string]string `json:"labels,omitempty"`
}

func (w *worker) runDelivery(delivery DeliveryBatch) error {
	log, err := openRotatingLog(w.logRoot, w.definition.Name())
	if err != nil {
		return err
	}
	defer log.Close()
	input := deliveryInput{
		Version: 1, DeliveryID: delivery.DeliveryID, Attempt: delivery.Attempt,
		CursorFrom: delivery.CursorFrom, CursorThrough: delivery.CursorThrough, Events: delivery.Events,
		Definition: deliveryDefinition{Name: w.definition.Name(), Kind: w.definition.Kind, Network: w.definition.Spec.Network, Labels: w.definition.Metadata.Labels},
	}
	encoded, err := json.Marshal(input)
	if err != nil {
		return err
	}
	encoded = append(encoded, '\n')
	ctx, cancel := definitionContext(w.ctx, w.definition.Spec.Timeout.Duration)
	defer cancel()
	command := commandFor(w.definition)
	command.Stdin = bytes.NewReader(encoded)
	command.Stderr = log
	var stdout io.Reader
	if w.definition.Kind == KindProcessor {
		pipe, err := command.StdoutPipe()
		if err != nil {
			return err
		}
		stdout = pipe
	} else {
		command.Stdout = log
	}
	running, err := startCommand(ctx, command)
	if err != nil {
		return err
	}
	w.recordStarted(command.Process.Pid)
	if w.definition.Kind == KindProcessor {
		if err := w.consumeProcessorOutput(ctx, stdout, delivery, running); err != nil {
			return err
		}
	}
	if err := running.wait(); err != nil {
		return err
	}
	return nil
}

func (w *worker) consumeProcessorOutput(ctx context.Context, stdout io.Reader, delivery DeliveryBatch, running *runningCommand) error {
	allowed := make(map[string]struct{}, len(w.definition.Spec.Output.AllowedStreams))
	for _, stream := range w.definition.Spec.Output.AllowedStreams {
		allowed[stream] = struct{}{}
	}
	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 64*1024), MaxRecordBytes)
	sequence := 0
	for scanner.Scan() {
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 {
			continue
		}
		var output struct {
			Stream     string          `json:"stream"`
			Payload    json.RawMessage `json:"payload"`
			EventID    string          `json:"eventId"`
			OccurredAt string          `json:"occurredAt"`
		}
		if err := json.Unmarshal(line, &output); err != nil || output.Stream == "" || len(output.Payload) == 0 || !json.Valid(output.Payload) {
			running.terminate()
			_ = running.wait()
			return fmt.Errorf("processor emitted invalid event NDJSON")
		}
		if _, permitted := allowed[output.Stream]; !permitted {
			running.terminate()
			_ = running.wait()
			return fmt.Errorf("processor emitted disallowed stream %q", output.Stream)
		}
		sequence++
		if output.EventID == "" {
			output.EventID = deterministicOutputID(w.definition, delivery.DeliveryID, sequence)
		}
		if _, err := w.host.Ingest(ctx, w.definition.Spec.Network, output.Stream, output.OccurredAt, output.EventID, output.Payload); err != nil {
			running.terminate()
			_ = running.wait()
			return fmt.Errorf("ingest processor output: %w", err)
		}
	}
	if err := scanner.Err(); err != nil {
		running.terminate()
		_ = running.wait()
		return fmt.Errorf("read processor NDJSON: %w", err)
	}
	return nil
}

func decodeSourceRecord(format string, line []byte) (json.RawMessage, string, string, error) {
	if !json.Valid(line) {
		return nil, "", "", fmt.Errorf("source emitted malformed JSON")
	}
	if format == "raw-ndjson" {
		return append(json.RawMessage(nil), line...), "", "", nil
	}
	var record struct {
		Payload    json.RawMessage `json:"payload"`
		EventID    string          `json:"eventId"`
		OccurredAt string          `json:"occurredAt"`
	}
	if err := json.Unmarshal(line, &record); err != nil || len(record.Payload) == 0 || !json.Valid(record.Payload) {
		return nil, "", "", fmt.Errorf("source event envelope requires a valid payload")
	}
	return record.Payload, record.EventID, record.OccurredAt, nil
}

func commandFor(definition Definition) *exec.Cmd {
	command := exec.Command(definition.Spec.Runner.Command[0], definition.Spec.Runner.Command[1:]...)
	command.Dir = definition.Spec.Runner.WorkingDirectory
	command.Env = environmentList(definition)
	command.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	return command
}

type runningCommand struct {
	command  *exec.Cmd
	ctx      context.Context
	done     chan struct{}
	mu       sync.Mutex
	err      error
	stopOnce sync.Once
	waitOnce sync.Once
}

func startCommand(ctx context.Context, command *exec.Cmd) (*runningCommand, error) {
	if err := command.Start(); err != nil {
		return nil, fmt.Errorf("start registry command: %w", err)
	}
	running := &runningCommand{command: command, ctx: ctx, done: make(chan struct{})}
	go func() {
		select {
		case <-ctx.Done():
			running.terminate()
		case <-running.done:
		}
	}()
	return running, nil
}

func (r *runningCommand) terminate() {
	r.stopOnce.Do(func() {
		if r.command.Process == nil {
			return
		}
		_ = syscall.Kill(-r.command.Process.Pid, syscall.SIGTERM)
		go func() {
			select {
			case <-r.done:
			case <-time.After(processShutdownGrace):
				_ = syscall.Kill(-r.command.Process.Pid, syscall.SIGKILL)
			}
		}()
	})
}

func (r *runningCommand) wait() error {
	r.waitOnce.Do(func() {
		err := r.command.Wait()
		r.mu.Lock()
		r.err = err
		r.mu.Unlock()
		close(r.done)
	})
	<-r.done
	r.mu.Lock()
	err := r.err
	r.mu.Unlock()
	if r.ctx.Err() != nil {
		return r.ctx.Err()
	}
	if err != nil {
		return fmt.Errorf("registry command failed: %w", err)
	}
	return nil
}

func definitionContext(parent context.Context, timeout time.Duration) (context.Context, context.CancelFunc) {
	if timeout > 0 {
		return context.WithTimeout(parent, timeout)
	}
	return context.WithCancel(parent)
}

func (w *worker) backoff(err error) bool {
	w.mu.Lock()
	failures := w.statusData.FailureCount + 1
	w.mu.Unlock()
	delay := w.definition.Spec.Retry.InitialBackoff.Duration
	for index := 1; index < failures && delay < w.definition.Spec.Retry.MaxBackoff.Duration; index++ {
		delay *= 2
		if delay > w.definition.Spec.Retry.MaxBackoff.Duration {
			delay = w.definition.Spec.Retry.MaxBackoff.Duration
		}
	}
	next := time.Now().UTC().Add(delay)
	w.recordFailure(err, next)
	w.setState("backoff")
	if !waitContext(w.ctx, delay) {
		w.setState("stopped")
		return false
	}
	return true
}

func (w *worker) recordStarted(pid int) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.statusData.PID = pid
	w.statusData.StartedAt = time.Now().UTC().Format(time.RFC3339Nano)
	w.statusData.RuntimeState = "running"
	w.statusData.NextRetryAt = ""
}

func (w *worker) recordSuccess(count uint64) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.statusData.LastSuccessAt = time.Now().UTC().Format(time.RFC3339Nano)
	w.statusData.Processed += count
	w.statusData.FailureCount = 0
	w.statusData.LastError = ""
	w.statusData.NextRetryAt = ""
}

func (w *worker) recordFailure(err error, next time.Time) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.statusData.FailureCount++
	w.statusData.PID = 0
	w.statusData.LastError = sanitizeError(err)
	if !next.IsZero() {
		w.statusData.NextRetryAt = next.Format(time.RFC3339Nano)
	}
}

func (w *worker) setState(state string) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.statusData.RuntimeState = state
	if state != "running" {
		w.statusData.PID = 0
	}
}

func (w *worker) setDelivery(id string) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.statusData.CurrentDelivery = id
}

func (w *worker) clearDelivery() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.statusData.CurrentDelivery = ""
}

func deterministicOutputID(definition Definition, deliveryID string, sequence int) string {
	digest := sha256.Sum256([]byte(fmt.Sprintf("%s\x00%s\x00%s\x00%d", definition.Spec.Network, definition.Name(), deliveryID, sequence)))
	return "registry_" + hex.EncodeToString(digest[:16])
}

func randomEventID() (string, error) {
	value := make([]byte, 16)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return "evt_" + hex.EncodeToString(value), nil
}

func waitContext(ctx context.Context, duration time.Duration) bool {
	if duration <= 0 {
		return ctx.Err() == nil
	}
	timer := time.NewTimer(duration)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

func sanitizeError(err error) string {
	if err == nil {
		return ""
	}
	text := strings.ReplaceAll(err.Error(), "\n", " ")
	if len(text) > 512 {
		text = text[:512]
	}
	return text
}

func cloneMap(input map[string]string) map[string]string {
	result := make(map[string]string, len(input))
	for key, value := range input {
		result[key] = value
	}
	return result
}
