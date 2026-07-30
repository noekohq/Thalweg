# SDK Roadmap

## Completed MVP Slice

- Typed event payload map.
- Typed ingestion and chronological queries.
- Unix socket request correlation.
- Continuous future-event subscriptions.
- Buffered one-shot lookback queries.
- Basin runtime definitions.
- `include()` and `omit()` type narrowing.
- Derived event ingestion from callback context.
- Simple Velotic timeline demonstration.

## Next Milestone: Reliable Public API

Definition of done:

- Add runtime and compile-time tests for all exported behavior.
- Make `run()` startup observable so registration/query failures reach callers.
- Add request timeouts and cancellation.
- Handle socket parse errors without crashing the process.
- Define reconnect and subscription restoration behavior.
- Make `tail(duration)` replay history and transition cleanly to live delivery.
- Resolve runtime behavior for `omit()` when the initial stream set means "all."
- Improve `query()` return inference based on selected streams.
- Publish explicit package exports and supported Node/Bun runtime versions.

## Following Milestone: Real Buffered Siphons

- Define interval alignment, boundaries, timezone, and retrospective semantics.
- Support recurring execution instead of one-shot lookback.
- Carry stable window/execution identifiers.
- Expose callback failures, retries, and cancellation.
- Coordinate dirty-window replay with the daemon.
- Add derived-event lineage and idempotency options.

## Catchments and Integrations

- Define a catchment lifecycle API.
- Add polling, webhook, and local-observer helpers.
- Normalize source timestamps and provenance.
- Support filesystem/CID references for large media.
- Build Velotic integrations as examples without coupling them to SDK internals.

## Later Distributed Behavior

The SDK should expose network health and compute work ergonomically, but HLC,
replication, peer membership, and storage policy remain daemon concerns.
