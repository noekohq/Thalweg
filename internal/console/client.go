package console

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"thalweg/internal/ipc"
)

type Caller interface {
	Call(context.Context, string, any, any) error
}

type IPCClient struct {
	SocketPath string
	Timeout    time.Duration
}

func (c IPCClient) Call(ctx context.Context, action string, payload, target any) error {
	timeout := c.Timeout
	if timeout <= 0 {
		timeout = 5 * time.Second
	}
	requestCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	data, err := ipc.Call(requestCtx, c.SocketPath, "console", "console", action, payload)
	if err != nil {
		return err
	}
	if target == nil || len(data) == 0 {
		return nil
	}
	if err := json.Unmarshal(data, target); err != nil {
		return fmt.Errorf("decode %s response: %w", action, err)
	}
	return nil
}
