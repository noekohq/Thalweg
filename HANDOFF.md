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
- `src/demo/velotic.ts`: end-to-end timeline example.
- `docs/SDK.md`: intended and current API semantics.

## Verify

```bash
bun install
bun run build
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

- There is no automated test suite.
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

Implement the "Reliable Public API" milestone in `docs/ROADMAP.md` in parallel
with the daemon's restart-safe local timeline milestone. Begin with tests around
the current behavior before changing the fluent API.

Coordinate every wire-contract change with `noekohq/Thalweg`. The daemon owns
event semantics; this repository owns TypeScript ergonomics and type safety.
