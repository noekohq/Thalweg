# Thalweg Daemon Handoff

Last reviewed: 2026-08-03

## Current State

This repository contains a working local-first mesh MVP, not the complete
distributed architecture. The daemon can ingest, persist, query, live-push,
authenticate peers, enroll devices, and synchronize events explicitly,
immediately after local event bursts, or through periodic anti-entropy.

The TypeScript SDK lives at `packages/sdk-js` in this monorepo.

Important entry points:

- `cmd/thalweg/main.go`: minimal binary entry point.
- `internal/cli`: native initialization, provisioning, event, peer, status,
  configuration, and bounded local IPC commands.
- `internal/cli/command_console.go`: TUI and loopback web-console entry points.
- `internal/cli/command_daemon_lifecycle.go`: managed daemon state, status, logs, stop, and
  restart.
- `internal/cli/command_upgrade.go`: source-channel installation records, Git fast-forward
  validation, atomic reinstall, and post-upgrade restart.
- `internal/cli/command_doctor.go`: read-only configuration, lifecycle, permissions, p2p,
  installation, upgrade-readiness, and log diagnostics.
- `internal/console`: shared read-only daemon adapter, snapshot model, Bubble
  Tea TUI, embedded browser UI, security-sensitive routing, and tests.
- `internal/lab`: bounded deterministic test-event publication and replica
  sequence verification, including blocking convergence reports, shared by CLI
  and the opt-in browser workbench.
- `internal/registry`: strict user YAML definitions, accepted snapshots,
  executable supervision, durable Sink/Processor delivery, retry, logs, and
  sanitized health shared by CLI and Consoles.
- `core/daemon/registry.go`: narrow host adapter and version-1 registry IPC
  routes without direct registry access to Badger or memberships.
- `core/daemon/durable_siphon.go`: schema-4 receipt index, named consumer
  definitions, pending batches, bounded wakeups, acknowledgements, and restart
  retry.
- `../thalweg-transcript-worker`: standalone durable transcript-to-note
  reference worker used to validate the public integration boundary.
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
- `core/daemon/peer_health.go`: persisted authorized-peer health,
  event-triggered synchronization, periodic anti-entropy, bounded retry, and
  network-scoped cleanup.
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
- Connection-scoped subscriptions remain future-only and in-memory. Durable
  pull siphons now provide receipt-order replay, one persisted outstanding
  batch, bounded wakeups, acknowledgement, and restart retry. Multi-worker
  leases, dead letters, scheduling, watermarks, and dirty windows remain.
- Requests without `protocolVersion` are accepted as legacy version `1`; there
  is no handshake or feature-level negotiation.
- Local errors now carry stable codes and retryability hints while retaining
  the legacy message, but handlers still lack action-specific server-side time
  budgets.
- The mesh stream authenticates and synchronizes one network at a time.
- Event-triggered and periodic remembered-peer synchronization require a stable
  configured address until mounted-peer discovery and multi-address selection
  exist. Bursts coalesce into inventory syncs; this is not yet a permanent
  remote event stream.
- Authenticated inbound mesh streams now persist the initiator's best
  advertised TCP listener. This repairs the earlier enrollment asymmetry where
  only the joining node remembered the approving node and reverse-triggered
  delivery had no target.
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
- The browser's "Latest 12" table takes the first 12 entries from that
  newest-first response. An earlier reverse-before-slice bug displayed the
  oldest portion once more than 12 events existed.
- Persisted peer health and last synchronization status are now exposed in both
  console frontends. Topology edges, active progress, durable lag, storage
  summaries, and processing health remain unavailable read contracts.
- `thalweg lab publish`, `verify`, and `watch` remove the need to hand-author
  individual smoke-test events and produce comparable convergence reports.
  `thalweg console web --lab` exposes the bounded publish/verify workflow;
  ordinary Console sessions remain read-only.
- `data/event.proto` is reserved but currently empty; the active JSON contract
  is shared by a small internal Go IPC package and monorepo documentation.

## Recommended Next Work

Milestones 1 and 2 now cover durable identity/order, safe lifecycle, structured
local errors, authenticated multi-network membership, bounded bidirectional
sync, local leave, event-triggered delivery, periodic anti-entropy, conflict
preservation, and basic peer-health visibility. Their remaining hardening work is exhaustive IPC
integration coverage, action deadlines/feature negotiation, credential-v2
rotation and revocation, mounted-peer/WAN discovery, durable incremental sync
progress, long-lived mesh streams, and the guided Mesh Lab. Near-immediate
delivery does not close the durable-runtime requirement for watermarks,
allowed lateness, and dirty-window replay.

Any wire change must update `packages/sdk-js` and the canonical root protocol
documentation in the same change.
