package cli

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/multiformats/go-multiaddr"
	manet "github.com/multiformats/go-multiaddr/net"

	daemon "thalweg/core/daemon"
)

var errDoctorFailed = errors.New("doctor found failed checks")

type doctorCheck struct {
	ID      string `json:"id"`
	Status  string `json:"status"`
	Summary string `json:"summary"`
	Detail  string `json:"detail,omitempty"`
	Remedy  string `json:"remedy,omitempty"`
}

type doctorSummary struct {
	Passed   int `json:"passed"`
	Warnings int `json:"warnings"`
	Failed   int `json:"failed"`
}

type doctorReport struct {
	Healthy     bool          `json:"healthy"`
	GeneratedAt time.Time     `json:"generatedAt"`
	CLIVersion  string        `json:"cliVersion"`
	Checks      []doctorCheck `json:"checks"`
	Summary     doctorSummary `json:"summary"`
}

type doctorNetworkStatus struct {
	DaemonVersion        string              `json:"daemonVersion"`
	ProtocolVersion      int                 `json:"protocolVersion"`
	StorageSchemaVersion int                 `json:"storageSchemaVersion"`
	DeviceID             string              `json:"deviceId"`
	AddressGroups        map[string][]string `json:"addressGroups"`
}

type doctorRunner struct {
	report doctorReport
	debug  bool
}

func runDoctor(args []string, stdout, stderr io.Writer) error {
	flags := flag.NewFlagSet("doctor", flag.ContinueOnError)
	flags.SetOutput(stderr)
	debug := flags.Bool("debug", false, "include deeper transport probes and details")
	jsonOutput := flags.Bool("json", false, "emit machine-readable JSON")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("doctor does not accept positional arguments")
	}

	runner := doctorRunner{
		debug: *debug,
		report: doctorReport{
			Healthy:     true,
			GeneratedAt: time.Now().UTC(),
			CLIVersion:  daemon.Version(),
			Checks:      make([]doctorCheck, 0, 16),
		},
	}
	runner.run()
	if *jsonOutput {
		encoded, err := json.MarshalIndent(runner.report, "", "  ")
		if err != nil {
			return fmt.Errorf("encode doctor report: %w", err)
		}
		encoded = append(encoded, '\n')
		if _, err := stdout.Write(encoded); err != nil {
			return err
		}
	} else {
		runner.renderHuman(stdout)
	}
	if !runner.report.Healthy {
		return errDoctorFailed
	}
	return nil
}

func (r *doctorRunner) run() {
	config, configPath := r.checkConfig()
	state, stateAvailable := r.checkLifecycleState(config)
	daemonConfig := config
	if stateAvailable && state.SocketPath != "" {
		daemonConfig.SocketPath = state.SocketPath
	}
	status, daemonRunning := r.checkDaemon(daemonConfig, state, stateAvailable)
	r.checkSocket(daemonConfig, daemonRunning)
	r.checkStorage(config)
	r.checkSensitiveFile(
		"identity.permissions",
		filepath.Join(filepath.Dir(filepath.Clean(config.StoragePath)), "identity.key"),
		"Device identity has not been created yet.",
	)
	r.checkSensitiveFile(
		"membership.permissions",
		filepath.Join(filepath.Dir(filepath.Clean(config.StoragePath)), "memberships.json"),
		"Membership storage has not been created yet.",
	)
	r.checkP2P(config, status, daemonRunning)
	r.checkInstall()
	r.checkLog(config, state, stateAvailable)
	if configPath == "" {
		r.add("config.path", "fail", "Could not resolve the configuration path.", "", "")
	}
}

