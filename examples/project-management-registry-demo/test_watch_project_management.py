import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest

import watch_project_management as watcher


class ProjectManagementWatcherTests(unittest.TestCase):
    def test_v2_event_contains_current_and_previous_hashes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            document = root / "dump.md"
            document.write_text("before")
            before = watcher.snapshot(root, set())["dump.md"]
            document.write_text("after")
            after = watcher.snapshot(root, set())["dump.md"]
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                watcher.emit("modified", "dump.md", after, before)
            payload = json.loads(output.getvalue())
            self.assertEqual(payload["schema"], "thalweg.knowledge_file_change.v2")
            self.assertEqual(payload["contentHash"], after[3])
            self.assertEqual(payload["previousContentHash"], before[3])
            self.assertNotEqual(payload["contentHash"], payload["previousContentHash"])


if __name__ == "__main__":
    unittest.main()
