# Thalweg CLI and Local Installation

Last reviewed: 2026-07-30

## Purpose

The Go binary is both the daemon and its local operator CLI. Application code
should still use `thalweg-js` or the documented IPC protocol, while humans and
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
register a system service.

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
| P2P listener | `/ip4/0.0.0.0/tcp/42422` |

The config file is written with mode `0600` and its directory with mode `0700`.
The storage contains the private device identity and mounted membership
credentials and should be treated as sensitive.

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

Detached startup waits up to five seconds for `network_status` to succeed,
prints the child PID, and appends stdout/stderr to
`~/.local/share/thalweg/storage/daemon.log` by default. The log is created with
mode `0600`. Select another path with:

```bash
thalweg daemon -d --log /path/to/thalweg.log
```

Add `--debug` in either foreground or detached mode to emit structured
connection, discovery, enrollment, authentication, and synchronization traces.
`thalweg status` preserves the complete flat `addresses` list and also reports
`addressGroups` with `loopback`, `lan`, `public`, and `other` buckets.

This is process detachment, not full service supervision: automatic login
startup, restart-on-failure, upgrades, and uninstallation are still deferred.
Use the printed PID with `kill PID` for a graceful SIGTERM shutdown.

`thalweg start` is an alias with the same foreground and `-d` behavior. For
development in a checkout, `go run . spawn` preserves the original relative
`./storage/badger` behavior.

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
  --limit 100
```

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
To converge both histories:

```bash
thalweg peer sync \
  --network home \
  --address /ip4/192.168.1.20/tcp/42422/p2p/12D3...
```

The response reports `pushed`, `pulled`, `duplicates`, and inventory counts.
Run it a second time; a converged pair should report zero pushed and pulled
events.

Continuous live fanout and periodic retry are not implemented. Run `peer sync`
after new events or reconnection. A remembered peer is also synchronized when
the daemon starts and its stable address is reachable.

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

Both interfaces are read-only. They use `network_status`, `network_list`, and
`event_query` over the public daemon socket; they never read BadgerDB,
membership files, or logs directly. Diagnostics exports redact event payloads.
Recent events are currently limited to the first 100 events in a 24-hour
diagnostic window because cursor-based dashboard queries are not implemented.

## Configuration precedence

Client and daemon commands resolve values in this order:

1. Command flags where available.
2. `THALWEG_SOCKET_PATH`, `THALWEG_STORAGE_PATH`, and
   `THALWEG_P2P_LISTEN_ADDRS`.
3. The initialized config file.
4. Built-in defaults.

Set `THALWEG_CONFIG_PATH` to select a separate config. This is useful for
running isolated personal and work nodes locally, though one physical daemon
can already mount multiple isolated logical networks.

## Command summary

```text
thalweg init
thalweg daemon [-d] [--log PATH]
thalweg status
thalweg network create NAME
thalweg network invite NAME
thalweg network listen NAME
thalweg network join [INVITATION]
thalweg join [--address MULTIADDR] [--debug]
thalweg network list
thalweg console [tui] [--network NAME]
thalweg console web [--network NAME] [--listen 127.0.0.1:42424]
thalweg event ingest --network NAME --stream NAME --payload JSON
thalweg event query --network NAME
thalweg peer dial --network NAME --address MULTIADDR
thalweg peer sync --network NAME --address MULTIADDR
thalweg version
```

All action results are printed as formatted JSON so they remain readable and
scriptable.
