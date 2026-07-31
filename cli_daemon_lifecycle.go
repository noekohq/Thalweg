package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	daemon "thalweg/core/daemon"
)

const daemonStateVersion = 1

type daemonState struct {
	Version       int       `json:"version"`
	PID           int       `json:"pid"`
	StartedAt     time.Time `json:"startedAt"`
	SocketPath    string    `json:"socketPath"`
	StoragePath   string    `json:"storagePath"`
	LogPath       string    `json:"logPath,omitempty"`
	Executable    string    `json:"executable"`
	DaemonVersion string    `json:"daemonVersion"`
	Debug         bool      `json:"debug"`
}

type daemonLifecycleStatus struct {
	Running     bool            `json:"running"`
	Managed     bool            `json:"managed"`
	PID         int             `json:"pid,omitempty"`
	StartedAt   *time.Time      `json:"startedAt,omitempty"`
	Uptime      string          `json:"uptime,omitempty"`
	SocketPath  string          `json:"socketPath"`
	StoragePath string          `json:"storagePath"`
	LogPath     string          `json:"logPath,omitempty"`
	StatePath   string          `json:"statePath"`
	StaleState  bool            `json:"staleState,omitempty"`
	StateError  string          `json:"stateError,omitempty"`
	Daemon      json.RawMessage `json:"daemon,omitempty"`
}

func runDaemonCommand(args []string, stdout, stderr io.Writer) error {
	if len(args) == 0 {
		return runConfiguredDaemon(args, stdout, stderr)
	}
	switch args[0] {
	case "start":
		return runManagedDaemonStart(args[1:], stdout, stderr)
	case "stop":
		return runDaemonStop(args[1:], stdout, stderr)
	case "restart":
		return runDaemonRestart(args[1:], stdout, stderr)
	case "status":
		return runDaemonLifecycleStatus(args[1:], stdout, stderr)
	case "logs":
		return runDaemonLogs(args[1:], stdout, stderr)
	default:
		return runConfiguredDaemon(args, stdout, stderr)
	}
}

func runManagedDaemonStart(args []string, stdout, stderr io.Writer) error {
	foreground := false
	filtered := make([]string, 0, len(args)+1)
	for _, arg := range args {
		if arg == "--foreground" {
			foreground = true
			continue
		}
		filtered = append(filtered, arg)
	}
	if foreground && containsFlag(filtered, "-d") {
		return fmt.Errorf("--foreground and -d cannot be used together")
	}
	if !foreground && !containsFlag(filtered, "-d") {
		filtered = append([]string{"-d"}, filtered...)
	}
	return runConfiguredDaemon(filtered, stdout, stderr)
}

func runDaemonStop(args []string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("daemon stop", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	storage := flags.String("storage", config.StoragePath, "Badger database path")
	timeout := flags.Duration("timeout", 10*time.Second, "graceful shutdown timeout")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("daemon stop does not accept positional arguments")
	}
	if *timeout < 100*time.Millisecond || *timeout > time.Minute {
		return fmt.Errorf("--timeout must be between 100ms and 1m")
	}
	resolved := localConfig{SocketPath: *socket, StoragePath: *storage}
	if !flagWasSet(flags, "socket") {
		if state, err := loadDaemonState(daemonStatePath(resolved)); err == nil && state.SocketPath != "" {
			resolved.SocketPath = state.SocketPath
		}
	}
	return stopDaemon(resolved, *timeout, stdout)
}

func stopDaemon(config localConfig, timeout time.Duration, stdout io.Writer) error {
	statePath := daemonStatePath(config)
	state, stateErr := loadDaemonState(statePath)
	managed := stateErr == nil
	if stateErr != nil && !errors.Is(stateErr, os.ErrNotExist) {
		return stateErr
	}
	if !daemonSocketActive(config.SocketPath) {
		if managed && processExists(state.PID) {
			return fmt.Errorf(
				"daemon process %d is recorded but its socket is unavailable at %s",
				state.PID,
				config.SocketPath,
			)
		}
		if managed {
			if err := removeDaemonState(statePath); err != nil {
				return err
			}
		}
		fmt.Fprintln(stdout, "Thalweg daemon is not running.")
		return nil
	}
	if _, err := callDaemonTimeout(
		config.SocketPath,
		"daemon_shutdown",
		map[string]any{},
		5*time.Second,
	); err != nil {
		return fmt.Errorf("request graceful daemon shutdown: %w", err)
	}

	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if !daemonSocketActive(config.SocketPath) {
			if !managed || !processExists(state.PID) {
				if managed {
					if err := removeDaemonState(statePath); err != nil {
						return err
					}
				}
				fmt.Fprintln(stdout, "Stopped Thalweg daemon.")
				return nil
			}
			if _, err := os.Lstat(statePath); errors.Is(err, os.ErrNotExist) {
				fmt.Fprintln(stdout, "Stopped Thalweg daemon.")
				return nil
			}
		}
		time.Sleep(50 * time.Millisecond)
	}
	return fmt.Errorf(
		"daemon did not stop within %s; inspect %s",
		timeout,
		statePath,
	)
}

