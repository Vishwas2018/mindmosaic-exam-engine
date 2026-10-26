import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import {readFile} from "node:fs/promises";

import { expect, test } from "@playwright/test";
import {barModelPilotFixtures} from "../src/content/visual-fixtures/bar-model";
import {independentlySolvePilot} from "../scripts/lib/bar-model-pilot-independent";

import { expectNoHorizontalOverflow, setViewport, visitAndStabilize } from "./helpers/screen-helpers";

/*
 * The bar-model pilot is internal QA only. This suite
 * runs against a PRODUCTION build, where the page is reachable only because
 * playwright.config.ts sets BAR_MODEL_PREVIEW_ENABLED for its own web server.
 * The last test proves the other half: the same production build, started
 * WITHOUT that variable, answers 404.
 */

const FIXTURE_COUNT = 30;

test.describe("bar model preview (dev only)", () => {
  for (const viewport of [
    { name: "320px", width: 320, height: 700 },
    { name: "1280px", width: 1280, height: 900 },
  ]) {
    test(`renders every fixture without horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/dev/bar-model", { readyLocator: "main" });
      await page.getByText("Developer fixture gallery (contains answer keys)").click();

      await expect(page.locator("[data-fixture]")).toHaveCount(FIXTURE_COUNT);
      await expect(page.locator('[data-panel="learner-view"] svg[role="img"]')).toHaveCount(FIXTURE_COUNT);
      await expect(page.locator('[data-panel="diagnostics"]')).toHaveCount(FIXTURE_COUNT);
      await expectNoHorizontalOverflow(page);

      // No diagram or its panel may poke past the viewport edge.
      const overflowing = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-panel="learner-view"], [data-panel="learner-view"] svg'))
          .filter((node) => node.getBoundingClientRect().right > window.innerWidth + 1)
          .length,
      );
      expect(overflowing).toBe(0);
    });
  }

  test("learner view never contains the diagnostics (answer) panel", async ({ page }) => {
    await setViewport(page, { name: "desktop", width: 1280, height: 900 });
    await visitAndStabilize(page, "/dev/bar-model", { readyLocator: "main" });
    await page.getByText("Developer fixture gallery (contains answer keys)").click();
    const leaked = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-panel="learner-view"]')).filter((panel) =>
        panel.querySelector('[data-panel="diagnostics"], [data-testid="target"]'),
      ).length,
    );
    expect(leaked).toBe(0);
    await expect(page.locator('[data-fixture="pilot-y3-part-whole-01"] [data-testid="target"]')).toHaveText("22");
  });

  test("print media emulation renders every diagram within an A4 page", async ({ page }) => {
    // A4 at 96dpi is about 794 x 1123 CSS px.
    await setViewport(page, { name: "a4-print", width: 794, height: 1123 });
    await page.emulateMedia({ media: "print" });
    await visitAndStabilize(page, "/dev/bar-model", { readyLocator: "main" });
    await page.getByText("Developer fixture gallery (contains answer keys)").click();

    const svgs = page.locator('[data-panel="learner-view"] svg[role="img"]');
    await expect(svgs).toHaveCount(FIXTURE_COUNT);
    await expectNoHorizontalOverflow(page);
    for (let index = 0; index < FIXTURE_COUNT; index += 1) {
      const box = await svgs.nth(index).boundingBox();
      expect(box, `diagram ${index}`).not.toBeNull();
      expect(box!.width).toBeGreaterThan(100);
      expect(box!.x + box!.width).toBeLessThanOrEqual(794);
    }
    // Monochrome-safe: meaning rides on outlines, hatching and text, so the
    // "?" and the not-to-scale note must still be present in print.
    await expect(page.getByText("Diagram not to scale").first()).toBeVisible();
    await expect(svgs.first().locator("text", { hasText: "?" })).toHaveCount(1);
  });

  test("at 200% text size on a 320px screen the learner view still does not overflow", async ({ page }) => {
    // The app has a 320px layout floor, so 200% zoom of a 320px screen is
    // exercised as 200% text size (WCAG 1.4.4): HTML text must reflow, and
    // the SVG scales with its container.
    await setViewport(page, { name: "narrow", width: 320, height: 700 });
    await visitAndStabilize(page, "/dev/bar-model", { readyLocator: "main" });
    await page.getByText("Developer fixture gallery (contains answer keys)").click();
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await expectNoHorizontalOverflow(page);
    const overflowing = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-panel="learner-view"] *')).filter(
        (node) => node.getBoundingClientRect().right > window.innerWidth + 1,
      ).length,
    );
    expect(overflowing).toBe(0);
  });
});

test.describe("pilot practice journeys", () => {
  test("the standalone blind packet includes 30 readable givens-only diagrams", async ({page}, testInfo) => {
    const html = await readFile("docs/reviews/pr80/bar-model-pr80-blind-review-packet.html", "utf8");
    expect(html).not.toMatch(/privateAnswerKey|workedExplanation|Solved target|Independent calculation|Stored key/);
    await page.setViewportSize({width: 1280, height: 900});
    await page.setContent(html);
    await expect(page.locator("section")).toHaveCount(30);
    await expect(page.locator('svg[role="img"]')).toHaveCount(30);
    await expect(page.locator("textarea")).toHaveCount(30);
    await expect(page.locator("svg").first().locator("text", {hasText: "?"})).toHaveCount(1);
    await page.screenshot({path: testInfo.outputPath("blind-packet.png")});
    await expectNoHorizontalOverflow(page);
  });
  for (const width of [320, 1280]) {
    for (const year of [3, 5] as const) {
      test(`Year ${year} entry, submission, reveal, summary and review at ${width}px`, async ({page}, testInfo) => {
        await page.setViewportSize({width, height: 900});
        await page.goto("/dev/bar-model");
        const session = page.getByRole("region", {name: "Pilot practice session"});
        await session.getByRole("button", {name: `Start Year ${year}`}).click();
        await expect(session.getByRole("heading", {name: `Year ${year} · Question 1 of 15`})).toBeFocused();
        await expect(session.getByRole("button", {name: "Show explanation"})).toHaveCount(0);
        await session.getByRole("button", {name: "Submit answer"}).click();
        await expect(session.getByText("Enter a whole number of 0 or more.")).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await page.screenshot({path: testInfo.outputPath(`year-${year}-${width}-entry.png`)});
        const items = barModelPilotFixtures.filter((item) => item.yearLevel === year);
        for (let i = 0; i < items.length; i++) {
          const answer = independentlySolvePilot(items[i].prompt).answer;
          await session.getByRole("textbox").fill(String(i === 0 ? 0 : answer));
          await session.getByRole("button", {name: "Submit answer"}).click();
          await expect(session.getByRole("status")).toContainText(i === 0 ? "Not quite." : "Correct.");
          await expect(session.getByRole("textbox")).toHaveCount(0);
          await expect(session.getByRole("region", {name: "Worked explanation"})).toHaveCount(0);
          await session.getByRole("button", {name: "Show explanation"}).click();
          await expect(session.getByRole("region", {name: "Worked explanation"})).toContainText(items[i].workedExplanation);
          if (i < items.length - 1) await session.getByRole("button", {name: "Next question"}).click();
        }
        await session.getByRole("button", {name: "Finish session"}).click();
        await expect(session.getByRole("status")).toHaveText("14 correct · 1 incorrect · 0 unanswered out of 15 questions.");
        await expectNoHorizontalOverflow(page);
        await page.screenshot({path: testInfo.outputPath(`year-${year}-${width}-summary.png`)});
        await session.getByRole("button", {name: "Review question 1", exact: true}).click();
        await expect(session.getByRole("status")).toContainText("Your answer: 0");
        await expect(session.getByRole("region", {name: "Worked explanation"})).toBeVisible();
        await expect(session.getByRole("button", {name: "Submit answer"})).toHaveCount(0);
        await session.getByRole("button", {name: "Back to summary"}).click();
        await session.getByRole("button", {name: "Choose another year"}).click();
        await session.getByRole("button", {name: `Start Year ${year === 3 ? 5 : 3}`} ).click();
        await session.getByRole("button", {name: "Next question"}).click();
        await session.getByRole("button", {name: "Previous question"}).click();
        await expect(session.getByRole("textbox")).toHaveValue("");
        await session.getByRole("button", {name: "Finish session"}).click();
        await expect(session.getByRole("status")).toContainText("0 correct · 0 incorrect · 15 unanswered");
        await session.getByRole("button", {name: "Review question 1", exact: true}).click();
        await expect(session.getByRole("status")).toHaveText("You did not answer this question.");
        await session.getByRole("button", {name: "Show explanation"}).click();
        await expect(session.getByRole("region", {name: "Worked explanation"})).toBeVisible();
      });
    }
  }
});

test.describe("bar model preview in production without the e2e flag", () => {
  for (const vercelProduction of [false, true]) {
  test(`the production build returns HTTP 404 (Vercel production: ${vercelProduction})`, async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    const basePort = Number(process.env.PW_PORT) || 3100;
    const port = basePort + 37;
    const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
    const env = { ...process.env, NODE_ENV: "production" } as NodeJS.ProcessEnv;
    delete env.BAR_MODEL_PREVIEW_ENABLED;
    delete env.VERCEL_ENV;
    if (vercelProduction) {
      env.VERCEL_ENV = "production";
      env.BAR_MODEL_PREVIEW_ENABLED = "1";
    }
    delete env.SHOWCASE_ENABLED;

    const server: ChildProcess = spawn(
      process.execPath,
      [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
      { env, stdio: "ignore" },
    );
    try {
      const url = `http://127.0.0.1:${port}/dev/bar-model`;
      let status = 0;
      for (let attempt = 0; attempt < 60 && status === 0; attempt += 1) {
        try {
          status = (await fetch(url)).status;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      expect(status).toBe(404);
      const body = await (await fetch(url)).text();
      expect(body).not.toContain("Learner view");
      expect(body).not.toContain("Solved target");
      expect(body).not.toContain("pilot-y3-part-whole-01");
      expect(body).not.toContain("Try a pilot session");
    } finally {
      server.kill();
    }
  });
  }
});