func (r *doctorRunner) checkConfig() (localConfig, string) {
	defaults, defaultErr := defaultLocalConfig()
	configPath, pathErr := defaultConfigPath()
	if defaultErr != nil {
		r.add("config.load", "fail", "Could not resolve default configuration.", defaultErr.Error(), "")
		return localConfig{}, configPath
	}
	if pathErr != nil {
		r.add("config.load", "fail", "Could not resolve the configuration path.", pathErr.Error(), "")
		return defaults, ""
	}

	info, err := os.Lstat(configPath)
	switch {
	case errors.Is(err, os.ErrNotExist):
		r.add(
			"config.file",
			"warn",
			"Thalweg has not been initialized; defaults or environment overrides are active.",
			configPath,
			"Run `thalweg init`.",
		)
	case err != nil:
		r.add("config.file", "fail", "Could not inspect the configuration file.", err.Error(), "")
	case info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular():
		r.add(
			"config.file",
			"fail",
			"Configuration path is not a regular file.",
			configPath,
			"Replace it with a regular file created by `thalweg init --force`.",
		)
	case info.Mode().Perm()&0o077 != 0:
		r.add(
			"config.file",
			"fail",
			"Configuration permissions allow group or other access.",
			fmt.Sprintf("%s has mode %04o", configPath, info.Mode().Perm()),
			fmt.Sprintf("Run `chmod 600 %s`.", configPath),
		)
	default:
		r.add("config.file", "pass", "Configuration file is restricted.", configPath, "")
	}

	config, _, err := loadLocalConfig()
	if err != nil {
		r.add(
			"config.load",
			"fail",
			"Configuration could not be loaded.",
			err.Error(),
			"Correct the configuration or rerun `thalweg init --force`.",
		)
		return defaults, configPath
	}
	if len(config.P2PListenAddresses) == 0 {
		r.add(
			"config.values",
			"warn",
			"No stable p2p listener is configured.",
			"",
			"Run `thalweg init --force --p2p-listen /ip4/0.0.0.0/tcp/42422`.",
		)
	} else {
		r.add("config.values", "pass", "Required configuration values are present.", "", "")
	}
	return config, configPath
}

func (r *doctorRunner) checkLifecycleState(config localConfig) (daemonState, bool) {
	path := daemonStatePath(config)
	state, err := loadDaemonState(path)
	switch {
	case errors.Is(err, os.ErrNotExist):
		r.add("daemon.state", "warn", "No managed daemon state is present.", path, "")
		return daemonState{}, false
	case err != nil:
		r.add(
			"daemon.state",
			"fail",
			"Managed daemon state is invalid.",
			err.Error(),
			"Stop any daemon manually, then remove the invalid state file.",
		)
		return daemonState{}, false
	default:
		info, statErr := os.Stat(path)
		if statErr != nil {
			r.add("daemon.state", "fail", "Could not inspect managed daemon state.", statErr.Error(), "")
		} else if info.Mode().Perm()&0o077 != 0 {
			r.add(
				"daemon.state",
				"fail",
				"Managed daemon state permissions are too broad.",
				fmt.Sprintf("%s has mode %04o", path, info.Mode().Perm()),
				fmt.Sprintf("Run `chmod 600 %s`.", path),
			)
		} else {
			r.add(
				"daemon.state",
				"pass",
				fmt.Sprintf("Managed daemon state records process %d.", state.PID),
				path,
				"",
			)
		}
		return state, true
	}
}

func (r *doctorRunner) checkDaemon(
	config localConfig,
	state daemonState,
	stateAvailable bool,
) (doctorNetworkStatus, bool) {
	socketPath := config.SocketPath
	if stateAvailable && state.SocketPath != "" {
		socketPath = state.SocketPath
	}
	data, err := callDaemonTimeout(socketPath, "network_status", map[string]any{}, 2*time.Second)
	if err != nil {
		if stateAvailable && processExists(state.PID) {
			r.add(
				"daemon.reachable",
				"fail",
				"Managed daemon process exists but its local API is unavailable.",
				err.Error(),
				"Inspect `thalweg daemon logs`; stop the process before removing its state file.",
			)
		} else if stateAvailable {
			r.add(
				"daemon.reachable",
				"warn",
				"Daemon is stopped and its lifecycle state is stale.",
				err.Error(),
				"Run `thalweg daemon start`; `thalweg daemon stop` also cleans stale state.",
			)
		} else {
			r.add(
				"daemon.reachable",
				"warn",
				"Daemon is not running.",
				err.Error(),
				"Run `thalweg daemon start`.",
			)
		}
		return doctorNetworkStatus{}, false
	}

	var status doctorNetworkStatus
	if err := json.Unmarshal(data, &status); err != nil {
		r.add("daemon.reachable", "fail", "Daemon returned malformed status.", err.Error(), "")
		return doctorNetworkStatus{}, true
	}
	r.add(
		"daemon.reachable",
		"pass",
		"Daemon local API is responding.",
		fmt.Sprintf("device %s", doctorShortID(status.DeviceID)),
		"",
	)
	if status.DaemonVersion != daemon.Version() {
		r.add(
			"daemon.version",
			"warn",
			"CLI and daemon versions differ.",
			fmt.Sprintf("CLI %s; daemon %s", daemon.Version(), status.DaemonVersion),
			"Run `thalweg daemon restart` after upgrading.",
		)
	} else {
		r.add(
			"daemon.version",
			"pass",
			fmt.Sprintf("CLI and daemon are both %s.", daemon.Version()),
			fmt.Sprintf(
				"IPC %d; storage schema %d",
				status.ProtocolVersion,
				status.StorageSchemaVersion,
			),
			"",
		)
	}
	return status, true
}

