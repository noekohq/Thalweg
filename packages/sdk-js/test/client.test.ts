import { afterEach, describe, expect, test } from "bun:test";
import { createServer, type Server } from "node:net";
import { unlink } from "node:fs/promises";
import {
  DaemonClient,
  THALWEG_PROTOCOL_VERSION,
  ThalwegDaemonError,
} from "../src/client";
import { Thalweg } from "../src/index";

let nextSocket = 0;
const openClients: DaemonClient[] = [];
const openServers: Server[] = [];
const socketPaths: string[] = [];

afterEach(async () => {
  await Promise.all(openClients.splice(0).map((client) => client.close()));
  await Promise.all(
    openServers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
  await Promise.all(
    socketPaths.splice(0).map(async (path) => {
      try {
        await unlink(path);
      } catch {
        // Unix servers normally unlink their socket on close.
      }
    }),
  );
});

describe("DaemonClient protocol framing", () => {
  test("sends protocol version 1 and accepts a matching response", async () => {
    const path = await listen((message, socket) => {
      expect(message.protocolVersion).toBe(THALWEG_PROTOCOL_VERSION);
      expect(message.action).toBe("network_status");
      socket.write(
        `${JSON.stringify({
          id: message.id,
          protocolVersion: THALWEG_PROTOCOL_VERSION,
          success: true,
          data: { ready: true },
        })}\n`,
      );
    });
    const client = trackClient(new DaemonClient(path));

    await expect(client.request("network_status", {})).resolves.toEqual({
      ready: true,
    });
  });

  test("rejects responses from an incompatible protocol", async () => {
    const path = await listen((message, socket) => {
      socket.write(
        `${JSON.stringify({
          id: message.id,
          protocolVersion: 999,
          success: true,
          data: {},
        })}\n`,
      );
    });
    const client = trackClient(new DaemonClient(path));

    await expect(client.request("network_status", {})).rejects.toThrow(
      "Unsupported Thalweg protocol version 999",
    );
  });

  test("rejects malformed daemon JSON without crashing", async () => {
    const path = await listen((_message, socket) => {
      socket.write("not-json\n");
    });
    const client = trackClient(new DaemonClient(path));

    await expect(client.request("network_status", {})).rejects.toThrow(
      "malformed JSON",
    );
  });

  test("times out unanswered requests", async () => {
    const path = await listen(() => undefined);
    const client = trackClient(new DaemonClient(path, { requestTimeoutMs: 20 }));

    await expect(client.request("network_status", {})).rejects.toThrow(
      "request network_status timed out",
    );
  });

  test("surfaces structured daemon error codes and retryability", async () => {
    const path = await listen((message, socket) => {
      socket.write(
        `${JSON.stringify({
          id: message.id,
          protocolVersion: THALWEG_PROTOCOL_VERSION,
          success: false,
          error: "peer is temporarily unavailable",
          errorDetails: {
            code: "unavailable",
            message: "peer is temporarily unavailable",
            retryable: true,
          },
        })}\n`,
      );
    });
    const client = trackClient(new DaemonClient(path));
    try {
      await client.request("mesh_sync", {});
      throw new Error("request unexpectedly succeeded");
    } catch (error) {
      expect(error).toBeInstanceOf(ThalwegDaemonError);
      expect(error).toMatchObject({
        action: "mesh_sync",
        code: "unavailable",
        retryable: true,
      });
    }
  });
});

describe("Siphon runtime safety", () => {
  type Streams = { note: { content: string }; summary: { content: string } };
  type Basins = { timeline: ["note"] };

  test("rejects missing runtime basin definitions", () => {
    const thalweg = new Thalweg<Streams, Basins>({
      socket: "/tmp/not-used.sock",
      network: "home",
    });
    expect(() => thalweg.basin("timeline")).toThrow(
      "has no runtime stream definition",
    );
  });

  test("requires include before omit on an all-stream siphon", () => {
    const thalweg = new Thalweg<Streams, {}>({
      socket: "/tmp/not-used.sock",
      network: "home",
    });
    expect(() => thalweg.siphon().omit(["note"])).toThrow(
      "call include() first",
    );
  });

  test("surfaces buffered callback failures through the handle", async () => {
    const path = await listen((message, socket) => {
      expect(message.action).toBe("event_query");
      socket.write(
        `${JSON.stringify({
          id: message.id,
          protocolVersion: THALWEG_PROTOCOL_VERSION,
          success: true,
          data: [],
        })}\n`,
      );
    });
    const thalweg = new Thalweg<Streams, {}>({ socket: path, network: "home" });
    try {
      const handle = thalweg
        .siphon()
        .include(["note"])
        .interval("1m")
        .run(() => {
          throw new Error("processor failed");
        });
      await expect(handle.result).rejects.toThrow("processor failed");
    } finally {
      await thalweg.close();
    }
  });

  test("does not lose an event delivered with the registration response", async () => {
    const path = await listen((message, socket) => {
      const action = String(message.action);
      if (action === "siphon_register") {
        socket.write(
          `${JSON.stringify({
            id: message.id,
            protocolVersion: THALWEG_PROTOCOL_VERSION,
            success: true,
            data: { subscriptionId: "sub-fast" },
          })}\n${JSON.stringify({
            type: "event",
            protocolVersion: THALWEG_PROTOCOL_VERSION,
            subscriptionId: "sub-fast",
            event: {
              id: "event-fast",
              network: "home",
              stream: "note",
              occurredAt: "2026-01-01T00:00:00Z",
              insertedAt: "2026-01-01T00:00:00Z",
              propagatedAt: "2026-01-01T00:00:00Z",
              counter: 0,
              deviceId: "device",
              payload: { content: "hello" },
            },
          })}\n`,
        );
      } else if (action === "siphon_unregister") {
        socket.write(
          `${JSON.stringify({
            id: message.id,
            protocolVersion: THALWEG_PROTOCOL_VERSION,
            success: true,
            data: { removed: true },
          })}\n`,
        );
      }
    });
    const thalweg = new Thalweg<Streams, {}>({ socket: path, network: "home" });
    let receive!: (id: string) => void;
    const received = new Promise<string>((resolve) => {
      receive = resolve;
    });
    try {
      const handle = thalweg
        .siphon()
        .include(["note"])
        .run((_context, event) => receive(event.id));
      await handle.ready;
      await expect(received).resolves.toBe("event-fast");
      await handle.stop();
      await expect(handle.result).resolves.toBeUndefined();
    } finally {
      await thalweg.close();
    }
  });
});

describe("Thalweg network membership API", () => {
  test("maps fluent membership methods to scoped daemon actions", async () => {
    const seen: Record<string, unknown>[] = [];
    const path = await listen((message, socket) => {
      seen.push(message);
      const action = String(message.action);
      const dataByAction: Record<string, unknown> = {
        network_create: {
          membership: { name: "home", id: "network-id" },
          invitation: "thalweg1:invite",
        },
        network_invite: {
          membership: { name: "home", id: "network-id" },
          invitation: "thalweg1:invite",
          credentialMode: "shared-bearer",
        },
        network_join: {
          membership: { name: "home", id: "network-id" },
          joined: true,
        },
        network_list: [{ name: "home", id: "network-id" }],
        network_leave: {
          membership: { name: "home", id: "network-id" },
          left: true,
        },
        mesh_peer_list: [
          {
            network: { name: "home", id: "network-id" },
            peerId: "peer-id",
            address: "/ip4/127.0.0.1/tcp/1/p2p/peer-id",
            state: "healthy",
            connected: true,
            consecutiveFailures: 0,
          },
        ],
        enrollment_listen: {
          offer: {
            id: "offer-id",
            network: { name: "home", id: "network-id" },
            expiresAt: "2026-07-30T17:00:00Z",
          },
          addresses: ["/ip4/127.0.0.1/tcp/1/p2p/peer-id"],
        },
        enrollment_requests: [
          {
            id: "request-id",
            network: { name: "home", id: "network-id" },
            peerId: "joining-peer",
            deviceName: "Second Mac",
          },
        ],
        enrollment_discover: [
          {
            peerId: "peer-id",
            targetAddr: "/ip4/127.0.0.1/tcp/1/p2p/peer-id",
            offer: {
              id: "offer-id",
              network: { name: "home", id: "network-id" },
              expiresAt: "2026-07-30T17:00:00Z",
            },
          },
        ],
        enrollment_approve: { requestId: "request-id", accepted: true },
        enrollment_close: { removed: true },
        enrollment_join: {
          membership: { name: "home", id: "network-id" },
          joined: true,
          peerId: "peer-id",
          sync: {
            peerId: "peer-id",
            network: { name: "home", id: "network-id" },
            inventoried: 0,
            pushed: 0,
            pulled: 0,
            duplicates: 0,
          },
        },
        mesh_dial: {
          peerId: "peer-id",
          network: { name: "home", id: "network-id" },
          authorized: true,
        },
        mesh_sync: {
          peerId: "peer-id",
          network: { name: "home", id: "network-id" },
          inventoried: 2,
          pushed: 1,
          pulled: 1,
          duplicates: 0,
        },
      };
      socket.write(
        `${JSON.stringify({
          id: message.id,
          protocolVersion: THALWEG_PROTOCOL_VERSION,
          success: true,
          data: dataByAction[action],
        })}\n`,
      );
    });
    const thalweg = new Thalweg<Record<string, unknown>, {}>({
      socket: path,
      network: "home",
    });

    try {
      await expect(thalweg.createNetwork("home")).resolves.toEqual({
        membership: { name: "home", id: "network-id" },
        invitation: "thalweg1:invite",
      });
      await expect(thalweg.inviteNetwork("home")).resolves.toEqual({
        membership: { name: "home", id: "network-id" },
        invitation: "thalweg1:invite",
        credentialMode: "shared-bearer",
      });
      await expect(thalweg.joinNetwork("thalweg1:invite")).resolves.toEqual({
        membership: { name: "home", id: "network-id" },
        joined: true,
      });
      await expect(thalweg.listNetworks()).resolves.toEqual([
        { name: "home", id: "network-id" },
      ]);
      await expect(thalweg.listMeshPeers()).resolves.toHaveLength(1);
      await expect(thalweg.openEnrollment()).resolves.toHaveProperty(
        "offer.id",
        "offer-id",
      );
      await expect(thalweg.listEnrollmentRequests()).resolves.toHaveLength(1);
      const candidates = await thalweg.discoverEnrollments();
      expect(candidates).toHaveLength(1);
      await expect(
        thalweg.decideEnrollment("request-id", true),
      ).resolves.toEqual({ requestId: "request-id", accepted: true });
      await expect(thalweg.closeEnrollment("offer-id")).resolves.toEqual({
        removed: true,
      });
      await expect(
        thalweg.requestEnrollment(candidates[0]!, "Second Mac"),
      ).resolves.toHaveProperty("membership.name", "home");
      await expect(
        thalweg.dialMeshPeer("/ip4/127.0.0.1/tcp/1/p2p/peer-id"),
      ).resolves.toEqual({
        peerId: "peer-id",
        network: { name: "home", id: "network-id" },
        authorized: true,
      });
      await expect(
        thalweg.syncMeshPeer("/ip4/127.0.0.1/tcp/1/p2p/peer-id"),
      ).resolves.toEqual({
        peerId: "peer-id",
        network: { name: "home", id: "network-id" },
        inventoried: 2,
        pushed: 1,
        pulled: 1,
        duplicates: 0,
      });
      await expect(thalweg.leaveNetwork("home")).resolves.toEqual({
        membership: { name: "home", id: "network-id" },
        left: true,
      });
    } finally {
      await thalweg.close();
    }

    expect(seen.map((message) => message.action)).toEqual([
      "network_create",
      "network_invite",
      "network_join",
      "network_list",
      "mesh_peer_list",
      "enrollment_listen",
      "enrollment_requests",
      "enrollment_discover",
      "enrollment_approve",
      "enrollment_close",
      "enrollment_join",
      "mesh_dial",
      "mesh_sync",
      "network_leave",
    ]);
    expect(seen[1]?.payload).toEqual({ name: "home" });
    expect(seen[11]?.payload).toEqual({
      targetAddr: "/ip4/127.0.0.1/tcp/1/p2p/peer-id",
      network: "home",
    });
    expect(seen[12]?.payload).toEqual({
      targetAddr: "/ip4/127.0.0.1/tcp/1/p2p/peer-id",
      network: "home",
    });
  });
});

function trackClient(client: DaemonClient): DaemonClient {
  openClients.push(client);
  return client;
}

async function listen(
  onMessage: (message: Record<string, unknown>, socket: import("node:net").Socket) => void,
): Promise<string> {
  const path = `/tmp/thalweg-js-test-${process.pid}-${++nextSocket}.sock`;
  socketPaths.push(path);
  const server = createServer((socket) => {
    let buffer = "";
    socket.on("data", (data) => {
      buffer += data.toString();
      const newline = buffer.indexOf("\n");
      if (newline < 0) return;
      const message = JSON.parse(buffer.slice(0, newline)) as Record<string, unknown>;
      buffer = buffer.slice(newline + 1);
      onMessage(message, socket);
    });
  });
  openServers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(path, resolve);
  });
  return path;
}
