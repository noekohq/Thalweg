#!/usr/bin/env python3
"""Poll a project-management directory and emit file changes as raw NDJSON."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--exclude", action="append", default=[])
    parser.add_argument("--interval", type=float, default=0.25)
    return parser.parse_args()


FileState = tuple[int, int, int, str]


def content_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(128 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def snapshot(root: Path, excluded: set[str]) -> dict[str, FileState]:
    result: dict[str, FileState] = {}
    for directory, names, files in os.walk(root):
        relative_directory = Path(directory).relative_to(root)
        names[:] = [
            name
            for name in names
            if str(relative_directory / name) not in excluded
        ]
        for name in files:
            path = Path(directory) / name
            relative = str(path.relative_to(root))
            if relative in excluded:
                continue
            try:
                stat = path.stat()
            except (FileNotFoundError, PermissionError):
                continue
            if not path.is_file():
                continue
            try:
                digest = content_hash(path)
            except (FileNotFoundError, PermissionError):
                continue
            result[relative] = (stat.st_mtime_ns, stat.st_size, stat.st_ino, digest)
    return result


def emit(
    operation: str,
    relative: str,
    state: FileState | None,
    previous_state: FileState | None = None,
) -> None:
    payload: dict[str, object] = {
        "schema": "thalweg.knowledge_file_change.v2",
        "operation": operation,
        "path": relative,
        "observedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    if state is not None:
        payload["modifiedAtNs"] = state[0]
        payload["sizeBytes"] = state[1]
        payload["contentHash"] = state[3]
    if previous_state is not None:
        payload["previousContentHash"] = previous_state[3]
    print(json.dumps(payload, separators=(",", ":")), flush=True)


def main() -> int:
    args = parse_args()
    root = args.root.expanduser().resolve()
    if not root.is_dir():
        print(f"project-management watcher: {root} is not a directory", file=sys.stderr)
        return 2
    if args.interval <= 0:
        print("project-management watcher: --interval must be positive", file=sys.stderr)
        return 2

    excluded = {str(Path(value)) for value in args.exclude}
    previous = snapshot(root, excluded)
    while True:
        time.sleep(args.interval)
        current = snapshot(root, excluded)
        for relative in sorted(previous.keys() - current.keys()):
            emit("deleted", relative, None, previous[relative])
        for relative in sorted(current.keys() - previous.keys()):
            emit("created", relative, current[relative])
        for relative in sorted(current.keys() & previous.keys()):
            if current[relative] != previous[relative]:
                emit("modified", relative, current[relative], previous[relative])
        previous = current


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(0)
