import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkPublicationEligibility } from "@/features/question-factory/publication/eligibility";
import {
  SCHOLARSHIP_FIRST_PARTY_SOLVERS,
  isScholarshipAttestedItem,
  optionMatchesQuantity,
  promptQuantities,
  verifyFirstPartyScholarshipAttestation,
  type ScholarshipSolverEntry,
} from "@/features/question-factory/correctness/scholarship-attestation";
import { SCHOLARSHIP_MATHS_FIRST_PARTY_SOLVERS } from "@/features/question-factory/correctness/scholarship-maths-solvers";
import type { CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import type { CandidateProvenance } from "@/features/question-factory/provenance";
import { hashJson } from "@/features/question-factory/provenance";
import type { FactoryRepository } from "@/features/question-factory/storage";
import { additionQuestion, buildCorrectnessFixture } from "./correctness-fixtures";

const repo = { read: async () => undefined } as unknown as FactoryRepository;

const packet = JSON.parse(readFileSync("content/scholarship-drafts/scholarship-y6-mathematics-draft.json", "utf8")) as {
  questions: Array<Record<string, unknown> & { id: string }>;
};

const MATHS_IDS = Array.from({ length: 40 }, (_, index) => `scholarship-y6-maths-${String(index + 1).padStart(3, "0")}`);
const registry = SCHOLARSHIP_MATHS_FIRST_PARTY_SOLVERS as Record<string, ScholarshipSolverEntry>;

function draftItem(id: string): CandidateQuestion {
  const raw = packet.questions.find((candidate) => candidate.id === id);
  if (!raw) throw new Error(`draft ${id} missing`);
  return { ...additionQuestion(), ...raw } as unknown as CandidateQuestion;
}

const keyOf = (q: CandidateQuestion): string => (q.answerKey as { optionId: string }).optionId;

async function attestationIssues(q: CandidateQuestion, contentHash?: string) {
  const fixture = buildCorrectnessFixture(q as unknown as Record<string, unknown>);
  const base = fixture.provenance as unknown as CandidateProvenance;
  const provenance = contentHash === undefined ? base : { ...base, contentHash };
  const result = await checkPublicationEligibility({ candidateId: q.id, question: q, provenance }, repo);
  return result.ok ? [] : result.issues.filter((issue) => issue.code === "publication_solver_verification_failed");
}

describe("scholarship first-party attestation: maths-001..maths-040", () => {
  it("registers a solver for exactly the forty mathematics items and keeps the NR registry separate", () => {
    expect(Object.keys(registry).sort()).toEqual(MATHS_IDS);
    expect(Object.keys(SCHOLARSHIP_FIRST_PARTY_SOLVERS).some((id) => id.includes("-maths-"))).toBe(false);
    expect(packet.questions.map((q) => q.id).sort()).toEqual(MATHS_IDS);
    expect(packet.questions.every((q) => isScholarshipAttestedItem(q as unknown as CandidateQuestion))).toBe(true);
  });

  it("does not claim NAPLAN-style numeracy items", () => {
    const naplan = { ...draftItem(MATHS_IDS[0]), examStyle: "naplan_style" } as CandidateQuestion;
    expect(isScholarshipAttestedItem(naplan)).toBe(false);
    expect(verifyFirstPartyScholarshipAttestation(naplan).error).toBe("not_scholarship_attested_item");
  });

  it.each(MATHS_IDS)("%s: independent recompute equals the declared key", (id) => {
    const q = draftItem(id);
    const result = verifyFirstPartyScholarshipAttestation(q, hashJson(q));
    expect(result.error, result.message).toBeUndefined();
    expect(result.ok).toBe(true);
    expect(result.matchedOptionId).toBe(keyOf(q));
  });

  it.each(MATHS_IDS)("%s: prompt states exactly the numbers the solver is built on", (id) => {
    const entry = registry[id];
    expect([...promptQuantities(draftItem(id).prompt)].sort((a, b) => a - b)).toEqual([...new Set(entry.givens)].sort((a, b) => a - b));
  });

  it.each(MATHS_IDS)("%s: solver genuinely computes from its givens (not a literal)", (id) => {
    const entry = registry[id];
    const baseline = entry.solve(entry.givens);
    // Perturbing a given must change the output or make the solver refuse; a hard-coded answer would not react.
    const reacts = entry.givens.some((_, index) => {
      const perturbed = entry.givens.map((value, position) => (position === index ? value + 1 : value));
      try {
        return entry.solve(perturbed) !== baseline;
      } catch {
        return true;
      }
    });
    expect(reacts).toBe(true);
  });

  it.each(MATHS_IDS)("%s: re-keying to any other option fails closed with key_mismatch", (id) => {
    const q = draftItem(id);
    for (const option of q.options!.filter((candidate) => candidate.id !== keyOf(q))) {
      const rekeyed = { ...q, answerKey: { kind: "single_option", optionId: option.id } } as CandidateQuestion;
      const result = verifyFirstPartyScholarshipAttestation(rekeyed);
      expect(result.ok, `${id} keyed ${option.id}`).toBe(false);
      expect(result.error).toBe("key_mismatch");
    }
  });

  it.each(MATHS_IDS.filter((id) => registry[id].unit))("%s: the unit is compared, not stripped", (id) => {
    const q = draftItem(id);
    const unit = registry[id].unit!;
    const stripped = {
      ...q,
      options: q.options!.map((option) => {
        if (option.id !== keyOf(q)) return option;
        let text = option.text;
        if (unit.prefix) text = text.slice(unit.prefix.length);
        if (unit.suffix) text = text.slice(0, text.length - unit.suffix.length);
        return { ...option, text };
      }),
    } as CandidateQuestion;
    const result = verifyFirstPartyScholarshipAttestation(stripped);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("key_mismatch");
  });

  describe("hash binding", () => {
    it("fails closed when content changes after attestation", () => {
      const q = draftItem(MATHS_IDS[6]);
      const attested = hashJson(q);
      const edited = { ...q, explanation: `${q.explanation} (edited)` } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(edited, attested).error).toBe("content_hash_mismatch");
    });

    it("fails closed when an option is re-keyed after attestation", () => {
      const q = draftItem(MATHS_IDS[7]);
      const attested = hashJson(q);
      const rekeyed = { ...q, answerKey: { kind: "single_option", optionId: keyOf(q) === "a" ? "b" : "a" } } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(rekeyed, attested).error).toBe("content_hash_mismatch");
    });
  });

  describe("fail-closed guardrails", () => {
    it("rejects an item with no registered solver", () => {
      const q = { ...draftItem(MATHS_IDS[0]), id: "scholarship-y6-maths-999" } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(q).error).toBe("missing_first_party_solver");
    });

    it("rejects inherited property names as solver ids", () => {
      const q = { ...draftItem(MATHS_IDS[0]), id: "constructor" } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(q).error).toBe("not_scholarship_attested_item");
      // and inside the registered id pattern but absent from the registry, it still fails closed
      expect(Object.hasOwn(registry, "scholarship-y6-maths-000")).toBe(false);
      const unregistered = { ...draftItem(MATHS_IDS[0]), id: "scholarship-y6-maths-000" } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(unregistered).error).toBe("missing_first_party_solver");
    });

    it("does not let a mathematics item borrow a numerical-reasoning solver", () => {
      const q = { ...draftItem(MATHS_IDS[0]), id: "scholarship-y6-nr-021" } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(q).error).toBe("not_scholarship_attested_item");
    });

    it("rejects when the prompt no longer states the numbers the solver is built on", () => {
      const q = draftItem("scholarship-y6-maths-007");
      const edited = { ...q, prompt: q.prompt.replace("25%", "20%") } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(edited).error).toBe("prompt_givens_mismatch");
    });

    it("notices a flipped sign in the prompt", () => {
      const q = draftItem("scholarship-y6-maths-001");
      const edited = { ...q, prompt: q.prompt.replace("-6°C", "6°C") } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(edited).error).toBe("prompt_givens_mismatch");
    });

    it("rejects when the computed value matches several options", () => {
      const q = draftItem("scholarship-y6-maths-007");
      const duplicated = { ...q, options: q.options!.map((o) => (o.id === "b" ? { ...o, text: "$108" } : o)) } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(duplicated).error).toBe("option_match_ambiguous");
    });

    it("rejects unsupported question shapes", () => {
      const q = draftItem("scholarship-y6-maths-007");
      const numberEntry = { ...q, type: "number_entry", answerKey: { kind: "number", value: 108, tolerance: 0 } } as unknown as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(numberEntry).error).toBe("unsupported_question_shape");
    });

    describe.each<[string, ScholarshipSolverEntry["solve"], string]>([
      ["throws", () => { throw new Error("boom"); }, "solver_execution_failed"],
      ["returns NaN", () => Number.NaN, "solver_execution_failed"],
      ["returns Infinity", () => Number.POSITIVE_INFINITY, "solver_execution_failed"],
      ["returns undefined", (() => undefined) as unknown as ScholarshipSolverEntry["solve"], "solver_execution_failed"],
      ["returns a string", (() => "108") as unknown as ScholarshipSolverEntry["solve"], "solver_execution_failed"],
    ])("a solver that %s", (_label, solve, expected) => {
      it(`fails closed with ${expected}`, () => {
        const id = "scholarship-y6-maths-007";
        const original = registry[id];
        registry[id] = { ...original, solve };
        try {
          const result = verifyFirstPartyScholarshipAttestation(draftItem(id));
          expect(result.ok).toBe(false);
          expect(result.error).toBe(expected);
        } finally {
          registry[id] = original;
        }
      });
    });

    it("a solver whose domain has no unique solution fails closed instead of guessing", () => {
      expect(() => registry["scholarship-y6-maths-018"].solve([4, 19, 70])).toThrow(/exactly one solution/);
      expect(() => registry["scholarship-y6-maths-014"].solve([5, 5, 30])).toThrow(/exactly one solution/);
    });

    it("a solver refuses a result that is not a whole number instead of rounding it", () => {
      expect(() => registry["scholarship-y6-maths-013"].solve([210, 75, 101])).toThrow(/not a whole number/);
    });
  });

  describe("candidate logic is never trusted", () => {
    it("ignores sidecar constraint strings: attestation is unchanged by hostile solverParams", () => {
      const marker = globalThis as typeof globalThis & { scholarshipMathsConstraintExecuted?: boolean };
      marker.scholarshipMathsConstraintExecuted = false;
      try {
        const q = {
          ...draftItem("scholarship-y6-maths-007"),
          solverParams: {
            solver: "arithmetical_reasoning",
            solverParams: {
              variables: [{ name: "V", min: 0, max: 500 }],
              targetVariable: "V",
              constraints: ["(globalThis.scholarshipMathsConstraintExecuted = true, V === 1)"],
            },
          },
        } as unknown as CandidateQuestion;
        const result = verifyFirstPartyScholarshipAttestation(q);
        expect(result.ok).toBe(true);
        expect(result.computedValue).toBe(108);
        expect(marker.scholarshipMathsConstraintExecuted).toBe(false);
      } finally {
        delete marker.scholarshipMathsConstraintExecuted;
      }
    });

    it("publication gate refuses candidate-supplied solverParams on a mathematics item", async () => {
      const q = {
        ...draftItem("scholarship-y6-maths-007"),
        solverParams: { solver: "number_series", solverParams: { sequence: [2, 4, 6], rule: { kind: "arithmetic", diff: 2 } } },
      } as unknown as CandidateQuestion;
      const issues = await attestationIssues(q);
      expect(issues.some((issue) => issue.path === "solverParams" && /not permitted/i.test(issue.message))).toBe(true);
    });
  });

  describe("publication gate wiring", () => {
    it("raises no attestation issue for a correct, hash-bound item", async () => {
      const q = draftItem("scholarship-y6-maths-028");
      const fixture = buildCorrectnessFixture(q as unknown as Record<string, unknown>);
      const issues = await attestationIssues(q, (fixture.provenance as unknown as CandidateProvenance).contentHash);
      expect(issues.filter((issue) => issue.path === "scholarship_attestation")).toEqual([]);
    });

    it("raises an attestation issue when the item has no registered solver", async () => {
      const q = { ...draftItem("scholarship-y6-maths-028"), id: "scholarship-y6-maths-998" } as CandidateQuestion;
      const issues = await attestationIssues(q);
      expect(issues.some((issue) => issue.path === "scholarship_attestation" && /No first-party/.test(issue.message))).toBe(true);
    });

    it("raises an attestation issue when the stored content hash is stale", async () => {
      const q = draftItem("scholarship-y6-maths-028");
      const issues = await attestationIssues(q, "0".repeat(64));
      expect(issues.some((issue) => issue.path === "scholarship_attestation" && /content hash mismatch/i.test(issue.message))).toBe(true);
    });

    it("raises an attestation issue when the key is wrong", async () => {
      const q = { ...draftItem("scholarship-y6-maths-028"), answerKey: { kind: "single_option", optionId: "a" } } as CandidateQuestion;
      const issues = await attestationIssues(q);
      expect(issues.some((issue) => issue.path === "scholarship_attestation")).toBe(true);
    });
  });
});

