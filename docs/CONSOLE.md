# Thalweg Console and Mesh Lab Specification

Last reviewed: 2026-08-03

## Purpose

Thalweg needs a visible local operator surface before its peer-to-peer behavior
becomes complex. The product should make it easy to answer:

- Is my local daemon healthy?
- Which networks does this device belong to?
- Which peers are connected or behind?
- What streams and recent events exist locally?
- Is an event created on one device reaching another?
- Did two devices converge after being disconnected?
- Is any information crossing a network boundary unexpectedly?

The proposed product is **Thalweg Console**, a local dashboard with an optional
development-only **Mesh Lab**.

- Console is read-only by default and observes the local daemon.
- Mesh Lab performs a small, explicit set of test operations such as dialing a
  peer and publishing synthetic events into a dedicated test network.
- General daemon administration and arbitrary automation are deferred.

This can eventually become a packaged desktop application. The first version
should optimize for running the same code on two MacBooks during development.

## Current Implementation

Console 0 now has one shared Go observer model and two frontend options:

```text
Bubble Tea TUI ─┐
                ├─ shared read-only snapshot ─ documented daemon IPC
Browser GUI ────┘
```

- `thalweg console` or `thalweg console tui` launches the terminal interface.
- `thalweg console web` launches the local browser sidecar.
- Both show daemon availability, identity, versions, memberships, addresses,
  remembered peer health, recent-window stream summaries, durable siphon
  cursors/pending work, events, feature support, and explicit prototype
  limitations.
- The TUI refreshes automatically, retains a fixed node/network header, scrolls
  with `j`/`k`, and changes networks with left/right.
- The browser sidecar binds only to loopback, generates a randomized session
  URL, adds restrictive response headers, treats payloads as inert text, and
  exports the current snapshot as diagnostics JSON with event payloads
  redacted.
- Adapter, offline/degraded-state, TUI rendering, loopback enforcement, token
  routing, method restriction, and diagnostics tests are automated.
- Both frontends use a restrained Nord-inspired dark palette. The browser view
  is built with React and Mantine, using Mantine's layout, controls, cards,
  alerts, and tables with a small Nord theme override. Its production assets
  are compiled into the Go binary and do not depend on a runtime CDN.

The browser source lives in `apps/console-web`. After editing it, run
`bun run --cwd apps/console-web check` and
`bun run --cwd apps/console-web build`; the build writes the embedded
production assets to `internal/console/web/assets`.

The browser source and SDK are independent workspaces in the monorepo while the
TUI and web sidecar continue to share one Go IPC adapter and presentation model.

Not yet implemented from Console 0:

- Live subscription/tail in either frontend.
- Cursor-based pagination. The bounded diagnostic query now explicitly requests
  newest-first results.
- Daemon uptime, storage aggregates, topology edges, active page-level
  synchronization progress, or a durable lag model. Peer rows expose the last
  completed sync result and retry health without claiming continuous
  convergence.
- Guided multi-step Mesh Lab scenarios. The explicitly enabled Event Workbench
  can publish and verify deterministic generic test runs, but it does not yet
  orchestrate peer sync, partitions, or comparison reports automatically.

## Goals

- Make the current local daemon inspectable without reading BadgerDB or logs.
- Provide a repeatable two-device synchronization acceptance test.
- Show network isolation and multi-network membership clearly.
- Browse events without pretending to be a full observability or analytics UI.
- Surface protocol versions, errors, degraded state, and incomplete features.
- Reuse the SDK and public daemon contracts instead of accessing storage
  directly.
- Produce a diagnostics bundle that can accompany bug reports.

## Non-Goals

The first version is not:

- A remote cloud dashboard.
- A production log analytics replacement.
- A general-purpose event editor.
- A topology configuration or policy-authoring system.
- A secrets, network-membership, or key-management UI.
- A place to execute arbitrary shell commands or agent tools.
- An integration marketplace.

## Product Shape

### Console Mode

Console mode is the default. It may invoke only documented read operations
against the local daemon.

It displays:

- Daemon health, identity, version, uptime, and local storage summary.
- Network memberships and their synchronization state.
- Connected, known, and recently disconnected peers.
- Peer addresses, last contact, lag, and protocol compatibility.
- Stream names, local event counts, latest event time, and retention summary.
- A chronological recent-event viewer with network, stream, time, device, and
  payload filters.
- Durable siphon, catchment, and execution health when those features exist.
- Explicit warnings for prototype or degraded behavior.

### Mesh Lab Mode

Mesh Lab is visually distinct and disabled unless explicitly enabled when
starting the app. It is restricted to a dedicated test network by default.

It may:

- Display and copy the local peer address.
- Dial a peer after explicit confirmation.
- Publish typed synthetic events.
- Open a live subscription and show received test events.
- Run a guided online, offline, reconnect, and convergence test.
- Verify known test event IDs and report seen, missing, duplicated, or
  unexpectedly cross-network events.
- Export a test-run report.

Mesh Lab must not expose an arbitrary daemon action form. Its supported
operations are fixed, labeled, and auditable.

