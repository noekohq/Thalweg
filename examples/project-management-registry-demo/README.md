# Project Management Registry Demo

This example exercises all three declarative registry kinds:

```text
/Users/atilgner/project-management
  -> Source: knowledge:file_change
  -> Processor: knowledge:changelog_entry
  -> Sink: append changelog.md
```

`changelog.md` is excluded from the Source, preventing a feedback loop. The
Sink includes each derived event ID in an HTML comment and checks for that
marker before appending, making durable delivery retries idempotent.

The installed definitions are device-local. After copying them into the
configured registry directories, activate them with:

```bash
thalweg registry validate
thalweg registry reload
thalweg registry status
```

Then create, edit, rename, or delete any other file beneath
`/Users/atilgner/project-management`. The polling watcher reports regular files
recursively; a rename appears as one deletion and one creation.
