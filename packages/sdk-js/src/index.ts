import { randomUUID } from "node:crypto";
import { DaemonClient, DaemonEvent, ThalwegDaemonError } from "./client";
export { ThalwegDaemonError } from "./client";

export interface ThalwegConfiguration {
  socket: string;
  network: string;
  requestTimeoutMs?: number;
}

export interface NetworkStatus {
  peerId: string;
  deviceId: string;
  addresses: string[];
  daemonVersion: string;
  protocolVersion: number;
  storageSchemaVersion: number;
  meshProtocolVersion: number;
  membershipFileVersion: number;
}

export interface NetworkMembership {
  name: string;
  id: string;
}

export interface NetworkCreateResult {
  membership: NetworkMembership;
  invitation: string;
}

export interface NetworkInviteResult {
  membership: NetworkMembership;
  invitation: string;
  credentialMode: "shared-bearer";
}

export interface NetworkJoinResult {
  membership: NetworkMembership;
  joined: boolean;
}

export interface NetworkLeaveResult {
  membership: NetworkMembership;
  left: true;
}

export interface EnrollmentOffer {
  id: string;
  network: NetworkMembership;
  expiresAt: string;
}

export interface EnrollmentCandidate {
  peerId: string;
  targetAddr: string;
  offer: EnrollmentOffer;
}

export interface EnrollmentRequest {
  id: string;
  network: NetworkMembership;
  peerId: string;
  deviceName: string;
  requestedAt: string;
  expiresAt: string;
}

export interface EnrollmentListenResult {
  offer: EnrollmentOffer;
  addresses: string[];
}

export interface EnrollmentDecisionResult {
  requestId: string;
  accepted: boolean;
}

export interface EnrollmentJoinResult {
  membership: NetworkMembership;
  joined: boolean;
  peerId: string;
  sync: MeshSyncResult;
}

export interface MeshDialResult {
  peerId: string;
  network: NetworkMembership;
  authorized: true;
}

export interface MeshSyncResult {
  peerId: string;
  network: NetworkMembership;
  inventoried: number;
  pushed: number;
  pulled: number;
  duplicates: number;
  conflicts?: string[];
}

export interface MeshPeerStatus {
  network: NetworkMembership;
  peerId: string;
  address: string;
  state: "known" | "connected" | "syncing" | "healthy" | "degraded";
  connected: boolean;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  nextAttemptAt?: string;
  consecutiveFailures: number;
  lastResult?: MeshSyncResult;
}

export interface IngestOptions {
  occurredAt?: string;
  eventId?: string;
}

export interface QueryOptions<Payloads extends Record<string, unknown>> {
  streams?: (keyof Payloads)[];
  from?: string;
  to?: string;
  limit?: number;
  order?: "asc" | "desc";
}

export interface DurableSiphonInfo {
  version: 1;
  name: string;
  network: string;
  streams: string[];
  cursor: number;
  createdAt: string;
  updatedAt: string;
  pendingDeliveryId?: string;
  pendingCount: number;
  pendingAttempts: number;
}

export interface DurableSiphonDelivery<P = unknown> {
  version: 1;
  name: string;
  network: string;
  deliveryId?: string;
  cursorFrom: number;
  cursorThrough: number;
  attempt: number;
  events: ThalwegEvent<P>[];
}

export interface DurableSiphonOptions<Payloads extends Record<string, unknown>> {
  streams?: (keyof Payloads)[];
  start?: "earliest" | "latest";
}

export type ThalwegEvent<P extends unknown> = Omit<
  DaemonEvent<P>,
  "payload"
> & {
  payload: P;
};

export interface ThalwegContext<Payloads extends Record<string, unknown>> {
  ingest: <S extends keyof Payloads>(
    stream: S,
    payload: Payloads[S],
    opts?: IngestOptions,
  ) => Promise<ThalwegEvent<Payloads[S]>>;
}

type ExtractEventMap<Payloads, ActiveStreams extends keyof Payloads> = {
  [K in ActiveStreams]: ThalwegEvent<Payloads[K]>[];
};

export interface SiphonIntervalOptions {
  retrospective?: boolean;
}

export type SiphonMode = "continuous" | "buffered";

