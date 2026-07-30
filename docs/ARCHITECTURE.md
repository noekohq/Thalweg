# Thalweg Architecture

## Mission

Thalweg is a local-first chronological event mesh for personal telemetry and AI
choreography. It accepts heterogeneous high-frequency data, normalizes it into
an immutable timeline, routes selected time windows to local processors, and
allows derived insights to re-enter the timeline.

Thalweg is the temporal sensory buffer. Noeko is intended to be the durable
semantic graph. Raw telemetry should not need to become permanent graph data.

## Repository Boundary

The system is intentionally split across repositories:

- `noekohq/Thalweg`: Go daemon, storage, IPC, ordering, and p2p.
- `noekohq/thalweg-js`: typed SDK, basins, siphon builders, and application
  integration.
- Velotic: an example consumer and eventual personal timeline experience.
- Noeko: downstream durable semantic knowledge storage.

Keeping these separate is a supported project structure, not a temporary
failure to create a monorepo. Cross-repository contracts must therefore be
documented and versioned carefully.

## Intended Data Flow

```text
Catchments / applications
        |
        | typed payloads
        v
thalweg-js
        |
        | local IPC contracts
        v
Go daemon -----> BadgerDB chronological event store
        |                    |
        | live events        | range queries
        +----------+---------+
                   |
                   v
        continuous / buffered siphons
                   |
                   v
       local processing or AI inference
                   |
                   | derived events
                   +-----> Thalweg
                   |
                   +-----> Noeko when semantically durable
```

## Current MVP

The current daemon:

- Creates one libp2p host and one BadgerDB instance.
- Accepts newline-delimited JSON over a Unix domain socket.
- Stores immutable events with three timestamps.
- Queries one or more streams and sorts the merged results chronologically.
- Pushes newly ingested events to matching in-memory subscriptions.
- Persists manually dialed peer addresses and attempts to reconnect at startup.

The current daemon does not replicate events between peers. Its p2p stream
handler only logs received text.

## Target Topology

The target system is a set of autonomous daemons on asymmetric hardware:

- Lightweight nodes retain short-lived or selected telemetry.
- Archival nodes retain broader history.
- Nodes discover and synchronize over private local networks.
- Partitions are normal; late events merge deterministically after reconnection.
- Compute-capable nodes can claim scheduled processing windows.
- Late arrivals mark completed windows dirty and cause idempotent reprocessing.

Each logical network is intended to have independent storage and cryptographic
membership. The current `network` string is only a logical filter and does not
yet provide physical or cryptographic isolation.

## Core Concepts

### Streams

A stream is an independently addressable typed event sequence such as
`system:app_activity` or `sensor:heart_rate`.

### Catchments

Catchments collect external data and normalize it into Thalweg events. They may
poll APIs, receive webhooks, observe local activity, or write filesystem
pointers for large binary media.

### Basins

A basin is a named virtual grouping of streams. It should be evaluated by
merging underlying streams, not by duplicating events. The target design stores
basin taxonomy as CRDT state; the current SDK supplies basin membership locally.

### Siphons

A siphon routes selected events to application code:

- Continuous mode emits individual future events.
- Buffered mode emits stream-keyed arrays for a time interval or window.

The current implementation supports future-event subscriptions and one-shot
lookback queries. Scheduling and dirty-window replay are not implemented.

## Trust Boundaries

Local IPC and remote p2p traffic must not share authorization assumptions.
Future p2p handlers should validate network membership, event identity,
deduplication, size limits, and protocol versions before touching storage.

