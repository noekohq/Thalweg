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
  "limit": 100
}
```

`network` is required. An absent or empty `streams` array means all streams in
the network. `from` and `to` are inclusive. A non-positive `limit` is unlimited.
Query bounds may use any valid RFC3339/RFC3339Nano offset or fractional
precision. Results contain canonical UTC timestamps and are returned in
ascending chronological order.

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
Subscriptions are in memory and tied to the socket connection.

### `siphon_unregister`

Payload:

```json
{"subscriptionId":"sub_1234"}
```

Returns `{"removed":true}` even if the identifier was not present.

### `network_status`

Payload may be `{}`. Returns:

```json
{
  "peerId": "12D3...",
  "deviceId": "12D3...",
  "addresses": ["/ip4/127.0.0.1/tcp/1234/p2p/12D3..."],
  "daemonVersion": "0.1.0-dev",
  "protocolVersion": 1,
  "storageSchemaVersion": 3,
  "meshProtocolVersion": 1,
  "membershipFileVersion": 1
}
```

`protocolVersion` advertises the local IPC shape for diagnostics and matches the
version carried by local messages.

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

### `network_list`

Payload may be `{}`. Returns mounted `{name, id}` records sorted by name.
Membership secrets and invitations are never returned.

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
`inventoried`, `pushed`, `pulled`, and `duplicates` counts.

The synchronized peer address is persisted for automatic reconnection and
another synchronization at daemon startup.

Empty `event_query` results are encoded as `[]`, never `null`.

## Compatibility

Requests, responses, and subscription pushes carry protocol version `1`.
Explicitly mismatched requests are rejected with a versioned error. For
compatibility with the first prototype, an absent request version is interpreted
as version `1`; this fallback should be removed deliberately in a future
breaking version. Local IPC has no handshake or feature negotiation yet.

All field/action changes must still be coordinated with `noekohq/thalweg-js`.

Remote p2p traffic uses a separate versioned membership protocol rather than
exposing the trusted local action router directly.
