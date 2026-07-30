package main

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	daemon "thalweg/core/daemon"
)

func runCLI(args []string, stdin io.Reader, stdout, stderr io.Writer) int {
	if len(args) == 0 {
		printUsage(stderr)
		return 2
	}

	var err error
	switch args[0] {
	case "help", "-h", "--help":
		printUsage(stdout)
		return 0
	case "version":
		_, err = fmt.Fprintln(stdout, daemon.Version())
	case "init":
		err = runInit(args[1:], stdout, stderr)
	case "daemon", "start":
		err = runConfiguredDaemon(args[1:], stdout, stderr)
	case "spawn":
		err = runDevelopmentDaemon(args[1:], stdout, stderr)
	case "status":
		err = runSimpleAction("status", args[1:], "network_status", map[string]any{}, stdout, stderr)
	case "network":
		err = runNetwork(args[1:], stdin, stdout, stderr)
	case "event":
		err = runEvent(args[1:], stdout, stderr)
	case "peer":
		err = runPeer(args[1:], stdout, stderr)
	default:
		fmt.Fprintf(stderr, "unknown command %q\n\n", args[0])
		printUsage(stderr)
		return 2
	}
	if err != nil {
		fmt.Fprintf(stderr, "thalweg: %v\n", err)
		return 1
	}
	return 0
}

func printUsage(output io.Writer) {
	fmt.Fprint(output, `Thalweg local-first event mesh

Usage:
  thalweg init [--socket PATH] [--storage PATH] [--p2p-listen ADDRS] [--force]
  thalweg daemon [-d] [--log PATH]
  thalweg status
  thalweg network create NAME
  thalweg network join [INVITATION]
  thalweg network list
  thalweg event ingest --network NAME --stream NAME --payload JSON
  thalweg event query --network NAME [--streams A,B] [--from TIME] [--to TIME]
  thalweg peer dial --network NAME --address MULTIADDR
  thalweg peer sync --network NAME --address MULTIADDR
  thalweg version

Every daemon command accepts --socket PATH. The daemon also honors
THALWEG_CONFIG_PATH, THALWEG_SOCKET_PATH, THALWEG_STORAGE_PATH, and
THALWEG_P2P_LISTEN_ADDRS.
`)
}

func runInit(args []string, stdout, stderr io.Writer) error {
	defaults, err := defaultLocalConfig()
	if err != nil {
		return err
	}
	configPath, err := defaultConfigPath()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("init", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", defaults.SocketPath, "Unix socket path")
	storage := flags.String("storage", defaults.StoragePath, "Badger database path")
	p2pListen := flags.String(
		"p2p-listen",
		strings.Join(defaults.P2PListenAddresses, ","),
		"comma-separated libp2p listen multiaddresses",
	)
	force := flags.Bool("force", false, "replace an existing configuration")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("init does not accept positional arguments")
	}
	config := localConfig{
		SocketPath:         *socket,
		StoragePath:        *storage,
		P2PListenAddresses: splitCommaList(*p2pListen),
	}
	err = writeLocalConfig(configPath, config, *force)
	if errors.Is(err, os.ErrExist) {
		existing, _, loadErr := loadLocalConfig()
		if loadErr != nil {
			return loadErr
		}
		fmt.Fprintf(stdout, "Thalweg is already initialized at %s\n", configPath)
		printConfiguredPaths(stdout, existing)
		return nil
	}
	if err != nil {
		return err
	}
	fmt.Fprintf(stdout, "Initialized Thalweg at %s\n", configPath)
	printConfiguredPaths(stdout, config)
	fmt.Fprintln(stdout, "Next: run `thalweg daemon`, then `thalweg network create <name>`.")
	return nil
}

func printConfiguredPaths(output io.Writer, config localConfig) {
	fmt.Fprintf(output, "  socket:  %s\n", config.SocketPath)
	fmt.Fprintf(output, "  storage: %s\n", config.StoragePath)
	fmt.Fprintf(output, "  p2p:     %s\n", strings.Join(config.P2PListenAddresses, ","))
}

