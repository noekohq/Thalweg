package cli

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"thalweg/internal/registry"
)

const (
	defaultSocketPath = "/tmp/thalweg.sock"
	defaultP2PListen  = "/ip4/0.0.0.0/tcp/42422"
)

type localConfig struct {
	SocketPath         string   `json:"socketPath"`
	StoragePath        string   `json:"storagePath"`
	P2PListenAddresses []string `json:"p2pListenAddresses"`
	RegistryPath       string   `json:"registryPath"`
}

func defaultConfigPath() (string, error) {
	if path := os.Getenv("THALWEG_CONFIG_PATH"); path != "" {
		return path, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("find home directory: %w", err)
	}
	root := os.Getenv("XDG_CONFIG_HOME")
	if root == "" {
		root = filepath.Join(home, ".config")
	}
	return filepath.Join(root, "thalweg", "config.json"), nil
}

func defaultLocalConfig() (localConfig, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return localConfig{}, fmt.Errorf("find home directory: %w", err)
	}
	dataRoot := os.Getenv("XDG_DATA_HOME")
	if dataRoot == "" {
		dataRoot = filepath.Join(home, ".local", "share")
	}
	configRoot := os.Getenv("XDG_CONFIG_HOME")
	if configRoot == "" {
		configRoot = filepath.Join(home, ".config")
	}
	return localConfig{
		SocketPath:         defaultSocketPath,
		StoragePath:        filepath.Join(dataRoot, "thalweg", "storage", "badger"),
		P2PListenAddresses: []string{defaultP2PListen},
		RegistryPath:       filepath.Join(configRoot, "thalweg", "registry.d"),
	}, nil
}

func loadLocalConfig() (localConfig, string, error) {
	config, err := defaultLocalConfig()
	if err != nil {
		return localConfig{}, "", err
	}
	path, err := defaultConfigPath()
	if err != nil {
		return localConfig{}, "", err
	}
	content, err := os.ReadFile(path)
	if err == nil {
		if err := json.Unmarshal(content, &config); err != nil {
			return localConfig{}, path, fmt.Errorf("decode config %s: %w", path, err)
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return localConfig{}, path, fmt.Errorf("read config %s: %w", path, err)
	}

	if value := os.Getenv("THALWEG_SOCKET_PATH"); value != "" {
		config.SocketPath = value
	}
	if value := os.Getenv("THALWEG_STORAGE_PATH"); value != "" {
		config.StoragePath = value
	}
	if value := os.Getenv("THALWEG_P2P_LISTEN_ADDRS"); value != "" {
		config.P2PListenAddresses = splitCommaList(value)
	}
	if value := os.Getenv("THALWEG_REGISTRY_PATH"); value != "" {
		config.RegistryPath = value
	}
	if config.SocketPath == "" {
		return localConfig{}, path, fmt.Errorf("socketPath is required in %s", path)
	}
	if config.StoragePath == "" {
		return localConfig{}, path, fmt.Errorf("storagePath is required in %s", path)
	}
	if config.RegistryPath == "" {
		defaults, defaultsErr := defaultLocalConfig()
		if defaultsErr != nil {
			return localConfig{}, path, defaultsErr
		}
		config.RegistryPath = defaults.RegistryPath
	}
	return config, path, nil
}

func writeLocalConfig(path string, config localConfig, force bool) error {
	info, err := os.Lstat(path)
	if err == nil {
		if info.Mode()&os.ModeSymlink != 0 {
			return fmt.Errorf("refusing to replace symlink config %s", path)
		}
		if !force {
			return os.ErrExist
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("inspect config %s: %w", path, err)
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("create config directory: %w", err)
	}
	if err := os.Chmod(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("restrict config directory: %w", err)
	}
	if err := os.MkdirAll(filepath.Dir(config.StoragePath), 0o700); err != nil {
		return fmt.Errorf("create storage directory: %w", err)
	}
	if err := registry.EnsureDirectories(config.RegistryPath); err != nil {
		return fmt.Errorf("create registry directories: %w", err)
	}

	content, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("encode config: %w", err)
	}
	content = append(content, '\n')

	temp, err := os.CreateTemp(filepath.Dir(path), ".config-*.tmp")
	if err != nil {
		return fmt.Errorf("create temporary config: %w", err)
	}
	tempPath := temp.Name()
	defer os.Remove(tempPath)
	if err := temp.Chmod(0o600); err != nil {
		temp.Close()
		return fmt.Errorf("restrict temporary config: %w", err)
	}
	if _, err := temp.Write(content); err != nil {
		temp.Close()
		return fmt.Errorf("write temporary config: %w", err)
	}
	if err := temp.Sync(); err != nil {
		temp.Close()
		return fmt.Errorf("sync temporary config: %w", err)
	}
	if err := temp.Close(); err != nil {
		return fmt.Errorf("close temporary config: %w", err)
	}
	if err := os.Rename(tempPath, path); err != nil {
		return fmt.Errorf("install config: %w", err)
	}
	return nil
}
