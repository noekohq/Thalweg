"""Public async Thalweg client."""

from __future__ import annotations

import asyncio
import math
import uuid
from collections.abc import AsyncIterator, Mapping, Sequence
from typing import Any, Generic, Literal, TypeVar, cast

from ._transport import DaemonTransport
from .errors import (
    ThalwegBackpressureError,
    ThalwegConnectionError,
    ThalwegDaemonError,
    ThalwegProtocolError,
    ThalwegTimeoutError,
)
from .models import (
    ConflictResolution,
    DurableDelivery,
    DurableSiphon,
    EnrollmentCandidate,
    EnrollmentDecisionResult,
    EnrollmentJoinResult,
    EnrollmentListenResult,
    EnrollmentRequest,
    Event,
    EventConflict,
    JsonValue,
    MeshDialResult,
    MeshPeerStatus,
    MeshSyncResult,
    NetworkCreateResult,
    NetworkInviteResult,
    NetworkJoinResult,
    NetworkLeaveResult,
    NetworkMembership,
    NetworkStatus,
    conflict_from_data,
    conflict_resolution_from_data,
    durable_delivery_from_data,
    durable_siphon_from_data,
    enrollment_candidate_from_data,
    enrollment_offer_from_data,
    enrollment_request_from_data,
    event_from_data,
    membership_from_data,
    mesh_peer_from_data,
    mesh_sync_from_data,
    network_status_from_data,
)

PayloadT = TypeVar("PayloadT")
_END = object()


def _mapping(value: object, context: str) -> Mapping[str, Any]:
    if not isinstance(value, dict):
        raise ThalwegProtocolError(f"{context} must be a JSON object.")
    return cast(Mapping[str, Any], value)


def _list(value: object, context: str) -> list[object]:
    if not isinstance(value, list):
        raise ThalwegProtocolError(f"{context} must be a JSON array.")
    return cast(list[object], value)


def _required_string(data: Mapping[str, Any], key: str, context: str) -> str:
    value = data.get(key)
    if not isinstance(value, str):
        raise ThalwegProtocolError(f"{context}.{key} must be a string.")
    return value


def _required_bool(data: Mapping[str, Any], key: str, context: str) -> bool:
    value = data.get(key)
    if not isinstance(value, bool):
        raise ThalwegProtocolError(f"{context}.{key} must be a boolean.")
    return value


def _milliseconds(seconds: float, *, maximum: float, name: str) -> int:
    if (
        isinstance(seconds, bool)
        or not isinstance(seconds, (int, float))
        or not math.isfinite(seconds)
        or seconds < 0
        or seconds > maximum
    ):
        raise ValueError(f"{name} must be between 0 and {maximum:g} seconds.")
    return round(seconds * 1000)


