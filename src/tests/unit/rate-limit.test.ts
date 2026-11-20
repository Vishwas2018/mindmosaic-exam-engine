import { beforeEach, describe, expect, it } from "vitest";

import { clientAddress, consumeRateLimit, resetRateLimitsForTests } from "@/lib/security/rate-limit";

const rule = { name: "t", limit: 3, windowMs: 1000 };
const from = (ip?: string) => new Request("http://localhost/x", { headers: ip ? { "x-forwarded-for": ip } : {} });

beforeEach(() => resetRateLimitsForTests());

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
});
