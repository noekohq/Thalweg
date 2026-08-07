package cli

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

const installRecordVersion = 1

type installRecord struct {
	Version          int       `json:"version"`
	Channel          string    `json:"channel"`
	SourcePath       string    `json:"sourcePath"`
	BinaryPath       string    `json:"binaryPath"`
	Commit           string    `json:"commit"`
	Dirty            bool      `json:"dirty"`
	InstalledVersion string    `json:"installedVersion"`
	InstalledAt      time.Time `json:"installedAt"`
}

func runUpgrade(args []string, stdout, stderr io.Writer) error {
	recordPath, err := defaultInstallRecordPath()
	if err != nil {
		return err
	}
	flags := flag.NewFlagSet("upgrade", flag.ContinueOnError)
	flags.SetOutput(stderr)
	checkOnly := flags.Bool("check", false, "check the tracked upstream without installing")
	noRestart := flags.Bool("no-restart", false, "do not restart a running daemon")
	force := flags.Bool("force", false, "rebuild even when the installed commit is current")
	recordFlag := flags.String("record", recordPath, "installation record path")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if flags.NArg() != 0 {
		return fmt.Errorf("upgrade does not accept positional arguments")
	}

	record, err := loadInstallRecord(*recordFlag)
	if errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf(
			"installation record not found at %s; rerun ./scripts/install.sh once from the checkout",
			*recordFlag,
		)
	}
	if err != nil {
		return err
	}
	if record.Channel != "source" {
		return fmt.Errorf("unsupported upgrade channel %q", record.Channel)
	}
	sourcePath, err := validateUpgradeSource(record.SourcePath)
	if err != nil {
		return err
	}
	if status, err := gitOutput(sourcePath, "status", "--porcelain"); err != nil {
		return err
	} else if status != "" {
		return fmt.Errorf(
			"source checkout has local changes at %s; commit, stash, or remove them before upgrading",
			sourcePath,
		)
	}

	upstream, err := gitOutput(
		sourcePath,
		"rev-parse",
		"--abbrev-ref",
		"--symbolic-full-name",
		"@{upstream}",
	)
	if err != nil {
		return fmt.Errorf("resolve tracked upstream: %w", err)
	}
	remote, _, ok := strings.Cut(upstream, "/")
	if !ok || remote == "" {
		return fmt.Errorf("tracked upstream %q does not identify a remote", upstream)
	}
	if _, err := gitOutput(sourcePath, "fetch", "--prune", remote); err != nil {
		return fmt.Errorf("fetch %s: %w", remote, err)
	}
	currentCommit, err := gitOutput(sourcePath, "rev-parse", "HEAD")
	if err != nil {
		return err
	}
	targetCommit, err := gitOutput(sourcePath, "rev-parse", "@{upstream}")
	if err != nil {
		return err
	}
	if currentCommit != targetCommit {
		if !gitSucceeds(sourcePath, "merge-base", "--is-ancestor", currentCommit, targetCommit) {
			return fmt.Errorf(
				"source checkout is not a fast-forward of %s; reconcile it manually before upgrading",
				upstream,
			)
		}
	}

	fmt.Fprintf(stdout, "Installed: %s (%s)\n",
		emptyFallback(record.InstalledVersion, "unknown"),
		shortCommit(record.Commit),
	)
	fmt.Fprintf(stdout, "Source:    %s\n", shortCommit(currentCommit))
	fmt.Fprintf(stdout, "Upstream:  %s (%s)\n", shortCommit(targetCommit), upstream)

	needsSourceUpdate := currentCommit != targetCommit
	needsInstall := *force || record.Dirty || record.Commit != targetCommit
	if *checkOnly {
		if needsSourceUpdate || needsInstall {
			fmt.Fprintln(stdout, "Upgrade available.")
		} else {
			fmt.Fprintln(stdout, "Thalweg is up to date.")
		}
		return nil
	}
	if !needsSourceUpdate && !needsInstall {
		fmt.Fprintln(stdout, "Thalweg is already up to date.")
		return nil
	}

	config, _, configErr := loadLocalConfig()
	daemonWasRunning := false
	if configErr == nil {
		if state, stateErr := loadDaemonState(daemonStatePath(config)); stateErr == nil &&
			state.SocketPath != "" {
			config.SocketPath = state.SocketPath
		}
		daemonWasRunning = daemonResponding(config.SocketPath)
	}
	if needsSourceUpdate {
		if _, err := gitOutput(sourcePath, "merge", "--ff-only", "@{upstream}"); err != nil {
			return fmt.Errorf("fast-forward source checkout: %w", err)
		}
	}
	if err := runSourceInstaller(sourcePath, record.BinaryPath, *recordFlag, stdout, stderr); err != nil {
		return err
	}
	if daemonWasRunning {
		if *noRestart {
			fmt.Fprintln(stdout, "The daemon is still running the previous binary; restart it when convenient.")
		} else if err := runInstalledCommand(
			record.BinaryPath,
			[]string{"daemon", "restart"},
			stdout,
			stderr,
		); err != nil {
			return fmt.Errorf("restart upgraded daemon: %w", err)
		}
	}
	fmt.Fprintf(stdout, "Upgraded Thalweg to %s.\n", shortCommit(targetCommit))
	return nil
}

func defaultInstallRecordPath() (string, error) {
	if path := os.Getenv("THALWEG_INSTALL_RECORD_PATH"); path != "" {
		return path, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("find home directory: %w", err)
	}
	root := os.Getenv("XDG_DATA_HOME")
	if root == "" {
		root = filepath.Join(home, ".local", "share")
	}
	return filepath.Join(root, "thalweg", "install.json"), nil
}

