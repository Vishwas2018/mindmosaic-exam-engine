import { afterEach, describe, expect, it, vi } from "vitest";

import {
  signTesterBadgeToken,
  verifyTesterBadgeToken,
} from "@/features/uat-assistant/server/uat-access";
import { improveDefectWithAi } from "@/features/uat-assistant/server/ai-improver";
import { createGitHubIssueForDefect } from "@/features/uat-assistant/server/github-issues";

describe("UAT Assistant — HMAC tester badge token", () => {
  const baseEnv = {
    VERCEL_ENV: "preview",
    NEXT_PUBLIC_SUPABASE_URL: "https://mfglzabnayacssgertat.supabase.co",
    MM_UAT_SESSION_SECRET: "unit-test-uat-signing-secret-0123456789",
  };

  it("signs and verifies a valid token bound to the current Supabase host", () => {
    const now = 1_795_000_000_000;
    const token = signTesterBadgeToken("admin-user-uuid", baseEnv, now);
    expect(token).toBeTruthy();

    const verified = verifyTesterBadgeToken(token ?? undefined, baseEnv, now + 60_000);
    expect(verified?.sub).toBe("admin-user-uuid");
    expect(verified?.bind).toBe("mfglzabnayacssgertat.supabase.co");
  });

  it("rejects tampered, expired, or cross-project tokens", () => {
    const now = 1_795_000_000_000;
    const token = signTesterBadgeToken("admin-user-uuid", baseEnv, now)!;

    // Tampered signature
    expect(verifyTesterBadgeToken(`${token}x`, baseEnv, now)).toBeNull();

    // Expired after the 4h TTL
    expect(verifyTesterBadgeToken(token, baseEnv, now + 4 * 3600 * 1000 + 2000)).toBeNull();

    // Different Supabase project binding
    expect(
      verifyTesterBadgeToken(
        token,
        { ...baseEnv, NEXT_PUBLIC_SUPABASE_URL: "https://otherproject1234.supabase.co" },
        now,
      ),
    ).toBeNull();
  });
});

describe("UAT Assistant — server AI improver & secret redaction", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns provider_not_configured cleanly when QF_AI_PROVIDER is unset", async () => {
    const outcome = await improveDefectWithAi(
      {
        originalNotes: "Button label clips on mobile.",
        route: "/student",
        pageUrl: "http://localhost:3000/student",
        portal: "student",
        browser: "Chrome 136 · Windows",
        viewport: { width: 375, height: 812 },
        element: null,
      },
      {},
    );

    expect(outcome).toEqual({
      ok: false,
      code: "provider_not_configured",
      message: expect.stringContaining("No server AI provider is configured"),
    });
  });

  it("redacts secrets before calling the configured AI provider and validates output schema", async () => {
    const fakeLeakKey = ["sk_test_", "9999999999abcdef"].join("");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Parent billing button clips at 375px width",
                  description: "On mobile viewport (375x812), the Manage billing button text overflows.",
                  stepsToReproduce: [
                    "Open /billing at 375x812",
                    "Inspect [data-testid=\"manage-billing\"]",
                  ],
                  actualResult: "Button label clips past right border.",
                  expectedResult: "To verify: button text wraps or fits inside container.",
                  severity: "medium",
                  category: "responsive",
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const outcome = await improveDefectWithAi(
      {
        originalNotes: `Manage billing button clips at 375px. Debug token=${fakeLeakKey}`,
        route: "/billing",
        pageUrl: "https://preview.mindmosaic.test/billing?access_token=secret123",
        portal: "parent",
        browser: "Chrome 136 · Windows",
        viewport: { width: 375, height: 812 },
        element: null,
      },
      {
        QF_AI_PROVIDER: "openai",
        OPENAI_API_KEY: "server-only-openai-key",
      },
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const sentBody = String(fetchSpy.mock.calls[0]?.[1]?.body ?? "");
    expect(sentBody).not.toContain(fakeLeakKey);
    expect(sentBody).not.toContain("secret123");
    expect(sentBody).toContain("[REDACTED");

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.draft.mode).toBe("ai");
      expect(outcome.draft.providerId).toBe("openai");
      expect(outcome.draft.severity).toBe("medium");
      expect(outcome.draft.category).toBe("responsive");
    }
  });

  it("fails safely on malformed AI output without throwing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Not JSON at all" } }],
        }),
        { status: 200 },
      ),
    );

    const outcome = await improveDefectWithAi(
      {
        originalNotes: "Header misaligned.",
        route: "/admin",
        pageUrl: "http://localhost:3000/admin",
        portal: "admin",
        browser: "Chrome",
        viewport: { width: 1280, height: 800 },
        element: null,
      },
      {
        QF_AI_PROVIDER: "openai",
        OPENAI_API_KEY: "server-only-openai-key",
      },
    );

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.code).toBe("malformed_output");
    }
  });
});

describe("UAT Assistant — GitHub issue creation adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refuses cleanly when MM_UAT_GITHUB_TOKEN is not configured", async () => {
    const res = await createGitHubIssueForDefect(
      {
        confirmed: true,
        issueId: "DEF-1",
        title: "Test issue",
        body: "Detailed defect body text",
        severity: "low",
        category: "ui_visual",
      },
      {},
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("github_not_configured");
  });

  it("creates a GitHub issue with redacted body and retries without labels on 422", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("Validation Failed", { status: 422 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            number: 412,
            html_url: "https://github.com/Vishwas2018/mindmosaic-exam-engine/issues/412",
          }),
          { status: 201, headers: { "content-type": "application/json" } },
        ),
      );

    const fakePat = ["ghp_", "1234567890abcdefghijklmnop"].join("");
    const res = await createGitHubIssueForDefect(
      {
        confirmed: true,
        issueId: "DEF-412",
        title: "Focus ring clipped on mobile header",
        body: `Observed on /student. Accidental paste ${fakePat}`,
        severity: "high",
        category: "accessibility",
      },
      {
        MM_UAT_GITHUB_TOKEN: "server-gh-token",
        MM_UAT_GITHUB_REPO: "Vishwas2018/mindmosaic-exam-engine",
      },
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const secondPayload = JSON.parse(String(fetchSpy.mock.calls[1]?.[1]?.body ?? "{}")) as {
      body: string;
      labels?: string[];
    };
    expect(secondPayload.labels).toBeUndefined();
    expect(secondPayload.body).not.toContain(fakePat);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.githubIssue.number).toBe(412);
    }
  });
});
