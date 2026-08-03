package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"thalweg/internal/ipc"
)

const localProtocolVersion = ipc.ProtocolVersion

type ipcRequest = ipc.Request

func callDaemon(socketPath, action string, payload any) (json.RawMessage, error) {
	return callDaemonTimeout(socketPath, action, payload, 45*time.Second)
}

func callDaemonTimeout(socketPath, action string, payload any, timeout time.Duration) (json.RawMessage, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	data, err := ipc.Call(ctx, socketPath, "CLI", "cli", action, payload)
	if err != nil && strings.Contains(err.Error(), "connect to daemon at") {
		return nil, fmt.Errorf("%w (start it with `thalweg daemon`)", err)
	}
	return data, err
}

func prettyJSON(value json.RawMessage) ([]byte, error) {
	var output bytes.Buffer
	if err := json.Indent(&output, value, "", "  "); err != nil {
		return nil, fmt.Errorf("format daemon response: %w", err)
	}
	output.WriteByte('\n')
	return output.Bytes(), nil
}
