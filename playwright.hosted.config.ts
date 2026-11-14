import { defineConfig, devices } from "@playwright/test";

/**
 * Hosted DEV acceptance (scenarios A–E in docs/beta-readiness/BETA-TEST-PLAN.md).
 *
 * Runs real browsers against a deployed DEV Preview, never a local server and never production:
 * - HOSTED_URL must be a `mindmosaic-exam-engine-*-vishwas2018s-projects.vercel.app` Preview.
 * - The Preview's Deployment Protection is passed with the automation-bypass secret, which the
 *   fixture exchanges for a bypass cookie on the Vercel host only (see e2e/hosted/fixtures.ts).
 *   The secret is never sent to Supabase, written to disk, or printed.
 * - Seeding and cleanup use the DEV service role, guarded to `mfglzabnayacssgertat`.
 *
 * Launch with scripts/hosted-acceptance/run.mjs, which reads the secret into memory.
 */
const HOSTED_URL = process.env.HOSTED_URL ?? "";
if (!/^https:\/\/mindmosaic-exam-engine-[a-z0-9-]+-vishwas2018s-projects\.vercel\.app$/.test(HOSTED_URL)) {
  throw new Error("HOSTED_URL must be a DEV Preview of mindmosaic-exam-engine");
}

export default defineConfig({
  testDir: "./e2e/hosted",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["json", { outputFile: process.env.HOSTED_REPORT ?? "test-results/hosted/report.json" }]],
  outputDir: process.env.HOSTED_OUTPUT ?? "test-results/hosted",
  use: {
    baseURL: HOSTED_URL,
    // Off: a trace records request headers, which would include the bypass secret.
    trace: "off",
    screenshot: "only-on-failure",
    navigationTimeout: 45_000,
    actionTimeout: 20_000,
  },
  projects: [
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    {
      name: "tablet-834",
      use: { ...devices["Desktop Chrome"], viewport: { width: 834, height: 1112 }, hasTouch: true, isMobile: false },
      grep: /@responsive/,
    },
    {
      name: "mobile-390",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 },
      grep: /@responsive/,
    },
  ],
});