func (r *doctorRunner) checkSocket(config localConfig, daemonRunning bool) {
	info, err := os.Lstat(config.SocketPath)
	switch {
	case errors.Is(err, os.ErrNotExist):
		if daemonRunning {
			r.add(
				"socket.path",
				"warn",
				"Configured socket differs from the running managed daemon socket.",
				config.SocketPath,
				"Use `thalweg daemon status` to inspect the active socket.",
			)
		} else {
			r.add("socket.path", "pass", "No stale Unix socket is present.", config.SocketPath, "")
		}
	case err != nil:
		r.add("socket.path", "fail", "Could not inspect the Unix socket.", err.Error(), "")
	case info.Mode()&os.ModeSocket == 0:
		r.add(
			"socket.path",
			"fail",
			"Configured socket path is occupied by a non-socket file.",
			config.SocketPath,
			"Move that file before starting Thalweg.",
		)
	case info.Mode().Perm()&0o077 != 0:
		r.add(
			"socket.path",
			"fail",
			"Unix socket permissions allow group or other access.",
			fmt.Sprintf("%s has mode %04o", config.SocketPath, info.Mode().Perm()),
			"Restart the daemon so Thalweg recreates the socket with mode 0600.",
		)
	default:
		r.add("socket.path", "pass", "Unix socket is restricted.", config.SocketPath, "")
	}
}

func (r *doctorRunner) checkStorage(config localConfig) {
	storageRoot := filepath.Dir(filepath.Clean(config.StoragePath))
	info, err := os.Stat(storageRoot)
	switch {
	case errors.Is(err, os.ErrNotExist):
		r.add(
			"storage.directory",
			"warn",
			"Storage directory has not been created yet.",
			storageRoot,
			"Start the daemon once to initialize storage.",
		)
	case err != nil:
		r.add("storage.directory", "fail", "Could not inspect storage.", err.Error(), "")
	case !info.IsDir():
		r.add("storage.directory", "fail", "Storage root is not a directory.", storageRoot, "")
	case info.Mode().Perm()&0o077 != 0:
		r.add(
			"storage.directory",
			"fail",
			"Storage directory permissions are too broad.",
			fmt.Sprintf("%s has mode %04o", storageRoot, info.Mode().Perm()),
			fmt.Sprintf("Run `chmod 700 %s`.", storageRoot),
		)
	default:
		r.add("storage.directory", "pass", "Storage directory is restricted.", storageRoot, "")
	}
}

func (r *doctorRunner) checkSensitiveFile(id, path, missingSummary string) {
	info, err := os.Lstat(path)
	switch {
	case errors.Is(err, os.ErrNotExist):
		r.add(id, "warn", missingSummary, path, "Start the daemon once to initialize it.")
	case err != nil:
		r.add(id, "fail", "Could not inspect sensitive state.", err.Error(), "")
	case info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular():
		r.add(id, "fail", "Sensitive state is not a regular file.", path, "")
	case info.Mode().Perm()&0o077 != 0:
		r.add(
			id,
			"fail",
			"Sensitive state permissions allow group or other access.",
			fmt.Sprintf("%s has mode %04o", path, info.Mode().Perm()),
			fmt.Sprintf("Run `chmod 600 %s`.", path),
		)
	default:
		r.add(id, "pass", "Sensitive state is restricted.", path, "")
	}
}

