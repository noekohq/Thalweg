# Monorepo Development

## Purpose

The Thalweg monorepo keeps the daemon, public SDK, operator interfaces, shared
contracts, and client applications in one versioned project. Components retain
separate ownership and release boundaries; repository co-location exists to
make cross-contract changes atomic and testable.

## Tool Ownership

- Go modules manage the root daemon, CLI, Bubble Tea Console, and Go tests.
- Bun workspaces manage JavaScript and TypeScript packages under `apps/*` and
  `packages/*`.
- The root `Makefile` provides human- and CI-friendly commands across both
  toolchains.
- Turborepo is intentionally deferred until dependency-aware remote caching or
  affected-package execution solves a measured build problem.

There is one Go module, so a `go.work` file is unnecessary. There is one root
`bun.lock`; workspace packages must not add their own lockfiles.

## Layout

```text
.
├── apps/
│   ├── console-web/        React/Vite source embedded by the Go Console
│   └── mobile/             planned React Native mobile edge node
├── packages/
│   └── sdk-js/             published TypeScript SDK
├── core/daemon/            Go event, storage, enrollment, and mesh core
├── internal/console/       Go observer model, TUI, server, embedded assets
├── internal/ipc/           local Go IPC client
├── docs/                   canonical system documentation
├── package.json            Bun workspace and JavaScript task entry points
├── bun.lock                JavaScript dependency lock
└── go.mod                  Go dependency and module boundary
```

The Go command remains at the repository root for now. Moving it to
`cmd/thalweg` requires separating the current root `main` package from its CLI
implementation and should be performed as an independent refactor.

## Common Commands

```bash
make bootstrap    # install Bun packages and download Go modules
make check        # TypeScript checks and go vet
make test         # SDK and Go tests
make build        # all JS builds and Go package build
make test-race    # Go race suite
make console-dev  # Vite development server
make sdk-demo     # Velotic SDK demo against a running daemon
```

Focused commands remain available through the native toolchains:

```bash
go test ./core/daemon
bun --cwd packages/sdk-js test
bun --cwd apps/console-web run check
```

## Contract Changes

The root `docs/PROTOCOL.md` is the canonical local IPC contract. A change to an
action, frame, event envelope, or compatibility rule must update:

1. The Go producer or consumer.
2. `packages/sdk-js` and its tests when exposed publicly.
3. The canonical protocol document.
4. Any affected Console or mobile consumer.

Component-specific documentation may explain how a component consumes the
contract but must link to the canonical root document rather than copy it.

## Build Artifacts

`apps/console-web` builds into `internal/console/web/assets`, where Go embeds
the generated JavaScript and CSS. CI rebuilds the frontend and rejects stale
embedded assets. SDK output remains in `packages/sdk-js/dist` and is ignored by
Git.

## Releases

Repository versions need not be coupled:

- The Go binary can use `thalweg-vX.Y.Z` tags.
- The SDK can publish from `packages/sdk-js` under its existing npm identity.
- Mobile store builds use their platform version and build numbers.

Protocol compatibility is explicit and does not rely on repository or package
versions happening to match.
