package daemon

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"sort"
	"time"

	"github.com/dgraph-io/badger/v4"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
)

const (
	syncProtocolVersion = 1
	syncPageSize        = 64
	syncMaxPageSize     = 128
	syncMaxFrameBytes   = 1024 * 1024
	syncTimeout         = 30 * time.Second
)

type InventoryEntry struct {
	ID     string `json:"id"`
	Digest string `json:"digest"`
}

type SyncResult struct {
	PeerID      string                `json:"peerId"`
	Network     NetworkMembershipInfo `json:"network"`
	Inventoried int                   `json:"inventoried"`
	Pushed      int                   `json:"pushed"`
	Pulled      int                   `json:"pulled"`
	Duplicates  int                   `json:"duplicates"`
	Conflicts   []string              `json:"conflicts,omitempty"`
}

type syncEnvelope struct {
	Type            string `json:"type"`
	ProtocolVersion int    `json:"protocolVersion"`
	NetworkID       string `json:"networkId"`
}

type inventoryOffer struct {
	Type            string           `json:"type"`
	ProtocolVersion int              `json:"protocolVersion"`
	NetworkID       string           `json:"networkId"`
	Entries         []InventoryEntry `json:"entries"`
}

type inventoryNeed struct {
	Type            string   `json:"type"`
	ProtocolVersion int      `json:"protocolVersion"`
	NetworkID       string   `json:"networkId"`
	IDs             []string `json:"ids"`
	Conflicts       []string `json:"conflicts,omitempty"`
}

type inventoryRequest struct {
	Type            string `json:"type"`
	ProtocolVersion int    `json:"protocolVersion"`
	NetworkID       string `json:"networkId"`
	Cursor          string `json:"cursor,omitempty"`
	Limit           int    `json:"limit"`
}

type inventoryPage struct {
	Type            string           `json:"type"`
	ProtocolVersion int              `json:"protocolVersion"`
	NetworkID       string           `json:"networkId"`
	Entries         []InventoryEntry `json:"entries"`
	NextCursor      string           `json:"nextCursor,omitempty"`
	Done            bool             `json:"done"`
}

type eventsRequest struct {
	Type            string   `json:"type"`
	ProtocolVersion int      `json:"protocolVersion"`
	NetworkID       string   `json:"networkId"`
	IDs             []string `json:"ids"`
}

type eventsPage struct {
	Type            string         `json:"type"`
	ProtocolVersion int            `json:"protocolVersion"`
	NetworkID       string         `json:"networkId"`
	Events          []ThalwegEvent `json:"events"`
}

type eventsPush struct {
	Type            string         `json:"type"`
	ProtocolVersion int            `json:"protocolVersion"`
	NetworkID       string         `json:"networkId"`
	Events          []ThalwegEvent `json:"events"`
}

type eventsAck struct {
	Type            string `json:"type"`
	ProtocolVersion int    `json:"protocolVersion"`
	NetworkID       string `json:"networkId"`
	Received        int    `json:"received"`
	Created         int    `json:"created"`
}

type syncError struct {
	Type            string `json:"type"`
	ProtocolVersion int    `json:"protocolVersion"`
	NetworkID       string `json:"networkId"`
	Error           string `json:"error"`
}

func (d *Daemon) synchronizePeer(
	ctx context.Context,
	remote peer.ID,
	networkName string,
) (SyncResult, error) {
	stream, reader, membership, err := d.openAuthenticatedMeshStream(ctx, remote, networkName)
	if err != nil {
		return SyncResult{}, err
	}
	defer stream.Close()
	deadline := time.Now().Add(syncTimeout)
	if contextDeadline, ok := ctx.Deadline(); ok && contextDeadline.Before(deadline) {
		deadline = contextDeadline
	}
	if err := stream.SetDeadline(deadline); err != nil {
		return SyncResult{}, fmt.Errorf("set synchronization deadline: %w", err)
	}

	result := SyncResult{
		PeerID:  remote.String(),
		Network: membership.info(),
	}
	if err := d.pushInventory(stream, reader, membership, &result); err != nil {
		return SyncResult{}, err
	}
	if err := d.pullInventory(stream, reader, membership, &result); err != nil {
		return SyncResult{}, err
	}
	return result, nil
}

