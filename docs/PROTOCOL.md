# Local IPC Protocol

## Transport

The MVP listens on `/tmp/thalweg.sock`. Each message is one JSON object followed
by a newline. Multiple requests may share a connection.

Requests:

```json
{"id":"req_1","action":"event_query","payload":{}}
```

Responses:

```json
{"id":"req_1","success":true,"data":{}}
```

Errors:

```json
{"id":"req_1","success":false,"error":"network is required"}
```

Subscription pushes are not responses and have no request `id`:

```json
{
  "type": "event",
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
The response data is the stored event envelope.

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
Results are returned in ascending chronological order.

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

Payload may be `{}`. Returns the current peer ID, device ID, and advertised
libp2p addresses.

### `p2p_dial`

Payload:

```json
{"target_addr":"/ip4/127.0.0.1/tcp/1234/p2p/PEER_ID"}
```

Connects to the peer and persists its multiaddress. This does not synchronize
events.

## Compatibility

There is no protocol version field or negotiation yet. Until versioning exists,
all field/action changes must be coordinated with `noekohq/thalweg-js` and
treated as breaking changes.

Remote p2p traffic should eventually use a separate versioned protocol rather
than exposing the trusted local action router directly.

