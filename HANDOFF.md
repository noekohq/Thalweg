# Thalweg SDK Handoff

Last reviewed: 2026-07-30

## Current State

This repository contains a working typed SDK prototype for the local Thalweg
daemon. It can ingest and query events, subscribe to future events, perform a
one-shot interval lookback, and write derived events.

The companion daemon is https://github.com/noekohq/Thalweg.

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

Start the companion daemon:

```bash
go run . spawn
```

Then run:

```bash
bun run demo:velotic
```

Expected output: activity and note events followed by one derived summary in
chronological order.

## Known Technical Debt

- Runtime coverage includes protocol framing, incompatibility, and membership
  API mapping; there are no builder or compile-time generic tests.
- `tail()` is a type-preserving no-op at runtime.
- `interval()` runs only once.
- `retrospective` is unused.
- Buffered execution errors are not returned to the caller.
- No request timeout, reconnect, or subscription restoration exists.
- Subscription callback rejections are not observed.
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

Coordinate every wire-contract change with `noekohq/Thalweg`. The daemon owns
event semantics; this repository owns TypeScript ergonomics and type safety.
