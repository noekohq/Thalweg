# Event Data Model

## Canonical Envelope

The current daemon stores this event shape:

| Field | Meaning | Current owner |
| --- | --- | --- |
| `id` | Network-unique event identifier | Producer or daemon |
| `network` | Logical network name | SDK/application |
| `stream` | Typed stream identifier | SDK/application |
| `occurredAt` | When the event happened | Producer or daemon default |
| `insertedAt` | HLC physical time when the origin daemon accepted it | Daemon |
| `propagatedAt` | When the origin daemon first surfaced it | Daemon |
| `counter` | HLC logical counter paired with `insertedAt` | Daemon |
| `deviceId` | Restart-stable originating daemon identity | Daemon |
| `payload` | Stream-specific JSON payload | Producer |

All input timestamps are strings accepted by Go's RFC3339Nano parser. The daemon
normalizes them to UTC with exactly nine fractional digits before storage:

```text
2026-07-30T19:00:00.000000000Z
```

The fixed-width canonical form makes lexical key and range ordering match
chronological ordering while accepting offsets and shorter fractional input
from producers.

## Temporal Semantics

- Event time (`occurredAt`) represents physical reality and drives timeline
  queries.
- Ingestion time (`insertedAt`) is the physical component of the originating
  daemon's HLC when it accepted an event.
- Processing time (`propagatedAt`) records the origin daemon's first surfacing
  of the event and remains part of the immutable envelope.

In the MVP, `insertedAt` and `propagatedAt` are assigned to the same instant.
Per-receiver synchronization timestamps, retry state, and peer provenance will
live in separate local replication metadata rather than rewriting the event.

`insertedAt` may be ahead of the current wall clock after a wall-clock
regression or a future remote-clock observation. Together, `insertedAt` and
`counter` form the HLC timestamp:

```text
(insertedAt, counter)
```

Local ingestion advances the clock by selecting the greater of the persisted
physical time and wall time, incrementing the logical counter when physical
time does not advance. The clock state is written in the same Badger transaction
as the event. The daemon also implements the standard receive/merge cases for a
remote HLC timestamp and an internal replicated-event receive boundary.

The daemon opens Badger with synchronous writes enabled. A successful local
ingestion therefore means the event envelope, event-ID index, arrival index,
and HLC state have been committed durably before the response is returned.
Replication remains asynchronous and is reported separately through peer
health and synchronization results.

## Replicated Receive Semantics

The internal replicated-event ingest path accepts a complete origin envelope.
It is intentionally not exposed over local IPC or the current unauthenticated
p2p scaffold.

- Identity, namespace, origin device, and all three timestamps are required.
- Timestamps and payload JSON are canonicalized before comparison or storage.
- A new envelope is stored with its event-ID index while the local HLC merges
  the remote `(insertedAt, counter)` in the same Badger transaction.
- Origin `insertedAt`, `counter`, `deviceId`, and `propagatedAt` are preserved;
  receiving a remote event never re-originates it.
- An exact replay returns the stored event, does not write or broadcast it
  again, and does not advance the HLC.
- Reusing a network/event ID with any different immutable envelope field is a
  conflict.
- Observed conflicts are quarantined during synchronization: unrelated events
  continue replicating while the conflicting ID is reported to operators.
- A validation, conflict, storage, or clock-merge failure leaves the event,
  index, and HLC unchanged.

The eventual replication transport must authenticate network membership before
calling this boundary.

## Event Identity and Idempotency

Event IDs are unique within one logical network, including across streams.

- A producer may retry an event ID with the same stream, payload, and supplied
  `occurredAt`; the daemon returns the originally stored envelope.
- If the original ingest omitted `occurredAt`, an equivalent retry may omit it
  and still receive the original daemon-assigned occurrence time.
- Reusing an event ID with a different stream, supplied occurrence time, or
  payload is rejected as a conflict.
- JSON payloads are normalized before comparison and storage, so whitespace and
  object-key order do not create false conflicts.
- A successful retry is not stored or broadcast again.

The current implementation resolves identity through a network/event-ID
secondary index. Local and replicated ingestion remain serialized while
advancing the HLC so the event, ID index, and next clock state commit atomically.

## Conflict Resolution Overlay

The lossless `preserve-both` workflow resolves an identity collision without
rewriting either stored envelope. A replicated `system:conflict_resolution`
audit event logically supersedes the collided ID. Each variant is copied to a
deterministic recovered ID derived from the network, original ID, and canonical
envelope digest. The copy preserves stream, payload, timestamps, counter, and
origin device.

