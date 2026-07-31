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

The Go repository also owns a thin operator CLI. Its `network`, `event`,
`peer`, and `status` commands use the public local IPC contract rather than
opening storage directly. This keeps manual provisioning behavior aligned with
the SDK while allowing a node to be installed and operated without JavaScript.

The repository now also owns the initial read-only Console implementation. A
shared observer model calls only documented local IPC actions and feeds both a
Bubble Tea TUI and a tokenized loopback HTTP sidecar with an embedded browser
UI. Neither frontend opens storage, membership files, or daemon logs directly.
Mesh Lab operations remain deferred.

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

- Creates one restart-stable libp2p host and one BadgerDB instance.
- Accepts newline-delimited JSON over a Unix domain socket.
- Stores immutable events with three timestamps.
- Queries one or more streams and sorts the merged results chronologically.
- Pushes newly ingested events to matching in-memory subscriptions.
- Persists manually dialed peer addresses and attempts to reconnect at startup.
- Handles interrupt/termination signals and closes clients, storage, the host,
  and its owned Unix socket.
- Persists storage schema version `3` and exposes daemon, local protocol, and
  storage versions through network status.
- Persists a Hybrid Logical Clock and assigns `(insertedAt, counter)` atomically
  with each locally ingested event.
- Uses a network/event-ID secondary index for idempotent ingestion.
- Provides an internal replicated-event receive boundary that preserves origin
  envelopes and atomically stores the event/index while merging the remote HLC.
- Exchanges bounded ID/digest inventories after network authentication and
  transfers missing envelopes bidirectionally.
- Provides per-user initialization and native provisioning, event inspection,
  and authenticated peer commands over the documented local IPC contract.
- Provides opt-in LAN mDNS discovery, time-bounded enrollment offers, explicit
  approval/denial, and post-approval initial synchronization.
- Disables TCP source-port reuse until hole punching is implemented, avoiding
  same-port macOS LAN dial failures.

Replication currently runs on explicit `mesh_sync` and when a persisted peer is
restored at startup. There is no continuous live fanout or periodic background
retry. The legacy p2p stream still only logs text.

## Target Topology

The target system is a set of autonomous daemons on asymmetric hardware:

- Lightweight nodes retain short-lived or selected telemetry.
- Archival nodes retain broader history.
- Nodes discover and synchronize over private local networks.
- Partitions are normal; late events merge deterministically after reconnection.
- Compute-capable nodes can claim scheduled processing windows.
- Late arrivals mark completed windows dirty and cause idempotent reprocessing.

Each mounted logical network now has independent membership credentials and a
stable public network ID. A physical device can mount several credentials in
`storage/memberships.json`. Local events still use the membership name as their
namespace, and all networks currently share one Badger database.

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

Local IPC and remote p2p traffic do not share authorization assumptions. The
remote `/thalweg/mesh/1.0.0` handshake mutually proves one network credential
using peer-ID-bound HMAC challenges and bounded frames before synchronization
may touch storage. Every sync message and event is checked against that
authenticated network.
