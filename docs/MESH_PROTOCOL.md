# Remote Mesh Protocol

## Current Scope

The daemon implements `/thalweg/mesh/1.0.0` to authenticate and synchronize one
logical-network membership over an encrypted, peer-authenticated libp2p stream.

Physical identity and logical membership are separate:

- Libp2p proves which physical peer ID is connected.
- A network-specific HMAC challenge proves both devices hold the same
  logical-network credential.
- Authorization applies only to that network. A home proof cannot authorize
  work traffic.

## Membership Credentials

Each mounted membership contains a name, a public random 16-byte network ID, and
a random 32-byte secret, encoded as unpadded base64url. Secrets are stored in
`storage/memberships.json` with mode `0600`.

Invitations use `thalweg1:` followed by base64url-encoded JSON containing the
credential and invitation version `1`. Invitations are bearer credentials:
anyone who obtains one can authenticate as a member. Rotation, revocation,
expiry, and network leave are not implemented yet.

## Handshake

The initiator sends a newline-delimited `hello` containing protocol version `1`,
network name and ID, a fresh 32-byte nonce, and an HMAC-SHA256 proof. Its proof
covers length-prefixed:

```text
"initiator", networkId, initiatorPeerId, responderPeerId, initiatorNonce
```

After verification, the responder sends `welcome` with `accepted: true`, the
network ID, a fresh responder nonce, and a proof covering:

```text
"responder", networkId, initiatorPeerId, responderPeerId,
initiatorNonce, responderNonce
```

Both peer IDs bind proofs to the authenticated libp2p identities. The fresh
responder nonce prevents an old welcome from authenticating a new handshake.
Proof comparison is constant-time. Membership secrets are never transmitted.

Rejected handshakes expose only generic authentication failures except for an
explicit protocol-version incompatibility.

## Framing and Limits

- Each message is one JSON object followed by a newline.
- Unknown JSON fields are rejected.
- Frames are limited to 16 KiB.
- Handshakes have a five-second stream deadline.
- Remote mesh versioning is independent of local IPC versioning.

## Persisted Peers

Successful `mesh_dial` calls persist a network-scoped peer:

```text
mesh-peer-v1:{networkB64}:{peerId}
```

Startup reconnects and reauthenticates each scoped peer. A plain physical
libp2p connection is never treated as network authorization.

## Inventory and Event Synchronization

Synchronization continues on the authenticated stream and has message version
`1`. It is bidirectional and inventory-first:

1. The initiator offers sorted pages of `{id, digest}` entries.
2. The responder reports missing IDs and same-ID digest conflicts.
3. The initiator pushes only missing envelopes.
4. The initiator pages through the responder inventory and requests its missing
   envelopes.
5. Received envelopes enter the atomic replicated-event ingest boundary.

Digests are SHA-256 over the canonical immutable envelope. A network/event ID
with different content stops synchronization rather than being mistaken for
convergence.

Current bounds:

- 64 inventory entries per normal page; 128 is the hard maximum.
- 1 MiB maximum synchronization frame.
- 30-second synchronization deadline.
- Strict unknown-field rejection.
- Every frame repeats the authenticated public network ID.
- Every transferred event must match the authenticated network name.

Closing a stream mid-transfer is safe. A later sync compares inventory again
and transfers only events still missing.

## Current Limitations

- Inventory cursors are session-local and not persisted.
- Building a page queries and sorts full network history in memory, so wire
  usage is bounded but database work is not incremental.
- Events whose encoded page exceeds 1 MiB cannot synchronize.
- A page is applied event-by-event rather than as one batch transaction.
- IDs inserted lexically before an active cursor wait until the next session.
- There is no live fanout, rate limiting, peer-health model, or periodic
  background retry beyond startup restoration.
