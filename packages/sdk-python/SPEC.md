# Thalweg Python SDK Specification

Status: alpha implementation in progress  
Last reviewed: 2026-08-03

The async transport, public models, timeline operations, live subscriptions,
durable siphons, and current network-facing wrappers are implemented. Remaining
release work is broader Python-version/type-tool coverage, a real-daemon smoke
test, and publication-name confirmation.

## 1. Purpose

The Thalweg Python SDK is the supported Python interface to the local Thalweg
daemon. It is intended for catchments, AI and data-processing pipelines,
durable sinks, local automation, and diagnostic tools.

The SDK owns Python API ergonomics, transport lifecycle, response decoding,
public models, and client-side type information. It does not own persistence,
event ordering, network membership semantics, synchronization, or remote peer
transport.

The canonical wire contract remains [`../../docs/PROTOCOL.md`](../../docs/PROTOCOL.md).
If this specification and the canonical protocol disagree, the canonical
protocol wins and the SDK specification must be corrected.

## 2. Goals

The initial supported release must:

1. Provide an async, concurrency-safe Unix-socket client for protocol version 1.
2. Cover ingestion, chronological queries, live subscriptions, and durable
   siphon operations.
3. Cover the daemon's supported network, enrollment, mesh, status, and conflict
   application APIs.
4. Expose structured, typed results without hiding forward-compatible response
   fields.
5. Make connection, cancellation, timeout, and delivery guarantees explicit.
6. Require no third-party runtime dependency.
7. Ship as a typed `src`-layout package with a `py.typed` marker.

## 3. Non-goals for the Initial Release

- A synchronous client or background event loop hidden in a thread.
- A direct port of the TypeScript fluent basin and siphon builder.
- Runtime payload validation or a required Pydantic dependency.
- Transparent request retry or restoration of ephemeral subscriptions after a
  connection failure.
- Automatic retry of mutating requests.
- Batch ingestion, catchment checkpoints, recurring windows, worker leases,
  lineage, or dead-letter policy before the daemon defines those contracts.
- Direct BadgerDB access or implementation of libp2p protocols.
- Support for Windows named pipes or TCP fallback.
- Wrappers for operator-only `daemon_shutdown` or legacy diagnostic `p2p_dial`.

## 4. Compatibility and Packaging

### 4.1 Runtime support

The first release targets CPython 3.11 and newer on platforms with Unix-domain
sockets. Alternative Python implementations may work but are not part of the
initial test matrix.

The import package is `thalweg`. The distribution name and publication target
will be finalized before the first release to avoid reserving an unavailable or
misleading package name.

### 4.2 Proposed layout

```text
packages/sdk-python/
├── pyproject.toml
├── README.md
├── SPEC.md
├── src/
│   └── thalweg/
│       ├── __init__.py
│       ├── _transport.py
│       ├── client.py
│       ├── errors.py
│       ├── models.py
│       └── py.typed
└── tests/
    ├── test_transport.py
    ├── test_client.py
    ├── test_subscriptions.py
    ├── test_network_api.py
    └── test_typing.py
```

Modules beginning with `_` are private. Public names are re-exported from
`thalweg.__init__`; users are not expected to import internal modules.

### 4.3 Dependencies

Runtime behavior uses `asyncio`, `json`, and other Python standard-library
modules. Tests and development tooling may use pytest, pytest-asyncio, mypy or
Pyright, Ruff, and a build frontend, but these are not runtime requirements.

## 5. Public API Shape

### 5.1 Client lifecycle

```python
class Thalweg:
    def __init__(
        self,
        *,
        socket_path: str = "/tmp/thalweg.sock",
        network: str,
        request_timeout: float = 30.0,
        subscription_queue_size: int = 128,
        max_response_bytes: int = 64 * 1024 * 1024,
    ) -> None: ...

    async def __aenter__(self) -> "Thalweg": ...
    async def __aexit__(self, ...) -> None: ...
    async def close(self) -> None: ...
```

Construction is lazy and performs no I/O. The first operation connects to the
socket. The async context manager guarantees `close()` on exit. `close()` is
idempotent and fails all outstanding operations with `ThalwegConnectionError`.

The client may be used concurrently by tasks on one event loop. Using one
instance across event loops or processes is unsupported and must fail clearly
rather than corrupt transport state.

