import { beforeEach, describe, expect, it } from "vitest";

import {
  isUatAssistantEnvironmentAllowed,
  uatAssistantAvailability,
} from "@/features/uat-assistant/flags";
import {
  clearUatDraft,
  deleteUatIssue,
  getOrCreateUatTestSession,
  getUatDraft,
  importUatIssues,
  listUatIssues,
  resetUatStoreForTests,
  saveUatDraft,
  saveUatIssue,
} from "@/features/uat-assistant/storage/uat-idb";
import type { UatIssue } from "@/features/uat-assistant/types";
import {
  buildLocalStructuredDraft,
  formatIssueMarkdown,
  formatIssuesReportMarkdown,
  mergeImportedIssues,
  parseImportBundle,
  serializeExportBundle,
} from "@/features/uat-assistant/utils/exporters";
import { captureElementMetadata } from "@/features/uat-assistant/utils/locator";
import {
  detectPortalSurface,
  isSensitiveDomElement,
  redactSensitiveText,
  sanitizeUrlForReport,
} from "@/features/uat-assistant/utils/redaction";

describe("UAT Assistant — environment & feature flag gate", () => {
  it("unconditionally refuses Vercel production even when MM_UAT_ASSISTANT_ENABLED=1", () => {
    expect(
      uatAssistantAvailability({
        VERCEL_ENV: "production",
        MM_UAT_ASSISTANT_ENABLED: "1",
      }),
    ).toEqual({ allowed: false, reason: "vercel_production" });

    expect(
      uatAssistantAvailability({
        VERCEL_ENV: "preview",
        VERCEL_TARGET_ENV: "production",
        MM_UAT_ASSISTANT_ENABLED: "1",
      }),
    ).toEqual({ allowed: false, reason: "vercel_production" });
  });

  it("refuses any deployment bound to PRODUCTION_SUPABASE_PROJECT_REF", () => {
    const prodRef = "prodref12345";
    expect(
      uatAssistantAvailability({
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_SUPABASE_URL: `https://${prodRef}.supabase.co`,
        PRODUCTION_SUPABASE_PROJECT_REF: prodRef,
        MM_UAT_ASSISTANT_ENABLED: "1",
      }),
    ).toEqual({ allowed: false, reason: "production_supabase_target" });
  });

  it("honours MM_UAT_ASSISTANT_ENABLED=0 kill switch across every environment", () => {
    expect(
      isUatAssistantEnvironmentAllowed({
        VERCEL_ENV: "preview",
        MM_UAT_ASSISTANT_ENABLED: "0",
      }),
    ).toBe(false);

    expect(
      isUatAssistantEnvironmentAllowed({
        NODE_ENV: "development",
        MM_UAT_ASSISTANT_ENABLED: "false",
      }),
    ).toBe(false);
  });

  it("enables on Vercel Preview (DEV) and local development when not opted out", () => {
    expect(
      uatAssistantAvailability({
        VERCEL_ENV: "preview",
        NEXT_PUBLIC_SUPABASE_URL: "https://mfglzabnayacssgertat.supabase.co",
        PRODUCTION_SUPABASE_PROJECT_REF: "prodref12345",
      }),
    ).toEqual({ allowed: true, reason: "preview_enabled" });

    expect(
      uatAssistantAvailability({
        NODE_ENV: "development",
      }),
    ).toEqual({ allowed: true, reason: "local_development_enabled" });
  });

  it("keeps off-Vercel production builds disabled unless explicitly opted in", () => {
    expect(
      uatAssistantAvailability({
        NODE_ENV: "production",
      }),
    ).toEqual({ allowed: false, reason: "production_build_opt_in_missing" });

    expect(
      uatAssistantAvailability({
        NODE_ENV: "production",
        MM_UAT_ASSISTANT_ENABLED: "1",
      }),
    ).toEqual({ allowed: true, reason: "explicit_opt_in" });
  });

  it("fails closed on unknown VERCEL_ENV values", () => {
    expect(
      uatAssistantAvailability({
        VERCEL_ENV: "staging-unknown",
        MM_UAT_ASSISTANT_ENABLED: "1",
      }),
    ).toEqual({ allowed: false, reason: "unknown_deployment_context" });
  });
});

