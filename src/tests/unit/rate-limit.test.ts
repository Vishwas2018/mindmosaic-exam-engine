import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  RATE_LIMITS,
  clientAddress,
  consumeRateLimit,
  rateLimitResponse,
  resetRateLimits,
} from "@/lib/security/rate-limit";

const RULE = { name: "t", limit: 3, windowMs: 1000 } as const;

describe("consumeRateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit then refuses with a Retry-After", () => {
    expect(consumeRateLimit(RULE, "a", 0).ok).toBe(true);
    expect(consumeRateLimit(RULE, "a", 10).ok).toBe(true);
    expect(consumeRateLimit(RULE, "a", 20).ok).toBe(true);

    const blocked = consumeRateLimit(RULE, "a", 30);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("resets once the window has passed", () => {
    for (let i = 0; i < 4; i += 1) consumeRateLimit(RULE, "a", 0);
    expect(consumeRateLimit(RULE, "a", 500).ok).toBe(false);
    expect(consumeRateLimit(RULE, "a", 1001).ok).toBe(true);
  });

  it("keeps subjects and rule names independent", () => {
    for (let i = 0; i < 4; i += 1) consumeRateLimit(RULE, "a", 0);
    expect(consumeRateLimit(RULE, "b", 0).ok).toBe(true);
    expect(consumeRateLimit({ ...RULE, name: "other" }, "a", 0).ok).toBe(true);
  });
});

describe("rateLimitResponse", () => {
  beforeEach(() => resetRateLimits());

  it("returns null while under the limit and a 429 with Retry-After when over", async () => {
    const rule = { name: "r", limit: 1, windowMs: 60_000 } as const;
    expect(rateLimitResponse(rule, "u")).toBeNull();

    const blocked = rateLimitResponse(rule, "u");
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect((await blocked!.json()).error).toBe("rate_limited");
  });
});

describe("clientAddress", () => {
  it("uses the first x-forwarded-for hop, then x-real-ip, then a shared bucket", () => {
    const req = (headers: Record<string, string>) => new Request("http://x", { headers });
    expect(clientAddress(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientAddress(req({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientAddress(req({}))).toBe("unknown");
  });
});

describe("budgets", () => {
  it("leaves autosave looser than submit, and erase the tightest", () => {
    expect(RATE_LIMITS.examResponses.limit).toBeGreaterThan(RATE_LIMITS.examSubmit.limit);
    expect(RATE_LIMITS.childErase.limit).toBeLessThan(RATE_LIMITS.childMutate.limit);
  });
});
