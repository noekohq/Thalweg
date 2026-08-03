import { Thalweg } from "../index";

type VeloticStreams = {
  "system:app_activity": {
    device: string;
    appName: string;
    windowTitle?: string;
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

type VeloticBasins = {
  timeline: ["system:app_activity", "user:note"];
};

const thalweg = new Thalweg<VeloticStreams, VeloticBasins>(
  {
    socket: "/tmp/thalweg.sock",
    network: "velotic-demo",
  },
  {
    timeline: ["system:app_activity", "user:note"],
  },
);

const now = Date.now();

await thalweg.ingest(
  "system:app_activity",
  {
    device: "macbook",
    appName: "Cursor",
    windowTitle: "Thalweg MVP",
    idle: false,
  },
  { occurredAt: new Date(now - 9 * 60 * 1000).toISOString() },
);

await thalweg.ingest(
  "user:note",
  {
    content: "Sketch the MVP around a local chronological timeline.",
    source: "manual",
  },
  { occurredAt: new Date(now - 5 * 60 * 1000).toISOString() },
);

await thalweg.ingest(
  "system:app_activity",
  {
    device: "macbook",
    appName: "Terminal",
    windowTitle: "go test ./...",
    idle: false,
  },
  { occurredAt: new Date(now - 2 * 60 * 1000).toISOString() },
);

thalweg
  .basin("timeline")
  .siphon()
  .interval("15m")
  .run(async (ctx, data) => {
    const activityCount = data["system:app_activity"].length;
    const noteCount = data["user:note"].length;

    await ctx.ingest("insights:summary", {
      content: `Last 15m: ${activityCount} app activity events and ${noteCount} notes.`,
      generatedAt: new Date().toISOString(),
    });
  });

await new Promise((resolve) => setTimeout(resolve, 250));

const timeline = await thalweg.query({
  streams: ["system:app_activity", "user:note", "insights:summary"],
  from: new Date(now - 15 * 60 * 1000).toISOString(),
  to: new Date(now + 60 * 1000).toISOString(),
});

for (const event of timeline) {
  console.log(
    `${event.occurredAt} ${event.stream} ${JSON.stringify(event.payload)}`,
  );
}

await thalweg.close();
