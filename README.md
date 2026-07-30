# Thalweg

Thalweg is a local-first chronological event mesh. The current MVP focuses on
one local daemon that stores immutable typed events, serves range queries, and
pushes live tail events to SDK siphons over a Unix socket.

## MVP Surface

- `event_ingest`: append an event to a network and stream.
- `event_query`: query events by network, streams, and time range.
- `siphon_register`: subscribe to future events for a network and stream set.
- `siphon_unregister`: stop a live subscription.
- `network_status`: return local daemon identity and p2p addresses.

Events are stored in BadgerDB with tri-temporal fields:

- `occurredAt`: when the event happened.
- `insertedAt`: when this daemon accepted the event.
- `propagatedAt`: when this daemon propagated/surfaced the event.

## Run

```bash
go run . spawn
```

The daemon listens on `/tmp/thalweg.sock` and stores data in `./storage/badger`.

## Simple Velotic Demo

In another shell:

```bash
cd ../thalweg-js
bun run demo:velotic
```

The demo ingests `system:app_activity` and `user:note` events, runs a buffered
timeline siphon, emits a deterministic `insights:summary`, and prints the merged
chronological timeline.

## Deferred

The MVP intentionally defers p2p event replication, WebSocket transport, Noeko
handoff, real local model inference, CRDT basin state, TTL policy, and dirty
window recomputation.

## Documentation

- [Product specification](SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Event data model](docs/DATA_MODEL.md)
- [Local IPC protocol](docs/PROTOCOL.md)
- [Roadmap](docs/ROADMAP.md)
- [Agent guide](AGENTS.md)
- [Current handoff](HANDOFF.md)

The companion TypeScript SDK is maintained separately at
https://github.com/noekohq/thalweg-js.
