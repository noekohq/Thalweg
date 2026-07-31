package console

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net"
	"time"
)

const localProtocolVersion = 1

type Caller interface {
	Call(context.Context, string, any, any) error
}

type IPCClient struct {
	SocketPath string
	Timeout    time.Duration
}

type ipcRequest struct {
	ID              string `json:"id"`
	ProtocolVersion int    `json:"protocolVersion"`
	Action          string `json:"action"`
	Payload         any    `json:"payload"`
}

type ipcResponse struct {
	ID              string          `json:"id"`
	ProtocolVersion int             `json:"protocolVersion"`
	Success         bool            `json:"success"`
	Data            json.RawMessage `json:"data"`
	Error           string          `json:"error"`
}

func (c IPCClient) Call(ctx context.Context, action string, payload, target any) error {
	timeout := c.Timeout
	if timeout <= 0 {
		timeout = 5 * time.Second
	}
	dialer := net.Dialer{Timeout: 2 * time.Second}
	conn, err := dialer.DialContext(ctx, "unix", c.SocketPath)
	if err != nil {
		return fmt.Errorf("connect to daemon at %s: %w", c.SocketPath, err)
	}
	defer conn.Close()

	deadline := time.Now().Add(timeout)
	if contextDeadline, ok := ctx.Deadline(); ok && contextDeadline.Before(deadline) {
		deadline = contextDeadline
	}
	if err := conn.SetDeadline(deadline); err != nil {
		return fmt.Errorf("set daemon deadline: %w", err)
	}

	requestID := fmt.Sprintf("console-%d", time.Now().UnixNano())
	request := ipcRequest{
		ID:              requestID,
		ProtocolVersion: localProtocolVersion,
		Action:          action,
		Payload:         payload,
	}
	if err := json.NewEncoder(conn).Encode(request); err != nil {
		return fmt.Errorf("send %s request: %w", action, err)
	}

	var response ipcResponse
	if err := json.NewDecoder(bufio.NewReader(conn)).Decode(&response); err != nil {
		return fmt.Errorf("read %s response: %w", action, err)
	}
	if response.ID != requestID {
		return fmt.Errorf("daemon response ID %q did not match request %q", response.ID, requestID)
	}
	if response.ProtocolVersion != localProtocolVersion {
		return fmt.Errorf(
			"daemon protocol version %d is incompatible with console version %d",
			response.ProtocolVersion,
			localProtocolVersion,
		)
	}
	if !response.Success {
		if response.Error == "" {
			response.Error = "unknown daemon error"
		}
		return fmt.Errorf("%s", response.Error)
	}
	if target == nil || len(response.Data) == 0 {
		return nil
	}
	if err := json.Unmarshal(response.Data, target); err != nil {
		return fmt.Errorf("decode %s response: %w", action, err)
	}
	return nil
}
