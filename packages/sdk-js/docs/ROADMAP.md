# Thalweg TypeScript SDK Roadmap

Last reviewed: 2026-08-02

## SDK Role

The SDK is the typed developer and integration interface to the Thalweg event
fabric. It should keep simple ingestion and siphon workflows concise while
providing reusable lifecycle, checkpoint, provenance, durability, and failure
primitives for production integrations.

Source-specific behavior remains outside the SDK. Thalweg should not implement
audio capture, transcription, SSH access, Supabase collection, model execution,
or permanent knowledge storage directly.

The canonical system milestones and use-case readiness gates live in the
monorepo root at `../../../docs/ROADMAP.md`.

## API Direction

Preserve the current fluent style:

```ts
await thalweg.ingest("user:note", note);

thalweg
  .siphon()
  .include(["user:note"])
  .run(handleNote);
```

Operational behavior should compose without making the simple path noisy:

```ts
thalweg
  .siphon()
  .include(["production:error"])
  .tail("15m")
  .durable("error-triage")
  .retry({ attempts: 3 })
  .run(triageError);
```

Fluent calls should ultimately produce a declarative, versioned execution plan.
The daemon should provide durable distributed execution rather than requiring a
JavaScript process to emulate it with queries and callbacks.

## Current Implementation

Implemented:

- `Thalweg<Payloads, Basins>` binds stream names to payload types.
- Typed `ingest()` and chronological `query()`.
- Lazy Unix-socket connection, request correlation, and protocol-version
  enforcement.
- Typed `networkStatus()`.
- Typed network creation, explicit shared-credential invitation reissue,
  invitation joining, redacted membership listing, and authenticated
  network-scoped mesh dialing.
- Typed manual bidirectional mesh synchronization with transfer counts.
- Typed time-bounded enrollment offers, LAN/manual discovery, pending-request
  decisions, and approved join with initial synchronization.
- Automated transport tests for framing, incompatibility, and membership API
  request mapping.
- Runtime basin definitions.
- `siphon()`, `include()`, and `omit()` builder transitions.
- Continuous future-event callbacks.
- One-shot buffered lookback callbacks through `interval()`.
- Derived ingestion through callback context.
- Continuous handles expose registration readiness, processor completion or
  failure, and can unregister their subscription.
- Requests have a configurable timeout and malformed daemon JSON fails pending
  work without escaping the socket parser.
- Runtime basin definitions are required and all-stream `omit()` fails safely
  instead of silently broadening scope.
- Runtime coverage includes transport failures and core siphon safety behavior.

Prototype limitations:

- Compile-time generic transitions and continuous delivery still need broader
  coverage.
- `tail()` records configuration but has no runtime effect.
- `interval()` executes once and is not scheduled.
- `retrospective` is unused.
- Buffered all-stream results do not guarantee empty arrays for absent streams.
- Subscription registration has no replay boundary and can miss history.
- There is no abort-signal cancellation, reconnect, or resubscription.
- Subscription callbacks have no durable backpressure or replay semantics.
- Query return types do not narrow to the requested streams.
- Package exports and supported Node/Bun versions are not explicit.
- Peer topology and synchronization progress do not have daemon read models yet.

## Milestone A: Reliable Public API

Definition of done:

- Add runtime tests for client framing, correlation, disconnects, parse errors,
  subscription delivery, cancellation, and cleanup.
- Add compile-time type tests for every fluent generic transition.
- [x] Make `run()` startup observable through a ready promise.
- [x] Expose registration, buffered callback, and continuous callback failures.
- [x] Add request timeouts.
- Add abort-signal cancellation.
- Define reconnect and subscription restoration behavior.
- [x] Parse malformed messages without crashing the process.
- [x] Reject unsafe all-stream `omit()` calls until a runtime stream catalog
  exists.
- [x] Reject missing runtime basin definitions instead of broadening to all
  streams.
- Guarantee buffered result keys for the declared active stream set.
- Narrow `query()` results based on selected streams.
- Publish explicit package exports and supported Node/Bun versions.
- Add daemon/SDK protocol compatibility tests.

Exit guarantee:

> Current local SDK operations have observable startup, completion, and failure
> behavior and their runtime results match their inferred types.

## Milestone B: Producer and Catchment Primitives

Definition of done:

- Add typed batch ingestion aligned with daemon idempotency semantics.
- Support source identity, schema version, and provenance metadata.
- Define a catchment lifecycle context with cancellation and graceful shutdown.
- Provide durable source checkpoints/cursors where the daemon owns persistence.
- Expose health, heartbeat, and last-success state.
- Make checkpoint advancement atomic with the documented ingestion guarantee.
- Provide standard typed blob-reference helpers for large external media.
- Support explicit network selection without weakening per-network isolation.

