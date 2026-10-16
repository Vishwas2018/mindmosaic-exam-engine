import "server-only";

import { NextResponse } from "next/server";

/**
 * Basic fixed-window rate limiter for Route Handlers.
 *
 * HONEST SCOPE — read before trusting it. State lives in this module's memory,
 * so on a serverless host (Vercel) it is per warm instance, not global: a
 * determined caller who is spread across instances gets more than `limit`.
 * What it does stop is the cheap, common abuse — a script or a runaway client
 * loop hammering one endpoint, which almost always lands on a warm instance.
 * It is a floor, not a wall. A global limit needs a shared store (Upstash /
 * Vercel KV) or Vercel Firewall rate-limit rules; that is a dashboard /
 * account step listed as an external prerequisite in the beta-hardening PR.
 *
 * Sign-in, sign-up, password reset and student code+PIN sign-in do NOT pass
 * through this app: the browser talks to Supabase GoTrue directly with the
 * public anon key. Those are limited by GoTrue's own [auth.rate_limit]
 * settings (supabase/config.toml locally, the dashboard on the hosted
 * project) and CAPTCHA, not by this module.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitRule {
  /** Namespace, e.g. "exam-session-create". Keeps routes from sharing a budget. */
  readonly name: string;
  readonly limit: number;
  readonly windowMs: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  /* Still huge after dropping expired entries (an attacker rotating keys):
     drop the oldest insertion-order entries rather than grow without bound. */
  if (buckets.size > MAX_BUCKETS) {
    let excess = buckets.size - MAX_BUCKETS;
    for (const key of buckets.keys()) {
      if (excess-- <= 0) break;
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  readonly ok: boolean;
  readonly retryAfterSeconds: number;
}

/** Counts one hit for `subject` against `rule`. Pure of HTTP; used by the helper below. */
export function consumeRateLimit(
  rule: RateLimitRule,
  subject: string,
  now: number = Date.now(),
): RateLimitResult {
  if (buckets.size > MAX_BUCKETS) prune(now);

  const key = `${rule.name}:${subject}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > rule.limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * A best-effort caller identity when there is no signed-in user: the first
 * address in x-forwarded-for (set by the platform, not the client, on Vercel),
 * else x-real-ip, else a shared "unknown" bucket (strict, by design).
 */
export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Returns a 429 response when `subject` is over `rule`, else null. Call it
 * after authentication with the user id as the subject (an authenticated
 * caller's budget should not be shared with whoever is behind the same NAT),
 * or with clientAddress(request) before authentication.
 */
export function rateLimitResponse(rule: RateLimitRule, subject: string): NextResponse | null {
  const result = consumeRateLimit(rule, subject);
  if (result.ok) return null;

  return NextResponse.json(
    { ok: false, error: "rate_limited", message: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}

/** Test seam: forget all counters. */
export function resetRateLimits(): void {
  buckets.clear();
}

/** Budgets for the endpoints that write on a child's or parent's behalf. */
export const RATE_LIMITS = {
  examSessionCreate: { name: "exam-session-create", limit: 20, windowMs: 60_000 },
  examSubmit: { name: "exam-submit", limit: 30, windowMs: 60_000 },
  /* Autosave fires on a timer while a child is answering; generous, but finite. */
  examResponses: { name: "exam-responses", limit: 240, windowMs: 60_000 },
  childMutate: { name: "parent-child-mutate", limit: 20, windowMs: 60_000 },
  childErase: { name: "parent-child-erase", limit: 5, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;