func runDaemonRestart(args []string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("daemon restart", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	storage := flags.String("storage", config.StoragePath, "Badger database path")
	p2pListen := flags.String(
		"p2p-listen",
		strings.Join(config.P2PListenAddresses, ","),
		"comma-separated libp2p listen multiaddresses",
	)
	logPath := flags.String("log", "", "background daemon log path")
	debug := flags.Bool("debug", false, "enable structured debug tracing")
	timeout := flags.Duration("timeout", 10*time.Second, "graceful shutdown timeout")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("daemon restart does not accept positional arguments")
	}
	if *timeout < 100*time.Millisecond || *timeout > time.Minute {
		return fmt.Errorf("--timeout must be between 100ms and 1m")
	}
	resolved := localConfig{
		SocketPath:         *socket,
		StoragePath:        *storage,
		P2PListenAddresses: splitCommaList(*p2pListen),
	}
	if state, err := loadDaemonState(daemonStatePath(resolved)); err == nil {
		if !flagWasSet(flags, "socket") && state.SocketPath != "" {
			resolved.SocketPath = state.SocketPath
		}
		if !flagWasSet(flags, "log") && state.LogPath != "" {
			*logPath = state.LogPath
		}
		if !flagWasSet(flags, "debug") {
			*debug = state.Debug
		}
	}
	if err := stopDaemon(resolved, *timeout, stdout); err != nil {
		return err
	}
	return startDetachedDaemon(resolved, *logPath, *debug, stdout)
}

func runDaemonLifecycleStatus(args []string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("daemon status", flag.ContinueOnError)
	flags.SetOutput(stderr)
	socket := flags.String("socket", config.SocketPath, "Unix socket path")
	storage := flags.String("storage", config.StoragePath, "Badger database path")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("daemon status does not accept positional arguments")
	}
	config.SocketPath = *socket
	config.StoragePath = *storage
	if !flagWasSet(flags, "socket") {
		if state, err := loadDaemonState(daemonStatePath(config)); err == nil && state.SocketPath != "" {
			config.SocketPath = state.SocketPath
		}
	}

	statePath := daemonStatePath(config)
	status := daemonLifecycleStatus{
		SocketPath:  config.SocketPath,
		StoragePath: config.StoragePath,
		StatePath:   statePath,
	}
	state, stateErr := loadDaemonState(statePath)
	switch {
	case stateErr == nil:
		status.Managed = true
		status.PID = state.PID
		status.StartedAt = &state.StartedAt
		status.LogPath = state.LogPath
	case !errors.Is(stateErr, os.ErrNotExist):
		status.StateError = stateErr.Error()
	}

	data, daemonErr := callDaemonTimeout(
		config.SocketPath,
		"network_status",
		map[string]any{},
		2*time.Second,
	)
	if daemonErr == nil {
		status.Running = true
		status.Daemon = data
		if status.StartedAt != nil {
			status.Uptime = time.Since(*status.StartedAt).Round(time.Second).String()
		}
	} else if status.Managed {
		status.StaleState = true
	}
	encoded, err := json.MarshalIndent(status, "", "  ")
	if err != nil {
		return fmt.Errorf("encode daemon status: %w", err)
	}
	encoded = append(encoded, '\n')
	_, err = stdout.Write(encoded)
	return err
}

func runDaemonLogs(args []string, stdout, stderr io.Writer) error {
	config, _, err := loadLocalConfig()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("daemon logs", flag.ContinueOnError)
	flags.SetOutput(stderr)
	storage := flags.String("storage", config.StoragePath, "Badger database path")
	explicitLog := flags.String("log", "", "daemon log path")
	lines := flags.Int("lines", 100, "number of trailing lines")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("daemon logs does not accept positional arguments")
	}
	if *lines < 1 || *lines > 10_000 {
		return fmt.Errorf("--lines must be between 1 and 10000")
	}
	config.StoragePath = *storage
	logPath := *explicitLog
	if logPath == "" {
		state, stateErr := loadDaemonState(daemonStatePath(config))
		if stateErr == nil && state.LogPath != "" {
			logPath = state.LogPath
		} else {
			logPath = defaultDaemonLogPath(config)
		}
	}
	return printDaemonLogTail(logPath, *lines, stdout)
}

func daemonStatePath(config localConfig) string {
	return filepath.Join(filepath.Dir(config.StoragePath), "daemon-state.json")
}

func defaultDaemonLogPath(config localConfig) string {
	return filepath.Join(filepath.Dir(config.StoragePath), "daemon.log")
}

