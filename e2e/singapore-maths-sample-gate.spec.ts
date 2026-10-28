import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

import { expect, test } from "@playwright/test";

/*
 * The Singapore Maths sample route's gate, both halves.
 *
 * This suite runs against a PRODUCTION build and, unlike
 * playwright.auth.config.ts, its web server does NOT set
 * SINGAPORE_MATHS_SAMPLE_ENABLED — so the default server here IS the
 * flag-OFF state a Vercel Preview deployment has until the owner adds the
 * variable. That state used to crash: the page passed the resolved
 * catalogue entry (whose `icon` is a React component) from a Server
 * Component into a Client Component, React rejected the function at render
 * time, and the /practice error boundary showed "We couldn't load the
 * practice catalogue." Both year URLs failed identically, before any
 * question was ever loaded.
 */

const SAMPLE_URL = "/practice/singapore-maths/sample";
const BOUNDARY_TEXT = "We couldn't load the practice catalogue.";

test.describe("flag OFF (the default Preview state)", () => {
  for (const urlPath of [SAMPLE_URL, `${SAMPLE_URL}?year=3`, `${SAMPLE_URL}?year=5`]) {
    test(`${urlPath} serves Coming Soon, not the practice error boundary`, async ({ page }, testInfo) => {
      /*
       * First navigation against a freshly started production server on this
       * Windows host can sit well past Playwright's 30s default (see the
       * loopback notes in playwright.config.ts).
       */
      testInfo.setTimeout(120_000);
      const response = await page.goto(urlPath, { timeout: 90_000 });

      expect(response?.status(), urlPath).toBe(200);
      await expect(
        page.getByRole("heading", { name: "Singapore Maths (Model Method)", level: 1 }),
      ).toBeVisible();
      await expect(page.getByText("In development")).toBeVisible();
      await expect(page.getByText(BOUNDARY_TEXT)).toHaveCount(0);

      // No sample session, and no sample question text, behind the gate.
      await expect(page.getByRole("heading", { name: /Question 1 of 15/ })).toHaveCount(0);
      await expect(page.getByLabel(/Your answer/)).toHaveCount(0);
    });
  }
});

async function freshProductionServer(
  portOffset: number,
  environment: Record<string, string | undefined>,
  urlPath: string,
): Promise<{ status: number; body: string }> {
  const basePort = Number(process.env.PW_PORT) || 3100;
  const port = basePort + portOffset;
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const env = { ...process.env, NODE_ENV: "production", ...environment } as NodeJS.ProcessEnv;
  for (const key of Object.keys(environment)) if (environment[key] === undefined) delete env[key];
  delete env.SHOWCASE_ENABLED;

  const server: ChildProcess = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { env, stdio: "ignore" },
  );
  try {
    const url = `http://127.0.0.1:${port}${urlPath}`;
    let status = 0;
    for (let attempt = 0; attempt < 60 && status === 0; attempt += 1) {
      try {
        status = (await fetch(url)).status;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    /*
     * React separates adjacent text nodes with `<!-- -->` markers, so
     * "Question 1 of 15" is split in the raw HTML. Strip the markers to
     * assert on the text a child actually reads.
     */
    const body = (await (await fetch(url)).text()).replaceAll("<!-- -->", "");
    return { status, body };
  } finally {
    server.kill();
  }
}

test.describe("the gate itself", () => {
  test("a real Vercel production deployment serves Coming Soon even WITH the flag set", async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    for (const urlPath of [`${SAMPLE_URL}?year=3`, `${SAMPLE_URL}?year=5`]) {
      const { status, body } = await freshProductionServer(
        44,
        { SINGAPORE_MATHS_SAMPLE_ENABLED: "1", VERCEL_ENV: "production" },
        urlPath,
      );
      expect(status, urlPath).toBe(200);
      expect(body, urlPath).toContain("In development");
      expect(body, urlPath).not.toContain("Question 1 of 15");
      expect(body, urlPath).not.toContain(BOUNDARY_TEXT);
    }
  });

  test("control: flag ON outside production serves all 15 questions for both years (so the Coming Soon above is the gate, not a broken route)", async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    for (const year of [3, 5] as const) {
      const { status, body } = await freshProductionServer(
        45,
        { SINGAPORE_MATHS_SAMPLE_ENABLED: "1", VERCEL_ENV: "preview" },
        `${SAMPLE_URL}?year=${year}`,
      );
      expect(status, `year ${year}`).toBe(200);
      expect(body, `year ${year}`).toContain(`Year ${year} · Question 1 of 15`);
      expect(body, `year ${year}`).toContain("15 sample questions");
      expect(body, `year ${year}`).not.toContain(BOUNDARY_TEXT);
      expect(body, `year ${year}`).not.toContain("In development");
    }
  });
});
