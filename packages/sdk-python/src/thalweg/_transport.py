"""Internal asyncio transport for Thalweg local IPC protocol version 1."""

from __future__ import annotations

import asyncio
import json
import math
from dataclasses import dataclass
from typing import Any, Callable, Mapping, cast

from .errors import (
    ThalwegBackpressureError,
    ThalwegConnectionError,
    ThalwegDaemonError,
    ThalwegProtocolError,
    ThalwegTimeoutError,
)

PROTOCOL_VERSION = 1
MAX_REQUEST_BYTES = 1024 * 1024


@dataclass(slots=True)
class _PendingRequest:
    action: str
    future: asyncio.Future[object]


EventHandler = Callable[[Mapping[str, Any] | BaseException], None]


class DaemonTransport:
    """A lazy, multiplexed newline-delimited JSON Unix-socket transport."""

    def __init__(
        self,
        socket_path: str,
        *,
        request_timeout: float = 30.0,
        max_response_bytes: int = 64 * 1024 * 1024,
        orphan_event_limit: int = 128,
    ) -> None:
        if not socket_path:
            raise ValueError("socket_path must not be empty.")
        if (
            isinstance(request_timeout, bool)
            or not isinstance(request_timeout, (int, float))
            or not math.isfinite(request_timeout)
            or request_timeout <= 0
        ):
            raise ValueError("request_timeout must be greater than zero.")
        if isinstance(max_response_bytes, bool) or not isinstance(
            max_response_bytes, int
        ) or max_response_bytes <= 0:
            raise ValueError("max_response_bytes must be greater than zero.")
        if isinstance(orphan_event_limit, bool) or not isinstance(
            orphan_event_limit, int
        ) or orphan_event_limit <= 0:
            raise ValueError("orphan_event_limit must be greater than zero.")
        self.socket_path = socket_path
        self.request_timeout = request_timeout
        self.max_response_bytes = max_response_bytes
        self._orphan_event_limit = orphan_event_limit
        self._loop: asyncio.AbstractEventLoop | None = None
        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._reader_task: asyncio.Task[None] | None = None
        self._connect_lock: asyncio.Lock | None = None
        self._write_lock: asyncio.Lock | None = None
        self._next_id = 0
        self._pending: dict[str, _PendingRequest] = {}
        self._event_handlers: dict[str, EventHandler] = {}
        self._orphan_events: dict[str, list[Mapping[str, Any]]] = {}
        self._orphan_overflow: set[str] = set()
        self._ignored_subscriptions: set[str] = set()
        self._closed = False

    async def request(
        self,
        action: str,
        payload: Mapping[str, object],
        *,
        timeout: float | None = None,
    ) -> object:
        if not action:
            raise ValueError("action must not be empty.")
        effective_timeout = self.request_timeout if timeout is None else timeout
        if (
            isinstance(effective_timeout, bool)
            or not isinstance(effective_timeout, (int, float))
            or not math.isfinite(effective_timeout)
            or effective_timeout <= 0
        ):
            raise ValueError("timeout must be greater than zero.")
        await self._connect()
        loop = self._require_loop()
        self._next_id += 1
        request_id = f"req_{self._next_id}"
        message = {
            "id": request_id,
            "protocolVersion": PROTOCOL_VERSION,
            "action": action,
            "payload": payload,
        }
        try:
            encoded = json.dumps(
                message,
                allow_nan=False,
                ensure_ascii=False,
                separators=(",", ":"),
            ).encode("utf-8") + b"\n"
        except (TypeError, ValueError) as error:
            raise ValueError(f"Request payload for {action!r} is not valid JSON.") from error
        if len(encoded) > MAX_REQUEST_BYTES:
            raise ValueError(
                f"Encoded request for {action!r} exceeds the 1 MiB daemon limit."
            )

        future: asyncio.Future[object] = loop.create_future()
        self._pending[request_id] = _PendingRequest(action=action, future=future)
        try:
            await self._write(encoded)
        except BaseException:
            pending = self._pending.pop(request_id, None)
            if pending is not None and not pending.future.done():
                pending.future.cancel()
            raise

        try:
            async with asyncio.timeout(effective_timeout):
                return await asyncio.shield(future)
        except TimeoutError as error:
            self._pending.pop(request_id, None)
            if not future.done():
                future.cancel()
            raise ThalwegTimeoutError(
                action=action, timeout=effective_timeout
            ) from error
        except asyncio.CancelledError:
            self._pending.pop(request_id, None)
            if not future.done():
                future.cancel()
            raise

    def register_event_handler(
        self, subscription_id: str, handler: EventHandler
    ) -> None:
        self._ignored_subscriptions.discard(subscription_id)
        self._event_handlers[subscription_id] = handler
        queued = self._orphan_events.pop(subscription_id, ())
        overflowed = subscription_id in self._orphan_overflow
        self._orphan_overflow.discard(subscription_id)
        for event in queued:
            handler(event)
        if overflowed:
            handler(
                ThalwegBackpressureError(
                    "Live events exceeded the pre-registration queue."
                )
            )

    def unregister_event_handler(self, subscription_id: str) -> None:
        self._event_handlers.pop(subscription_id, None)
        self._orphan_events.pop(subscription_id, None)
        self._orphan_overflow.discard(subscription_id)
        self._ignored_subscriptions.add(subscription_id)

    async def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        error = ThalwegConnectionError("Thalweg client is closed.")
        self._fail_waiters(error)
        task = self._reader_task
        self._reader_task = None
        if task is not None and task is not asyncio.current_task():
            task.cancel()
        writer = self._writer
        self._reader = None
        self._writer = None
        if writer is not None:
            writer.close()
            try:
                await writer.wait_closed()
            except OSError:
                pass
        if task is not None and task is not asyncio.current_task():
            try:
                await task
            except asyncio.CancelledError:
                pass

    def _bind_loop(self) -> asyncio.AbstractEventLoop:
        loop = asyncio.get_running_loop()
        if self._loop is None:
            self._loop = loop
            self._connect_lock = asyncio.Lock()
            self._write_lock = asyncio.Lock()
        elif self._loop is not loop:
            raise ThalwegConnectionError(
                "A Thalweg client cannot be shared across event loops."
            )
        return loop

    def _require_loop(self) -> asyncio.AbstractEventLoop:
        if self._loop is None:
            raise RuntimeError("Transport has not been bound to an event loop.")
        return self._loop

    async def _connect(self) -> None:
        self._bind_loop()
        if self._closed:
            raise ThalwegConnectionError("Thalweg client is closed.")
        if self._writer is not None and not self._writer.is_closing():
            return
        assert self._connect_lock is not None
        async with self._connect_lock:
            if self._closed:
                raise ThalwegConnectionError("Thalweg client is closed.")
            if self._writer is not None and not self._writer.is_closing():
                return
            try:
                reader, writer = await asyncio.open_unix_connection(self.socket_path)
            except OSError as error:
                raise ThalwegConnectionError(
                    f"Could not connect to Thalweg daemon at {self.socket_path!r}: {error}"
                ) from error
            self._reader = reader
            self._writer = writer
            self._orphan_events.clear()
            self._orphan_overflow.clear()
            self._ignored_subscriptions.clear()
            self._reader_task = asyncio.create_task(
                self._reader_loop(reader, writer), name="thalweg-daemon-reader"
            )

    async def _write(self, encoded: bytes) -> None:
        assert self._write_lock is not None
        async with self._write_lock:
            writer = self._writer
            if writer is None or writer.is_closing():
                raise ThalwegConnectionError("Thalweg daemon is not connected.")
            try:
                writer.write(encoded)
                await writer.drain()
            except (ConnectionError, OSError) as error:
                wrapped = ThalwegConnectionError(
                    f"Failed to write to Thalweg daemon: {error}"
                )
                self._abort_connection(wrapped, writer)
                raise wrapped from error

    async def _reader_loop(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ) -> None:
        buffer = bytearray()
        try:
            while True:
                chunk = await reader.read(64 * 1024)
                if not chunk:
                    raise ThalwegConnectionError("Thalweg daemon connection closed.")
                buffer.extend(chunk)
                while True:
                    newline = buffer.find(b"\n")
                    if newline < 0:
                        if len(buffer) > self.max_response_bytes:
                            raise ThalwegProtocolError(
                                "Thalweg daemon frame exceeds max_response_bytes."
                            )
                        break
                    frame = bytes(buffer[:newline])
                    del buffer[: newline + 1]
                    if len(frame) > self.max_response_bytes:
                        raise ThalwegProtocolError(
                            "Thalweg daemon frame exceeds max_response_bytes."
                        )
                    if not frame.strip():
                        continue
                    self._process_frame(frame)
        except asyncio.CancelledError:
            raise
        except (ThalwegConnectionError, ThalwegProtocolError) as error:
            self._abort_connection(error, writer)
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            self._abort_connection(
                ThalwegProtocolError(f"Thalweg daemon sent malformed JSON: {error}"),
                writer,
            )
        except Exception as error:
            self._abort_connection(
                ThalwegProtocolError(f"Failed to process daemon frame: {error}"),
                writer,
            )

    def _process_frame(self, frame: bytes) -> None:
        message = json.loads(frame.decode("utf-8"))
        if not isinstance(message, dict):
            raise ThalwegProtocolError("Thalweg daemon message must be an object.")
        version = message.get("protocolVersion")
        if isinstance(version, bool) or version != PROTOCOL_VERSION:
            received = "missing" if version is None else repr(version)
            raise ThalwegProtocolError(
                f"Unsupported Thalweg protocol version {received}; "
                f"SDK supports {PROTOCOL_VERSION}."
            )

        if message.get("type") == "event":
            subscription_id = message.get("subscriptionId")
            event = message.get("event")
            if not isinstance(subscription_id, str) or not isinstance(event, dict):
                raise ThalwegProtocolError("Malformed subscription event frame.")
            self._dispatch_event(subscription_id, cast(Mapping[str, Any], event))
            return

        request_id = message.get("id")
        success = message.get("success")
        if not isinstance(request_id, str) or not isinstance(success, bool):
            raise ThalwegProtocolError("Malformed daemon response frame.")
        pending = self._pending.get(request_id)
        if pending is None:
            return
        if success:
            self._pending.pop(request_id, None)
            pending.future.set_result(message.get("data"))
            return

        details = message.get("errorDetails")
        if details is not None and not isinstance(details, dict):
            raise ThalwegProtocolError("response.errorDetails must be an object.")
        detail_map = cast(Mapping[str, Any], details or {})
        code = detail_map.get("code", "action_failed")
        error_message = detail_map.get("message", message.get("error"))
        retryable = detail_map.get("retryable", False)
        if not isinstance(code, str) or not isinstance(error_message, str):
            raise ThalwegProtocolError("Malformed daemon error response.")
        if not isinstance(retryable, bool):
            raise ThalwegProtocolError("response.errorDetails.retryable must be boolean.")
        self._pending.pop(request_id, None)
        pending.future.set_exception(
            ThalwegDaemonError(
                action=pending.action,
                code=code,
                message=error_message,
                retryable=retryable,
            )
        )

    def _dispatch_event(
        self, subscription_id: str, event: Mapping[str, Any]
    ) -> None:
        handler = self._event_handlers.get(subscription_id)
        if handler is not None:
            handler(event)
            return
        if subscription_id in self._ignored_subscriptions:
            return
        queued = self._orphan_events.setdefault(subscription_id, [])
        if len(queued) >= self._orphan_event_limit:
            self._orphan_overflow.add(subscription_id)
            return
        queued.append(event)

    def _abort_connection(
        self, error: BaseException, writer: asyncio.StreamWriter
    ) -> None:
        if self._writer is not writer:
            return
        self._reader = None
        self._writer = None
        self._reader_task = None
        writer.close()
        self._fail_waiters(error)

    def _fail_waiters(self, error: BaseException) -> None:
        for pending in self._pending.values():
            if not pending.future.done():
                pending.future.set_exception(error)
        self._pending.clear()
        for handler in tuple(self._event_handlers.values()):
            handler(error)
        self._event_handlers.clear()
        self._orphan_events.clear()
        self._orphan_overflow.clear()
        self._ignored_subscriptions.clear()
