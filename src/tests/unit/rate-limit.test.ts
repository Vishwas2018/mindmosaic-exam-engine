import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemoryGuardStore, UpstashGuardStore, setGuardStoreForTests } from "@/lib/security/guard-store";
import { claimSubmission, clientAddress, consumeRateLimit } from "@/lib/security/rate-limit";

const rule = { name: "t", limit: 3, windowMs: 1000 };
const rules = { address: rule, browser: { name: "t", limit: 2, windowMs: 1000 } };
const from = (ip?: string) => new Request("http://localhost/x", { headers: ip ? { "x-forwarded-for": ip } : {} });

let clock = 0;
let store: MemoryGuardStore;

beforeEach(() => {
  clock = 0;
  store = new MemoryGuardStore(() => clock);
  setGuardStoreForTests(store);
  vi.stubEnv("VERCEL", "1");
});
afterEach(() => {
  vi.unstubAllEnvs();
  setGuardStoreForTests(undefined);
});

describe("rate limiter", () => {
  it("allows up to the address limit then blocks with a retry hint", async () => {
    for (let i = 0; i < 3; i += 1) expect((await consumeRateLimit(from("1.1.1.1"), { address: rule })).allowed).toBe(true);
    clock = 400;
    expect(await consumeRateLimit(from("1.1.1.1"), { address: rule })).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });

  it("tracks clients independently and resets after the window", async () => {
    for (let i = 0; i < 4; i += 1) await consumeRateLimit(from("1.1.1.1"), { address: rule });
    expect((await consumeRateLimit(from("2.2.2.2"), { address: rule })).allowed).toBe(true);
    clock = 1000;
    expect((await consumeRateLimit(from("1.1.1.1"), { address: rule })).allowed).toBe(true);
  });

  it("limits one browser tightly without throttling its neighbours on the same address", async () => {
    // A shared NAT: three browsers, one address. The noisy one is stopped; the others are not.
    const noisy = [];
    for (let i = 0; i < 3; i += 1) noisy.push(await consumeRateLimit(from("9.9.9.9"), rules, "browser-noisy"));
    expect(noisy.map((d) => d.allowed)).toEqual([true, true, false]);
    expect((await consumeRateLimit(from("9.9.9.9"), { address: { ...rule, limit: 100 }, browser: rules.browser }, "browser-quiet")).allowed).toBe(true);
  });

  it("still stops a script that discards its cookie, by address", async () => {
    const decisions = [];
    for (let i = 0; i < 5; i += 1) decisions.push((await consumeRateLimit(from("7.7.7.7"), rules, `fresh-${i}`)).allowed);
    expect(decisions).toEqual([true, true, true, false, false]);
  });

  it("uses only the first forwarded hop, ignores unidentifiable clients, and ignores headers off Vercel", async () => {
    expect(clientAddress(from("9.9.9.9, 10.0.0.1"))).toBe("9.9.9.9");
    for (let i = 0; i < 10; i += 1) expect((await consumeRateLimit(from(), { address: rule })).allowed).toBe(true);
    vi.stubEnv("VERCEL", "");
    expect(clientAddress(from("1.2.3.4"))).toBeNull();
    for (let i = 0; i < 10; i += 1) expect((await consumeRateLimit(from(`5.5.5.${i}`), { address: rule })).allowed).toBe(true);
  });

  it("rejects malformed addresses and buckets IPv6 by /64", () => {
    expect(clientAddress(from("not an ip!"))).toBeNull();
    expect(clientAddress(from("2001:db8:1:2:aaaa::1"))).toBe(clientAddress(from("2001:db8:1:2:bbbb::9")));
    expect(clientAddress(from("2001:db8:1:3::1"))).not.toBe(clientAddress(from("2001:db8:1:2::1")));
  });

  it("fails open when the shared store is down", async () => {
    setGuardStoreForTests({
      kind: "redis",
      hit: async () => { throw new Error("down"); },
      claim: async () => { throw new Error("down"); },
      get: async () => { throw new Error("down"); },
    });
    for (let i = 0; i < 10; i += 1) expect((await consumeRateLimit(from("3.3.3.3"), { address: rule })).allowed).toBe(true);
    expect(await claimSubmission("t1", "d1", 60)).toBe("unknown");
  });
});

