#!/usr/bin/env python3
"""Convert filesystem change deliveries into changelog-entry events."""

from __future__ import annotations

import json
import sys


VERBS = {
    "created": "Created",
    "modified": "Modified",
    "deleted": "Deleted",
}


def markdown_escape(value: object) -> str:
    return str(value).replace("`", "\\`").replace("\r", " ").replace("\n", " ")


def main() -> int:
    raw = sys.stdin.readline()
    if not raw:
        print("project-management processor: missing delivery", file=sys.stderr)
        return 2
    delivery = json.loads(raw)
    for event in delivery.get("events", []):
        payload = event.get("payload")
        if not isinstance(payload, dict):
            raise ValueError("filesystem event payload must be an object")
        operation = payload.get("operation")
        path = payload.get("path")
        if operation not in VERBS or not isinstance(path, str) or not path:
            raise ValueError("filesystem event requires a supported operation and path")
        occurred_at = event.get("occurredAt") or payload.get("observedAt") or "unknown time"
        detail = ""
        if operation != "deleted" and isinstance(payload.get("sizeBytes"), int):
            detail = f" ({payload['sizeBytes']} bytes)"
        line = f"- {markdown_escape(occurred_at)} — **{VERBS[operation]}** `{markdown_escape(path)}`{detail}"
        output = {
            "stream": "knowledge:changelog_entry",
            "occurredAt": event.get("occurredAt"),
            "payload": {
                "schema": "thalweg.knowledge_changelog_entry.v1",
                "line": line,
                "operation": operation,
                "path": path,
                "sourceEventId": event.get("id"),
            },
        }
        print(json.dumps(output, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"project-management processor: {error}", file=sys.stderr)
        raise SystemExit(2)
