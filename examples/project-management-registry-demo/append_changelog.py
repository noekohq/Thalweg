#!/usr/bin/env python3
"""Append changelog-entry deliveries exactly once per derived event ID."""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("changelog", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    raw = sys.stdin.readline()
    if not raw:
        print("project-management changelog sink: missing delivery", file=sys.stderr)
        return 2
    delivery = json.loads(raw)
    args.changelog.parent.mkdir(parents=True, exist_ok=True)

    appended = 0
    with args.changelog.open("a+", encoding="utf-8") as changelog:
        fcntl.flock(changelog.fileno(), fcntl.LOCK_EX)
        changelog.seek(0)
        existing = changelog.read()
        changelog.seek(0, os.SEEK_END)
        for event in delivery.get("events", []):
            event_id = event.get("id")
            payload = event.get("payload")
            if not isinstance(event_id, str) or not event_id or not isinstance(payload, dict):
                raise ValueError("changelog event requires an ID and object payload")
            line = payload.get("line")
            if not isinstance(line, str) or not line:
                raise ValueError("changelog event payload requires line")
            marker = f"<!-- thalweg:event:{event_id} -->"
            if marker in existing:
                continue
            rendered = f"{line} {marker}\n"
            changelog.write(rendered)
            existing += rendered
            appended += 1
        changelog.flush()
        os.fsync(changelog.fileno())
        fcntl.flock(changelog.fileno(), fcntl.LOCK_UN)

    print(f"project-management changelog sink: appended {appended} entr{'y' if appended == 1 else 'ies'}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"project-management changelog sink: {error}", file=sys.stderr)
        raise SystemExit(2)
