# Local IPC Protocol

## Transport

The MVP listens on `/tmp/thalweg.sock`. Each message is one JSON object followed
by a newline. Multiple requests may share a connection.

Requests:

```json
{"id":"req_1","protocolVersion":1,"action":"event_query","payload":{}}
```

Responses:

```json
{"id":"req_1","protocolVersion":1,"success":true,"data":{}}
```

Errors:

```json
{"id":"req_1","protocolVersion":1,"success":false,"error":"network is required"}
```

Subscription pushes are not responses and have no request `id`:

```json
{
  "type": "event",
  "protocolVersion": 1,
  "subscriptionId": "sub_1234",
  "event": {}
}
```

## Actions

### `event_ingest`

Payload:

```json
{
  "network": "personal",
  "stream": "user:note",
  "occurredAt": "2026-07-30T12:00:00.000Z",
  "eventId": "optional-producer-id",
  "payload": {"content": "Example"}
}
```

`network` and `stream` are required. `occurredAt` and `eventId` are optional.
The response data is the stored event envelope. Accepted timestamps are
normalized to UTC RFC3339Nano with nine fractional digits.

`eventId` is unique within the selected network. Repeating an equivalent request
returns the original stored envelope without storing or publishing another
event. Reusing the ID with a different stream, supplied occurrence time, or
payload returns an error. JSON payload whitespace and object-key ordering do not
affect equivalence.

### `event_query`

Payload:

```json
{
  "network": "personal",
  "streams": ["user:note", "system:app_activity"],
  "from": "2026-07-30T00:00:00.000Z",
  "to": "2026-07-31T00:00:00.000Z",
  "limit": 100,
  "order": "desc"
}
```

`network` is required. An absent or empty `streams` array means all streams in
the network. `from` and `to` are inclusive. A zero `limit` is unlimited and a
negative limit is rejected. `order` is `asc` by default and may be `desc`.
Query bounds may use any valid RFC3339/RFC3339Nano offset or fractional
precision. Results contain canonical UTC timestamps. The limit is applied after
the requested chronological ordering, so `desc` with a limit returns the newest
matching events.

Resolved collision originals are omitted from ordinary queries. Their
immutable recovered variants and `system:conflict_resolution` audit event are
returned normally.

### `event_conflict_list`

Payload:

```json
{"network":"home"}
```

Returns conflicts observed during authenticated inventory comparison. Each
record includes the event ID, local and remote digests, first observation time,
resolution state, and recovered local event ID when resolved. An empty result
is `[]`.

### `event_conflict_resolve`

Payload:

```json
{
  "network":"home",
  "eventId":"collided-id",
  "strategy":"preserve-both"
}
```

The event must have a persisted conflict observation. `preserve-both` is the
only supported strategy. The daemon emits an immutable resolution audit event
and deterministically materializes the local variant under a recovered ID. It
does not overwrite or delete the collided event. Repeating an already resolved
operation is idempotent and reports `alreadyResolved: true`.

The exact `system:conflict_resolution` stream is reserved from public
`event_ingest`; authenticated replicas validate its versioned payload before
applying it. See `docs/CONFLICTS.md`.

### `siphon_register`

Payload:

```json
{"network":"personal","streams":["user:note"]}
```

Returns:

```json
{"subscriptionId":"sub_1234"}
```

An empty stream list subscribes to all future events in the network.
Subscriptions are in memory and tied to the socket connection. Delivery uses a
bounded per-subscription queue; a client that cannot keep up is disconnected
instead of blocking ingestion for other producers.

### `siphon_unregister`

Payload:

```json
{"subscriptionId":"sub_1234"}
```

Returns `{"removed":true}` even if the identifier was not present.

### `daemon_shutdown`

Payload may be `{}`. Returns:

```json
{"stopping":true}
```

After sending the response, the daemon gracefully closes subscriptions,
clients, discovery, libp2p, BadgerDB, and its owned Unix socket. This action is
available only through the local `0600` Unix socket and is used by
`thalweg daemon stop` and `thalweg daemon restart`.

### `network_status`

Payload may be `{}`. Returns:

```json
{
  "peerId": "12D3...",
  "deviceId": "12D3...",
  "addresses": ["/ip4/127.0.0.1/tcp/1234/p2p/12D3..."],
  "addressGroups": {
    "loopback": ["/ip4/127.0.0.1/tcp/1234/p2p/12D3..."],
    "lan": [],
    "public": [],
    "other": []
  },
  "daemonVersion": "0.1.0-dev",
  "protocolVersion": 1,
  "storageSchemaVersion": 3,
  "meshProtocolVersion": 1,
  "membershipFileVersion": 1
}
```

