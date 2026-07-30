package daemon

import (
	"bufio"
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/protocol"
)

const (
	meshProtocolID       protocol.ID = "/thalweg/mesh/1.0.0"
	meshProtocolVersion              = 1
	meshMaxFrameBytes                = 16 * 1024
	meshHandshakeTimeout             = 5 * time.Second
	meshNonceBytes                   = 32
)

type meshHello struct {
	Type            string `json:"type"`
	ProtocolVersion int    `json:"protocolVersion"`
	Network         string `json:"network"`
	NetworkID       string `json:"networkId"`
	Nonce           string `json:"nonce"`
	Proof           string `json:"proof"`
}

type meshWelcome struct {
	Type            string `json:"type"`
	ProtocolVersion int    `json:"protocolVersion"`
	Accepted        bool   `json:"accepted"`
	NetworkID       string `json:"networkId,omitempty"`
	Nonce           string `json:"nonce,omitempty"`
	Proof           string `json:"proof,omitempty"`
	Error           string `json:"error,omitempty"`
}

func (d *Daemon) authenticatePeer(ctx context.Context, remote peer.ID, networkName string) error {
	stream, _, _, err := d.openAuthenticatedMeshStream(ctx, remote, networkName)
	if err != nil {
		return err
	}
	return stream.Close()
}

func (d *Daemon) openAuthenticatedMeshStream(
	ctx context.Context,
	remote peer.ID,
	networkName string,
) (network.Stream, *bufio.Reader, networkMembership, error) {
	membership, exists := d.memberships.get(networkName)
	if !exists {
		return nil, nil, networkMembership{}, fmt.Errorf("network %q is not mounted", networkName)
	}
	stream, err := d.p2p.NewStream(ctx, remote, meshProtocolID)
	if err != nil {
		return nil, nil, networkMembership{}, fmt.Errorf("open mesh stream: %w", err)
	}
	closeWithError := func(err error) (network.Stream, *bufio.Reader, networkMembership, error) {
		_ = stream.Reset()
		return nil, nil, networkMembership{}, err
	}
	if err := stream.SetDeadline(time.Now().Add(meshHandshakeTimeout)); err != nil {
		return closeWithError(fmt.Errorf("set mesh handshake deadline: %w", err))
	}

	initiatorNonce, err := newMeshNonce()
	if err != nil {
		return closeWithError(err)
	}
	local := d.p2p.ID()
	hello := meshHello{
		Type:            "hello",
		ProtocolVersion: meshProtocolVersion,
		Network:         membership.Name,
		NetworkID:       membership.ID,
		Nonce:           initiatorNonce,
		Proof: meshProof(
			membership.Secret,
			"initiator",
			membership.ID,
			local.String(),
			remote.String(),
			initiatorNonce,
		),
	}
	if err := writeMeshFrame(stream, hello); err != nil {
		return closeWithError(fmt.Errorf("send mesh hello: %w", err))
	}
	reader := bufio.NewReaderSize(stream, meshMaxFrameBytes+1)
	var welcome meshWelcome
	if err := readMeshFrame(reader, &welcome); err != nil {
		return closeWithError(fmt.Errorf("read mesh welcome: %w", err))
	}
	if welcome.Type != "welcome" {
		return closeWithError(fmt.Errorf("unexpected mesh handshake response type %q", welcome.Type))
	}
	if welcome.ProtocolVersion != meshProtocolVersion {
		return closeWithError(fmt.Errorf(
			"unsupported remote mesh protocol version %d (daemon supports %d)",
			welcome.ProtocolVersion,
			meshProtocolVersion,
		))
	}
	if !welcome.Accepted {
		if welcome.Error == "" {
			welcome.Error = "membership authentication failed"
		}
		return closeWithError(errors.New(welcome.Error))
	}
	if welcome.NetworkID != membership.ID {
		return closeWithError(fmt.Errorf("mesh welcome selected an unexpected network"))
	}
	if err := validateMeshNonce(welcome.Nonce); err != nil {
		return closeWithError(fmt.Errorf("invalid responder nonce: %w", err))
	}
	expected := meshProof(
		membership.Secret,
		"responder",
		membership.ID,
		local.String(),
		remote.String(),
		initiatorNonce,
		welcome.Nonce,
	)
	if !proofsEqual(expected, welcome.Proof) {
		return closeWithError(fmt.Errorf("membership authentication failed"))
	}
	if err := stream.SetDeadline(time.Time{}); err != nil {
		return closeWithError(fmt.Errorf("clear mesh handshake deadline: %w", err))
	}
	return stream, reader, membership, nil
}

