# Thalweg CLI and Local Installation

Last reviewed: 2026-08-03

## Purpose

The Go binary is both the daemon and its local operator CLI. Application code
should still use `packages/sdk-js` or the documented IPC protocol, while humans and
setup automation can provision and inspect a node without writing an SDK
script.

The CLI is deliberately a thin client over the same public Unix-socket actions.
It does not read BadgerDB, private identities, or membership files directly.

## Install

Thalweg currently installs from a source checkout and requires Go:

```bash
cd Thalweg
./scripts/install.sh
```

The default destination is `~/.local/bin/thalweg`. Choose another destination
without modifying the script:

```bash
THALWEG_INSTALL_DIR=/usr/local/bin ./scripts/install.sh
```

The second form may require the directory to already be writable. The installer
does not invoke `sudo`, edit `PATH`, change shell files, initialize storage, or
register a system service. If the installation directory is not already in
`PATH`, the completion message prints a copy-pasteable `export PATH=...`
command, notes that the same line belongs in the user's shell profile for
future terminals, and then shows the appropriate next step. The installer
reports whether it performed a first install, an update, or a same-version
reinstall. If the device configuration already exists, it preserves and
reports that path and suggests `thalweg daemon restart` instead of
initialization.

The installer also writes a restricted source-channel record to
`~/.local/share/thalweg/install.json`. It records the checkout, installed
binary, source commit, and whether the build contained local changes. After the
first install, each device can upgrade with:

```bash
thalweg upgrade
```

The command requires Git and Go. It refuses a dirty or divergent checkout,
fetches the branch's configured upstream, permits only a fast-forward, builds
to a temporary file beside the installed binary, and atomically replaces the
binary only after a successful build. If the daemon was running, it is then
gracefully restarted with its previous debug and log settings.

Useful variants:

```bash
thalweg upgrade --check       # fetch and report without changing anything
thalweg upgrade --no-restart  # install now, restart the daemon later
thalweg upgrade --force       # rebuild the current upstream commit
```

This source channel is intended for the current development phase. The
versioned installation record includes a `channel` field so a future
release-binary channel can download signed artifacts and checksums behind the
same `thalweg upgrade` command.

## Initialize and run

Initialize one local node:

```bash
thalweg init
```

Defaults:

| Setting | Default |
| --- | --- |
| Config | `~/.config/thalweg/config.json` |
| Socket | `/tmp/thalweg.sock` |
| Storage | `~/.local/share/thalweg/storage/badger` |
| Registry | `~/.config/thalweg/registry.d` |
| P2P listener | `/ip4/0.0.0.0/tcp/42422` |

The config file is written with mode `0600` and its directory with mode `0700`.
The storage contains the private device identity and mounted membership
credentials and should be treated as sensitive.

Initialization also creates restricted `sources`, `sinks`, and `processors`
registry directories plus `~/.config/thalweg/env.d`. See
[`REGISTRY.md`](REGISTRY.md) for the YAML and child-process contracts.

To customize the node:

```bash
thalweg init \
  --socket /tmp/thalweg-work.sock \
  --storage "$HOME/.local/share/thalweg-work/storage/badger" \
  --p2p-listen /ip4/0.0.0.0/tcp/42423
```

Initialization is idempotent. Use `--force` only when intentionally replacing
the local config; it does not erase or migrate the selected storage.

Run the daemon in the foreground:

```bash
thalweg daemon
```

Or detach it:

```bash
thalweg daemon -d
```

The managed spelling starts detached by default:

```bash
thalweg daemon start
```

Use `thalweg daemon start --foreground` when a foreground process is preferred.
Detached startup waits up to five seconds for `network_status` to succeed,
prints the child PID, and appends stdout/stderr to
`~/.local/share/thalweg/storage/daemon.log` by default. The log is created with
mode `0600`. Managed process metadata is written atomically with mode `0600` to
`~/.local/share/thalweg/storage/daemon-state.json`. Select another log path
with:

```bash
thalweg daemon -d --log /path/to/thalweg.log
```

Add `--debug` in either foreground or detached mode to emit structured
connection, discovery, enrollment, authentication, and synchronization traces.
`thalweg status` preserves the complete flat `addresses` list and also reports
`addressGroups` with `loopback`, `lan`, `public`, and `other` buckets.

Manage the local process without retaining its printed PID:

```bash
thalweg daemon status
thalweg daemon logs --lines 100
thalweg daemon stop
thalweg daemon restart
```

`daemon status` combines the restricted lifecycle state with a live
`network_status` probe. `daemon stop` requests shutdown through the protected
local socket and waits for both the socket and managed process state to
disappear; it never sends a signal to a PID loaded from disk. `daemon restart`
uses that same graceful path before starting another detached process.