func (d *Daemon) pushInventory(
	stream network.Stream,
	reader *bufio.Reader,
	membership networkMembership,
	result *SyncResult,
) error {
	cursor := ""
	for {
		entries, nextCursor, done, err := d.inventoryPage(membership.Name, cursor, syncPageSize)
		if err != nil {
			return err
		}
		if len(entries) > 0 {
			result.Inventoried += len(entries)
			if err := writeSyncFrame(stream, inventoryOffer{
				Type:            "inventory_offer",
				ProtocolVersion: syncProtocolVersion,
				NetworkID:       membership.ID,
				Entries:         entries,
			}); err != nil {
				return fmt.Errorf("send inventory offer: %w", err)
			}
			var need inventoryNeed
			if err := readSyncResponse(reader, membership.ID, "inventory_need", &need); err != nil {
				return err
			}
			result.Conflicts = appendUniqueStrings(result.Conflicts, need.Conflicts...)
			if len(need.IDs) > 0 {
				events, err := d.eventsByIDs(membership.Name, need.IDs)
				if err != nil {
					return err
				}
				if err := writeSyncFrame(stream, eventsPush{
					Type:            "events_push",
					ProtocolVersion: syncProtocolVersion,
					NetworkID:       membership.ID,
					Events:          events,
				}); err != nil {
					return fmt.Errorf("push events: %w", err)
				}
				var ack eventsAck
				if err := readSyncResponse(reader, membership.ID, "events_ack", &ack); err != nil {
					return err
				}
				if ack.Received != len(events) {
					return fmt.Errorf("peer acknowledged %d of %d pushed events", ack.Received, len(events))
				}
				result.Pushed += ack.Created
				result.Duplicates += ack.Received - ack.Created
			}
		}
		if done {
			return nil
		}
		cursor = nextCursor
	}
}

func (d *Daemon) pullInventory(
	stream network.Stream,
	reader *bufio.Reader,
	membership networkMembership,
	result *SyncResult,
) error {
	cursor := ""
	for {
		if err := writeSyncFrame(stream, inventoryRequest{
			Type:            "inventory_request",
			ProtocolVersion: syncProtocolVersion,
			NetworkID:       membership.ID,
			Cursor:          cursor,
			Limit:           syncPageSize,
		}); err != nil {
			return fmt.Errorf("request inventory: %w", err)
		}
		var page inventoryPage
		if err := readSyncResponse(reader, membership.ID, "inventory_page", &page); err != nil {
			return err
		}
		missing, conflicts, err := d.compareInventory(membership.Name, page.Entries)
		if err != nil {
			return err
		}
		result.Conflicts = appendUniqueStrings(result.Conflicts, conflicts...)
		if len(missing) > 0 {
			if err := writeSyncFrame(stream, eventsRequest{
				Type:            "events_request",
				ProtocolVersion: syncProtocolVersion,
				NetworkID:       membership.ID,
				IDs:             missing,
			}); err != nil {
				return fmt.Errorf("request events: %w", err)
			}
			var events eventsPage
			if err := readSyncResponse(reader, membership.ID, "events_page", &events); err != nil {
				return err
			}
			if err := validateRequestedEvents(membership.Name, missing, events.Events); err != nil {
				return err
			}
			for _, event := range events.Events {
				_, created, err := d.ingestReplicated(event)
				if err != nil {
					return fmt.Errorf("store pulled event %q: %w", event.ID, err)
				}
				if created {
					result.Pulled++
				} else {
					result.Duplicates++
				}
			}
		}
		if page.Done {
			return nil
		}
		if page.NextCursor == "" || page.NextCursor <= cursor {
			return fmt.Errorf("peer returned a non-advancing inventory cursor")
		}
		cursor = page.NextCursor
	}
}

func appendUniqueStrings(values []string, candidates ...string) []string {
	seen := make(map[string]struct{}, len(values)+len(candidates))
	for _, value := range values {
		seen[value] = struct{}{}
	}
	for _, candidate := range candidates {
		if _, exists := seen[candidate]; exists {
			continue
		}
		seen[candidate] = struct{}{}
		values = append(values, candidate)
	}
	return values
}

