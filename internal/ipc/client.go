package ipc

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net"
	"time"
)

const ProtocolVersion = 1

type Request struct {
	ID              string `json:"id"`
	ProtocolVersion int    `json:"protocolVersion"`
	Action          string `json:"action"`
	Payload         any    `json:"payload"`
}

type Response struct {
	ID              string          `json:"id"`
	ProtocolVersion int             `json:"protocolVersion"`
	Success         bool            `json:"success"`
	Data            json.RawMessage `json:"data"`
	Error           string          `json:"error"`
}

// Call performs one correlated request against the local daemon. Higher-level
// clients own action-specific payload and result types; this package owns the
// common framing, deadline, and protocol compatibility checks.
func Call(
	ctx context.Context,
	socketPath string,
	clientName string,
	requestPrefix string,
	action string,
	payload any,
) (json.RawMessage, error) {
	dialer := net.Dialer{Timeout: 2 * time.Second}
	conn, err := dialer.DialContext(ctx, "unix", socketPath)
	if err != nil {
		return nil, fmt.Errorf("connect to daemon at %s: %w", socketPath, err)
	}
	defer conn.Close()
	if deadline, ok := ctx.Deadline(); ok {
		if err := conn.SetDeadline(deadline); err != nil {
			return nil, fmt.Errorf("set daemon request deadline: %w", err)
		}
	}

	requestID := fmt.Sprintf("%s-%d", requestPrefix, time.Now().UnixNano())
	request := Request{
		ID:              requestID,
		ProtocolVersion: ProtocolVersion,
		Action:          action,
		Payload:         payload,
	}
	if err := json.NewEncoder(conn).Encode(request); err != nil {
		return nil, fmt.Errorf("send %s request: %w", action, err)
	}

	var response Response
	if err := json.NewDecoder(bufio.NewReader(conn)).Decode(&response); err != nil {
		return nil, fmt.Errorf("read %s response: %w", action, err)
	}
	if response.ID != requestID {
		return nil, fmt.Errorf("daemon response ID %q did not match request %q", response.ID, requestID)
	}
	if response.ProtocolVersion != ProtocolVersion {
		return nil, fmt.Errorf(
			"daemon protocol version %d is incompatible with %s version %d",
			response.ProtocolVersion,
			clientName,
			ProtocolVersion,
		)
	}
	if !response.Success {
		if response.Error == "" {
			response.Error = "unknown daemon error"
		}
		return nil, fmt.Errorf("%s", response.Error)
	}
	if len(response.Data) == 0 {
		return json.RawMessage("null"), nil
	}
	return response.Data, nil
}
