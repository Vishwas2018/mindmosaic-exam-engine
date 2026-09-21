/**
 * Role-specific Playwright fixtures. `contextAs("teacher-with-students")`
 * hands back a browser context already signed in as that fixture identity —
 * no UI login, no per-test seeding.
 *
 * Signs in fresh (one GoTrue password-grant call, no browser navigation)
 * on every call rather than loading a storageState file written once by
 * globalSetup. That file-once approach shared a single refresh_token per
 * identity across the whole suite; with `enable_refresh_token_rotation`
 * and a 10s reuse window (supabase/config.toml), the first test to
 * legitimately refresh a shared identity's session invalidated every other
 * test's frozen copy of that same token for the rest of the run — CI's
 * e2e-auth job (2026-09-21) showed exactly this: student-no-attempts and
 * student-completed-attempt landing on /sign-in partway through the suite,
 * never reproducing in an isolated run of just the failing file. A single
 * HTTP round-trip per context is cheap enough that per-call sign-in costs
 * nothing meaningful against a local Supabase instance.
 */
import { test as base, type BrowserContext } from "@playwright/test";

import { ALL_IDENTITIES, type Identity } from "./identities";
import { AUTH_APP_ORIGIN } from "../../playwright.auth.config";
import { e2eEnv } from "./env";
import { buildAuthCookies, signInWithPassword } from "./session-cookie";

type ContextKey = Identity["key"] | "unauthenticated";

const IDENTITY_BY_KEY = new Map<Identity["key"], Identity>(
  ALL_IDENTITIES.map((identity) => [identity.key, identity]),
);

function credentialFor(identity: Identity): string {
  return identity.kind === "student" ? e2eEnv.fixturePin : e2eEnv.fixturePassword;
}

interface AuthFixtures {
  contextAs: (key: ContextKey) => Promise<BrowserContext>;
}

export const test = base.extend<AuthFixtures>({
  contextAs: async ({ browser }, use) => {
    const opened: BrowserContext[] = [];
    await use(async (key) => {
      const context = await browser.newContext();
      if (key !== "unauthenticated") {
        const identity = IDENTITY_BY_KEY.get(key);
        if (!identity) throw new Error(`contextAs: unknown identity key "${key}"`);
        const session = await signInWithPassword(identity.email, credentialFor(identity));
        const cookies = buildAuthCookies(AUTH_APP_ORIGIN, e2eEnv.supabaseUrl, session);
        await context.addCookies(cookies);
      }
      opened.push(context);
      return context;
    });
    for (const context of opened) {
      await context.close();
    }
  },
});

export { expect } from "@playwright/test";
