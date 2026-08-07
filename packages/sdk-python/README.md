# Thalweg Python SDK

Async Python client for the local Thalweg daemon.

> **Status:** alpha. The protocol transport and the documented version-1 API
> are implemented and tested, but the package has not been published.

## Why a Python SDK

Python is a primary environment for collectors, local AI pipelines, data
processing, and archival workers. This SDK will expose Thalweg's public local
IPC contract without requiring applications to construct newline-delimited JSON
frames or manage Unix-socket request correlation themselves.

The first release will be async-first and will focus on reliable ingestion,
queries, live subscriptions, and durable at-least-once workers. It will use the
daemon as the source of truth for event ordering, storage, membership, and mesh
behavior.

## Requirements

- Python 3.11 or newer
- A local Thalweg daemon
- Unix-domain socket support
- No required third-party runtime dependencies

The daemon can be started from the monorepo root during development:

```bash
go run ./cmd/thalweg spawn
```

## Installation

Install the package from a monorepo checkout:

```bash
python3 -m pip install -e packages/sdk-python
```

The distribution currently uses the provisional name `thalweg-sdk`; the import
package is `thalweg`.

## Quick Start

The client connects lazily, so constructing it does not require the daemon to be
running yet.

```python
import asyncio

from thalweg import Thalweg


async def main() -> None:
    async with Thalweg(
        socket_path="/tmp/thalweg.sock",
        network="personal",
    ) as thalweg:
        event = await thalweg.ingest(
            "user:note",
            {"content": "Observed locally", "source": "manual"},
            event_id="note-2026-08-03-1",
        )
        print(event.id, event.inserted_at)

        recent = await thalweg.query(
            streams=["user:note"],
            order="desc",
            limit=10,
        )
        for item in recent:
            print(item.stream, item.payload)


asyncio.run(main())
```

All client operations are explicitly scoped to the configured network unless a
method accepts a deliberate network override.

## Durable Workers

Durable siphons are the recommended foundation for Python processors that must
survive restarts. The daemon persists the consumer definition, receipt cursor,
and one outstanding delivery. Delivery is at least once, so destination writes
must be idempotent.

```python
async with Thalweg(
    socket_path="/tmp/thalweg.sock",
    network="personal",
) as thalweg:
    await thalweg.create_durable_siphon(
        "transcript-archive",
        streams=["voice:transcript"],
        start="earliest",
    )

    while True:
        delivery = await thalweg.poll_durable_siphon(
            "transcript-archive",
            limit=25,
            wait=20.0,
        )
        if delivery.delivery_id is None:
            continue

        await archive_idempotently(delivery.events)
        await thalweg.acknowledge_durable_siphon(
            "transcript-archive",
            delivery.delivery_id,
        )
```

If the process exits before acknowledgement, the daemon returns the same batch
on the next poll and increments its attempt count.

## Live Events

Ephemeral future-event subscriptions use an async iterator with explicit
lifetime management:

```python
async with thalweg.subscribe(streams=["user:note"]) as events:
    async for event in events:
        print(event.payload)
```

Live subscriptions are connection-bound and do not replay history. They are
appropriate for displays and best-effort reactions. Durable siphons should be
used when missing an event is unacceptable.

## Typing

Events and result objects are typed immutable dataclasses. Payloads remain
generic so callers can use `TypedDict`, dataclasses, Pydantic models, or plain
JSON-compatible dictionaries in their own application layer.

Canonical daemon timestamps remain strings in SDK models. Thalweg uses
RFC3339 timestamps with nanosecond precision, which Python's standard
`datetime` cannot represent without losing precision.

## Error Handling

Daemon failures raise `ThalwegDaemonError` with stable fields:

```python
from thalweg import ThalwegDaemonError

try:
    await thalweg.query()
except ThalwegDaemonError as error:
    print(error.action, error.code, error.retryable, str(error))
```

Transport closure, request timeout, malformed frames, and protocol mismatch
have distinct SDK exception types. Applications should use `code` and
`retryable` for daemon errors rather than parsing human-readable messages.

## Development

The test suite uses only the standard library and a temporary fake daemon:

```bash
cd packages/sdk-python
PYTHONPATH=src python3 -m unittest discover -s tests -t . -v
```

## Security

Network invitations are shared bearer credentials in membership protocol
version 1. Do not log them, include them in exception context, or persist them
casually. Network-listing and enrollment-discovery results remain redacted.

The SDK talks only to the daemon's local `0600` Unix socket. It does not expose
the trusted local action router over TCP or implement the remote mesh protocol.

## Repository Documentation

- [Python SDK specification](SPEC.md)
- [Canonical local IPC protocol](../../docs/PROTOCOL.md)
- [Canonical data model](../../docs/DATA_MODEL.md)
- [System architecture](../../docs/ARCHITECTURE.md)
- [TypeScript SDK](../sdk-js/README.md)
