# Event Data Model

## Canonical Envelope

The current daemon stores this event shape:

| Field | Meaning | Current owner |
| --- | --- | --- |
| `id` | Event identifier | Producer or daemon |
| `network` | Logical network name | SDK/application |
| `stream` | Typed stream identifier | SDK/application |
| `occurredAt` | When the event happened | Producer or daemon default |
| `insertedAt` | When this daemon accepted it | Daemon |
| `propagatedAt` | When this node surfaced/synced it | Daemon |
| `counter` | HLC-like ordering counter | Daemon |
| `deviceId` | Originating daemon identity | Daemon |
| `payload` | Stream-specific JSON payload | Producer |

All timestamps are strings accepted by Go's RFC3339Nano parser. Producers should
send canonical UTC values to avoid relying on lexical comparisons between
different offsets or fractional-second formats.

## Temporal Semantics

- Event time (`occurredAt`) represents physical reality and drives timeline
  queries.
- Ingestion time (`insertedAt`) records when the local daemon accepted an event.
- Processing time (`propagatedAt`) is reserved for node-specific propagation.

In the MVP, `insertedAt` and `propagatedAt` are assigned to the same instant.
That is a placeholder, not the final propagation model.

## Current Badger Key

```text
event:{network}:{stream}:{occurredAt}:{counter}:{deviceId}:{eventId}
```

Colons in selected key components are escaped as `%3A`. The counter is padded to
20 decimal digits.

This layout efficiently scans one stream, but a multi-stream query currently
scans each stream separately, decodes values, and sorts all matching events in
memory. It is not yet a globally time-major index.

Peer addresses use:

```text
peer:{peerId}
```

## Current Ordering

Returned events are sorted by:

```text
occurredAt, counter, deviceId, stream, eventId
```

The counter is process-local state. It increments when an event arrives with an
`occurredAt` value less than or equal to the latest seen timestamp. It resets
when the daemon restarts and therefore is not a true Hybrid Logical Clock.

## Required Next Decisions

Before event replication, implement and document:

- Persistent device identity.
- A restart-safe HLC with receive/merge semantics.
- Canonical timestamp normalization before key construction.
- Idempotent event identity and duplicate rejection.
- Whether one primary key plus secondary indexes is preferable.
- Retention and Badger TTL policy per stream/network/node.
- Migration/version markers for changing key formats.

These are correctness requirements for partition recovery, not optional
optimizations.

