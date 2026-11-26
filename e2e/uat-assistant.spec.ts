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
      expect(apiRes.status).toBe(200);
      expect(await apiRes.json()).toEqual({ enabled: false });

      const improveRes = await fetch(`${srv.origin}/api/uat/improve`, {
        method: "POST",
        headers: {
          origin: srv.origin,
          host: new URL(srv.origin).host,
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      });
      expect(improveRes.status).toBe(404);
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
      // Activate local preview UAT session on /dev/uat first (mints `mm_uat_hint=1` cookie for static routes)
      await page.goto(`${srv.origin}/dev/uat`);
      await expect(
        page.getByRole("heading", { level: 1, name: "MindMosaic UAT defect dashboard" }),
      ).toBeVisible();

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

const IDB_DUMP = `
  (async () => {
    const open = () => new Promise((resolve, reject) => {
      const r = indexedDB.open("mindmosaic_uat_assistant_v1");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const db = await open();
    const out = {};
    for (const name of Array.from(db.objectStoreNames)) {
      out[name] = await new Promise((resolve, reject) => {
        const req = db.transaction(name, "readonly").objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    db.close();
    return JSON.stringify(out);
  })()
`;

/** Decodes a PNG/JPEG data URL in the page and returns the RGB at a fractional position plus a blue-leak census. */
async function probeImage(page: import("@playwright/test").Page, dataUrl: string) {
  return page.evaluate(async (url) => {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode failed"));
      img.src = url;
    });
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const px = (fx: number, fy: number) => {
      const d = ctx.getImageData(Math.floor(c.width * fx), Math.floor(c.height * fy), 1, 1).data;
      return [d[0]!, d[1]!, d[2]!];
    };
    // Count pixels in the central 60% that still look like the secret (pure blue square).
    const x0 = Math.floor(c.width * 0.2);
    const y0 = Math.floor(c.height * 0.2);
    const w = Math.floor(c.width * 0.6);
    const h = Math.floor(c.height * 0.6);
    const data = ctx.getImageData(x0, y0, w, h).data;
    let blue = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 2]! > 150 && data[i]! < 90 && data[i + 1]! < 90) blue += 1;
    }
    return { center: px(0.5, 0.5), blue, width: c.width, height: c.height };
  }, dataUrl);
}

