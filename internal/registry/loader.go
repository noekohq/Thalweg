package registry

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

var (
	definitionNamePattern  = regexp.MustCompile(`^[a-z0-9][a-z0-9._-]{0,127}$`)
	environmentNamePattern = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)
	expansionPattern       = regexp.MustCompile(`\$\{([A-Za-z_][A-Za-z0-9_]*)\}`)
)

type ValidationReport struct {
	RegistryPath string       `json:"registryPath"`
	Valid        bool         `json:"valid"`
	Definitions  []Definition `json:"definitions"`
}

func Load(root string) (Snapshot, error) {
	root, err := filepath.Abs(root)
	if err != nil {
		return Snapshot{}, fmt.Errorf("resolve registry path: %w", err)
	}
	definitions := make([]Definition, 0)
	if err := validateDirectory(root, true); err != nil {
		return Snapshot{}, err
	}
	directories := []struct {
		name string
		kind string
	}{{"sources", KindSource}, {"sinks", KindSink}, {"processors", KindProcessor}}
	seen := make(map[string]string)
	for _, directory := range directories {
		path := filepath.Join(root, directory.name)
		if err := validateDirectory(path, true); err != nil {
			return Snapshot{}, err
		}
		entries, err := os.ReadDir(path)
		if errors.Is(err, os.ErrNotExist) {
			continue
		}
		if err != nil {
			return Snapshot{}, fmt.Errorf("read registry directory %s: %w", path, err)
		}
		for _, entry := range entries {
			ext := strings.ToLower(filepath.Ext(entry.Name()))
			if ext != ".yaml" && ext != ".yml" {
				continue
			}
			path := filepath.Join(path, entry.Name())
			definition, err := loadDefinition(path, directory.kind, root)
			if err != nil {
				return Snapshot{}, err
			}
			if first, exists := seen[definition.Name()]; exists {
				return Snapshot{}, fmt.Errorf("duplicate registry definition %q in %s and %s", definition.Name(), first, path)
			}
			seen[definition.Name()] = path
			definitions = append(definitions, definition)
		}
	}
	sort.Slice(definitions, func(i, j int) bool { return definitions[i].Name() < definitions[j].Name() })
	return Snapshot{
		Version: SnapshotVersion, RegistryPath: root, Definitions: definitions,
		AcceptedAt: time.Now().UTC().Format(time.RFC3339Nano),
	}, nil
}

func Validate(root string) (ValidationReport, error) {
	snapshot, err := Load(root)
	if err != nil {
		return ValidationReport{RegistryPath: root, Valid: false, Definitions: []Definition{}}, err
	}
	return ValidationReport{RegistryPath: snapshot.RegistryPath, Valid: true, Definitions: snapshot.Definitions}, nil
}

func loadDefinition(path, expectedKind, registryRoot string) (Definition, error) {
	info, err := os.Lstat(path)
	if err != nil {
		return Definition{}, fmt.Errorf("inspect registry definition %s: %w", path, err)
	}
	if !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 {
		return Definition{}, fmt.Errorf("registry definition %s must be a regular non-symlink file", path)
	}
	if info.Mode().Perm()&0o022 != 0 {
		return Definition{}, fmt.Errorf("registry definition %s is writable by group or others", path)
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return Definition{}, fmt.Errorf("read registry definition %s: %w", path, err)
	}
	decoder := yaml.NewDecoder(bytes.NewReader(content))
	decoder.KnownFields(true)
	var definition Definition
	if err := decoder.Decode(&definition); err != nil {
		return Definition{}, fmt.Errorf("decode registry definition %s: %w", path, err)
	}
	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		if err == nil {
			return Definition{}, fmt.Errorf("registry definition %s contains multiple YAML documents", path)
		}
		return Definition{}, fmt.Errorf("decode trailing YAML in %s: %w", path, err)
	}
	definition.SourceFile = path
	if definition.APIVersion != APIVersion {
		return Definition{}, fmt.Errorf("registry definition %s uses unsupported apiVersion %q", path, definition.APIVersion)
	}
	if definition.Kind != expectedKind {
		return Definition{}, fmt.Errorf("registry definition %s has kind %q but is stored under %s", path, definition.Kind, lowerKind(expectedKind)+"s")
	}
	applyDefaults(&definition)
	if err := validateDefinition(&definition, registryRoot); err != nil {
		return Definition{}, fmt.Errorf("validate registry definition %s: %w", path, err)
	}
	digest, err := definitionDigest(definition)
	if err != nil {
		return Definition{}, fmt.Errorf("digest registry definition %s: %w", path, err)
	}
	definition.Digest = digest
	return definition, nil
}

