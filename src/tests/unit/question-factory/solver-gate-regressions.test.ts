import { verifySolverMatch, type DraftQuestion } from "../../../../scripts/validate-scholarship-drafts.mjs";
import { describe, expect, it } from "vitest";
import { evaluateQuestionCorrectness } from "../../../../scripts/check-question-correctness.mjs";
import { checkPublicationEligibility } from "@/features/question-factory/publication/eligibility";
import { verifyCandidateCorrectness } from "@/features/question-factory/correctness/verify-candidate-correctness";
import { deriveIndependentAnswer } from "@/features/question-factory/correctness/derive-answer";
import { checkAgainstProductionSchema } from "@/features/question-factory/validation";
import type { CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import type { CandidateProvenance } from "@/features/question-factory/provenance";
import type { FactoryRepository } from "@/features/question-factory/storage";
import { additionQuestion, buildCorrectnessFixture, VERIFIED_AT } from "./correctness-fixtures";

const series = { solver: "number_series", solverParams: { sequence: [2, 4, 6], rule: { kind: "arithmetic", diff: 2 } } };
const repo = { read: async () => undefined } as unknown as FactoryRepository;
function question(sp: unknown = series, key: unknown = { kind: "number", value: 8, tolerance: 0 }, text?: string) {
  return { ...additionQuestion(), prompt: "Find the next value.", explanation: "Continue the stated pattern.",
    type: text === undefined ? "number_entry" : "multiple_choice",
    options: text === undefined ? [] : [{ id: "a", text }, { id: "b", text: "other" }],
    answerKey: key, solverParams: sp,
  } as unknown as CandidateQuestion;
}
function runtime(q: CandidateQuestion) {
  const result = checkAgainstProductionSchema(q);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return { ...result.question, solverParams: q.solverParams };
}
async function publicationErrors(q: CandidateQuestion) {
  const fixture = buildCorrectnessFixture(q as unknown as Record<string, unknown>);
  const result = await checkPublicationEligibility({ candidateId: q.id, question: q,
    provenance: fixture.provenance as unknown as CandidateProvenance }, repo);
  return result.ok ? [] : result.issues.filter(i => i.code === "publication_solver_verification_failed");
}
function verify(q: CandidateQuestion) {
  const { candidate, structuralEvidence } = buildCorrectnessFixture(q as unknown as Record<string, unknown>);
  return verifyCandidateCorrectness(candidate, { structuralEvidence, verifiedAt: VERIFIED_AT });
}

describe("solver gate security regressions", () => {
  it("rejects malicious candidate constraint source without executing it in publication, derivation or audit", async () => {
    const marker = globalThis as typeof globalThis & { solverConstraintExecuted?: boolean };
    marker.solverConstraintExecuted = false;
    const q = question({ solver: "arithmetical_reasoning", solverParams: {
      variables: [{ name: "X", min: 8, max: 8 }], targetVariable: "X",
      constraints: ["(globalThis.solverConstraintExecuted = true, X === 8)"],
    } });
    try {
      expect(await publicationErrors(q)).not.toHaveLength(0);
      expect(deriveIndependentAnswer(runtime(q)).ok).toBe(false);
      expect(evaluateQuestionCorrectness(runtime(q)).failures).not.toHaveLength(0);
      expect(marker.solverConstraintExecuted).toBe(false);
    } finally { delete marker.solverConstraintExecuted; }
  });

  it("rejects coded strings with coincident digits: AB12 cannot validate keyed ZZ12", async () => {
    const q = question({ solver: "coded_words", solverParams: { type: "reverse", target: "21BA" } },
      { kind: "single_option", optionId: "a" }, "ZZ12");
    expect(await publicationErrors(q)).not.toHaveLength(0);
    expect(deriveIndependentAnswer(runtime(q)).ok).toBe(false);
    expect(evaluateQuestionCorrectness(runtime(q)).failures).not.toHaveLength(0);
  });

  it("rejects mixed quantities: computed 2 cannot validate 2 hours 30 minutes", async () => {
    const q = question({ solver: "number_series", solverParams: {
      sequence: [-4, -2, 0], rule: { kind: "arithmetic", diff: 2 },
    } }, { kind: "single_option", optionId: "a" }, "2 hours 30 minutes");
    expect(await publicationErrors(q)).not.toHaveLength(0);
    expect(deriveIndependentAnswer(runtime(q)).ok).toBe(false);
    expect(evaluateQuestionCorrectness(runtime(q)).failures).not.toHaveLength(0);
  });

  it("preserves solver sidecar through the correctness production-schema bridge", () => {
    const result = verify(question());
    expect(result.status).toBe("passed");
    expect(result.evidence.deterministicCategory).toBe("scholarship_solver");
  });

  it("audit fails a mismatching number-entry key rather than skipping comparison", () => {
    const result = evaluateQuestionCorrectness(runtime(question(series, { kind: "number", value: 9, tolerance: 0 })));
    expect(result.failures).toContain("Number answer key value 9 does not match solver computed value 8");
    expect(result.computed).toBe(false);
  });

  it("unknown solver type is a hard audit failure, never a warning or pass", async () => {
    const q = question({ solver: "unknown_solver", solverParams: {} });
    const result = evaluateQuestionCorrectness(runtime(q));
    expect(result.failures.join(" ")).toContain("Unsupported solver type");
    expect(result.computed).toBe(false);
    expect(result.warnings).toHaveLength(0);
    expect(await publicationErrors(q)).not.toHaveLength(0);
    expect(verify(q).status).toBe("failed");
  });

  it("forged correctValue cannot override an independent result in any path", async () => {
    const q = question({ ...series, correctValue: 9 });
    expect(await publicationErrors(q)).not.toHaveLength(0);
    expect(evaluateQuestionCorrectness(runtime(q)).failures.join(" ")).toContain("correctValue");
    expect(verify(q).status).toBe("failed");
  });

  it("accepts exact coded strings and matching number entries in all paths", async () => {
    for (const q of [question(), question({ solver: "coded_words", solverParams: { type: "reverse", target: "21BA" } },
      { kind: "single_option", optionId: "a" }, "AB12")]) {
      expect(await publicationErrors(q)).toHaveLength(0);
      expect(evaluateQuestionCorrectness(runtime(q)).failures).toHaveLength(0);
      expect(verify(q).status).toBe("passed");
    }
  });
  it("scholarship draft validation rejects executable constraints without running them", () => {
    const marker = globalThis as typeof globalThis & { solverConstraintExecuted?: boolean };
    marker.solverConstraintExecuted = false;
    const q = question(undefined, { kind: "single_option", optionId: "a" }, "8");
    try {
      expect(() => verifySolverMatch(q as unknown as DraftQuestion, {
        id: q.id, skill: "test", targetOption: "a", correctValue: "8", solver: "arithmetical_reasoning",
        solverParams: { variables: [{ name: "X", min: 8, max: 8 }], targetVariable: "X",
          constraints: ["(globalThis.solverConstraintExecuted = true, X === 8)"],
        },
      })).toThrow();
      expect(marker.solverConstraintExecuted).toBe(false);
    } finally { delete marker.solverConstraintExecuted; }
  });

});

