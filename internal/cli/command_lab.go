package cli

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
		return fmt.Errorf("usage: thalweg lab [publish | verify | watch]")
	}
	switch args[0] {
	case "publish":
		return runLabPublish(args[1:], stdout, stderr)
	case "verify":
		return runLabVerify(args[1:], false, stdout, stderr)
	case "watch":
		return runLabVerify(args[1:], true, stdout, stderr)
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

func runLabVerify(args []string, watch bool, stdout, stderr io.Writer) error {
	commandName := "lab verify"
	defaultWait := time.Duration(0)
	if watch {
		commandName = "lab watch"
		defaultWait = 2 * time.Minute
	}
	flags := flag.NewFlagSet(commandName, flag.ContinueOnError)
	flags.SetOutput(stderr)
	socketFlag := flags.String("socket", "", "Unix socket path")
	network := flags.String("network", "", "logical network name")
	stream := flags.String("stream", lab.DefaultStream, "test event stream")
	runID := flags.String("run-id", "", "run ID printed by lab publish")
	origin := flags.String("origin", "", "optional origin device ID")
	expected := flags.Int("expected", 3, "expected sequences from the selected origin")
	wait := flags.Duration("wait", defaultWait, "wait up to this duration for convergence")
	poll := flags.Duration("poll", 100*time.Millisecond, "verification polling interval")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("%s does not accept positional arguments", commandName)
	}
	if *wait < 0 || *wait > 10*time.Minute {
		return fmt.Errorf("--wait must be between 0 and 10m")
	}
	socketPath, err := resolvedSocket(*socketFlag)
	if err != nil {
		return err
	}
	requestTimeout := 45 * time.Second
	if *wait > 0 {
		requestTimeout = *wait + 10*time.Second
	}
	ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()
	result, err := lab.WaitForConvergence(ctx, labCaller{socketPath: socketPath}, lab.VerifyRequest{
		Network:        *network,
		Stream:         *stream,
		RunID:          *runID,
		OriginDeviceID: *origin,
		Expected:       *expected,
	}, lab.WaitOptions{Timeout: *wait, PollInterval: *poll})
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