func (d *Daemon) serveSyncRequests(
	stream network.Stream,
	reader *bufio.Reader,
	membership networkMembership,
) error {
	for {
		frame, err := readBoundedFrame(reader, syncMaxFrameBytes)
		if errors.Is(err, io.EOF) {
			return nil
		}
		if err != nil {
			return err
		}
		var envelope syncEnvelope
		if err := json.Unmarshal(frame, &envelope); err != nil {
			_ = writeSyncError(stream, membership.ID, "invalid synchronization frame")
			return err
		}
		if envelope.ProtocolVersion != syncProtocolVersion {
			_ = writeSyncError(stream, membership.ID, "unsupported synchronization protocol version")
			return fmt.Errorf("unsupported synchronization protocol version %d", envelope.ProtocolVersion)
		}
		if envelope.NetworkID != membership.ID {
			_ = writeSyncError(stream, membership.ID, "network authorization mismatch")
			return fmt.Errorf("synchronization network ID mismatch")
		}

		switch envelope.Type {
		case "inventory_offer":
			var request inventoryOffer
			if err := decodeStrictFrame(frame, &request); err != nil {
				return d.rejectSyncFrame(stream, membership.ID, err)
			}
			if err := validateInventoryEntries(request.Entries); err != nil {
				return d.rejectSyncFrame(stream, membership.ID, err)
			}
			missing, conflicts, err := d.compareInventory(membership.Name, request.Entries)
			if err != nil {
				return d.rejectSyncFrame(stream, membership.ID, err)
			}
			if err := writeSyncFrame(stream, inventoryNeed{
				Type:            "inventory_need",
				ProtocolVersion: syncProtocolVersion,
				NetworkID:       membership.ID,
				IDs:             missing,
				Conflicts:       conflicts,
			}); err != nil {
				return err
			}
		case "inventory_request":
			var request inventoryRequest
			if err := decodeStrictFrame(frame, &request); err != nil {
				return d.rejectSyncFrame(stream, membership.ID, err)
			}
			entries, nextCursor, done, err := d.inventoryPage(
				membership.Name,
				request.Cursor,
				request.Limit,
			)
			if err != nil {
				return d.rejectSyncFrame(stream, membership.ID, err)
			}
			if err := writeSyncFrame(stream, inventoryPage{
				Type:            "inventory_page",
				ProtocolVersion: syncProtocolVersion,
				NetworkID:       membership.ID,
				Entries:         entries,
				NextCursor:      nextCursor,
				Done:            done,
			}); err != nil {
				return err
			}
		case "events_request":
			var request eventsRequest
			if err := decodeStrictFrame(frame, &request); err != nil {
				return d.rejectSyncFrame(stream, membership.ID, err)
			}
			if err := validateIDPage(request.IDs); err != nil {
				return d.rejectSyncFrame(stream, membership.ID, err)
			}
			events, err := d.eventsByIDs(membership.Name, request.IDs)
			if err != nil {
				return d.rejectSyncFrame(stream, membership.ID, err)
			}
			if err := writeSyncFrame(stream, eventsPage{
				Type:            "events_page",
				ProtocolVersion: syncProtocolVersion,
				NetworkID:       membership.ID,
				Events:          events,
			}); err != nil {
				return err
			}
		case "events_push":
			var request eventsPush
			if err := decodeStrictFrame(frame, &request); err != nil {
				return d.rejectSyncFrame(stream, membership.ID, err)
			}
			if len(request.Events) == 0 || len(request.Events) > syncMaxPageSize {
				return d.rejectSyncFrame(stream, membership.ID, fmt.Errorf("invalid event page size"))
			}
			for i := range request.Events {
				normalized, err := normalizeReplicatedEvent(request.Events[i])
				if err != nil {
					return d.rejectSyncFrame(stream, membership.ID, err)
				}
				if normalized.Network != membership.Name {
					return d.rejectSyncFrame(stream, membership.ID, fmt.Errorf("cross-network event rejected"))
				}
				request.Events[i] = normalized
			}
			created := 0
			for _, event := range request.Events {
				_, stored, err := d.ingestReplicated(event)
				if err != nil {
					return d.rejectSyncFrame(stream, membership.ID, err)
				}
				if stored {
					created++
				}
			}
			if err := writeSyncFrame(stream, eventsAck{
				Type:            "events_ack",
				ProtocolVersion: syncProtocolVersion,
				NetworkID:       membership.ID,
				Received:        len(request.Events),
				Created:         created,
			}); err != nil {
				return err
			}
		default:
			return d.rejectSyncFrame(stream, membership.ID, fmt.Errorf("unknown synchronization message type"))
		}
	}
}