This is process management, not full service supervision: automatic login
startup, restart-on-failure, upgrades, and uninstallation remain deferred.

`thalweg start` is an alias with the same foreground and `-d` behavior. For
development in a checkout, `go run ./cmd/thalweg spawn` preserves the original relative
`./storage/badger` behavior.

## Diagnose a node

Run the read-only diagnostic suite:

```bash
thalweg doctor
```

It checks configuration and permissions, lifecycle state, daemon/socket
health, CLI/daemon version alignment, storage/identity/membership permissions,
p2p listener syntax and advertised reachability, installation metadata,
source-upgrade readiness, and daemon-log safety. Each warning or failure
includes an actionable remedy.

For automation, JSON output contains stable check IDs, statuses, details,
remedies, and summary counts:

```bash
thalweg doctor --json
```

The command exits `0` when there are only passing checks or warnings and exits
`1` when any check fails. JSON remains the only stdout content on failure.

Add `--debug` to show diagnostic details in the human view and, when the daemon
is stopped, briefly bind each configured p2p listener to detect port conflicts:

```bash
thalweg doctor --debug
thalweg doctor --debug --json
```

Doctor never opens BadgerDB, decodes private identity or membership contents,
changes permissions, removes stale files, fetches Git remotes, or performs
repairs.

## Provision networks

Create a network on the first device:

```bash
thalweg network create home
```

The JSON response includes a redacted membership and an invitation. The
invitation is a bearer credential. Transfer it privately and avoid placing it
directly in shell history.

There is no need to archive that output. Reissue it explicitly from any
currently joined device:

```bash
thalweg network invite home
```

The result includes `credentialMode: "shared-bearer"`. In the current
membership protocol this is the same persistent network credential, not a new
expiring or revocable token. Reissuing should therefore be deliberate, and a
suspected disclosure still requires future credential-rotation support rather
than simply running the command again.

On another initialized device:

```bash
thalweg network join
```

Paste the invitation and press Enter. For non-interactive provisioning, pipe it
over stdin:

```bash
printf '%s\n' "$THALWEG_INVITATION" | thalweg network join
```

List mounted networks:

```bash
thalweg network list
```

Leave a network on this device:

```bash
thalweg network leave --yes home
```

The confirmation is mandatory because leaving removes the local membership and
its remembered peer retry records. It does not delete locally stored events,
which remain accessible to trusted local queries that explicitly name the old
network. It does not rotate the shared credential or revoke another device.

## Approval-based joining

On an existing member:

```bash
thalweg network listen home --duration 10m
```

The command opens LAN discovery, prints manual fallback commands, displays
incoming peer identities, and asks `Allow? [y/N]`. It closes on timeout or
Ctrl-C.

On a new initialized node:

```bash
thalweg join
```

The daemon scans mDNS, lists active offers, requests approval, mounts the
credential only after approval, and performs the initial sync. When discovery
cannot cross a VPN, routed network, or the internet:

```bash
thalweg join --address /ip4/192.168.1.20/tcp/42422/p2p/12D3...
```

Add `--debug` to joining, peer dial, or peer sync for transport-stage details.
Start the daemon with `--debug` for persistent structured logs.
On macOS, an empty mDNS scan may require enabling Local Network access for the
terminal application. The listener's explicit `thalweg join --address ...`
command remains the fallback when multicast discovery is unavailable.

## Events

Ingest a JSON payload:

```bash
thalweg event ingest \
  --network home \
  --stream user:note \
  --id note-001 \
  --payload '{"content":"Remember the north pasture gate"}'
```

`--id` and `--occurred-at` are optional. Reusing an ID with equivalent content
is idempotent; reusing it with different content is an error.

Query all streams in a network:

```bash
thalweg event query --network home
```

Filter the chronological query:

```bash
thalweg event query \
  --network home \
  --streams user:note,voice:transcript \
  --from 2026-07-30T00:00:00Z \
  --to 2026-07-31T00:00:00Z \
  --limit 100 \
  --order desc
```

Inspect event-ID conflicts observed during synchronization:

```bash
thalweg event conflicts list --network home
```

Resolve a conflict without discarding either envelope:

```bash
thalweg event conflicts resolve --network home --id COLLIDED_ID
thalweg peer sync --network home --address MULTIADDR
```

The current `preserve-both` strategy emits a replicated audit event,
deterministically rekeys each immutable variant, and supersedes the collided ID
from ordinary queries and inventories. See `CONFLICTS.md`.

## Two-device synchronization

Run `thalweg status` on the target device and select its LAN-reachable address,
for example:

```text
/ip4/192.168.1.20/tcp/42422/p2p/12D3...
```

