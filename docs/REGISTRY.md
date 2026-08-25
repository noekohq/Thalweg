# Declarative Registry Runtime

The registry is the user-scoped declarative integration layer over Thalweg. It
supervises ordinary local executables as event Sources, durable Sinks, or
event-producing Processors without requiring an SDK application. Definitions
and execution authority stay on the device where they are installed; they are
never synchronized or remotely executed.

## Paths and activation

`thalweg init` creates:

```text
~/.config/thalweg/
├── registry.d/
│   ├── sources/
│   ├── sinks/
│   └── processors/
└── env.d/
```

Only direct `.yaml` and `.yml` children are loaded. Directories must not be
symlinks or writable by group/others. Definitions must be regular non-symlink
files that are not group/other writable. Referenced environment files must be
mode `0600`.

The daemon accepts the on-disk set only through `thalweg registry reload`.
Invalid candidates leave running definitions untouched. The accepted snapshot
is stored at `~/.local/share/thalweg/storage/registry/accepted-v1.json`; daemon
restarts use that last-known-good snapshot rather than unaccepted file edits.
On the first start, the current valid files become the initial snapshot.

## Common schema

Every file contains exactly one strict YAML document:

```yaml
apiVersion: thalweg.dev/v1alpha1
kind: Source # Source, Sink, or Processor
metadata:
  name: stable-local-name
  labels:
    environment: production
spec:
  enabled: true
  network: home
  runner:
    type: exec
    command: [/absolute/program, --flag]
    workingDirectory: .
  environment:
    inherit: true
    from: [production]
    values:
      MODE: local
  timeout: 30s
  retry:
    policy: always # always, on-failure, or never
    initialBackoff: 1s
    maxBackoff: 1m
```

Commands are argument arrays and never implicitly invoke a shell. Use an
explicit `[/bin/sh, -c, ...]` only when shell behavior is intended. Relative
working directories and executable paths resolve from the definition file's
directory. `${NAME}` command expansion uses the final process environment and
missing values fail validation. The runtime injects `THALWEG_REGISTRY_NAME`,
`THALWEG_REGISTRY_KIND`, and `THALWEG_NETWORK`.

Named environment file `production` resolves to `env.d/production.env`. Files
use literal `KEY=value` lines with blank lines and `#` comments allowed. Values
are never returned through status APIs or the Console.

## Sources

```yaml
apiVersion: thalweg.dev/v1alpha1
kind: Source
metadata:
  name: api-errors
spec:
  network: work
  stream: error:resource_api
  runner:
    type: exec
    command: [journalctl, --unit=resource-api, --follow, --output=json]
    mode: stream
  input:
    format: raw-ndjson
  retry:
    policy: always
    initialBackoff: 1s
    maxBackoff: 1m
```

`stream` maintains a long-running process. `interval` runs without overlap and
requires a positive `runner.interval`; `once` runs once per daemon start or
changed-definition activation. An unchanged reload does not rerun it.

Source stdout is NDJSON with a 1 MiB line limit. In the default `raw-ndjson`
mode, each nonblank JSON value is the payload for the configured stream. In
`event-ndjson` mode, each line is:

```json
{"payload":{"message":"failed"},"eventId":"optional","occurredAt":"optional RFC3339"}
```

The runtime chooses a retry-safe ID when omitted and ingests records
sequentially, letting the stdout pipe provide backpressure. Malformed or
oversized records fail the attempt instead of being silently discarded.
Source stderr is written to its bounded rotating registry log.

## Sinks

```yaml
apiVersion: thalweg.dev/v1alpha1
kind: Sink
metadata:
  name: transcript-archive
spec:
  network: home
  events:
    streams: [voice:transcript]
    start: earliest
  delivery:
    maxEvents: 25
    wait: 20s
  runner:
    type: exec
    command: [/usr/local/bin/archive-transcripts]
  timeout: 2m
```

`events.start` is required and is `earliest` or `latest`; an empty stream list
means all streams. The runtime creates one internal durable siphon and starts a
fresh child for each non-empty batch. The child receives one JSON line on
stdin containing definition name/kind/network, delivery ID, attempt, cursor
bounds, and immutable event envelopes. Exit code `0` acknowledges the batch.
A crash, timeout, cancellation, or nonzero exit leaves it pending for replay.
Stdout and stderr are logged.

## Processors

Processors use the Sink input contract and declare every stream they may emit:

```yaml
apiVersion: thalweg.dev/v1alpha1
kind: Processor
metadata:
  name: triage-errors
spec:
  network: work
  events:
    streams: [error:resource_api]
    start: latest
  output:
    allowedStreams: [error:false_positive, incident:escalated]
  runner:
    type: exec
    command: [/usr/local/bin/triage-error]
```

Processor stdout is event NDJSON:

```json
{"stream":"incident:escalated","payload":{"summary":"pool exhausted"}}
```

`eventId` and `occurredAt` are optional. Omitted IDs are deterministic for the
definition, input delivery, and output sequence, so replay is idempotent. The
input batch is acknowledged only after the command exits successfully and all
outputs are durably accepted. Malformed or disallowed output fails the batch.
Diagnostic output belongs on stderr.

## Operations and state

```bash
thalweg registry validate
thalweg registry reload
thalweg registry status
thalweg registry list
thalweg registry inspect api-errors
thalweg registry stop api-errors
thalweg registry start api-errors
thalweg registry restart api-errors
thalweg registry logs --follow api-errors
thalweg registry reset --yes transcript-archive
```

`stop` is a temporary runtime override and does not edit YAML. `reset` stops a
consumer and deletes its registry-owned cursor/pending batch; use it before
reloading a changed consumer network, stream selection, or starting position.
Registry-owned durable siphon names use the reserved
`thalweg.registry.v1.*` prefix and are hidden from ordinary siphon listings.

Per-definition logs rotate at 10 MiB with three backups under the local
registry state directory. Status includes desired/runtime state, PID, digest,
source file, network/streams, activity, processed count, current delivery,
failure count, retry time, and a bounded sanitized error. Doctor and both
Consoles expose the same read-only health model.

## Guarantees and boundaries

- Event ingestion is locally durable before Source progress is reported.
- Sink and Processor delivery is at least once, not exactly once.
- Processor outputs are retry-idempotent when output order and payload remain
  stable. External Sink side effects remain the integration author's
  idempotency responsibility.
- Daemon shutdown sends process-group termination, waits five seconds, and
  force-kills remaining children before closing storage.
- WebSocket, webhook, filesystem, database, container, embedded-language,
  remote deployment, placement, leases, and marketplaces are not first-class
  v1 runners. Use an executable in stream mode or a full SDK application.
