import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/*
 * The Singapore Maths sample route and the gate in front of it.
 *
 * Two things are proven here, and they are different things.
 *
 * 1. The route renders in BOTH states. The Coming Soon branch used to crash:
 *    the page passed the resolved catalogue entry (whose `icon` is a React
 *    component) from a Server Component into a Client Component, React
 *    rejected the function at render time, and the /practice error boundary
 *    showed "We couldn't load the practice catalogue." Both year URLs 500'd
 *    identically, before any question was loaded. Every route through the
 *    gate that reaches that branch is exercised below, because any of them
 *    would have crashed.
 *
 * 2. The gate only opens where it should: an isolated local backend, or a
 *    Preview deployment that is explicitly opted in AND bound to its own
 *    non-production Supabase project. Production is refused outright, and
 *    anything unverifiable fails closed.
 *
 * This suite's own web server (playwright.config.ts) sets no Singapore Maths
 * variables and no Supabase project, so it is a refusing configuration — in
 * CI because no Supabase URL is set, locally because `.env.local` points at
 * the hosted project. Either way the first test below is the crash
 * regression, on the suite's default build.
 */

const SAMPLE_URL = "/practice/singapore-maths/sample";
const BOUNDARY_TEXT = "We couldn't load the practice catalogue.";
const COMING_SOON_TEXT = "In development";

const PREVIEW_PROJECT = "qawbnonprodproject";
const PRODUCTION_PROJECT = "liveprodproject";
const ISOLATED_BACKEND = "http://127.0.0.1:54321";

/** A Preview deployment configured exactly as the gate requires. */
const OPTED_IN_PREVIEW = {
  VERCEL_ENV: "preview",
  NEXT_PUBLIC_SUPABASE_URL: `https://${PREVIEW_PROJECT}.supabase.co`,
  SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
  SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PREVIEW_PROJECT,
  PRODUCTION_SUPABASE_PROJECT_REF: PRODUCTION_PROJECT,
} as const;

test.describe("the refusing configuration this suite's own server runs", () => {
  for (const urlPath of [SAMPLE_URL, `${SAMPLE_URL}?year=3`, `${SAMPLE_URL}?year=5`]) {
    test(`${urlPath} renders Coming Soon, not the practice error boundary`, async ({ page }, testInfo) => {
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
      await expect(page.getByText(COMING_SOON_TEXT)).toBeVisible();
      await expect(page.getByText(BOUNDARY_TEXT)).toHaveCount(0);
      await expect(page.getByRole("heading", { name: /Question 1 of 15/ })).toHaveCount(0);
      await expect(page.getByLabel(/Your answer/)).toHaveCount(0);
    });
  }
});

/**
 * Starts the already-built production server with an explicit environment and
 * runs `body` against it. Every variable the gate reads is passed explicitly:
 * `next start` also loads `.env.local`, which on a developer machine points at
 * the hosted project, so a case must never depend on a variable being absent.
 */
async function withServer<T>(
  portOffset: number,
  environment: Record<string, string>,
  body: (origin: string) => Promise<T>,
): Promise<T> {
  const basePort = Number(process.env.PW_PORT) || 3100;
  const port = basePort + portOffset;
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const env = { ...process.env, NODE_ENV: "production", ...environment } as NodeJS.ProcessEnv;
  delete env.SHOWCASE_ENABLED;

  const server: ChildProcess = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { env, stdio: "ignore" },
  );
  const origin = `http://127.0.0.1:${port}`;
  try {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        await fetch(origin);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return await body(origin);
  } finally {
    server.kill();
  }
}

/**
 * React separates adjacent text nodes with `<!-- -->` markers, so
 * "Question 1 of 15" is split in the raw HTML. Strip them to assert on the
 * text a child actually reads.
 */
async function fetchPage(origin: string, urlPath: string): Promise<{ status: number; body: string }> {
  const response = await fetch(`${origin}${urlPath}`);
  return { status: response.status, body: (await response.text()).replaceAll("<!-- -->", "") };
}

