package daemon

import (
	"math"
	"path/filepath"
	"testing"
	"time"
)

func TestHLCLocalTick(t *testing.T) {
	base := mustTime(t, "2026-01-01T12:00:00Z")
	tests := []struct {
		name  string
		state hlcTimestamp
		wall  time.Time
		want  hlcTimestamp
	}{
		{
			name: "initial tick",
			wall: base,
			want: hlcTimestamp{Physical: "2026-01-01T12:00:00.000000000Z"},
		},
		{
			name:  "same physical time increments logical",
			state: hlcTimestamp{Physical: "2026-01-01T12:00:00.000000000Z", Logical: 3},
			wall:  base,
			want:  hlcTimestamp{Physical: "2026-01-01T12:00:00.000000000Z", Logical: 4},
		},
		{
			name:  "wall regression retains physical time",
			state: hlcTimestamp{Physical: "2026-01-01T12:00:00.000000000Z", Logical: 3},
			wall:  base.Add(-time.Hour),
			want:  hlcTimestamp{Physical: "2026-01-01T12:00:00.000000000Z", Logical: 4},
		},
		{
			name:  "wall advance resets logical",
			state: hlcTimestamp{Physical: "2026-01-01T12:00:00.000000000Z", Logical: 3},
			wall:  base.Add(time.Nanosecond),
			want:  hlcTimestamp{Physical: "2026-01-01T12:00:00.000000001Z"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			clock := hybridLogicalClock{state: tt.state}
			got, err := clock.nextLocal(tt.wall)
			if err != nil {
				t.Fatalf("next local: %v", err)
			}
			if got != tt.want {
				t.Fatalf("next local = %#v, want %#v", got, tt.want)
			}
		})
	}
}

func TestHLCRemoteMerge(t *testing.T) {
	t1 := mustTime(t, "2026-01-01T12:00:00Z")
	t2 := t1.Add(time.Second)
	t3 := t2.Add(time.Second)
	p1 := t1.Format(canonicalTimestampLayout)
	p2 := t2.Format(canonicalTimestampLayout)
	p3 := t3.Format(canonicalTimestampLayout)

	tests := []struct {
		name   string
		local  hlcTimestamp
		remote hlcTimestamp
		wall   time.Time
		want   hlcTimestamp
	}{
		{
			name:   "matching physical clocks use greatest logical",
			local:  hlcTimestamp{Physical: p2, Logical: 2},
			remote: hlcTimestamp{Physical: p2, Logical: 5},
			wall:   t1,
			want:   hlcTimestamp{Physical: p2, Logical: 6},
		},
		{
			name:   "local physical clock wins",
			local:  hlcTimestamp{Physical: p2, Logical: 2},
			remote: hlcTimestamp{Physical: p1, Logical: 9},
			wall:   t1,
			want:   hlcTimestamp{Physical: p2, Logical: 3},
		},
		{
			name:   "remote physical clock wins",
			local:  hlcTimestamp{Physical: p1, Logical: 9},
			remote: hlcTimestamp{Physical: p2, Logical: 2},
			wall:   t1,
			want:   hlcTimestamp{Physical: p2, Logical: 3},
		},
		{
			name:   "wall clock wins",
			local:  hlcTimestamp{Physical: p1, Logical: 9},
			remote: hlcTimestamp{Physical: p2, Logical: 2},
			wall:   t3,
			want:   hlcTimestamp{Physical: p3},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := mergeHLCTimestamp(tt.local, tt.remote, tt.wall)
			if err != nil {
				t.Fatalf("merge: %v", err)
			}
			if got != tt.want {
				t.Fatalf("merge = %#v, want %#v", got, tt.want)
			}
		})
	}
}