Both devices must have mounted the same logical network. From either device:

```bash
thalweg peer dial \
  --network home \
  --address /ip4/192.168.1.20/tcp/42422/p2p/12D3...
```

`peer dial` authenticates and remembers the peer but does not exchange events.
New local events trigger coalesced synchronization to remembered authorized
peers, with periodic anti-entropy as a fallback. To force convergence
immediately:

```bash
thalweg peer sync \
  --network home \
  --address /ip4/192.168.1.20/tcp/42422/p2p/12D3...
```

The response reports `pushed`, `pulled`, `duplicates`, and inventory counts.
Conflicting IDs appear in `conflicts` but do not block unrelated transfers.
Run it a second time; a converged pair should report zero pushed and pulled
events.

Inspect remembered peers and their persisted synchronization health:

```bash
thalweg peer list
thalweg peer list --network home
```

The daemon normally starts a coalesced synchronization shortly after local
ingestion. It also periodically retries remembered authorized peers. Failed
attempts use bounded exponential backoff and expose their next retry through
`peer list`. There is still no long-lived remote event stream, peer address
rediscovery, or durable page cursor, so `peer sync` remains useful when testing
or when forced convergence matters.

Every successful authenticated mesh stream now remembers both sides. After
upgrading from a build that only remembered the initiator, run one sync from
the device that already lists the peer; the responder will learn the reverse
target and both devices should then show each other in `thalweg peer list
--network NAME`.

## Console

Launch the read-only Bubble Tea console:

```bash
thalweg console
```

`thalweg console tui` is the explicit equivalent. Use left/right to select a
mounted network, `j`/`k` to scroll, `r` to refresh, and `q` to quit:

```bash
thalweg console tui --network home --refresh 2s
```

Launch the browser console:

```bash
thalweg console web
```

The command binds to `127.0.0.1:42424`, prints a randomized session URL, and
serves the same observer snapshot as the TUI. It refuses non-loopback listen
addresses. Choose another loopback port or initial network with:

```bash
thalweg console web --listen 127.0.0.1:43424 --network home
```

Both interfaces are read-only. They use `network_status`, `network_list`,
`mesh_peer_list`, and `event_query` over the public daemon socket; they never read BadgerDB,
membership files, or logs directly. Diagnostics exports redact event payloads.
Recent events are currently limited to the first 100 events in a 24-hour
diagnostic window because cursor-based dashboard queries are not implemented.

## Repeatable event testing

Publish a bounded deterministic run without hand-writing individual event IDs:

```bash
thalweg lab publish \
  --network home \
  --stream system:mesh_test \
  --count 3 \
  --message "MacBook replication smoke test" \
  --data '{"scenario":"offline-reconnect"}'
```

The command prints a manifest containing `runId`, `originDeviceId`, and every
event ID. Test payloads retain the generic JSON under `data` and add a versioned
run ID, origin, sequence, total, message, and timestamp. Event IDs are derived
from the run, origin, and sequence. Repeating with the printed `--run-id` is
therefore an idempotent retry rather than a second batch.

For a live propagation check, start a blocking watcher on the receiving device
before publishing the run:

```bash
thalweg lab watch \
  --network home \
  --run-id smoke-20260803-1 \
  --origin ORIGIN_DEVICE_ID \
  --expected 3 \
  --wait 2m
```

Then publish on the origin with the same run ID:

```bash
thalweg lab publish \
  --network home \
  --run-id smoke-20260803-1 \
  --count 3
```

`lab watch` polls the receiving daemon until the complete run is locally
visible or the deadline expires. Its report includes the observer device,
attempt count, wait time, expected and observed sequences, missing sequences,
duplicates, unexpected sequences, and a sender-timestamp-to-observation upper
bound. The latter assumes the two device clocks are reasonably aligned; HLCs
provide ordering guardrails, not precision clock synchronization.

To take an immediate snapshot rather than wait, run this on the other device:

```bash
thalweg lab verify \
  --network home \
  --run-id RUN_ID \
  --origin ORIGIN_DEVICE_ID \
  --expected 3
```

The JSON result reports the same convergence and integrity fields. An
incomplete or structurally invalid run exits non-zero, making it suitable for
shell scripts. The default stream is
`system:mesh_test`; both commands accept `--stream` when testing another
namespace.

The browser equivalent is deliberately opt-in:

```bash
thalweg console web --network home --lab
```

That session shows the Event Workbench and enables two session-token-protected,
loopback-only write endpoints. Starting Console without `--lab` does not expose
lab operations and remains read-only.

## Durable siphons

Create a named local consumer that replays existing transcript and note events:

```bash
thalweg siphon create \
  --network home \
  --streams voice:transcript,user:note \
  --start earliest \
  transcript-archive
```