async function expectComingSoon(origin: string, label: string): Promise<void> {
  for (const urlPath of [SAMPLE_URL, `${SAMPLE_URL}?year=3`, `${SAMPLE_URL}?year=5`]) {
    const { status, body } = await fetchPage(origin, urlPath);
    expect(status, `${label} ${urlPath}`).toBe(200);
    expect(body, `${label} ${urlPath}`).toContain(COMING_SOON_TEXT);
    expect(body, `${label} ${urlPath}`).not.toContain("Question 1 of 15");
    // The branch that crashed: it must render, not reach the error boundary.
    expect(body, `${label} ${urlPath}`).not.toContain(BOUNDARY_TEXT);
  }
}

/** Walks all 15 questions of one year, checking what a child would see. */
async function walkYear(page: Page, origin: string, year: 3 | 5): Promise<void> {
  await page.goto(`${origin}${SAMPLE_URL}?year=${year}`, { timeout: 90_000 });
  await expect(page.getByText(BOUNDARY_TEXT)).toHaveCount(0);

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
}

test.describe("where the gate opens", () => {
  test("an isolated local backend serves all 15 questions for each year, with no answer key in the page", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(300_000);
    await withServer(46, { NEXT_PUBLIC_SUPABASE_URL: ISOLATED_BACKEND, VERCEL_ENV: "" }, async (origin) => {
      await walkYear(page, origin, 3);
      await walkYear(page, origin, 5);
    });
  });

  test("a Preview opted in and bound to its own non-production project serves both years", async ({}, testInfo) => {
    testInfo.setTimeout(180_000);
    await withServer(47, OPTED_IN_PREVIEW, async (origin) => {
      for (const year of [3, 5] as const) {
        const { status, body } = await fetchPage(origin, `${SAMPLE_URL}?year=${year}`);
        expect(status, `year ${year}`).toBe(200);
        expect(body, `year ${year}`).toContain(`Year ${year} · Question 1 of 15`);
        expect(body, `year ${year}`).toContain("15 sample questions");
        expect(body, `year ${year}`).not.toContain(COMING_SOON_TEXT);
        expect(body, `year ${year}`).not.toContain(BOUNDARY_TEXT);
      }
    });
  });
});

test.describe("where the gate stays shut", () => {
  /*
   * One case per refusal the gate can reach on a deployment. Each asserts the
   * same two things: the sample is not served, and the Coming Soon branch
   * renders rather than crashing.
   */
  const cases = [
    [
      "a real Vercel production deployment, with everything else set to allow it",
      { ...OPTED_IN_PREVIEW, VERCEL_ENV: "production" },
    ],
    [
      "a Preview that was never explicitly opted in",
      { ...OPTED_IN_PREVIEW, SINGAPORE_MATHS_SAMPLE_ENABLED: "" },
    ],
    [
      "a Preview bound to a different project than it uses",
      { ...OPTED_IN_PREVIEW, SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: "someotherproject" },
    ],
    [
      "a Preview pointed at the production Supabase project",
      {
        ...OPTED_IN_PREVIEW,
        NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_PROJECT}.supabase.co`,
        SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PRODUCTION_PROJECT,
      },
    ],
    [
      "an unrecognised deployment context",
      { ...OPTED_IN_PREVIEW, VERCEL_ENV: "staging" },
    ],
    [
      "a local app pointed at a remote project instead of an isolated one",
      { NEXT_PUBLIC_SUPABASE_URL: `https://${PREVIEW_PROJECT}.supabase.co`, VERCEL_ENV: "" },
    ],
    [
      "an unidentifiable Supabase target",
      { NEXT_PUBLIC_SUPABASE_URL: "not a url", VERCEL_ENV: "" },
    ],
    [
      "the explicit opt-out over an otherwise valid Preview",
      { ...OPTED_IN_PREVIEW, SINGAPORE_MATHS_SAMPLE_ENABLED: "0" },
    ],
  ] as const;

  cases.forEach(([label, environment], index) => {
    test(`refuses ${label}`, async ({}, testInfo) => {
      testInfo.setTimeout(180_000);
      await withServer(48 + index, environment, (origin) => expectComingSoon(origin, label));
    });
  });
});
