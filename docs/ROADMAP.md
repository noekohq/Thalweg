# Thalweg System Roadmap

Last reviewed: 2026-07-30

## North Star

Thalweg is a local-first event fabric that synchronizes the evolving history of
people and systems across trusted devices. Applications, services, sensors, and
agents publish immutable observations; siphons react to those observations and
publish traceable outcomes as new events.

Thalweg owns reliable event movement and reactive execution. Integrations own
source-specific behavior such as audio capture, transcription, SSH access,
Supabase collection, model execution, permanent knowledge storage, and alert
delivery. The SDK should provide enough lifecycle, checkpoint, provenance, and
failure-handling primitives that integrations do not need to rebuild
distributed-systems infrastructure.

## Product Commitments

- Core operation is useful without a cloud control plane.
- Authorized nodes converge after partitions and offline operation.
- Events are immutable, attributable, and deterministically ordered.
- A physical device may participate in multiple isolated networks.
- Network membership is a cryptographic trust and replication boundary.
- Logical availability does not require every device to retain every byte.
- Retention and replication are policies rather than fixed device roles.
- Agent conclusions and actions re-enter the fabric as observable events.
- Derived events carry causal and execution lineage.
- Consequential automation can be gated by explicit approval events.
- Delivery and execution use at-least-once semantics with idempotency rather
  than claiming distributed exactly-once behavior.

## Current Implementation

The repository contains a working single-process local prototype.

### Event and Storage Plane

Implemented:

- Badger-backed event ingestion.
- Restart-stable physical device/libp2p identity.
- Canonical fixed-width UTC RFC3339Nano timestamps.
- Network-wide event-ID idempotency and conflicting duplicate rejection.
- Network/event-ID secondary index written atomically with new events.
- Persistent HLC state with local tick and tested remote merge semantics.
- Internal replicated-event receive with atomic validation, deduplication,
  event/index storage, HLC merge, and local live delivery.
- Bounded bidirectional inventory synchronization over an authenticated
  network-scoped mesh stream.
- Persisted storage schema version `3`, sequential schema-1→2→3 migrations, and
  incompatible-version rejection.
- Immutable event envelopes with `occurredAt`, `insertedAt`, and
  `propagatedAt`.
- Logical network and stream namespacing.
- Range and stream queries.
- Deterministic in-memory merge ordering for multi-stream results.
- Producer-supplied or daemon-generated event IDs.

Prototype limitations:

- Synchronization inventory scans and sorts full network history in memory even
  though wire pages are bounded.
- Inventory cursors and progress are session-local rather than durable.
- Event frames are capped at 1 MiB; larger local events cannot synchronize.
- Local ingestion is serialized while advancing the HLC.
- One Badger database contains every logical network.
- There is no batch ingestion, TTL, retention, or blob-reference policy.

### Local IPC and Lifecycle

Implemented:

- Newline-delimited JSON over `/tmp/thalweg.sock`.
- Correlated request/response messages.
- Protocol version `1` on requests, responses, and subscription pushes, with
  explicit mismatch rejection.
- Event ingestion and query actions.
- Future-only in-memory siphon registration.
- Subscription cleanup when a socket disconnects.
- Network status and manual peer dialing actions.
- Daemon, local protocol, and storage schema versions in network status.
- Restrictive Unix socket permissions and protection against deleting an active
  socket or a non-socket path.
- Signal-aware shutdown of the listener, clients, storage, and libp2p host.
- Native Go CLI commands for initialization, network provisioning, event
  inspection, and authenticated peer dial/sync.
- Explicit invitation reissue from persisted membership without requiring
  operators to archive invitation strings.
- Opt-in LAN mDNS discovery and time-bounded approval-based enrollment.
- Manual-address enrollment fallback for routed/VPN/publicly reachable peers.
- Structured `--debug` tracing plus raw-TCP versus libp2p dial diagnostics.
- TCP source-port reuse disabled until hole punching is intentionally designed.
- Foreground and readiness-checked detached daemon launch, restricted
  lifecycle state and logs, live process status, and graceful stop/restart.
- Source-checkout installer targeting a user-selected binary directory.

Prototype limitations:

- The socket relies on local filesystem permissions for access control and has
  message versioning but no handshake or feature negotiation.
- There are no request limits, deadlines, backpressure, or structured errors.
- Subscription delivery may block behind a slow client.
- Socket integration coverage currently exercises lifecycle and network status,
  but not every action.

### Peer-to-Peer Plane

Implemented:

- A restart-stable libp2p host is created from a private key stored with `0600`
  permissions.
