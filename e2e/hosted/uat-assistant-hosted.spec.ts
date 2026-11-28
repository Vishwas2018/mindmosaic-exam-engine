/**
 * Hosted DEV acceptance for the AI UAT Assistant (PR #166) against a DEV Preview.
 *
 * Safety (agreed constraints: DEV only, no production, no deletes, no publishing):
 * - Creates two fixture accounts on DEV (an admin and a parent). NOTHING is deleted: afterwards the fixture admin is
 *   demoted to a plain parent profile and left in place for the owner's cleanup plan.
 * - No GitHub issue is created: the confirmation step is exercised up to the explicit-confirmation gate and cancelled.
 * - Local defects live only in the throwaway browser context's IndexedDB.
 * - AI rewriting is NOT mocked: the real /api/uat/improve route and the Preview's configured provider are used.
 */
import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "../accessibility";
import { devAdmin, expect, grantFixtureAdmin, parentSignIn, retireFixtureUser, RUN_ID, seededEmail, STRONG_PASSWORD, test } from "./fixtures";

const OUT = path.resolve("test-results", "hosted", RUN_ID);
const evidence: Record<string, unknown> = {};
const created: { id: string; email: string; role: string }[] = [];

async function makeUser(label: string, role: "parent" | "admin", displayName: string) {
  const email = seededEmail(label);
  const { data, error } = await devAdmin().auth.admin.createUser({
    email,
    password: STRONG_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName, role: "parent" },
  });
  if (error || !data.user) throw new Error(`createUser ${label}: ${error?.message}`);
  const { error: upErr } = await devAdmin().from("profiles").update({ role, display_name: displayName }).eq("id", data.user.id);
  if (upErr) throw new Error(`profile ${label}: ${upErr.message}`);
  if (role === "admin") await grantFixtureAdmin(data.user.id, `uat-assistant hosted fixture ${label}`);
  created.push({ id: data.user.id, email, role });
  return { id: data.user.id, email };
}