export type RunArgs<
  Mode extends SiphonMode,
  Payloads,
  ActiveStreams extends keyof Payloads,
> = Mode extends "buffered"
  ? ExtractEventMap<Payloads, ActiveStreams>
  : ThalwegEvent<Payloads[ActiveStreams]>;

export interface SiphonHandle {
  ready: Promise<void>;
  result: Promise<void>;
  stop: () => Promise<void>;
}

export interface Siphon<
  Payloads extends Record<string, unknown>,
  ActiveStreams extends keyof Payloads,
  Mode extends SiphonMode = "continuous",
> {
  interval: (
    time: string,
    opts?: SiphonIntervalOptions,
  ) => Siphon<Payloads, ActiveStreams, "buffered">;

  tail: (time: string) => Siphon<Payloads, ActiveStreams, Mode>;

  omit: <O extends ActiveStreams>(
    streams: O[],
  ) => Siphon<Payloads, Exclude<ActiveStreams, O>, Mode>;

  include: <I extends ActiveStreams>(streams: I[]) => Siphon<Payloads, I, Mode>;

  run: (
    callback: (
      context: ThalwegContext<Payloads>,
      data: RunArgs<Mode, Payloads, ActiveStreams>,
    ) => void | Promise<void>,
  ) => SiphonHandle;
}

interface Basin<
  Payloads extends Record<string, unknown>,
  Basins extends Record<string, (keyof Payloads)[]>,
  K extends keyof Basins,
> {
  siphon(): Siphon<Payloads, Basins[K][number], "continuous">;
}

interface SiphonConfig {
  mode: SiphonMode;
  interval: string | null;
  tail: string | null;
  streams: string[];
}

export class SiphonBuilder<
  P extends Record<string, unknown>,
  A extends keyof P,
  M extends SiphonMode = "continuous",
> implements Siphon<P, A, M> {
  private context: ThalwegContext<P>;
  private client: DaemonClient;
  private network: string;
  private config: SiphonConfig;

  constructor(
    context: ThalwegContext<P>,
    client: DaemonClient,
    network: string,
    streams: string[],
  ) {
    this.context = context;
    this.client = client;
    this.network = network;
    this.config = {
      mode: "continuous",
      interval: null,
      tail: null,
      streams,
    };
  }

  interval(time: string): Siphon<P, A, "buffered"> {
    this.config.mode = "buffered";
    this.config.interval = time;
    return this as unknown as Siphon<P, A, "buffered">;
  }

  tail(time: string): Siphon<P, A, M> {
    this.config.tail = time;
    return this as unknown as Siphon<P, A, M>;
  }

  include<I extends A>(streams: I[]): Siphon<P, I, M> {
    this.config.streams = streams.map(String);
    return this as unknown as Siphon<P, I, M>;
  }

  omit<O extends A>(streams: O[]): Siphon<P, Exclude<A, O>, M> {
    if (this.config.streams.length === 0) {
      throw new Error(
        "Cannot omit streams from an all-stream siphon at runtime; call include() first.",
      );
    }
    const omitted = new Set(streams.map(String));
    this.config.streams = this.config.streams.filter(
      (stream) => !omitted.has(stream),
    );
    return this as unknown as Siphon<P, Exclude<A, O>, M>;
  }

  run(
    callback: (
      ctx: ThalwegContext<P>,
      data: RunArgs<M, P, A>,
    ) => void | Promise<void>,
  ): SiphonHandle {
    if (this.config.mode === "buffered") {
      const result = this.runBuffered(callback);
      return { ready: result, result, stop: async () => undefined };
    }

    let subscriptionId: string | null = null;
    let stopped = false;
    let resolveResult!: () => void;
    let rejectResult!: (error: unknown) => void;
    const result = new Promise<void>((resolve, reject) => {
      resolveResult = resolve;
      rejectResult = reject;
    });
    const ready = this.client
      .subscribe(this.network, this.config.streams, async (event) => {
        try {
          await callback(this.context, event as RunArgs<M, P, A>);
        } catch (error) {
          rejectResult(error);
        }
      })
      .then((id) => {
        subscriptionId = id;
      })
      .catch((error) => {
        rejectResult(error);
        throw error;
      });

    return {
      ready,
      result,
      stop: async () => {
        if (stopped) return;
        stopped = true;
        await ready;
        if (subscriptionId) {
          await this.client.unsubscribe(subscriptionId);
        }
        resolveResult();
      },
    };
  }

  private async runBuffered(
    callback: (
      ctx: ThalwegContext<P>,
      data: RunArgs<M, P, A>,
    ) => void | Promise<void>,
  ): Promise<void> {
    const to = new Date();
    const from = new Date(to.getTime() - parseDurationMs(this.config.interval));
    const events = await this.client.request<DaemonEvent[]>("event_query", {
      network: this.network,
      streams: this.config.streams,
      from: from.toISOString(),
      to: to.toISOString(),
    });

    const grouped = Object.fromEntries(
      this.config.streams.map((stream) => [stream, []]),
    ) as Record<string, DaemonEvent[]>;

    for (const event of events) {
      grouped[event.stream] ??= [];
      grouped[event.stream].push(event);
    }

    await callback(this.context, grouped as RunArgs<M, P, A>);
  }
}