func (r *doctorRunner) checkP2P(
	config localConfig,
	status doctorNetworkStatus,
	daemonRunning bool,
) {
	if len(config.P2PListenAddresses) == 0 {
		return
	}
	seen := make(map[string]bool, len(config.P2PListenAddresses))
	valid := make([]multiaddr.Multiaddr, 0, len(config.P2PListenAddresses))
	for _, raw := range config.P2PListenAddresses {
		if seen[raw] {
			r.add(
				"p2p.configuration",
				"warn",
				"Duplicate p2p listen address is configured.",
				raw,
				"Remove duplicate entries with `thalweg init --force`.",
			)
			continue
		}
		seen[raw] = true
		address, err := multiaddr.NewMultiaddr(raw)
		if err != nil {
			r.add(
				"p2p.configuration",
				"fail",
				"Invalid p2p listen address.",
				fmt.Sprintf("%s: %v", raw, err),
				"Correct the `p2pListenAddresses` configuration.",
			)
			continue
		}
		valid = append(valid, address)
	}
	if len(valid) == len(config.P2PListenAddresses) {
		r.add(
			"p2p.configuration",
			"pass",
			fmt.Sprintf("%d p2p listen address(es) are valid.", len(valid)),
			strings.Join(config.P2PListenAddresses, ", "),
			"",
		)
	}

	if daemonRunning {
		reachable := len(status.AddressGroups["lan"]) + len(status.AddressGroups["public"])
		if reachable == 0 {
			r.add(
				"p2p.reachability",
				"warn",
				"Daemon advertises no LAN or public address.",
				"Only loopback or unclassified addresses are available.",
				"Confirm the listener binds a LAN interface and review the host firewall.",
			)
		} else {
			r.add(
				"p2p.reachability",
				"pass",
				fmt.Sprintf("Daemon advertises %d LAN/public address(es).", reachable),
				"",
				"",
			)
		}
		return
	}
	if !r.debug {
		return
	}
	for _, address := range valid {
		network, host, err := manet.DialArgs(address)
		if err != nil {
			r.add(
				"p2p.bind",
				"warn",
				"Could not derive a local bind probe.",
				fmt.Sprintf("%s: %v", address, err),
				"",
			)
			continue
		}
		listener, err := net.Listen(network, host)
		if err != nil {
			r.add(
				"p2p.bind",
				"fail",
				"P2P listener address is unavailable.",
				fmt.Sprintf("%s: %v", address, err),
				"Stop the conflicting process or select another p2p port.",
			)
			continue
		}
		_ = listener.Close()
		r.add("p2p.bind", "pass", "P2P listener address is available.", address.String(), "")
	}
}

func (r *doctorRunner) checkInstall() {
	recordPath, err := defaultInstallRecordPath()
	if err != nil {
		r.add("install.record", "fail", "Could not resolve installation metadata.", err.Error(), "")
		return
	}
	info, err := os.Lstat(recordPath)
	if errors.Is(err, os.ErrNotExist) {
		r.add(
			"install.record",
			"warn",
			"No installation record exists; self-upgrade is unavailable.",
			recordPath,
			"Rerun `./scripts/install.sh` once from the source checkout.",
		)
		return
	}
	if err != nil {
		r.add("install.record", "fail", "Could not inspect installation metadata.", err.Error(), "")
		return
	}
	if info.Mode().Perm()&0o077 != 0 {
		r.add(
			"install.record",
			"fail",
			"Installation record permissions are too broad.",
			fmt.Sprintf("%s has mode %04o", recordPath, info.Mode().Perm()),
			fmt.Sprintf("Run `chmod 600 %s`.", recordPath),
		)
		return
	}
	record, err := loadInstallRecord(recordPath)
	if err != nil {
		r.add("install.record", "fail", "Installation record is invalid.", err.Error(), "")
		return
	}
	r.add(
		"install.record",
		"pass",
		fmt.Sprintf("Source upgrade channel records %s.", shortCommit(record.Commit)),
		recordPath,
		"",
	)

	executable, executableErr := os.Executable()
	if executableErr != nil {
		r.add("install.binary", "fail", "Could not resolve the running CLI binary.", executableErr.Error(), "")
	} else if !sameResolvedPath(executable, record.BinaryPath) {
		r.add(
			"install.binary",
			"warn",
			"Running CLI differs from the recorded installed binary.",
			fmt.Sprintf("running %s; recorded %s", executable, record.BinaryPath),
			"Run the recorded binary or reinstall from this checkout.",
		)
	} else {
		r.add("install.binary", "pass", "Running CLI matches the installation record.", executable, "")
	}

	if record.Dirty {
		r.add(
			"upgrade.source",
			"warn",
			"Installed binary was built from a dirty checkout.",
			record.SourcePath,
			"Commit or discard local changes, reinstall, then use `thalweg upgrade`.",
		)
		return
	}
	if _, err := validateUpgradeSource(record.SourcePath); err != nil {
		r.add("upgrade.source", "fail", "Recorded source checkout is unavailable.", err.Error(), "")
		return
	}
	if status, err := gitOutput(record.SourcePath, "status", "--porcelain"); err != nil {
		r.add("upgrade.source", "fail", "Could not inspect the source checkout.", err.Error(), "")
	} else if status != "" {
		r.add(
			"upgrade.source",
			"warn",
			"Source checkout has local changes; upgrades are blocked.",
			record.SourcePath,
			"Commit, stash, or remove local changes.",
		)
	} else if upstream, err := gitOutput(
		record.SourcePath,
		"rev-parse",
		"--abbrev-ref",
		"--symbolic-full-name",
		"@{upstream}",
	); err != nil {
		r.add(
			"upgrade.source",
			"warn",
			"Source checkout has no tracked upstream.",
			err.Error(),
			"Configure a Git upstream before using `thalweg upgrade`.",
		)
	} else {
		r.add("upgrade.source", "pass", fmt.Sprintf("Source checkout tracks %s.", upstream), "", "")
	}
}

