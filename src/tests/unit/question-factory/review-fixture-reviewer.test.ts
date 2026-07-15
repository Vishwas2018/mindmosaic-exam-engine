import { describe, expect, it } from "vitest";

import { identitiesAreIndependent, normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { reviewRecordSchema } from "@/features/question-factory/provenance";
import { FixtureReviewer, isSupportedFixtureIdentity } from "@/features/question-factory/review";
import type { ReviewContext } from "@/features/question-factory/review";
import type { Question } from "@/schemas/question.schema";

function context(): ReviewContext {
  return {
    question: {} as Question,
    candidateId: "candidate-001",
    candidateRevision: 0,
    candidateContentHash: "content-hash-abc",
    blueprintHash: "blueprint-hash-abc",
    semanticClassification: "semantic_objective",
    reviewedAt: "2026-07-15T00:00:00.000Z",
  };
}

describe("FixtureReviewer", () => {
  it("produces a schema-valid record for a passing configured outcome", async () => {
    const reviewer = new FixtureReviewer({
      result: "passed",
      confidence: 0.9,
      findings: ["Looks correct."],
      evidenceReferences: ["stem checked against declared answer"],
      ambiguityStatus: "none",
    });
    const outcome = await reviewer.review(context());
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(reviewRecordSchema.omit({ previousReviewHash: true, reviewHash: true }).safeParse(outcome.draft).success).toBe(true);
  });

  it("defaults to a 'human' identity, independent of a fixture-generator identity", async () => {
    const reviewer = new FixtureReviewer({ result: "passed", confidence: 0.9, findings: [], evidenceReferences: ["e"], ambiguityStatus: "none" });
    const outcome = await reviewer.review(context());
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(
      identitiesAreIndependent(normaliseIdentityOrThrow("deterministic-fixture-generator"), outcome.draft.reviewerIdentity),
    ).toBe(true);
  });

  it("resolves an override identity through the shared alias table", async () => {
    const reviewer = new FixtureReviewer(
      { result: "warning", confidence: 0.5, findings: [], evidenceReferences: [], ambiguityStatus: "resolved" },
      "chatgpt",
    );
    const outcome = await reviewer.review(context());
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(outcome.draft.reviewerIdentity.provider).toBe("openai");
  });

  it("throws on an unsupported declared identity, never silently falling back", () => {
    expect(() => new FixtureReviewer({ result: "passed", confidence: 1, findings: [], evidenceReferences: [], ambiguityStatus: "none" }, "not-a-real-model")).toThrow();
  });

  it("carries recommendedCorrections through when configured", async () => {
    const reviewer = new FixtureReviewer({
      result: "failed",
      confidence: 0.9,
      findings: ["Wrong."],
      evidenceReferences: ["e"],
      ambiguityStatus: "none",
      recommendedCorrections: ["Fix the stated answer."],
    });
    const outcome = await reviewer.review(context());
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(outcome.draft.recommendedCorrections).toEqual(["Fix the stated answer."]);
  });
});

describe("isSupportedFixtureIdentity", () => {
  it("matches normaliseIdentity's own support", () => {
    expect(isSupportedFixtureIdentity("human")).toBe(true);
    expect(isSupportedFixtureIdentity("definitely-not-a-model")).toBe(false);
  });
});