export class Thalweg<
  Payloads extends Record<string, unknown>,
  Basins extends Record<string, (keyof Payloads)[]>,
> {
  private config: ThalwegConfiguration;
  private client: DaemonClient;
  private basins: Partial<Record<keyof Basins, (keyof Payloads)[]>>;

  private context: ThalwegContext<Payloads>;

  constructor(
    config: ThalwegConfiguration,
    basins: Partial<Record<keyof Basins, (keyof Payloads)[]>> = {},
  ) {
    this.config = config;
    this.client = new DaemonClient(config.socket, {
      requestTimeoutMs: config.requestTimeoutMs,
    });
    this.basins = basins;
    this.context = {
      ingest: (stream, payload, opts = {}) => this.ingest(stream, payload, opts),
    };
  }

  async ingest<S extends keyof Payloads>(
    stream: S,
    payload: Payloads[S],
    opts?: IngestOptions,
  ): Promise<ThalwegEvent<Payloads[S]>> {
    const eventId = opts?.eventId ?? `evt_${randomUUID()}`;
    try {
      return await this.client.request<ThalwegEvent<Payloads[S]>>(
        "event_ingest",
        {
          network: this.config.network,
          stream: String(stream),
          payload,
          occurredAt: opts?.occurredAt,
          eventId,
        },
      );
    } catch (error) {
      if (error instanceof ThalwegDaemonError && !error.retryable) {
        throw error;
      }
      // A commit may have succeeded before the local response was lost. The
      // preselected ID makes one retry safe and prevents duplicate events.
      return this.client.request<ThalwegEvent<Payloads[S]>>("event_ingest", {
        network: this.config.network,
        stream: String(stream),
        payload,
        occurredAt: opts?.occurredAt,
        eventId,
      });
    }
  }

  async query(
    opts: QueryOptions<Payloads> = {},
  ): Promise<ThalwegEvent<Payloads[keyof Payloads]>[]> {
    return this.client.request<ThalwegEvent<Payloads[keyof Payloads]>[]>(
      "event_query",
      {
        network: this.config.network,
        streams: opts.streams?.map(String) ?? [],
        from: opts.from,
        to: opts.to,
        limit: opts.limit,
        order: opts.order,
      },
    );
  }

  async createDurableSiphon(
    name: string,
    options: DurableSiphonOptions<Payloads> = {},
  ): Promise<DurableSiphonInfo> {
    return this.client.request<DurableSiphonInfo>("durable_siphon_create", {
      network: this.config.network,
      name,
      streams: options.streams?.map(String) ?? [],
      start: options.start ?? "earliest",
    });
  }

  async listDurableSiphons(network = this.config.network): Promise<DurableSiphonInfo[]> {
    return this.client.request<DurableSiphonInfo[]>("durable_siphon_list", {
      network,
    });
  }

  async pollDurableSiphon(
    name: string,
    limit = 25,
    waitMillis = 0,
  ): Promise<DurableSiphonDelivery<Payloads[keyof Payloads]>> {
    return this.client.request<DurableSiphonDelivery<Payloads[keyof Payloads]>>(
      "durable_siphon_poll",
      { network: this.config.network, name, limit, waitMillis },
    );
  }

  async acknowledgeDurableSiphon(
    name: string,
    deliveryId: string,
  ): Promise<DurableSiphonInfo> {
    return this.client.request<DurableSiphonInfo>("durable_siphon_ack", {
      network: this.config.network,
      name,
      deliveryId,
    });
  }

  async networkStatus(): Promise<NetworkStatus> {
    return this.client.request<NetworkStatus>("network_status", {});
  }

  async createNetwork(name: string): Promise<NetworkCreateResult> {
    return this.client.request<NetworkCreateResult>("network_create", { name });
  }

  async inviteNetwork(name: string): Promise<NetworkInviteResult> {
    return this.client.request<NetworkInviteResult>("network_invite", { name });
  }

  async joinNetwork(invitation: string): Promise<NetworkJoinResult> {
    return this.client.request<NetworkJoinResult>("network_join", {
      invitation,
    });
  }

  async listNetworks(): Promise<NetworkMembership[]> {
    return this.client.request<NetworkMembership[]>("network_list", {});
  }

  async leaveNetwork(name: string): Promise<NetworkLeaveResult> {
    return this.client.request<NetworkLeaveResult>("network_leave", { name });
  }

  async listMeshPeers(network?: string): Promise<MeshPeerStatus[]> {
    return this.client.request<MeshPeerStatus[]>("mesh_peer_list", {
      network: network ?? "",
    });
  }

  async openEnrollment(
    network = this.config.network,
    durationSeconds = 600,
  ): Promise<EnrollmentListenResult> {
    return this.client.request<EnrollmentListenResult>("enrollment_listen", {
      network,
      durationSeconds,
    });
  }

  async closeEnrollment(offerId: string): Promise<{ removed: boolean }> {
    return this.client.request("enrollment_close", { offerId });
  }

  async listEnrollmentRequests(
    network = this.config.network,
  ): Promise<EnrollmentRequest[]> {
    return this.client.request("enrollment_requests", { network });
  }

  async decideEnrollment(
    requestId: string,
    accepted: boolean,
  ): Promise<EnrollmentDecisionResult> {
    return this.client.request(
      accepted ? "enrollment_approve" : "enrollment_deny",
      { requestId },
    );
  }

  async discoverEnrollments(
    targetAddr?: string,
    waitMillis = 2500,
  ): Promise<EnrollmentCandidate[]> {
    return this.client.request("enrollment_discover", {
      targetAddr,
      waitMillis,
    });
  }

  async requestEnrollment(
    candidate: EnrollmentCandidate,
    deviceName: string,
  ): Promise<EnrollmentJoinResult> {
    return this.client.request("enrollment_join", {
      targetAddr: candidate.targetAddr,
      offerId: candidate.offer.id,
      deviceName,
    });
  }

  async dialMeshPeer(
    targetAddr: string,
    network = this.config.network,
  ): Promise<MeshDialResult> {
    return this.client.request<MeshDialResult>("mesh_dial", {
      targetAddr,
      network,
    });
  }

  async syncMeshPeer(
    targetAddr: string,
    network = this.config.network,
  ): Promise<MeshSyncResult> {
    return this.client.request<MeshSyncResult>("mesh_sync", {
      targetAddr,
      network,
    });
  }

  basin<K extends keyof Basins>(name: K): Basin<Payloads, Basins, K> {
    const configured = this.basins[name];
    if (!configured || configured.length === 0) {
      throw new Error(
        `Basin ${String(name)} has no runtime stream definition; refusing to broaden it to all streams.`,
      );
    }
    const streams = configured as string[];
    return {
      siphon: () =>
        new SiphonBuilder<Payloads, Basins[K][number], "continuous">(
          this.context,
          this.client,
          this.config.network,
          streams,
        ),
    };
  }

  siphon(): Siphon<Payloads, keyof Payloads, "continuous"> {
    return new SiphonBuilder<Payloads, keyof Payloads, "continuous">(
      this.context,
      this.client,
      this.config.network,
      [],
    );
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

function parseDurationMs(value: string | null): number {
  if (!value) return 0;
  const match = value.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) {
    throw new Error(`Unsupported duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}