func runConfiguredDaemon(args []string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("daemon", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	storage := flags.String("storage", config.StoragePath, "Badger database path")
	p2pListen := flags.String(
		"p2p-listen",
		strings.Join(config.P2PListenAddresses, ","),
		"comma-separated libp2p listen multiaddresses",
	)
	detach := flags.Bool("d", false, "run the daemon in the background")
	logPath := flags.String("log", "", "background daemon log path")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("daemon does not accept positional arguments")
	}
	resolved := localConfig{
		SocketPath:         *socket,
		StoragePath:        *storage,
		P2PListenAddresses: splitCommaList(*p2pListen),
	}
	if *detach {
		return startDetachedDaemon(resolved, *logPath, stdout)
	}
	if *logPath != "" {
		return fmt.Errorf("--log requires -d")
	}
	return serveDaemon(resolved, stdout)
}

func runDevelopmentDaemon(args []string, stdout, stderr io.Writer) error {
	flags := flag.NewFlagSet("spawn", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String(
		"socket",
		envOrDefault("THALWEG_SOCKET_PATH", defaultSocketPath),
		"Unix socket path",
	)
	storage := flags.String(
		"storage",
		envOrDefault("THALWEG_STORAGE_PATH", "./storage/badger"),
		"Badger database path",
	)
	p2pListen := flags.String(
		"p2p-listen",
		os.Getenv("THALWEG_P2P_LISTEN_ADDRS"),
		"comma-separated libp2p listen multiaddresses",
	)
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("spawn does not accept positional arguments")
	}
	return serveDaemon(localConfig{
		SocketPath:         *socket,
		StoragePath:        *storage,
		P2PListenAddresses: splitCommaList(*p2pListen),
	}, stdout)
}

func serveDaemon(config localConfig, stdout io.Writer) error {
	fmt.Fprintf(stdout, "Starting Thalweg daemon on %s\n", config.SocketPath)
	d, err := daemon.NewWithConfig(daemon.Config{
		SocketPath:         config.SocketPath,
		DBPath:             config.StoragePath,
		P2PListenAddresses: config.P2PListenAddresses,
	})
	if err != nil {
		return fmt.Errorf("create daemon: %w", err)
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		if err := d.Close(); err != nil {
			fmt.Fprintf(stdout, "Failed to stop daemon: %v\n", err)
		}
	}()
	if err := d.Start(); err != nil {
		_ = d.Close()
		return err
	}
	return d.Close()
}

func startDetachedDaemon(config localConfig, logPath string, stdout io.Writer) error {
	if daemonSocketActive(config.SocketPath) {
		return fmt.Errorf("a daemon is already listening on %s", config.SocketPath)
	}
	if logPath == "" {
		logPath = filepath.Join(filepath.Dir(config.StoragePath), "daemon.log")
	}
	logFile, err := openDaemonLog(logPath)
	if err != nil {
		return err
	}

	executable, err := os.Executable()
	if err != nil {
		logFile.Close()
		return fmt.Errorf("find thalweg executable: %w", err)
	}
	command := exec.Command(executable, detachedDaemonArgs(config)...)
	command.Stdin = nil
	command.Stdout = logFile
	command.Stderr = logFile
	command.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
	if err := command.Start(); err != nil {
		logFile.Close()
		return fmt.Errorf("start background daemon: %w", err)
	}
	if err := logFile.Close(); err != nil {
		_ = command.Process.Signal(syscall.SIGTERM)
		_ = command.Wait()
		return fmt.Errorf("close parent daemon log: %w", err)
	}

	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		if _, err := callDaemon(config.SocketPath, "network_status", map[string]any{}); err == nil {
			pid := command.Process.Pid
			if err := command.Process.Release(); err != nil {
				return fmt.Errorf("release background daemon process: %w", err)
			}
			fmt.Fprintf(stdout, "Started Thalweg daemon in the background (pid %d)\n", pid)
			fmt.Fprintf(stdout, "Log: %s\n", logPath)
			return nil
		}
		time.Sleep(50 * time.Millisecond)
	}

	_ = command.Process.Signal(syscall.SIGTERM)
	_ = command.Wait()
	return fmt.Errorf("background daemon did not become ready within 5s; inspect %s", logPath)
}