func loadInstallRecord(path string) (installRecord, error) {
	info, err := os.Lstat(path)
	if err != nil {
		return installRecord{}, err
	}
	if info.Mode()&os.ModeSymlink != 0 {
		return installRecord{}, fmt.Errorf("refusing to read symlink installation record %s", path)
	}
	if !info.Mode().IsRegular() {
		return installRecord{}, fmt.Errorf("installation record is not a regular file: %s", path)
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return installRecord{}, fmt.Errorf("read installation record %s: %w", path, err)
	}
	var record installRecord
	if err := json.Unmarshal(content, &record); err != nil {
		return installRecord{}, fmt.Errorf("decode installation record %s: %w", path, err)
	}
	if record.Version != installRecordVersion {
		return installRecord{}, fmt.Errorf(
			"unsupported installation record version %d in %s",
			record.Version,
			path,
		)
	}
	if record.Channel == "" || record.SourcePath == "" || record.BinaryPath == "" {
		return installRecord{}, fmt.Errorf("installation record %s is incomplete", path)
	}
	if !filepath.IsAbs(record.SourcePath) || !filepath.IsAbs(record.BinaryPath) {
		return installRecord{}, fmt.Errorf(
			"installation record %s must contain absolute source and binary paths",
			path,
		)
	}
	return record, nil
}

func validateUpgradeSource(path string) (string, error) {
	resolved, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("resolve source checkout %s: %w", path, err)
	}
	resolved, err = filepath.EvalSymlinks(resolved)
	if err != nil {
		return "", fmt.Errorf("resolve source checkout %s: %w", path, err)
	}
	root, err := gitOutput(resolved, "rev-parse", "--show-toplevel")
	if err != nil {
		return "", fmt.Errorf("validate source checkout %s: %w", resolved, err)
	}
	root, err = filepath.Abs(root)
	if err != nil {
		return "", fmt.Errorf("resolve Git root %s: %w", root, err)
	}
	root, err = filepath.EvalSymlinks(root)
	if err != nil {
		return "", fmt.Errorf("resolve Git root %s: %w", root, err)
	}
	if root != resolved {
		return "", fmt.Errorf(
			"recorded source path %s does not match Git root %s",
			resolved,
			root,
		)
	}
	if info, err := os.Stat(filepath.Join(resolved, "scripts", "install.sh")); err != nil {
		return "", fmt.Errorf("inspect source installer: %w", err)
	} else if !info.Mode().IsRegular() {
		return "", fmt.Errorf("source installer is not a regular file")
	}
	return resolved, nil
}

func gitOutput(sourcePath string, args ...string) (string, error) {
	commandArgs := append([]string{"-C", sourcePath}, args...)
	command := exec.Command("git", commandArgs...)
	output, err := command.CombinedOutput()
	rendered := strings.TrimSpace(string(output))
	if err != nil {
		if rendered == "" {
			return "", fmt.Errorf("git %s: %w", strings.Join(args, " "), err)
		}
		return "", fmt.Errorf("git %s: %s", strings.Join(args, " "), rendered)
	}
	return rendered, nil
}

func gitSucceeds(sourcePath string, args ...string) bool {
	commandArgs := append([]string{"-C", sourcePath}, args...)
	return exec.Command("git", commandArgs...).Run() == nil
}

func runSourceInstaller(
	sourcePath string,
	binaryPath string,
	recordPath string,
	stdout io.Writer,
	stderr io.Writer,
) error {
	if filepath.Base(binaryPath) != "thalweg" {
		return fmt.Errorf("refusing to replace unexpected binary path %s", binaryPath)
	}
	installDir := filepath.Dir(binaryPath)
	command := exec.Command("/bin/sh", filepath.Join(sourcePath, "scripts", "install.sh"))
	command.Dir = sourcePath
	command.Env = overrideEnvironment(os.Environ(), map[string]string{
		"THALWEG_INSTALL_DIR":         installDir,
		"THALWEG_INSTALL_RECORD_PATH": recordPath,
		"THALWEG_INSTALL_SOURCE_DIR":  sourcePath,
	})
	command.Stdout = stdout
	command.Stderr = stderr
	if err := command.Run(); err != nil {
		return fmt.Errorf("build and install upgraded Thalweg: %w", err)
	}
	return nil
}

func runInstalledCommand(
	binaryPath string,
	args []string,
	stdout io.Writer,
	stderr io.Writer,
) error {
	command := exec.Command(binaryPath, args...)
	command.Stdout = stdout
	command.Stderr = stderr
	return command.Run()
}

func daemonResponding(socketPath string) bool {
	_, err := callDaemonTimeout(socketPath, "network_status", map[string]any{}, 2*time.Second)
	return err == nil
}

func overrideEnvironment(base []string, overrides map[string]string) []string {
	result := make([]string, 0, len(base)+len(overrides))
	for _, entry := range base {
		key, _, ok := strings.Cut(entry, "=")
		if ok {
			if _, replaced := overrides[key]; replaced {
				continue
			}
		}
		result = append(result, entry)
	}
	for key, value := range overrides {
		result = append(result, key+"="+value)
	}
	return result
}

func shortCommit(commit string) string {
	if commit == "" || commit == "unknown" {
		return "unknown"
	}
	if len(commit) <= 12 {
		return commit
	}
	return commit[:12]
}
