from __future__ import annotations

import asyncio
import json
import unittest

from thalweg import (
    ThalwegConnectionError,
    ThalwegDaemonError,
    ThalwegProtocolError,
    ThalwegTimeoutError,
)
from thalweg._transport import DaemonTransport

from .helpers import FakeDaemon, send_response


class TransportTests(unittest.IsolatedAsyncioTestCase):
    async def test_correlates_concurrent_out_of_order_responses(self) -> None:
        received: list[tuple[dict[str, object], asyncio.StreamWriter]] = []
        ready = asyncio.Event()

        async def handler(request, _reader, writer):
            received.append((request, writer))
            if len(received) == 2:
                await send_response(received[1][1], received[1][0], {"value": 2})
                await send_response(received[0][1], received[0][0], {"value": 1})
                ready.set()

        async with FakeDaemon(handler) as daemon:
            transport = DaemonTransport(daemon.socket_path)
            first = asyncio.create_task(transport.request("first", {}))
            second = asyncio.create_task(transport.request("second", {}))
            await asyncio.wait_for(ready.wait(), 1)
            self.assertEqual(await first, {"value": 1})
            self.assertEqual(await second, {"value": 2})
            self.assertEqual(received[0][0]["protocolVersion"], 1)
            await transport.close()

    async def test_exposes_structured_and_legacy_daemon_errors(self) -> None:
        async def handler(request, _reader, writer):
            if request["action"] == "structured":
                await send_response(
                    writer,
                    request,
                    success=False,
                    error="fallback",
                    error_details={
                        "code": "unavailable",
                        "message": "try later",
                        "retryable": True,
                    },
                )
            else:
                await send_response(
                    writer, request, success=False, error="legacy failure"
                )

        async with FakeDaemon(handler) as daemon:
            transport = DaemonTransport(daemon.socket_path)
            with self.assertRaises(ThalwegDaemonError) as raised:
                await transport.request("structured", {})
            self.assertEqual(raised.exception.action, "structured")
            self.assertEqual(raised.exception.code, "unavailable")
            self.assertTrue(raised.exception.retryable)

            with self.assertRaises(ThalwegDaemonError) as legacy:
                await transport.request("legacy", {})
            self.assertEqual(legacy.exception.code, "action_failed")
            self.assertFalse(legacy.exception.retryable)
            await transport.close()

    async def test_timeout_ignores_late_response_and_keeps_socket_usable(self) -> None:
        async def handler(request, _reader, writer):
            if request["action"] == "slow":
                await asyncio.sleep(0.05)
                await send_response(writer, request, "late")
            else:
                await send_response(writer, request, "next")

        async with FakeDaemon(handler) as daemon:
            transport = DaemonTransport(daemon.socket_path, request_timeout=0.01)
            with self.assertRaises(ThalwegTimeoutError):
                await transport.request("slow", {})
            await asyncio.sleep(0.06)
            self.assertEqual(
                await transport.request("fast", {}, timeout=0.2), "next"
            )
            await transport.close()

    async def test_cancellation_ignores_late_response(self) -> None:
        async def handler(request, _reader, writer):
            if request["action"] == "cancelled":
                await asyncio.sleep(0.02)
                await send_response(writer, request, "late")
            else:
                await send_response(writer, request, "still-usable")

        async with FakeDaemon(handler) as daemon:
            transport = DaemonTransport(daemon.socket_path)
            task = asyncio.create_task(transport.request("cancelled", {}))
            await asyncio.sleep(0)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
            await asyncio.sleep(0.03)
            self.assertEqual(await transport.request("next", {}), "still-usable")
            await transport.close()

    async def test_malformed_json_fails_connection(self) -> None:
        async def handler(_request, _reader, writer):
            writer.write(b"{not-json}\n")
            await writer.drain()

        async with FakeDaemon(handler) as daemon:
            transport = DaemonTransport(daemon.socket_path)
            with self.assertRaises(ThalwegProtocolError):
                await transport.request("malformed", {})
            await transport.close()

    async def test_rejects_request_larger_than_daemon_limit(self) -> None:
        async def handler(request, _reader, writer):
            await send_response(writer, request, {})

        async with FakeDaemon(handler) as daemon:
            transport = DaemonTransport(daemon.socket_path)
            with self.assertRaisesRegex(ValueError, "1 MiB"):
                await transport.request("large", {"blob": "x" * (1024 * 1024)})
            self.assertEqual(daemon.requests, [])
            await transport.close()

    async def test_protocol_mismatch_fails_request_and_allows_new_connection(self) -> None:
        attempts = 0

        async def handler(request, _reader, writer):
            nonlocal attempts
            attempts += 1
            if attempts == 1:
                writer.write(
                    json.dumps(
                        {
                            "id": request["id"],
                            "protocolVersion": 99,
                            "success": True,
                            "data": {},
                        }
                    ).encode()
                    + b"\n"
                )
                await writer.drain()
            else:
                await send_response(writer, request, "reconnected")

        async with FakeDaemon(handler) as daemon:
            transport = DaemonTransport(daemon.socket_path)
            with self.assertRaises(ThalwegProtocolError):
                await transport.request("bad", {})
            self.assertEqual(await transport.request("good", {}), "reconnected")
            await transport.close()

    async def test_explicit_close_is_terminal(self) -> None:
        async def handler(request, _reader, writer):
            await send_response(writer, request, {})

        async with FakeDaemon(handler) as daemon:
            transport = DaemonTransport(daemon.socket_path)
            await transport.request("one", {})
            await transport.close()
            await transport.close()
            with self.assertRaises(ThalwegConnectionError):
                await transport.request("two", {})


if __name__ == "__main__":
    unittest.main()
