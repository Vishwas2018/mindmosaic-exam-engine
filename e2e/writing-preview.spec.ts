import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

import { expect, test } from "@playwright/test";

/*
 * The writing dev preview and its print sheet. This suite runs against a
 * PRODUCTION build, where /dev/writing is reachable only because
 * playwright.config.ts sets WRITING_PREVIEW_ENABLED for its own web server. The
 * last tests prove the other half with the same build: no flag gives 404, and
 * VERCEL_ENV=production gives 404 even WITH the flag.
 */

const PRINT_URL = "/dev/writing/print";

test.describe("print sheet", () => {
  test("renders the MindMosaic header, the task, the time allowed and ruled lines, with no answer", async ({ page }) => {
    await page.emulateMedia({ media: "print" });
    await page.goto(PRINT_URL);

    await expect(page.getByTestId("print-page")).toHaveCount(2);
    await expect(page.getByLabel("MindMosaic").first()).toBeVisible();
    await expect(page.getByTestId("print-time-allowed")).toHaveText("Time allowed: 15 minutes");
    await expect(page.getByTestId("print-prompt")).toContainText("something small changed everything");
    expect(await page.getByTestId("ruled-lines").first().locator("> div").count()).toBeGreaterThanOrEqual(14);
    expect(await page.getByTestId("ruled-lines").nth(1).locator("> div").count()).toBeGreaterThanOrEqual(24);

    // The toolbar (back link, print button) is screen-only.
    await expect(page.getByRole("button", { name: /Print prompt & ruled sheet/ })).toBeHidden();

    // It is the task only: no answer, rubric or marking guidance anywhere on the sheet.
    const text = (await page.locator("main").innerText()).toLowerCase();
    for (const forbidden of ["model answer", "sample answer", "rubric", "anchor", "mark scheme", "score out of"]) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });

  test("prints to exactly two A4 pages", async ({ page }) => {
    await page.goto(PRINT_URL);
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pages).toBe(2);
    // A4 is 595 x 842 points (Chromium writes 595.28 x 841.89).
    const box = pdf.toString("latin1").match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/);
    expect(box, "MediaBox").not.toBeNull();
    expect(Math.round(Number(box![1]))).toBe(595);
    expect(Math.round(Number(box![2]))).toBe(842);
  });

  test("on screen it offers the print button", async ({ page }) => {
    await page.goto(PRINT_URL);
    await expect(page.getByRole("button", { name: "Print prompt & ruled sheet" })).toBeVisible();
  });
});

async function statusFromFreshProductionServer(
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

  const server: ChildProcess = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    env,
    stdio: "ignore",
  });
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
    return { status, body: await (await fetch(url)).text() };
  } finally {
    server.kill();
  }
}

test.describe("production 404", () => {
  test("the same production build returns 404 for the preview and its print sheet without the flag", async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    const env = { WRITING_PREVIEW_ENABLED: undefined, VERCEL_ENV: undefined };
    for (const [offset, urlPath] of [
      [41, "/dev/writing"],
      [41, PRINT_URL],
    ] as const) {
      const { status, body } = await statusFromFreshProductionServer(offset, env, urlPath);
      expect(status, urlPath).toBe(404);
      expect(body).not.toContain("Time allowed");
      expect(body).not.toContain("Fixture task");
    }
  });

  test("returns 404 on a Vercel production deployment even with the e2e flag set", async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    const env = { WRITING_PREVIEW_ENABLED: "1", VERCEL_ENV: "production" };
    for (const urlPath of ["/dev/writing", PRINT_URL]) {
      const { status, body } = await statusFromFreshProductionServer(42, env, urlPath);
      expect(status, urlPath).toBe(404);
      expect(body).not.toContain("Time allowed");
      expect(body).not.toContain("Fixture task");
    }
  });

  test("control: with the flag and a non-production VERCEL_ENV the preview is reachable (so the 404s above are the gate, not a broken server)", async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    const { status, body } = await statusFromFreshProductionServer(
      43,
      { WRITING_PREVIEW_ENABLED: "1", VERCEL_ENV: "preview" },
      "/dev/writing",
    );
    expect(status).toBe(200);
    expect(body).toContain("Fixture task");
  });
});