func TestHLCRejectsLogicalOverflow(t *testing.T) {
	physical := "2026-01-01T12:00:00.000000000Z"
	clock := hybridLogicalClock{
		state: hlcTimestamp{Physical: physical, Logical: math.MaxUint64},
	}
	if _, err := clock.nextLocal(mustTime(t, "2026-01-01T11:00:00Z")); err == nil {
		t.Fatal("expected local logical overflow error")
	}
	if _, err := mergeHLCTimestamp(
		hlcTimestamp{Physical: physical, Logical: math.MaxUint64},
		hlcTimestamp{Physical: physical, Logical: 1},
		mustTime(t, "2026-01-01T11:00:00Z"),
	); err == nil {
		t.Fatal("expected merge logical overflow error")
	}
}

func TestHLCPersistsAcrossRestartAndWallRegression(t *testing.T) {
	root := t.TempDir()
	dbPath := filepath.Join(root, "storage", "badger")
	fixed := mustTime(t, "2026-01-01T12:00:00Z")

	first, err := New(filepath.Join(root, "first.sock"), dbPath)
	if err != nil {
		t.Fatalf("create first daemon: %v", err)
	}
	first.now = func() time.Time { return fixed }
	event1, err := first.ingest("test", "user:note", "", "event-1", nil)
	if err != nil {
		t.Fatalf("ingest event 1: %v", err)
	}
	event2, err := first.ingest("test", "user:note", "", "event-2", nil)
	if err != nil {
		t.Fatalf("ingest event 2: %v", err)
	}
	if event1.Counter != 0 || event2.Counter != 1 {
		t.Fatalf("pre-restart counters = %d, %d; want 0, 1", event1.Counter, event2.Counter)
	}
	if err := first.Close(); err != nil {
		t.Fatalf("close first daemon: %v", err)
	}

	second, err := New(filepath.Join(root, "second.sock"), dbPath)
	if err != nil {
		t.Fatalf("create second daemon: %v", err)
	}
	t.Cleanup(func() {
		_ = second.Close()
	})
	second.now = func() time.Time { return fixed.Add(-time.Hour) }
	event3, err := second.ingest("test", "user:note", "", "event-3", nil)
	if err != nil {
		t.Fatalf("ingest event 3: %v", err)
	}
	if event3.InsertedAt != event2.InsertedAt {
		t.Fatalf("HLC physical time regressed: %s != %s", event3.InsertedAt, event2.InsertedAt)
	}
	if event3.Counter != 2 {
		t.Fatalf("post-restart logical counter = %d, want 2", event3.Counter)
	}
}

func TestIdempotentRetryAndQueryAcrossRestart(t *testing.T) {
	root := t.TempDir()
	dbPath := filepath.Join(root, "storage", "badger")

	first, err := New(filepath.Join(root, "first.sock"), dbPath)
	if err != nil {
		t.Fatalf("create first daemon: %v", err)
	}
	stored, err := first.ingest(
		"test",
		"user:note",
		"2026-01-01T00:00:00Z",
		"restart-idempotency",
		[]byte(`{"content":"persisted"}`),
	)
	if err != nil {
		t.Fatalf("first ingest: %v", err)
	}
	if err := first.Close(); err != nil {
		t.Fatalf("close first daemon: %v", err)
	}

	second, err := New(filepath.Join(root, "second.sock"), dbPath)
	if err != nil {
		t.Fatalf("create second daemon: %v", err)
	}
	t.Cleanup(func() {
		_ = second.Close()
	})
	retry, err := second.ingest(
		"test",
		"user:note",
		"2026-01-01T00:00:00Z",
		"restart-idempotency",
		[]byte(`{"content":"persisted"}`),
	)
	if err != nil {
		t.Fatalf("retry after restart: %v", err)
	}
	if retry.InsertedAt != stored.InsertedAt || retry.Counter != stored.Counter {
		t.Fatalf("retry returned a different event: stored=%#v retry=%#v", stored, retry)
	}
	events, err := second.query("test", nil, "", "", 0)
	if err != nil {
		t.Fatalf("query after restart: %v", err)
	}
	if len(events) != 1 || events[0].ID != stored.ID {
		t.Fatalf("persisted query returned %#v", events)
	}
}

func mustTime(t *testing.T, value string) time.Time {
	t.Helper()
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		t.Fatalf("parse test time %q: %v", value, err)
	}
	return parsed
}
