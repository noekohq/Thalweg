.PHONY: bootstrap build check test test-race console-build console-dev sdk-demo python-sdk-build python-sdk-check python-sdk-test

PYTHON ?= python3

bootstrap:
	bun install
	go mod download

build: python-sdk-build
	bun run build:js
	go build ./...

check: python-sdk-check
	bun run check:js
	go vet ./...

test: python-sdk-test
	bun run test:js
	go test ./...

test-race:
	go test -race ./...

console-build:
	bun run --cwd apps/console-web build

console-dev:
	bun run dev:console

sdk-demo:
	bun run demo:velotic

python-sdk-build:
	$(PYTHON) -m pip wheel --no-deps --wheel-dir packages/sdk-python/dist packages/sdk-python

python-sdk-check:
	PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=packages/sdk-python/src $(PYTHON) -c "import thalweg"

python-sdk-test:
	PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=packages/sdk-python/src $(PYTHON) -m unittest discover -s packages/sdk-python/tests -t packages/sdk-python -v
