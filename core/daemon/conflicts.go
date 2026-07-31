package daemon

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"sort"

	"github.com/dgraph-io/badger/v4"
)

const (
	conflictObservationVersion = 1
	conflictResolutionVersion  = 1
	conflictResolutionStream   = "system:conflict_resolution"
	conflictResolutionStrategy = "preserve-both"
)

type conflictResolutionPayload struct {
	Version  int    `json:"version"`
	EventID  string `json:"eventId"`
	Strategy string `json:"strategy"`
}

type conflictObservation struct {
	Version      int    `json:"version"`
	Network      string `json:"network"`
	EventID      string `json:"eventId"`
	LocalDigest  string `json:"localDigest"`
	RemoteDigest string `json:"remoteDigest"`
	ObservedAt   string `json:"observedAt"`
}

type EventConflictInfo struct {
	Network            string   `json:"network"`
	EventID            string   `json:"eventId"`
	LocalDigest        string   `json:"localDigest"`
	RemoteDigests      []string `json:"remoteDigests"`
	FirstObservedAt    string   `json:"firstObservedAt"`
	Resolved           bool     `json:"resolved"`
	ResolutionEventIDs []string `json:"resolutionEventIds,omitempty"`
	RecoveredEventID   string   `json:"recoveredEventId,omitempty"`
}

type EventConflictResolutionResult struct {
	Network         string       `json:"network"`
	EventID         string       `json:"eventId"`
	Strategy        string       `json:"strategy"`
	ResolutionEvent ThalwegEvent `json:"resolutionEvent"`
	RecoveredEvent  ThalwegEvent `json:"recoveredEvent"`
	AlreadyResolved bool         `json:"alreadyResolved"`
}

func conflictObservationPrefix(networkName, eventID string) string {
	prefix := fmt.Sprintf("event-conflict-v1:%s:", encodeKeyPart(networkName))
	if eventID != "" {
		prefix += encodeKeyPart(eventID) + ":"
	}
	return prefix
}

func conflictObservationKey(observation conflictObservation) string {
	return conflictObservationPrefix(observation.Network, observation.EventID) + observation.RemoteDigest
}

func (d *Daemon) recordEventConflicts(networkName string, observations []conflictObservation) error {
	if len(observations) == 0 {
		return nil
	}
	now := d.clockNow().UTC().Format(canonicalTimestampLayout)
	return d.store.Update(func(txn *badger.Txn) error {
		for _, observation := range observations {
			observation.Version = conflictObservationVersion
			observation.Network = networkName
			observation.ObservedAt = now
			key := conflictObservationKey(observation)
			if _, err := txn.Get([]byte(key)); err == nil {
				continue
			} else if !errors.Is(err, badger.ErrKeyNotFound) {
				return fmt.Errorf("inspect event conflict observation: %w", err)
			}
			encoded, err := json.Marshal(observation)
			if err != nil {
				return fmt.Errorf("encode event conflict observation: %w", err)
			}
			if err := txn.Set([]byte(key), encoded); err != nil {
				return fmt.Errorf("store event conflict observation: %w", err)
			}
		}
		return nil
	})
}

