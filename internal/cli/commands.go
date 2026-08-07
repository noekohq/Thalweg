package cli

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
	"strconv"
	"strings"
	"syscall"
	"time"

	daemon "thalweg/core/daemon"
)

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
	debug := flags.Bool("debug", false, "enable structured debug tracing")
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
		return startDetachedDaemon(resolved, *logPath, *debug, stdout)
	}
	if *logPath != "" {
		return fmt.Errorf("--log requires -d")
	}
	return serveDaemon(resolved, *debug, stdout)
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
	debug := flags.Bool("debug", false, "enable structured debug tracing")
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
	}, *debug, stdout)
}

func serveDaemon(config localConfig, debug bool, stdout io.Writer) error {
	fmt.Fprintf(stdout, "Starting Thalweg daemon on %s\n", config.SocketPath)
	d, err := daemon.NewWithConfig(daemon.Config{
		SocketPath:         config.SocketPath,
		DBPath:             config.StoragePath,
		P2PListenAddresses: config.P2PListenAddresses,
		Debug:              debug,
	})
	if err != nil {
		return fmt.Errorf("create daemon: %w", err)
	}
	statePath := daemonStatePath(config)
	state := newDaemonState(config, debug)
	if err := writeDaemonState(statePath, state); err != nil {
		_ = d.Close()
		return err
	}
	defer func() {
		if err := removeDaemonStateIfOwned(statePath, os.Getpid()); err != nil {
			fmt.Fprintf(stdout, "Failed to remove daemon state: %v\n", err)
		}
	}()
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

func startDetachedDaemon(config localConfig, logPath string, debug bool, stdout io.Writer) error {
	if daemonSocketActive(config.SocketPath) {
		return fmt.Errorf("a daemon is already listening on %s", config.SocketPath)
	}
	if logPath == "" {
		logPath = defaultDaemonLogPath(config)
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
	command := exec.Command(executable, detachedDaemonArgs(config, debug)...)
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
			if err := updateDaemonLogPath(config, logPath); err != nil {
				_ = command.Process.Signal(syscall.SIGTERM)
				_ = command.Wait()
				return fmt.Errorf("record background daemon log: %w", err)
			}
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

func detachedDaemonArgs(config localConfig, debug bool) []string {
	args := []string{
		"daemon",
		"--socket", config.SocketPath,
		"--storage", config.StoragePath,
		"--p2p-listen", strings.Join(config.P2PListenAddresses, ","),
	}
	if debug {
		args = append(args, "--debug")
	}
	return args
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
		return fmt.Errorf("usage: thalweg network [create NAME | invite NAME | join [INVITATION] | list | leave --yes NAME]")
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
	case "invite":
		flags := flag.NewFlagSet("network invite", flag.ContinueOnError)
		flags.SetOutput(stderr)
		socket := flags.String("socket", "", "Unix socket path")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 1 {
			return fmt.Errorf("usage: thalweg network invite NAME")
		}
		return invokeAndPrint(*socket, "network_invite", map[string]any{"name": flags.Arg(0)}, stdout)
	case "listen":
		return runNetworkListen(args[1:], stdin, stdout, stderr)
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
	case "leave":
		flags := flag.NewFlagSet("network leave", flag.ContinueOnError)
		flags.SetOutput(stderr)
		socket := flags.String("socket", "", "Unix socket path")
		confirmed := flags.Bool("yes", false, "confirm removal of the local membership credential")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 1 || !*confirmed {
			return fmt.Errorf("usage: thalweg network leave --yes NAME")
		}
		return invokeAndPrint(*socket, "network_leave", map[string]any{"name": flags.Arg(0)}, stdout)
	default:
		return fmt.Errorf("unknown network command %q", args[0])
	}
}

type cliEnrollmentOffer struct {
	ID      string `json:"id"`
	Network struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	} `json:"network"`
	ExpiresAt string `json:"expiresAt"`
}

type cliEnrollmentCandidate struct {
	PeerID     string             `json:"peerId"`
	TargetAddr string             `json:"targetAddr"`
	Offer      cliEnrollmentOffer `json:"offer"`
}

type cliEnrollmentRequest struct {
	ID         string `json:"id"`
	PeerID     string `json:"peerId"`
	DeviceName string `json:"deviceName"`
	Network    struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	} `json:"network"`
}