`protocolVersion` advertises the local IPC shape for diagnostics and matches the
version carried by local messages. `addresses` remains the complete,
backward-compatible list. `addressGroups` classifies each address by likely
reachability so an operator can select a LAN or public manual fallback rather
than a loopback address.

### `network_create`

Payload:

```json
{"name":"home"}
```

Creates and mounts a network membership. Returns:

```json
{
  "membership":{"name":"home","id":"PUBLIC_BASE64URL_ID"},
  "invitation":"thalweg1:..."
}
```

The invitation contains the network membership secret. Treat it as a
credential and transfer it out of band only to devices that should join the
network.

### `network_join`

Payload:

```json
{"invitation":"thalweg1:..."}
```

Returns the redacted membership plus `joined: true`. Joining the same invitation
again is idempotent and returns `joined: false`. Different credentials under an
already-mounted name are rejected.

### `network_invite`

Payload:

```json
{"name":"home"}
```

Explicitly reissues an invitation for an already-mounted network:

```json
{
  "membership":{"name":"home","id":"PUBLIC_BASE64URL_ID"},
  "invitation":"thalweg1:...",
  "credentialMode":"shared-bearer"
}
```

This action is intentionally separate from redacted network listing. In
membership protocol version `1`, it deterministically re-encodes the persisted
shared network secret; it does not create a new, expiring, one-time, or
revocable enrollment credential. The invitation must be handled as a secret.
An unknown network name is rejected.

### `network_list`

Payload may be `{}`. Returns mounted `{name, id}` records sorted by name.
Membership secrets and invitations are never returned.

### Enrollment actions

Enrollment actions back the approval-based `network listen` / `join` flow. See
`docs/ENROLLMENT.md` for the remote protocol and security boundary.

- `enrollment_listen`: `{network, durationSeconds, debug?}` opens a time-bounded
  offer and returns `{offer, addresses}`.
- `enrollment_close`: `{offerId}` closes an offer.
- `enrollment_requests`: `{network}` returns pending redacted request records.
- `enrollment_approve`: `{requestId}` approves one pending request.
- `enrollment_deny`: `{requestId}` denies one pending request.
- `enrollment_discover`: `{targetAddr?, waitMillis?, debug?}` scans mDNS or
  queries one manual peer and returns enrollment candidates.
- `enrollment_join`: `{targetAddr, offerId, deviceName, debug?}` waits for the
  remote decision, mounts approved membership, synchronizes, and persists the
  peer.

No discovery or pending-request response contains membership secrets.
`enrollment_join` does not return the invitation; only the mounted redacted
membership and synchronization result reach the local client.

### `p2p_dial`

Payload:

```json
{"target_addr":"/ip4/127.0.0.1/tcp/1234/p2p/PEER_ID"}
```

Connects to the peer and persists its multiaddress. This does not synchronize
events or authorize the peer for any logical network. It remains a legacy
physical-connectivity diagnostic.

### `mesh_dial`

Payload:

```json
{
  "targetAddr":"/ip4/127.0.0.1/tcp/1234/p2p/PEER_ID",
  "network":"home"
}
```

Connects to the peer, performs the remote membership handshake for exactly one
mounted network, and persists the peer under that network only after mutual
authentication succeeds. Returns the peer ID, redacted network membership, and
`authorized: true`. This does not exchange events yet; see `MESH_PROTOCOL.md`.

### `mesh_sync`

Payload matches `mesh_dial`:

```json
{
  "targetAddr":"/ip4/127.0.0.1/tcp/42422/p2p/PEER_ID",
  "network":"home"
}
```

After authenticating the selected network, both peers exchange bounded
event-ID/digest inventory pages and transfer only missing events in both
directions. The response reports `peerId`, the redacted network membership,
`inventoried`, `pushed`, `pulled`, and `duplicates` counts. A non-empty
`conflicts` array reports quarantined IDs without aborting unrelated transfer.

The synchronized peer address is persisted for automatic reconnection and
another synchronization at daemon startup.

Empty `event_query` results are encoded as `[]`, never `null`.

## Compatibility

Requests, responses, and subscription pushes carry protocol version `1`.
Explicitly mismatched requests are rejected with a versioned error. For
compatibility with the first prototype, an absent request version is interpreted
as version `1`; this fallback should be removed deliberately in a future
breaking version. Local IPC has no handshake or feature negotiation yet.

Local request lines are explicitly capped at 1 MiB. Clients should apply their
own deadlines; long-lived subscription sockets intentionally remain open until
unregistered, disconnected, or the daemon shuts down.

All field/action changes must update `packages/sdk-js` in the same change.

Remote p2p traffic uses a separate versioned membership protocol rather than
exposing the trusted local action router directly.
