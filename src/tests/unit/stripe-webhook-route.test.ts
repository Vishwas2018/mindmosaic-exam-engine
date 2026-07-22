import { readFileSync } from "node:fs";
import { join } from "node:path";

import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Proves the webhook route's signature verification against the REAL
 * STRIPE_WEBHOOK_SECRET from this worktree's .env.local, without any
 * network access (constructEvent/generateTestHeaderString are pure local
 * HMAC — Stripe's Node SDK never calls the network for either). This
 * sandbox has no outbound network access (confirmed separately: a direct
 * curl to api.stripe.com fails at the TLS layer, and the Stripe CLI's own
 * `stripe listen`/`stripe trigger` round trip is unreachable for the same
 * reason) — see the final report for why a `stripe trigger` round trip
 * against Stripe's live test servers could not be attempted, and why this
 * local-crypto proof is the strongest verification available here.
 *
 * .env.local is read directly (never logged, never asserted against in a
 * way that would print it) purely to get the real secret value into
 * process.env before the route module (and the config module whose
 * `STRIPE_WEBHOOK_SECRET` constant is computed at import time) is loaded.
 * vi.resetModules() + dynamic import per test is what makes re-importing
 * with a freshly-stubbed env actually pick up the new value, since Vitest
 * does not reload already-evaluated modules otherwise.
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");

function readRealEnvValue(key: string): string {
  const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === key) return trimmed.slice(eq + 1).trim();
  }
  throw new Error(`${key} not found in .env.local — see the batch contract's env-var gate.`);
}

const REAL_STRIPE_SECRET_KEY = readRealEnvValue("STRIPE_SECRET_KEY");
const REAL_STRIPE_WEBHOOK_SECRET = readRealEnvValue("STRIPE_WEBHOOK_SECRET");

vi.mock("server-only", () => ({}));

const mockInsert = vi.fn();
const mockAdminFrom = vi.fn((table: string) => {
  if (table !== "subscription_events") throw new Error(`unexpected table: ${table}`);
  return { insert: mockInsert };
});
const mockAdminClient = { from: mockAdminFrom };
vi.mock("@/lib/stripe/subscriptions-admin", () => ({
  createSubscriptionsAdminClient: vi.fn(() => mockAdminClient),
}));

vi.mock("@/lib/stripe/apply-subscription-event", () => ({
  applySubscriptionEvent: vi.fn(async () => undefined),
}));

function checkoutSessionCompletedPayload(eventId: string): string {
  return JSON.stringify({
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    api_version: "2026-06-24.dahlia",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: "cs_test_123",
        object: "checkout.session",
        customer: "cus_test_123",
        subscription: "sub_test_123",
        metadata: { parent_id: "parent-1", plan: "family_monthly" },
      },
    },
  });
}

async function loadRoute() {
  vi.resetModules();
  vi.stubEnv("STRIPE_SECRET_KEY", REAL_STRIPE_SECRET_KEY);
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", REAL_STRIPE_WEBHOOK_SECRET);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  // Import the route first (which pulls in and mocks
  // apply-subscription-event as part of its own module graph), then import
  // apply-subscription-event separately — that second import is a cache
  // hit against the same mocked instance, guaranteeing both references
  // agree within this vi.resetModules() "generation". Importing both
  // concurrently via Promise.all raced Vitest's mock interception for the
  // first-ever import of a module after a reset and let the real
  // apply-subscription-event.ts run (visible as a live Stripe API call in
  // the failure output) instead of the mock.
  const routeModule = await import("@/app/api/stripe/webhook/route");
  const applyModule = await import("@/lib/stripe/apply-subscription-event");
  return { POST: routeModule.POST, applySubscriptionEvent: applyModule.applySubscriptionEvent };
}

function webhookRequest(rawBody: string, signatureHeader: string | null): Request {
  const headers: Record<string, string> = {};
  if (signatureHeader !== null) headers["stripe-signature"] = signatureHeader;
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers,
    body: rawBody,
  });
}

describe("POST /api/stripe/webhook — real STRIPE_WEBHOOK_SECRET signature verification", () => {
  beforeEach(async () => {
    mockInsert.mockReset();
    mockAdminFrom.mockClear();
    mockInsert.mockResolvedValue({ error: null });

    // The apply-subscription-event mock (unlike mockInsert, which is a
    // stable module-scope vi.fn()) is created fresh inside its vi.mock
    // factory, but Vitest's mocker memoizes that factory's result across
    // vi.resetModules() calls within one test file run — it is NOT a new
    // vi.fn() per test. `restoreMocks: true` (vitest.config.ts) doesn't
    // help either: it only restores spies to their original implementation
    // and is a no-op for a plain vi.fn() with no original to restore to,
    // so call history otherwise leaks across tests. Clear it explicitly.
    const { applySubscriptionEvent } = await import("@/lib/stripe/apply-subscription-event");
    vi.mocked(applySubscriptionEvent).mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a request with no stripe-signature header (400, not processed)", async () => {
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_missing_sig");

    const response = await POST(webhookRequest(rawBody, null));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "missing_signature" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects a request with a garbage signature (400, not processed) — proves an unverified body is never trusted", async () => {
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_bad_sig");

    const response = await POST(webhookRequest(rawBody, "t=1,v1=not_a_real_signature"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_signature" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects a validly-signed payload whose body was tampered with after signing (signature no longer matches)", async () => {
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_tampered");
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: REAL_STRIPE_WEBHOOK_SECRET,
    });
    const tamperedBody = rawBody.replace("cus_test_123", "cus_attacker_999");

    const response = await POST(webhookRequest(tamperedBody, signature));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_signature" });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("accepts a payload validly signed with the real STRIPE_WEBHOOK_SECRET from .env.local", async () => {
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_valid_once");
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: REAL_STRIPE_WEBHOOK_SECRET,
    });

    const response = await POST(webhookRequest(rawBody, signature));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert.mock.calls[0][0]).toMatchObject({
      stripe_event_id: "evt_valid_once",
      type: "checkout.session.completed",
    });
  });

  it("is idempotent: posting the same stripe_event_id twice applies exactly one write, the second is a no-op 200", async () => {
    const { POST, applySubscriptionEvent } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_duplicate_delivery");
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: REAL_STRIPE_WEBHOOK_SECRET,
    });

    // First delivery: the idempotency-ledger insert succeeds.
    mockInsert.mockResolvedValueOnce({ error: null });
    const first = await POST(webhookRequest(rawBody, signature));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ received: true });

    // Second delivery of the exact same event id: Postgres reports a
    // unique-constraint conflict on stripe_event_id (23505) — Stripe's
    // at-least-once delivery makes this routine, not exceptional.
    mockInsert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    const second = await POST(webhookRequest(rawBody, signature));
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ received: true, duplicate: true });

    expect(mockInsert).toHaveBeenCalledTimes(2);

    // Only the first delivery reaches the write path; the duplicate is skipped.
    expect(applySubscriptionEvent).toHaveBeenCalledTimes(1);
  });

  it("returns 503 without reading the body when Stripe env vars are unset", async () => {
    vi.resetModules();
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const response = await POST(webhookRequest(checkoutSessionCompletedPayload("evt_unconfigured"), null));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "not_configured" });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
