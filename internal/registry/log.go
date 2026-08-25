package registry

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

const (
	maxLogBytes = 10 * 1024 * 1024
	logBackups  = 3
)

type rotatingLog struct {
	mu   sync.Mutex
	path string
	file *os.File
}

func openRotatingLog(root, name string) (*rotatingLog, error) {
	if err := os.MkdirAll(root, 0o700); err != nil {
		return nil, fmt.Errorf("create registry log directory: %w", err)
	}
	if err := os.Chmod(root, 0o700); err != nil {
		return nil, err
	}
	log := &rotatingLog{path: filepath.Join(root, name+".log")}
	if err := log.open(); err != nil {
		return nil, err
	}
	return log, nil
}

func (l *rotatingLog) open() error {
	file, err := os.OpenFile(l.path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o600)
	if err != nil {
		return fmt.Errorf("open registry log %s: %w", l.path, err)
	}
	if err := file.Chmod(0o600); err != nil {
		file.Close()
		return err
	}
	l.file = file
	return nil
}

func (l *rotatingLog) Write(data []byte) (int, error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.file == nil {
		return 0, os.ErrClosed
	}
	if info, err := l.file.Stat(); err == nil && info.Size()+int64(len(data)) > maxLogBytes {
		if err := l.rotate(); err != nil {
			return 0, err
		}
	}
	return l.file.Write(data)
}

func (l *rotatingLog) rotate() error {
	if err := l.file.Close(); err != nil {
		return err
	}
	l.file = nil
	for index := logBackups - 1; index >= 1; index-- {
		from := fmt.Sprintf("%s.%d", l.path, index)
		to := fmt.Sprintf("%s.%d", l.path, index+1)
		if err := os.Rename(from, to); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	if err := os.Rename(l.path, l.path+".1"); err != nil && !os.IsNotExist(err) {
		return err
	}
	return l.open()
}

func (l *rotatingLog) Close() error {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.file == nil {
		return nil
	}
	err := l.file.Close()
	l.file = nil
	return err
}
