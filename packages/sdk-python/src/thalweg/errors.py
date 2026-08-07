"""Public exception hierarchy for the Thalweg Python SDK."""

from __future__ import annotations


class ThalwegError(Exception):
    """Base class for all SDK-specific failures."""


class ThalwegDaemonError(ThalwegError):
    """A structured error returned by a daemon action."""

    def __init__(
        self,
        *,
        action: str,
        code: str,
        message: str,
        retryable: bool,
    ) -> None:
        super().__init__(message)
        self.action = action
        self.code = code
        self.message = message
        self.retryable = retryable


class ThalwegConnectionError(ThalwegError):
    """The local daemon connection could not be opened or was lost."""


class ThalwegTimeoutError(ThalwegError):
    """A daemon request did not complete before its local deadline."""

    def __init__(self, *, action: str, timeout: float) -> None:
        super().__init__(
            f"Thalweg daemon request {action!r} timed out after {timeout:g}s."
        )
        self.action = action
        self.timeout = timeout


class ThalwegProtocolError(ThalwegError):
    """The daemon sent an invalid or incompatible protocol frame."""


class ThalwegBackpressureError(ThalwegError):
    """A live subscription could not consume events without dropping data."""

