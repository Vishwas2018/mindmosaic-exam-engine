import { createHash } from "node:crypto";

import { guardStore } from "./guard-store";

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
 * are unaffected. A store error fails open: an unavailable limiter must not stop a child sitting an exam.
 */
export type RateLimitRule = { name: string; limit: number; windowMs: number };
export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

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
  if (!checks.length) return { allowed: true };

  const store = guardStore();
  let retryAfterMs = 0;
  for (const { key, rule } of checks) {
    try {
      const { count, resetInMs } = await store.hit(key, rule.windowMs);
      if (count > rule.limit) retryAfterMs = Math.max(retryAfterMs, resetInMs);
    } catch {
      // Fail open: see the module comment.
    }
  }
  return retryAfterMs > 0 ? { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) } : { allowed: true };
}

export type SubmissionClaim = "first" | "same" | "different" | "unknown";

/**
 * Atomic first-submit marker for a guest ticket. "first": this call recorded it. "same": a replay with identical
 * answers (idempotent). "different": answers changed after disclosure (refuse). "unknown": store unavailable, so
 * the caller relies on its cookie record.
 */
export async function claimSubmission(ticketId: string, answersDigest: string, ttlSeconds: number): Promise<SubmissionClaim> {
  const store = guardStore();
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