The first delivered slice is the Event Workbench. `thalweg console web --lab`
enables bounded publish and verify operations using the versioned
`thalweg.mesh_test.v1` payload. Without `--lab`, those HTTP operations return
404. The same workflow is available headlessly through `thalweg lab publish`
and `thalweg lab verify`.

## Initial Deployment Architecture

Browsers cannot safely or directly communicate with a Unix domain socket. The
initial Console should therefore use a small local sidecar:

```text
Browser on 127.0.0.1
        |
        | local HTTP + WebSocket/SSE
        v
Thalweg Console sidecar
        |
        | public SDK / documented IPC
        v
/tmp/thalweg.sock
        |
        v
Local Thalweg daemon
```

Recommended first implementation:

- A small Bun/TypeScript process serves a static single-page application.
- The sidecar uses `thalweg-js` or a thin typed administration client.
- It listens on `127.0.0.1` only, never all interfaces by default.
- It converts daemon subscription pushes into a browser event stream.
- It stores no authoritative Thalweg state.
- Each MacBook runs its own daemon, sidecar, and local browser.

The current Go sidecar preserves these security and deployment properties while
also supplying the Bubble Tea frontend from the same observer model.

The Console remains an independent application workspace even while its assets
are packaged into the daemon binary. It must not become the only way to operate
Thalweg.

Packaging as a signed desktop application may follow after the web development
loop and contracts stabilize.

## Security Boundary

- The sidecar binds to loopback only unless a future authenticated remote mode
  is explicitly designed.
- Startup prints a randomized local session URL or requires a session token for
  browser requests.
- State-changing Mesh Lab endpoints require both lab-mode startup and explicit
  interaction.
- Console mode cannot silently upgrade itself into an administrative session.
- Payload display treats all event content as untrusted data.
- Payloads are rendered as text/structured JSON and never interpreted as HTML.
- Network selection is explicit and persistent in the visible page header.
- Events from different networks are never merged into one unlabeled view.
- Diagnostics exports redact keys, tokens, raw private keys, and sensitive
  filesystem paths.
- Future remote access requires a separate authentication and authorization
  design; binding the initial sidecar to a LAN address is unsupported.

## Information Architecture

### 1. Overview

The landing page should answer whether the local node is working.

Required cards:

- Daemon state: online, degraded, incompatible, or offline.
- Device identity and whether it is restart-stable.
- Daemon and protocol versions.
- Number of mounted networks.
- Connected/known peer counts.
- Latest local ingestion and synchronization times.
- Local event and storage counts when available.
- Active subscription/siphon failures when available.

Prototype limitations should appear as visible warnings rather than being
hidden. Older or incompatible daemons that do not advertise restart-stable
identity should be labeled “ephemeral identity.”

### 2. Networks

The network page lists each local membership independently:

- Network name and stable network ID.
- Membership/device identity.
- Connected and known peers.
- Last synchronization time and convergence status.
- Local retention and replication policy summary.
- Stream and event counts.
- Any authorization, version, or isolation warning.

The daemon now exposes redacted network enumeration through `network_list`.
Console views should use those stable `{name, id}` memberships rather than a
free-form network field.

### 3. Topology

The topology page provides both a graph and an accessible table.

Nodes represent devices. Edges represent current peer connections, not assumed
event flow. Selecting a node shows:

- Peer/device ID.
- Addresses.
- Connection state and direction.
- Shared network.
- Last contact.
- Protocol version.
- Synchronization cursor/lag.
- Retention capability summary.

Each network is viewed separately. A device present in home and work appears in
both isolated views; the visualization must not imply an event bridge between
them.

### 4. Streams and Events

The stream list shows:

- Stream name and schema version when known.
- Local event count.
- Earliest and latest locally retained event.
- Origin-device count.
- Retention summary.

The event viewer supports:

- Required network scope.
- Stream selection.
- Occurrence-time range.
- Origin device.
- Event ID.
- Live-tail toggle.
- Expandable envelope and JSON payload.
- Causal input and execution links when lineage exists.

The first version may use existing `event_query` and `siphon_register` actions.
Large histories require pagination/cursors before the viewer is considered
production-safe.

### 5. Processing

This page appears as durable execution features are implemented:

- Catchments and their checkpoint/health state.
- Durable siphons and current cursors.
- Running, succeeded, retrying, failed, and dirty executions.
- Input and derived-event lineage.
- Failure details and next retry.

The initial version should show “not supported by this daemon” rather than fake
or infer this state.

### 6. Mesh Lab

The lab page contains:

- Test network selector, defaulting to `thalweg-lab`.
- Local identity and copyable peer addresses.
- Explicit peer dial form.
- Synthetic event composer using the fixed test schema.
- Live received-event ledger.
- Guided test runner.
- Per-run results and export.

Synthetic events use a reserved test stream such as `system:mesh_test` with a
payload equivalent to:

```json
{
  "runId": "run_...",
  "originDeviceId": "device_...",
  "sequence": 1,
  "message": "MacBook A online event",
  "sentAt": "2026-07-30T12:00:00.000Z"
}
```