func applyDefaults(definition *Definition) {
	if definition.Metadata.Labels == nil {
		definition.Metadata.Labels = map[string]string{}
	}
	if definition.Spec.Runner.Type == "" {
		definition.Spec.Runner.Type = "exec"
	}
	if definition.Kind == KindSource && definition.Spec.Runner.Mode == "" {
		definition.Spec.Runner.Mode = "stream"
	}
	if definition.Spec.Input.Format == "" {
		definition.Spec.Input.Format = "raw-ndjson"
	}
	if definition.Spec.Delivery.MaxEvents == 0 {
		definition.Spec.Delivery.MaxEvents = defaultBatchSize
	}
	if definition.Spec.Delivery.Wait.Duration == 0 {
		definition.Spec.Delivery.Wait.Duration = 20 * time.Second
	}
	if definition.Spec.Retry.Policy == "" {
		definition.Spec.Retry.Policy = "always"
	}
	if definition.Spec.Retry.InitialBackoff.Duration == 0 {
		definition.Spec.Retry.InitialBackoff.Duration = time.Second
	}
	if definition.Spec.Retry.MaxBackoff.Duration == 0 {
		definition.Spec.Retry.MaxBackoff.Duration = time.Minute
	}
	if definition.Spec.Timeout.Duration == 0 && definition.Kind != KindSource {
		definition.Spec.Timeout.Duration = 5 * time.Minute
	}
	if definition.Spec.Timeout.Duration == 0 && definition.Spec.Runner.Mode != "stream" {
		definition.Spec.Timeout.Duration = 30 * time.Second
	}
	if definition.Spec.Environment.Inherit == nil {
		value := true
		definition.Spec.Environment.Inherit = &value
	}
	if definition.Spec.Environment.Values == nil {
		definition.Spec.Environment.Values = map[string]string{}
	}
}