- Peers can be dialed manually by multiaddress.
- Dialed peer addresses are remembered and retried after restart.
- A prototype stream handler accepts and logs text.
- Versioned `/thalweg/mesh/1.0.0` mutual membership authentication bound to
  physical libp2p peer IDs.
- A versioned `0600` membership file with multiple independent network
  credentials.
- Local create, join, redacted list, and authenticated network-scoped dial
  actions.
- Manual and startup-triggered bidirectional synchronization with digest
  conflict detection.

Not implemented:

- Discovery.
- Continuous live fanout and periodic background retry.
- Durable synchronization cursors and incremental storage indexes.
- Replication and retention policies.
- Credential rotation, revocation, expiry, or network leave.
- Remote inventory/event framing and feature negotiation beyond handshake
  versioning.

### Reactive Execution

Implemented across the daemon and `thalweg-js`:

- Future-event subscriptions.
- One-shot historical range queries.
- Continuous SDK callbacks.
- One-shot buffered interval callbacks.
- Derived events can be ingested from a callback.

Not implemented:

- Historical replay followed atomically by live delivery.
- Durable siphon definitions or cursors.
- Acknowledgement, retry, backpressure, or dead-letter behavior.
- Execution claims, leases, failover, or concurrency control.
- Recurring windows and scheduling.
- Dirty-window detection and replay after late data.
- Stable execution IDs, causal lineage, or processor version metadata.
- Observable processor health and failure events.

## Sequencing

Milestone 1 is the immediate priority and Milestone 2 depends on it. Placement
policy, reactive execution, and SDK integration work can then advance in
parallel as their shared protocols stabilize; their numbering describes product
capabilities rather than requiring every item in one milestone to finish before
the next begins.

The read-only Thalweg Console begins during Milestone 1. Its Mesh Lab develops
alongside Milestone 2 so synchronization and isolation can be tested visibly on
real devices. See `docs/CONSOLE.md`.

## Milestone 1: Trustworthy Local Timeline

This milestone makes one daemon safe to treat as a durable source of temporal
truth. It is the prerequisite for replication.

Definition of done:

- [x] Persist daemon/private-key identity across restarts.
- [x] Replace the process-local counter with a persistent, tested HLC.
- [x] Define and test receive/merge rules for externally originated HLC values.
- [x] Integrate HLC merge atomically with an internal replicated-event ingest
  path.
- [x] Normalize accepted timestamps to fixed-width canonical UTC RFC3339Nano.
- [x] Define network-wide event identity and idempotent duplicate handling.
- [x] Add and migrate a network/event-ID secondary index.
- [x] Persist and enforce storage schema version `3`.
- [x] Advertise daemon, local protocol, and storage versions in network status.
- [x] Carry protocol version `1` on local messages and reject explicit
  mismatches.
- Add handshake/feature negotiation and remove the absent-version legacy
  fallback in a future breaking protocol.
- [x] Add sequential forward migrations for schemas 1→2→3.
- [x] Split construction, start, shutdown, and resource ownership into testable
  lifecycle operations.
- [x] Add explicit Unix socket permissions and owned-socket safety.
- [x] Add managed CLI start, live status, log inspection, daemon-mediated
  graceful stop, and race-free restart.
- [x] Add a versioned source-install record and safe `thalweg upgrade` flow
  with dirty-tree refusal, upstream fast-forward checks, atomic installation,
  and optional daemon restart.
- [x] Add a read-only `thalweg doctor` suite with stable check IDs, human/JSON
  output, actionable remedies, permission and lifecycle validation, upgrade
  readiness, and optional listener bind probes.
- [x] Add CLI/configuration support for socket and storage paths. Identity
  remains safely colocated with the selected storage root.
- Package background service registration, signed release-binary upgrades,
  and uninstallation.
- Add size limits, request deadlines, structured errors, and structured logs.
- Add socket integration tests for every action, malformed input, disconnects,
  subscription cleanup, and restarts.
- [x] Add restart tests for identity, HLC ordering, duplicate ingestion, and
  persisted queries.

Exit guarantee:

> A single node can restart without changing identity, corrupting event order,
> or accepting the same logical event as unrelated history.

## Milestone 2: Secure Multi-Network Mesh

This milestone makes Thalweg useful across devices while allowing one physical
device to belong to home, work, and other networks simultaneously.

Definition of done:

- [x] Model physical device identity separately from per-network membership.
- [x] Create, join, and inspect credentials for multiple networks.
- [x] Explicitly reissue the current version-1 shared-bearer invitation.
- Add network leave plus credential rotation and revocation.
- Replace shared-bearer invitations with expiring enrollment credentials and
  independently revocable device membership.
