import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";

async function startCustomServer(
  portOffset: number,
  envOverrides: Record<string, string | undefined>,
): Promise<{ origin: string; stop: () => void }> {
  const basePort = Number(process.env.PW_PORT) || 3100;
  const port = basePort + portOffset;
  const origin = `http://127.0.0.1:${port}`;
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

  const env = { ...process.env, NODE_ENV: "production", ...envOverrides } as NodeJS.ProcessEnv;
  for (const key of Object.keys(envOverrides)) {
    if (envOverrides[key] === undefined) delete env[key];
  }

  const server: ChildProcess = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port), "--keepAliveTimeout", "120000"],
    { env, stdio: "ignore" },
  );

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const res = await fetch(`${origin}/pricing`);
      if (res.status > 0) {
        return { origin, stop: () => server.kill() };
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  server.kill();
  throw new Error(`Timed out waiting for Next server on ${origin}`);
}

test.describe("MindMosaic AI UAT Assistant — production & feature-flag safety", () => {
  test("stays completely hidden and returns 404 on default unflagged build", async ({ page }) => {
    const res = await page.goto("/dev/uat");
    expect(res?.status()).toBe(404);

    await page.goto("/practice");
    await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);
  });

  test("returns 404 on Vercel production even when MM_UAT_ASSISTANT_ENABLED=1 is set", async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    const srv = await startCustomServer(51, {
      MM_UAT_ASSISTANT_ENABLED: "1",
      VERCEL_ENV: "production",
    });
    try {
      const pageRes = await fetch(`${srv.origin}/dev/uat`);
      expect(pageRes.status).toBe(404);

      const apiRes = await fetch(`${srv.origin}/api/uat/session`);
      expect(apiRes.status).toBe(404);
      expect(await apiRes.json()).toEqual({ enabled: false });
    } finally {
      srv.stop();
    }
  });
});