describe("UAT Assistant — privacy, redaction & portal classification", () => {
  it("strips auth codes, token hashes, PINs, and hash tokens from URLs", () => {
    const dirty =
      "https://preview.mindmosaic.test/auth/confirm?token_hash=abc123secret&type=signup&code=pkce999#access_token=jwt123&refresh_token=ref456";
    const cleaned = sanitizeUrlForReport(dirty);
    expect(cleaned).not.toContain("abc123secret");
    expect(cleaned).not.toContain("pkce999");
    expect(cleaned).not.toContain("jwt123");
    expect(cleaned).not.toContain("ref456");
    expect(cleaned).toContain("token_hash=[REDACTED]");
    expect(cleaned).toContain("type=signup");
  });

  it("redacts JWTs, API keys, Bearer tokens, and inline passwords/PINs from notes", () => {
    const fakeJwt = ["eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiIxMjM0NTY3ODkwIn0", "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"].join(".");
    const fakeSk = ["sk_test_", "1234567890abcdef"].join("");
    const raw = `Saw error with Bearer ${fakeJwt} and key ${fakeSk} and password=MySecret99! pin: 482910`;
    const redacted = redactSensitiveText(raw);

    expect(redacted).not.toContain(fakeJwt);
    expect(redacted).not.toContain(fakeSk);
    expect(redacted).not.toContain("MySecret99!");
    expect(redacted).not.toContain("482910");
    expect(redacted).toContain("[REDACTED");
  });

  it("classifies Admin, Student, Parent, Teacher, Dev, and Public routes accurately", () => {
    expect(detectPortalSurface("/admin/review")).toBe("admin");
    expect(detectPortalSurface("/student/learn")).toBe("student");
    expect(detectPortalSurface("/exam")).toBe("student");
    expect(detectPortalSurface("/parent/children")).toBe("parent");
    expect(detectPortalSurface("/billing")).toBe("parent");
    expect(detectPortalSurface("/teacher/marking")).toBe("teacher");
    expect(detectPortalSurface("/dev/uat")).toBe("dev");
    expect(detectPortalSurface("/pricing")).toBe("public");
  });

  it("captures stable locators without reading form input values or unpublished review answers", () => {
    document.body.innerHTML = `
      <main>
        <button data-testid="submit-exam-btn" type="button">Submit exam</button>
        <label for="secret-pwd">Password</label>
        <input id="secret-pwd" type="password" value="SuperSecretPassword123" />
        <label for="child-note">Student answer</label>
        <input id="child-note" type="text" value="42 apples" placeholder="Enter answer" />
        <div data-correct="true">Correct answer: B (24 cm)</div>
      </main>
    `;

    const btn = document.querySelector('[data-testid="submit-exam-btn"]')!;
    const btnMeta = captureElementMetadata(btn, "http://localhost:3000/exam?token=xyz");
    expect(btnMeta.locator).toBe('[data-testid="submit-exam-btn"]');
    expect(btnMeta.locatorStrategy).toBe("testid");
    expect(btnMeta.visibleSnippet).toBe("Submit exam");
    expect(btnMeta.pageUrl).toContain("token=[REDACTED]");

    const pwd = document.getElementById("secret-pwd")!;
    expect(isSensitiveDomElement(pwd, "/sign-in")).toBe(true);
    const pwdMeta = captureElementMetadata(pwd, "http://localhost:3000/sign-in");
    expect(pwdMeta.redacted).toBe(true);
    expect(pwdMeta.visibleSnippet).toContain("sensitive content redacted");
    expect(pwdMeta.visibleSnippet).not.toContain("SuperSecretPassword123");

    const textInput = document.getElementById("child-note")!;
    const textMeta = captureElementMetadata(textInput, "http://localhost:3000/exam");
    expect(textMeta.visibleSnippet).not.toContain("42 apples");
    expect(textMeta.visibleSnippet).toContain("Student answer");

    const answerDiv = document.querySelector("[data-correct]")!;
    const answerMeta = captureElementMetadata(answerDiv, "http://localhost:3000/admin/review");
    expect(answerMeta.redacted).toBe(true);
    expect(answerMeta.visibleSnippet).not.toContain("24 cm");
  });
});

