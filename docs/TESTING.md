# Testing and Lima Acceptance

Last exercised: 2026-08-03

## Repeatable event and replication smoke tests

The lab commands remove hand-authored IDs and JSON from the common two-device
loop. First choose a unique run ID and start the receiver on device B:

```bash
thalweg lab watch \
  --network home \
  --run-id smoke-20260803-1 \
  --origin DEVICE_A_ID \
  --expected 3 \
  --wait 2m
```

Then publish on device A:

```bash
thalweg lab publish \
  --network home \
  --run-id smoke-20260803-1 \
  --count 3 \
  --data '{"scenario":"device-a-to-device-b"}'
```

The watch exits as soon as the connected peer receives the whole run through
event-triggered synchronization. It reports the observer, attempts, wait time,
expected/seen/missing sequences, duplicates, unexpected sequences, and a
cross-device wall-clock upper bound. Save the JSON output directly when a test
artifact is useful:

```bash
thalweg lab watch ... > device-b-online.json
```

Use `lab verify` for a non-blocking snapshot, or after an explicit
`thalweg peer sync` when testing forced recovery:

```bash
thalweg lab verify \
  --network home \
  --run-id RUN_ID \
  --origin ORIGIN_DEVICE_ID \
  --expected 3
```

`complete: true` and an exit status of zero mean every expected sequence exists
exactly once on that replica and no unexpected sequence was found. Missing or
invalid sequence coverage is printed and returns a non-zero status.
Use the same `--run-id` when retrying publication so event-ID idempotency is
tested rather than creating a second run.

For interactive testing, `thalweg console web --network home --lab` exposes the
same bounded Event Workbench. The ordinary Console remains read-only.

### Acceptance scenarios

Run each direction by exchanging the publisher and watcher devices:

1. **Online:** start `lab watch`, then `lab publish`; expect completion within
   the interactive latency target.
2. **Offline recovery:** stop the receiving daemon, publish, restart it, then
   start `lab watch` for that run; expect anti-entropy recovery without
   duplicates.
3. **Origin restart:** publish a run, restart the publishing daemon immediately,
   and verify the receiver still converges.
4. **Receiver restart:** start a run while the receiver is stopped, restart it,
   and verify convergence.
5. **Network isolation:** publish the same run label to two different logical
   networks with different origins, then verify each network only observes its
   own run. Use unique run IDs if both networks share an origin device.

Use a new run ID for every scenario. Reuse that ID only to deliberately test
idempotent publication.

## Automated Verification

Run from the monorepo root:

```bash
go test -race ./...
go test -count=10 ./core/daemon
go vet ./...
```

The root-package suite includes config permission/idempotency tests and fake
Unix-socket integration tests for native CLI provisioning, event ingestion,
network invitation input/reissue, mesh synchronization, and daemon error
propagation. It also covers doctor JSON/failure semantics against live and
misconfigured nodes, source-upgrade checks, dirty-checkout refusal, and
installer execution.

Installer smoke test:

```bash
install_root="$(mktemp -d)"
THALWEG_INSTALL_DIR="$install_root/bin" \
THALWEG_INSTALL_RECORD_PATH="$install_root/install.json" \
  ./scripts/install.sh
"$install_root/bin/thalweg" upgrade --check
```

Short fuzz campaigns:

```bash
go test ./core/daemon -run '^$' \
  -fuzz '^FuzzDecodeNetworkInvitation$' -fuzztime=3s
go test ./core/daemon -run '^$' \
  -fuzz '^FuzzReadBoundedSyncFrame$' -fuzztime=3s
go test ./core/daemon -run '^$' \
  -fuzz '^FuzzNormalizeReplicatedEvent$' -fuzztime=3s
```

The synchronization suite covers:

- Multiple inventory pages in both directions.
- Exact replay without event retransmission.
- Same-ID/different-envelope conflict detection.
- Conflict observation persistence, lossless preserve-both resolution,
  recovered-variant convergence, and restart survival.
- Interrupted partial delivery followed by convergence.
- Simultaneous sessions initiated by both peers.
- Oversized page rejection without partial delivery.
- Explicit cross-network frame rejection.
- Home/work isolation on the same physical pair.

The enrollment suite covers:

- Active offers visible through a manual peer query.
- Expired offers omitted.
- Denial without mounting credentials.
- Approval followed by credential mounting and authenticated initial sync.
- Explicit shared-secret transfer only after approval.

Run the SDK checks from the monorepo root:

```bash
bun run --cwd packages/sdk-js build
bun --cwd packages/sdk-js test --rerun-each 10
```

The normal all-component entry points are `make check`, `make test`, and
`make build`.

## Host/VM Topology

The acceptance run used:

- macOS ARM64 host.
- Linux ARM64 Lima `playground` guest.
- Independent filesystems, identities, Badger databases, clocks, Unix sockets,
  kernels, and process lifecycles.
- Lima TCP forwarding from guest listeners to host localhost.

Build binaries:

```bash
go build -o /tmp/thalweg-darwin-arm64 ./cmd/thalweg
env GOOS=linux GOARCH=arm64 CGO_ENABLED=0 \
  go build -o /tmp/thalweg-linux-arm64 ./cmd/thalweg
limactl copy /tmp/thalweg-linux-arm64 \
  playground:/tmp/thalweg-linux-arm64
```

Use stable distinct ports. The guest listener is forwarded to the same host
localhost port by Lima:

```bash
/tmp/thalweg-darwin-arm64 spawn \
  --storage /tmp/thalweg-host/storage/badger \
  --socket /tmp/thalweg-host.sock \
  --p2p-listen /ip4/127.0.0.1/tcp/42421

limactl shell playground -- \
  /tmp/thalweg-linux-arm64 spawn \
  --storage /tmp/thalweg-vm/storage/badger \
  --socket /tmp/thalweg-vm.sock \
  --p2p-listen /ip4/0.0.0.0/tcp/42422
```

Create a dedicated lab membership on one daemon, join its invitation on the
other, and ingest distinct IDs on both. From the host, call `mesh_sync` with:

```text
/ip4/127.0.0.1/tcp/42422/p2p/{guestPeerId}
```

## Acceptance Results

The host/VM run verified:

- Three host and two guest events converged to the same five-event history with
  preserved origin identities.
- A second sync transferred zero events.
- Host and guest identities survived restarts.
- A guest event created while the host was offline arrived automatically when
  the host restarted and restored its peer.
- A host-only network event never appeared in the guest.
- The guest rejected a synchronization attempt for a network it had not joined.
- Stable configured ports allowed persisted-peer restoration.
- A Linux guest publication woke the macOS `lab watch` verifier and converged
  all three deterministic events with no missing, duplicate, or unexpected
  sequences.

The schema-4 durable runtime was also exercised against a disposable real
daemon: the transcript reference worker replayed one pre-existing transcript,
stored an idempotent derived note, acknowledged cursor `1`, and reported no
pending batch.

The VM run found and drove fixes for:

1. Empty queries encoded as `null`; they now encode as `[]`.
2. Random libp2p ports made persisted addresses stale; socket, storage, and p2p
   listen addresses are now configurable.

## Environmental Detail

The Lima guest address (`192.168.5.x` in this run) was not directly routable
from the host. Its TCP listener was reachable through Lima localhost
forwarding. Setup tooling should distinguish advertised guest addresses from
host-reachable forwarded addresses.
