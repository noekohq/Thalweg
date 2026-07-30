package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net"
	"time"
)

const localProtocolVersion = 1

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

func callDaemon(socketPath, action string, payload any) (json.RawMessage, error) {
	conn, err := net.DialTimeout("unix", socketPath, 2*time.Second)
	if err != nil {
		return nil, fmt.Errorf(
			"connect to daemon at %s: %w (start it with `thalweg daemon`)",
			socketPath,
			err,
		)
	}
	defer conn.Close()
	if err := conn.SetDeadline(time.Now().Add(45 * time.Second)); err != nil {
		return nil, fmt.Errorf("set daemon request deadline: %w", err)
	}

	requestID := fmt.Sprintf("cli-%d", time.Now().UnixNano())
	request := ipcRequest{
		ID:              requestID,
		ProtocolVersion: localProtocolVersion,
		Action:          action,
		Payload:         payload,
	}
	if err := json.NewEncoder(conn).Encode(request); err != nil {
		return nil, fmt.Errorf("send %s request: %w", action, err)
	}

	var response ipcResponse
	decoder := json.NewDecoder(bufio.NewReader(conn))
	if err := decoder.Decode(&response); err != nil {
		return nil, fmt.Errorf("read %s response: %w", action, err)
	}
	if response.ID != requestID {
		return nil, fmt.Errorf("daemon response ID %q did not match request %q", response.ID, requestID)
	}
	if response.ProtocolVersion != localProtocolVersion {
		return nil, fmt.Errorf(
			"daemon protocol version %d is incompatible with CLI version %d",
			response.ProtocolVersion,
			localProtocolVersion,
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

func prettyJSON(value json.RawMessage) ([]byte, error) {
	var output bytes.Buffer
	if err := json.Indent(&output, value, "", "  "); err != nil {
		return nil, fmt.Errorf("format daemon response: %w", err)
	}
	output.WriteByte('\n')
	return output.Bytes(), nil
}
