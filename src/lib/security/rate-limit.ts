import { createHash } from "node:crypto";

import { guardRequired, guardStore } from "./guard-store";

/**
 * Fixed-window rate limiting for unauthenticated endpoints, backed by the shared guard store (Redis when
 * configured, otherwise per-instance memory; see guard-store.ts and docs/GUEST_ABUSE_PROTECTION.md).
 *
 * Two keys can apply to one request:
 *  - the client address (a generous ceiling, so a school or family behind one NAT is not throttled), and
 *  - the browser identifier (a tight per-browser limit), so one noisy device cannot consume the shared ceiling
 *    and a script that discards its cookie is still stopped by the address ceiling.
 *
 * The address is the first hop of x-forwarded-for / x-real-ip, trusted only on Vercel (the edge overwrites it);
 * elsewhere (local runs, CI) address-based limiting is off so the e2e suites, which share one loopback client,
 * are unaffected. Hosted, the store is mandatory and an error or missing Redis FAILS CLOSED (reason "unavailable");
 * off-host, a store error fails open.
 */
export type RateLimitRule = { name: string; limit: number; windowMs: number };
export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; reason: "limited" | "unavailable"; retryAfterSeconds: number };

const UNAVAILABLE_RETRY_SECONDS = 15;

export function clientAddress(request: Request, env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.VERCEL !== "1") return null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || request.headers.get("x-real-ip")?.trim() || "";
  if (!candidate || candidate.length > 64) return null;
  if (/^[0-9a-f.:]+$/i.test(candidate) === false) return null;
  // IPv6: key by /64 so one subscriber cannot mint unlimited addresses.
  if (candidate.includes(":")) return candidate.toLowerCase().split(":").slice(0, 4).join(":");
  return candidate;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export async function consumeRateLimit(
  request: Request,
  rules: { address?: RateLimitRule; browser?: RateLimitRule },
  browserId?: string,
): Promise<RateLimitDecision> {
  if (process.env.MM_GUEST_RATE_LIMIT === "off") return { allowed: true };
  const checks: { key: string; rule: RateLimitRule }[] = [];
  const address = clientAddress(request);
  if (address && rules.address) checks.push({ key: `rl:${rules.address.name}:ip:${digest(address)}`, rule: rules.address });
  if (browserId && rules.browser) checks.push({ key: `rl:${rules.browser.name}:b:${digest(browserId)}`, rule: rules.browser });
  const store = guardStore();
  const required = guardRequired();
  if (required && store.kind !== "redis") return { allowed: false, reason: "unavailable", retryAfterSeconds: UNAVAILABLE_RETRY_SECONDS };
  if (!checks.length) return { allowed: true };

  let retryAfterMs = 0;
  for (const { key, rule } of checks) {
    try {
      const { count, resetInMs } = await store.hit(key, rule.windowMs);
      if (count > rule.limit) retryAfterMs = Math.max(retryAfterMs, resetInMs);
    } catch {
      if (required) return { allowed: false, reason: "unavailable", retryAfterSeconds: UNAVAILABLE_RETRY_SECONDS };
      // Off-host: fail open, see the module comment.
    }
  }
  return retryAfterMs > 0
    ? { allowed: false, reason: "limited", retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) }
    : { allowed: true };
}

export type SubmissionClaim = "first" | "same" | "different" | "unknown";

/**
 * Atomic first-submit marker for a guest ticket. "first": this call recorded it. "same": a replay with identical
 * answers (idempotent). "different": answers changed after disclosure (refuse). "unknown": store unavailable; the
 * caller must refuse when guardRequired() (hosted) and may rely on its cookie record otherwise.
 */
export async function claimSubmission(ticketId: string, answersDigest: string, ttlSeconds: number): Promise<SubmissionClaim> {
  const store = guardStore();
  if (guardRequired() && store.kind !== "redis") return "unknown";
  const key = `guest:spent:${ticketId}`;
  try {
    if (await store.claim(key, answersDigest, ttlSeconds)) return "first";
    const recorded = await store.get(key);
    if (recorded === null) return "unknown";
    return recorded === answersDigest ? "same" : "different";
  } catch {
    return "unknown";
  }
}