- [x] Give each network independent membership keys and persisted peers.
- Give each network independent placement and retention policy.
- Prevent ambient queries, subscriptions, or replication across networks.
- Define an explicit, auditable cross-network bridge contract.
- [x] Add an authenticated, bounded, and versioned remote membership handshake
  separate from trusted local IPC routing.
- [x] Add authenticated inventory and event protocol messages.
- [x] Implement opt-in LAN mDNS discovery for open enrollment offers.
- [x] Require explicit approval or denial before an enrolling peer receives the
  current membership credential.
- [x] Provide a manual-address enrollment fallback and post-approval initial
  synchronization.
- Add remote rendezvous, relay, NAT traversal, and QR pairing links.
- Add verification phrases, enrollment rate limits, and durable audit events.
- [x] Exchange bounded inventories and replicate missing events.
- [x] Deduplicate replicated events using canonical identity and envelope
  digests.
- [x] Merge clocks and events deterministically after partitions.
- Resume interrupted synchronization without restarting from the beginning.
- Expose synchronization progress, peer health, and last convergence state.
- [x] Test offline creation, reconnect, duplicate delivery, concurrent sync,
  network isolation, and multi-network membership in-process.
- [x] Test Linux VM/macOS host convergence, stable-address restoration, offline
  events, restart identity, and unshared-network rejection.

Exit guarantee:

> Authorized nodes converge on the same permitted logical history after being
> offline, without leaking events between networks.

## Milestone 3: Policy-Driven Placement and Retention

This milestone allows phones, workstations, servers, and small sensors to
participate without requiring identical storage behavior.

Definition of done:

- Define replication policies by network, stream, device capability, and age.
- Define retention and TTL policies without hard-coding archival device roles.
- Ensure at least one eligible replica retains data promised as durable.
- Represent large media as metadata plus content-addressed blob references.
- Define blob availability, authorization, verification, and garbage collection.
- Allow constrained nodes to discover or retrieve history they do not retain.
- Surface retention decisions and replica availability operationally.
- Test archival, constrained, and intermittently connected node topologies.

Exit guarantee:

> The network behaves like one history while each device stores only the data
> allowed and required by policy.

## Milestone 4: Durable Reactive Runtime

This milestone turns siphons from connection-scoped callbacks into dependable
reactive computations.

Definition of done:

- Store versioned siphon definitions and durable consumer cursors.
- Support historical replay followed by live delivery without an event gap.
- Define acknowledgement, retry, timeout, cancellation, and backpressure
  semantics.
- Assign stable execution IDs and idempotency keys.
- Record attempt count, processor identity/version, inputs, outputs, and status.
- Attach causal lineage automatically to derived events.
- Support execution claims and leases across eligible devices.
- Define capability-aware placement without fixed coordinator nodes.
- Support recurring interval/window execution.
- Persist completed windows and detect late events entering them.
- Mark affected windows dirty and re-execute them idempotently.
- Publish processor failures and health as inspectable events or status records.
- Support explicit approval-event gates for consequential workflows.

Exit guarantee:

> A processor can stop, restart, move to another eligible device, or retry
> without silently losing work or obscuring why a derived event exists.

## Milestone 5: Integration Primitives and Developer Experience

The companion SDK owns most of this surface, with daemon support where state
must be durable.

Definition of done:

- Preserve the simple `ingest`, `query`, and fluent `siphon` path.
- Add batch ingestion with partial-failure and idempotency semantics.
- Add catchment lifecycle primitives for cancellation, health, checkpoints, and
  graceful shutdown.
- Allow sinks to use durable siphons and acknowledged cursors.
- Expose source provenance and causal metadata without requiring hand-built
  envelopes.
- Provide typed schema/version hooks for streams.
- Provide standard event and blob-reference conventions for integrations.
- Make registration, replay, checkpoint, and processing failures observable.
- Publish supported runtime, packaging, compatibility, and upgrade policies.
- Provide local inspection tooling for networks, peers, streams, siphons,
  executions, failures, and replication state.

Exit guarantee:

> An integration author implements source- or destination-specific logic while
> Thalweg supplies the event, lifecycle, durability, and observability machinery.

## Parallel Track: Thalweg Console and Mesh Lab

The Console is the local operator surface; Mesh Lab is an explicitly enabled
development harness. Their detailed product and security specification lives in
`docs/CONSOLE.md`.

### Console 0: Local Observer

- [x] Run a local sidecar and browser UI on each development device.
- [x] Provide a Bubble Tea TUI over the same observer model.
- [x] Show daemon availability, identity, addresses, versions, memberships,
  stream summaries, and feature support.
