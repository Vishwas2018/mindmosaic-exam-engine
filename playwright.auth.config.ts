import { defineConfig, devices } from "@playwright/test";

import { assertLocalSupabaseEnvironment } from "./e2e/fixtures/environment-guard";
import { e2eEnv } from "./e2e/fixtures/env";

/*
 * Fails fast, before spending a build/start cycle, if `.env.e2e.local`
 * isn't pointed at a local Supabase instance. See
 * docs/testing/playwright-auth-test-data-guide.md for why this suite
 * cannot simply reuse the repo's own `.env.local`.
 */
assertLocalSupabaseEnvironment();

/*
 * Overridable via PW_AUTH_PORT (see playwright.config.ts / PW_PORT) — a
 * concurrently-running sibling night-* worktree (mm-night-responsive) was
 * actually still holding this repo's hardcoded default, causing a real
 * EADDRINUSE collision. Set PW_AUTH_PORT to a worktree-unique value when
 * running alongside other night-* suites.
 */
const port = Number(process.env.PW_AUTH_PORT) || 3101;
export const AUTH_APP_ORIGIN = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e/auth",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // Same rationale as playwright.config.ts: serialised Chromium instances
  // avoid the Windows loopback stalls seen with concurrent workers.
  workers: 1,
  reporter: "list",
  globalSetup: "./e2e/setup/auth.setup.ts",
  use: {
    baseURL: AUTH_APP_ORIGIN,
    trace: "on-first-retry",
    launchOptions: {
      args: ["--no-proxy-server"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port} --keepAliveTimeout 120000`,
    url: AUTH_APP_ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: e2eEnv.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: e2eEnv.supabaseAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: e2eEnv.supabaseServiceRoleKey,
      // Billing enforcement stays off (default) for this mission's scope —
      // see docs/testing/playwright-auth-test-data-guide.md.
      BILLING_ENFORCEMENT_ENABLED: "",
    },
  },
});
