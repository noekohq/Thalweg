from __future__ import annotations

import unittest

from thalweg import Thalweg

from .helpers import FakeDaemon, event_data, send_response


class ClientTests(unittest.IsolatedAsyncioTestCase):
    async def test_ingest_and_query_map_fields_and_preserve_nanoseconds(self) -> None:
        async def handler(request, _reader, writer):
            if request["action"] == "event_ingest":
                await send_response(
                    writer,
                    request,
                    event_data(payload=request["payload"]["payload"]),
                )
            elif request["action"] == "event_query":
                await send_response(writer, request, [event_data()])

        async with FakeDaemon(handler) as daemon:
            async with Thalweg(
                socket_path=daemon.socket_path, network="personal"
            ) as client:
                ingested = await client.ingest(
                    "user:note",
                    {"content": "hello"},
                    occurred_at="2026-08-03T12:00:00Z",
                    event_id="stable-id",
                )
                self.assertEqual(
                    ingested.inserted_at, "2026-08-03T12:00:00.123456790Z"
                )
                queried = await client.query(
                    streams=["user:note"], from_="from", to="to", limit=5, order="desc"
                )
                self.assertEqual(queried[0].payload, {"content": "hello"})

            ingest_request = daemon.requests[0]
            self.assertEqual(ingest_request["payload"]["eventId"], "stable-id")
            query_request = daemon.requests[1]
            self.assertEqual(query_request["payload"]["from"], "from")
            self.assertEqual(query_request["payload"]["order"], "desc")

    async def test_durable_methods_map_python_seconds_and_models(self) -> None:
        definition = {
            "version": 1,
            "name": "archive",
            "network": "personal",
            "streams": ["user:note"],
            "cursor": 0,
            "createdAt": "created",
            "updatedAt": "updated",
            "pendingCount": 0,
            "pendingAttempts": 0,
        }

        async def handler(request, _reader, writer):
            action = request["action"]
            if action in ("durable_siphon_create", "durable_siphon_ack"):
                await send_response(writer, request, definition)
            elif action == "durable_siphon_list":
                await send_response(writer, request, [definition])
            elif action == "durable_siphon_poll":
                await send_response(
                    writer,
                    request,
                    {
                        "version": 1,
                        "name": "archive",
                        "network": "personal",
                        "cursorFrom": 0,
                        "cursorThrough": 1,
                        "deliveryId": "delivery-1",
                        "attempt": 1,
                        "events": [event_data()],
                    },
                )

        async with FakeDaemon(handler) as daemon:
            async with Thalweg(
                socket_path=daemon.socket_path, network="personal"
            ) as client:
                created = await client.create_durable_siphon(
                    "archive", streams=["user:note"]
                )
                self.assertEqual(created.streams, ("user:note",))
                self.assertEqual(len(await client.list_durable_siphons()), 1)
                delivery = await client.poll_durable_siphon("archive", wait=0.125)
                self.assertEqual(delivery.delivery_id, "delivery-1")
                await client.acknowledge_durable_siphon("archive", "delivery-1")

            poll = next(
                request
                for request in daemon.requests
                if request["action"] == "durable_siphon_poll"
            )
            self.assertEqual(poll["payload"]["waitMillis"], 125)

    async def test_invitation_is_redacted_from_result_repr(self) -> None:
        async def handler(request, _reader, writer):
            await send_response(
                writer,
                request,
                {
                    "membership": {"name": "home", "id": "network-id"},
                    "invitation": "thalweg1:super-secret",
                },
            )

        async with FakeDaemon(handler) as daemon:
            async with Thalweg(
                socket_path=daemon.socket_path, network="personal"
            ) as client:
                result = await client.create_network("home")
                self.assertNotIn("super-secret", repr(result))
                self.assertEqual(result.invitation, "thalweg1:super-secret")


if __name__ == "__main__":
    unittest.main()

