# Thalweg Agent Guide

This monorepo contains the Go daemon and CLI, TypeScript and Python SDKs,
browser Console, shared contracts, and client applications for Thalweg. The Go
data plane owns local persistence, event ordering, IPC routing, subscriptions,
and peer-to-peer replication. `packages/sdk-js` and `packages/sdk-python` own
their language-specific developer APIs.

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
12. `docs/MONOREPO.md` - workspace ownership and cross-language commands.

## Repository Responsibility

This repository is authoritative for:

- The canonical event envelope and temporal semantics.
- BadgerDB layout, retention, and chronological query behavior.
- Daemon lifecycle and local IPC protocol.
- Device identity, HLC behavior, and event deduplication.
- Peer discovery, transport, synchronization, and partition recovery.

It is not authoritative for:

- TypeScript payload inference or the fluent builder API.
- Python transport lifecycle, models, or async API ergonomics.
- Catchment-specific integrations.
- Velotic UI behavior.
- Noeko graph schemas or long-term semantic storage.

## Development Commands

```bash
make bootstrap
make check
make test
make build

# Focused commands
go test ./...
go run ./cmd/thalweg spawn
bun --cwd packages/sdk-js test
PYTHONPATH=packages/sdk-python/src python3 -m unittest discover -s packages/sdk-python/tests -t packages/sdk-python
bun run --cwd apps/console-web check
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
- Storage schema version `4` is persisted, migrated, and checked at startup;
  schema 4 adds the daemon-local receipt-order index used by durable siphons.
- `(insertedAt, counter)` is the persistent HLC timestamp for event ordering.
- Every event belongs to one logical network and one stream.
- `occurredAt` is supplied by the producer or assigned at ingestion.
- `insertedAt` and `propagatedAt` are assigned by the origin daemon and remain
  immutable during replication.
- Queries are returned in deterministic requested chronological order; the
  default is ascending and `desc` applies limits newest-first.
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

- Continuous p2p fanout, GossipSub, or swarm-key isolation.
- Membership rotation, revocation, or invitation expiry.
- Physical per-network Badger databases.
- TTL retention, dirty-window tracking, or recomputation.
- CRDT-managed basin taxonomy.
- Noeko or local-model execution.

The daemon currently has persisted identity and HLC state, authenticated
multi-network membership, bounded bidirectional synchronization, one Badger
database, approval-based mDNS enrollment, manual/startup peer sync, and
bounded in-memory live subscriptions, plus named durable pull siphons with
receipt cursors and acknowledged retry. The read-only Console has Bubble Tea and
loopback-browser frontends over one shared public-IPC observer model; peer
health, sync state, live tail, pagination, and Mesh Lab controls remain future
work.

## Change Discipline

- Update `docs/PROTOCOL.md` with any wire-contract change.
- Update `docs/DATA_MODEL.md` before changing keys or timestamp semantics.
- Preserve backward compatibility deliberately; do not silently rename actions
  or JSON fields.
- Add tests for ordering, persistence, malformed input, and restart behavior
  when changing the data plane.
- Keep p2p protocol handling separate from trusted local IPC handlers.
- Coordinate public contract changes with both SDK packages in the same change.
