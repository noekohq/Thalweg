# Thalweg Daemon Handoff

Last reviewed: 2026-07-30

## Current State

This repository contains a working local MVP, not the complete distributed
architecture. The daemon can ingest, persist, query, and live-push events over a
Unix socket. It starts a libp2p host, but events do not replicate between peers.

The companion SDK is https://github.com/noekohq/thalweg-js.

Important entry points:

- `main.go`: CLI and daemon startup.
- `core/daemon/daemon.go`: IPC, events, storage, subscriptions, and p2p scaffold.
- `core/daemon/daemon_test.go`: current automated coverage.
- `docs/PROTOCOL.md`: contract consumed by the SDK.

## Verify

```bash
go test ./...
go run . spawn
```

With the daemon running, use the companion repository:

```bash
bun run demo:velotic
```

Expected demo behavior: three source events are ingested, a buffered siphon
creates one `insights:summary` event, and all four print chronologically.

## Known Technical Debt

- Device identity changes on every restart.
- The ordering counter is not persisted and is not a real HLC.
- Timestamp strings are compared lexically without canonical normalization.
- Event IDs are not enforced as globally idempotent.
- Multi-stream queries sort decoded events in memory.
- Subscriptions are future-only, in-memory, and have no backpressure.
- Daemon shutdown is not graceful or signal-aware.
- The socket has no explicit access-control setup or protocol version.
- P2P streams log text but do not authenticate or synchronize events.
- `data/event.proto` is reserved but currently empty.
- `test.go` is a standalone historical libp2p experiment.

## Recommended Next Work

Start with the "Restart-Safe Local Timeline" milestone in
`docs/ROADMAP.md`. Persistent identity and correct clock behavior are the
foundation for every synchronization feature. Do not begin GossipSub/event
replication while event identity and ordering remain process-local.

Any wire change must be mirrored in `noekohq/thalweg-js` and documented in both
repositories.
