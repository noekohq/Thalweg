package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"time"

	"thalweg/internal/ipc"
	"thalweg/internal/lab"
)

type labCaller struct {
	socketPath string
}

func (c labCaller) Call(ctx context.Context, action string, payload, target any) error {
	data, err := ipc.Call(ctx, c.socketPath, "CLI lab", "lab", action, payload)
	if err != nil {
		return err
	}
	if target == nil {
		return nil
	}
	if err := json.Unmarshal(data, target); err != nil {
		return fmt.Errorf("decode %s response: %w", action, err)
	}
	return nil
}

func runLab(args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: thalweg lab [publish | verify]")
	}
	switch args[0] {
	case "publish":
		return runLabPublish(args[1:], stdout, stderr)
	case "verify":
		return runLabVerify(args[1:], stdout, stderr)
	default:
		return fmt.Errorf("unknown lab command %q", args[0])
	}
}

func runLabPublish(args []string, stdout, stderr io.Writer) error {
	flags := flag.NewFlagSet("lab publish", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socketFlag := flags.String("socket", "", "Unix socket path")
	network := flags.String("network", "", "logical network name")
	stream := flags.String("stream", lab.DefaultStream, "test event stream")
	count := flags.Int("count", 3, "number of deterministic events")
	runID := flags.String("run-id", "", "stable run ID for idempotent retries")
	message := flags.String("message", "", "human-readable test message")
	data := flags.String("data", `{}`, "generic JSON data nested in each event")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("lab publish does not accept positional arguments")
	}
	socketPath, err := resolvedSocket(*socketFlag)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	manifest, err := lab.Publish(ctx, labCaller{socketPath: socketPath}, time.Now(), lab.PublishRequest{
		Network: *network,
		Stream:  *stream,
		Count:   *count,
		RunID:   *runID,
		Message: *message,
		Data:    json.RawMessage(*data),
	})
	if err != nil {
		return err
	}
	return writeFormattedJSON(stdout, manifest)
}

func runLabVerify(args []string, stdout, stderr io.Writer) error {
	flags := flag.NewFlagSet("lab verify", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socketFlag := flags.String("socket", "", "Unix socket path")
	network := flags.String("network", "", "logical network name")
	stream := flags.String("stream", lab.DefaultStream, "test event stream")
	runID := flags.String("run-id", "", "run ID printed by lab publish")
	origin := flags.String("origin", "", "optional origin device ID")
	expected := flags.Int("expected", 3, "expected sequences from the selected origin")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("lab verify does not accept positional arguments")
	}
	socketPath, err := resolvedSocket(*socketFlag)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	result, err := lab.Verify(ctx, labCaller{socketPath: socketPath}, lab.VerifyRequest{
		Network:        *network,
		Stream:         *stream,
		RunID:          *runID,
		OriginDeviceID: *origin,
		Expected:       *expected,
	})
	if err != nil {
		return err
	}
	if err := writeFormattedJSON(stdout, result); err != nil {
		return err
	}
	if !result.Complete {
		return fmt.Errorf("lab run %q is incomplete; missing sequences %v", result.RunID, result.Missing)
	}
	return nil
}

func writeFormattedJSON(output io.Writer, value any) error {
	encoded, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return fmt.Errorf("encode lab result: %w", err)
	}
	encoded = append(encoded, '\n')
	_, err = output.Write(encoded)
	return err
}