Poll a bounded batch:

```bash
thalweg siphon poll --network home --limit 25 --wait 20s transcript-archive
```

The result includes a stable `deliveryId`, attempt count, cursor bounds, and
events. Process the entire batch durably, then acknowledge exactly that batch:

```bash
thalweg siphon ack \
  --network home \
  --delivery DELIVERY_ID \
  transcript-archive
```

If the processor or daemon stops before acknowledgement, the next poll returns
the same batch and increments its attempt count. Side effects must therefore be
idempotent. `--start latest` begins after events already stored on this daemon;
`earliest` is the default. Inspect definitions and pending work with:

```bash
thalweg siphon list --network home
```

This first durable slice is pull-based with one outstanding batch per name.
`--wait` provides a bounded local wakeup rather than a permanent push stream.
It does not yet provide multi-worker leases, dead letters, windows, or
watermarks.

## Declarative registry

Place strict `thalweg.dev/v1alpha1` Source, Sink, or Processor YAML definitions
under the initialized registry directory, validate them offline, and activate
the complete candidate set explicitly:

```bash
thalweg registry validate
thalweg registry reload
thalweg registry status
```

Daemon restarts use the last accepted snapshot. Editing a file does not change
running workers until reload succeeds; `status` reports `pendingReload` when
the files differ. Inspect and temporarily manage one accepted definition with:

```bash
thalweg registry inspect desktop-notes
thalweg registry stop desktop-notes
thalweg registry start desktop-notes
thalweg registry restart desktop-notes
thalweg registry logs --follow desktop-notes
```

Changing a Sink or Processor network, stream selector, or starting position
requires explicitly deleting its durable progress before reload:

```bash
thalweg registry reset --yes transcript-archive
thalweg registry reload
```

Reset is destructive only to that registry consumer's cursor and pending
delivery; it does not delete events. The complete schema, execution contract,
retry behavior, and examples are in [`REGISTRY.md`](REGISTRY.md).

## Configuration precedence

Client and daemon commands resolve values in this order:

1. Command flags where available.
2. `THALWEG_SOCKET_PATH`, `THALWEG_STORAGE_PATH`,
   `THALWEG_P2P_LISTEN_ADDRS`, and `THALWEG_REGISTRY_PATH`.
3. The initialized config file.
4. Built-in defaults.

Set `THALWEG_CONFIG_PATH` to select a separate config. This is useful for
running isolated personal and work nodes locally, though one physical daemon
can already mount multiple isolated logical networks.

## Command summary

```text
thalweg init
thalweg daemon [-d] [--log PATH]
thalweg daemon start [--foreground] [--log PATH]
thalweg daemon stop [--timeout 10s]
thalweg daemon restart [--timeout 10s] [--log PATH]
thalweg daemon status
thalweg daemon logs [--lines 100]
thalweg status
thalweg doctor [--debug] [--json]
thalweg upgrade [--check] [--no-restart] [--force]
thalweg network create NAME
thalweg network invite NAME
thalweg network listen NAME
thalweg network join [INVITATION]
thalweg join [--address MULTIADDR] [--debug]
thalweg network list
thalweg network leave --yes NAME
thalweg console [tui] [--network NAME]
thalweg console web [--network NAME] [--listen 127.0.0.1:42424]
thalweg event ingest --network NAME --stream NAME --payload JSON
thalweg event query --network NAME
thalweg event conflicts list --network NAME
thalweg event conflicts resolve --network NAME --id EVENT_ID
thalweg peer dial --network NAME --address MULTIADDR
thalweg peer sync --network NAME --address MULTIADDR
thalweg peer list [--network NAME]
thalweg lab publish --network NAME [--stream NAME] [--count 3] [--data JSON]
thalweg lab verify --network NAME --run-id ID [--origin DEVICE_ID] [--expected 3] [--wait DURATION]
thalweg lab watch --network NAME --run-id ID [--origin DEVICE_ID] [--expected 3] [--wait 2m]
thalweg siphon create --network NAME [--streams A,B] [--start earliest] SIPHON_NAME
thalweg siphon list [--network NAME]
thalweg siphon poll --network NAME [--limit 25] [--wait 20s] SIPHON_NAME
thalweg siphon ack --network NAME --delivery DELIVERY_ID SIPHON_NAME
thalweg registry validate [--json]
thalweg registry reload
thalweg registry status [--json]
thalweg registry list [--json]
thalweg registry inspect NAME
thalweg registry start|stop|restart NAME
thalweg registry reset --yes NAME
thalweg registry logs [--lines 100] [--follow] NAME
thalweg version
```

All action results are printed as formatted JSON so they remain readable and
scriptable.
