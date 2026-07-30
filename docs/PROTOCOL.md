# SDK Transport Contract

The canonical daemon contract is maintained in:

https://github.com/noekohq/Thalweg/blob/master/docs/PROTOCOL.md

This document describes how the SDK consumes that contract.

## Connection

`DaemonClient` opens a Node-compatible Unix domain socket using `node:net`.
Messages are newline-delimited JSON. One connection carries:

- Correlated request/response traffic.
- Unsolicited subscription event pushes.

Request IDs are process-local strings such as `req_1`. The SDK keeps pending
promise resolvers in a map keyed by request ID.

## Requests

```ts
client.request<T>(action, payload)
```

The SDK:

1. Opens the socket lazily on the first request.
2. Assigns a request ID.
3. Writes one JSON object followed by `\n`.
4. Resolves or rejects when a response with that ID arrives.

The current implementation has no request timeout or cancellation.

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

Any action, field, response, or push-shape change requires a coordinated release
with `noekohq/Thalweg`. Until explicit protocol version negotiation exists,
assume daemon and SDK versions must match.