func validateDefinition(definition *Definition, registryRoot string) error {
	if !definitionNamePattern.MatchString(definition.Name()) {
		return fmt.Errorf("metadata.name must match %s", definitionNamePattern)
	}
	if strings.TrimSpace(definition.Spec.Network) == "" {
		return fmt.Errorf("spec.network is required")
	}
	if definition.Spec.Runner.Type != "exec" {
		return fmt.Errorf("spec.runner.type must be exec")
	}
	if len(definition.Spec.Runner.Command) == 0 || strings.TrimSpace(definition.Spec.Runner.Command[0]) == "" {
		return fmt.Errorf("spec.runner.command requires an executable")
	}
	if definition.Spec.Retry.InitialBackoff.Duration <= 0 || definition.Spec.Retry.MaxBackoff.Duration < definition.Spec.Retry.InitialBackoff.Duration {
		return fmt.Errorf("retry backoff must be positive and maxBackoff must be at least initialBackoff")
	}
	if definition.Spec.Retry.Policy != "always" && definition.Spec.Retry.Policy != "on-failure" && definition.Spec.Retry.Policy != "never" {
		return fmt.Errorf("retry.policy must be always, on-failure, or never")
	}
	if definition.Spec.Timeout.Duration < 0 {
		return fmt.Errorf("timeout must not be negative")
	}
	for key := range definition.Spec.Environment.Values {
		if !environmentNamePattern.MatchString(key) {
			return fmt.Errorf("invalid environment variable name %q", key)
		}
	}
	envValues, err := loadEnvironmentFiles(definition.Spec.Environment.From, filepath.Join(filepath.Dir(registryRoot), "env.d"))
	if err != nil {
		return err
	}
	for key, value := range definition.Spec.Environment.Values {
		envValues[key] = value
	}
	definition.EnvValues = envValues

	workingDirectory := definition.Spec.Runner.WorkingDirectory
	if workingDirectory == "" {
		workingDirectory = filepath.Dir(definition.SourceFile)
	} else if !filepath.IsAbs(workingDirectory) {
		workingDirectory = filepath.Join(filepath.Dir(definition.SourceFile), workingDirectory)
	}
	workingDirectory = filepath.Clean(workingDirectory)
	info, err := os.Stat(workingDirectory)
	if err != nil || !info.IsDir() {
		return fmt.Errorf("runner working directory %s is not available", workingDirectory)
	}
	definition.Spec.Runner.WorkingDirectory = workingDirectory

	environment := resolvedEnvironment(*definition)
	for index, argument := range definition.Spec.Runner.Command {
		expanded, err := expand(argument, environment)
		if err != nil {
			return fmt.Errorf("runner.command[%d]: %w", index, err)
		}
		definition.Spec.Runner.Command[index] = expanded
	}
	if strings.ContainsRune(definition.Spec.Runner.Command[0], filepath.Separator) && !filepath.IsAbs(definition.Spec.Runner.Command[0]) {
		definition.Spec.Runner.Command[0] = filepath.Join(workingDirectory, definition.Spec.Runner.Command[0])
	}
	if err := preflightExecutable(definition.Spec.Runner.Command[0], environment, workingDirectory); err != nil {
		return err
	}

	switch definition.Kind {
	case KindSource:
		if strings.TrimSpace(definition.Spec.Stream) == "" {
			return fmt.Errorf("spec.stream is required for Source")
		}
		mode := definition.Spec.Runner.Mode
		if mode != "stream" && mode != "interval" && mode != "once" {
			return fmt.Errorf("source runner.mode must be stream, interval, or once")
		}
		if mode == "interval" && definition.Spec.Runner.Interval.Duration <= 0 {
			return fmt.Errorf("interval source requires a positive runner.interval")
		}
		if definition.Spec.Input.Format != "raw-ndjson" && definition.Spec.Input.Format != "event-ndjson" {
			return fmt.Errorf("source input.format must be raw-ndjson or event-ndjson")
		}
	case KindSink, KindProcessor:
		if definition.Spec.Events.Start != "earliest" && definition.Spec.Events.Start != "latest" {
			return fmt.Errorf("spec.events.start must explicitly be earliest or latest")
		}
		if definition.Spec.Delivery.MaxEvents < 1 || definition.Spec.Delivery.MaxEvents > 100 {
			return fmt.Errorf("delivery.maxEvents must be between 1 and 100")
		}
		if definition.Spec.Delivery.Wait.Duration < 0 || definition.Spec.Delivery.Wait.Duration > time.Minute {
			return fmt.Errorf("delivery.wait must be between 0 and 1m")
		}
		if definition.Kind == KindProcessor && len(definition.Spec.Output.AllowedStreams) == 0 {
			return fmt.Errorf("Processor requires output.allowedStreams")
		}
	}
	return nil
}

func validateDirectory(path string, allowMissing bool) error {
	info, err := os.Lstat(path)
	if allowMissing && errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("inspect registry directory %s: %w", path, err)
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("registry path %s must be a non-symlink directory", path)
	}
	if info.Mode().Perm()&0o022 != 0 {
		return fmt.Errorf("registry directory %s is writable by group or others", path)
	}
	return nil
}

