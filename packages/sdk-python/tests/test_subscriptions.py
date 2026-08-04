from __future__ import annotations

import asyncio
import json
import unittest

from thalweg import Thalweg, ThalwegBackpressureError

from .helpers import FakeDaemon, event_data, send_response


class SubscriptionTests(unittest.IsolatedAsyncioTestCase):
    async def test_registration_race_routes_event_and_unregisters(self) -> None:
        async def handler(request, _reader, writer):
            if request["action"] == "siphon_register":
                await send_response(writer, request, {"subscriptionId": "sub-1"})
                writer.write(
                    json.dumps(
                        {
                            "type": "event",
                            "protocolVersion": 1,
                            "subscriptionId": "sub-1",
                            "event": event_data(),
                        }
                    ).encode()
                    + b"\n"
                )
                await writer.drain()
            else:
                await send_response(writer, request, {"removed": True})

        async with FakeDaemon(handler) as daemon:
            async with Thalweg(
                socket_path=daemon.socket_path, network="personal"
            ) as client:
                async with client.subscribe(streams=["user:note"]) as events:
                    event = await asyncio.wait_for(anext(events), 1)
                    self.assertEqual(event.id, "evt_1")
            self.assertEqual(daemon.requests[-1]["action"], "siphon_unregister")

    async def test_queue_overflow_is_observable(self) -> None:
        async def handler(request, _reader, writer):
            if request["action"] == "siphon_register":
                await send_response(writer, request, {"subscriptionId": "sub-1"})
                for index in range(3):
                    writer.write(
                        json.dumps(
                            {
                                "type": "event",
                                "protocolVersion": 1,
                                "subscriptionId": "sub-1",
                                "event": event_data(event_id=f"evt_{index}"),
                            }
                        ).encode()
                        + b"\n"
                    )
                await writer.drain()
            else:
                await send_response(writer, request, {"removed": True})

        async with FakeDaemon(handler) as daemon:
            async with Thalweg(
                socket_path=daemon.socket_path,
                network="personal",
                subscription_queue_size=1,
            ) as client:
                subscription = client.subscribe()
                await subscription.__aenter__()
                await asyncio.sleep(0)
                with self.assertRaises(ThalwegBackpressureError):
                    await asyncio.wait_for(anext(subscription), 1)
                await subscription.aclose()


if __name__ == "__main__":
    unittest.main()