func runNetworkListen(args []string, stdin io.Reader, stdout, stderr io.Writer) error {
	if len(args) == 0 || strings.HasPrefix(args[0], "-") {
		return fmt.Errorf("usage: thalweg network listen NAME [--duration 10m] [--debug]")
	}
	networkName := args[0]
	flags := flag.NewFlagSet("network listen", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socketFlag := flags.String("socket", "", "Unix socket path")
	durationText := flags.String("duration", "10m", "enrollment window duration")
	debug := flags.Bool("debug", false, "print enrollment trace details")
	if err := flags.Parse(args[1:]); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("network listen does not accept additional positional arguments")
	}
	duration, err := time.ParseDuration(*durationText)
	if err != nil || duration <= 0 || duration > time.Hour {
		return fmt.Errorf("--duration must be between 1s and 1h")
	}
	socketPath, err := resolvedSocket(*socketFlag)
	if err != nil {
		return err
	}
	data, err := callDaemon(socketPath, "enrollment_listen", map[string]any{
		"network": networkName, "durationSeconds": int(duration.Seconds()), "debug": *debug,
	})
	if err != nil {
		return err
	}
	var opened struct {
		Offer     cliEnrollmentOffer `json:"offer"`
		Addresses []string           `json:"addresses"`
	}
	if err := json.Unmarshal(data, &opened); err != nil {
		return fmt.Errorf("decode enrollment offer: %w", err)
	}
	defer func() {
		_, _ = callDaemon(socketPath, "enrollment_close", map[string]any{"offerId": opened.Offer.ID})
	}()

	fmt.Fprintf(stdout, "Enrollment open for %q until %s\n", networkName, opened.Offer.ExpiresAt)
	fmt.Fprintln(stdout, "LAN discovery: enabled")
	fmt.Fprintln(stdout, "Manual fallback from the other device:")
	printedAddress := false
	for _, address := range opened.Addresses {
		if !strings.Contains(address, "/127.0.0.1/") {
			fmt.Fprintf(stdout, "  thalweg join --address %q\n", address)
			printedAddress = true
		}
	}
	if !printedAddress {
		fmt.Fprintln(stdout, "  No non-loopback address is currently available; check `thalweg status`.")
	}
	fmt.Fprintln(stdout, "Waiting for requests. Press Ctrl-C to close enrollment.")

	reader := bufio.NewReader(stdin)
	seen := make(map[string]bool)
	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(signals)
	deadline := time.Now().Add(duration)
	for time.Now().Before(deadline) {
		select {
		case <-signals:
			fmt.Fprintln(stdout, "\nEnrollment closed.")
			return nil
		case <-time.After(400 * time.Millisecond):
		}
		raw, err := callDaemon(socketPath, "enrollment_requests", map[string]any{"network": networkName})
		if err != nil {
			return err
		}
		var requests []cliEnrollmentRequest
		if err := json.Unmarshal(raw, &requests); err != nil {
			return fmt.Errorf("decode enrollment requests: %w", err)
		}
		for _, request := range requests {
			if seen[request.ID] {
				continue
			}
			seen[request.ID] = true
			fmt.Fprintf(stdout, "\n%s (%s) wants to join %q\n", emptyFallback(request.DeviceName, "Unnamed device"), request.PeerID, networkName)
			fmt.Fprint(stdout, "Allow? [y/N] ")
			answer, readErr := reader.ReadString('\n')
			if readErr != nil && !errors.Is(readErr, io.EOF) {
				return fmt.Errorf("read enrollment decision: %w", readErr)
			}
			action := "enrollment_deny"
			if strings.EqualFold(strings.TrimSpace(answer), "y") ||
				strings.EqualFold(strings.TrimSpace(answer), "yes") {
				action = "enrollment_approve"
			}
			result, err := callDaemon(socketPath, action, map[string]any{"requestId": request.ID})
			if err != nil {
				return err
			}
			formatted, _ := prettyJSON(result)
			_, _ = stdout.Write(formatted)
		}
	}
	fmt.Fprintln(stdout, "Enrollment window expired.")
	return nil
}