test.describe("MindMosaic AI UAT Assistant — redaction is irreversible and session lifecycle", () => {
  test("burns redactions into pixels: no raw frame survives in IndexedDB, drafts or JSON export", async ({ browser }, testInfo) => {
    testInfo.setTimeout(180_000);
    const srv = await startCustomServer(53, { MM_UAT_ASSISTANT_ENABLED: "1", VERCEL_ENV: undefined });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    try {
      await page.goto(`${srv.origin}/dev/uat`);
      await expect(page.getByRole("heading", { level: 1, name: "MindMosaic UAT defect dashboard" })).toBeVisible();
      // The launcher appearing proves the session handshake finished and the tester hint cookie was minted.
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();
      await page.goto(`${srv.origin}/pricing`);
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();

      // A synthetic "secret" screenshot: grey page with a pure-blue block in the middle.
      const png = await page.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = 400;
        c.height = 240;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#c8c8c8";
        ctx.fillRect(0, 0, 400, 240);
        ctx.fillStyle = "#0000ff";
        ctx.fillRect(60, 40, 280, 160);
        return c.toDataURL("image/png").split(",")[1]!;
      });

      await page.getByTestId("uat-launcher-report-btn").click();
      await page.getByTestId("uat-upload-screenshot").setInputFiles({
        name: "secret.png",
        mimeType: "image/png",
        buffer: Buffer.from(png, "base64"),
      });
      const canvas = page.getByTestId("uat-annotation-canvas");
      await expect(canvas).toBeVisible();
      // Regression: a highlight mark immediately followed by a redaction must never let the slower mark render overwrite
      // the redacted image (the two edits are serialised, and the final image must keep the redaction).
      await canvas.scrollIntoViewIfNeeded();
      const box = (await canvas.boundingBox())!;
      await page.getByTestId("uat-tool-rect").click();
      await page.mouse.move(box.x + box.width * 0.02, box.y + box.height * 0.02);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.15, { steps: 2 });
      await page.mouse.up();
      await page.getByTestId("uat-tool-redact").click();
      await page.mouse.move(box.x + box.width * 0.05, box.y + box.height * 0.05);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.95, { steps: 6 });
      await page.mouse.up();
      await expect(page.getByText(/1 redaction\(s\)/)).toBeVisible();

      // Unsaved draft (auto-saved) must already be clean.
      await page.getByLabel(/Your observation notes/i).fill("Redaction pixel check.");
      await page.waitForTimeout(1200);
      const draftDump = JSON.parse(await page.evaluate(IDB_DUMP)) as Record<string, unknown[]>;
      const draftText = JSON.stringify(draftDump);
      expect(draftText).not.toContain("rawDataUrl");
      expect((draftText.match(/data:image\//g) ?? []).length).toBeLessThanOrEqual(1);

      await page.getByTestId("uat-save-issue-btn").click();
      await expect(page.getByTestId("uat-dashboard-dialog")).toBeVisible();

      const dump = JSON.parse(await page.evaluate(IDB_DUMP)) as { issues: { screenshot: { annotatedDataUrl: string } }[] };
      const text = JSON.stringify(dump);
      expect(text).not.toContain("rawDataUrl");
      expect(dump.issues).toHaveLength(1);
      expect((text.match(/data:image\//g) ?? []).length).toBe(1);
      const stored = await probeImage(page, dump.issues[0]!.screenshot.annotatedDataUrl);
      expect(stored.center.every((v) => v < 12)).toBe(true);
      expect(stored.blue).toBe(0);

      // JSON export: same guarantees on the downloaded file.
      await page.goto(`${srv.origin}/dev/uat`);
      const dl = page.waitForEvent("download");
      await page.getByTestId("uat-export-json").click();
      const file = path.join(os.tmpdir(), `uat-redact-${Date.now()}.json`);
      await (await dl).saveAs(file);
      const exported = await fs.readFile(file, "utf8");
      await fs.unlink(file).catch(() => {});
      expect(exported).not.toContain("rawDataUrl");
      const urls = exported.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g) ?? [];
      expect(urls).toHaveLength(1);
      const exportedProbe = await probeImage(page, urls[0]!);
      expect(exportedProbe.center.every((v) => v < 12)).toBe(true);
      expect(exportedProbe.blue).toBe(0);
    } finally {
      await context.close();
      srv.stop();
    }
  });

  test("scrubs the unredacted frame from records saved by older builds", async ({ browser }, testInfo) => {
    testInfo.setTimeout(120_000);
    const srv = await startCustomServer(54, { MM_UAT_ASSISTANT_ENABLED: "1", VERCEL_ENV: undefined });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${srv.origin}/dev/uat`);
      await expect(page.getByRole("heading", { level: 1, name: "MindMosaic UAT defect dashboard" })).toBeVisible();
      await page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const r = indexedDB.open("mindmosaic_uat_assistant_v1");
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
        const tiny = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
        const issue = {
          id: "UAT-LEGACY-1",
          status: "open",
          title: "Legacy record",
          originalNotes: "legacy",
          description: "legacy",
          stepsToReproduce: ["s"],
          actualResult: "a",
          expectedResult: "e",
          severity: "low",
          category: "other",
          inputMethod: "text",
          element: null,
          environment: {
            browser: "Chrome",
            viewport: { width: 800, height: 600, devicePixelRatio: 1 },
            timestamp: "2026-11-26T02:00:00.000Z",
            route: "/",
            pageUrl: "http://localhost/",
            portal: "public",
            testSessionId: "UAT-L",
            testSessionLabel: "L",
            activeRole: "guest",
          },
          aiDraft: null,
          screenshot: {
            rawDataUrl: tiny,
            annotatedDataUrl: tiny.replace("AAAADUlEQVR4", "AAAADUlEQVR5"),
            width: 1,
            height: 1,
            capturedAt: "2026-11-26T02:00:00.000Z",
            source: "upload",
            annotations: [],
          },
          githubIssue: null,
          createdAt: "2026-11-26T02:00:00.000Z",
          updatedAt: "2026-11-26T02:00:00.000Z",
        };
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction("issues", "readwrite");
          tx.objectStore("issues").put(issue);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      });
      await page.reload();
      await expect(page.getByText("Legacy record").first()).toBeVisible();
      const dump = await page.evaluate(IDB_DUMP);
      expect(dump).not.toContain("rawDataUrl");
      expect(dump).toContain("Legacy record");
    } finally {
      await context.close();
      srv.stop();
    }
  });

  test("End UAT session removes the tester credential, keeps local defects, and needs an explicit restart", async ({ browser }, testInfo) => {
    testInfo.setTimeout(150_000);
    const srv = await startCustomServer(55, { MM_UAT_ASSISTANT_ENABLED: "1", VERCEL_ENV: undefined });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${srv.origin}/dev/uat`);
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();
      await page.goto(`${srv.origin}/pricing`);
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();

      // Save one defect so we can prove End does not delete local records.
      await page.getByTestId("uat-launcher-report-btn").click();
      await page.getByLabel(/Your observation notes/i).fill("Defect that must survive ending the session.");
      await page.getByTestId("uat-save-issue-btn").click();
      await expect(page.getByTestId("uat-dashboard-dialog")).toBeVisible();
      await page.getByRole("button", { name: "Close defect dashboard" }).click();

      await assertNoSeriousAccessibilityViolations(page, "UAT launcher with End control");

      // Cancel keeps the session.
      await page.getByTestId("uat-launcher-end-btn").click();
      await expect(page.getByTestId("uat-end-confirm")).toBeVisible();
      await page.getByTestId("uat-end-cancel").click();
      await expect(page.getByTestId("uat-end-confirm")).toBeHidden();
      await expect(page.getByTestId("uat-floating-launcher")).toBeVisible();

      // Confirm ends it.
      await page.getByTestId("uat-launcher-end-btn").click();
      await assertNoSeriousAccessibilityViolations(page, "UAT end-session confirmation");
      await page.getByTestId("uat-end-confirm-btn").click();
      await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);

      const cookies = await context.cookies(srv.origin);
      expect(cookies.find((c) => c.name === "mm_uat_tester")).toBeUndefined();
      expect(cookies.find((c) => c.name === "mm_uat_hint")).toBeUndefined();
      expect(cookies.find((c) => c.name === "mm_uat_ended")?.httpOnly).toBe(true);

      // Server now refuses every UAT capability, even though the requester is on loopback.
      const status = await page.evaluate(async () => (await fetch("/api/uat/session")).json());
      expect(status).toEqual({ enabled: false, ended: true });
      const improve = await page.evaluate(async () => {
        const res = await fetch("/api/uat/improve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ originalNotes: "x" }),
        });
        return res.status;
      });
      expect(improve).toBe(403);

      // The assistant stays off after reload and on other routes.
      await page.reload();
      await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);

      // /dev/uat offers an explicit restart; local defects are still there.
      await page.goto(`${srv.origin}/dev/uat`);
      await expect(page.getByTestId("uat-session-ended-panel")).toBeVisible();
      await assertNoSeriousAccessibilityViolations(page, "UAT session ended panel");
      await page.getByTestId("uat-start-session").click();
      await expect(page.getByRole("heading", { level: 1, name: "MindMosaic UAT defect dashboard" })).toBeVisible();
      await expect(page.getByText(/must survive ending the session/).first()).toBeVisible();
    } finally {
      await context.close();
      srv.stop();
    }
  });
});
