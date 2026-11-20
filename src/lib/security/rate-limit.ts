/**
 * Best-effort fixed-window rate limiter for unauthenticated endpoints.
 *
 * State lives in the memory of one server instance, so on a serverless host each warm instance
 * counts separately. It slows harvesting and scripted abuse but is NOT a global quota: pair it with
 * a platform firewall rule (see docs/GUEST_ABUSE_PROTECTION.md) for a hard ceiling.
 *
 * The client is identified by the first hop of x-forwarded-for / x-real-ip, trusted only on Vercel (see
 * clientAddress). Elsewhere (local runs, CI) requests are not limited, so the e2e suites, which share one
 * loopback client, are unaffected.
 */
type Bucket = { count: number; resetAt: number };

const MAX_TRACKED_CLIENTS = 5000;
const buckets = new Map<string, Bucket>();

export type RateLimitRule = { name: string; limit: number; windowMs: number };
export type RateLimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Forwarded-address headers are client-controlled unless a trusted edge overwrites them. Only Vercel does (it
 * sets VERCEL=1 for the runtime), so elsewhere they are ignored and a spoofed header cannot rotate buckets.
 * IPv6 clients are keyed by /64 so one subscriber cannot mint unlimited addresses.
 */
export function clientAddress(request: Request, env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.VERCEL !== "1") return null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || request.headers.get("x-real-ip")?.trim() || "";
  if (!candidate || candidate.length > 64) return null;
  if (/^[0-9a-f.:]+$/i.test(candidate) === false) return null;
  if (candidate.includes(":")) return candidate.toLowerCase().split(":").slice(0, 4).join(":");
  return candidate;
}

export function consumeRateLimit(request: Request, rule: RateLimitRule, now = Date.now()): RateLimitDecision {
  if (process.env.MM_GUEST_RATE_LIMIT === "off") return { allowed: true };
  const address = clientAddress(request);
  if (!address) return { allowed: true };

  const key = `${rule.name}|${address}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_CLIENTS) pruneExpired(now);
    bucket = { count: 0, resetAt: now + rule.windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count <= rule.limit) return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
}

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  // Still full of live buckets: drop the oldest insertions so memory stays bounded.
  while (buckets.size >= MAX_TRACKED_CLIENTS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

export function resetRateLimitsForTests() {
  buckets.clear();
}
