package registry

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"gopkg.in/yaml.v3"
)

const (
	APIVersion       = "thalweg.dev/v1alpha1"
	KindSource       = "Source"
	KindSink         = "Sink"
	KindProcessor    = "Processor"
	SnapshotVersion  = 1
	MaxRecordBytes   = 1024 * 1024
	ReservedPrefix   = "thalweg.registry.v1."
	defaultBatchSize = 25
)

type Duration struct {
	time.Duration
}

func (d *Duration) UnmarshalYAML(node *yaml.Node) error {
	if node.Kind != yaml.ScalarNode {
		return fmt.Errorf("duration must be a string")
	}
	parsed, err := time.ParseDuration(node.Value)
	if err != nil {
		return fmt.Errorf("invalid duration %q: %w", node.Value, err)
	}
	d.Duration = parsed
	return nil
}

func (d Duration) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.String())
}

func (d *Duration) UnmarshalJSON(data []byte) error {
	var value string
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return err
	}
	d.Duration = parsed
	return nil
}

type Definition struct {
	APIVersion string            `yaml:"apiVersion" json:"apiVersion"`
	Kind       string            `yaml:"kind" json:"kind"`
	Metadata   Metadata          `yaml:"metadata" json:"metadata"`
	Spec       Spec              `yaml:"spec" json:"spec"`
	SourceFile string            `yaml:"-" json:"sourceFile"`
	Digest     string            `yaml:"-" json:"digest"`
	EnvValues  map[string]string `yaml:"-" json:"envValues,omitempty"`
}

type Metadata struct {
	Name   string            `yaml:"name" json:"name"`
	Labels map[string]string `yaml:"labels,omitempty" json:"labels,omitempty"`
}

type Spec struct {
	Enabled     *bool       `yaml:"enabled,omitempty" json:"enabled,omitempty"`
	Network     string      `yaml:"network" json:"network"`
	Stream      string      `yaml:"stream,omitempty" json:"stream,omitempty"`
	Runner      Runner      `yaml:"runner" json:"runner"`
	Input       Input       `yaml:"input,omitempty" json:"input,omitempty"`
	Events      Events      `yaml:"events,omitempty" json:"events,omitempty"`
	Delivery    Delivery    `yaml:"delivery,omitempty" json:"delivery,omitempty"`
	Output      Output      `yaml:"output,omitempty" json:"output,omitempty"`
	Environment Environment `yaml:"environment,omitempty" json:"environment,omitempty"`
	Retry       Retry       `yaml:"retry,omitempty" json:"retry,omitempty"`
	Timeout     Duration    `yaml:"timeout,omitempty" json:"timeout,omitempty"`
}

type Runner struct {
	Type             string   `yaml:"type" json:"type"`
	Command          []string `yaml:"command" json:"command"`
	Mode             string   `yaml:"mode,omitempty" json:"mode,omitempty"`
	Interval         Duration `yaml:"interval,omitempty" json:"interval,omitempty"`
	WorkingDirectory string   `yaml:"workingDirectory,omitempty" json:"workingDirectory,omitempty"`
}

type Input struct {
	Format string `yaml:"format,omitempty" json:"format,omitempty"`
}

type Events struct {
	Streams []string `yaml:"streams,omitempty" json:"streams,omitempty"`
	Start   string   `yaml:"start,omitempty" json:"start,omitempty"`
}

type Delivery struct {
	MaxEvents int      `yaml:"maxEvents,omitempty" json:"maxEvents,omitempty"`
	Wait      Duration `yaml:"wait,omitempty" json:"wait,omitempty"`
}

type Output struct {
	AllowedStreams []string `yaml:"allowedStreams,omitempty" json:"allowedStreams,omitempty"`
}

type Environment struct {
	Inherit *bool             `yaml:"inherit,omitempty" json:"inherit,omitempty"`
	From    []string          `yaml:"from,omitempty" json:"from,omitempty"`
	Values  map[string]string `yaml:"values,omitempty" json:"values,omitempty"`
}

type Retry struct {
	Policy         string   `yaml:"policy,omitempty" json:"policy,omitempty"`
	InitialBackoff Duration `yaml:"initialBackoff,omitempty" json:"initialBackoff,omitempty"`
	MaxBackoff     Duration `yaml:"maxBackoff,omitempty" json:"maxBackoff,omitempty"`
}

func (d Definition) Name() string { return d.Metadata.Name }

func (d Definition) Enabled() bool {
	return d.Spec.Enabled == nil || *d.Spec.Enabled
}

func (d Definition) DurableName() string {
	return ReservedPrefix + lowerKind(d.Kind) + "." + d.Metadata.Name
}

type Snapshot struct {
	Version      int          `json:"version"`
	AcceptedAt   string       `json:"acceptedAt"`
	RegistryPath string       `json:"registryPath"`
	Definitions  []Definition `json:"definitions"`
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

type DeliveryBatch struct {
	Version       int     `json:"version"`
	Name          string  `json:"name"`
	Network       string  `json:"network"`
	DeliveryID    string  `json:"deliveryId,omitempty"`
	CursorFrom    uint64  `json:"cursorFrom"`
	CursorThrough uint64  `json:"cursorThrough"`
	Attempt       int     `json:"attempt"`
	Events        []Event `json:"events"`
}

type Host interface {
	Ingest(context.Context, string, string, string, string, json.RawMessage) (Event, error)
	CreateDurable(context.Context, string, string, []string, string) error
	PollDurable(context.Context, string, string, int, time.Duration) (DeliveryBatch, error)
	AcknowledgeDurable(context.Context, string, string, string) error
	DeleteDurable(context.Context, string, string) error
}

type DefinitionStatus struct {
	Name            string            `json:"name"`
	Kind            string            `json:"kind"`
	DesiredState    string            `json:"desiredState"`
	RuntimeState    string            `json:"runtimeState"`
	Network         string            `json:"network"`
	Stream          string            `json:"stream,omitempty"`
	Streams         []string          `json:"streams,omitempty"`
	Labels          map[string]string `json:"labels,omitempty"`
	Digest          string            `json:"digest"`
	SourceFile      string            `json:"sourceFile"`
	PID             int               `json:"pid,omitempty"`
	StartedAt       string            `json:"startedAt,omitempty"`
	LastSuccessAt   string            `json:"lastSuccessAt,omitempty"`
	Processed       uint64            `json:"processed"`
	CurrentDelivery string            `json:"currentDelivery,omitempty"`
	FailureCount    int               `json:"failureCount"`
	NextRetryAt     string            `json:"nextRetryAt,omitempty"`
	LastError       string            `json:"lastError,omitempty"`
}

type Status struct {
	Version       int                `json:"version"`
	State         string             `json:"state"`
	RegistryPath  string             `json:"registryPath"`
	AcceptedAt    string             `json:"acceptedAt,omitempty"`
	SnapshotPath  string             `json:"snapshotPath"`
	Definitions   []DefinitionStatus `json:"definitions"`
	Healthy       int                `json:"healthy"`
	Degraded      int                `json:"degraded"`
	Stopped       int                `json:"stopped"`
	PendingReload bool               `json:"pendingReload"`
	LastError     string             `json:"lastError,omitempty"`
}

func lowerKind(kind string) string {
	switch kind {
	case KindSource:
		return "source"
	case KindSink:
		return "sink"
	case KindProcessor:
		return "processor"
	default:
		return "unknown"
	}
}
