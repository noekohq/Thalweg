# Thalweg Product Specification

## Mission

Thalweg is a local-first, peer-to-peer stream processing mesh for personal
telemetry and AI choreography. It acts as a sensory buffer: collecting chaotic
device data, normalizing it into an immutable chronological timeline, and
routing selected time windows to local processing.

Semantically durable insights may be handed to Noeko. Thalweg remains
responsible for temporal data and processing context rather than becoming the
permanent knowledge graph.

## Constraints

### Local Autonomy

Core operation must not require cloud infrastructure. Devices should discover
and synchronize over private networks while remaining useful when isolated.

### Hardware Asymmetry

Nodes have different storage and compute capabilities. Retention should be
expressed through policy and TTL rather than hard-coded device roles.

### Partition-Tolerant Time

Events are immutable. Offline and late-arriving events must merge
deterministically into the timeline without overwriting unrelated history.

### Choreographed Compute

Nodes may eventually claim scheduled processing work. When late data changes a
previously processed window, that window must be marked dirty and re-executed
idempotently.

## Domain Vocabulary

- **Stream:** one typed sequence of events.
- **Catchment:** an ingestion adapter that normalizes external data.
- **Basin:** a named virtual group of streams.
- **Siphon:** a continuous or time-buffered routing/query operation.
- **Derived stream:** processing output written back as new events.
- **Network:** an isolated private mesh and storage namespace.

## Current Phase

The current MVP provides a restart-safe local timeline plus explicit,
authenticated multi-network synchronization and approval-based LAN enrollment.
Continuous replication, durable scheduling, CRDT taxonomy, TTL policies, local
model execution, and Noeko handoff remain target architecture.

See `docs/ARCHITECTURE.md` and `docs/ROADMAP.md` for implementation detail.
