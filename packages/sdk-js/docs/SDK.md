# TypeScript SDK

## Purpose

The SDK makes Thalweg feel like a typed temporal programming API rather than a
generic database client. Applications define stream payloads once, then receive
compile-time inference while ingesting, querying, filtering, and processing
those streams.

## Client Definition

```ts
type Streams = {
  "system:app_activity": {
    device: string;
    appName: string;
    idle: boolean;
  };
  "user:note": {
    content: string;
  };
};

type Basins = {
  timeline: ["system:app_activity", "user:note"];
};

const t = new Thalweg<Streams, Basins>(
  {
    socket: "/tmp/thalweg.sock",
    network: "personal",
  },
  {
    timeline: ["system:app_activity", "user:note"],
  },
);
```

The second constructor argument is required for basin runtime behavior. The
`Basins` generic exists only to type-check it and basin calls.

## Ingestion

```ts
await t.ingest(
  "user:note",
  { content: "Observed locally" },
  {
    occurredAt: new Date().toISOString(),
    eventId: "optional-network-unique-id",
  },
);
```

The stream determines the accepted payload type. The daemon returns the full
event envelope with canonical UTC timestamps.

`eventId` is unique within the configured network. Retrying an equivalent event
returns the originally stored envelope; reusing the ID with a different stream,
supplied occurrence time, or payload is rejected. Payload whitespace and object
key order do not affect equivalence.

## Queries

```ts
const events = await t.query({
  streams: ["user:note"],
  from: "2026-07-30T00:00:00.000Z",
  to: "2026-07-31T00:00:00.000Z",
  limit: 100,
  order: "desc",
});
```

Omitting `streams` queries all streams in the configured network. Results are
ascending by default; `order: "desc"` returns newest first and applies the limit
after ordering. The current return type is a union of all payloads rather than a
more precise union based on `opts.streams`.

## Continuous Siphons

```ts
const handle = t
  .siphon()
  .include(["user:note"])
  .run(async (ctx, event) => {
    console.log(event.payload.content);
  });

await handle.ready;
await handle.stop();
await handle.result;
```

Continuous mode registers for future matching events. It does not currently
replay historical events, even if `.tail()` is called.

## Durable Siphons

The first durable runtime contract is exposed as typed create/list/poll/ack
operations:

```ts
await t.createDurableSiphon("transcript-archive", {
  streams: ["voice:transcript"],
  start: "earliest",
});

const delivery = await t.pollDurableSiphon("transcript-archive", 25, 20_000);
for (const event of delivery.events) {
  await archive.put(event.id, event);
}
if (delivery.deliveryId) {
  await t.acknowledgeDurableSiphon(
    "transcript-archive",
    delivery.deliveryId,
  );
}
```

The daemon persists one outstanding batch per name. Polling before
acknowledgement, including after restart, returns the same event batch with an
incremented attempt. The receipt-order cursor includes late replicated events
without confusing it with chronological event order. Destination writes must
be idempotent. The optional third polling argument waits up to 25 seconds for a
new match, enabling an efficient near-live worker loop. Fluent
`.durable(...).run(...)`, leases, windows, lineage, and dead-letter policy
remain future layers over this foundation.

## Buffered Siphons

```ts
t.basin("timeline")
  .siphon()
  .interval("15m")
  .run(async (ctx, data) => {
    const notes = data["user:note"];
  });
```

Calling `interval()` changes the callback type to a map:

```ts
{
  "system:app_activity": ThalwegEvent<ActivityPayload>[];
  "user:note": ThalwegEvent<NotePayload>[];
}
```

The current runtime performs one query from `now - interval` through `now`,
calls the callback once, and stops. It does not schedule future intervals.
`handle.result` resolves when it finishes or rejects with query/callback errors.

Supported duration suffixes are `ms`, `s`, `m`, `h`, and `d`.

## Include and Omit

`include()` replaces the active stream set. `omit()` removes streams from the
active runtime set. Both methods update the callback's inferred types.

When starting from `siphon()` with no explicit stream list, runtime omission
cannot enumerate all possible stream names. This should be addressed as part of
the builder/runtime alignment milestone.

## Context and Derived Events

Every siphon callback receives a typed context:

```ts
ctx.ingest("insights:summary", {
  content: "Derived locally",
  generatedAt: new Date().toISOString(),
});
```

Derived events use the same ingestion path as source events. The SDK does not
currently attach lineage, window IDs, or idempotency metadata automatically.

## Daemon Status

`networkStatus()` returns the local peer/device identity, advertised addresses,
daemon version, local and mesh protocol versions, storage schema version, and
membership-file version. Its return type is the exported `NetworkStatus`
interface.

## Network Membership

The SDK exposes the daemon's additive membership actions:

```ts
const created = await t.createNetwork("home");
console.log(created.membership); // { name, id }

// Transfer created.invitation out of band to another trusted device.
await other.joinNetwork(created.invitation);

// Reissue it later instead of persisting the invitation in application state.
const reissued = await t.inviteNetwork("home");

const memberships = await t.listNetworks(); // secrets are redacted

// Removes this device's membership and remembered peers; does not revoke others.
await t.leaveNetwork("home");
```

Invitations are bearer credentials containing a network secret. Applications
must not log or persist them casually. In membership protocol version 1,
`inviteNetwork()` deterministically re-encodes the same shared network secret;
it does not create an expiring or revocable enrollment token. Its
`credentialMode` is therefore `"shared-bearer"`.

For approval-based enrollment:

```ts
const opened = await existing.openEnrollment("home", 600);
const candidates = await joining.discoverEnrollments();

// Existing device polls and displays these to its operator.
const requests = await existing.listEnrollmentRequests("home");
await existing.decideEnrollment(requests[0].id, true);

// Joining device waits for that decision, mounts membership, and initially syncs.
await joining.requestEnrollment(candidates[0], "Work MacBook");
await existing.closeEnrollment(opened.offer.id);
```

LAN discovery uses mDNS. `discoverEnrollments(targetAddr)` provides the manual
fallback for already reachable VPN, routed, forwarded, or public addresses.
Discovery never returns credentials; only approval transfers the current
shared-bearer credential over the encrypted libp2p connection.

Once both daemons mount the same network, connect and mutually authenticate one
network at a time:

```ts
await t.dialMeshPeer(
  "/ip4/192.168.1.20/tcp/4001/p2p/12D3...",
  "home",
);
```

Omitting the second argument uses the `Thalweg` instance's configured network.
To authenticate and immediately converge missing history in both directions:

```ts
const result = await t.syncMeshPeer(
  "/ip4/192.168.1.20/tcp/4001/p2p/12D3...",
  "home",
);

console.log(result.pushed, result.pulled);

const peers = await t.listMeshPeers("home");
console.log(peers[0]?.state, peers[0]?.lastSuccessAt);
```

Synchronization is bounded and inventory-first. The daemon rejects
same-ID/different-envelope conflicts and events from any network other than the
one authenticated on the stream.

## Lifecycle and Errors

`Thalweg.close()` ends the socket. Continuous handles expose `ready`, `result`,
and `stop()`. Daemon rejections use `ThalwegDaemonError`, whose `action`,
`code`, `message`, and `retryable` fields are safe to branch on without parsing
prose. The client rejects pending requests if the socket closes or sends
malformed JSON, and requests time out after 30 seconds by default. Configure
`requestTimeoutMs` on `ThalwegConfiguration` when needed. Automatic reconnect,
abort-signal cancellation, and subscription restoration remain future work.
