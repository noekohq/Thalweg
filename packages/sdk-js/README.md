# @quasarbrains/thalweg-sdk

Typed TypeScript SDK for the local Thalweg daemon.

## Usage

From the monorepo root, start the daemon first:

```bash
go run ./cmd/thalweg spawn
```

Run the simple Velotic timeline demo:

```bash
bun run demo:velotic
```

## Example

```ts
import { Thalweg } from "@quasarbrains/thalweg-sdk";

type Streams = {
  "system:app_activity": {
    device: string;
    appName: string;
    idle: boolean;
  };
  "user:note": {
    content: string;
    source: "manual" | "import";
  };
  "insights:summary": {
    content: string;
    generatedAt: string;
  };
};

type Basins = {
  timeline: ["system:app_activity", "user:note"];
};

const t = new Thalweg<Streams, Basins>(
  {
    socket: "/tmp/thalweg.sock",
    network: "velotic-demo",
  },
  {
    timeline: ["system:app_activity", "user:note"],
  },
);

await t.ingest("user:note", {
  content: "The MVP is a local chronological timeline.",
  source: "manual",
});

t.basin("timeline")
  .siphon()
  .interval("15m")
  .run(async (ctx, data) => {
    await ctx.ingest("insights:summary", {
      content: `Saw ${data["user:note"].length} notes.`,
      generatedAt: new Date().toISOString(),
    });
  });
```

## Documentation

- [SDK behavior](docs/SDK.md)
- [Transport contract](docs/PROTOCOL.md)
- [Roadmap](docs/ROADMAP.md)
- [Agent guide](AGENTS.md)
- [Current handoff](HANDOFF.md)

The Go daemon and canonical event/protocol documentation live at the monorepo
root in `../../docs`.
