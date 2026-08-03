import { createConnection, Socket } from "node:net";

export const THALWEG_PROTOCOL_VERSION = 1;

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
  protocolVersion: number;
  action: string;
  payload: unknown;
}

interface ResponseMessage<T = unknown> {
  id?: string;
  protocolVersion: number;
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

interface StreamMessage {
  type: "event";
  protocolVersion: number;
  subscriptionId: string;
  event: DaemonEvent;
}

type PendingRequest = {
  action: string;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class ThalwegDaemonError extends Error {
  readonly action: string;
  readonly code: string;
  readonly retryable: boolean;

  constructor(action: string, code: string, message: string, retryable: boolean) {
    super(message);
    this.name = "ThalwegDaemonError";
    this.action = action;
    this.code = code;
    this.retryable = retryable;
  }
}

type EventHandler = (event: DaemonEvent) => void | Promise<void>;

export class DaemonClient {
  private socketPath: string;
  private socket: Socket | null = null;
  private buffer = "";
  private nextId = 0;
  private pending = new Map<string, PendingRequest>();
  private subscriptions = new Map<string, EventHandler>();
  private queuedSubscriptionEvents = new Map<string, DaemonEvent[]>();
  private connecting: Promise<void> | null = null;
  private requestTimeoutMs: number;

  constructor(socketPath: string, options: { requestTimeoutMs?: number } = {}) {
    this.socketPath = socketPath;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 30_000;
    if (!Number.isFinite(this.requestTimeoutMs) || this.requestTimeoutMs <= 0) {
      throw new Error("requestTimeoutMs must be greater than zero.");
    }
  }

  async request<T>(action: string, payload: unknown): Promise<T> {
    await this.connect();
    const id = `req_${++this.nextId}`;
    const message: RequestMessage = {
      id,
      protocolVersion: THALWEG_PROTOCOL_VERSION,
      action,
      payload,
    };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.pending.delete(id)) return;
        reject(new Error(`Thalweg daemon request ${action} timed out.`));
      }, this.requestTimeoutMs);
      this.pending.set(id, {
        action,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value as T);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
        timer,
      });
      try {
        this.write(message);
      } catch (error) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(error);
      }
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
    const queued = this.queuedSubscriptionEvents.get(result.subscriptionId) ?? [];
    this.queuedSubscriptionEvents.delete(result.subscriptionId);
    for (const event of queued) {
      void handler(event);
    }
    return result.subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    this.subscriptions.delete(subscriptionId);
    this.queuedSubscriptionEvents.delete(subscriptionId);
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
          clearTimeout(pending.timer);
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
      let message: ResponseMessage | StreamMessage;
      try {
        message = JSON.parse(part) as ResponseMessage | StreamMessage;
      } catch {
        this.failConnection(new Error("Thalweg daemon sent malformed JSON."));
        return;
      }
      if (message.protocolVersion !== THALWEG_PROTOCOL_VERSION) {
        this.failProtocol(message);
        return;
      }

      if ("type" in message && message.type === "event") {
        const handler = this.subscriptions.get(message.subscriptionId);
        if (handler) {
          void handler(message.event);
        } else {
          const queued = this.queuedSubscriptionEvents.get(message.subscriptionId) ?? [];
          if (queued.length < 128) queued.push(message.event);
          this.queuedSubscriptionEvents.set(message.subscriptionId, queued);
        }
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
        const details = response.errorDetails;
        pending.reject(new ThalwegDaemonError(
          pending.action,
          details?.code ?? "action_failed",
          details?.message ?? response.error ?? "Thalweg daemon request failed.",
          details?.retryable ?? false,
        ));
      }
    }
  }

  private failProtocol(message: ResponseMessage | StreamMessage): void {
    const received = message.protocolVersion ?? "missing";
    const error = new Error(
      `Unsupported Thalweg protocol version ${received}; SDK supports ${THALWEG_PROTOCOL_VERSION}.`,
    );
    this.failConnection(error);
  }

  private failConnection(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    this.socket?.destroy(error);
  }
}
