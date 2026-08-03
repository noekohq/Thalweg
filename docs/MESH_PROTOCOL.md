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
anyone who obtains one can authenticate as a member. Rotation, revocation, and
expiry are not implemented yet. A local node may leave a network, but that does
not invalidate credentials held elsewhere.

The local `network_invite` action may reissue an invitation from a mounted
membership so operators do not need to archive invitation strings. In version
`1`, reissuing returns the same underlying shared credential and is not a
security rotation or newly scoped grant.

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

The daemon periodically reconnects, reauthenticates, and synchronizes each
scoped peer. Failures use bounded exponential backoff, and the latest attempt,
success, error, retry time, and synchronization result are persisted for
operator inspection. A plain physical libp2p connection is never treated as
network authorization, and an unauthenticated address is never enrolled in the
retry loop.

## Inventory and Event Synchronization

Synchronization continues on the authenticated stream and has message version
`1`. It is bidirectional and inventory-first:

1. The initiator offers sorted pages of `{id, digest}` entries.
2. The responder reports missing IDs and quarantined same-ID digest conflicts.
3. The initiator pushes only missing envelopes.
4. The initiator pages through the responder inventory and requests its missing
   envelopes.
5. Received envelopes enter the atomic replicated-event ingest boundary.

Digests are SHA-256 over the canonical immutable envelope. A network/event ID
with different content is reported but does not block unrelated transfers.
Conflict observations are persisted locally for operator inspection.

A `preserve-both` resolution is represented by a normal immutable event on the
reserved `system:conflict_resolution` stream. Resolved nodes omit the poisoned
original ID from inventories and advertise deterministic recovered copies of
every locally held variant. A receiving node validates the resolution event,
materializes its own variant, and then converges through the existing inventory
protocol. This adds no privileged remote mutation frame and does not overwrite
stored envelopes. See `CONFLICTS.md`.

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
- Inventory pages walk the network/event-ID secondary index directly. Cursors
  are opaque positions in that index; progress remains session-local.
- Events whose encoded page exceeds 1 MiB cannot synchronize.
- A page is applied event-by-event rather than as one batch transaction.
- IDs inserted before an active cursor position wait until the next session.
- There is no live fanout, rate limiting, durable synchronization cursor, or
  proof that a previously successful peer remains converged between polling
  attempts.
- Background retries are sequential and use the last known address; address
  discovery and multi-address selection are not yet implemented for mounted
  peers.

## Enrollment

Prospective members cannot use this authenticated mesh protocol. The separate
`/thalweg/enrollment/1.0.0` protocol discovers time-bounded offers and waits for
explicit approval before transferring a membership credential. Once mounted,
the joining daemon returns to this mesh protocol for its initial sync. See
`ENROLLMENT.md`.
