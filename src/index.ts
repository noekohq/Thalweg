import { DaemonClient, DaemonEvent } from "./client";

export interface ThalwegConfiguration {
  socket: string;
  network: string;
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
      void this.runBuffered(callback);
      return { stop: async () => undefined };
    }

    let subscriptionId: string | null = null;
    const ready = this.client
      .subscribe(this.network, this.config.streams, async (event) => {
        await callback(
          this.context,
          event as RunArgs<M, P, A>,
        );
      })
      .then((id) => {
        subscriptionId = id;
      });

    return {
      stop: async () => {
        await ready;
        if (subscriptionId) {
          await this.client.unsubscribe(subscriptionId);
        }
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
    this.client = new DaemonClient(config.socket);
    this.basins = basins;
    this.context = {
      ingest: async (stream, payload, opts = {}) => {
        return this.client.request<ThalwegEvent<Payloads[typeof stream]>>(
          "event_ingest",
          {
            network: this.config.network,
            stream: String(stream),
            payload,
            occurredAt: opts.occurredAt,
            eventId: opts.eventId,
          },
        );
      },
    };
  }

  async ingest<S extends keyof Payloads>(
    stream: S,
    payload: Payloads[S],
    opts?: IngestOptions,
  ): Promise<ThalwegEvent<Payloads[S]>> {
    return this.context.ingest(stream, payload, opts);
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
      },
    );
  }

  async networkStatus(): Promise<unknown> {
    return this.client.request("network_status", {});
  }

  basin<K extends keyof Basins>(name: K): Basin<Payloads, Basins, K> {
    const streams = (this.basins[name] ?? []) as string[];
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
