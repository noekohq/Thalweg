# Event Identity Conflict Resolution

## Why conflicts exist

Event IDs are unique within a logical network. A conflict occurs when two
partitioned devices independently accept different immutable envelopes under
the same network/event ID. Exact duplicates are idempotent; differing stream,
timestamps, origin, or payload produce different canonical envelope digests.

Ordinary synchronization reports conflicting IDs while continuing to transfer
unrelated events. It never chooses a winner or overwrites either envelope.

## Operator workflow

Inspect conflicts observed during synchronization:

```bash
thalweg event conflicts list --network home
```

Resolve one collision with the currently supported strategy:

```bash
thalweg event conflicts resolve \
  --network home \
  --id device2-connectivity-20260730
```

Then synchronize any peer that holds another variant:

```bash
thalweg peer sync --network home --address MULTIADDR
```

The resolution command is local and requires a conflict previously observed
through authenticated synchronization. The resolution itself is an immutable
event and therefore reaches other authorized replicas through normal sync.

## Preserve-both semantics

`preserve-both` is the only current strategy. It is deliberately lossless:

1. The original collided ID is marked logically superseded by a replicated
   event in `system:conflict_resolution`.
2. Each device deterministically copies its local immutable variant to an ID
   derived from the network, original ID, and full envelope digest.
3. The original physical event remains stored and unchanged, but ordinary
   queries and inventories omit the superseded ID.
4. Recovered variants synchronize as normal events and retain their original
   stream, payload, timestamps, counter, and device identity.
5. Every device that later receives the resolution materializes its own local
   variant before synchronization continues, allowing additional variants to
   join the recovered set.

The resulting logical history contains the resolution audit event and every
distinct recovered variant. No data is deleted and no replica is trusted to
silently decide which observation was true.

Recovered IDs have the form:

```text
evt_conflict_{base64url_sha256(network, originalEventId, originalDigest)}
```

Conflict observations are local replication metadata under versioned
`event-conflict-v1:` keys. Resolution events are part of the replicated event
history, so the decision survives restarts and reaches newly synchronized
members without a separate mutable control plane.

## Operational caveats

- A live subscriber may already have received a collided local event before
  resolution. It subsequently receives the resolution and recovered events;
  there is no retraction message in protocol version 1.
- Resolving does not infer semantic equivalence. Downstream processors should
  treat recovered variants as distinct observations unless application logic
  explicitly reconciles them.
- Winner-selection, merge/edit, undo, and destructive discard strategies are
  intentionally unsupported. They require stronger authorization, audit, and
  causal semantics.
- Producers should normally omit `eventId` and use daemon-generated IDs, or
  namespace deterministic IDs by source/device, to prevent collisions.