Event IDs should be deterministic within a run:

```text
mesh-test:{runId}:{originDeviceId}:{sequence}
```

This intentionally exercises daemon idempotency and duplicate handling.

### 7. Diagnostics

The diagnostics page and export include:

- Console, SDK, daemon, storage-schema, and protocol versions.
- Local device identity and redacted addresses.
- Network IDs and peer states without secrets.
- Recent structured daemon errors.
- Synchronization status.
- The selected Mesh Lab run manifest and results.
- Host platform and timestamps.

## Two-MacBook Acceptance Workflow

The Mesh Lab should guide the user through this sequence and retain a result for
each step:

1. Start a daemon and Console on both MacBooks.
2. Confirm each Console is talking to its own local daemon.
3. Create or select the dedicated `thalweg-lab` network.
4. Copy MacBook A's peer address and connect MacBook B.
5. Confirm that both topology views show the expected peer.
6. Publish three deterministic events on A.
7. Confirm that B receives all three with unchanged IDs and payloads.
8. Disconnect B from A while B's local daemon and Console remain available.
9. Publish two events on A and two events on B while partitioned.
10. Reconnect the devices.
11. Confirm both devices contain the complete seven-event run exactly once.
12. Restart one daemon and confirm identity, history, and convergence survive.
13. Publish an event in a second test network on one device.
14. Confirm the other network neither displays nor synchronizes that event.
15. Export diagnostics from both devices.

The current daemon can now exercise manual cross-device convergence, partial
transfer recovery, restart-triggered synchronization, and network isolation.
Local publication now triggers a coalesced mesh sync, so the lab should first
observe near-immediate arrival. It should retain explicit `mesh_sync` as a
forced-recovery step and distinguish low delivery latency from window
completeness guarantees.

## Required Daemon Read Contracts

Existing actions that the first prototype can reuse:

- `network_status`
- `network_list`
- `mesh_peer_list`
- `event_query`
- `siphon_register`
- `siphon_unregister`

Mesh Lab also uses these existing state-changing actions:

- `event_ingest`
- `p2p_dial`
- `network_create`
- `network_join`
- `mesh_dial`
- `mesh_sync`

The dashboard will eventually require additional versioned, paginated read
contracts for:

- Daemon version, uptime, resource health, and storage summary.
- Per-network status beyond the existing membership list.
- Rich connection details and topology edges beyond the known-peer list.
- Synchronization cursors, active progress, lag, and stronger convergence
  evidence beyond the persisted last result.
- Stream list and aggregate statistics.
- Retention/replica availability.
- Durable siphons, catchments, executions, checkpoints, and failures.

These should be daemon APIs, not logic that reads Badger keys or parses log
output. Read responses should include an explicit support/version marker so an
older daemon produces an understandable unavailable state.

## Delivery Stages

### Console 0: Local Observer

Can begin during the trustworthy-local-timeline milestone.

- Sidecar and browser shell.
- Daemon online/offline status.
- Current `network_status` display.
- Advertised daemon, local protocol, and storage schema versions.
- Actionable protocol-mismatch state from versioned local responses.
- Manually selected logical network.
- Recent event query and live local tail.
- Protocol/feature availability display.
- Read-only diagnostics export.

### Mesh Lab 1: Manual Two-Node Harness

Develop alongside the secure-mesh milestone.

- Explicit lab-mode startup.
- Address copy and manual dial.
- [x] Deterministic synthetic event generation through CLI and browser.
- Live run ledger.
- Guided online and partition-recovery workflow.
- [x] Expected/seen/missing sequence verification on the local replica.
- Cross-device duplicate comparison and combined reporting.
- Test report export.

### Console 1: Read-Only Mesh Dashboard

Required for considering the multi-device MVP operationally testable.

- Multiple network memberships.
- Per-network topology graph and peer table.
- Sync progress and convergence state.
- Stream statistics and paginated event inspection.
- Retention/replica visibility.
- Compatibility and network-isolation warnings.

### Console 2: Processing Observability

Develop with the durable reactive runtime.

- Catchment, siphon, cursor, execution, retry, and dirty-window views.
- Causal lineage navigation.
- Processor health and failure inspection.

### Later: Guarded Operations

Potential future operations include peer removal, network invitations, policy
changes, replay requests, retry/cancel, and approval events. Each requires an
authorization model, confirmation design, and audit event before it enters the
Console. General arbitrary command execution remains out of scope.

## Acceptance Criteria for the Initial Console

- Runs locally on both supported MacBooks from documented commands.
- Connects only to the local daemon through public contracts.
- Never binds a network-accessible interface by default.
- Clearly distinguishes unsupported, unavailable, degraded, and empty states.
- Shows the selected network on every event and topology view.
- Can observe local ingestion and live subscription behavior.
- Mesh Lab cannot be entered unless explicitly enabled.
- Test events cannot silently target a non-test network.
- Produces a redacted diagnostics export.
- Has automated tests for its daemon adapter and security-sensitive routing.
