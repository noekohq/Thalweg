# Thalweg Agent Guide

This repository contains the Go daemon for Thalweg. It owns local persistence,
event ordering, IPC routing, subscriptions, and eventually peer-to-peer
replication. The TypeScript SDK lives separately at
https://github.com/noekohq/thalweg-js.

## Start Here

Read these documents before changing behavior:

1. `SPEC.md` - product mission, vocabulary, and system constraints.
2. `docs/ARCHITECTURE.md` - component boundaries and current data flow.
3. `docs/DATA_MODEL.md` - event envelope, ordering, and Badger keys.
4. `docs/PROTOCOL.md` - current Unix socket wire contract.
5. `docs/MESH_PROTOCOL.md` - remote membership handshake and trust boundary.
6. `docs/TESTING.md` - automated and host/VM acceptance procedure.
7. `docs/ROADMAP.md` - implemented scope and next milestones.
8. `docs/CLI.md` - installation and local operator workflow.
9. `docs/ENROLLMENT.md` - discovery, approval, and joining protocol.
10. `docs/CONSOLE.md` - local dashboard and multi-device test harness.
11. `HANDOFF.md` - current implementation caveats and recommended next work.

## Repository Responsibility

This repository is authoritative for:

- The canonical event envelope and temporal semantics.
- BadgerDB layout, retention, and chronological query behavior.
- Daemon lifecycle and local IPC protocol.
- Device identity, HLC behavior, and event deduplication.
- Peer discovery, transport, synchronization, and partition recovery.

It is not authoritative for:

- TypeScript payload inference or the fluent builder API.
- Catchment-specific integrations.
- Velotic UI behavior.
- Noeko graph schemas or long-term semantic storage.

## Development Commands

```bash
go test ./...
go run . spawn
```

The daemon listens on `/tmp/thalweg.sock`, writes events to `./storage/badger`,
and stores its private identity at `./storage/identity.key`.
Run commands from the repository root so the relative storage path is stable.
The installed operator workflow uses `./scripts/install.sh`, `thalweg init`,
and `thalweg daemon`; see `docs/CLI.md`.

## Current Invariants

- Stored events are immutable.
- Device/libp2p identity survives daemon restarts.
- Stored timestamps are canonical UTC RFC3339Nano with nine fractional digits.
- Event IDs are unique within a network; equivalent retries return the original
  stored event and conflicting reuse is rejected.
- Event identity lookups use the schema-3 `event-id-v3:` secondary index.
- Storage schema version `3` is persisted, migrated, and checked at startup.
- `(insertedAt, counter)` is the persistent HLC timestamp for event ordering.
- Every event belongs to one logical network and one stream.
- `occurredAt` is supplied by the producer or assigned at ingestion.
- `insertedAt` and `propagatedAt` are assigned by the origin daemon and remain
  immutable during replication.
- Queries are returned in deterministic chronological order.
- An empty stream filter means all streams in the selected network.
- Empty queries serialize as `[]`.
- Remote synchronization is inventory-first, bounded, and scoped to the
  network authenticated on that stream.
- Invitation reissue is explicit and returns the persisted version-1 shared
  bearer credential; it is not rotation or revocation.
- Socket messages are newline-delimited JSON.
- Local requests, responses, and subscription pushes carry protocol version `1`;
  absent request versions are treated as legacy version `1`.
- Request and response messages correlate through `id`.

## Current Prototype Boundaries

Do not describe these as implemented:

- Continuous p2p fanout, mDNS, GossipSub, or swarm-key isolation.
- Membership rotation, revocation, or invitation expiry.
- Physical per-network Badger databases.
- TTL retention, dirty-window tracking, or recomputation.
- CRDT-managed basin taxonomy.
- Noeko or local-model execution.

The daemon currently has persisted identity and HLC state, authenticated
multi-network membership, bounded bidirectional synchronization, one Badger
database, manual/startup peer sync, and in-memory live subscriptions.

## Change Discipline

- Update `docs/PROTOCOL.md` with any wire-contract change.
- Update `docs/DATA_MODEL.md` before changing keys or timestamp semantics.
- Preserve backward compatibility deliberately; do not silently rename actions
  or JSON fields.
- Add tests for ordering, persistence, malformed input, and restart behavior
  when changing the data plane.
- Keep p2p protocol handling separate from trusted local IPC handlers.
- Coordinate public contract changes with the `thalweg-js` repository.
