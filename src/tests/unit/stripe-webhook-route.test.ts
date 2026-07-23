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
 * way that would print it) purely to get a secret value into process.env
 * before the route module (and the config module whose
 * `STRIPE_WEBHOOK_SECRET` constant is computed at import time) is loaded.
 * vi.resetModules() + dynamic import per test is what makes re-importing
 * with a freshly-stubbed env actually pick up the new value, since Vitest
 * does not reload already-evaluated modules otherwise.
 *
 * In CI (.github/workflows/ci.yml) there is no .env.local at all — the
 * workflow instead sets obviously-fake placeholder STRIPE_SECRET_KEY/
 * STRIPE_WEBHOOK_SECRET values directly as job env, which arrive in
 * process.env before this file ever runs. `readRealEnvValue` prefers an
 * already-set process.env value (CI) and only falls back to reading
 * .env.local (local dev, where these are never exported into the shell
 * environment) when it isn't set — either way the same value both signs
 * and verifies the test payload below, so the assertions are identical.
 *
 * The DB write path (record + apply + mark-complete, in one transaction)
 * lives entirely inside the apply_stripe_subscription_event RPC now (see
 * src/lib/stripe/apply-subscription-event.ts and
 * supabase/migrations/20260723090000_stripe_webhook_transactional_apply.sql),
 * so this route-level suite mocks applySubscriptionEvent's outcome/rejection
 * and asserts on the route's response — it does not re-prove RPC atomicity.
 * That's covered against a real local Postgres in
 * tests/rls/stripe-subscription-events.test.ts (injected update failure
 * leaving no processed row, duplicate replay, out-of-order writes, and the
 * service-role-only execute grant).
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");

function readRealEnvValue(key: string): string {
  const fromProcessEnv = process.env[key];
  if (fromProcessEnv !== undefined && fromProcessEnv.length > 0) return fromProcessEnv;
  const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === key) return trimmed.slice(eq + 1).trim();
  }
  throw new Error(`${key} not found in process.env or .env.local — see the batch contract's env-var gate.`);
}

const REAL_STRIPE_SECRET_KEY = readRealEnvValue("STRIPE_SECRET_KEY");
const REAL_STRIPE_WEBHOOK_SECRET = readRealEnvValue("STRIPE_WEBHOOK_SECRET");

vi.mock("server-only", () => ({}));

const mockAdminClient = { rpc: vi.fn() };
vi.mock("@/lib/stripe/subscriptions-admin", () => ({
  createSubscriptionsAdminClient: vi.fn(() => mockAdminClient),
}));

const mockApplySubscriptionEvent = vi.fn();
vi.mock("@/lib/stripe/apply-subscription-event", () => ({
  applySubscriptionEvent: mockApplySubscriptionEvent,
  SubscriptionEventApplyError: class SubscriptionEventApplyError extends Error {},
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
  const routeModule = await import("@/app/api/stripe/webhook/route");
  return { POST: routeModule.POST };
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
  beforeEach(() => {
    mockApplySubscriptionEvent.mockReset();
    mockApplySubscriptionEvent.mockResolvedValue("applied");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects a request with no stripe-signature header (400, not processed)", async () => {
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_missing_sig");

    const response = await POST(webhookRequest(rawBody, null));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "missing_signature" });
    expect(mockApplySubscriptionEvent).not.toHaveBeenCalled();
  });

  it("rejects a request with a garbage signature (400, not processed) — proves an unverified body is never trusted", async () => {
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_bad_sig");

    const response = await POST(webhookRequest(rawBody, "t=1,v1=not_a_real_signature"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_signature" });
    expect(mockApplySubscriptionEvent).not.toHaveBeenCalled();
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
    expect(mockApplySubscriptionEvent).not.toHaveBeenCalled();
  });

  it("accepts a payload validly signed with the real STRIPE_WEBHOOK_SECRET from .env.local (happy path parity: 200, received: true)", async () => {
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_valid_once");
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: REAL_STRIPE_WEBHOOK_SECRET,
    });

    const response = await POST(webhookRequest(rawBody, signature));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(mockApplySubscriptionEvent).toHaveBeenCalledTimes(1);
    const [, , calledEvent] = mockApplySubscriptionEvent.mock.calls[0];
    expect(calledEvent).toMatchObject({ id: "evt_valid_once", type: "checkout.session.completed" });
  });

  it("a genuine duplicate/replay (RPC reports duplicate) is idempotent: still 200, marked duplicate", async () => {
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_duplicate_delivery");
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: REAL_STRIPE_WEBHOOK_SECRET,
    });

    mockApplySubscriptionEvent.mockResolvedValueOnce("duplicate");
    const response = await POST(webhookRequest(rawBody, signature));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
  });

  it("an injected entitlement-update failure (RPC error) returns non-2xx, never 200 — the failure is never silently discarded", async () => {
    const { SubscriptionEventApplyError } = await import("@/lib/stripe/apply-subscription-event");
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_update_failure");
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: REAL_STRIPE_WEBHOOK_SECRET,
    });

    mockApplySubscriptionEvent.mockRejectedValueOnce(
      new SubscriptionEventApplyError("subscriptions_status_check violation"),
    );
    const response = await POST(webhookRequest(rawBody, signature));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "event_apply_failed" });
  });

  it("a Stripe retrieval failure (network/API error resolving the patch) returns non-2xx, never 200", async () => {
    const { POST } = await loadRoute();
    const rawBody = checkoutSessionCompletedPayload("evt_stripe_retrieval_failure");
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: rawBody,
      secret: REAL_STRIPE_WEBHOOK_SECRET,
    });

    mockApplySubscriptionEvent.mockRejectedValueOnce(new Error("stripe api unreachable"));
    const response = await POST(webhookRequest(rawBody, signature));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "event_apply_failed" });
  });

  it("returns 503 without reading the body when Stripe env vars are unset", async () => {
    vi.resetModules();
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const response = await POST(webhookRequest(checkoutSessionCompletedPayload("evt_unconfigured"), null));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "not_configured" });
    expect(mockApplySubscriptionEvent).not.toHaveBeenCalled();
  });
});
