import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clientAddress, consumeRateLimit, resetRateLimitsForTests } from "@/lib/security/rate-limit";

const rule = { name: "t", limit: 3, windowMs: 1000 };
const from = (ip?: string) => new Request("http://localhost/x", { headers: ip ? { "x-forwarded-for": ip } : {} });

beforeEach(() => {
  resetRateLimitsForTests();
  vi.stubEnv("VERCEL", "1");
});
afterEach(() => vi.unstubAllEnvs());

describe("rate limiter", () => {
  it("allows up to the limit then blocks with a retry hint", () => {
    for (let i = 0; i < 3; i += 1) expect(consumeRateLimit(from("1.1.1.1"), rule, 0).allowed).toBe(true);
    const blocked = consumeRateLimit(from("1.1.1.1"), rule, 400);
    expect(blocked).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });

  it("tracks clients independently and resets after the window", () => {
    for (let i = 0; i < 4; i += 1) consumeRateLimit(from("1.1.1.1"), rule, 0);
    expect(consumeRateLimit(from("2.2.2.2"), rule, 0).allowed).toBe(true);
    expect(consumeRateLimit(from("1.1.1.1"), rule, 1000).allowed).toBe(true);
  });

  it("uses only the first forwarded hop and ignores unidentifiable clients", () => {
    expect(clientAddress(from("9.9.9.9, 10.0.0.1"))).toBe("9.9.9.9");
    for (let i = 0; i < 10; i += 1) expect(consumeRateLimit(from(), rule, 0).allowed).toBe(true);
  });

  it("ignores forwarded headers off Vercel so a spoofed address cannot dodge the limit", () => {
    vi.stubEnv("VERCEL", "");
    expect(clientAddress(from("1.2.3.4"))).toBeNull();
    for (let i = 0; i < 10; i += 1) expect(consumeRateLimit(from(`5.5.5.${i}`), rule, 0).allowed).toBe(true);
  });

  it("rejects malformed addresses and buckets IPv6 by /64", () => {
    expect(clientAddress(from("not an ip!"))).toBeNull();
    expect(clientAddress(from("2001:db8:1:2:aaaa::1"))).toBe(clientAddress(from("2001:db8:1:2:bbbb::9")));
    expect(clientAddress(from("2001:db8:1:3::1"))).not.toBe(clientAddress(from("2001:db8:1:2::1")));
  });
});
