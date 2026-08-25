package cli

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"text/tabwriter"
	"time"

	"thalweg/internal/registry"
)

func runRegistry(args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("registry requires validate, reload, status, list, inspect, start, stop, restart, reset, or logs")
	}
	switch args[0] {
	case "validate":
		return runRegistryValidate(args[1:], stdout, stderr)
	case "reload":
		return runRegistrySimple(args[1:], "registry reload", "registry_reload", "", stdout, stderr)
	case "status":
		return runRegistryStatus(args[1:], "registry_status", stdout, stderr)
	case "list":
		return runRegistryList(args[1:], stdout, stderr)
	case "inspect":
		return runRegistryNamed(args[1:], "registry inspect", "registry_inspect", stdout, stderr)
	case "start":
		return runRegistryNamed(args[1:], "registry start", "registry_start", stdout, stderr)
	case "stop":
		return runRegistryNamed(args[1:], "registry stop", "registry_stop", stdout, stderr)
	case "restart":
		return runRegistryNamed(args[1:], "registry restart", "registry_restart", stdout, stderr)
	case "reset":
		return runRegistryReset(args[1:], stdout, stderr)
	case "logs":
		return runRegistryLogs(args[1:], stdout, stderr)
	default:
		return fmt.Errorf("unknown registry command %q", args[0])
	}
}

func runRegistryValidate(args []string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("registry validate", flag.ContinueOnError)
	flags.SetOutput(stderr)
	path := flags.String("registry", config.RegistryPath, "registry definition directory")
	jsonOutput := flags.Bool("json", false, "emit machine-readable JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("registry validate does not accept positional arguments")
	}
	report, err := registry.Validate(*path)
	if *jsonOutput {
		if err != nil {
			encoded, _ := json.MarshalIndent(map[string]any{"registryPath": *path, "valid": false, "error": err.Error()}, "", "  ")
			fmt.Fprintln(stdout, string(encoded))
			return err
		}
		return writeJSON(stdout, report)
	}
	if err != nil {
		return err
	}
	fmt.Fprintf(stdout, "Registry is valid · %d definition(s)\n", len(report.Definitions))
	fmt.Fprintln(stdout, report.RegistryPath)
	return nil
}

func runRegistryStatus(args []string, action string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("registry status", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	jsonOutput := flags.Bool("json", false, "emit machine-readable JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("registry status does not accept positional arguments")
	}
	data, err := callDaemon(*socket, action, map[string]any{})
	if err != nil {
		return err
	}
	var status registry.Status
	if err := json.Unmarshal(data, &status); err != nil {
		return err
	}
	if *jsonOutput {
		return writeJSON(stdout, status)
	}
	fmt.Fprintf(stdout, "Thalweg registry · %s · %d healthy · %d degraded · %d stopped\n", status.State, status.Healthy, status.Degraded, status.Stopped)
	if status.PendingReload {
		fmt.Fprintln(stdout, "Registry files differ from the accepted snapshot; run `thalweg registry reload`.")
	}
	return renderRegistryDefinitions(stdout, status.Definitions)
}

func runRegistryList(args []string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("registry list", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	jsonOutput := flags.Bool("json", false, "emit machine-readable JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("registry list does not accept positional arguments")
	}
	data, err := callDaemon(*socket, "registry_list", map[string]any{})
	if err != nil {
		return err
	}
	var definitions []registry.DefinitionStatus
	if err := json.Unmarshal(data, &definitions); err != nil {
		return err
	}
	if *jsonOutput {
		return writeJSON(stdout, definitions)
	}
	return renderRegistryDefinitions(stdout, definitions)
}

func runRegistrySimple(args []string, name, action, definitionName string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet(name, flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("%s does not accept positional arguments", name)
	}
	payload := map[string]any{}
	if definitionName != "" {
		payload["name"] = definitionName
	}
	data, err := callDaemon(*socket, action, payload)
	if err != nil {
		return err
	}
	return writeRawJSON(stdout, data)
}

func runRegistryNamed(args []string, name, action string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet(name, flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 1 {
		return fmt.Errorf("%s requires exactly one definition name", name)
	}
	data, err := callDaemon(*socket, action, map[string]any{"name": flags.Arg(0)})
	if err != nil {
		return err
	}
	return writeRawJSON(stdout, data)
}

func runRegistryReset(args []string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("registry reset", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	yes := flags.Bool("yes", false, "confirm durable cursor deletion")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 1 {
		return fmt.Errorf("registry reset requires exactly one definition name")
	}
	if !*yes {
		return fmt.Errorf("registry reset deletes durable consumer progress; pass --yes to confirm")
	}
	data, err := callDaemon(*socket, "registry_reset", map[string]any{"name": flags.Arg(0)})
	if err != nil {
		return err
	}
	return writeRawJSON(stdout, data)
}

func runRegistryLogs(args []string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("registry logs", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	lines := flags.Int("lines", 100, "number of recent lines")
	follow := flags.Bool("follow", false, "follow appended output")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 1 {
		return fmt.Errorf("registry logs requires exactly one definition name")
	}
	name := flags.Arg(0)
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	last := ""
	for {
		data, err := callDaemon(*socket, "registry_log", map[string]any{"name": name, "lines": *lines})
		if err != nil {
			return err
		}
		var response struct {
			Lines []string `json:"lines"`
		}
		if err := json.Unmarshal(data, &response); err != nil {
			return err
		}
		current := strings.Join(response.Lines, "\n")
		if last == "" {
			if current != "" {
				fmt.Fprintln(stdout, current)
			}
		} else if strings.HasPrefix(current, last) {
			addition := strings.TrimPrefix(current, last)
			addition = strings.TrimPrefix(addition, "\n")
			if addition != "" {
				fmt.Fprintln(stdout, addition)
			}
		} else if current != last && current != "" {
			fmt.Fprintln(stdout, current)
		}
		last = current
		if !*follow {
			return nil
		}
		select {
		case <-ctx.Done():
			return nil
		case <-time.After(time.Second):
		}
	}
}

func renderRegistryDefinitions(output io.Writer, definitions []registry.DefinitionStatus) error {
	writer := tabwriter.NewWriter(output, 0, 4, 2, ' ', 0)
	fmt.Fprintln(writer, "NAME\tKIND\tSTATE\tNETWORK\tPROCESSED\tLAST ACTIVITY")
	for _, definition := range definitions {
		activity := definition.LastSuccessAt
		if activity == "" {
			activity = "—"
		}
		fmt.Fprintf(writer, "%s\t%s\t%s\t%s\t%d\t%s\n", definition.Name, definition.Kind, definition.RuntimeState, definition.Network, definition.Processed, activity)
	}
	return writer.Flush()
}

func writeJSON(output io.Writer, value any) error {
	encoded, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	_, err = fmt.Fprintln(output, string(encoded))
	return err
}

func writeRawJSON(output io.Writer, data json.RawMessage) error {
	var value any
	if err := json.Unmarshal(data, &value); err != nil {
		return err
	}
	return writeJSON(output, value)
}