func runEnrollmentJoin(args []string, stdin io.Reader, stdout, stderr io.Writer) error {
	flags := flag.NewFlagSet("join", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socketFlag := flags.String("socket", "", "Unix socket path")
	address := flags.String("address", "", "manual peer multiaddress")
	scanFor := flags.Duration("scan-for", 3*time.Second, "LAN discovery duration")
	debug := flags.Bool("debug", false, "print discovery and join trace details")
	deviceName, _ := os.Hostname()
	name := flags.String("device-name", deviceName, "name shown in the approval request")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("join does not accept positional arguments; use --address for manual fallback")
	}
	socketPath, err := resolvedSocket(*socketFlag)
	if err != nil {
		return err
	}
	if *debug {
		fmt.Fprintf(stderr, "debug: discovering enrollment offers through daemon socket %s\n", socketPath)
	}
	raw, err := callDaemonTimeout(socketPath, "enrollment_discover", map[string]any{
		"targetAddr": *address, "waitMillis": int(scanFor.Milliseconds()), "debug": *debug,
	}, *scanFor+15*time.Second)
	if err != nil {
		return err
	}
	var candidates []cliEnrollmentCandidate
	if err := json.Unmarshal(raw, &candidates); err != nil {
		return fmt.Errorf("decode enrollment candidates: %w", err)
	}
	if len(candidates) == 0 {
		if *debug && *address == "" {
			fmt.Fprintln(stderr, "debug: mDNS returned no offers; verify macOS Local Network access for your terminal, or use the manual `thalweg join --address …` command printed by the listening device")
		}
		return fmt.Errorf("no open Thalweg enrollment offers found")
	}
	fmt.Fprintln(stdout, "Available networks:")
	for index, candidate := range candidates {
		fmt.Fprintf(stdout, "  %d. %s · peer %s\n", index+1, candidate.Offer.Network.Name, candidate.PeerID)
	}
	selected := 0
	if len(candidates) > 1 {
		fmt.Fprint(stdout, "Select a network: ")
		line, readErr := bufio.NewReader(stdin).ReadString('\n')
		if readErr != nil && !errors.Is(readErr, io.EOF) {
			return readErr
		}
		value, parseErr := strconv.Atoi(strings.TrimSpace(line))
		if parseErr != nil || value < 1 || value > len(candidates) {
			return fmt.Errorf("invalid network selection")
		}
		selected = value - 1
	} else {
		fmt.Fprintf(stdout, "Selecting %s.\n", candidates[0].Offer.Network.Name)
	}
	candidate := candidates[selected]
	fmt.Fprintf(stdout, "Requesting approval from %s…\n", candidate.PeerID)
	if *debug {
		fmt.Fprintf(stderr, "debug: target=%s offer=%s networkId=%s\n", candidate.TargetAddr, candidate.Offer.ID, candidate.Offer.Network.ID)
	}
	result, err := callDaemonTimeout(socketPath, "enrollment_join", map[string]any{
		"targetAddr": candidate.TargetAddr, "offerId": candidate.Offer.ID,
		"deviceName": *name, "debug": *debug,
	}, 16*time.Minute)
	if err != nil {
		return err
	}
	formatted, err := prettyJSON(result)
	if err != nil {
		return err
	}
	_, err = stdout.Write(formatted)
	return err
}

func resolvedSocket(explicit string) (string, error) {
	if explicit != "" {
		return explicit, nil
	}
	config, _, err := loadLocalConfig()
	if err != nil {
		return "", err
	}
	return config.SocketPath, nil
}

func emptyFallback(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func runEvent(args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: thalweg event [ingest | query | conflicts]")
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
		order := flags.String("order", "asc", "chronological order: asc or desc")
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
			"order":   *order,
		}, stdout)
	case "conflicts":
		return runEventConflicts(args[1:], stdout, stderr)
	default:
		return fmt.Errorf("unknown event command %q", args[0])
	}
}

func runEventConflicts(args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: thalweg event conflicts [list | resolve]")
	}
	flags := flag.NewFlagSet("event conflicts "+args[0], flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", "", "Unix socket path")
	network := flags.String("network", "", "logical network name")
	switch args[0] {
	case "list":
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 0 {
			return fmt.Errorf("event conflicts list does not accept positional arguments")
		}
		if *network == "" {
			return fmt.Errorf("--network is required")
		}
		return invokeAndPrint(*socket, "event_conflict_list", map[string]any{
			"network": *network,
		}, stdout)
	case "resolve":
		eventID := flags.String("id", "", "conflicting network-unique event ID")
		strategy := flags.String("strategy", "preserve-both", "resolution strategy")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 0 {
			return fmt.Errorf("event conflicts resolve does not accept positional arguments")
		}
		if *network == "" || *eventID == "" {
			return fmt.Errorf("--network and --id are required")
		}
		return invokeAndPrint(*socket, "event_conflict_resolve", map[string]any{
			"network":  *network,
			"eventId":  *eventID,
			"strategy": *strategy,
		}, stdout)
	default:
		return fmt.Errorf("unknown event conflicts command %q", args[0])
	}
}

func runPeer(args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("usage: thalweg peer [dial | sync | list]")
	}
	if args[0] == "list" {
		flags := flag.NewFlagSet("peer list", flag.ContinueOnError)
		flags.SetOutput(stderr)
		socket := flags.String("socket", "", "Unix socket path")
		network := flags.String("network", "", "optional logical network name")
		if err := flags.Parse(args[1:]); err != nil {
			return err
		}
		if flags.NArg() != 0 {
			return fmt.Errorf("peer list does not accept positional arguments")
		}
		return invokeAndPrint(*socket, "mesh_peer_list", map[string]any{"network": *network}, stdout)
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
	debug := flags.Bool("debug", false, "include transport diagnostics")
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
		"debug":      *debug,
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