- [x] Browse a bounded recent diagnostic event window.
- Add a live local subscription and cursor-based event pagination.
- [x] Keep the default surface read-only and the web sidecar bound to loopback.
- [x] Export a redacted snapshot diagnostics bundle.

### Mesh Lab 1: Two-Device Test Harness

- Require explicit lab-mode startup and a dedicated test network.
- Copy peer addresses and perform a confirmed manual dial.
- Publish deterministic synthetic test events.
- Guide online, offline, reconnect, restart, and isolation scenarios.
- Report expected, seen, missing, and duplicated event IDs.
- Export comparable test reports from both devices.

### Console 1: Read-Only Mesh Dashboard

- Show multiple network memberships without merging their data.
- Visualize peer topology and connection state per network.
- Show synchronization progress, convergence, stream statistics, retention, and
  replica availability.
- Surface protocol incompatibility and network-isolation failures.

### Console 2: Processing Observability

- Inspect catchments, durable siphons, cursors, executions, retries, and dirty
  windows.
- Navigate from derived events to causal inputs and processor executions.
- Display processor health and failure history.

Console 0 can begin during Milestone 1. Mesh Lab 1 is part of the development
and acceptance strategy for Milestone 2. Console 1 is required before the
multi-device use cases are considered operationally testable. State-changing
administrative controls remain deferred until an authorization and audit model
is designed.

## Use-Case Readiness: Personal Capture and Assistance

### First Useful Pilot

A single trusted always-on daemon can support an early pilot after Milestone 1
and the first SDK reliability work:

- An external wake-word/audio integration records and transcribes speech.
- The integration ingests typed transcript events.
- A local siphon archives or interprets those transcripts.
- Derived notes, tasks, or assistant interpretations return as events.

This pilot is useful for validating schemas and interaction design, but it does
not yet satisfy decentralized multi-device synchronization.

### Multi-Device Personal MVP

Required before relying on the intended personal topology:

- Milestone 1 complete.
- Milestone 2 complete for secure home-network synchronization.
- Basic policy from Milestone 3 for audio blobs and constrained devices.
- Durable replay, cursor, idempotency, and lineage portions of Milestone 4.
- Catchment checkpoints, batch ingestion, and observable failures from
  Milestone 5.
- Mesh Lab acceptance passes on the intended devices and Console 1 exposes
  synchronization and replica health.

MVP acceptance scenario:

1. A phone records a thought while disconnected.
2. It later joins the home network and publishes audio metadata/transcription.
3. A capable workstation processes the event through an at-least-once,
   idempotent execution.
4. An archival node stores the transcript permanently.
5. Another assistant-capable device receives the derived event and proposes an
   action.
6. Every authorized node converges, and the causal chain is inspectable.

## Use-Case Readiness: Distributed-System Debugging

### First Useful Pilot

After Milestone 1, external collectors can send errors from a VPS, API, and
local development environment into one trusted daemon. A local SDK siphon can
triage incoming errors and emit classification events.

This validates event schemas, correlation, and agent behavior, but it still
depends on a central reachable daemon and should not be treated as a secure
production mesh.

### Production-Capable Debugging MVP

Required before relying on Thalweg across production systems:

- Milestone 1 complete.
- Milestone 2 complete, including authenticated peers and work/personal network
  isolation.
- Durable replay, execution identity, retries, backpressure, and lineage from
  Milestone 4.
- Batch ingestion, source checkpoints, processor health, and failure visibility
  from Milestone 5.
- Operational limits and redaction policies for high-volume or sensitive logs.
- Mesh Lab network-isolation acceptance passes between work and test networks,
  and Console 1 exposes synchronization health.

MVP acceptance scenario:

1. Mobile, API, database, and VPS collectors publish correlated operational
   events while independently connected or temporarily offline.
2. A work-network node synchronizes those events to the developer workstation.
3. A durable triage siphon claims the incident and records its evidence.
4. The processor emits `error:false_positive`, `incident:escalated`, or
   `fix:proposed` with causal lineage.
5. Consequential deployment requires an approval event.
6. Deployment and verification results re-enter the same incident history.
7. No production payload becomes visible to the device's personal network
   unless an explicit bridge transforms and authorizes it.

## Later Product Work

- CRDT-managed shared basin taxonomy.
- Compute bidding and richer capability scheduling.
- Administrative policy distribution.
- Backup, restore, export, and disaster recovery.
- Schema registries and compatibility tooling.
- Metrics, tracing, audit views, and incident reconstruction.
- Noeko handoff conventions for semantically durable knowledge.
- Reference integrations maintained outside the core repositories.
