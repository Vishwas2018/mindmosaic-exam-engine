import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  /*
   * Local dev-server navigations stall under high browser concurrency on
   * Windows, so cap local workers; CI keeps Playwright's default.
   */
  workers: process.env.CI ? undefined : 2,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
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
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
