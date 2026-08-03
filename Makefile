.PHONY: bootstrap build check test test-race console-build console-dev sdk-demo

bootstrap:
	bun install
	go mod download

build:
	bun run build:js
	go build ./...

check:
	bun run check:js
	go vet ./...

test:
	bun run test:js
	go test ./...

test-race:
	go test -race ./...

console-build:
	bun --cwd apps/console-web run build

console-dev:
	bun run dev:console

sdk-demo:
	bun run demo:velotic
