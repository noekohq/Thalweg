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
{
  "id":"req_1",
  "protocolVersion":1,
  "success":false,
  "error":"network is required",
  "errorDetails":{
    "code":"action_failed",
    "message":"network is required",
    "retryable":false
  }
}
```

`error` remains the backward-compatible human-readable message.
`errorDetails` is the machine-readable form for new clients. Current codes are
`invalid_request`, `protocol_mismatch`, `unknown_action`, `request_too_large`,
`deadline_exceeded`, `canceled`, `unavailable`, and `action_failed`. Clients
should branch on `code` and `retryable`, not parse the message.

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

### Durable siphon actions

Durable siphons are named, local, at-least-once consumers. They use a persisted
daemon-local receipt cursor, so historical replay transitions to newly stored
local or replicated events without a registration gap.

Create a definition idempotently with `durable_siphon_create`:

```json
{
  "network":"personal",
  "name":"transcript-archive",
  "streams":["voice:transcript"],
  "start":"earliest"
}
```

`start` may be `earliest` (the default) or `latest`. An empty stream list means
all streams. Recreating the same network/name/streams returns the existing
definition; changing streams under an existing name is rejected. The response
contains definition version `1`, the acknowledged numeric cursor, timestamps,
and pending-delivery summary.

Inspect definitions using `durable_siphon_list` with an optional network:

```json
{"network":"personal"}
```

Poll one batch with `durable_siphon_poll`:

```json
{"network":"personal","name":"transcript-archive","limit":25,"waitMillis":20000}
```

The limit must be between 1 and 100. `waitMillis` may block for up to 25 seconds
until a matching event is stored, avoiding a busy polling loop while retaining
a bounded local request. A non-empty response contains a stable
`deliveryId`, `cursorFrom`, `cursorThrough`, `attempt`, and immutable `events`.
Polling again before acknowledgement returns the same batch and increments its
persisted attempt count, including after daemon restart. An empty delivery has
no `deliveryId`, an empty `events` array, and equal cursor bounds.

After the destination has durably processed the entire batch, acknowledge its
exact identity with `durable_siphon_ack`:

```json
{
  "network":"personal",
  "name":"transcript-archive",
  "deliveryId":"delivery_..."
}
```

Acknowledgement atomically advances the definition cursor through that batch
and clears it. Missing, stale, or mismatched delivery IDs are rejected. A
processor crash before acknowledgement therefore causes replay; integrations
must make side effects idempotent. This first contract has one outstanding
batch per named siphon and no leases, multi-worker claims, dead-letter policy,
time windows, or watermarks yet.

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
  "storageSchemaVersion": 4,
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

### `network_leave`

Payload:

```json
{"name":"home"}
```

Removes the mounted membership and all remembered mesh-peer retry records for
that network. Returns `{membership, left: true}`. Locally stored events are not
deleted and remain available to trusted local IPC queries that explicitly name
the old namespace, but they can no longer replicate without remounting a
credential. Version-1 credentials held by other devices remain valid, so
leaving is not credential rotation or revocation.

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
`authorized: true`. This call does not exchange events, but the remembered peer
is eligible for event-triggered synchronization and periodic anti-entropy; see
`MESH_PROTOCOL.md`.

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

The synchronized peer address is persisted for automatic delivery and retry.
Successful local ingestion schedules a short, coalesced synchronization to
remembered authorized peers. The daemon also runs periodic anti-entropy,
records the last result, and applies bounded exponential backoff after
failures. This provides near-immediate availability to remote local
subscriptions while connected, but is not yet a permanent remote event stream.
Successful inbound mesh authentication also remembers the initiator, making
future event-triggered delivery bidirectional even when only one device
initiated enrollment or the first manual sync.

### `mesh_peer_list`

Payload may be `{}` or filter one mounted network:

```json
{"network":"home"}
```

Returns remembered peers sorted by network and peer ID. Each record contains
the redacted network, peer ID and address, current `connected` observation, a
state (`known`, `connected`, `syncing`, `healthy`, or `degraded`), attempt and
success timestamps, retry time, consecutive failure count, last error, and the
last successful synchronization result when available. Connection state is a
point-in-time libp2p observation; `healthy` means the last synchronization
succeeded, not that two nodes are continuously identical.

Empty `event_query` results are encoded as `[]`, never `null`.

## Compatibility

Requests, responses, and subscription pushes carry protocol version `1`.
Explicitly mismatched requests are rejected with a versioned error. For
compatibility with the first prototype, an absent request version is interpreted
as version `1`; this fallback should be removed deliberately in a future
breaking version. Local IPC has no handshake or feature negotiation yet.

Local request lines are explicitly capped at 1 MiB. Request/response clients
apply deadlines; long-lived subscription sockets intentionally remain open
until unregistered, disconnected, or the daemon shuts down. Handlers do not yet
have action-specific server-side time budgets.

All field/action changes must update `packages/sdk-js` in the same change.

Remote p2p traffic uses a separate versioned membership protocol rather than
exposing the trusted local action router directly.
