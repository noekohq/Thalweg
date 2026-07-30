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
    eventId: "optional-idempotency-candidate",
  },
);
```

The stream determines the accepted payload type. The daemon returns the full
event envelope.

## Queries

```ts
const events = await t.query({
  streams: ["user:note"],
  from: "2026-07-30T00:00:00.000Z",
  to: "2026-07-31T00:00:00.000Z",
  limit: 100,
});
```

Omitting `streams` queries all streams in the configured network. Results are
chronological. The current return type is a union of all payloads rather than a
more precise union based on `opts.streams`.

## Continuous Siphons

```ts
const handle = t
  .siphon()
  .include(["user:note"])
  .run(async (ctx, event) => {
    console.log(event.payload.content);
  });

await handle.stop();
```

Continuous mode registers for future matching events. It does not currently
replay historical events, even if `.tail()` is called.

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

## Lifecycle and Errors

`Thalweg.close()` ends the socket. Continuous handles can unregister one
subscription. The current client rejects pending requests if the socket closes,
but does not reconnect, time out requests, or expose buffered callback failures
through the `SiphonHandle`.

