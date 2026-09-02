import { describe, expect, it } from "vitest";
import { validMultipleChoiceQuestion } from "@/tests/fixtures/questions";
import {
  actorMayTransition, batchApprovalAllowed, canonicalContentHash,
  canonicalQuestionRevisionSchema, classifyPublicationRisk, importCanonicalQuestions,
  independentReviewSchema, ownerQaSampleSize, questionFingerprints, toLearnerQuestionDto,
  validateAssetResolution,
} from "@/features/content-platform";

function revision() {
  const question = { ...validMultipleChoiceQuestion };
  return {
    schemaVersion: 2 as const,
    logicalQuestionId: "11111111-1111-4111-8111-111111111111",
    revision: 1,
    origin: "manual_owner" as const,
    question,
    learnerExplanation: question.explanation,
    privateEvidence: { validatorHints: {} },
    assets: [],
    frameworkReferences: [{ frameworkId: "australian-curriculum", version: "9.0", sourceType: "official_curriculum" as const, sourceUrl: "https://v9.australiancurriculum.edu.au/", retrievedAt: "2026-08-25T00:00:00.000Z" }],
  };
}

describe("Content Platform v2 contracts", () => {
  it("accepts a canonical manual revision and rejects unknown fields", () => {
    expect(canonicalQuestionRevisionSchema.safeParse(revision()).success).toBe(true);
    expect(canonicalQuestionRevisionSchema.safeParse({ ...revision(), invented: true }).success).toBe(false);
  });

  it("keeps learner explanation aligned but private evidence separate", () => {
    expect(canonicalQuestionRevisionSchema.safeParse({ ...revision(), learnerExplanation: "A different claim." }).success).toBe(false);
  });

  it("rejects same-family AI self-review", () => {
    expect(independentReviewSchema.safeParse({ reviewerKind: "ai_codex", reviewerId: "codex-1", generatorKind: "ai_codex", independentlySolvedAnswer: "a", suppliedAnswerAgreement: true, decision: "pass", issueCodes: [], rationale: "Blind solution agrees with the supplied answer." }).success).toBe(false);
  });

  it("produces stable hashes independent of object key order", () => {
    expect(canonicalContentHash({ b: 2, a: 1 })).toBe(canonicalContentHash({ a: 1, b: 2 }));
  });

  it("generates the full internal fingerprint set", () => {
    const fingerprints = questionFingerprints(canonicalQuestionRevisionSchema.parse(revision()));
    expect(fingerprints.complete).toMatch(/^[a-f0-9]{64}$/);
    expect(fingerprints.normalised_stem).toMatch(/^[a-f0-9]{64}$/);
    expect(fingerprints.answer_structure).toMatch(/^[a-f0-9]{64}$/);
  });

  it("never exposes the answer key or private evidence in the learner DTO", () => {
    const dto = toLearnerQuestionDto(canonicalQuestionRevisionSchema.parse(revision()));
    expect(dto.question).not.toHaveProperty("answerKey");
    expect(dto).not.toHaveProperty("privateEvidence");
    expect(dto.learnerExplanation).toBeTruthy();
  });

  it("allows only owner approval and publication-service publication", () => {
    expect(actorMayTransition("agent", "approved")).toBe(false);
    expect(actorMayTransition("owner", "approved")).toBe(true);
    expect(actorMayTransition("owner", "published")).toBe(false);
    expect(actorMayTransition("publication_service", "published")).toBe(true);
  });
});

describe("risk and import", () => {
  const review = { reviewerKind: "ai_claude" as const, reviewerId: "claude-1", generatorKind: "manual_owner" as const, independentlySolvedAnswer: "a", suppliedAnswerAgreement: true, decision: "pass" as const, issueCodes: [], rationale: "Independently solved and checked." };

  it("uses max(5, 10%) owner QA and blocks sample failures", () => {
    expect(ownerQaSampleSize(30)).toBe(5);
    expect(ownerQaSampleSize(60)).toBe(6);
    expect(batchApprovalAllowed({ hardGateFailures: 0, unresolvedRisks: 0, reviewPasses: 60, itemCount: 60, sampled: 6, sampleFailures: 0 })).toBe(true);
    expect(batchApprovalAllowed({ hardGateFailures: 0, unresolvedRisks: 0, reviewPasses: 60, itemCount: 60, sampled: 6, sampleFailures: 1 })).toBe(false);
  });

  it("escalates reading stimuli and review disagreements", () => {
    const value = canonicalQuestionRevisionSchema.parse(revision());
    expect(classifyPublicationRisk(value, { hardGateFailures: [], riskSignals: [] }, { ...review, suppliedAnswerAgreement: false }).requiresIndividualOwnerReview).toBe(true);
  });

  it("round-trips JSON and NDJSON and rejects lossy CSV mappings", () => {
    const raw = JSON.stringify(revision());
    expect(importCanonicalQuestions(raw, "json").accepted).toHaveLength(1);
    expect(importCanonicalQuestions(`${raw}\n${raw}`, "ndjson").accepted).toHaveLength(2);
    expect(importCanonicalQuestions("prompt,answer\nHello,A", "csv").issues[0]?.code).toBe("unsupported_csv_mapping");
  });

  it("fails closed on missing asset versions and hash mismatches", () => {
    const value = canonicalQuestionRevisionSchema.parse({ ...revision(), assets: [{ assetId: "22222222-2222-4222-8222-222222222222", revision: 2, contentHash: "a".repeat(64), role: "question_image", altText: "A sufficiently descriptive image label." }] });
    expect(validateAssetResolution(value, [])[0]?.code).toBe("missing_asset");
    expect(validateAssetResolution(value, [{ assetId: value.assets[0].assetId, revision: 2, storageReference: "batch/a.webp", mimeType: "image/webp", fileSize: 100, contentHash: "b".repeat(64), width: 100, height: 100, altText: "A sufficiently descriptive image label." }])[0]?.code).toBe("asset_hash_mismatch");
  });
});