### 5.2 Event and JSON types

```python
JsonScalar = None | bool | int | float | str
JsonValue = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]

@dataclass(frozen=True, slots=True)
class Event(Generic[PayloadT]):
    id: str
    network: str
    stream: str
    occurred_at: str
    inserted_at: str
    propagated_at: str
    counter: int
    device_id: str
    payload: PayloadT
```

Wire camelCase is converted to public snake_case. Canonical timestamps remain
strings so their RFC3339 nanosecond precision is preserved exactly. Convenience
parsers may be added later only if their precision limitations are explicit.

Unknown response fields must not make decoding fail. Models that need to retain
feature-negotiation or future diagnostic fields may expose a read-only `extra`
mapping. Required protocol-version-1 fields must be validated and malformed
responses must raise `ThalwegProtocolError`.

Payloads are returned as decoded JSON by default. Generic payload annotations
provide static information but do not perform runtime conversion. A later
opt-in decoder registry must not change the default behavior.

### 5.3 Ingestion

```python
async def ingest(
    self,
    stream: str,
    payload: PayloadT,
    *,
    occurred_at: str | None = None,
    event_id: str | None = None,
) -> Event[PayloadT]: ...
```

The method maps to `event_ingest`. Optional keys are omitted from the wire
payload when unset. The daemon assigns `occurredAt` when it is absent.

Applications retrying an ingest after a timeout should supply a stable
`event_id`. A client timeout or cancellation does not prove the daemon failed to
store the event.

### 5.4 Queries

```python
async def query(
    self,
    *,
    streams: Sequence[str] | None = None,
    from_: str | None = None,
    to: str | None = None,
    limit: int = 0,
    order: Literal["asc", "desc"] = "asc",
) -> list[Event[JsonValue]]: ...
```

The method maps to `event_query`. `None` or an empty stream sequence means all
streams in the configured network. Bounds are inclusive. Validation that can
be performed without duplicating daemon semantics should fail before writing a
request: limits cannot be negative and order must be `asc` or `desc`.

The SDK preserves the daemon's returned ordering and never re-sorts events.

### 5.5 Live subscriptions

```python
def subscribe(
    self,
    *,
    streams: Sequence[str] | None = None,
    queue_size: int | None = None,
) -> Subscription[JsonValue]: ...

async with client.subscribe(streams=["user:note"]) as events:
    async for event in events:
        ...
```

Entering the context registers `siphon_register`; leaving it calls
`siphon_unregister`. `Subscription` is an `AsyncIterator[Event[PayloadT]]` and
also exposes its `subscription_id` after entry and an idempotent `aclose()`.

Events can arrive immediately after the registration response. The transport
must route or temporarily queue those events without a registration race.
Every subscription has a bounded local queue. If that queue fills, the SDK
closes the subscription and raises `ThalwegBackpressureError`; it must not drop
events silently.

Connection loss ends all subscriptions. Version 1 performs no automatic
reconnect or replay. Live subscriptions receive future events only and are not
a durability mechanism.

### 5.6 Durable siphons

Public methods map directly to the four version-1 durable actions:

```python
async def create_durable_siphon(
    self,
    name: str,
    *,
    streams: Sequence[str] | None = None,
    start: Literal["earliest", "latest"] = "earliest",
) -> DurableSiphon: ...

async def list_durable_siphons(
    self,
    *,
    network: str | None = None,
) -> list[DurableSiphon]: ...

async def poll_durable_siphon(
    self,
    name: str,
    *,
    limit: int = 25,
    wait: float = 0.0,
) -> DurableDelivery[JsonValue]: ...

async def acknowledge_durable_siphon(
    self,
    name: str,
    delivery_id: str,
) -> DurableSiphon: ...
```

`wait` is expressed in Python seconds and converted to the daemon's integer
`waitMillis`; it must be between zero and 25 seconds. The effective request
deadline for a long poll must allow the requested wait plus a documented
transport margin, even when the client's ordinary timeout is shorter.

`DurableDelivery.delivery_id` is `None` for an empty delivery. Acknowledgement
is never automatic. Helpers that manage a worker loop may be proposed later,
but must preserve the rule that acknowledgement occurs only after all external
side effects have completed durably.

### 5.7 Status, membership, enrollment, mesh, and conflicts

