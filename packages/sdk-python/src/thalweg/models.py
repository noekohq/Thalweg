"""Typed public result models and strict protocol decoders."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Generic, Literal, Mapping, TypeAlias, TypeVar, cast

from .errors import ThalwegProtocolError

JsonScalar: TypeAlias = None | bool | int | float | str
JsonValue: TypeAlias = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]
PayloadT = TypeVar("PayloadT")


def _object(value: object, context: str) -> Mapping[str, Any]:
    if not isinstance(value, dict):
        raise ThalwegProtocolError(f"{context} must be a JSON object.")
    return cast(Mapping[str, Any], value)


def _string(data: Mapping[str, Any], key: str, context: str) -> str:
    value = data.get(key)
    if not isinstance(value, str):
        raise ThalwegProtocolError(f"{context}.{key} must be a string.")
    return value


def _optional_string(data: Mapping[str, Any], key: str, context: str) -> str | None:
    value = data.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise ThalwegProtocolError(f"{context}.{key} must be a string.")
    return value


def _integer(data: Mapping[str, Any], key: str, context: str) -> int:
    value = data.get(key)
    if isinstance(value, bool) or not isinstance(value, int):
        raise ThalwegProtocolError(f"{context}.{key} must be an integer.")
    return value


def _boolean(data: Mapping[str, Any], key: str, context: str) -> bool:
    value = data.get(key)
    if not isinstance(value, bool):
        raise ThalwegProtocolError(f"{context}.{key} must be a boolean.")
    return value


def _strings(data: Mapping[str, Any], key: str, context: str) -> tuple[str, ...]:
    value = data.get(key)
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise ThalwegProtocolError(f"{context}.{key} must be an array of strings.")
    return tuple(value)


def _optional_strings(
    data: Mapping[str, Any], key: str, context: str
) -> tuple[str, ...]:
    if key not in data or data[key] is None:
        return ()
    return _strings(data, key, context)


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


def event_from_data(value: object, context: str = "event") -> Event[Any]:
    data = _object(value, context)
    if "payload" not in data:
        raise ThalwegProtocolError(f"{context}.payload is required.")
    return Event(
        id=_string(data, "id", context),
        network=_string(data, "network", context),
        stream=_string(data, "stream", context),
        occurred_at=_string(data, "occurredAt", context),
        inserted_at=_string(data, "insertedAt", context),
        propagated_at=_string(data, "propagatedAt", context),
        counter=_integer(data, "counter", context),
        device_id=_string(data, "deviceId", context),
        payload=data["payload"],
    )


@dataclass(frozen=True, slots=True)
class DurableSiphon:
    version: int
    name: str
    network: str
    streams: tuple[str, ...]
    cursor: int
    created_at: str
    updated_at: str
    pending_delivery_id: str | None
    pending_count: int
    pending_attempts: int


def durable_siphon_from_data(value: object) -> DurableSiphon:
    data = _object(value, "durable siphon")
    return DurableSiphon(
        version=_integer(data, "version", "durable siphon"),
        name=_string(data, "name", "durable siphon"),
        network=_string(data, "network", "durable siphon"),
        streams=_strings(data, "streams", "durable siphon"),
        cursor=_integer(data, "cursor", "durable siphon"),
        created_at=_string(data, "createdAt", "durable siphon"),
        updated_at=_string(data, "updatedAt", "durable siphon"),
        pending_delivery_id=_optional_string(
            data, "pendingDeliveryId", "durable siphon"
        ),
        pending_count=_integer(data, "pendingCount", "durable siphon"),
        pending_attempts=_integer(data, "pendingAttempts", "durable siphon"),
    )


@dataclass(frozen=True, slots=True)
class DurableDelivery(Generic[PayloadT]):
    version: int
    name: str
    network: str
    delivery_id: str | None
    cursor_from: int
    cursor_through: int
    attempt: int
    events: list[Event[PayloadT]]


def durable_delivery_from_data(value: object) -> DurableDelivery[Any]:
    data = _object(value, "durable delivery")
    raw_events = data.get("events")
    if not isinstance(raw_events, list):
        raise ThalwegProtocolError("durable delivery.events must be an array.")
    return DurableDelivery(
        version=_integer(data, "version", "durable delivery"),
        name=_string(data, "name", "durable delivery"),
        network=_string(data, "network", "durable delivery"),
        delivery_id=_optional_string(data, "deliveryId", "durable delivery"),
        cursor_from=_integer(data, "cursorFrom", "durable delivery"),
        cursor_through=_integer(data, "cursorThrough", "durable delivery"),
        attempt=_integer(data, "attempt", "durable delivery"),
        events=[
            event_from_data(item, f"durable delivery.events[{index}]")
            for index, item in enumerate(raw_events)
        ],
    )


@dataclass(frozen=True, slots=True)
class NetworkMembership:
    name: str
    id: str


def membership_from_data(value: object, context: str = "membership") -> NetworkMembership:
    data = _object(value, context)
    return NetworkMembership(
        name=_string(data, "name", context), id=_string(data, "id", context)
    )


@dataclass(frozen=True, slots=True)
class NetworkStatus:
    peer_id: str
    device_id: str
    addresses: tuple[str, ...]
    address_groups: Mapping[str, tuple[str, ...]]
    daemon_version: str
    protocol_version: int
    storage_schema_version: int
    mesh_protocol_version: int
    membership_file_version: int


def network_status_from_data(value: object) -> NetworkStatus:
    data = _object(value, "network status")
    raw_groups = _object(data.get("addressGroups"), "network status.addressGroups")
    groups = {
        key: _strings(raw_groups, key, "network status.addressGroups")
        for key in raw_groups
        if isinstance(key, str)
    }
    return NetworkStatus(
        peer_id=_string(data, "peerId", "network status"),
        device_id=_string(data, "deviceId", "network status"),
        addresses=_strings(data, "addresses", "network status"),
        address_groups=groups,
        daemon_version=_string(data, "daemonVersion", "network status"),
        protocol_version=_integer(data, "protocolVersion", "network status"),
        storage_schema_version=_integer(
            data, "storageSchemaVersion", "network status"
        ),
        mesh_protocol_version=_integer(data, "meshProtocolVersion", "network status"),
        membership_file_version=_integer(
            data, "membershipFileVersion", "network status"
        ),
    )


@dataclass(frozen=True, slots=True)
class NetworkCreateResult:
    membership: NetworkMembership
    invitation: str = field(repr=False)


@dataclass(frozen=True, slots=True)
class NetworkInviteResult:
    membership: NetworkMembership
    invitation: str = field(repr=False)
    credential_mode: Literal["shared-bearer"] = "shared-bearer"


@dataclass(frozen=True, slots=True)
class NetworkJoinResult:
    membership: NetworkMembership
    joined: bool


@dataclass(frozen=True, slots=True)
class NetworkLeaveResult:
    membership: NetworkMembership
    left: bool


@dataclass(frozen=True, slots=True)
class MeshSyncResult:
    peer_id: str
    network: NetworkMembership
    inventoried: int
    pushed: int
    pulled: int
    duplicates: int
    conflicts: tuple[str, ...] = ()


def mesh_sync_from_data(value: object, context: str = "mesh sync") -> MeshSyncResult:
    data = _object(value, context)
    return MeshSyncResult(
        peer_id=_string(data, "peerId", context),
        network=membership_from_data(data.get("network"), f"{context}.network"),
        inventoried=_integer(data, "inventoried", context),
        pushed=_integer(data, "pushed", context),
        pulled=_integer(data, "pulled", context),
        duplicates=_integer(data, "duplicates", context),
        conflicts=_optional_strings(data, "conflicts", context),
    )


@dataclass(frozen=True, slots=True)
class MeshDialResult:
    peer_id: str
    network: NetworkMembership
    authorized: bool


@dataclass(frozen=True, slots=True)
class MeshPeerStatus:
    network: NetworkMembership
    peer_id: str
    address: str
    state: str
    connected: bool
    last_attempt_at: str | None
    last_success_at: str | None
    last_error: str | None
    next_attempt_at: str | None
    consecutive_failures: int
    last_result: MeshSyncResult | None


def mesh_peer_from_data(value: object) -> MeshPeerStatus:
    data = _object(value, "mesh peer")
    raw_last = data.get("lastResult")
    return MeshPeerStatus(
        network=membership_from_data(data.get("network"), "mesh peer.network"),
        peer_id=_string(data, "peerId", "mesh peer"),
        address=_string(data, "address", "mesh peer"),
        state=_string(data, "state", "mesh peer"),
        connected=_boolean(data, "connected", "mesh peer"),
        last_attempt_at=_optional_string(data, "lastAttemptAt", "mesh peer"),
        last_success_at=_optional_string(data, "lastSuccessAt", "mesh peer"),
        last_error=_optional_string(data, "lastError", "mesh peer"),
        next_attempt_at=_optional_string(data, "nextAttemptAt", "mesh peer"),
        consecutive_failures=_integer(data, "consecutiveFailures", "mesh peer"),
        last_result=(
            mesh_sync_from_data(raw_last, "mesh peer.lastResult")
            if raw_last is not None
            else None
        ),
    )


@dataclass(frozen=True, slots=True)
class EnrollmentOffer:
    id: str
    network: NetworkMembership
    expires_at: str


def enrollment_offer_from_data(
    value: object, context: str = "enrollment offer"
) -> EnrollmentOffer:
    data = _object(value, context)
    return EnrollmentOffer(
        id=_string(data, "id", context),
        network=membership_from_data(data.get("network"), f"{context}.network"),
        expires_at=_string(data, "expiresAt", context),
    )


@dataclass(frozen=True, slots=True)
class EnrollmentCandidate:
    peer_id: str
    target_addr: str
    offer: EnrollmentOffer


def enrollment_candidate_from_data(value: object) -> EnrollmentCandidate:
    data = _object(value, "enrollment candidate")
    return EnrollmentCandidate(
        peer_id=_string(data, "peerId", "enrollment candidate"),
        target_addr=_string(data, "targetAddr", "enrollment candidate"),
        offer=enrollment_offer_from_data(
            data.get("offer"), "enrollment candidate.offer"
        ),
    )


@dataclass(frozen=True, slots=True)
class EnrollmentRequest:
    id: str
    network: NetworkMembership
    peer_id: str
    device_name: str
    requested_at: str
    expires_at: str


def enrollment_request_from_data(value: object) -> EnrollmentRequest:
    data = _object(value, "enrollment request")
    return EnrollmentRequest(
        id=_string(data, "id", "enrollment request"),
        network=membership_from_data(data.get("network"), "enrollment request.network"),
        peer_id=_string(data, "peerId", "enrollment request"),
        device_name=_string(data, "deviceName", "enrollment request"),
        requested_at=_string(data, "requestedAt", "enrollment request"),
        expires_at=_string(data, "expiresAt", "enrollment request"),
    )


@dataclass(frozen=True, slots=True)
class EnrollmentListenResult:
    offer: EnrollmentOffer
    addresses: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class EnrollmentDecisionResult:
    request_id: str
    accepted: bool


@dataclass(frozen=True, slots=True)
class EnrollmentJoinResult:
    membership: NetworkMembership
    joined: bool
    peer_id: str
    sync: MeshSyncResult


@dataclass(frozen=True, slots=True)
class EventConflict:
    network: str
    event_id: str
    local_digest: str
    remote_digests: tuple[str, ...]
    first_observed_at: str
    resolved: bool
    resolution_event_ids: tuple[str, ...]
    recovered_event_id: str | None


def conflict_from_data(value: object) -> EventConflict:
    data = _object(value, "event conflict")
    return EventConflict(
        network=_string(data, "network", "event conflict"),
        event_id=_string(data, "eventId", "event conflict"),
        local_digest=_string(data, "localDigest", "event conflict"),
        remote_digests=_strings(data, "remoteDigests", "event conflict"),
        first_observed_at=_string(data, "firstObservedAt", "event conflict"),
        resolved=_boolean(data, "resolved", "event conflict"),
        resolution_event_ids=_optional_strings(
            data, "resolutionEventIds", "event conflict"
        ),
        recovered_event_id=_optional_string(
            data, "recoveredEventId", "event conflict"
        ),
    )


@dataclass(frozen=True, slots=True)
class ConflictResolution(Generic[PayloadT]):
    network: str
    event_id: str
    strategy: Literal["preserve-both"]
    resolution_event: Event[JsonValue]
    recovered_event: Event[PayloadT]
    already_resolved: bool


def conflict_resolution_from_data(value: object) -> ConflictResolution[Any]:
    data = _object(value, "conflict resolution")
    strategy = _string(data, "strategy", "conflict resolution")
    if strategy != "preserve-both":
        raise ThalwegProtocolError(
            f"Unsupported conflict resolution strategy {strategy!r}."
        )
    return ConflictResolution(
        network=_string(data, "network", "conflict resolution"),
        event_id=_string(data, "eventId", "conflict resolution"),
        strategy="preserve-both",
        resolution_event=event_from_data(
            data.get("resolutionEvent"), "conflict resolution.resolutionEvent"
        ),
        recovered_event=event_from_data(
            data.get("recoveredEvent"), "conflict resolution.recoveredEvent"
        ),
        already_resolved=_boolean(data, "alreadyResolved", "conflict resolution"),
    )