Illustrative direction:

```ts
thalweg
  .catchment("production-logs")
  .checkpointed()
  .run(async (ctx) => {
    const page = await externalSource.readAfter(ctx.checkpoint);
    await ctx.ingestBatch(page.events);
    await ctx.commitCheckpoint(page.cursor);
  });
```

The exact API remains to be designed alongside the daemon checkpoint and batch
contracts.

Exit guarantee:

> Catchment authors implement source access and normalization while the SDK
> provides lifecycle, typed ingestion, checkpoint, health, and provenance
> behavior.

## Milestone C: Durable Siphons and Sinks

Definition of done:

- Make `tail(duration)` perform historical replay and transition to live events
  without a gap.
- Compile durable builder state into a versioned daemon-side siphon definition.
- Add durable names, cursors, acknowledgements, and cancellation.
- Add retry, timeout, concurrency, and backpressure configuration.
- Expose execution ID, attempt, input lineage, and processor version in context.
- Automatically attach causal lineage to `ctx.ingest()` derived events.
- Support recurring interval/window execution.
- Define alignment, boundary, timezone, and retrospective behavior.
- Expose dirty-window re-execution and stable idempotency context.
- Allow an external destination to act as a sink through a durable,
  acknowledged siphon rather than a separate opaque framework.

Illustrative direction:

```ts
thalweg
  .siphon()
  .include(["voice:transcript"])
  .durable("transcript-archive")
  .run(async (ctx, event) => {
    await archive.store(event);
    await ctx.ack();
  });
```

Exit guarantee:

> An integration can restart or move between eligible devices without silently
> losing work, replaying unbounded history, or hiding why it produced an event.

## Milestone D: Multi-Network and Operational Experience

Definition of done:

- Provide typed read models needed by the local Thalweg Console without exposing
  raw IPC envelopes.
- [x] Inspect all daemon network memberships without merging their data planes.
- Keep every query, ingestion, basin, and siphon explicitly network-scoped.
- [x] Support creating and joining multiple local memberships.
- [x] Reissue the current shared-bearer invitation without requiring
  applications to persist invitation strings.
- [x] Leave a local network explicitly without exposing stored credentials.
- Replace shared-bearer invitations with expiring enrollment credentials and
  per-device revocation.
- Support conveniently selecting a configured client for each mounted network.
- [x] Expose remembered peer and last-synchronization health.
- Expose retention, replica availability, active progress, and durable lag.
- Represent explicit cross-network bridge configuration without ambient access.
- Provide inspection APIs or CLI support for siphons, executions, retries,
  checkpoints, failures, and causal chains.
- [x] Expose machine-readable daemon error codes and retryability hints.
- Add handshake/feature negotiation and richer compatibility categories.

Exit guarantee:

> One application process can intentionally work with home and professional
> networks while maintaining visible, testable isolation.

## Thalweg Console Support

The Console and Mesh Lab are separate applications specified in
`../../../docs/CONSOLE.md`. The SDK should make them ordinary public-contract
consumers rather than privileged storage readers.

SDK deliverables:

- Typed daemon, protocol, feature-support, network, peer, stream, and
  synchronization status models.
- Paginated/cursor-based event inspection.
- A cancellable live event stream suitable for forwarding to a local browser.
- Explicit unsupported-feature results for older daemons.
- Stable error categories for offline, incompatible, unauthorized, and degraded
  states.
- Mesh Lab helpers for deterministic test-event ingestion only if they also
  benefit other integration tests; UI-specific state stays in the Console.

The initial Console may use a Bun/TypeScript sidecar bound to `127.0.0.1`.
Browser transport, session-token handling, UI state, topology rendering, and
diagnostics presentation are Console responsibilities rather than SDK API.

## Use-Case SDK Readiness

### Personal Capture Pilot

Requires Milestone A plus basic batch ingestion and catchment cancellation from
Milestone B. It can initially target one always-on daemon.

The multi-device personal MVP additionally requires durable tail/cursors and
lineage from Milestone C plus the daemon's secure multi-network mesh.

### Distributed Debugging Pilot

Requires Milestone A plus batch ingestion, source checkpoints, provenance, and
health reporting from Milestone B.

Production-capable agent triage additionally requires retry, backpressure,
durable execution, causal lineage, and operational inspection from Milestones C
and D.

## Integration Ecosystem

After the primitives stabilize, reference integrations can live in separate
packages or repositories:

- Voice recording and transcription.
- Filesystem and application activity.
- SSH/journald and structured log collection.
- Supabase/Postgres changes and errors.
- HTTP/API health and trace collection.
- Permanent transcript or telemetry archives.
- Agent processors and approval workflows.
- Noeko semantic handoff.

Reference integrations should validate the core primitives, not become required
dependencies of the SDK.
