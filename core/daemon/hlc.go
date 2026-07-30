package daemon

import (
	"encoding/json"
	"fmt"
	"math"
	"time"

	"github.com/dgraph-io/badger/v4"
)

const hlcStateKey = "meta:hlc-state"

type hlcTimestamp struct {
	Physical string `json:"physical"`
	Logical  uint64 `json:"logical"`
}

type hybridLogicalClock struct {
	state hlcTimestamp
}

func loadHLC(db *badger.DB) (*hybridLogicalClock, error) {
	var state hlcTimestamp
	err := db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(hlcStateKey))
		if err != nil {
			return err
		}
		return item.Value(func(value []byte) error {
			return json.Unmarshal(value, &state)
		})
	})
	if err != nil {
		return nil, fmt.Errorf("load HLC state: %w", err)
	}
	if state.Physical != "" {
		normalized, err := normalizeTimestamp("HLC physical time", state.Physical)
		if err != nil {
			return nil, err
		}
		if normalized != state.Physical {
			return nil, fmt.Errorf("HLC physical time is not canonical: %s", state.Physical)
		}
	}
	return &hybridLogicalClock{state: state}, nil
}

func (c *hybridLogicalClock) nextLocal(wallTime time.Time) (hlcTimestamp, error) {
	wallPhysical := wallTime.UTC().Format(canonicalTimestampLayout)
	if c.state.Physical == "" || wallPhysical > c.state.Physical {
		return hlcTimestamp{Physical: wallPhysical}, nil
	}
	logical, err := incrementLogical(c.state.Logical)
	if err != nil {
		return hlcTimestamp{}, err
	}
	return hlcTimestamp{Physical: c.state.Physical, Logical: logical}, nil
}

func (c *hybridLogicalClock) commit(state hlcTimestamp) {
	c.state = state
}

func mergeHLCTimestamp(local hlcTimestamp, remote hlcTimestamp, wallTime time.Time) (hlcTimestamp, error) {
	if local.Physical != "" {
		localPhysical, err := normalizeTimestamp("local HLC physical time", local.Physical)
		if err != nil {
			return hlcTimestamp{}, err
		}
		local.Physical = localPhysical
	}
	if remote.Physical == "" {
		return hlcTimestamp{}, fmt.Errorf("remote HLC physical time is required")
	}
	remotePhysical, err := normalizeTimestamp("remote HLC physical time", remote.Physical)
	if err != nil {
		return hlcTimestamp{}, err
	}
	remote.Physical = remotePhysical

	wallPhysical := wallTime.UTC().Format(canonicalTimestampLayout)
	maxPhysical := wallPhysical
	if local.Physical > maxPhysical {
		maxPhysical = local.Physical
	}
	if remote.Physical > maxPhysical {
		maxPhysical = remote.Physical
	}

	var base uint64
	switch {
	case maxPhysical == local.Physical && maxPhysical == remote.Physical:
		base = max(local.Logical, remote.Logical)
	case maxPhysical == local.Physical:
		base = local.Logical
	case maxPhysical == remote.Physical:
		base = remote.Logical
	default:
		return hlcTimestamp{Physical: maxPhysical}, nil
	}
	logical, err := incrementLogical(base)
	if err != nil {
		return hlcTimestamp{}, err
	}
	return hlcTimestamp{Physical: maxPhysical, Logical: logical}, nil
}

func incrementLogical(value uint64) (uint64, error) {
	if value == math.MaxUint64 {
		return 0, fmt.Errorf("HLC logical counter overflow")
	}
	return value + 1, nil
}

func setHLCState(txn *badger.Txn, state hlcTimestamp) error {
	encoded, err := json.Marshal(state)
	if err != nil {
		return fmt.Errorf("encode HLC state: %w", err)
	}
	if err := txn.Set([]byte(hlcStateKey), encoded); err != nil {
		return fmt.Errorf("persist HLC state: %w", err)
	}
	return nil
}