func loadEnvironmentFiles(names []string, root string) (map[string]string, error) {
	values := make(map[string]string)
	for _, name := range names {
		if !definitionNamePattern.MatchString(name) {
			return nil, fmt.Errorf("invalid environment file name %q", name)
		}
		path := filepath.Join(root, name+".env")
		info, err := os.Lstat(path)
		if err != nil {
			return nil, fmt.Errorf("inspect environment file %s: %w", path, err)
		}
		if !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 || info.Mode().Perm()&0o077 != 0 {
			return nil, fmt.Errorf("environment file %s must be a regular mode-0600 file", path)
		}
		file, err := os.Open(path)
		if err != nil {
			return nil, err
		}
		scanner := bufio.NewScanner(file)
		line := 0
		for scanner.Scan() {
			line++
			text := strings.TrimSpace(scanner.Text())
			if text == "" || strings.HasPrefix(text, "#") {
				continue
			}
			key, value, found := strings.Cut(text, "=")
			if !found || !environmentNamePattern.MatchString(key) {
				file.Close()
				return nil, fmt.Errorf("invalid environment assignment in %s:%d", path, line)
			}
			values[key] = value
		}
		err = scanner.Err()
		file.Close()
		if err != nil {
			return nil, fmt.Errorf("read environment file %s: %w", path, err)
		}
	}
	return values, nil
}

func resolvedEnvironment(definition Definition) map[string]string {
	values := make(map[string]string)
	if definition.Spec.Environment.Inherit == nil || *definition.Spec.Environment.Inherit {
		for _, item := range os.Environ() {
			key, value, found := strings.Cut(item, "=")
			if found {
				values[key] = value
			}
		}
	}
	for key, value := range definition.EnvValues {
		values[key] = value
	}
	values["THALWEG_REGISTRY_NAME"] = definition.Name()
	values["THALWEG_REGISTRY_KIND"] = definition.Kind
	values["THALWEG_NETWORK"] = definition.Spec.Network
	return values
}

func environmentList(definition Definition) []string {
	values := resolvedEnvironment(definition)
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	result := make([]string, 0, len(keys))
	for _, key := range keys {
		result = append(result, key+"="+values[key])
	}
	return result
}

func expand(value string, environment map[string]string) (string, error) {
	var missing string
	result := expansionPattern.ReplaceAllStringFunc(value, func(match string) string {
		name := expansionPattern.FindStringSubmatch(match)[1]
		resolved, exists := environment[name]
		if !exists {
			missing = name
			return match
		}
		return resolved
	})
	if missing != "" {
		return "", fmt.Errorf("environment variable %s is not defined", missing)
	}
	return result, nil
}

func preflightExecutable(command string, environment map[string]string, workingDirectory string) error {
	if strings.ContainsRune(command, filepath.Separator) {
		path := command
		if !filepath.IsAbs(path) {
			path = filepath.Join(workingDirectory, path)
		}
		info, err := os.Stat(path)
		if err != nil || info.IsDir() || info.Mode().Perm()&0o111 == 0 {
			return fmt.Errorf("runner executable %s is not executable", command)
		}
		return nil
	}
	pathValue := environment["PATH"]
	if pathValue == "" {
		pathValue = os.Getenv("PATH")
	}
	for _, directory := range filepath.SplitList(pathValue) {
		candidate := filepath.Join(directory, command)
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() && info.Mode().Perm()&0o111 != 0 {
			return nil
		}
	}
	if _, err := exec.LookPath(command); err != nil {
		return fmt.Errorf("runner executable %q is not available", command)
	}
	return nil
}

func definitionDigest(definition Definition) (string, error) {
	definition.Digest = ""
	definition.SourceFile = ""
	encoded, err := json.Marshal(definition)
	if err != nil {
		return "", err
	}
	digest := sha256.Sum256(encoded)
	return hex.EncodeToString(digest[:]), nil
}
