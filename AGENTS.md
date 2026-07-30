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
5. `docs/ROADMAP.md` - implemented scope and next milestones.
6. `HANDOFF.md` - current implementation caveats and recommended next work.

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

The daemon listens on `/tmp/thalweg.sock` and writes to `./storage/badger`.
Run commands from the repository root so the relative storage path is stable.

## Current Invariants

- Stored events are immutable.
- Every event belongs to one logical network and one stream.
- `occurredAt` is supplied by the producer or assigned at ingestion.
- `insertedAt` and `propagatedAt` are assigned by the daemon.
- Queries are returned in deterministic chronological order.
- An empty stream filter means all streams in the selected network.
- Socket messages are newline-delimited JSON.
- Request and response messages correlate through `id`.

## Current Prototype Boundaries

Do not describe these as implemented:

- True Hybrid Logical Clock persistence or merge behavior.
- Stable device identity across daemon restarts.
- P2P event replication, mDNS, GossipSub, or swarm-key isolation.
- Physical per-network Badger databases.
- TTL retention, dirty-window tracking, or recomputation.
- CRDT-managed basin taxonomy.
- Noeko or local-model execution.

The daemon currently has an HLC-like in-memory counter, one Badger database,
manual peer dialing, and in-memory live subscriptions.

## Change Discipline

- Update `docs/PROTOCOL.md` with any wire-contract change.
- Update `docs/DATA_MODEL.md` before changing keys or timestamp semantics.
- Preserve backward compatibility deliberately; do not silently rename actions
  or JSON fields.
- Add tests for ordering, persistence, malformed input, and restart behavior
  when changing the data plane.
- Keep p2p protocol handling separate from trusted local IPC handlers.
- Coordinate public contract changes with the `thalweg-js` repository.

