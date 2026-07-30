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

## Current Badger Key

```text
event-v3:{networkB64}:{streamB64}:{occurredAt}:{counter}:{deviceIdB64}:{eventIdB64}
```

String components use unpadded base64url encoding and the counter is padded to
20 decimal digits. Base64url replaced the prototype's `%3A` substitution
because that substitution could not distinguish a literal `%3A` from a colon.

This layout efficiently scans one stream, but a multi-stream query currently
scans each stream separately, decodes values, and sorts all matching events in
memory. It is not yet a globally time-major index.

Network-wide event identity uses:

```text
event-id-v3:{networkB64}:{eventIdB64} = {primaryEventKey}
```

The index is written in the same transaction as new events. A missing target or
mismatched envelope is treated as storage corruption rather than silently
recreating history.

Peer addresses use:

```text
peer:{peerId}
```

The current storage compatibility marker is:

```text
meta:storage-schema-version = 3
meta:hlc-state = {"physical":"2026-07-30T19:00:00.000000000Z","logical":3}
```

The daemon treats prototype databases without a marker as schema `1`, migrates
them to schema `2` by deriving the greatest stored ingestion timestamp, then
migrates to schema `3` by normalizing event timestamps, replacing legacy keys
with collision-safe base64url keys, and building the event-ID index. Legacy
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
