import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

import { expect, test } from "@playwright/test";

/*
 * The Singapore Maths sample route and the one boundary that still gates it.
 *
 * The sample is available by default wherever the app is not a real Vercel
 * production deployment, so this suite's own web server — which sets no
 * Singapore Maths variable at all — is the state a Preview deployment and a
 * local `next start` are in.
 *
 * The Coming Soon branch is still reached on a Vercel production deployment
 * and under the explicit opt-out, and it is the branch that broke: the page
 * passed the resolved catalogue entry (whose `icon` is a React component)
 * from a Server Component into a Client Component, React rejected the
 * function at render time, and the /practice error boundary showed "We
 * couldn't load the practice catalogue." Both year URLs 500'd identically,
 * before any question was loaded. Every branch is asserted here, so neither
 * half can regress unnoticed again.
 */

const SAMPLE_URL = "/practice/singapore-maths/sample";
const BOUNDARY_TEXT = "We couldn't load the practice catalogue.";

test.describe("available by default", () => {
  test("the year-selection screen offers Year 3 and Year 5", async ({ page }, testInfo) => {
    testInfo.setTimeout(120_000);
    const response = await page.goto(SAMPLE_URL, { timeout: 90_000 });

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Try a sample session", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Year 3" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Year 5" })).toBeVisible();
    await expect(page.getByText(BOUNDARY_TEXT)).toHaveCount(0);
  });

  for (const year of [3, 5] as const) {
    test(`Year ${year} serves its 15 sample questions, with no answer key in the page`, async ({ page }, testInfo) => {
      testInfo.setTimeout(120_000);
      const response = await page.goto(`${SAMPLE_URL}?year=${year}`, { timeout: 90_000 });

      expect(response?.status()).toBe(200);
      await expect(page.getByText(BOUNDARY_TEXT)).toHaveCount(0);
      await expect(
        page.getByRole("heading", { name: `Year ${year} · Question 1 of 15` }),
      ).toBeVisible();

      // Every question renders: its prompt, exactly one bar-model diagram and
      // an answer field, with no unsupported-visual fallback.
      for (let i = 1; i <= 15; i += 1) {
        await expect(
          page.getByRole("heading", { name: `Year ${year} · Question ${i} of 15` }),
        ).toBeVisible();
        await expect(page.locator("[data-bar-model-id]")).toHaveCount(1);
        await expect(page.getByLabel(/Your answer/)).toHaveCount(1);
        await expect(page.getByText(/not supported/i)).toHaveCount(0);

        const html = await page.content();
        expect(html, `year ${year} question ${i}`).not.toMatch(
          /privateAnswerKey|workedExplanation|draftProvenance/,
        );

        if (i < 15) await page.getByRole("button", { name: "Next question" }).click();
      }

      // Finishing without answering scores honestly rather than crashing.
      await page.getByRole("button", { name: "Finish session" }).click();
      await expect(page.getByRole("heading", { name: "Session summary" })).toBeVisible();
      await expect(page.getByText(/15 unanswered out of 15 questions/)).toBeVisible();
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
     * "Question 1 of 15" is split in the raw HTML. Strip them to assert on
     * the text a child actually reads.
     */
    const body = (await (await fetch(url)).text()).replaceAll("<!-- -->", "");
    return { status, body };
  } finally {
    server.kill();
  }
}

test.describe("Coming Soon branch", () => {
  test("a real Vercel production deployment refuses the sample, even with the flag set on", async ({}, testInfo) => {
    testInfo.setTimeout(180_000);
    for (const urlPath of [SAMPLE_URL, `${SAMPLE_URL}?year=3`, `${SAMPLE_URL}?year=5`]) {
      const { status, body } = await freshProductionServer(
        44,
        { SINGAPORE_MATHS_SAMPLE_ENABLED: "1", VERCEL_ENV: "production" },
        urlPath,
      );
      expect(status, urlPath).toBe(200);
      expect(body, urlPath).toContain("In development");
      expect(body, urlPath).not.toContain("Question 1 of 15");
      // The branch that crashed: it must render, not reach the error boundary.
      expect(body, urlPath).not.toContain(BOUNDARY_TEXT);
    }
  });

  test("the explicit opt-out outside production shows Coming Soon, not the error boundary", async ({}, testInfo) => {
    testInfo.setTimeout(180_000);
    for (const urlPath of [`${SAMPLE_URL}?year=3`, `${SAMPLE_URL}?year=5`]) {
      const { status, body } = await freshProductionServer(
        45,
        { SINGAPORE_MATHS_SAMPLE_ENABLED: "0", VERCEL_ENV: "preview" },
        urlPath,
      );
      expect(status, urlPath).toBe(200);
      expect(body, urlPath).toContain("In development");
      expect(body, urlPath).not.toContain("Question 1 of 15");
      expect(body, urlPath).not.toContain(BOUNDARY_TEXT);
    }
  });
});
