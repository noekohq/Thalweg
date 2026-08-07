# Thalweg SDK Handoff

Last reviewed: 2026-08-02

## Current State

This repository contains a working typed SDK prototype for the local Thalweg
daemon. It can ingest and query events, subscribe to future events, perform a
one-shot interval lookback, write derived events, and create/poll/ack named
durable consumers.

The companion daemon lives at the monorepo root.

Important entry points:

- `src/index.ts`: public types, client class, and siphon builder.
- `src/client.ts`: Unix socket transport and request/subscription routing.
- `test/client.test.ts`: request framing and protocol incompatibility tests.
- `src/demo/velotic.ts`: end-to-end timeline example.
- `docs/SDK.md`: intended and current API semantics.

## Verify

```bash
bun install
bun run build
bun test
```

From the monorepo root, start the daemon:

```bash
go run ./cmd/thalweg spawn
```

Then run:

```bash
bun run demo:velotic
```

Expected output: activity and note events followed by one derived summary in
chronological order.

## Known Technical Debt

- Runtime coverage includes protocol framing, incompatibility, malformed data,
  timeouts, membership mapping, and core builder safety. Compile-time generic
  tests and full continuous-delivery coverage remain missing.
- `tail()` is a type-preserving no-op at runtime.
- `interval()` runs only once.
- `retrospective` is unused.
- Low-level durable siphon methods expose persisted receipt cursors,
  at-least-once batches, bounded wakeups, and restart retry. The fluent builder
  does not yet compile or manage that worker loop, and there is no execution
  record, lease, or retry schedule.
- Requests time out, but abort-signal cancellation, reconnect, and subscription
  restoration are not implemented.
- Runtime basin membership must duplicate the compile-time basin definition.
- `query()` returns a broad payload union.
- Package exports and supported runtime policy are not explicit.

## Recommended Next Work

Continue the "Reliable Public API" milestone in `docs/ROADMAP.md`. Network
membership creation, joining, redacted listing, and authenticated mesh dialing
have typed wrappers. Shared-credential invitation reissue is exposed through
`inviteNetwork()` with an explicit `credentialMode`. `syncMeshPeer()` also
exposes manual bidirectional convergence and transfer counts. Approval-based
enrollment has typed open, discover, request, decide, and close wrappers. Add
broader fluent API coverage before expanding these operations further.

The SDK now also exposes `leaveNetwork()`, `listMeshPeers()`, and structured
`ThalwegDaemonError` values. Peer status represents the daemon's latest
persisted observation; it is not a continuous convergence guarantee.

Coordinate every wire-contract change with the root Go implementation. The
daemon owns event semantics; this package owns TypeScript ergonomics and type
safety.
