import { defineConfig, devices } from "@playwright/test";

/*
 * UI-only authentication test configuration.
 *
 * This suite runs against the Next.js dev server without requiring a local
 * Supabase instance. It covers page rendering, navigation, form validation,
 * accessibility and error states for the new Claude Design auth screens:
 *   - /auth/forgot
 *   - /auth/session-expired
 *   - /auth/signed-out
 *   - /student-help
 *   - /sign-in
 *   - /student-sign-in
 *
 * No globalSetup, no seed, no Supabase connection. Tests that need a real
 * session (parent sign-in/sign-out, forgot password delivery) are excluded
 * or explicitly opt-in via E2E_MAILPIT_URL.
 *
 * Never connects to production Supabase (uermhsptduikehuyceiz).
 * Never performs destructive seeding, database resets or migrations.
 */

const port = Number(process.env.PW_AUTH_UI_PORT) || 3201;
export const AUTH_UI_APP_ORIGIN = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e/auth",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  // No globalSetup — UI-only tests do not require Supabase.
  use: {
    baseURL: AUTH_UI_APP_ORIGIN,
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
    command: `npx next dev --hostname 127.0.0.1 --port ${port}`,
    url: AUTH_UI_APP_ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      // No Supabase env vars needed for UI-only tests.
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
});