func (r *doctorRunner) checkLog(
	config localConfig,
	state daemonState,
	stateAvailable bool,
) {
	logPath := defaultDaemonLogPath(config)
	if stateAvailable && state.LogPath != "" {
		logPath = state.LogPath
	}
	info, err := os.Lstat(logPath)
	switch {
	case errors.Is(err, os.ErrNotExist):
		r.add("log.file", "warn", "Daemon log has not been created.", logPath, "")
	case err != nil:
		r.add("log.file", "fail", "Could not inspect the daemon log.", err.Error(), "")
	case info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular():
		r.add("log.file", "fail", "Daemon log is not a regular file.", logPath, "")
	case info.Mode().Perm()&0o077 != 0:
		r.add(
			"log.file",
			"fail",
			"Daemon log permissions allow group or other access.",
			fmt.Sprintf("%s has mode %04o", logPath, info.Mode().Perm()),
			fmt.Sprintf("Run `chmod 600 %s`.", logPath),
		)
	default:
		r.add("log.file", "pass", "Daemon log is restricted.", logPath, "")
	}
}

func (r *doctorRunner) add(id, status, summary, detail, remedy string) {
	check := doctorCheck{
		ID:      id,
		Status:  status,
		Summary: summary,
		Detail:  detail,
		Remedy:  remedy,
	}
	r.report.Checks = append(r.report.Checks, check)
	switch status {
	case "pass":
		r.report.Summary.Passed++
	case "warn":
		r.report.Summary.Warnings++
	case "fail":
		r.report.Summary.Failed++
		r.report.Healthy = false
	}
}

func (r *doctorRunner) renderHuman(output io.Writer) {
	fmt.Fprintf(output, "Thalweg doctor · CLI %s\n\n", r.report.CLIVersion)
	for _, check := range r.report.Checks {
		label := strings.ToUpper(check.Status)
		fmt.Fprintf(output, "%-4s  %-24s %s\n", label, check.ID, check.Summary)
		if r.debug && check.Detail != "" {
			fmt.Fprintf(output, "      %s\n", check.Detail)
		}
		if check.Status != "pass" && check.Remedy != "" {
			fmt.Fprintf(output, "      Remedy: %s\n", check.Remedy)
		}
	}
	fmt.Fprintln(output)
	result := "healthy"
	if !r.report.Healthy {
		result = "attention required"
	}
	fmt.Fprintf(
		output,
		"Result: %s · %d passed · %d warnings · %d failed\n",
		result,
		r.report.Summary.Passed,
		r.report.Summary.Warnings,
		r.report.Summary.Failed,
	)
}

func sameResolvedPath(first, second string) bool {
	firstResolved, firstErr := filepath.EvalSymlinks(first)
	secondResolved, secondErr := filepath.EvalSymlinks(second)
	return firstErr == nil && secondErr == nil && firstResolved == secondResolved
}

func doctorShortID(value string) string {
	if len(value) <= 16 {
		return value
	}
	return value[:8] + "…" + value[len(value)-6:]
}