describe("promptQuantities", () => {
  it("reads signed, comma-grouped and decimal quantities", () => {
    expect([...promptQuantities("It fell from -6°C to (-12) by 4.8 m, then 12,000 more; 7y - 15 = 3")].sort((a, b) => a - b)).toEqual([
      -12, -6, 3, 4.8, 7, 15, 12000,
    ]);
  });

  it("treats a spaced minus as an operator, not a sign", () => {
    expect([...promptQuantities("14 - 5")].sort((a, b) => a - b)).toEqual([5, 14]);
  });
});

describe("optionMatchesQuantity", () => {
  it("accepts the exact prefix, number and suffix", () => {
    expect(optionMatchesQuantity(108, "$108", { prefix: "$" })).toBe(true);
    expect(optionMatchesQuantity(24000, "$24,000", { prefix: "$" })).toBe(true);
    expect(optionMatchesQuantity(-3, "-3°C", { suffix: "°C" })).toBe(true);
    expect(optionMatchesQuantity(-3, "−3°C", { suffix: "°C" })).toBe(true);
    expect(optionMatchesQuantity(540, "540 m²", { suffix: " m²" })).toBe(true);
  });

  it("refuses a missing, wrong or extra unit", () => {
    expect(optionMatchesQuantity(108, "108", { prefix: "$" })).toBe(false);
    expect(optionMatchesQuantity(108, "108 m", { prefix: "$" })).toBe(false);
    expect(optionMatchesQuantity(108, "$108 m", { prefix: "$" })).toBe(false);
    expect(optionMatchesQuantity(3, "3 m", { suffix: " cm" })).toBe(false);
    expect(optionMatchesQuantity(3, "$3", {})).toBe(false);
  });

  it("refuses a different number or a malformed number", () => {
    expect(optionMatchesQuantity(108, "$109", { prefix: "$" })).toBe(false);
    expect(optionMatchesQuantity(24000, "$24,00", { prefix: "$" })).toBe(false);
    expect(optionMatchesQuantity(3, "3.0.1", {})).toBe(false);
    expect(optionMatchesQuantity(3, "three", {})).toBe(false);
    expect(optionMatchesQuantity(Number.NaN, "3", {})).toBe(false);
  });
});
