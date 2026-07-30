package daemon

import (
	"bufio"
	"bytes"
	"encoding/json"
	"testing"
)

func FuzzDecodeNetworkInvitation(f *testing.F) {
	f.Add("")
	f.Add("thalweg1:not-base64")
	f.Add("thalweg1:eyJ2ZXJzaW9uIjoxfQ")
	f.Fuzz(func(t *testing.T, invitation string) {
		membership, err := decodeNetworkInvitation(invitation)
		if err == nil {
			if err := validateMembership(membership); err != nil {
				t.Fatalf("decoded invalid membership: %v", err)
			}
		}
	})
}

func FuzzReadBoundedSyncFrame(f *testing.F) {
	f.Add([]byte(`{"type":"inventory_request","protocolVersion":1,"networkId":"id"}`))
	f.Add([]byte(`{`))
	f.Add(bytes.Repeat([]byte{'x'}, meshMaxFrameBytes))
	f.Fuzz(func(t *testing.T, input []byte) {
		if len(input) > syncMaxFrameBytes*2 {
			t.Skip()
		}
		framed := append(append([]byte(nil), input...), '\n')
		reader := bufio.NewReaderSize(bytes.NewReader(framed), meshMaxFrameBytes+1)
		frame, err := readBoundedFrame(reader, syncMaxFrameBytes)
		if err != nil {
			return
		}
		var envelope syncEnvelope
		_ = decodeStrictFrame(frame, &envelope)
	})
}

func FuzzNormalizeReplicatedEvent(f *testing.F) {
	f.Add(
		"id",
		"network",
		"stream",
		"2026-01-01T00:00:00Z",
		"2026-01-01T00:00:01Z",
		"2026-01-01T00:00:02Z",
		"device",
		[]byte(`{"value":1}`),
	)
	f.Fuzz(func(
		t *testing.T,
		id string,
		networkName string,
		stream string,
		occurredAt string,
		insertedAt string,
		propagatedAt string,
		deviceID string,
		payload []byte,
	) {
		event, err := normalizeReplicatedEvent(ThalwegEvent{
			ID:           id,
			Network:      networkName,
			Stream:       stream,
			OccurredAt:   occurredAt,
			InsertedAt:   insertedAt,
			PropagatedAt: propagatedAt,
			DeviceID:     deviceID,
			Payload:      json.RawMessage(payload),
		})
		if err == nil {
			if _, err := eventDigest(event); err != nil {
				t.Fatalf("normalized event could not be digested: %v", err)
			}
		}
	})
}