class Subscription(AsyncIterator[Event[PayloadT]], Generic[PayloadT]):
    """A bounded, connection-bound iterator over future daemon events."""

    def __init__(
        self,
        transport: DaemonTransport,
        network: str,
        streams: Sequence[str],
        queue_size: int,
    ) -> None:
        self._transport = transport
        self._network = network
        self._streams = tuple(streams)
        self._queue: asyncio.Queue[object] = asyncio.Queue(maxsize=queue_size)
        self._subscription_id: str | None = None
        self._entered = False
        self._closed = False
        self._terminal_delivered = False

    @property
    def subscription_id(self) -> str:
        if self._subscription_id is None:
            raise RuntimeError("Subscription has not been entered.")
        return self._subscription_id

    async def __aenter__(self) -> "Subscription[PayloadT]":
        if self._entered:
            raise RuntimeError("Subscription context cannot be entered twice.")
        if self._closed:
            raise RuntimeError("Subscription is already closed.")
        self._entered = True
        result = _mapping(
            await self._transport.request(
                "siphon_register",
                {"network": self._network, "streams": list(self._streams)},
            ),
            "siphon_register response",
        )
        subscription_id = _required_string(
            result, "subscriptionId", "siphon_register response"
        )
        self._subscription_id = subscription_id
        self._transport.register_event_handler(subscription_id, self._receive)
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.aclose()

    def __aiter__(self) -> "Subscription[PayloadT]":
        return self

    async def __anext__(self) -> Event[PayloadT]:
        if not self._entered:
            raise RuntimeError("Enter the subscription context before iterating.")
        if self._terminal_delivered:
            raise StopAsyncIteration
        item = await self._queue.get()
        if item is _END:
            self._terminal_delivered = True
            raise StopAsyncIteration
        if isinstance(item, BaseException):
            self._terminal_delivered = True
            raise item
        return cast(Event[PayloadT], item)

    async def aclose(self) -> None:
        if self._closed:
            return
        self._closed = True
        subscription_id = self._subscription_id
        if subscription_id is not None:
            self._transport.unregister_event_handler(subscription_id)
            try:
                await self._transport.request(
                    "siphon_unregister", {"subscriptionId": subscription_id}
                )
            except ThalwegConnectionError:
                # Connection loss already destroyed the daemon-side subscription.
                pass
        self._finish(_END)

    def _receive(self, item: Mapping[str, Any] | BaseException) -> None:
        if self._closed:
            return
        if isinstance(item, BaseException):
            self._closed = True
            self._finish(item)
            return
        try:
            event = event_from_data(item, "subscription event")
            self._queue.put_nowait(event)
        except asyncio.QueueFull:
            self._closed = True
            subscription_id = self._subscription_id
            if subscription_id is not None:
                self._transport.unregister_event_handler(subscription_id)
                asyncio.create_task(self._discard_unregister(subscription_id))
            self._finish(
                ThalwegBackpressureError(
                    "Live subscription queue filled; no events were dropped silently."
                )
            )
        except BaseException as error:
            self._closed = True
            self._finish(error)

    def _finish(self, item: object) -> None:
        while not self._queue.empty():
            try:
                self._queue.get_nowait()
            except asyncio.QueueEmpty:
                break
        try:
            self._queue.put_nowait(item)
        except asyncio.QueueFull:
            pass

    async def _discard_unregister(self, subscription_id: str) -> None:
        try:
            await self._transport.request(
                "siphon_unregister", {"subscriptionId": subscription_id}
            )
        except BaseException:
            pass


