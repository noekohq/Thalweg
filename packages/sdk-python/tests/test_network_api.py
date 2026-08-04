from __future__ import annotations

import unittest

from thalweg import EnrollmentCandidate, EnrollmentOffer, NetworkMembership, Thalweg

from .helpers import FakeDaemon, event_data, send_response


MEMBERSHIP = {"name": "home", "id": "network-id"}
SYNC = {
    "peerId": "peer-1",
    "network": MEMBERSHIP,
    "inventoried": 4,
    "pushed": 1,
    "pulled": 2,
    "duplicates": 1,
    "conflicts": ["event-collision"],
}


class NetworkApiTests(unittest.IsolatedAsyncioTestCase):
    async def test_status_membership_enrollment_mesh_and_conflict_actions(self) -> None:
        async def handler(request, _reader, writer):
            action = request["action"]
            responses = {
                "network_status": {
                    "peerId": "peer-1",
                    "deviceId": "device-1",
                    "addresses": ["/ip4/127.0.0.1/tcp/1/p2p/peer-1"],
                    "addressGroups": {
                        "loopback": ["/ip4/127.0.0.1/tcp/1/p2p/peer-1"],
                        "lan": [],
                        "public": [],
                        "other": [],
                    },
                    "daemonVersion": "0.1.0-dev",
                    "protocolVersion": 1,
                    "storageSchemaVersion": 4,
                    "meshProtocolVersion": 1,
                    "membershipFileVersion": 1,
                },
                "network_create": {
                    "membership": MEMBERSHIP,
                    "invitation": "thalweg1:secret",
                },
                "network_invite": {
                    "membership": MEMBERSHIP,
                    "invitation": "thalweg1:secret",
                    "credentialMode": "shared-bearer",
                },
                "network_join": {"membership": MEMBERSHIP, "joined": True},
                "network_list": [MEMBERSHIP],
                "network_leave": {"membership": MEMBERSHIP, "left": True},
                "enrollment_listen": {
                    "offer": {
                        "id": "offer-1",
                        "network": MEMBERSHIP,
                        "expiresAt": "expires",
                    },
                    "addresses": ["target"],
                },
                "enrollment_close": {"removed": True},
                "enrollment_requests": [
                    {
                        "id": "request-1",
                        "network": MEMBERSHIP,
                        "peerId": "peer-2",
                        "deviceName": "Laptop",
                        "requestedAt": "requested",
                        "expiresAt": "expires",
                    }
                ],
                "enrollment_approve": {"requestId": "request-1", "accepted": True},
                "enrollment_deny": {"requestId": "request-1", "accepted": False},
                "enrollment_discover": [
                    {
                        "peerId": "peer-2",
                        "targetAddr": "target",
                        "offer": {
                            "id": "offer-1",
                            "network": MEMBERSHIP,
                            "expiresAt": "expires",
                        },
                    }
                ],
                "enrollment_join": {
                    "membership": MEMBERSHIP,
                    "joined": True,
                    "peerId": "peer-2",
                    "sync": {**SYNC, "peerId": "peer-2"},
                },
                "mesh_dial": {
                    "peerId": "peer-2",
                    "network": MEMBERSHIP,
                    "authorized": True,
                },
                "mesh_sync": {**SYNC, "peerId": "peer-2"},
                "mesh_peer_list": [
                    {
                        "network": MEMBERSHIP,
                        "peerId": "peer-2",
                        "address": "target",
                        "state": "healthy",
                        "connected": True,
                        "consecutiveFailures": 0,
                        "lastResult": {**SYNC, "peerId": "peer-2"},
                    }
                ],
                "event_conflict_list": [
                    {
                        "network": "home",
                        "eventId": "event-collision",
                        "localDigest": "local",
                        "remoteDigests": ["remote"],
                        "firstObservedAt": "observed",
                        "resolved": False,
                    }
                ],
                "event_conflict_resolve": {
                    "network": "home",
                    "eventId": "event-collision",
                    "strategy": "preserve-both",
                    "resolutionEvent": event_data(stream="system:conflict_resolution"),
                    "recoveredEvent": event_data(event_id="recovered"),
                    "alreadyResolved": False,
                },
            }
            await send_response(writer, request, responses[action])

        candidate = EnrollmentCandidate(
            peer_id="peer-2",
            target_addr="target",
            offer=EnrollmentOffer(
                id="offer-1",
                network=NetworkMembership(name="home", id="network-id"),
                expires_at="expires",
            ),
        )
        async with FakeDaemon(handler) as daemon:
            async with Thalweg(
                socket_path=daemon.socket_path, network="home"
            ) as client:
                self.assertEqual((await client.network_status()).storage_schema_version, 4)
                self.assertEqual(
                    (await client.create_network("home")).membership.name, "home"
                )
                self.assertEqual(
                    (await client.invite_network("home")).credential_mode,
                    "shared-bearer",
                )
                self.assertTrue(
                    (await client.join_network("thalweg1:secret")).joined
                )
                self.assertEqual(len(await client.list_networks()), 1)
                self.assertTrue((await client.leave_network("home")).left)
                self.assertEqual((await client.open_enrollment()).offer.id, "offer-1")
                self.assertTrue(await client.close_enrollment("offer-1"))
                self.assertEqual(
                    (await client.list_enrollment_requests())[0].device_name,
                    "Laptop",
                )
                self.assertTrue((await client.decide_enrollment("request-1", True)).accepted)
                self.assertFalse((await client.decide_enrollment("request-1", False)).accepted)
                self.assertEqual(
                    (await client.discover_enrollments(wait=0))[0].peer_id,
                    "peer-2",
                )
                self.assertEqual(
                    (await client.request_enrollment(candidate, "Laptop", timeout=1)).peer_id,
                    "peer-2",
                )
                self.assertTrue((await client.dial_mesh_peer("target")).authorized)
                self.assertEqual((await client.sync_mesh_peer("target")).pulled, 2)
                self.assertEqual((await client.list_mesh_peers())[0].state, "healthy")
                self.assertEqual((await client.list_conflicts())[0].remote_digests, ("remote",))
                self.assertEqual(
                    (await client.resolve_conflict("event-collision")).recovered_event.id,
                    "recovered",
                )

        actions = [request["action"] for request in daemon.requests]
        self.assertIn("enrollment_approve", actions)
        self.assertIn("enrollment_deny", actions)
        self.assertEqual(
            next(
                request["payload"]
                for request in daemon.requests
                if request["action"] == "event_conflict_resolve"
            )["strategy"],
            "preserve-both",
        )


if __name__ == "__main__":
    unittest.main()