describe("UAT Assistant — persistence, export/import & Markdown formatting", () => {
  beforeEach(async () => {
    await resetUatStoreForTests();
  });

  function makeSampleIssue(overrides: Partial<UatIssue> = {}): UatIssue {
    return {
      id: "DEF-20261126-TEST",
      status: "open",
      title: "[STUDENT] Next button wraps awkwardly at 375px",
      originalNotes: "On 375px mobile, the Next button wraps under the timer pill.",
      description: "On 375px mobile, the Next button wraps under the timer pill.",
      stepsToReproduce: ["Open /exam at 375x812", "Inspect navigation footer"],
      actualResult: "Next button wraps below the timer pill.",
      expectedResult: "Controls align cleanly without awkward overlap.",
      severity: "medium",
      category: "responsive",
      inputMethod: "mixed",
      element: {
        locator: '[data-testid="next-question"]',
        locatorStrategy: "testid",
        tagName: "button",
        role: "button",
        accessibleName: "Next question",
        visibleSnippet: "Next question",
        pageUrl: "http://localhost:3000/exam",
      },
      environment: {
        browser: "Chrome 136 · Windows",
        viewport: { width: 375, height: 812, devicePixelRatio: 2 },
        timestamp: "2026-11-26T02:00:00.000Z",
        route: "/exam",
        pageUrl: "http://localhost:3000/exam",
        portal: "student",
        testSessionId: "UAT-20261126-ABCD",
        testSessionLabel: "Mobile Pass",
        activeRole: "student",
      },
      aiDraft: null,
      screenshot: null,
      githubIssue: null,
      createdAt: "2026-11-26T02:00:00.000Z",
      updatedAt: "2026-11-26T02:00:00.000Z",
      ...overrides,
    };
  }

  it("persists issues, status transitions, drafts, and test sessions", async () => {
    const session = await getOrCreateUatTestSession();
    expect(session.id).toMatch(/^UAT-/);

    const issue = makeSampleIssue();
    await saveUatIssue(issue);

    let all = await listUatIssues();
    expect(all).toHaveLength(1);
    expect(all[0]?.status).toBe("open");

    await saveUatIssue({ ...issue, status: "retest", updatedAt: "2026-11-26T03:00:00.000Z" });
    all = await listUatIssues();
    expect(all[0]?.status).toBe("retest");

    await saveUatDraft({
      id: "active-draft",
      title: "Draft title",
      originalNotes: "Typed half an observation",
      description: "",
      stepsText: "",
      actualResult: "",
      expectedResult: "",
      severity: "low",
      category: "ui_visual",
      inputMethod: "text",
      element: null,
      aiDraft: null,
      screenshot: null,
      updatedAt: "2026-11-26T03:01:00.000Z",
    });
    expect((await getUatDraft())?.originalNotes).toBe("Typed half an observation");
    await clearUatDraft();
    expect(await getUatDraft()).toBeNull();

    await deleteUatIssue(issue.id);
    expect(await listUatIssues()).toHaveLength(0);
  });

  it("round-trips JSON export/import with strict schema validation and non-destructive merge", async () => {
    const issue1 = makeSampleIssue({ id: "DEF-1", status: "open", updatedAt: "2026-11-26T02:00:00.000Z" });
    const issue2 = makeSampleIssue({ id: "DEF-2", status: "fixed", updatedAt: "2026-11-26T02:05:00.000Z" });

    const exported = serializeExportBundle([issue1, issue2]);
    const parsed = parseImportBundle(exported);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.bundle.issues).toHaveLength(2);

    // Reject malformed JSON and wrong schema versions safely
    expect(parseImportBundle("{not json").ok).toBe(false);
    expect(parseImportBundle(JSON.stringify({ schemaVersion: 99, issues: [] })).ok).toBe(false);

    // Merge keeps newer status update
    const olderImport = makeSampleIssue({ id: "DEF-2", status: "open", updatedAt: "2026-11-26T01:00:00.000Z" });
    const newerImport = makeSampleIssue({ id: "DEF-1", status: "closed", updatedAt: "2026-11-26T04:00:00.000Z" });
    const mergedResult = mergeImportedIssues([issue1, issue2], [olderImport, newerImport]);
    expect(mergedResult.merged.find((i) => i.id === "DEF-2")?.status).toBe("fixed");
    expect(mergedResult.merged.find((i) => i.id === "DEF-1")?.status).toBe("closed");

    await importUatIssues(parsed.bundle.issues);
    expect(await listUatIssues()).toHaveLength(2);
  });

  it("generates grounded local drafts and complete Markdown reports preserving original notes", () => {
    const sample = makeSampleIssue();
    const localDraft = buildLocalStructuredDraft(
      sample.originalNotes,
      sample.environment,
      sample.element,
    );
    expect(localDraft.mode).toBe("local_structured");
    expect(localDraft.category).toBe("responsive");
    expect(localDraft.actualResult).toBe(sample.originalNotes);

    const singleMd = formatIssueMarkdown(sample);
    expect(singleMd).toContain("DEF-20261126-TEST");
    expect(singleMd).toContain("### Tester's Original Notes (Verbatim)");
    expect(singleMd).toContain(sample.originalNotes);

    const fullMd = formatIssuesReportMarkdown([sample]);
    expect(fullMd).toContain("# MindMosaic UAT Defect Report");
    expect(fullMd).toContain("| `DEF-20261126-TEST` | Open | Medium |");
  });
});