func (d *Daemon) handleMeshStream(stream network.Stream) {
	defer stream.Close()
	_ = stream.SetDeadline(time.Now().Add(meshHandshakeTimeout))
	reader := bufio.NewReaderSize(stream, meshMaxFrameBytes+1)

	var hello meshHello
	if err := readMeshFrame(reader, &hello); err != nil {
		_ = writeMeshFrame(stream, rejectedMeshWelcome("invalid mesh handshake"))
		return
	}
	if hello.Type != "hello" {
		_ = writeMeshFrame(stream, rejectedMeshWelcome("invalid mesh handshake"))
		return
	}
	if hello.ProtocolVersion != meshProtocolVersion {
		_ = writeMeshFrame(stream, meshWelcome{
			Type:            "welcome",
			ProtocolVersion: meshProtocolVersion,
			Error: fmt.Sprintf(
				"unsupported mesh protocol version %d",
				hello.ProtocolVersion,
			),
		})
		return
	}
	membership, exists := d.memberships.get(hello.Network)
	if !exists || membership.ID != hello.NetworkID {
		_ = writeMeshFrame(stream, rejectedMeshWelcome("membership authentication failed"))
		return
	}
	if err := validateMeshNonce(hello.Nonce); err != nil {
		_ = writeMeshFrame(stream, rejectedMeshWelcome("membership authentication failed"))
		return
	}

	initiator := stream.Conn().RemotePeer()
	responder := d.p2p.ID()
	expected := meshProof(
		membership.Secret,
		"initiator",
		membership.ID,
		initiator.String(),
		responder.String(),
		hello.Nonce,
	)
	if !proofsEqual(expected, hello.Proof) {
		_ = writeMeshFrame(stream, rejectedMeshWelcome("membership authentication failed"))
		return
	}
	responderNonce, err := newMeshNonce()
	if err != nil {
		_ = writeMeshFrame(stream, rejectedMeshWelcome("mesh handshake unavailable"))
		return
	}
	if err := writeMeshFrame(stream, meshWelcome{
		Type:            "welcome",
		ProtocolVersion: meshProtocolVersion,
		Accepted:        true,
		NetworkID:       membership.ID,
		Nonce:           responderNonce,
		Proof: meshProof(
			membership.Secret,
			"responder",
			membership.ID,
			initiator.String(),
			responder.String(),
			hello.Nonce,
			responderNonce,
		),
	}); err != nil {
		return
	}
	_ = stream.SetDeadline(time.Now().Add(syncTimeout))
	_ = d.serveSyncRequests(stream, reader, membership)
}

func rejectedMeshWelcome(message string) meshWelcome {
	return meshWelcome{
		Type:            "welcome",
		ProtocolVersion: meshProtocolVersion,
		Error:           message,
	}
}

func meshProof(secret string, parts ...string) string {
	key, err := base64.RawURLEncoding.DecodeString(secret)
	if err != nil {
		return ""
	}
	mac := hmac.New(sha256.New, key)
	for _, part := range parts {
		var size [4]byte
		binary.BigEndian.PutUint32(size[:], uint32(len(part)))
		_, _ = mac.Write(size[:])
		_, _ = io.WriteString(mac, part)
	}
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func proofsEqual(expected string, actual string) bool {
	expectedBytes, expectedErr := base64.RawURLEncoding.DecodeString(expected)
	actualBytes, actualErr := base64.RawURLEncoding.DecodeString(actual)
	return expectedErr == nil &&
		actualErr == nil &&
		len(expectedBytes) == sha256.Size &&
		len(actualBytes) == sha256.Size &&
		hmac.Equal(expectedBytes, actualBytes)
}

func newMeshNonce() (string, error) {
	value := make([]byte, meshNonceBytes)
	if _, err := rand.Read(value); err != nil {
		return "", fmt.Errorf("generate mesh nonce: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(value), nil
}

func validateMeshNonce(value string) error {
	decoded, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil || len(decoded) != meshNonceBytes {
		return fmt.Errorf("nonce must be %d bytes of base64url data", meshNonceBytes)
	}
	return nil
}

func writeMeshFrame(writer io.Writer, value any) error {
	return writeBoundedFrame(writer, value, meshMaxFrameBytes)
}

func writeBoundedFrame(writer io.Writer, value any, limit int) error {
	encoded, err := json.Marshal(value)
	if err != nil {
		return err
	}
	if len(encoded) > limit {
		return fmt.Errorf("mesh frame exceeds %d bytes", limit)
	}
	encoded = append(encoded, '\n')
	written, err := writer.Write(encoded)
	if err == nil && written != len(encoded) {
		return io.ErrShortWrite
	}
	return err
}

func readMeshFrame(reader *bufio.Reader, destination any) error {
	frame, err := readBoundedFrame(reader, meshMaxFrameBytes)
	if err != nil {
		return err
	}
	return decodeStrictFrame(frame, destination)
}

func readBoundedFrame(reader *bufio.Reader, limit int) ([]byte, error) {
	frame := make([]byte, 0, min(limit, 4096))
	for {
		fragment, err := reader.ReadSlice('\n')
		if len(frame)+len(fragment) > limit+1 {
			return nil, fmt.Errorf("mesh frame exceeds %d bytes", limit)
		}
		frame = append(frame, fragment...)
		switch {
		case err == nil:
			frame = bytes.TrimSpace(frame)
			if len(frame) > limit {
				return nil, fmt.Errorf("mesh frame exceeds %d bytes", limit)
			}
			return frame, nil
		case errors.Is(err, bufio.ErrBufferFull):
			continue
		default:
			return nil, err
		}
	}
}

func decodeStrictFrame(frame []byte, destination any) error {
	frame = bytes.TrimSpace(frame)
	if len(frame) == 0 {
		return fmt.Errorf("mesh frame is empty")
	}
	decoder := json.NewDecoder(bytes.NewReader(frame))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return err
	}
	var trailing any
	if err := decoder.Decode(&trailing); !errors.Is(err, io.EOF) {
		return fmt.Errorf("mesh frame must contain exactly one JSON object")
	}
	return nil
}
