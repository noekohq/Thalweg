# SDK Transport Contract

The canonical daemon contract is maintained at `../../../docs/PROTOCOL.md`.

This document describes how the SDK consumes that contract.

## Connection

`DaemonClient` opens a Node-compatible Unix domain socket using `node:net`.
Messages are newline-delimited JSON. One connection carries:

- Correlated request/response traffic.
- Unsolicited subscription event pushes.

Request IDs are process-local strings such as `req_1`. The SDK keeps pending
promise resolvers in a map keyed by request ID.

Every SDK request carries `protocolVersion: 1`. The SDK requires the same field
on responses and subscription pushes; an incompatible or missing version
rejects pending work and closes the connection.

## Requests

```ts
client.request<T>(action, payload)
```

The SDK:

1. Opens the socket lazily on the first request.
2. Assigns a request ID.
3. Writes one JSON object followed by `\n`.
4. Resolves or rejects when a response with that ID arrives.

Requests time out after 30 seconds by default. The current implementation has
no abort-signal cancellation.

Failed responses reject with `ThalwegDaemonError`. It exposes the requested
`action`, stable daemon `code`, human-readable `message`, and `retryable` hint.
The client still accepts the legacy top-level `error` shape for compatibility
with older protocol-version-1 daemons.

For `event_ingest`, the SDK forwards the optional producer `eventId`. The daemon
treats it as network-unique: equivalent retries return the original envelope,
while conflicting reuse rejects the request. Returned event timestamps are
canonical UTC RFC3339Nano even when the request used another valid offset or
fractional precision.

`network_status` includes daemon, local protocol, mesh protocol, storage schema,
and membership-file versions for diagnostics.

The public `Thalweg` class also wraps:

- `network_create` as `createNetwork(name)`.
- `network_invite` as `inviteNetwork(name)`.
- `network_join` as `joinNetwork(invitation)`.
- `network_list` as `listNetworks()`.
- `network_leave` as `leaveNetwork(name)`.
- `mesh_dial` as `dialMeshPeer(targetAddr, network?)`.
- `mesh_sync` as `syncMeshPeer(targetAddr, network?)`.
- `mesh_peer_list` as `listMeshPeers(network?)`.
- `enrollment_listen` / `enrollment_close` as `openEnrollment()` and
  `closeEnrollment()`.
- `enrollment_requests` and approval/denial as `listEnrollmentRequests()` and
  `decideEnrollment()`.
- `enrollment_discover` / `enrollment_join` as `discoverEnrollments()` and
  `requestEnrollment()`.

Network-list results are redacted. Create and invite results contain bearer
credentials and should be treated as secret. The invite result carries
`credentialMode: "shared-bearer"` because protocol version 1 reissues the
persisted shared credential rather than creating a revocable enrollment token.

`syncMeshPeer()` returns typed inventory and transfer counts. `listMeshPeers()`
returns persisted attempt, success, retry, failure, and last-result data for
remembered authorized peers. Empty daemon queries are guaranteed to return
arrays rather than `null`.

## Subscription Pushes

The daemon sends:

```json
{
  "type": "event",
  "subscriptionId": "sub_1234",
  "event": {}
}
```

The SDK routes this to the handler stored for `subscriptionId`. Callback
promises are not awaited by the socket parser, so callback failures do not
currently affect the connection or caller.

## Disconnect Behavior

When the socket closes:

- The socket and connection promise are cleared.
- All pending requests reject.
- Pending requests are removed.

Subscription handlers currently remain in the map, but the daemon-side
subscriptions disappear with the connection. Automatic reconnection and
resubscription are not implemented.

## Compatibility Rule

Any action, field, response, or push-shape change must update the root Go module
and this package together. Messages are versioned, but there is no handshake or
feature negotiation, so daemon and SDK versions must still match.