func newDaemonState(config localConfig, debug bool) daemonState {
	executable, _ := os.Executable()
	return daemonState{
		Version:       daemonStateVersion,
		PID:           os.Getpid(),
		StartedAt:     time.Now().UTC(),
		SocketPath:    config.SocketPath,
		StoragePath:   config.StoragePath,
		Executable:    executable,
		DaemonVersion: daemon.Version(),
		Debug:         debug,
	}
}

func loadDaemonState(path string) (daemonState, error) {
	info, err := os.Lstat(path)
	if err != nil {
		return daemonState{}, err
	}
	if info.Mode()&os.ModeSymlink != 0 {
		return daemonState{}, fmt.Errorf("refusing to read symlink daemon state %s", path)
	}
	if !info.Mode().IsRegular() {
		return daemonState{}, fmt.Errorf("daemon state is not a regular file: %s", path)
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return daemonState{}, fmt.Errorf("read daemon state %s: %w", path, err)
	}
	var state daemonState
	if err := json.Unmarshal(content, &state); err != nil {
		return daemonState{}, fmt.Errorf("decode daemon state %s: %w", path, err)
	}
	if state.Version != daemonStateVersion {
		return daemonState{}, fmt.Errorf(
			"unsupported daemon state version %d in %s",
			state.Version,
			path,
		)
	}
	return state, nil
}

func writeDaemonState(path string, state daemonState) error {
	info, err := os.Lstat(path)
	if err == nil && info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("refusing to replace symlink daemon state %s", path)
	}
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("inspect daemon state %s: %w", path, err)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("create daemon state directory: %w", err)
	}
	if err := os.Chmod(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("restrict daemon state directory: %w", err)
	}
	content, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return fmt.Errorf("encode daemon state: %w", err)
	}
	content = append(content, '\n')
	temp, err := os.CreateTemp(filepath.Dir(path), ".daemon-state-*.tmp")
	if err != nil {
		return fmt.Errorf("create temporary daemon state: %w", err)
	}
	tempPath := temp.Name()
	defer os.Remove(tempPath)
	if err := temp.Chmod(0o600); err != nil {
		temp.Close()
		return fmt.Errorf("restrict temporary daemon state: %w", err)
	}
	if _, err := temp.Write(content); err != nil {
		temp.Close()
		return fmt.Errorf("write temporary daemon state: %w", err)
	}
	if err := temp.Sync(); err != nil {
		temp.Close()
		return fmt.Errorf("sync temporary daemon state: %w", err)
	}
	if err := temp.Close(); err != nil {
		return fmt.Errorf("close temporary daemon state: %w", err)
	}
	if err := os.Rename(tempPath, path); err != nil {
		return fmt.Errorf("install daemon state: %w", err)
	}
	return nil
}

func removeDaemonState(path string) error {
	info, err := os.Lstat(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("inspect daemon state %s: %w", path, err)
	}
	if info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("refusing to remove symlink daemon state %s", path)
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("daemon state is not a regular file: %s", path)
	}
	if err := os.Remove(path); err != nil {
		return fmt.Errorf("remove daemon state %s: %w", path, err)
	}
	return nil
}

func removeDaemonStateIfOwned(path string, pid int) error {
	state, err := loadDaemonState(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	if state.PID != pid {
		return nil
	}
	return removeDaemonState(path)
}

func updateDaemonLogPath(config localConfig, logPath string) error {
	path := daemonStatePath(config)
	state, err := loadDaemonState(path)
	if err != nil {
		return err
	}
	state.LogPath = logPath
	return writeDaemonState(path, state)
}

func printDaemonLogTail(path string, lines int, output io.Writer) error {
	info, err := os.Lstat(path)
	if err != nil {
		return fmt.Errorf("inspect daemon log %s: %w", path, err)
	}
	if info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("refusing to read symlink daemon log %s", path)
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("daemon log is not a regular file: %s", path)
	}
	file, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open daemon log %s: %w", path, err)
	}
	defer file.Close()

	ring := make([]string, lines)
	count := 0
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)
	for scanner.Scan() {
		ring[count%lines] = scanner.Text()
		count++
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("read daemon log %s: %w", path, err)
	}
	fmt.Fprintf(output, "Log: %s\n", path)
	start := 0
	shown := count
	if shown > lines {
		start = count % lines
		shown = lines
	}
	for index := 0; index < shown; index++ {
		fmt.Fprintln(output, ring[(start+index)%lines])
	}
	return nil
}

func containsFlag(args []string, target string) bool {
	for _, arg := range args {
		if arg == target {
			return true
		}
	}
	return false
}

func flagWasSet(flags *flag.FlagSet, name string) bool {
	found := false
	flags.Visit(func(candidate *flag.Flag) {
		if candidate.Name == name {
			found = true
		}
	})
	return found
}

func processExists(pid int) bool {
	if pid <= 0 {
		return false
	}
	err := syscall.Kill(pid, 0)
	return err == nil || errors.Is(err, syscall.EPERM)
}
