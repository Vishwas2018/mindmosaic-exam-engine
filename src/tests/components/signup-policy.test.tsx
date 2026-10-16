import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

import { PUBLIC_SIGNUP_ENABLED } from "@/features/auth/signup-policy";

/**
 * Public sign-up is CLOSED (invite-only beta) on this deployment. This file
 * is what stops the app's half of that from drifting out of step with the
 * half that actually matters.
 *
 * These cases are deliberately NOT a security control and must never be
 * read as one: the anon key ships to every browser, so GoTrue's
 * /auth/v1/signup is reachable without any of this code. The project-level
 * Supabase setting is the door; `npm run verify:signup-open` is what
 * reports its real state against the live project. See docs/DEPLOYMENT.md.
 *
 * The failure this guards against is the dangerous direction of the two:
 * an app that claims a door is shut when it is not.
 */
describe("public sign-up policy", () => {
  it("is closed on this deployment (invite-only beta)", () => {
    expect(PUBLIC_SIGNUP_ENABLED).toBe(false);
  });

  it("keeps the local Supabase stack in step with the app flag", async () => {
    const { readFile } = await import("node:fs/promises");
    const config = await readFile("supabase/config.toml", "utf8");
    /* The first `enable_signup` under [auth] governs email/password
       sign-up; the later ones belong to [auth.email] and [auth.sms]. */
    const authSection = config.slice(config.indexOf("\n[auth]"));
    const match = /^enable_signup\s*=\s*(true|false)/m.exec(authSection);

    expect(match?.[1]).toBe(String(PUBLIC_SIGNUP_ENABLED));
  });
});

describe("the marketing surface's account CTAs", () => {
  it('points "Start free" at the sign-up form only while sign-up is open', async () => {
    const { hero, nav, routes } = await import("@/features/landing/content");
    const expected = PUBLIC_SIGNUP_ENABLED ? "/sign-up" : "/practice";

    expect(routes.startFree).toBe(expected);
    expect(nav.cta.href).toBe(expected);
    expect(hero.primaryCta.href).toBe(expected);
  });

  /*
   * Guest practice is the one thing this product promises without an
   * account. It must never be routed through the account form, however
   * "start free" is defined at the time.
   */
  it("never routes the free/guest-practice claim through sign-up", async () => {
    const { plans, routes } = await import("@/features/landing/content");

    expect(routes.guestPractice).toBe("/practice");
    const free = plans.items.find((item) => item.id === "free");
    expect(free?.cta.href).toBe(routes.guestPractice);
    expect(free?.note).toMatch(/no account required/i);
  });
});

describe("beta hardening: GoTrue password floor vs student PINs", () => {
  it("keeps the local GoTrue minimum at or below the 6-digit student PIN length", async () => {
    const { readFile } = await import("node:fs/promises");
    const config = await readFile("supabase/config.toml", "utf8");
    const match = /^minimum_password_length\s*=\s*(\d+)/m.exec(config);

    /* A student's PIN is their GoTrue password. Raising the project minimum
       above 6 makes provisionChild and PIN resets fail for every child. */
    expect(Number(match?.[1])).toBeLessThanOrEqual(6);
  });
});
