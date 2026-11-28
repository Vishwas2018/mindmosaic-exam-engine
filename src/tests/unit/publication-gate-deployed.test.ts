/**
 * Deployed builds serve approved content only (DEV family beta, D-019). Uses the repository's real approval
 * records, so the counts below move only when a human approval is recorded or withdrawn.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { publishedExamBank } from "@/content/questions/practice-bank";
import { programmeIdForQuestion, selectServedQuestions } from "@/features/content-governance/gate-config";
import { getPublicationEligibility } from "@/server/publication-evidence";

vi.mock("server-only", () => ({}));

const Y5_Q20 = "man-eb2d2e6d5ddfebf6c5085c6e";

describe("deployedGateFallback", () => {
  it("enforces on Vercel preview and production, reports locally and in CI", async () => {
    const { deployedGateFallback } = await import("@/server/exam-bank");
    expect(deployedGateFallback({ VERCEL_ENV: "preview" } as unknown as NodeJS.ProcessEnv)).toBe("enforce");
    expect(deployedGateFallback({ VERCEL_ENV: "production" } as unknown as NodeJS.ProcessEnv)).toBe("enforce");
    expect(deployedGateFallback({ VERCEL_ENV: "development" } as unknown as NodeJS.ProcessEnv)).toBe("report");
    expect(deployedGateFallback({} as unknown as NodeJS.ProcessEnv)).toBe("report");
  });

  it("lets MM_PUBLICATION_GATE override either way, and ignores other values", async () => {
    const { deployedGateFallback } = await import("@/server/exam-bank");
    expect(deployedGateFallback({ MM_PUBLICATION_GATE: "enforce" } as unknown as NodeJS.ProcessEnv)).toBe("enforce");
    expect(deployedGateFallback({ VERCEL_ENV: "preview", MM_PUBLICATION_GATE: "report" } as unknown as NodeJS.ProcessEnv)).toBe(
      "report",
    );
    expect(deployedGateFallback({ VERCEL_ENV: "preview", MM_PUBLICATION_GATE: "off" } as unknown as NodeJS.ProcessEnv)).toBe(
      "enforce",
    );
  });
});

describe("approved-only selection on the real bank", () => {
  const approved = new Set(getPublicationEligibility().approvals.keys());
  const served = selectServedQuestions(publishedExamBank, approved, {}, "enforce");

  it("serves exactly the items with a verified approval record", () => {
    expect(getPublicationEligibility().problems).toEqual([]);
    expect(served.length).toBe(approved.size);
    expect(served.every((q) => approved.has(q.id))).toBe(true);
    expect(served.length).toBeLessThan(publishedExamBank.length);
  });

  it("does not serve Y5 Q20, which changed after review and has no approval", () => {
    expect(publishedExamBank.some((q) => q.id === Y5_Q20)).toBe(true);
    expect(served.some((q) => q.id === Y5_Q20)).toBe(false);
  });

  it("leaves NAPLAN Year 3 and Year 5 numeracy servable and withdraws reading, language and ICAS", () => {
    const byProgramme = new Map<string, number>();
    for (const q of served) byProgramme.set(programmeIdForQuestion(q), (byProgramme.get(programmeIdForQuestion(q)) ?? 0) + 1);
    expect(byProgramme.get("naplan-y3-numeracy") ?? 0).toBeGreaterThanOrEqual(30);
    expect(byProgramme.get("naplan-y5-numeracy") ?? 0).toBeGreaterThanOrEqual(30);
    for (const [id] of byProgramme) expect(id).toMatch(/^(naplan-y[35]-numeracy|amc-)/);
  });
});

describe("resolveProgramStatuses under enforcement", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load(gate: "enforce" | "report") {
    vi.resetModules();
    vi.stubEnv("MM_PUBLICATION_GATE", gate);
    const { resolveProgramStatuses } = await import("@/features/taxonomy/coverage");
    return resolveProgramStatuses;
  }

  const reading = {
    id: "naplan-g3-reading",
    status: "live" as const,
    scope: { yearLevel: 3 as const, examStyle: "naplan_style" as const, subject: "reading" as const },
  };
  const numeracy = {
    id: "naplan-g3-numeracy",
    status: "live" as const,
    scope: { yearLevel: 3 as const, examStyle: "naplan_style" as const, subject: "numeracy" as const },
  };

  it("withdraws a live programme approved content cannot fill, and keeps one it can", async () => {
    const resolve = await load("enforce");
    const [r, n] = resolve([reading, numeracy]);
    expect(r!.status).toBe("coming_soon");
    expect(n!.status).toBe("live");
  });

  it("never demotes in report mode", async () => {
    const resolve = await load("report");
    const [r] = resolve([reading]);
    expect(r!.status).toBe("live");
  });
});
