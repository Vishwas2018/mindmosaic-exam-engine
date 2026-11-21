/**
 * Shared state for unauthenticated-endpoint protection (rate limits, one-time submit markers).
 *
 * Two implementations behind one interface:
 *  - UpstashGuardStore: Redis over the Upstash REST API (works from serverless/edge, no TCP). Enabled when
 *    UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or the Vercel Marketplace names KV_REST_API_URL /
 *    KV_REST_API_TOKEN) are set. Counters and markers are global across instances.
 *  - MemoryGuardStore: per-instance fallback (local, CI, or when Redis is not provisioned).
 *
 * Hosted deployments (VERCEL=1) FAIL CLOSED: the guard is mandatory there, so a missing or failing Redis refuses
 * the request instead of disclosing answers without replay protection. Local runs and CI use the memory store.
 * MM_GUEST_GUARD=memory is an explicit, owner-set degraded mode for a hosted environment without Redis.
 * Nothing stored here contains question content; keys carry hashed client and ticket identifiers.
 */
export interface GuardStore {
  readonly kind: "redis" | "memory";
  /** Fixed-window counter: increments, starts the window on first hit, returns count and ms until reset. */
  hit(key: string, windowMs: number): Promise<{ count: number; resetInMs: number }>;
  /** Atomic set-if-absent. Resolves true when this call created the key. */
  claim(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  get(key: string): Promise<string | null>;
}

const MAX_MEMORY_KEYS = 5000;

export class MemoryGuardStore implements GuardStore {
  readonly kind = "memory" as const;
  private readonly counters = new Map<string, { count: number; resetAt: number }>();
  private readonly claims = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly clock: () => number = Date.now) {}

  async hit(key: string, windowMs: number) {
    const now = this.clock();
    let bucket = this.counters.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.prune(this.counters, now, (value) => value.resetAt);
      bucket = { count: 0, resetAt: now + windowMs };
      this.counters.set(key, bucket);
    }
    bucket.count += 1;
    return { count: bucket.count, resetInMs: Math.max(1, bucket.resetAt - now) };
  }

  async claim(key: string, value: string, ttlSeconds: number) {
    const now = this.clock();
    const existing = this.claims.get(key);
    if (existing && existing.expiresAt > now) return false;
    this.prune(this.claims, now, (entry) => entry.expiresAt);
    this.claims.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
    return true;
  }

  async get(key: string) {
    const entry = this.claims.get(key);
    return entry && entry.expiresAt > this.clock() ? entry.value : null;
  }

  private prune<T>(map: Map<string, T>, now: number, expiry: (value: T) => number) {
    if (map.size < MAX_MEMORY_KEYS) return;
    for (const [key, value] of map) if (expiry(value) <= now) map.delete(key);
    while (map.size >= MAX_MEMORY_KEYS) {
      const oldest = map.keys().next().value;
      if (oldest === undefined) break;
      map.delete(oldest);
    }
  }

  reset() {
    this.counters.clear();
    this.claims.clear();
  }
}

type RedisReply = { result?: unknown; error?: string };

export class UpstashGuardStore implements GuardStore {
  readonly kind = "redis" as const;

  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly timeoutMs = 800,
    private readonly fetcher: typeof fetch = (...args) => fetch(...args),
  ) {}

  private async pipeline(commands: (string | number)[][]): Promise<RedisReply[]> {
    const response = await this.fetcher(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) throw new Error(`guard store HTTP ${response.status}`);
    const replies = (await response.json()) as RedisReply[];
    const failed = replies.find((reply) => reply.error);
    if (failed) throw new Error("guard store command failed");
    return replies;
  }

  async hit(key: string, windowMs: number) {
    // INCR then PEXPIRE NX (sets the TTL only on the first hit of a window) and PTTL, in one round trip.
    const [count, , ttl] = await this.pipeline([
      ["INCR", key],
      ["PEXPIRE", key, windowMs, "NX"],
      ["PTTL", key],
    ]);
    const ms = Number(ttl.result);
    return { count: Number(count.result), resetInMs: ms > 0 ? ms : windowMs };
  }

  async claim(key: string, value: string, ttlSeconds: number) {
    const [reply] = await this.pipeline([["SET", key, value, "EX", ttlSeconds, "NX"]]);
    return reply.result === "OK";
  }

  async get(key: string) {
    const [reply] = await this.pipeline([["GET", key]]);
    return typeof reply.result === "string" ? reply.result : null;
  }
}

const memoryStore = new MemoryGuardStore();
let override: GuardStore | undefined;

export function guardStore(env: NodeJS.ProcessEnv = process.env): GuardStore {
  if (override) return override;
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token && url.startsWith("https://") ? new UpstashGuardStore(url, token) : memoryStore;
}

/** True when a hosted deployment must have a healthy shared store before it may serve guest answers. */
export function guardRequired(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL === "1" && env.MM_GUEST_GUARD !== "memory";
}

export function setGuardStoreForTests(store: GuardStore | undefined) {
  override = store;
  memoryStore.reset();
}
