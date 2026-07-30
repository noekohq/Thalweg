package daemon

import (
	"crypto/rand"
	"errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"syscall"
	"time"

	libp2pcrypto "github.com/libp2p/go-libp2p/core/crypto"
)

const identityFileName = "identity.key"

func identityPath(dbPath string) string {
	return filepath.Join(filepath.Dir(filepath.Clean(dbPath)), identityFileName)
}

func loadOrCreateIdentity(path string) (libp2pcrypto.PrivKey, error) {
	info, err := os.Lstat(path)
	switch {
	case err == nil:
		if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
			return nil, fmt.Errorf("identity path must be a regular file: %s", path)
		}
		if info.Mode().Perm()&0o077 != 0 {
			return nil, fmt.Errorf("identity file permissions must not allow group or other access: %s", path)
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("read identity file: %w", err)
		}
		privateKey, err := libp2pcrypto.UnmarshalPrivateKey(data)
		if err != nil {
			return nil, fmt.Errorf("decode identity file: %w", err)
		}
		return privateKey, nil
	case !errors.Is(err, os.ErrNotExist):
		return nil, fmt.Errorf("inspect identity file: %w", err)
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, fmt.Errorf("create identity directory: %w", err)
	}
	privateKey, _, err := libp2pcrypto.GenerateEd25519Key(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("generate identity key: %w", err)
	}
	encoded, err := libp2pcrypto.MarshalPrivateKey(privateKey)
	if err != nil {
		return nil, fmt.Errorf("encode identity key: %w", err)
	}

	temp, err := os.CreateTemp(filepath.Dir(path), ".identity-*.tmp")
	if err != nil {
		return nil, fmt.Errorf("create temporary identity file: %w", err)
	}
	tempPath := temp.Name()
	defer os.Remove(tempPath)

	if err := temp.Chmod(0o600); err != nil {
		temp.Close()
		return nil, fmt.Errorf("restrict temporary identity permissions: %w", err)
	}
	if _, err := temp.Write(encoded); err != nil {
		temp.Close()
		return nil, fmt.Errorf("write temporary identity: %w", err)
	}
	if err := temp.Sync(); err != nil {
		temp.Close()
		return nil, fmt.Errorf("sync temporary identity: %w", err)
	}
	if err := temp.Close(); err != nil {
		return nil, fmt.Errorf("close temporary identity: %w", err)
	}
	if err := os.Rename(tempPath, path); err != nil {
		return nil, fmt.Errorf("persist identity file: %w", err)
	}
	return privateKey, nil
}

func prepareSocket(path string) error {
	info, err := os.Lstat(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("inspect unix socket path: %w", err)
	}
	if info.Mode()&os.ModeSocket == 0 {
		return fmt.Errorf("refusing to remove non-socket path: %s", path)
	}

	conn, dialErr := net.DialTimeout("unix", path, 200*time.Millisecond)
	if dialErr == nil {
		_ = conn.Close()
		return fmt.Errorf("daemon socket is already active: %s", path)
	}
	if errors.Is(dialErr, os.ErrNotExist) {
		return nil
	}
	if !errors.Is(dialErr, syscall.ECONNREFUSED) {
		return fmt.Errorf("cannot prove unix socket is stale, refusing to remove %s: %w", path, dialErr)
	}
	if err := os.Remove(path); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return fmt.Errorf("remove stale unix socket: %w", err)
	}
	return nil
}
