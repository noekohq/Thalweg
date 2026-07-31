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
- `propagatedAt`: when the origin daemon first propagated/surfaced the event.

## Install locally

From a checkout:

```bash
./scripts/install.sh
thalweg init
```

The installer builds the Go binary into `~/.local/bin` by default. It does not
edit shell startup files or install a background service. Set
`THALWEG_INSTALL_DIR` to select another binary directory.
When that directory is not already in `PATH`, the completion message prints an
exact `export PATH=...` command for the current shell and explains how to make
the setting persistent. It also distinguishes a first install, an update, and
a same-version reinstall. An existing device configuration is preserved and
reported instead of suggesting initialization again.

Each installation remembers its source checkout. On every device, later
updates are:

```bash
thalweg upgrade --check
thalweg upgrade
```

The source checkout must be clean and have a configured Git upstream. A
successful upgrade atomically replaces the binary and gracefully restarts a
running daemon.

Inspect the complete local setup without changing it:

```bash
thalweg doctor
thalweg doctor --json
```

`thalweg init` writes a restricted per-user configuration at
`~/.config/thalweg/config.json`, uses `/tmp/thalweg.sock`, stores durable data
under `~/.local/share/thalweg`, and configures the stable p2p listener
`/ip4/0.0.0.0/tcp/42422`.

Start the daemon in one terminal:

```bash
thalweg daemon
```

Or launch it in the background:

```bash
thalweg daemon start
```

Detached startup waits for the local socket to answer before returning and
prints the child PID and restricted log path.

Inspect and manage that process later:

```bash
thalweg daemon status
thalweg daemon logs
thalweg daemon restart
thalweg daemon stop
```

Provision and inspect it from another without an SDK script:

```bash
thalweg status
thalweg network create home
thalweg network invite home
thalweg network list
thalweg event ingest \
  --network home \
  --stream user:note \
  --payload '{"content":"Thalweg is online"}'
thalweg event query --network home
```

On another device, run `thalweg network join`, paste the invitation, and press
Enter. Then use the peer address from `thalweg status` to synchronize:

```bash
thalweg peer sync \
  --network home \
  --address /ip4/192.168.1.20/tcp/42422/p2p/PEER_ID
```

The preferred approval-based LAN flow avoids copying invitations:

```bash
# Existing member
thalweg network listen home

# Joining device
thalweg join
```

Use `thalweg join --address MULTIADDR` when multicast discovery is unavailable.
See [Discovery and enrollment](docs/ENROLLMENT.md).

Invitations are bearer credentials and should not be stored in shell history.
They can be explicitly reissued from a mounted membership with
`thalweg network invite NAME`; protocol version 1 reissues the same shared
credential rather than creating a revocable token.
See [CLI and local installation](docs/CLI.md) for all commands and the
two-device workflow.

## Local console

The same read-only dashboard is available as a Bubble Tea terminal UI or a
loopback-only browser UI:

```bash
thalweg console
thalweg console web
```

Both surfaces show daemon state, identity, versions, mounted networks,
advertised addresses, streams, recent events, capability gaps, and prototype
warnings. The web command prints a randomized local session URL and never binds
beyond loopback. See [Console and Mesh Lab](docs/CONSOLE.md).

## Development run

The source-tree-compatible command remains:

```bash
go run . spawn
```

It listens on `/tmp/thalweg.sock`, stores events in `./storage/badger`, stores
its restart-stable private identity in `./storage/identity.key`, and stores
mounted network credentials in the restricted
`./storage/memberships.json` file.

Operational paths and stable listeners can be configured:

```bash
go run . spawn \
  --socket /tmp/thalweg.sock \
  --storage ./storage/badger \
  --p2p-listen /ip4/0.0.0.0/tcp/42422
```

Equivalent environment variables are `THALWEG_SOCKET_PATH`,
`THALWEG_STORAGE_PATH`, and comma-separated `THALWEG_P2P_LISTEN_ADDRS`. A
stable listen address is required for persisted-peer restoration until
discovery exists.

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

The MVP intentionally defers continuous p2p fanout, WebSocket transport, Noeko
handoff, real local model inference, CRDT basin state, TTL policy, and dirty
window recomputation.

## Documentation

- [Product specification](SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Event data model](docs/DATA_MODEL.md)
- [Local IPC protocol](docs/PROTOCOL.md)
- [Remote mesh protocol](docs/MESH_PROTOCOL.md)
- [Testing and Lima acceptance](docs/TESTING.md)
- [CLI and local installation](docs/CLI.md)
- [Discovery and enrollment](docs/ENROLLMENT.md)
- [Roadmap](docs/ROADMAP.md)
- [Console and Mesh Lab specification](docs/CONSOLE.md)
- [Agent guide](AGENTS.md)
- [Current handoff](HANDOFF.md)

The companion TypeScript SDK is maintained separately at
https://github.com/noekohq/thalweg-js.