const IDB_DUMP = `
  (async () => {
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("mindmosaic_uat_assistant_v1");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
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

async function probeImage(page: Page, dataUrl: string) {
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
    const mid = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
    const x0 = Math.floor(c.width * 0.2);
    const y0 = Math.floor(c.height * 0.2);
    const data = ctx.getImageData(x0, y0, Math.floor(c.width * 0.6), Math.floor(c.height * 0.6)).data;
    let blue = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 2]! > 150 && data[i]! < 90 && data[i + 1]! < 90) blue += 1;
    return { center: [mid[0]!, mid[1]!, mid[2]!], blue };
  }, dataUrl);
}

/** Signs in through the real chooser and waits until the session has landed (never races the next goto). */
async function signInAndSettle(page: Page, email: string): Promise<void> {
  await parentSignIn(page, email, STRONG_PASSWORD);
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 45_000 });
}

let admin: { id: string; email: string };
let parent: { id: string; email: string };

test.describe.serial("UAT Assistant — hosted DEV Preview acceptance", () => {
  test.beforeAll(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    admin = await makeUser("uat-admin", "admin", "UAT Fixture Tester");
    parent = await makeUser("uat-parent", "parent", "Pat Parent");
  });

  test.afterAll(async () => {
    // No deletes. Revoke the audited Admin entitlement and demote the profile so the fixture holds no privilege after
    // the run (updates, not a removal).
    await retireFixtureUser(admin.id);
    await devAdmin().from("profiles").update({ role: "parent" }).eq("id", admin.id);
    await devAdmin().from("profiles").update({ access_revoked_at: null }).eq("id", admin.id);
    evidence.fixtures = created.map((c) => ({ id: c.id, email: c.email, createdAs: c.role, nowRole: "parent" }));
    fs.writeFileSync(path.join(OUT, "uat-assistant-evidence.json"), JSON.stringify(evidence, null, 2));
  });

  test("UAT-H1 admin gets the assistant; session metadata leaks no secrets; Admin CSP has no violations", async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        if (e.violatedDirective.startsWith("script-src") && e.blockedURI === "eval" && /\/_next\/static\//.test(e.sourceFile ?? "")) return;
        ((window as unknown as { __v?: string[] }).__v ??= []).push(`${e.violatedDirective} blocked ${e.blockedURI}`);
      });
    });
    await signInAndSettle(page, admin.email);
    await page.goto("/admin");
    await expect(page.getByTestId("uat-floating-launcher")).toBeVisible({ timeout: 30_000 });

    const body = await page.evaluate(async () => (await fetch("/api/uat/session")).json());
    evidence["H1-session"] = {
      enabled: body.enabled,
      authorizedVia: body.authorizedVia,
      primaryRole: body.primaryRole,
      entitledRoles: body.entitledRoles,
      aiConfigured: body.aiConfigured,
      githubConfigured: body.githubConfigured,
    };
    expect(body.enabled).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/sk[-_]|ghp_|Bearer|eyJ[A-Za-z0-9_-]{20,}/);

    const csp = await page.evaluate(async () => {
      const r = await fetch("/admin");
      return r.headers.get("content-security-policy") ?? "";
    });
    evidence["H1-admin-csp-enforced"] = csp.includes("'strict-dynamic'");
    expect(csp).toContain("'strict-dynamic'");
    const violations = await page.evaluate(() => (window as unknown as { __v?: string[] }).__v ?? []);
    // Vercel's own Preview toolbar (vercel.live iframe) is injected by the platform on Preview deployments only; it is
    // not part of the app or the UAT Assistant and does not exist on any other host.
    const own = violations.filter((v) => !v.startsWith("frame-src blocked https://vercel.live"));
    evidence["H1-csp-platform-toolbar-ignored"] = violations.length - own.length;
    expect(own).toEqual([]);
  });

  test("UAT-H2 REAL AI rewriting on the Preview (no mocks)", async ({ page }) => {
    await signInAndSettle(page, admin.email);
    await page.goto("/pricing");
    await expect(page.getByTestId("uat-floating-launcher")).toBeVisible({ timeout: 30_000 });
    const session = await page.evaluate(async () => (await fetch("/api/uat/session")).json());
    evidence["H2-aiConfigured"] = session.aiConfigured;
    if (!session.aiConfigured) {
      // BLOCKED, not passed: no server-side AI provider is configured on this Preview (adding Preview env vars needs the
      // owner's approval). Prove the documented fallback still produces a usable structured draft, and record the gap.
      test.info().annotations.push({ type: "BLOCKED", description: "Real AI rewriting not verifiable: no QF_AI_PROVIDER/key on the Preview" });
      evidence["H2-real-ai"] = "BLOCKED: provider not configured on Preview";
      await page.getByTestId("uat-launcher-report-btn").click();
      await page.getByLabel(/Your observation notes/i).fill("on the pricing page the Start free button sits too close to the plans heading on a phone");
      await page.getByTestId("uat-improve-ai-btn").click();
      await expect(page.getByTestId("uat-ai-feedback")).toBeVisible();
      await expect(page.getByLabel("Defect title")).not.toHaveValue("");
      evidence["H2-fallback"] = "local structurer produced a draft; original notes preserved";
      return;
    }

    await page.getByTestId("uat-launcher-report-btn").click();
    const notes =
      "on the pricing page the Start free button looks too close to the plans heading on my phone, " +
      "also email me at qa.person@example.org if unclear";
    await page.getByLabel(/Your observation notes/i).fill(notes);

    const responsePromise = page.waitForResponse((r) => r.url().includes("/api/uat/improve") && r.request().method() === "POST");
    const t0 = Date.now();
    await page.getByTestId("uat-improve-ai-btn").click();
    const response = await responsePromise;
    const json = await response.json();
    const elapsedMs = Date.now() - t0;
    const sentBody = response.request().postData() ?? "";
    evidence["H2-elapsedMs"] = elapsedMs;
    evidence["H2-request-keys"] = Object.keys(JSON.parse(sentBody || "{}"));
    // Nothing credential-like or question-bank-like may be sent from the browser to the improve route.
    expect(sentBody).not.toMatch(/nvapi-|NVIDIA_API_KEY|api[_-]?key|authorization|bearer|correctAnswer|correct_answer|answerKey/i);
    expect(elapsedMs).toBeLessThan(30_000);
    evidence["H2-improve"] = {
      status: response.status(),
      ok: json.ok,
      code: json.code,
      message: json.message,
      mode: json.draft?.mode,
      providerId: json.draft?.providerId,
      modelId: json.draft?.modelId,
      severity: json.draft?.severity,
      category: json.draft?.category,
      titleLength: String(json.draft?.title ?? "").length,
      stepCount: json.draft?.stepsToReproduce?.length,
    };
    expect(response.status()).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.draft.mode).toBe("ai");
    expect(json.draft.providerId).toBe("nvidia");
    expect(String(json.draft.modelId).length).toBeGreaterThan(0);
    expect(String(json.draft.title).length).toBeGreaterThan(5);
    // The tester's PII-ish text must not be echoed into the structured draft, and the original notes stay verbatim.
    expect(JSON.stringify(json.draft)).not.toContain("qa.person@example.org");
    await expect(page.getByLabel(/Your observation notes/i)).toHaveValue(notes);
    await expect(page.getByLabel("Defect title")).not.toHaveValue("");
  });

  test("UAT-H3 full workflow: element select, voice, screenshot redaction + annotation, persistence, exports, GitHub gate, a11y", async ({
    page,
    context,
  }) => {
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
              results: { length: 1, 0: { isFinal: true, length: 1, 0: { transcript: "The plans heading wraps awkwardly on narrow screens." } } },
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
      (window as unknown as { __MM_UAT_SPEECH_RECOGNITION__?: unknown }).__MM_UAT_SPEECH_RECOGNITION__ = E2eSpeechRecognition;
    });

    await signInAndSettle(page, admin.email);
    await page.goto("/pricing");
    await expect(page.getByTestId("uat-floating-launcher")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("uat-launcher-report-btn").click();
    await assertNoSeriousAccessibilityViolations(page, "UAT report dialog (hosted)");

    // 1. Element selection (no activation of page controls)
    await page.getByTestId("uat-pick-element-btn").click();
    await expect(page.getByTestId("uat-inspector-shield")).toBeVisible();
    const heading = page.getByRole("heading", { level: 1 }).first();
    const box = (await heading.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByTestId("uat-inspector-highlight")).toBeVisible();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByTestId("uat-picked-locator")).toBeVisible();
    evidence["H3-locator"] = await page.getByTestId("uat-picked-locator").innerText();

    // 2. Voice dictation (browser speech engine replaced by a deterministic stub: headless Chrome has no microphone)
    await page.getByTestId("uat-voice-toggle").click();
    await expect(page.getByLabel(/Your observation notes/i)).toHaveValue(/plans heading wraps awkwardly/);

    // 3. Screenshot of a synthetic secret + permanent redaction + a highlight annotation
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
    await page.getByTestId("uat-upload-screenshot").setInputFiles({ name: "secret.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
    const canvas = page.getByTestId("uat-annotation-canvas");
    await expect(canvas).toBeVisible();
    await canvas.scrollIntoViewIfNeeded();
    const cbox = (await canvas.boundingBox())!;
    await page.getByTestId("uat-tool-rect").click();
    await page.mouse.move(cbox.x + cbox.width * 0.02, cbox.y + cbox.height * 0.02);
    await page.mouse.down();
    await page.mouse.move(cbox.x + cbox.width * 0.2, cbox.y + cbox.height * 0.2, { steps: 4 });
    await page.mouse.up();
    await page.getByTestId("uat-tool-redact").click();
    await page.mouse.move(cbox.x + cbox.width * 0.05, cbox.y + cbox.height * 0.05);
    await page.mouse.down();
    await page.mouse.move(cbox.x + cbox.width * 0.95, cbox.y + cbox.height * 0.95, { steps: 6 });
    await page.mouse.up();
    await expect(page.getByText(/1 redaction\(s\)/)).toBeVisible();

    // 4. Save, persist across reload
    await page.getByTestId("uat-save-issue-btn").click();
    await expect(page.getByTestId("uat-dashboard-dialog")).toBeVisible();
    await page.reload();
    await page.goto("/dev/uat");
    await expect(page.getByRole("heading", { level: 1, name: "MindMosaic UAT defect dashboard" })).toBeVisible();
    await expect(page.getByTestId("uat-detail-original-notes")).toContainText("plans heading wraps awkwardly");
    await assertNoSeriousAccessibilityViolations(page, "UAT defect dashboard (hosted)");

    // 5. Stored data and exports: no raw frame, redacted pixels
    const dump = (await page.evaluate(IDB_DUMP)) as string;
    expect(dump).not.toContain("rawDataUrl");
    const stored = JSON.parse(dump) as { issues: { screenshot: { annotatedDataUrl: string } }[] };
    const storedProbe = await probeImage(page, stored.issues[0]!.screenshot.annotatedDataUrl);
    evidence["H3-stored-pixels"] = storedProbe;
    expect(storedProbe.center.every((v) => v < 12)).toBe(true);
    expect(storedProbe.blue).toBe(0);

    const md = page.waitForEvent("download");
    await page.getByTestId("uat-export-markdown").click();
    expect((await md).suggestedFilename()).toMatch(/\.md$/);
    const jsonDl = page.waitForEvent("download");
    await page.getByTestId("uat-export-json").click();
    const file = path.join(OUT, "uat-export.json");
    await (await jsonDl).saveAs(file);
    const exported = fs.readFileSync(file, "utf8");
    fs.unlinkSync(file);
    expect(exported).not.toContain("rawDataUrl");
    const urls = exported.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g) ?? [];
    expect(urls).toHaveLength(1);
    const exportedProbe = await probeImage(page, urls[0]!);
    evidence["H3-exported-pixels"] = exportedProbe;
    expect(exportedProbe.center.every((v) => v < 12)).toBe(true);
    expect(exportedProbe.blue).toBe(0);

    // 6. GitHub: confirmation gate only. No issue is created.
    const session = await page.evaluate(async () => (await fetch("/api/uat/session")).json());
    await page.getByTestId("uat-open-github-confirm").click();
    await expect(page.getByTestId("uat-github-confirm-dialog")).toBeVisible();
    if (session.githubConfigured) {
      await expect(page.getByTestId("uat-github-submit-confirm")).toBeDisabled();
      await page.getByTestId("uat-github-confirm-checkbox").check();
      await expect(page.getByTestId("uat-github-submit-confirm")).toBeEnabled();
      await page.getByTestId("uat-github-confirm-checkbox").uncheck();
    } else {
      await expect(page.getByTestId("uat-github-copy-markdown")).toBeVisible();
    }
    evidence["H3-github"] = { configured: session.githubConfigured, issueCreated: false };
    await page.keyboard.press("Escape");

    // 7. Mobile viewport: no horizontal overflow
    await page.setViewportSize({ width: 375, height: 812 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.setViewportSize({ width: 1440, height: 900 });

    // 8. Cross-portal tester cookie, then revocation of the administrator ends it on the very next load.
    await context.clearCookies({ name: /^sb-/ });
    await signInAndSettle(page, parent.email);
    await page.goto("/parent");
    await expect(page.getByTestId("uat-floating-launcher")).toBeVisible({ timeout: 30_000 });
    evidence["H3-cross-portal-parent"] = "launcher visible via tester cookie";

    const { error: revokeErr } = await devAdmin().from("profiles").update({ access_revoked_at: new Date().toISOString() }).eq("id", admin.id);
    expect(revokeErr).toBeNull();
    await page.goto("/parent");
    await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);
    const afterRevoke = await page.evaluate(async () => (await fetch("/api/uat/session")).json());
    expect(afterRevoke).toEqual({ enabled: false });
    expect((await context.cookies()).map((c) => c.name)).not.toContain("mm_uat_tester");
    evidence["H3-revocation"] = { afterRevoke, testerCookieCleared: true };
    // Restore (an update, not a deletion) so the next assertions can sign in as the admin again.
    await devAdmin().from("profiles").update({ access_revoked_at: null }).eq("id", admin.id);
  });

  test("UAT-H4 End UAT session on the Preview: off until explicitly restarted", async ({ page, context }) => {
    await signInAndSettle(page, admin.email);
    await page.goto("/admin");
    await expect(page.getByTestId("uat-floating-launcher")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("uat-launcher-end-btn").click();
    await assertNoSeriousAccessibilityViolations(page, "UAT end confirmation (hosted)");
    await page.getByTestId("uat-end-confirm-btn").click();
    await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);

    const names = (await context.cookies()).map((c) => c.name);
    expect(names).not.toContain("mm_uat_tester");
    expect(names).toContain("mm_uat_ended");
    await page.goto("/admin");
    await expect(page.getByTestId("uat-floating-launcher")).toHaveCount(0);
    const off = await page.evaluate(async () => (await fetch("/api/uat/session")).json());
    expect(off).toEqual({ enabled: false, ended: true });
    const improve = await page.evaluate(async () => (await fetch("/api/uat/improve", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status);
    expect(improve).toBe(403);

    await page.goto("/dev/uat");
    await expect(page.getByTestId("uat-session-ended-panel")).toBeVisible();
    await page.getByTestId("uat-start-session").click();
    await expect(page.getByRole("heading", { level: 1, name: "MindMosaic UAT defect dashboard" })).toBeVisible();
    evidence["H4-end-session"] = { offAfterEnd: true, apiStatusAfterEnd: improve, restartWorks: true };
  });
});
