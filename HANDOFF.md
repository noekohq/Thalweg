# Thalweg Daemon Handoff

Last reviewed: 2026-08-03

## Current State

This repository contains a working local-first mesh MVP, not the complete
distributed architecture. The daemon can ingest, persist, query, live-push,
authenticate peers, enroll devices, and synchronize events explicitly or
through periodic retry of remembered authorized peers.

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
- `internal/lab`: bounded deterministic test-event publication and replica
  sequence verification shared by CLI and the opt-in browser workbench.
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
- `core/daemon/peer_health.go`: persisted authorized-peer health, periodic
  synchronization, bounded retry, and network-scoped cleanup.
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
- Local errors now carry stable codes and retryability hints while retaining
  the legacy message, but handlers still lack action-specific server-side time
  budgets.
- The mesh stream authenticates and synchronizes one network at a time.
- Periodic remembered-peer synchronization requires a stable configured
  address until mounted-peer discovery and multi-address selection exist. It is
  sequential and does not provide continuous live fanout.
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
- `network_leave` removes this node's membership and remembered peers without
  deleting stored event bytes; trusted local queries can still name that event
  namespace. It does not rotate or revoke version-1 bearer credentials held by
  other nodes.
- Approval-based enrollment avoids exposing that credential before a local
  operator approves the authenticated requesting peer, but approved devices
  still receive the same version-1 shared secret.
- TCP source-port reuse is disabled. Re-enable it only with tested hole
  punching and same-port macOS acceptance coverage.
- Console event inspection requests the newest events in a bounded 24-hour
  diagnostic window, but does not yet support cursor-based pagination.
- Persisted peer health and last synchronization status are now exposed in both
  console frontends. Topology edges, active progress, durable lag, storage
  summaries, and processing health remain unavailable read contracts.
- `thalweg lab publish` and `thalweg lab verify` remove the need to hand-author
  individual smoke-test events. `thalweg console web --lab` exposes the same
  bounded workflow; ordinary Console sessions remain read-only.
- `data/event.proto` is reserved but currently empty; the active JSON contract
  is shared by a small internal Go IPC package and monorepo documentation.

## Recommended Next Work

Milestones 1 and 2 now cover durable identity/order, safe lifecycle, structured
local errors, authenticated multi-network membership, bounded bidirectional
sync, local leave, periodic authorized-peer retry, conflict preservation, and
basic peer-health visibility. Their remaining hardening work is exhaustive IPC
integration coverage, action deadlines/feature negotiation, credential-v2
rotation and revocation, mounted-peer/WAN discovery, durable incremental sync
progress, live fanout, and the guided Mesh Lab.

Any wire change must update `packages/sdk-js` and the canonical root protocol
documentation in the same change.
