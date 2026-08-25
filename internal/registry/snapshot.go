package registry

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

func LoadSnapshot(path string) (Snapshot, bool, error) {
	info, statErr := os.Lstat(path)
	if errors.Is(statErr, os.ErrNotExist) {
		return Snapshot{}, false, nil
	}
	if statErr != nil {
		return Snapshot{}, false, fmt.Errorf("inspect accepted registry snapshot: %w", statErr)
	}
	if !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 || info.Mode().Perm()&0o077 != 0 {
		return Snapshot{}, false, fmt.Errorf("accepted registry snapshot %s must be a regular mode-0600 file", path)
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return Snapshot{}, false, fmt.Errorf("read accepted registry snapshot: %w", err)
	}
	var snapshot Snapshot
	if err := json.Unmarshal(content, &snapshot); err != nil {
		return Snapshot{}, false, fmt.Errorf("decode accepted registry snapshot: %w", err)
	}
	if snapshot.Version != SnapshotVersion {
		return Snapshot{}, false, fmt.Errorf("unsupported registry snapshot version %d", snapshot.Version)
	}
	return snapshot, true, nil
}

func WriteSnapshot(path string, snapshot Snapshot) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("create registry state directory: %w", err)
	}
	if err := os.Chmod(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("restrict registry state directory: %w", err)
	}
	content, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		return fmt.Errorf("encode registry snapshot: %w", err)
	}
	content = append(content, '\n')
	temp, err := os.CreateTemp(filepath.Dir(path), ".accepted-*.tmp")
	if err != nil {
		return fmt.Errorf("create registry snapshot temporary file: %w", err)
	}
	tempPath := temp.Name()
	defer os.Remove(tempPath)
	if err := temp.Chmod(0o600); err != nil {
		temp.Close()
		return err
	}
	if _, err := temp.Write(content); err != nil {
		temp.Close()
		return err
	}
	if err := temp.Sync(); err != nil {
		temp.Close()
		return err
	}
	if err := temp.Close(); err != nil {
		return err
	}
	if err := os.Rename(tempPath, path); err != nil {
		return fmt.Errorf("install accepted registry snapshot: %w", err)
	}
	return nil
}
