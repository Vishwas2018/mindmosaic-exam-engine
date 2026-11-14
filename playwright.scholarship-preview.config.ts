import { execSync } from "node:child_process";

import { defineConfig, devices } from "@playwright/test";

import { assertLocalSupabaseEnvironment } from "./e2e/fixtures/environment-guard";
import { e2eEnv } from "./e2e/fixtures/env";

/*
 * Authenticated E2E for the preview-only Scholarship sample. Same isolation rules as playwright.auth.config.ts:
 * refuses anything but a loopback Supabase, and runs a production build of the app. The one difference is that the
 * app server is started with the sample preview switched on and bound to exactly one fixture student, so the
 * allowlist can be tested server-side for both an allowed and a non-allowed account.
 */
assertLocalSupabaseEnvironment();

const ids = JSON.parse(
  execSync("npx tsx e2e/setup/print-sample-student-ids.mts", { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }),
) as { allowed: string; notAllowed: string };
process.env.SCHOLARSHIP_E2E_NOT_ALLOWED_ID = ids.notAllowed;

const port = Number(process.env.PW_SCHOLARSHIP_PORT) || 3102;
export const APP_ORIGIN = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e/scholarship-preview",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: APP_ORIGIN,
    trace: "retain-on-failure",
    launchOptions: { args: ["--no-proxy-server"] },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "tablet", use: { ...devices["iPad (gen 7)"], browserName: "chromium" } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `${process.env.PW_SKIP_BUILD ? "" : "npx next build --webpack && "}npm run start -- --hostname 127.0.0.1 --port ${port} --keepAliveTimeout 120000`,
    url: APP_ORIGIN,
    reuseExistingServer: false,
    timeout: 600_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: e2eEnv.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: e2eEnv.supabaseAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: e2eEnv.supabaseServiceRoleKey,
      BILLING_ENFORCEMENT_ENABLED: "",
      SCHOLARSHIP_SAMPLE_PREVIEW: "enabled",
      SCHOLARSHIP_SAMPLE_SUPABASE_REF: "local",
      /* Required, and refused if this stack were ever bound to it. A placeholder: the e2e stack is a local loopback. */
      PRODUCTION_SUPABASE_PROJECT_REF: "e2eproductionplaceholder",
      SCHOLARSHIP_SAMPLE_ALLOWED_USER_IDS: ids.allowed,
    },
  },
});
