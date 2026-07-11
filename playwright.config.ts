import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
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
