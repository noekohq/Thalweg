# Daemon Roadmap

## Completed MVP Slice

- Badger-backed immutable event ingestion.
- Tri-temporal event envelope.
- Network/stream/range queries with deterministic merged ordering.
- Unix socket request/response protocol.
- In-memory future-event subscriptions.
- Manual libp2p dialing and remembered peer addresses.
- Unit coverage for ordering, range filtering, and invalid timestamps.
- End-to-end demonstration through `thalweg-js`.

## Next Milestone: Restart-Safe Local Timeline

Definition of done:

- Persist a private libp2p key so `deviceId` survives restarts.
- Replace the in-memory counter with a tested, persistent HLC implementation.
- Normalize all stored timestamps to canonical UTC RFC3339Nano.
- Define idempotency and reject/reconcile duplicate event IDs.
- Split daemon lifecycle into testable start, shutdown, and resource ownership.
- Add socket integration tests for every action and subscription cleanup.
- Add explicit protocol and storage schema versions.
- Add structured logging and actionable daemon errors.

The local timeline should be trustworthy across restarts before adding sync.

## Following Milestone: Real Siphon Scheduling

- Historical tail replay followed by live delivery.
- Recurring interval/window execution contracts.
- Persisted window execution records and idempotency keys.
- Dirty-window detection when late events enter completed ranges.
- Re-execution and derived-event replacement policy.
- Backpressure, cancellation, and failure reporting.

## P2P Milestone

- Per-network persistent identity and cryptographic membership.
- mDNS discovery on local networks.
- Versioned event replication protocol.
- Deduplication and deterministic HLC merge.
- Partition recovery and bounded synchronization.
- Retention/TTL negotiation for asymmetric nodes.
- CRDT-backed basin taxonomy.

## Later Integrations

- Catchment library and binary media references.
- Compute bidding/delegation.
- Local model execution.
- Noeko semantic handoff.
- Operational tooling, metrics, and network inspection.

