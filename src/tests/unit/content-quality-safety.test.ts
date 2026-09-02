import { describe, expect, it } from "vitest";
import { validMultipleChoiceQuestion } from "@/tests/fixtures/questions";
import {
  blindSolveResultSchema, buildBlindSolvePrompt, buildComparisonPrompt, canonicalContentHash,
  canonicalQuestionRevisionSchema, comparisonReviewResultSchema, deterministicQualityIssues,
  qualityEvidenceAllowsAutomaticApproval, validateAssetResolution,
} from "@/features/content-platform";

function revision(overrides: Record<string, unknown> = {}) {
  const question = { ...validMultipleChoiceQuestion, ...overrides };
  return canonicalQuestionRevisionSchema.parse({
    schemaVersion: 2, logicalQuestionId: "11111111-1111-4111-8111-111111111111", revision: 1,
    origin: "ai_codex", question, learnerExplanation: question.explanation,
    privateEvidence: { validatorHints: {} }, assets: [],
    frameworkReferences: [{ frameworkId: "australian-curriculum", version: "9.0", sourceType: "official_curriculum", sourceUrl: "https://v9.australiancurriculum.edu.au/", retrievedAt: "2026-08-25T00:00:00.000Z" }],
  });
}

function blind(value = revision(), overrides: Record<string, unknown> = {}) {
  return blindSolveResultSchema.parse({
    candidateContentHash: canonicalContentHash(value), reviewerKind: "ai_claude", reviewerId: "claude-test",
    expectedAnswer: value.question.answerKey, uniquelyDefensible: true, sufficientInformation: true,
    ambiguityStatus: "clear", ambiguityEvidence: ["Only one option satisfies the prompt."],
    visualStatus: "supported", visualEvidence: ["No visual is required."], assessmentFit: "appropriate",
    assessmentFitEvidence: ["Vocabulary and reasoning suit the stated year."], australianEnglishIssues: [], ...overrides,
  });
}

function comparison(value = revision(), blindResult = blind(value), overrides: Record<string, unknown> = {}) {
  return comparisonReviewResultSchema.parse({
    candidateContentHash: canonicalContentHash(value), blindSolveHash: canonicalContentHash(blindResult),
    declaredAnswerAgreement: true, answerComparisonEvidence: ["Blind answer matches the declared key."],
    explanationQuality: "good", explanationEvidence: ["The explanation gives a correct useful method."],
    outcome: "pass", issueCodes: [], ...overrides,
  });
}

describe("two-pass independent quality review", () => {
  it("withholds answer key, explanation and private evidence during blind solve", () => {
    const prompt = buildBlindSolvePrompt(revision());
    expect(prompt.learnerView.question).not.toHaveProperty("answerKey");
    expect(prompt.learnerView).not.toHaveProperty("learnerExplanation");
    expect(prompt.learnerView).not.toHaveProperty("privateEvidence");
  });

  it("blocks a wrong declared answer", () => {
    expect(() => comparisonReviewResultSchema.parse({ ...comparison(), declaredAnswerAgreement: false, outcome: "pass" })).toThrow();
  });

  it("blocks two defensible answers and free-text alternative answers", () => {
    const value = revision();
    const ambiguous = blind(value, { uniquelyDefensible: false, ambiguityStatus: "alternative_valid_answer", ambiguityEvidence: ["Options A and C are both defensible."], proposedRemediation: "Rewrite the stem to distinguish the intended concept." });
    expect(qualityEvidenceAllowsAutomaticApproval(ambiguous, comparison(value, ambiguous, { outcome: "revision_required" }))).toBe(false);
    const omittedFreeText = blind(value, { uniquelyDefensible: false, ambiguityStatus: "alternative_valid_answer", ambiguityEvidence: ["A capable child could also write an omitted synonym."], proposedRemediation: "Add the synonym only if it preserves the assessed skill; otherwise narrow the prompt." });
    expect(omittedFreeText.ambiguityStatus).toBe("alternative_valid_answer");
  });

  it("blocks a correct answer with a wrong or weak explanation", () => {
    expect(() => comparisonReviewResultSchema.parse({ ...comparison(), explanationQuality: "incorrect", outcome: "pass" })).toThrow();
    expect(qualityEvidenceAllowsAutomaticApproval(blind(), comparison(revision(), blind(), { explanationQuality: "correct_but_weak", outcome: "revision_required" }))).toBe(false);
  });

  it("rejects stale blind evidence after content changes", () => {
    const original = revision(); const evidence = blind(original);
    const changed = revision({ prompt: `${original.question.prompt} Choose the best answer.` });
    expect(() => buildComparisonPrompt(changed, evidence)).toThrow(/stale/i);
  });
});

describe("visual and language safety", () => {
  it("hard-fails a prompt referring to a missing graph", () => {
    const value = revision({ prompt: "Look at the graph. Which value is greatest?", visuals: [] });
    expect(deterministicQualityIssues(value)).toContainEqual(expect.objectContaining({ code: "missing_required_visual", severity: "hard" }));
  });

  it("blocks a contradictory visual semantic result", () => {
    const value = revision();
    const conflict = blind(value, { visualStatus: "visual_answer_conflict", visualEvidence: ["The visible graph supports option B, not the declared option." ] });
    expect(qualityEvidenceAllowsAutomaticApproval(conflict, comparison(value, conflict, { outcome: "revision_required" }))).toBe(false);
  });

  it("hard-fails alt text that reveals the answer", () => {
    const base = revision(); const answer = base.question.options.find((option) => option.id === (base.question.answerKey.kind === "single_option" ? base.question.answerKey.optionId : ""))?.text ?? "answer";
    const value = canonicalQuestionRevisionSchema.parse({ ...base, assets: [{ assetId: "22222222-2222-4222-8222-222222222222", revision: 1, contentHash: "a".repeat(64), role: "question_image", altText: `The correct answer is ${answer}.` }] });
    expect(deterministicQualityIssues(value)).toContainEqual(expect.objectContaining({ code: "alt_text_answer_leakage", severity: "hard" }));
  });

  it("hard-fails a nonexistent exact asset revision", () => {
    const base = revision();
    const value = canonicalQuestionRevisionSchema.parse({ ...base, assets: [{ assetId: "22222222-2222-4222-8222-222222222222", revision: 4, contentHash: "a".repeat(64), role: "question_image", altText: "A graph containing the values needed by the question." }] });
    expect(validateAssetResolution(value, [{ assetId: value.assets[0].assetId, revision: 3, storageReference: "old.webp", mimeType: "image/webp", fileSize: 100, contentHash: "a".repeat(64), altText: "A graph containing the values needed by the question." }])[0]?.code).toBe("missing_revision");
  });

  it("flags US-specific wording", () => {
    const value = revision({ prompt: "Which color is shown?" });
    expect(deterministicQualityIssues(value)).toContainEqual(expect.objectContaining({ code: "australian_english_issue" }));
  });
});
