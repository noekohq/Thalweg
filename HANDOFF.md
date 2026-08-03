# Thalweg Daemon Handoff

Last reviewed: 2026-08-02

## Current State

This repository contains a working local-first mesh MVP, not the complete
distributed architecture. The daemon can ingest, persist, query, live-push,
authenticate peers, enroll devices, and synchronize events over explicit and
startup-restored connections.

The TypeScript SDK lives at `packages/sdk-js` in this monorepo.

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
- `cli_doctor.go`: read-only configuration, lifecycle, permissions, p2p,
  installation, upgrade-readiness, and log diagnostics.
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
- `core/daemon/conflicts.go`: persisted conflict observations, replicated
  preserve-both resolutions, deterministic recovery, and query supersession.
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
make test
make build
```

The installed workflow is:

```bash
./scripts/install.sh
thalweg init
thalweg daemon
```

With the daemon running, use the workspace SDK demo:

```bash
bun run demo:velotic
```

Expected demo behavior: three source events are ingested, a buffered siphon
creates one `insights:summary` event, and all four print chronologically.

## Known Technical Debt

- Authenticated synchronization invokes the atomic replicated-event ingest
  path and pages through the event-ID index, but cursor progress is not durable.
- Conflict resolution is currently lossless `preserve-both` only. Winner
  selection, semantic merge, undo, and subscriber retraction are intentionally
  deferred; see `docs/CONFLICTS.md`.
- Local ingestion is serialized while advancing the persistent HLC; this may
  become a throughput bottleneck under high-volume concurrent producers.
- Multi-stream queries sort decoded events in memory.
- Subscriptions are future-only and in-memory. Bounded queues prevent slow
  sockets from blocking ingestion by disconnecting consumers that fall behind;
  acknowledgement and replay are still absent.
- Requests without `protocolVersion` are accepted as legacy version `1`; there
  is no handshake or feature-level negotiation.
- The mesh stream authenticates and synchronizes one network at a time.
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
- Console event inspection requests the newest events in a bounded 24-hour
  diagnostic window, but does not yet support cursor-based pagination.
- Peer health, topology edges, synchronization status, storage summaries, and
  processing health remain unavailable daemon read contracts and are shown as
  unsupported by both console frontends.
- `data/event.proto` is reserved but currently empty; the active JSON contract
  is shared by a small internal Go IPC package and monorepo documentation.

## Recommended Next Work

Continue the "Trustworthy Local Timeline" milestone in `docs/ROADMAP.md`.
Persistent identity, graceful lifecycle, canonical timestamps, idempotent event
behavior, persistent HLC, local message versioning, atomic replicated-event
receive, authenticated multi-network membership, and bounded bidirectional sync
are implemented. Next work is durable incremental sync progress,
discovery/background retry, live fanout, and the Console/Mesh Lab.

Any wire change must update `packages/sdk-js` and the canonical root protocol
documentation in the same change.
