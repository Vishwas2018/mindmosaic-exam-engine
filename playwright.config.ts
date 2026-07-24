import { defineConfig, devices } from "@playwright/test";

/*
 * Overridable via PW_PORT: every sibling night-* worktree shares this same
 * hardcoded default, and this fleet runs several of them concurrently, which
 * collided in practice (EADDRINUSE). Set PW_PORT to a worktree-unique value
 * when running alongside other night-* suites.
 */
const port = Number(process.env.PW_PORT) || 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  /*
   * e2e/auth (and its fixtures/setup) belong to the separate authenticated
   * suite — playwright.auth.config.ts, `npm run test:e2e:auth` — which
   * points at a different local-only Supabase project and a different
   * webServer port. Without this, this config's own default spec glob
   * would pick those specs up too and run them against this config's
   * guest-only, unconfigured-Supabase webServer, where their storageState
   * cookies authenticate against nothing.
   */
  testIgnore: ["auth/**", "fixtures/**", "setup/**"],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  /*
   * Local runs use a single worker: concurrent Chromium instances on this
   * Windows host intermittently stall each other's HTTP responses (document
   * loads and RSC fetches hang with the server healthy), which strands
   * navigations mid-flow. Serialising removes the contention; CI keeps
   * Playwright's default parallelism.
   */
  workers: process.env.CI ? undefined : 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    /*
     * Bypass system proxy resolution entirely. Chromium on Windows consults
     * proxy auto-detection (WPAD) even for loopback URLs; when that stalls,
     * document loads and RSC fetches to 127.0.0.1 hang indefinitely, which
     * intermittently stranded exam navigations mid-flow.
     */
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
    /*
     * E2E runs against a production build. The dev server compiles routes on
     * demand, which stalls parallel first navigations on Windows and made the
     * suite flaky.
     */
    /*
     * keepAliveTimeout is raised above the browser's idle-socket reuse
     * window: Node's 5s default lets the server close a kept-alive socket
     * just as Chromium reuses it, which stalls that request (and any
     * same-URL requests queued behind it) indefinitely on Windows loopback.
     */
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port} --keepAliveTimeout 120000`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