Ordinary queries and synchronization inventories omit a superseded original
ID, while its physical event and ID index remain intact. They include the
resolution event and all recovered variants, allowing authorized nodes to
converge on one lossless logical history. Local conflict observations use
versioned `event-conflict-v1:` metadata keys and are not themselves replicated;
the immutable resolution event carries the decision across the mesh.

See `docs/CONFLICTS.md` for the operator flow and live-subscription caveats.

## Current Badger Keys

```text
event-v3:{networkB64}:{streamB64}:{occurredAt}:{counter}:{deviceIdB64}:{eventIdB64}
```

String components use unpadded base64url encoding and the counter is padded to
20 decimal digits. Base64url replaced the prototype's `%3A` substitution
because that substitution could not distinguish a literal `%3A` from a colon.

This layout efficiently scans one stream, but a multi-stream query currently
scans each stream separately, decodes values, and sorts all matching events in
memory. It is not yet a globally time-major index. Public queries accept
explicit ascending or descending order; limits are applied after ordering.

Network-wide event identity uses:

```text
event-id-v3:{networkB64}:{eventIdB64} = {primaryEventKey}
```

The index is written in the same transaction as new events. A missing target or
mismatched envelope is treated as storage corruption rather than silently
recreating history. Synchronization inventory pages walk this index directly
instead of repeatedly querying and sorting the full network timeline.

Durable local consumers use a separate receipt-order index:

```text
event-arrival-v1:{networkB64}:{localSequence20} = {primaryEventKey}
meta:event-arrival-sequence = {latestLocalSequence}
```

`localSequence` is a daemon-local, monotonically increasing receipt ordinal. It
is allocated in the same Badger transaction as a newly stored local or
replicated event. It is deliberately not part of the immutable event envelope,
does not replicate, and does not replace event-time/HLC ordering. Its only job
is to give durable consumers a gap-free cursor even when a late replicated
event belongs earlier in the chronological timeline.

Versioned durable siphon definitions and their acknowledged cursor live under:

```text
durable-siphon-v1:{networkB64}:{nameB64} = {definition JSON}
```

A definition may contain one persisted outstanding delivery. Until that
delivery is acknowledged, polling returns the same immutable event references
with an incremented attempt count. Acknowledgement advances the cursor through
the batch atomically. This is local at-least-once delivery; it does not claim
distributed exactly-once execution.

Declarative Sink and Processor definitions use daemon-internal durable siphons
whose names begin with `thalweg.registry.v1.`. That namespace is unavailable to
ordinary public siphon creation and hidden from public siphon listing. An
explicit registry reset deletes the internal definition, acknowledged cursor,
and pending delivery so a changed selector can be accepted intentionally.

Registry YAML, accepted definitions, process state, retry state, and logs are
not part of immutable event storage. The last-known-good registry snapshot is
an atomically replaced mode-`0600` file under the storage parent's `registry`
directory. Runtime health remains in memory and is reconstructed from the
accepted snapshot on daemon startup; workers never read or write BadgerDB
directly.

Peer addresses use:

```text
peer:{peerId}
```

The current storage compatibility marker is:

```text
meta:storage-schema-version = 4
meta:hlc-state = {"physical":"2026-07-30T19:00:00.000000000Z","logical":3}
```

Observed event conflicts use an additive versioned metadata namespace:

```text
event-conflict-v1:{networkB64}:{eventIdB64}:{remoteDigest} = observation JSON
```

The daemon treats prototype databases without a marker as schema `1`, migrates
them to schema `2` by deriving the greatest stored ingestion timestamp, then
migrates to schema `3` by normalizing event timestamps, replacing legacy keys
with collision-safe base64url keys, and building the event-ID index. Schema `4`
backfills the daemon-local receipt-order index in deterministic chronological
order, then assigns new receipt ordinals transactionally at ingestion. Legacy
event-ID collisions stop migration with an actionable error. The daemon refuses
to open a database advertising a newer unsupported version. Future key changes
require sequential explicit migrations rather than silently reinterpreting
data.

## Current Ordering

Returned events are sorted by:

```text
occurredAt, insertedAt, counter, deviceId, stream, eventId
```

Event time remains the primary timeline order. The full originating HLC then
provides a restart-safe causal tie-breaker before device, stream, and event ID.

## Required Next Decisions

Before treating replication as continuously operational, decide and document:

- Durable incremental inventory indexes, cursors, and resumption.
- Continuous fanout plus background reconnect/retry policy.
- Explicit local event and payload size limits compatible with mesh frames.
- Whether one primary key plus secondary indexes is preferable.
- Retention and Badger TTL policy per stream/network/node.
- The next event-key/index migration and rollback policy.

These are correctness requirements for partition recovery, not optional
optimizations.
