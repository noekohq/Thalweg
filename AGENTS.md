# Thalweg TypeScript SDK Agent Guide

This repository contains the TypeScript developer interface for Thalweg. It
owns typed ingestion, queries, basin definitions, siphon builders, and local
daemon communication. The Go daemon lives separately at
https://github.com/noekohq/Thalweg.

## Start Here

Read these documents before changing public behavior:

1. `README.md` - install/run example.
2. `docs/SDK.md` - public API and current runtime semantics.
3. `docs/PROTOCOL.md` - daemon transport and message handling.
4. `docs/ROADMAP.md` - implemented scope and next milestones.
5. `HANDOFF.md` - current caveats and recommended next work.

The daemon's canonical event/storage semantics are documented in:

- https://github.com/noekohq/Thalweg/blob/master/docs/DATA_MODEL.md
- https://github.com/noekohq/Thalweg/blob/master/docs/PROTOCOL.md

## Repository Responsibility

This repository is authoritative for:

- TypeScript stream/payload inference.
- The public `Thalweg` client API.
- Basin and siphon builder type transitions.
- SDK connection management and daemon request correlation.
- JavaScript runtime ergonomics, cancellation, and error delivery.

It is not authoritative for:

- Event ordering or HLC algorithms.
- Persistence, TTL, or storage keys.
- P2P synchronization.
- Noeko schemas or Velotic UI behavior.

## Development Commands

```bash
bun install
bun run build
bun test
bun run demo:velotic
```

The demo requires a daemon running from the companion Go repository:

```bash
go run . spawn
```

## Current Public Concepts

- `Thalweg<Payloads, Basins>` binds stream names to payload types.
- `ingest()` and `query()` communicate with the daemon.
- `createNetwork()`, `inviteNetwork()`, `joinNetwork()`, and `listNetworks()`
  manage mounted memberships without exposing stored secrets through list
  results.
- `dialMeshPeer()` authenticates one explicitly selected network.
- `syncMeshPeer()` performs bounded bidirectional synchronization for one
  explicitly selected network.
- Enrollment APIs open time-bounded offers, discover candidates, inspect and
  decide pending requests, and join only after approval.
- `siphon()` starts from all streams.
- `basin(name).siphon()` starts from a runtime basin stream list.
- `include()` and `omit()` narrow callback types.
- `interval()` changes callback data from one event to stream-keyed arrays.
- Continuous `run()` returns a handle whose `stop()` unregisters the siphon.

## Current Prototype Boundaries

- `tail()` does not currently alter runtime behavior.
- `interval()` performs one lookback query; it is not recurring.
- `SiphonIntervalOptions.retrospective` is not used.
- Buffered failures are launched from `void` and are not exposed on the handle.
- Basin definitions must be supplied at runtime as the constructor's second
  argument; generic types alone do not exist at runtime.
- Automated coverage includes request framing, protocol mismatch behavior, and
  membership API mapping; the public builder API remains untested.
- Reconnection, request timeouts, backpressure, and callback error handling are
  incomplete.

## Change Discipline

- Treat exported types and fluent call order as public API.
- Add compile-time type tests for every generic transition.
- Keep runtime behavior aligned with inferred callback types.
- Coordinate action names and payload fields with `noekohq/Thalweg`.
- Update `docs/SDK.md` and `docs/PROTOCOL.md` with public changes.
- Do not embed daemon ordering/storage assumptions in the SDK.