The first release exposes snake-case wrappers and typed models for:

| Python method | Daemon action |
| --- | --- |
| `network_status()` | `network_status` |
| `create_network(name)` | `network_create` |
| `invite_network(name)` | `network_invite` |
| `join_network(invitation)` | `network_join` |
| `list_networks()` | `network_list` |
| `leave_network(name)` | `network_leave` |
| `open_enrollment(...)` | `enrollment_listen` |
| `close_enrollment(offer_id)` | `enrollment_close` |
| `list_enrollment_requests(...)` | `enrollment_requests` |
| `decide_enrollment(request_id, accepted)` | `enrollment_approve` or `enrollment_deny` |
| `discover_enrollments(...)` | `enrollment_discover` |
| `request_enrollment(candidate, device_name)` | `enrollment_join` |
| `dial_mesh_peer(target_addr, ...)` | `mesh_dial` |
| `sync_mesh_peer(target_addr, ...)` | `mesh_sync` |
| `list_mesh_peers(...)` | `mesh_peer_list` |
| `list_conflicts(...)` | `event_conflict_list` |
| `resolve_conflict(event_id, ...)` | `event_conflict_resolve` |

Methods default to the configured network where the underlying action is
network-scoped. Optional overrides must be keyword-only. Invitations must never
appear in exception messages or object representations; result model `repr`
must redact credential-bearing fields.

Conflict resolution initially accepts only the daemon-supported
`"preserve-both"` strategy.

## 6. Transport Contract

### 6.1 Connection and framing

The transport uses `asyncio.open_unix_connection`. Each request is a compact
JSON object followed by one newline:

```json
{"id":"req_1","protocolVersion":1,"action":"event_query","payload":{}}
```

One reader task owns socket reads. It buffers partial frames, splits complete
lines, decodes JSON, validates protocol version 1, and dispatches responses by
request ID or event pushes by subscription ID.

Writes are serialized with a lock and followed by `drain()`. Multiple requests
may be in flight concurrently and responses may arrive in any order. Request
IDs are unique for the lifetime of a client instance and are not reused after a
timeout.

### 6.2 Limits

The client must reject outgoing request frames larger than the daemon's 1 MiB
limit before writing them. A bounded incoming frame limit must protect the
process from an unbounded buffer if a peer violates framing. The default
`max_response_bytes` is 64 MiB and applies to each response or event-push frame.
Exceeding it is a connection-level `ThalwegProtocolError`.

Protocol version 1 does not paginate query responses, so a valid unlimited
query can exceed the SDK default. Applications should normally set a query
limit. A caller that intentionally needs a larger response can raise the
client's explicit bound; the SDK must never grow the buffer without a bound.

### 6.3 Timeouts and cancellation

Each ordinary request has a monotonic deadline. On timeout, the pending entry is
removed and `ThalwegTimeoutError(action=...)` is raised. The socket stays usable.
A late response for an expired request is ignored.

Cancelling the awaiting task removes its pending entry but does not send a
daemon cancellation because protocol version 1 has no cancellation frame. The
socket remains usable. For mutating actions, timeout and cancellation mean the
outcome is unknown; the SDK must not retry automatically.

### 6.4 Disconnect and protocol failure

EOF, socket errors, malformed JSON, invalid message shapes, and protocol-version
mismatch fail all pending requests and subscriptions. The socket and reader
task are then closed. The next new request may establish a fresh connection,
but subscriptions are not restored and already-failed request futures are never
replayed.

An explicit `close()` is terminal for that client instance. Operations after
explicit close raise `ThalwegConnectionError` rather than opening a new socket.

Malformed or incompatible input is a connection-level failure because frame
alignment and response interpretation can no longer be trusted.

## 7. Error Model

```text
ThalwegError
├── ThalwegDaemonError
├── ThalwegConnectionError
├── ThalwegTimeoutError
├── ThalwegProtocolError
└── ThalwegBackpressureError
```

`ThalwegDaemonError` exposes `action`, `code`, `message`, and `retryable`. It
uses `errorDetails` when present and falls back to version-1 `error` with code
`"action_failed"` and `retryable=False`.

Exceptions must avoid embedding request payloads because they may contain event
contents or network invitations. Exception messages may include the action,
request ID, socket path, or protocol version when useful and non-secret.