func (d *Daemon) listEventConflicts(networkName string) ([]EventConflictInfo, error) {
	if networkName == "" {
		return nil, fmt.Errorf("network is required")
	}
	resolutions, err := d.conflictResolutions(networkName)
	if err != nil {
		return nil, err
	}
	grouped := make(map[string]*EventConflictInfo)
	err = d.store.View(func(txn *badger.Txn) error {
		it := txn.NewIterator(badger.DefaultIteratorOptions)
		defer it.Close()
		prefix := []byte(conflictObservationPrefix(networkName, ""))
		for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
			var observation conflictObservation
			if err := it.Item().Value(func(value []byte) error {
				return json.Unmarshal(value, &observation)
			}); err != nil {
				return fmt.Errorf("decode event conflict observation: %w", err)
			}
			if observation.Version != conflictObservationVersion || observation.Network != networkName {
				return fmt.Errorf("invalid event conflict observation for %q", observation.EventID)
			}
			entry := grouped[observation.EventID]
			if entry == nil {
				entry = &EventConflictInfo{
					Network:         networkName,
					EventID:         observation.EventID,
					LocalDigest:     observation.LocalDigest,
					FirstObservedAt: observation.ObservedAt,
				}
				grouped[observation.EventID] = entry
			}
			if observation.ObservedAt < entry.FirstObservedAt {
				entry.FirstObservedAt = observation.ObservedAt
			}
			entry.RemoteDigests = appendUniqueStrings(entry.RemoteDigests, observation.RemoteDigest)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	result := make([]EventConflictInfo, 0, len(grouped))
	for eventID, events := range resolutions {
		if grouped[eventID] != nil {
			continue
		}
		entry := &EventConflictInfo{
			Network:         networkName,
			EventID:         eventID,
			FirstObservedAt: events[0].OccurredAt,
		}
		if original, findErr := d.findEvent(networkName, eventID); findErr != nil {
			return nil, findErr
		} else if original != nil {
			digest, digestErr := eventDigest(*original)
			if digestErr != nil {
				return nil, digestErr
			}
			entry.LocalDigest = digest
		}
		grouped[eventID] = entry
	}
	for eventID, entry := range grouped {
		if events := resolutions[eventID]; len(events) > 0 {
			entry.Resolved = true
			for _, event := range events {
				entry.ResolutionEventIDs = append(entry.ResolutionEventIDs, event.ID)
			}
			if original, findErr := d.findEvent(networkName, eventID); findErr != nil {
				return nil, findErr
			} else if original != nil {
				digest, digestErr := eventDigest(*original)
				if digestErr != nil {
					return nil, digestErr
				}
				entry.RecoveredEventID = recoveredConflictEventID(networkName, eventID, digest)
			}
		}
		sort.Strings(entry.RemoteDigests)
		sort.Strings(entry.ResolutionEventIDs)
		result = append(result, *entry)
	}
	sort.Slice(result, func(i, j int) bool { return result[i].EventID < result[j].EventID })
	return result, nil
}

func (d *Daemon) resolveEventConflict(networkName, eventID, strategy string) (EventConflictResolutionResult, error) {
	if networkName == "" || eventID == "" {
		return EventConflictResolutionResult{}, fmt.Errorf("network and eventId are required")
	}
	if strategy == "" {
		strategy = conflictResolutionStrategy
	}
	if strategy != conflictResolutionStrategy {
		return EventConflictResolutionResult{}, fmt.Errorf("unsupported conflict strategy %q", strategy)
	}
	conflicts, err := d.listEventConflicts(networkName)
	if err != nil {
		return EventConflictResolutionResult{}, err
	}
	observed := false
	for _, conflict := range conflicts {
		if conflict.EventID == eventID {
			observed = true
			break
		}
	}
	if !observed {
		return EventConflictResolutionResult{}, fmt.Errorf("event %q has no observed conflict in network %q", eventID, networkName)
	}
	original, err := d.findEvent(networkName, eventID)
	if err != nil {
		return EventConflictResolutionResult{}, err
	}
	if original == nil {
		return EventConflictResolutionResult{}, fmt.Errorf("conflicting event %q is missing in network %q", eventID, networkName)
	}

	resolutions, err := d.conflictResolutions(networkName)
	if err != nil {
		return EventConflictResolutionResult{}, err
	}
	alreadyResolved := len(resolutions[eventID]) > 0
	var resolutionEvent ThalwegEvent
	if alreadyResolved {
		resolutionEvent = resolutions[eventID][0]
	} else {
		payload, err := json.Marshal(conflictResolutionPayload{
			Version:  conflictResolutionVersion,
			EventID:  eventID,
			Strategy: conflictResolutionStrategy,
		})
		if err != nil {
			return EventConflictResolutionResult{}, err
		}
		resolutionEvent, err = d.ingestInternal(networkName, conflictResolutionStream, "", "", payload)
		if err != nil {
			return EventConflictResolutionResult{}, fmt.Errorf("record conflict resolution: %w", err)
		}
	}
	recovered, _, err := d.materializeConflictVariant(networkName, eventID)
	if err != nil {
		return EventConflictResolutionResult{}, err
	}
	return EventConflictResolutionResult{
		Network:         networkName,
		EventID:         eventID,
		Strategy:        conflictResolutionStrategy,
		ResolutionEvent: resolutionEvent,
		RecoveredEvent:  recovered,
		AlreadyResolved: alreadyResolved,
	}, nil
}

func (d *Daemon) materializeConflictVariant(networkName, eventID string) (ThalwegEvent, bool, error) {
	original, err := d.findEvent(networkName, eventID)
	if err != nil {
		return ThalwegEvent{}, false, err
	}
	if original == nil {
		return ThalwegEvent{}, false, nil
	}
	digest, err := eventDigest(*original)
	if err != nil {
		return ThalwegEvent{}, false, err
	}
	recovered := *original
	recovered.ID = recoveredConflictEventID(networkName, eventID, digest)
	stored, created, err := d.ingestReplicated(recovered)
	if err != nil {
		return ThalwegEvent{}, false, fmt.Errorf("materialize preserved conflict variant: %w", err)
	}
	return stored, created, nil
}

func recoveredConflictEventID(networkName, eventID, digest string) string {
	sum := sha256.Sum256([]byte(networkName + "\x00" + eventID + "\x00" + digest))
	return "evt_conflict_" + base64.RawURLEncoding.EncodeToString(sum[:])
}

func (d *Daemon) findEvent(networkName, eventID string) (*ThalwegEvent, error) {
	var event *ThalwegEvent
	err := d.store.View(func(txn *badger.Txn) error {
		var err error
		event, err = findEventByID(txn, networkName, eventID)
		return err
	})
	return event, err
}

func parseConflictResolution(event ThalwegEvent) (conflictResolutionPayload, bool, error) {
	if event.Stream != conflictResolutionStream {
		return conflictResolutionPayload{}, false, nil
	}
	var payload conflictResolutionPayload
	if err := decodeStrictFrame(event.Payload, &payload); err != nil {
		return payload, true, fmt.Errorf("decode conflict resolution event %q: %w", event.ID, err)
	}
	if payload.Version != conflictResolutionVersion || payload.EventID == "" || payload.Strategy != conflictResolutionStrategy {
		return payload, true, fmt.Errorf("invalid conflict resolution event %q", event.ID)
	}
	if payload.EventID == event.ID {
		return payload, true, fmt.Errorf("conflict resolution event cannot resolve itself")
	}
	return payload, true, nil
}

func (d *Daemon) conflictResolutions(networkName string) (map[string][]ThalwegEvent, error) {
	var result map[string][]ThalwegEvent
	err := d.store.View(func(txn *badger.Txn) error {
		var err error
		result, err = conflictResolutionsTxn(txn, networkName)
		return err
	})
	for eventID := range result {
		sort.Slice(result[eventID], func(i, j int) bool {
			return chronologicalKey(result[eventID][i]) < chronologicalKey(result[eventID][j])
		})
	}
	return result, err
}

func conflictResolutionsTxn(txn *badger.Txn, networkName string) (map[string][]ThalwegEvent, error) {
	result := make(map[string][]ThalwegEvent)
	it := txn.NewIterator(badger.DefaultIteratorOptions)
	defer it.Close()
	prefix := []byte(fmt.Sprintf("event-v3:%s:%s:", encodeKeyPart(networkName), encodeKeyPart(conflictResolutionStream)))
	for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
		var event ThalwegEvent
		if err := it.Item().Value(func(value []byte) error { return json.Unmarshal(value, &event) }); err != nil {
			return nil, err
		}
		payload, _, err := parseConflictResolution(event)
		if err != nil {
			return nil, err
		}
		result[payload.EventID] = append(result[payload.EventID], event)
	}
	return result, nil
}

func (d *Daemon) reconcileConflictResolutions() error {
	memberships := d.memberships.list()
	for _, membership := range memberships {
		resolutions, err := d.conflictResolutions(membership.Name)
		if err != nil {
			return err
		}
		for eventID := range resolutions {
			if _, _, err := d.materializeConflictVariant(membership.Name, eventID); err != nil {
				return err
			}
		}
	}
	return nil
}