func (d *Daemon) inventoryPage(
	networkName string,
	cursor string,
	limit int,
) ([]InventoryEntry, string, bool, error) {
	if limit <= 0 || limit > syncMaxPageSize {
		return nil, "", false, fmt.Errorf("inventory limit must be between 1 and %d", syncMaxPageSize)
	}
	if networkName == "" {
		return nil, "", false, fmt.Errorf("network is required")
	}
	if cursor != "" {
		if _, err := base64.RawURLEncoding.DecodeString(cursor); err != nil {
			return nil, "", false, fmt.Errorf("invalid inventory cursor")
		}
	}
	type indexedEntry struct {
		entry  InventoryEntry
		cursor string
	}
	indexed := make([]indexedEntry, 0, limit+1)
	err := d.store.View(func(txn *badger.Txn) error {
		resolutions, err := conflictResolutionsTxn(txn, networkName)
		if err != nil {
			return err
		}
		prefix := []byte(fmt.Sprintf("event-id-v3:%s:", encodeKeyPart(networkName)))
		seek := prefix
		if cursor != "" {
			seek = append(append([]byte(nil), prefix...), []byte(cursor)...)
		}
		iterator := txn.NewIterator(badger.DefaultIteratorOptions)
		defer iterator.Close()
		for iterator.Seek(seek); iterator.ValidForPrefix(prefix); iterator.Next() {
			key := iterator.Item().KeyCopy(nil)
			position := string(key[len(prefix):])
			if cursor != "" && position <= cursor {
				continue
			}
			decodedID, err := base64.RawURLEncoding.DecodeString(position)
			if err != nil {
				return fmt.Errorf("decode event ID index key: %w", err)
			}
			eventID := string(decodedID)
			if _, superseded := resolutions[eventID]; superseded {
				continue
			}
			event, err := findEventByID(txn, networkName, eventID)
			if err != nil {
				return err
			}
			if event == nil {
				return fmt.Errorf("event ID index entry %q is missing", eventID)
			}
			digest, err := eventDigest(*event)
			if err != nil {
				return err
			}
			indexed = append(indexed, indexedEntry{
				entry:  InventoryEntry{ID: eventID, Digest: digest},
				cursor: position,
			})
			if len(indexed) > limit {
				break
			}
		}
		return nil
	})
	if err != nil {
		return nil, "", false, err
	}
	done := len(indexed) <= limit
	if !done {
		indexed = indexed[:limit]
	}
	entries := make([]InventoryEntry, 0, len(indexed))
	for _, item := range indexed {
		entries = append(entries, item.entry)
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].ID < entries[j].ID
	})
	nextCursor := ""
	if len(indexed) > 0 {
		nextCursor = indexed[len(indexed)-1].cursor
	}
	return entries, nextCursor, done, nil
}

func (d *Daemon) compareInventory(
	networkName string,
	entries []InventoryEntry,
) ([]string, []string, error) {
	if len(entries) == 0 {
		return []string{}, []string{}, nil
	}
	if err := validateInventoryEntries(entries); err != nil {
		return nil, nil, err
	}
	var missing []string
	var conflicts []string
	var observations []conflictObservation
	err := d.store.View(func(txn *badger.Txn) error {
		for _, entry := range entries {
			event, err := findEventByID(txn, networkName, entry.ID)
			if err != nil {
				return err
			}
			if event == nil {
				missing = append(missing, entry.ID)
				continue
			}
			digest, err := eventDigest(*event)
			if err != nil {
				return err
			}
			if digest != entry.Digest {
				conflicts = append(conflicts, entry.ID)
				observations = append(observations, conflictObservation{
					EventID:      entry.ID,
					LocalDigest:  digest,
					RemoteDigest: entry.Digest,
				})
			}
		}
		return nil
	})
	if err != nil {
		return nil, nil, err
	}
	if err := d.recordEventConflicts(networkName, observations); err != nil {
		return nil, nil, err
	}
	return missing, conflicts, nil
}

func (d *Daemon) eventsByIDs(networkName string, ids []string) ([]ThalwegEvent, error) {
	if err := validateIDPage(ids); err != nil {
		return nil, err
	}
	events := make([]ThalwegEvent, 0, len(ids))
	err := d.store.View(func(txn *badger.Txn) error {
		for _, id := range ids {
			event, err := findEventByID(txn, networkName, id)
			if err != nil {
				return err
			}
			if event == nil {
				return fmt.Errorf("requested event %q is missing", id)
			}
			events = append(events, *event)
		}
		return nil
	})
	return events, err
}