func openDaemonLog(logPath string) (*os.File, error) {
	if err := os.MkdirAll(filepath.Dir(logPath), 0o700); err != nil {
		return nil, fmt.Errorf("create daemon log directory: %w", err)
	}
	info, err := os.Lstat(logPath)
	if err == nil {
		if info.Mode()&os.ModeSymlink != 0 {
			return nil, fmt.Errorf("refusing to open symlink daemon log %s", logPath)
		}
		if !info.Mode().IsRegular() {
			return nil, fmt.Errorf("daemon log is not a regular file: %s", logPath)
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return nil, fmt.Errorf("inspect daemon log %s: %w", logPath, err)
	}
	logFile, err := os.OpenFile(
		logPath,
		os.O_CREATE|os.O_WRONLY|os.O_APPEND|syscall.O_NOFOLLOW,
		0o600,
	)
	if err != nil {
		return nil, fmt.Errorf("open daemon log %s: %w", logPath, err)
	}
	if err := logFile.Chmod(0o600); err != nil {
		logFile.Close()
		return nil, fmt.Errorf("restrict daemon log %s: %w", logPath, err)
	}
	return logFile, nil
}

func detachedDaemonArgs(config localConfig) []string {
	return []string{
		"daemon",
		"--socket", config.SocketPath,
		"--storage", config.StoragePath,
		"--p2p-listen", strings.Join(config.P2PListenAddresses, ","),
	}
}

func daemonSocketActive(socketPath string) bool {
	conn, err := net.DialTimeout("unix", socketPath, 200*time.Millisecond)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

func runSimpleAction(
	name string,
	args []string,
	action string,
	payload any,
	stdout, stderr io.Writer,
) error {
	flags := flag.NewFlagSet(name, flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", "", "Unix socket path")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("%s does not accept positional arguments", name)
	}
	return invokeAndPrint(*socket, action, payload, stdout)
}

func runNetwork(args []string, stdin io.Reader, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: thalweg network [create NAME | join [INVITATION] | list]")
	}
	switch args[0] {
	case "create":
		flags := flag.NewFlagSet("network create", flag.ContinueOnError)
		flags.SetOutput(stderr)
		socket := flags.String("socket", "", "Unix socket path")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 1 {
			return fmt.Errorf("usage: thalweg network create NAME")
		}
		return invokeAndPrint(*socket, "network_create", map[string]any{"name": flags.Arg(0)}, stdout)
	case "join":
		flags := flag.NewFlagSet("network join", flag.ContinueOnError)
		flags.SetOutput(stderr)
		socket := flags.String("socket", "", "Unix socket path")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() > 1 {
			return fmt.Errorf("usage: thalweg network join [INVITATION]")
		}
		invitation := ""
		if flags.NArg() == 1 {
			invitation = flags.Arg(0)
		} else {
			fmt.Fprint(stderr, "Paste invitation and press Enter: ")
			content, err := bufio.NewReader(io.LimitReader(stdin, 64*1024)).ReadString('\n')
			if err != nil && !errors.Is(err, io.EOF) {
				return fmt.Errorf("read invitation from stdin: %w", err)
			}
			invitation = strings.TrimSpace(content)
		}
		if invitation == "" {
			return fmt.Errorf("invitation is required as an argument or stdin")
		}
		return invokeAndPrint(*socket, "network_join", map[string]any{"invitation": invitation}, stdout)
	case "list":
		return runSimpleAction("network list", args[1:], "network_list", map[string]any{}, stdout, stderr)
	default:
		return fmt.Errorf("unknown network command %q", args[0])
	}
}

func runEvent(args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: thalweg event [ingest | query]")
	}
	switch args[0] {
	case "ingest":
		flags := flag.NewFlagSet("event ingest", flag.ContinueOnError)
		flags.SetOutput(stderr)
		socket := flags.String("socket", "", "Unix socket path")
		network := flags.String("network", "", "logical network name")
		stream := flags.String("stream", "", "stream name")
		payloadText := flags.String("payload", "", "JSON payload")
		eventID := flags.String("id", "", "optional network-unique event ID")
		occurredAt := flags.String("occurred-at", "", "optional RFC3339 event time")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 0 {
			return fmt.Errorf("event ingest does not accept positional arguments")
		}
		if *network == "" || *stream == "" || *payloadText == "" {
			return fmt.Errorf("--network, --stream, and --payload are required")
		}
		var payload any
		decoder := json.NewDecoder(strings.NewReader(*payloadText))
		decoder.UseNumber()
		if err := decoder.Decode(&payload); err != nil {
			return fmt.Errorf("--payload must be valid JSON: %w", err)
		}
		if err := ensureJSONEOF(decoder); err != nil {
			return fmt.Errorf("--payload must contain one JSON value: %w", err)
		}
		return invokeAndPrint(*socket, "event_ingest", map[string]any{
			"network":    *network,
			"stream":     *stream,
			"payload":    payload,
			"eventId":    *eventID,
			"occurredAt": *occurredAt,
		}, stdout)
	case "query":
		flags := flag.NewFlagSet("event query", flag.ContinueOnError)
		flags.SetOutput(stderr)
		socket := flags.String("socket", "", "Unix socket path")
		network := flags.String("network", "", "logical network name")
		streams := flags.String("streams", "", "comma-separated stream names")
		from := flags.String("from", "", "inclusive RFC3339 lower bound")
		to := flags.String("to", "", "inclusive RFC3339 upper bound")
		limit := flags.Int("limit", 0, "maximum number of events; zero is unlimited")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 0 {
			return fmt.Errorf("event query does not accept positional arguments")
		}
		if *network == "" {
			return fmt.Errorf("--network is required")
		}
		return invokeAndPrint(*socket, "event_query", map[string]any{
			"network": *network,
			"streams": splitCommaList(*streams),
			"from":    *from,
			"to":      *to,
			"limit":   *limit,
		}, stdout)
	default:
		return fmt.Errorf("unknown event command %q", args[0])
	}
}

