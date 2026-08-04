from __future__ import annotations

import asyncio
import json
import tempfile
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

RequestHandler = Callable[
    [dict[str, Any], asyncio.StreamReader, asyncio.StreamWriter], Awaitable[None]
]


class FakeDaemon:
    def __init__(self, handler: RequestHandler) -> None:
        self.handler = handler
        self.requests: list[dict[str, Any]] = []
        self._temporary = tempfile.TemporaryDirectory(prefix="thalweg-sdk-")
        self.socket_path = str(Path(self._temporary.name) / "daemon.sock")
        self.server: asyncio.Server | None = None
        self.connections: set[asyncio.StreamWriter] = set()
        self.tasks: set[asyncio.Task[None]] = set()

    async def __aenter__(self) -> "FakeDaemon":
        self.server = await asyncio.start_unix_server(
            self._accept, path=self.socket_path
        )
        return self

    async def __aexit__(self, *_: object) -> None:
        if self.server is not None:
            self.server.close()
            await self.server.wait_closed()
        for writer in tuple(self.connections):
            writer.close()
        for writer in tuple(self.connections):
            try:
                await writer.wait_closed()
            except OSError:
                pass
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
        self._temporary.cleanup()

    async def _accept(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        self.connections.add(writer)
        task = asyncio.current_task()
        if task is not None:
            self.tasks.add(task)
        try:
            while line := await reader.readline():
                request = json.loads(line)
                self.requests.append(request)
                await self.handler(request, reader, writer)
        except (ConnectionError, asyncio.IncompleteReadError):
            pass
        finally:
            self.connections.discard(writer)
            if task is not None:
                self.tasks.discard(task)
            writer.close()
            try:
                await writer.wait_closed()
            except OSError:
                pass


async def send_response(
    writer: asyncio.StreamWriter,
    request: dict[str, Any],
    data: object = None,
    *,
    success: bool = True,
    error: str | None = None,
    error_details: dict[str, object] | None = None,
) -> None:
    response: dict[str, object] = {
        "id": request["id"],
        "protocolVersion": 1,
        "success": success,
    }
    if success:
        response["data"] = data
    else:
        if error is not None:
            response["error"] = error
        if error_details is not None:
            response["errorDetails"] = error_details
    writer.write(json.dumps(response, separators=(",", ":")).encode() + b"\n")
    await writer.drain()


def event_data(
    *,
    event_id: str = "evt_1",
    stream: str = "user:note",
    payload: object = None,
) -> dict[str, object]:
    return {
        "id": event_id,
        "network": "personal",
        "stream": stream,
        "occurredAt": "2026-08-03T12:00:00.123456789Z",
        "insertedAt": "2026-08-03T12:00:00.123456790Z",
        "propagatedAt": "2026-08-03T12:00:00.123456791Z",
        "counter": 2,
        "deviceId": "device-1",
        "payload": {"content": "hello"} if payload is None else payload,
    }