test.describe("MindMosaic AI UAT Assistant — full DEV workflow, IndexedDB persistence, exports & a11y", () => {
  test("captures elements on an active exam without submitting, dictates & improves with AI, annotates screenshot, persists across reload, and exports", async ({
    browser,
  }, testInfo) => {
    testInfo.setTimeout(180_000);
    const srv = await startCustomServer(52, {
      MM_UAT_ASSISTANT_ENABLED: "1",
      VERCEL_ENV: undefined,
    });

    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    // Inject deterministic Web Speech API mock in browser context
    await page.addInitScript(() => {
      class E2eSpeechRecognition {
        continuous = true;
        interimResults = true;
        lang = "en-AU";
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((e: { error: string }) => void) | null = null;
        onresult: ((e: unknown) => void) | null = null;
        start() {
          this.onstart?.();
          setTimeout(() => {
            this.onresult?.({
              resultIndex: 0,
              results: {
                length: 1,
                0: {
                  isFinal: true,
                  length: 1,
                  0: {
                    transcript: "Submit exam button border looks slightly clipped on narrow screens.",
                  },
                },
              },
            });
          }, 50);
        }
        stop() {
          this.onend?.();
        }
        abort() {
          this.onend?.();
        }
      }
      (window as unknown as { __MM_UAT_SPEECH_RECOGNITION__?: unknown }).__MM_UAT_SPEECH_RECOGNITION__ =
        E2eSpeechRecognition;
    });

    // Mock `/api/uat/improve` so AI improvement is verified deterministically offline
    await page.route("**/api/uat/improve", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          draft: {
            title: "[STUDENT] Submit exam button border clipped on narrow viewports",
            description:
              "While testing the active exam runner, the Submit exam control showed border clipping.",
            stepsToReproduce: [
              "Start a Grade 3 Numeracy practice exam",
              "Inspect [data-testid=\"open-submit-dialog\"]",
            ],
            actualResult: "Submit exam button border looks slightly clipped on narrow screens.",
            expectedResult: "To verify: button border renders cleanly with full 12px radius.",
            severity: "medium",
            category: "ui_visual",
            generatedAt: "2026-11-26T03:00:00.000Z",
            providerId: "openai",
            modelId: "gpt-4o",
            mode: "ai",
          },
        }),
      });
    });

    try {
      // 1. Start a real guest exam session to prove UAT element selection NEVER triggers exam submission!
      await page.goto(`${srv.origin}/practice/mixed-practice?seed=uat-e2e`);
      await page.getByTestId("select-year-level").selectOption("3");
      await page.getByTestId("select-exam-style").selectOption("naplan_style");
      await page.getByTestId("select-subject").selectOption("numeracy");
      await page.getByTestId("select-question-count").selectOption("10");
      await page.getByTestId("select-timing").selectOption("untimed");
      await page.getByTestId("start-exam").click();
      await page.getByTestId("begin-exam").click();
      await expect(page).toHaveURL(/\/exam/);
      await expect(page.getByRole("heading", { name: /^Question 1 of/ })).toBeVisible();
      await page.getByTestId("open-submit-dialog").scrollIntoViewIfNeeded();

      // Floating launcher is visible
      const launcher = page.getByTestId("uat-floating-launcher");
      await expect(launcher).toBeVisible();

      // Open Report Issue modal & run axe-core scan
      await page.getByTestId("uat-launcher-report-btn").click();
      await expect(page.getByTestId("uat-report-dialog")).toBeVisible();
      await assertNoSeriousAccessibilityViolations(page, "UAT report issue modal");

      // 2. Select element on page: click right on `open-submit-dialog`!
      await page.getByTestId("uat-pick-element-btn").click();
      await expect(page.getByTestId("uat-inspector-shield")).toBeVisible();

      const submitBtnBox = await page.getByTestId("open-submit-dialog").boundingBox();
      expect(submitBtnBox).not.toBeNull();
      await page.mouse.move(
        submitBtnBox!.x + submitBtnBox!.width / 2,
        submitBtnBox!.y + submitBtnBox!.height / 2,
      );
      await expect(page.getByTestId("uat-inspector-highlight")).toBeVisible();
      await page.mouse.click(
        submitBtnBox!.x + submitBtnBox!.width / 2,
        submitBtnBox!.y + submitBtnBox!.height / 2,
      );

      // CRITICAL SAFETY ASSERTION: Exam submit dialog did NOT open, URL is still /exam, and locator was captured!
      await expect(page.getByTestId("submit-dialog")).toBeHidden();
      await expect(page.getByTestId("submit-dialog")).not.toHaveAttribute("open", "");
      await expect(page).toHaveURL(/\/exam/);
      await expect(page.getByTestId("uat-picked-locator")).toHaveText(
        '[data-testid="open-submit-dialog"]',
      );

      // 3. Dictate by voice + append manual text
      await page.getByTestId("uat-voice-toggle").click();
      const notesField = page.getByLabel(/Your observation notes/i);
      await expect(notesField).toHaveValue(
        "Submit exam button border looks slightly clipped on narrow screens.",
      );
      await notesField.fill(
        "Submit exam button border looks slightly clipped on narrow screens. Observed on Question 1.",
      );

      // 4. Improve with AI — populates structured fields while preserving original notes verbatim
      await page.getByTestId("uat-improve-ai-btn").click();
      const titleInput = page.getByLabel("Defect title");
      await expect(titleInput).toHaveValue(
        "[STUDENT] Submit exam button border clipped on narrow viewports",
      );
      await expect(notesField).toHaveValue(
        "Submit exam button border looks slightly clipped on narrow screens. Observed on Question 1.",
      );

      // 5. Capture Layout Snapshot & draw an annotation box on the canvas
      await page.getByTestId("uat-capture-snapshot").click();
      const canvas = page.getByTestId("uat-annotation-canvas");
      await expect(canvas).toBeVisible();
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox).not.toBeNull();
      await page.mouse.move(canvasBox!.x + 30, canvasBox!.y + 30);
      await page.mouse.down();
      await page.mouse.move(canvasBox!.x + 120, canvasBox!.y + 90);
      await page.mouse.up();

      // 6. Save defect -> opens quick Defect Dashboard modal
      await page.getByTestId("uat-save-issue-btn").click();
      await expect(page.getByTestId("uat-dashboard-dialog")).toBeVisible();
      await expect(page.getByTestId("uat-detail-original-notes")).toContainText(
        "Observed on Question 1.",
      );

      // 7. Reload browser completely & navigate to /dev/uat — prove IndexedDB persisted everything!
      await page.reload();
      await page.goto(`${srv.origin}/dev/uat`);
      await expect(
        page.getByRole("heading", { level: 1, name: "MindMosaic UAT defect dashboard" }),
      ).toBeVisible();
      await expect(page.getByTestId("uat-detail-original-notes")).toContainText(
        "Observed on Question 1.",
      );
      await assertNoSeriousAccessibilityViolations(page, "UAT full-page defect dashboard");

      // 8. Status workflow: Open -> Fixed -> Retest -> Closed
      await page.getByTestId("uat-detail-status-select").selectOption("fixed");
      await page.getByTestId("uat-filter-status-fixed").click();
      await expect(page.getByTestId("uat-detail-original-notes")).toBeVisible();

      // 9. Export Markdown & Export JSON + Re-import JSON round-trip
      const mdDownloadPromise = page.waitForEvent("download");
      await page.getByTestId("uat-export-markdown").click();
      const mdDownload = await mdDownloadPromise;
      expect(mdDownload.suggestedFilename()).toMatch(/\.md$/);

      const jsonDownloadPromise = page.waitForEvent("download");
      await page.getByTestId("uat-export-json").click();
      const jsonDownload = await jsonDownloadPromise;
      const tmpJsonPath = path.join(os.tmpdir(), `uat-export-${Date.now()}.json`);
      await jsonDownload.saveAs(tmpJsonPath);
      const exportedJson = await fs.readFile(tmpJsonPath, "utf8");
      expect(exportedJson).toContain('"schemaVersion": 1');

      await page.getByTestId("uat-import-json-input").setInputFiles(tmpJsonPath);
      await expect(page.getByTestId("uat-dashboard-banner")).toContainText("Import complete");
      await fs.unlink(tmpJsonPath).catch(() => {});

      // 10. Mobile viewport (375x812) responsive check — zero horizontal overflow
      await page.setViewportSize({ width: 375, height: 812 });
      const overflowPx = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflowPx).toBeLessThanOrEqual(0);
    } finally {
      await context.close();
      srv.stop();
    }
  });
});
