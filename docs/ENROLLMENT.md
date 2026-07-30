# Discovery and Enrollment Protocol

Last reviewed: 2026-07-30

## Purpose

Enrollment is separate from ordinary mesh authentication. Discovery may reveal
that a peer is accepting requests, but it never grants network membership.

Device 1 explicitly opens a time-bounded offer:

```bash
thalweg network listen home
```

Device 2 discovers offers and requests access:

```bash
thalweg join
```

Device 1 must approve or deny the request in the listening CLI. Only approval
causes the current version-1 shared membership credential to cross the
peer-authenticated, encrypted libp2p connection. Device 2 mounts the membership
and immediately performs an authenticated initial synchronization.

## LAN Discovery

While enrollment is open, the daemon starts libp2p mDNS using
`_thalweg._udp`. mDNS advertises physical peer addresses and identity, not
network credentials. A joining daemon discovers peers and queries the
versioned enrollment protocol for active offers.

Discovery is LAN-only. VPNs often do not carry multicast, and private addresses
are not reachable over the public internet. Remote enrollment currently uses
the manual `--address` fallback and therefore requires an already reachable
public, VPN, overlay, forwarded, or relay address.

## Manual Fallback

The listening CLI prints each non-loopback peer address as:

```bash
thalweg join --address /ip4/192.168.1.20/tcp/42422/p2p/12D3...
```

This queries the remote peer for active offers; the address itself contains no
membership secret.

## Remote Protocol

The encrypted libp2p protocol is:

```text
/thalweg/enrollment/1.0.0
```

It accepts bounded, strict newline-delimited JSON frames:

- `query` returns active `{id, network, expiresAt}` offers.
- `request` names one offer and supplies a display-only device name.
- `decision` returns denial or, after local approval, the invitation.

The remote peer ID comes from the authenticated libp2p connection and is never
trusted from request JSON. Frames are capped at 64 KiB. Offers expire after at
most one hour. Requests also end when the offer expires or the daemon stops.

## Current Credential Boundary

The enrollment flow fixes accidental credential disclosure during discovery
and requires explicit approval. It does not yet fix the version-1 shared-secret
membership model: every approved device receives the same bearer credential.
Per-device certificates, independent revocation, invitation rotation,
verification phrases, request rate limits, and audit events remain required.

## Debugging

Run a daemon with structured debug logs:

```bash
thalweg daemon -d --debug
```

For one connection attempt:

```bash
thalweg peer dial --debug --network home --address MULTIADDR
thalweg peer sync --debug --network home --address MULTIADDR
thalweg join --debug
```

Debug mesh operations first perform a raw TCP probe and then report the
libp2p/authentication stage. Thalweg disables libp2p TCP source-port reuse
because two default-port macOS nodes could otherwise fail a libp2p dial even
when a normal TCP probe succeeds. TCP hole punching is not implemented yet.