func eventDigest(event ThalwegEvent) (string, error) {
	normalized, err := normalizeReplicatedEvent(event)
	if err != nil {
		return "", err
	}
	encoded, err := json.Marshal(normalized)
	if err != nil {
		return "", err
	}
	digest := sha256.Sum256(encoded)
	return base64.RawURLEncoding.EncodeToString(digest[:]), nil
}

func validateInventoryEntries(entries []InventoryEntry) error {
	if len(entries) == 0 || len(entries) > syncMaxPageSize {
		return fmt.Errorf("inventory page must contain between 1 and %d entries", syncMaxPageSize)
	}
	seen := make(map[string]struct{}, len(entries))
	previous := ""
	for _, entry := range entries {
		if entry.ID == "" {
			return fmt.Errorf("inventory event ID is required")
		}
		if _, exists := seen[entry.ID]; exists {
			return fmt.Errorf("duplicate inventory event ID %q", entry.ID)
		}
		seen[entry.ID] = struct{}{}
		if previous != "" && entry.ID <= previous {
			return fmt.Errorf("inventory entries must be sorted by event ID")
		}
		previous = entry.ID
		decoded, err := base64.RawURLEncoding.DecodeString(entry.Digest)
		if err != nil || len(decoded) != sha256.Size {
			return fmt.Errorf("invalid inventory digest for event %q", entry.ID)
		}
	}
	return nil
}

func validateIDPage(ids []string) error {
	if len(ids) == 0 || len(ids) > syncMaxPageSize {
		return fmt.Errorf("event ID page must contain between 1 and %d IDs", syncMaxPageSize)
	}
	seen := make(map[string]struct{}, len(ids))
	for _, id := range ids {
		if id == "" {
			return fmt.Errorf("event ID is required")
		}
		if _, exists := seen[id]; exists {
			return fmt.Errorf("duplicate event ID %q", id)
		}
		seen[id] = struct{}{}
	}
	return nil
}

func validateRequestedEvents(networkName string, ids []string, events []ThalwegEvent) error {
	if len(events) != len(ids) {
		return fmt.Errorf("peer returned %d events for %d requested IDs", len(events), len(ids))
	}
	expected := make(map[string]struct{}, len(ids))
	for _, id := range ids {
		expected[id] = struct{}{}
	}
	for _, event := range events {
		if event.Network != networkName {
			return fmt.Errorf("peer returned a cross-network event")
		}
		if _, exists := expected[event.ID]; !exists {
			return fmt.Errorf("peer returned unrequested event %q", event.ID)
		}
		delete(expected, event.ID)
	}
	if len(expected) > 0 {
		return fmt.Errorf("peer omitted requested events")
	}
	return nil
}

func writeSyncFrame(writer io.Writer, value any) error {
	return writeBoundedFrame(writer, value, syncMaxFrameBytes)
}

func readSyncResponse(
	reader *bufio.Reader,
	networkID string,
	expectedType string,
	destination any,
) error {
	frame, err := readBoundedFrame(reader, syncMaxFrameBytes)
	if err != nil {
		return err
	}
	var envelope syncEnvelope
	if err := json.Unmarshal(frame, &envelope); err != nil {
		return err
	}
	if envelope.NetworkID != networkID {
		return fmt.Errorf("synchronization response crossed network boundary")
	}
	if envelope.Type == "sync_error" {
		var remoteError syncError
		if err := decodeStrictFrame(frame, &remoteError); err != nil {
			return err
		}
		return errors.New(remoteError.Error)
	}
	if envelope.ProtocolVersion != syncProtocolVersion {
		return fmt.Errorf("unsupported synchronization protocol version %d", envelope.ProtocolVersion)
	}
	if envelope.Type != expectedType {
		return fmt.Errorf("unexpected synchronization response type %q", envelope.Type)
	}
	return decodeStrictFrame(frame, destination)
}

func writeSyncError(writer io.Writer, networkID string, message string) error {
	return writeSyncFrame(writer, syncError{
		Type:            "sync_error",
		ProtocolVersion: syncProtocolVersion,
		NetworkID:       networkID,
		Error:           message,
	})
}

func (d *Daemon) rejectSyncFrame(writer io.Writer, networkID string, err error) error {
	_ = writeSyncError(writer, networkID, err.Error())
	return err
}