Constructor argument errors use standard `TypeError` or `ValueError`; daemon
validation failures remain `ThalwegDaemonError`.

## 8. Naming and Model Policy

- Public methods, parameters, and attributes use `snake_case`.
- Wire action names and field names remain private implementation details.
- Public result models are frozen, slotted dataclasses unless a measured need
  requires another representation.
- Collection fields use immutable tuples where mutation would imply unsupported
  write-back behavior; event query and delivery collections remain lists where
  normal iteration and processing ergonomics matter.
- Boolean status fields are represented as `bool`, not integer flags.
- Optional fields distinguish absent values from empty values.
- Credential-bearing models implement redacted `repr` and never serialize
  implicitly through `dataclasses.asdict` in SDK logging.

## 9. Testing and Quality Gates

Unit tests use a temporary Unix-domain socket server and must cover:

- Partial frames, multiple frames per read, and malformed JSON.
- Concurrent requests with out-of-order responses.
- Request timeout, task cancellation, late response, EOF, and reconnect.
- Protocol mismatch and missing required response fields.
- Structured and legacy daemon errors.
- Subscription registration race, filtering, cleanup, and queue overflow.
- Ingest/query field mapping and preservation of timestamp strings.
- Durable empty delivery, replay attempt, acknowledgement mapping, and
  long-poll timeout margin.
- Every membership, enrollment, mesh, status, and conflict action mapping.
- Invitation redaction from `repr` and errors.
- Idempotent client and subscription close behavior.

Static checks must verify public generic payload types and the `py.typed`
package marker. Formatting, linting, type checking, unit tests, package build,
and wheel-content inspection become root `make check`, `make test`, and
`make build` responsibilities once implementation begins.

An integration test should run against a real temporary daemon and cover
ingest, query, live subscription, and durable create/poll/ack. Host and VM mesh
acceptance remains owned by the daemon's canonical testing plan.

## 10. Documentation Rules

- README examples must be executable against the currently released API.
- Any public wire-contract change first updates the canonical root protocol,
  then both SDKs and their tests in the same change.
- Python documentation describes Python ergonomics and links to canonical
  daemon semantics instead of copying the entire protocol.
- Prototype behavior must be labeled and must not be described as durable or
  gap-free when the daemon does not provide that guarantee.

## 11. Implementation Milestones

### Milestone 1: Package and transport

- Add `pyproject.toml`, public exceptions, package metadata, and `py.typed`.
- Implement lazy connection, framing, concurrent request correlation,
  deadlines, cancellation cleanup, and shutdown.
- Add the fake-daemon transport test suite.

Exit guarantee: concurrent version-1 requests have deterministic completion and
failure behavior without leaking tasks or sockets.

### Milestone 2: Timeline and live subscriptions

- Add event models, `ingest`, `query`, and async-iterator subscriptions.
- Enforce bounded subscription queues and observable backpressure failure.
- Add a real-daemon smoke test.

Exit guarantee: Python applications can safely produce, inspect, and observe
events while preserving daemon ordering and timestamp fidelity.

### Milestone 3: Durable workers

- Add durable definition, delivery, poll, and acknowledgement models and APIs.
- Test long polling, empty batches, replay identity, and acknowledgement.
- Publish an idempotent worker example without automatic acknowledgement.

Exit guarantee: a Python integration can resume at-least-once processing after
a process or daemon restart without a history/live registration gap.

### Milestone 4: Network operations and release readiness

- Add status, membership, enrollment, mesh, and conflict APIs.
- Complete redaction, public exports, type tests, documentation, and package
  artifact verification.
- Integrate Python tasks into root developer and CI commands.

Exit guarantee: the Python SDK covers the daemon's supported application API
with an installable, typed, tested package.

## 12. Deferred Design Questions

The following require evidence from real integrations before committing to a
public contract:

1. Whether a synchronous facade materially improves adoption enough to justify
   a separate lifecycle and test surface.
2. Whether payload decoder hooks belong in the SDK or application adapters.
3. Whether basin definitions provide useful Python typing or merely recreate a
   TypeScript-specific abstraction.
4. Whether a durable worker helper can improve ergonomics without obscuring
   acknowledgement and idempotency boundaries.
5. Whether transport feature negotiation should precede expanding wrappers for
   future daemon actions.
