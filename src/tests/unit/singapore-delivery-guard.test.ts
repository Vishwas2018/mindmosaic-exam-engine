import { afterEach, expect, it, vi } from "vitest";
import { questionBank } from "@/content/questions/question-bank";

afterEach(() => {
  vi.doUnmock("@/content/questions/practice-bank");
  vi.doUnmock("@/server/publication-evidence");
  vi.resetModules();
});

it("withholds foundation content even if it reaches the published source and has approval evidence", async () => {
  const existing = questionBank[0];
  const foundation = { ...existing, id: "foundation-routing-test-only", examStyle: "singapore_style" as const,
    metadata: { ...existing.metadata, subject: "singapore_mathematics" as const } };
  vi.doMock("@/content/questions/practice-bank", () => ({ publishedExamBank: [existing, foundation] }));
  vi.doMock("@/server/publication-evidence", () => ({
    getPublicationEligibility: () => ({ problems: [], approvals: new Map([[foundation.id, {}]]) }),
  }));
  vi.resetModules();
  const { getExamBank } = await import("@/server/exam-bank");
  for (const id of ["practice", "published", "curated"] as const) {
    expect(getExamBank(id).map((q) => q.id)).toEqual([existing.id]);
  }
});
