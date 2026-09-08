package cli

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"time"
)

func runSiphon(args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: thalweg siphon [create | list | poll | follow | ack]")
	}
	command := args[0]
	flags := flag.NewFlagSet("siphon "+command, flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", "", "Unix socket path")
	network := flags.String("network", "", "logical network name")

	switch command {
	case "create":
		streams := flags.String("streams", "", "comma-separated stream names; empty means all streams")
		start := flags.String("start", "earliest", "initial cursor: earliest or latest")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 1 || *network == "" {
			return fmt.Errorf("usage: thalweg siphon create --network NAME [--streams A,B] [--start earliest] SIPHON_NAME")
		}
		return invokeAndPrint(*socket, "durable_siphon_create", map[string]any{
			"network": *network,
			"name":    flags.Arg(0),
			"streams": splitCommaList(*streams),
			"start":   *start,
		}, stdout)
	case "list":
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 0 {
			return fmt.Errorf("siphon list does not accept positional arguments")
		}
		return invokeAndPrint(*socket, "durable_siphon_list", map[string]any{"network": *network}, stdout)
	case "poll":
		limit := flags.Int("limit", 25, "maximum events in one pending delivery")
		wait := flags.Duration("wait", 0, "wait for newly stored matching events, up to 25s")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 1 || *network == "" {
			return fmt.Errorf("usage: thalweg siphon poll --network NAME [--limit 25] [--wait 20s] SIPHON_NAME")
		}
		if *wait < 0 || *wait > 25*time.Second {
			return fmt.Errorf("--wait must be between 0 and 25s")
		}
		return invokeAndPrint(*socket, "durable_siphon_poll", map[string]any{
			"network":    *network,
			"name":       flags.Arg(0),
			"limit":      *limit,
			"waitMillis": wait.Milliseconds(),
		}, stdout)
	case "ack":
		deliveryID := flags.String("delivery", "", "pending delivery ID")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 1 || *network == "" || *deliveryID == "" {
			return fmt.Errorf("usage: thalweg siphon ack --network NAME --delivery DELIVERY_ID SIPHON_NAME")
		}
		return invokeAndPrint(*socket, "durable_siphon_ack", map[string]any{
			"network":    *network,
			"name":       flags.Arg(0),
			"deliveryId": *deliveryID,
		}, stdout)
	case "follow":
		streams := flags.String("streams", "", "comma-separated stream names; empty means all streams")
		start := flags.String("start", "latest", "initial cursor when creating the siphon: earliest or latest")
		limit := flags.Int("limit", 25, "maximum events per delivery")
		wait := flags.Duration("wait", 20*time.Second, "wait for newly stored matching events, up to 25s")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 1 || *network == "" {
			return fmt.Errorf("usage: thalweg siphon follow --network NAME [--streams A,B] [--start latest] [--limit 25] [--wait 20s] SIPHON_NAME")
		}
		if *wait < 0 || *wait > 25*time.Second {
			return fmt.Errorf("--wait must be between 0 and 25s")
		}
		followSocket, err := socketPathFromConfig(*socket)
		if err != nil {
			return err
		}
		if _, err := callDaemon(followSocket, "durable_siphon_create", map[string]any{
			"network": *network,
			"name":    flags.Arg(0),
			"streams": splitCommaList(*streams),
			"start":   *start,
		}); err != nil {
			return err
		}
		return followSiphon(followSocket, *network, flags.Arg(0), *limit, *wait, stdout)
	default:
		return fmt.Errorf("unknown siphon command %q", command)
	}
}

func socketPathFromConfig(socketPath string) (string, error) {
	if socketPath != "" {
		return socketPath, nil
	}
	config, _, err := loadLocalConfig()
	if err != nil {
		return "", err
	}
	return config.SocketPath, nil
}

// followSiphon turns the durable, acknowledged pull API into a convenient
// newline-delimited event feed for terminal use. The named siphon is retained
// so stopping and restarting follow resumes at the last acknowledged cursor.
func followSiphon(socketPath, network, name string, limit int, wait time.Duration, stdout io.Writer) error {
	for {
		data, err := callDaemonTimeout(socketPath, "durable_siphon_poll", map[string]any{
			"network": network, "name": name, "limit": limit, "waitMillis": wait.Milliseconds(),
		}, wait+20*time.Second)
		if err != nil {
			return err
		}
		var delivery struct {
			DeliveryID string            `json:"deliveryId"`
			Events     []json.RawMessage `json:"events"`
		}
		if err := json.Unmarshal(data, &delivery); err != nil {
			return fmt.Errorf("decode siphon delivery: %w", err)
		}
		if delivery.DeliveryID == "" {
			continue
		}
		for _, event := range delivery.Events {
			var compact bytes.Buffer
			if err := json.Compact(&compact, event); err != nil {
				return fmt.Errorf("encode siphon event: %w", err)
			}
			compact.WriteByte('\n')
			if _, err := stdout.Write(compact.Bytes()); err != nil {
				return err
			}
		}
		if _, err := callDaemon(socketPath, "durable_siphon_ack", map[string]any{
			"network": network, "name": name, "deliveryId": delivery.DeliveryID,
		}); err != nil {
			return err
		}
	}
}