func runPeer(args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: thalweg peer [dial | sync] --network NAME --address MULTIADDR")
	}
	action := ""
	switch args[0] {
	case "dial":
		action = "mesh_dial"
	case "sync":
		action = "mesh_sync"
	default:
		return fmt.Errorf("unknown peer command %q", args[0])
	}
	flags := flag.NewFlagSet("peer "+args[0], flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", "", "Unix socket path")
	network := flags.String("network", "", "logical network name")
	address := flags.String("address", "", "peer libp2p multiaddress")
	if err := flags.Parse(args[1:]); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("peer %s does not accept positional arguments", args[0])
	}
	if *network == "" || *address == "" {
		return fmt.Errorf("--network and --address are required")
	}
	return invokeAndPrint(*socket, action, map[string]any{
		"network":    *network,
		"targetAddr": *address,
	}, stdout)
}

func invokeAndPrint(socketPath, action string, payload any, stdout io.Writer) error {
	if socketPath == "" {
		config, _, err := loadLocalConfig()
		if err != nil {
			return err
		}
		socketPath = config.SocketPath
	}
	data, err := callDaemon(socketPath, action, payload)
	if err != nil {
		return err
	}
	output, err := prettyJSON(data)
	if err != nil {
		return err
	}
	_, err = stdout.Write(output)
	return err
}

func ensureJSONEOF(decoder *json.Decoder) error {
	var trailing any
	err := decoder.Decode(&trailing)
	if errors.Is(err, io.EOF) {
		return nil
	}
	if err == nil {
		return fmt.Errorf("found trailing JSON value")
	}
	return err
}

func splitCommaList(value string) []string {
	if value == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if part = strings.TrimSpace(part); part != "" {
			result = append(result, part)
		}
	}
	return result
}

func envOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