describe("submission claim", () => {
  it("is atomic: first wins, identical replay is idempotent, changed answers are refused", async () => {
    expect(await claimSubmission("ticket-1", "digest-a", 60)).toBe("first");
    expect(await claimSubmission("ticket-1", "digest-a", 60)).toBe("same");
    expect(await claimSubmission("ticket-1", "digest-b", 60)).toBe("different");
    expect(await claimSubmission("ticket-2", "digest-b", 60)).toBe("first");
  });

  it("lets exactly one of many parallel submissions claim a ticket", async () => {
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => claimSubmission("race", `d${i}`, 60)));
    expect(results.filter((r) => r === "first")).toHaveLength(1);
    expect(results.filter((r) => r === "different")).toHaveLength(19);
  });

  it("expires after the ticket lifetime", async () => {
    await claimSubmission("short", "d", 1);
    clock = 1500;
    expect(await claimSubmission("short", "other", 1)).toBe("first");
  });
});

/** Minimal Redis command interpreter behind the Upstash REST pipeline wire format. */
function fakeUpstash(now: () => number) {
  const data = new Map<string, { value: string | number; expiresAt?: number }>();
  const live = (key: string) => {
    const entry = data.get(key);
    if (entry?.expiresAt !== undefined && entry.expiresAt <= now()) data.delete(key);
    return data.get(key);
  };
  const calls: unknown[] = [];
  const fetcher = (async (url: string, init: { body: string; headers: Record<string, string> }) => {
    calls.push({ url, auth: init.headers.Authorization });
    const replies = (JSON.parse(init.body) as (string | number)[][]).map(([cmd, key, a, b, c]) => {
      const k = String(key);
      switch (cmd) {
        case "INCR": {
          const entry = live(k) ?? { value: 0 };
          entry.value = Number(entry.value) + 1;
          data.set(k, entry);
          return { result: entry.value };
        }
        case "PEXPIRE": {
          const entry = live(k);
          if (entry && (b !== "NX" || entry.expiresAt === undefined)) { entry.expiresAt = now() + Number(a); return { result: 1 }; }
          return { result: 0 };
        }
        case "PTTL": {
          const entry = live(k);
          return { result: entry?.expiresAt === undefined ? -1 : entry.expiresAt - now() };
        }
        case "SET": {
          if (live(k)) return { result: null };
          data.set(k, { value: String(a), expiresAt: now() + Number(c) * 1000 });
          return { result: "OK" };
        }
        case "GET":
          return { result: live(k)?.value?.toString() ?? null };
        default:
          return { error: "ERR unknown command" };
      }
    });
    return { ok: true, status: 200, json: async () => replies };
  }) as unknown as typeof fetch;
  return { fetcher, calls };
}

describe("Upstash guard store (wire format)", () => {
  it("implements windows and atomic claims over the REST pipeline", async () => {
    const redis = fakeUpstash(() => clock);
    const remote = new UpstashGuardStore("https://example.upstash.io/", "secret-token", 800, redis.fetcher);
    expect(await remote.hit("k", 1000)).toEqual({ count: 1, resetInMs: 1000 });
    clock = 300;
    expect(await remote.hit("k", 1000)).toEqual({ count: 2, resetInMs: 700 });
    clock = 1000;
    expect((await remote.hit("k", 1000)).count).toBe(1);

    expect(await remote.claim("c", "v1", 10)).toBe(true);
    expect(await remote.claim("c", "v2", 10)).toBe(false);
    expect(await remote.get("c")).toBe("v1");
    expect(redis.calls.every((c) => (c as { url: string; auth: string }).url === "https://example.upstash.io/pipeline" && (c as { auth: string }).auth === "Bearer secret-token")).toBe(true);
  });

  it("surfaces HTTP and command errors so callers can fail open", async () => {
    const bad = new UpstashGuardStore("https://x.upstash.io", "t", 800, (async () => ({ ok: false, status: 500, json: async () => [] })) as unknown as typeof fetch);
    await expect(bad.hit("k", 1000)).rejects.toThrow();
    const errored = new UpstashGuardStore("https://x.upstash.io", "t", 800, (async () => ({ ok: true, status: 200, json: async () => [{ error: "WRONGTYPE" }] })) as unknown as typeof fetch);
    await expect(errored.claim("k", "v", 10)).rejects.toThrow();
  });
});