class Thalweg:
    """Async client scoped to one logical Thalweg network."""

    def __init__(
        self,
        *,
        network: str,
        socket_path: str = "/tmp/thalweg.sock",
        request_timeout: float = 30.0,
        subscription_queue_size: int = 128,
        max_response_bytes: int = 64 * 1024 * 1024,
    ) -> None:
        if not network:
            raise ValueError("network must not be empty.")
        if isinstance(subscription_queue_size, bool) or not isinstance(
            subscription_queue_size, int
        ) or subscription_queue_size <= 0:
            raise ValueError("subscription_queue_size must be greater than zero.")
        self.network = network
        self.socket_path = socket_path
        self.request_timeout = request_timeout
        self.subscription_queue_size = subscription_queue_size
        self._transport = DaemonTransport(
            socket_path,
            request_timeout=request_timeout,
            max_response_bytes=max_response_bytes,
            orphan_event_limit=subscription_queue_size,
        )

    async def __aenter__(self) -> "Thalweg":
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.close()

    async def close(self) -> None:
        await self._transport.close()

    async def ingest(
        self,
        stream: str,
        payload: PayloadT,
        *,
        occurred_at: str | None = None,
        event_id: str | None = None,
    ) -> Event[PayloadT]:
        if not stream:
            raise ValueError("stream must not be empty.")
        request: dict[str, object] = {
            "network": self.network,
            "stream": stream,
            "payload": payload,
            # Generate the identity before writing so a transport timeout can
            # safely retry the same logical event instead of creating a new one.
            "eventId": event_id or f"evt_{uuid.uuid4().hex}",
        }
        if occurred_at is not None:
            request["occurredAt"] = occurred_at
        try:
            response = await self._transport.request("event_ingest", request)
        except ThalwegDaemonError as error:
            if not error.retryable:
                raise
            response = await self._transport.request("event_ingest", request)
        except (ThalwegConnectionError, ThalwegTimeoutError):
            # A commit may have succeeded before the local response was lost.
            # The preselected ID makes one retry safe and prevents duplicates.
            response = await self._transport.request("event_ingest", request)
        return cast(Event[PayloadT], event_from_data(response, "event_ingest response"))

    async def query(
        self,
        *,
        streams: Sequence[str] | None = None,
        from_: str | None = None,
        to: str | None = None,
        limit: int = 0,
        order: Literal["asc", "desc"] = "asc",
    ) -> list[Event[JsonValue]]:
        if isinstance(limit, bool) or limit < 0:
            raise ValueError("limit must not be negative.")
        if order not in ("asc", "desc"):
            raise ValueError("order must be 'asc' or 'desc'.")
        request: dict[str, object] = {
            "network": self.network,
            "streams": list(streams or ()),
            "limit": limit,
            "order": order,
        }
        if from_ is not None:
            request["from"] = from_
        if to is not None:
            request["to"] = to
        result = _list(
            await self._transport.request("event_query", request),
            "event_query response",
        )
        return [
            event_from_data(item, f"event_query response[{index}]")
            for index, item in enumerate(result)
        ]

    def subscribe(
        self,
        *,
        streams: Sequence[str] | None = None,
        queue_size: int | None = None,
    ) -> Subscription[JsonValue]:
        effective_size = self.subscription_queue_size if queue_size is None else queue_size
        if isinstance(effective_size, bool) or not isinstance(
            effective_size, int
        ) or effective_size <= 0:
            raise ValueError("queue_size must be greater than zero.")
        return Subscription(
            self._transport, self.network, tuple(streams or ()), effective_size
        )

    async def create_durable_siphon(
        self,
        name: str,
        *,
        streams: Sequence[str] | None = None,
        start: Literal["earliest", "latest"] = "earliest",
    ) -> DurableSiphon:
        if not name:
            raise ValueError("name must not be empty.")
        if start not in ("earliest", "latest"):
            raise ValueError("start must be 'earliest' or 'latest'.")
        return durable_siphon_from_data(
            await self._transport.request(
                "durable_siphon_create",
                {
                    "network": self.network,
                    "name": name,
                    "streams": list(streams or ()),
                    "start": start,
                },
            )
        )

    async def list_durable_siphons(
        self, *, network: str | None = None
    ) -> list[DurableSiphon]:
        result = _list(
            await self._transport.request(
                "durable_siphon_list", {"network": network or self.network}
            ),
            "durable_siphon_list response",
        )
        return [durable_siphon_from_data(item) for item in result]

    async def poll_durable_siphon(
        self,
        name: str,
        *,
        limit: int = 25,
        wait: float = 0.0,
    ) -> DurableDelivery[JsonValue]:
        if not name:
            raise ValueError("name must not be empty.")
        if isinstance(limit, bool) or not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100.")
        wait_millis = _milliseconds(wait, maximum=25.0, name="wait")
        timeout = max(self.request_timeout, wait + 5.0)
        return durable_delivery_from_data(
            await self._transport.request(
                "durable_siphon_poll",
                {
                    "network": self.network,
                    "name": name,
                    "limit": limit,
                    "waitMillis": wait_millis,
                },
                timeout=timeout,
            )
        )

    async def acknowledge_durable_siphon(
        self, name: str, delivery_id: str
    ) -> DurableSiphon:
        if not name or not delivery_id:
            raise ValueError("name and delivery_id must not be empty.")
        return durable_siphon_from_data(
            await self._transport.request(
                "durable_siphon_ack",
                {
                    "network": self.network,
                    "name": name,
                    "deliveryId": delivery_id,
                },
            )
        )

    async def network_status(self) -> NetworkStatus:
        return network_status_from_data(
            await self._transport.request("network_status", {})
        )

    async def create_network(self, name: str) -> NetworkCreateResult:
        data = _mapping(
            await self._transport.request("network_create", {"name": name}),
            "network_create response",
        )
        return NetworkCreateResult(
            membership=membership_from_data(
                data.get("membership"), "network_create response.membership"
            ),
            invitation=_required_string(data, "invitation", "network_create response"),
        )

    async def invite_network(self, name: str) -> NetworkInviteResult:
        data = _mapping(
            await self._transport.request("network_invite", {"name": name}),
            "network_invite response",
        )
        mode = _required_string(data, "credentialMode", "network_invite response")
        if mode != "shared-bearer":
            raise ThalwegProtocolError(f"Unsupported credential mode {mode!r}.")
        return NetworkInviteResult(
            membership=membership_from_data(
                data.get("membership"), "network_invite response.membership"
            ),
            invitation=_required_string(data, "invitation", "network_invite response"),
        )

    async def join_network(self, invitation: str) -> NetworkJoinResult:
        data = _mapping(
            await self._transport.request(
                "network_join", {"invitation": invitation}
            ),
            "network_join response",
        )
        return NetworkJoinResult(
            membership=membership_from_data(
                data.get("membership"), "network_join response.membership"
            ),
            joined=_required_bool(data, "joined", "network_join response"),
        )

    async def list_networks(self) -> list[NetworkMembership]:
        result = _list(
            await self._transport.request("network_list", {}),
            "network_list response",
        )
        return [membership_from_data(item) for item in result]

    async def leave_network(self, name: str) -> NetworkLeaveResult:
        data = _mapping(
            await self._transport.request("network_leave", {"name": name}),
            "network_leave response",
        )
        return NetworkLeaveResult(
            membership=membership_from_data(
                data.get("membership"), "network_leave response.membership"
            ),
            left=_required_bool(data, "left", "network_leave response"),
        )

    async def open_enrollment(
        self, *, network: str | None = None, duration: int = 600
    ) -> EnrollmentListenResult:
        if (
            isinstance(duration, bool)
            or not isinstance(duration, int)
            or not 1 <= duration <= 3600
        ):
            raise ValueError("duration must be between 1 and 3600 seconds.")
        data = _mapping(
            await self._transport.request(
                "enrollment_listen",
                {
                    "network": network or self.network,
                    "durationSeconds": duration,
                },
            ),
            "enrollment_listen response",
        )
        addresses = data.get("addresses")
        if not isinstance(addresses, list) or any(
            not isinstance(item, str) for item in addresses
        ):
            raise ThalwegProtocolError(
                "enrollment_listen response.addresses must be an array of strings."
            )
        return EnrollmentListenResult(
            offer=enrollment_offer_from_data(
                data.get("offer"), "enrollment_listen response.offer"
            ),
            addresses=tuple(addresses),
        )

    async def close_enrollment(self, offer_id: str) -> bool:
        data = _mapping(
            await self._transport.request(
                "enrollment_close", {"offerId": offer_id}
            ),
            "enrollment_close response",
        )
        return _required_bool(data, "removed", "enrollment_close response")

    async def list_enrollment_requests(
        self, *, network: str | None = None
    ) -> list[EnrollmentRequest]:
        result = _list(
            await self._transport.request(
                "enrollment_requests", {"network": network or self.network}
            ),
            "enrollment_requests response",
        )
        return [enrollment_request_from_data(item) for item in result]

    async def decide_enrollment(
        self, request_id: str, accepted: bool
    ) -> EnrollmentDecisionResult:
        if not isinstance(accepted, bool):
            raise TypeError("accepted must be a bool.")
        action = "enrollment_approve" if accepted else "enrollment_deny"
        data = _mapping(
            await self._transport.request(action, {"requestId": request_id}),
            f"{action} response",
        )
        return EnrollmentDecisionResult(
            request_id=_required_string(data, "requestId", f"{action} response"),
            accepted=_required_bool(data, "accepted", f"{action} response"),
        )

    async def discover_enrollments(
        self, *, target_addr: str | None = None, wait: float = 2.5
    ) -> list[EnrollmentCandidate]:
        wait_millis = _milliseconds(wait, maximum=10.0, name="wait")
        payload: dict[str, object] = {"waitMillis": wait_millis}
        if target_addr is not None:
            payload["targetAddr"] = target_addr
        result = _list(
            await self._transport.request(
                "enrollment_discover",
                payload,
                timeout=max(self.request_timeout, wait + 5.0),
            ),
            "enrollment_discover response",
        )
        return [enrollment_candidate_from_data(item) for item in result]

    async def request_enrollment(
        self,
        candidate: EnrollmentCandidate,
        device_name: str,
        *,
        timeout: float | None = None,
    ) -> EnrollmentJoinResult:
        effective_timeout = max(self.request_timeout, 905.0) if timeout is None else timeout
        data = _mapping(
            await self._transport.request(
                "enrollment_join",
                {
                    "targetAddr": candidate.target_addr,
                    "offerId": candidate.offer.id,
                    "deviceName": device_name,
                },
                timeout=effective_timeout,
            ),
            "enrollment_join response",
        )
        return EnrollmentJoinResult(
            membership=membership_from_data(
                data.get("membership"), "enrollment_join response.membership"
            ),
            joined=_required_bool(data, "joined", "enrollment_join response"),
            peer_id=_required_string(data, "peerId", "enrollment_join response"),
            sync=mesh_sync_from_data(data.get("sync"), "enrollment_join response.sync"),
        )

    async def dial_mesh_peer(
        self, target_addr: str, *, network: str | None = None
    ) -> MeshDialResult:
        data = _mapping(
            await self._transport.request(
                "mesh_dial",
                {"targetAddr": target_addr, "network": network or self.network},
            ),
            "mesh_dial response",
        )
        return MeshDialResult(
            peer_id=_required_string(data, "peerId", "mesh_dial response"),
            network=membership_from_data(
                data.get("network"), "mesh_dial response.network"
            ),
            authorized=_required_bool(data, "authorized", "mesh_dial response"),
        )

    async def sync_mesh_peer(
        self, target_addr: str, *, network: str | None = None
    ) -> MeshSyncResult:
        return mesh_sync_from_data(
            await self._transport.request(
                "mesh_sync",
                {"targetAddr": target_addr, "network": network or self.network},
                timeout=max(self.request_timeout, 35.0),
            )
        )

    async def list_mesh_peers(
        self, *, network: str | None = None
    ) -> list[MeshPeerStatus]:
        result = _list(
            await self._transport.request(
                "mesh_peer_list", {"network": network or self.network}
            ),
            "mesh_peer_list response",
        )
        return [mesh_peer_from_data(item) for item in result]

    async def list_conflicts(
        self, *, network: str | None = None
    ) -> list[EventConflict]:
        result = _list(
            await self._transport.request(
                "event_conflict_list", {"network": network or self.network}
            ),
            "event_conflict_list response",
        )
        return [conflict_from_data(item) for item in result]

    async def resolve_conflict(
        self,
        event_id: str,
        *,
        network: str | None = None,
        strategy: Literal["preserve-both"] = "preserve-both",
    ) -> ConflictResolution[JsonValue]:
        if strategy != "preserve-both":
            raise ValueError("strategy must be 'preserve-both'.")
        return conflict_resolution_from_data(
            await self._transport.request(
                "event_conflict_resolve",
                {
                    "network": network or self.network,
                    "eventId": event_id,
                    "strategy": strategy,
                },
            )
        )
