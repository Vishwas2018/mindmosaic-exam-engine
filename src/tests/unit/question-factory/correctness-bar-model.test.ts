import { describe, expect, it } from "vitest";

import { invalidBarModelFixtures, validBarModelFixtures, warningBarModelFixtures } from "@/content/visual-fixtures/bar-model";
import { checkAgainstProductionSchema } from "@/features/question-factory/validation";
import type { CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import { deriveIndependentAnswer } from "@/features/question-factory/correctness/derive-answer";
import { fractionToDisplayString } from "@/features/question-factory/correctness/numeric";
import { verifyCandidateCorrectness } from "@/features/question-factory/correctness/verify-candidate-correctness";
import { questionSchema } from "@/schemas/question.schema";
import { additionQuestion, buildCorrectnessFixture, VERIFIED_AT } from "./correctness-fixtures";

function rawQuestion(visual: unknown): Record<string, unknown> {
  return { ...additionQuestion(), prompt: "Use the model to find the unknown quantity.", visuals: [visual], answerKey: { kind: "number", value: 27, tolerance: 0 }, explanation: "Use the given parts and whole to determine the target." };
}
function derive(raw: Record<string, unknown>) {
  return deriveIndependentAnswer(questionSchema.parse({ ...raw, status: "draft", origin: "original_seed", metadata: { ...(raw.metadata as object), topic: "Number" } }));
}

describe("independent bar-model correctness", () => {
  it.each([...validBarModelFixtures, ...warningBarModelFixtures])("derives $name without reading the key or explanation", (fixture) => {
    const raw = { ...rawQuestion(fixture.visual), answerKey: { kind: "number", value: -999, tolerance: 0 } };
    const result = derive(raw);
    expect(result.ok).toBe(true);
    if (result.ok && result.value.kind === "number") {
      expect(result.category).toBe("bar_model");
      const target = fixture.target.denominator === "1" ? fixture.target.numerator : `${fixture.target.numerator}/${fixture.target.denominator}`;
      expect(fractionToDisplayString(result.value.value)).toBe(target);
    } else throw new Error("Expected exact numeric derivation");
  });

  it("maps a fractional target to its unique equivalent numeric option", () => {
    const raw = { ...rawQuestion(warningBarModelFixtures[0].visual), type: "multiple_choice", answerKey: { kind: "single_option", optionId: "wrong" }, options: [{ id: "wrong", text: "5" }, { id: "solved", text: "9/2" }] };
    expect(derive(raw)).toMatchObject({ ok: true, category: "bar_model", value: { kind: "single_option", optionId: "solved" } });
  });

  it.each([[["4.5", "9/2"]], [["4", "5"]]])("rejects ambiguous or missing numeric options %j", (texts) => {
    const raw = { ...rawQuestion(warningBarModelFixtures[0].visual), type: "multiple_choice", answerKey: { kind: "single_option", optionId: "a" }, options: texts.map((text, index) => ({ id: index === 0 ? "a" : "b", text })) };
    expect(derive(raw)).toMatchObject({ ok: false, reason: "cannot_derive" });
  });

  it.each(invalidBarModelFixtures.filter((fixture) => fixture.layer !== "schema"))("rejects $name before prompt arithmetic can bypass it", (fixture) => {
    expect(derive({ ...rawQuestion(fixture.visual), prompt: "What is 23 + 48?" })).toMatchObject({ ok: false, reason: "cannot_derive" });
  });

  it("fails closed with multiple model targets", () => {
    const visual = validBarModelFixtures[0].visual as Record<string, unknown>;
    expect(derive({ ...rawQuestion(visual), visuals: [visual, { ...visual, id: "other-model" }] })).toMatchObject({ ok: false, reason: "ambiguous" });
  });

  it.each(invalidBarModelFixtures)("rejects $name in the factory production-schema bridge", (fixture) => {
    expect(checkAgainstProductionSchema(rawQuestion(fixture.visual) as unknown as CandidateQuestion).ok).toBe(false);
  });

  it("prevents text keys and semantic subjects from bypassing independent derivation", () => {
    const raw = rawQuestion(validBarModelFixtures[0].visual);
    const textKey = { ...raw, type: "short_answer", answerKey: { kind: "text", acceptableAnswers: ["27"] } };
    expect(checkAgainstProductionSchema(textKey as unknown as CandidateQuestion).ok).toBe(false);
    const semanticSubject = { ...raw, metadata: { ...(raw.metadata as object), subject: "reading" } };
    expect(checkAgainstProductionSchema(semanticSubject as unknown as CandidateQuestion).ok).toBe(false);
  });

  it("passes a matching key through the actual correctness gate with solver evidence", () => {
    const fixture = buildCorrectnessFixture(rawQuestion(validBarModelFixtures[0].visual));
    const result = verifyCandidateCorrectness(fixture.candidate, { verifiedAt: VERIFIED_AT, structuralEvidence: fixture.structuralEvidence });
    expect(result.status).toBe("passed");
    expect(result.evidence.derivedAnswer).toMatchObject({ method: "bar_model", representation: "27" });
  });

  it("the actual correctness gate rejects a mismatched key", () => {
    const fixture = buildCorrectnessFixture({ ...rawQuestion(validBarModelFixtures[0].visual), answerKey: { kind: "number", value: 28, tolerance: 0 } });
    const result = verifyCandidateCorrectness(fixture.candidate, { verifiedAt: VERIFIED_AT, structuralEvidence: fixture.structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") expect(result.issues.map((issue) => issue.code)).toContain("declared_answer_mismatch");
  });
});
