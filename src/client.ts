import { createConnection, Socket } from "node:net";

export interface DaemonEvent<P = unknown> {
  id: string;
  network: string;
  stream: string;
  occurredAt: string;
  insertedAt: string;
  propagatedAt: string;
  counter: number;
  deviceId: string;
  payload: P;
}

interface RequestMessage {
  id: string;
  action: string;
  payload: unknown;
}

interface ResponseMessage<T = unknown> {
  id?: string;
  success: boolean;
  data?: T;
  error?: string;
}

interface StreamMessage {
  type: "event";
  subscriptionId: string;
  event: DaemonEvent;
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

type EventHandler = (event: DaemonEvent) => void | Promise<void>;

export class DaemonClient {
  private socketPath: string;
  private socket: Socket | null = null;
  private buffer = "";
  private nextId = 0;
  private pending = new Map<string, PendingRequest>();
  private subscriptions = new Map<string, EventHandler>();
  private connecting: Promise<void> | null = null;

  constructor(socketPath: string) {
    this.socketPath = socketPath;
  }

  async request<T>(action: string, payload: unknown): Promise<T> {
    await this.connect();
    const id = `req_${++this.nextId}`;
    const message: RequestMessage = { id, action, payload };

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      this.write(message);
    });
  }

  async subscribe(
    network: string,
    streams: string[],
    handler: EventHandler,
  ): Promise<string> {
    const result = await this.request<{ subscriptionId: string }>(
      "siphon_register",
      { network, streams },
    );
    this.subscriptions.set(result.subscriptionId, handler);
    return result.subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    this.subscriptions.delete(subscriptionId);
    await this.request("siphon_unregister", { subscriptionId });
  }

  async close(): Promise<void> {
    if (!this.socket) return;
    this.socket.end();
    this.socket = null;
    this.connecting = null;
  }

  private connect(): Promise<void> {
    if (this.socket?.readyState === "open") return Promise.resolve();
    if (this.connecting) return this.connecting;

    this.connecting = new Promise((resolve, reject) => {
      const socket = createConnection({ path: this.socketPath });
      this.socket = socket;

      socket.once("connect", resolve);
      socket.once("error", reject);

      socket.on("data", (data: Buffer) => {
        this.buffer += data.toString();
        this.processBuffer();
      });

      socket.on("close", () => {
        this.socket = null;
        this.connecting = null;
        for (const pending of this.pending.values()) {
          pending.reject(new Error("Thalweg daemon connection closed."));
        }
        this.pending.clear();
      });
    });

    return this.connecting;
  }

  private write(message: RequestMessage): void {
    if (!this.socket || this.socket.readyState !== "open") {
      throw new Error("Thalweg daemon is not connected.");
    }
    this.socket.write(`${JSON.stringify(message)}\n`);
  }

  private processBuffer(): void {
    const parts = this.buffer.split("\n");
    this.buffer = parts.pop() ?? "";

    for (const part of parts) {
      if (!part.trim()) continue;
      const message = JSON.parse(part) as ResponseMessage | StreamMessage;

      if ("type" in message && message.type === "event") {
        const handler = this.subscriptions.get(message.subscriptionId);
        void handler?.(message.event);
        continue;
      }

      const response = message as ResponseMessage;
      if (!response.id) continue;
      const pending = this.pending.get(response.id);
      if (!pending) continue;
      this.pending.delete(response.id);

      if (response.success) {
        pending.resolve(response.data);
      } else {
        pending.reject(new Error(response.error ?? "Thalweg daemon request failed."));
      }
    }
  }
}
