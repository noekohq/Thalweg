# Thalweg Daemon Handoff

Last reviewed: 2026-07-30

## Current State

This repository contains a working local MVP, not the complete distributed
architecture. The daemon can ingest, persist, query, and live-push events over a
Unix socket. It starts a libp2p host, but events do not replicate between peers.

The companion SDK is https://github.com/noekohq/thalweg-js.

Important entry points:

- `main.go`: CLI and daemon startup.
- `cli.go`: native initialization, provisioning, event, peer, and status
  commands.
- `cli_config.go`: per-user config resolution and restricted atomic writes.
- `cli_ipc.go`: bounded local CLI request/response client.
- `cli_console.go`: TUI and loopback web-console CLI entry points.
- `cli_daemon_lifecycle.go`: managed daemon state, status, logs, stop, and
  restart.
- `cli_upgrade.go`: source-channel installation records, Git fast-forward
  validation, atomic reinstall, and post-upgrade restart.
- `internal/console`: shared read-only daemon adapter, snapshot model, Bubble
  Tea TUI, embedded browser UI, security-sensitive routing, and tests.
- `scripts/install.sh`: local source-checkout installer.
- `docs/CLI.md`: install and two-device operator workflow.
- `docs/ENROLLMENT.md`: discovery/enrollment state machine and limitations.
- `core/daemon/daemon.go`: IPC, events, storage, subscriptions, and p2p scaffold.
- `core/daemon/hlc.go`: persistent HLC tick and remote merge rules.
- `core/daemon/identity.go`: restart-stable libp2p identity and socket safety.
- `core/daemon/membership.go`: multi-network credentials and invitations.
- `core/daemon/mesh.go`: bounded peer-ID-bound membership handshake.
- `core/daemon/enrollment.go`: mDNS discovery, time-bounded offers, pending
  approval, credential delivery, and initial sync.
- `core/daemon/sync.go`: inventory/digest comparison and event transfer.
- `core/daemon/version.go`: daemon/protocol constants and storage compatibility.
- `core/daemon/daemon_test.go`: current automated coverage.
- `core/daemon/lifecycle_test.go`: identity, restart, and socket lifecycle tests.
- `core/daemon/hlc_test.go`: local ticks, restart, wall regression, and merge tests.
- `core/daemon/membership_test.go`: credential persistence and file safety.
- `core/daemon/mesh_test.go`: live multi-network authorization and framing.
- `core/daemon/replication_test.go`: atomic replicated-envelope receive tests.
- `core/daemon/sync_test.go`: convergence, conflicts, interruption, concurrency,
  bounds, and isolation.
- `core/daemon/fuzz_test.go`: parser, framing, and envelope fuzz targets.
- `core/daemon/version_test.go`: storage schema and compatibility tests.
- `docs/PROTOCOL.md`: contract consumed by the SDK.

## Verify

```bash
go test ./...
go run . spawn
```

The installed workflow is:

```bash
./scripts/install.sh
thalweg init
thalweg daemon
```

With the daemon running, use the companion repository:

```bash
bun run demo:velotic
```

Expected demo behavior: three source events are ingested, a buffered siphon
creates one `insights:summary` event, and all four print chronologically.

## Known Technical Debt

- Authenticated synchronization invokes the atomic replicated-event ingest
  path, but inventory construction still scans full network history in memory.
- Local ingestion is serialized while advancing the persistent HLC; this may
  become a throughput bottleneck under high-volume concurrent producers.
- Multi-stream queries sort decoded events in memory.
- Subscriptions are future-only, in-memory, and have no backpressure.
- Requests without `protocolVersion` are accepted as legacy version `1`; there
  is no handshake or feature-level negotiation.
- The legacy p2p stream only logs text; the mesh stream authenticates and
  synchronizes one network at a time.
- Persisted peer restoration requires a stable configured address until
  discovery exists.
- `thalweg daemon start` detaches, verifies socket readiness, and records
  restricted lifecycle state and logs. The CLI can inspect, stop, and restart
  it gracefully. Source installs record their checkout and commit, and
  `thalweg upgrade` performs clean fast-forward upgrades with atomic binary
  replacement and optional restart. The installer does not yet register a
  supervised login service, restart on failure, provide signed release
  artifacts, or uninstall Thalweg.
- `network_invite` and `thalweg network invite` reissue the persisted
  version-1 shared-bearer credential. They do not rotate it or create expiring
  enrollment grants.
- Approval-based enrollment avoids exposing that credential before a local
  operator approves the authenticated requesting peer, but approved devices
  still receive the same version-1 shared secret.
- TCP source-port reuse is disabled. Re-enable it only with tested hole
  punching and same-port macOS acceptance coverage.
- Console event inspection is a bounded 24-hour diagnostic query, not
  cursor-based pagination or a complete newest-first event browser.
- Peer health, topology edges, synchronization status, storage summaries, and
  processing health remain unavailable daemon read contracts and are shown as
  unsupported by both console frontends.
- `data/event.proto` is reserved but currently empty.
- `test.go` is a standalone historical libp2p experiment.

## Recommended Next Work

Continue the "Trustworthy Local Timeline" milestone in `docs/ROADMAP.md`.
Persistent identity, graceful lifecycle, canonical timestamps, idempotent event
behavior, persistent HLC, local message versioning, atomic replicated-event
receive, authenticated multi-network membership, and bounded bidirectional sync
are implemented. Next work is durable incremental sync progress,
discovery/background retry, live fanout, and the Console/Mesh Lab.

Any wire change must be mirrored in `noekohq/thalweg-js` and documented in both
repositories.
