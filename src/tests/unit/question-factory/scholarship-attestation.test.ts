import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkPublicationEligibility } from "@/features/question-factory/publication/eligibility";
import {
  SCHOLARSHIP_FIRST_PARTY_SOLVERS,
  isScholarshipAttestedItem,
  optionMatchesQuantity,
  promptNumbers,
  verifyFirstPartyScholarshipAttestation,
  type ScholarshipSolverEntry,
} from "@/features/question-factory/correctness/scholarship-attestation";
import type { CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import type { CandidateProvenance } from "@/features/question-factory/provenance";
import { hashJson } from "@/features/question-factory/provenance";
import type { FactoryRepository } from "@/features/question-factory/storage";
import { additionQuestion, buildCorrectnessFixture } from "./correctness-fixtures";

const repo = { read: async () => undefined } as unknown as FactoryRepository;

const packet = JSON.parse(
  readFileSync("content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json", "utf8"),
) as { questions: Array<Record<string, unknown> & { id: string }>; parameters: Record<string, Record<string, unknown>> };

const NR_IDS = Array.from({ length: 20 }, (_, index) => `scholarship-y6-nr-${String(21 + index).padStart(3, "0")}`);

function draftItem(id: string): CandidateQuestion {
  const raw = packet.questions.find((candidate) => candidate.id === id);
  if (!raw) throw new Error(`draft ${id} missing`);
  return { ...additionQuestion(), ...raw } as unknown as CandidateQuestion;
}

function keyedText(q: CandidateQuestion): string {
  const key = q.answerKey as { optionId: string };
  return q.options!.find((option) => option.id === key.optionId)!.text;
}

async function attestationIssues(q: CandidateQuestion, contentHash?: string) {
  const fixture = buildCorrectnessFixture(q as unknown as Record<string, unknown>);
  const base = fixture.provenance as unknown as CandidateProvenance;
  const provenance = contentHash === undefined ? base : { ...base, contentHash };
  const result = await checkPublicationEligibility({ candidateId: q.id, question: q, provenance }, repo);
  return result.ok ? [] : result.issues.filter((issue) => issue.code === "publication_solver_verification_failed");
}

describe("scholarship first-party attestation: nr-021..nr-040", () => {
  it("registers a solver for exactly the twenty arithmetical-reasoning / deduction items", () => {
    expect(Object.keys(SCHOLARSHIP_FIRST_PARTY_SOLVERS).sort()).toEqual(NR_IDS);
    const inScope = packet.questions.filter((q) => isScholarshipAttestedItem(q as unknown as CandidateQuestion)).map((q) => q.id);
    expect(inScope.sort()).toEqual(NR_IDS);
  });

  it.each(NR_IDS)("%s: independent recompute equals the declared key", (id) => {
    const q = draftItem(id);
    const result = verifyFirstPartyScholarshipAttestation(q, hashJson(q));
    expect(result.error, result.message).toBeUndefined();
    expect(result.ok).toBe(true);
    // The keyed option must carry exactly the computed number and the registered unit (bare numbers for most items, "$" for nr-023).
    expect(optionMatchesQuantity(result.computedValue!, keyedText(q), SCHOLARSHIP_FIRST_PARTY_SOLVERS[id].unit)).toBe(true);
    expect(result.matchedOptionId).toBe((q.answerKey as { optionId: string }).optionId);
  });

  it.each(NR_IDS)("%s: prompt states exactly the numbers the solver is built on", (id) => {
    const entry = SCHOLARSHIP_FIRST_PARTY_SOLVERS[id];
    expect([...promptNumbers(draftItem(id).prompt)].sort((a, b) => a - b)).toEqual(
      [...new Set(entry.givens)].sort((a, b) => a - b),
    );
  });

  it.each(NR_IDS)("%s: solver genuinely computes from its givens (not a literal)", (id) => {
    const entry = SCHOLARSHIP_FIRST_PARTY_SOLVERS[id];
    const baseline = entry.solve(entry.givens);
    // Perturbing the inputs must change the output or make the solver refuse; a hard-coded answer would not react.
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

  describe("hash binding", () => {
    it("fails closed when content changes after attestation", () => {
      const q = draftItem(NR_IDS[0]);
      const attested = hashJson(q);
      const edited = { ...q, explanation: `${q.explanation} (edited)` } as CandidateQuestion;
      const result = verifyFirstPartyScholarshipAttestation(edited, attested);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("content_hash_mismatch");
    });

    it("fails closed when an option is re-keyed after attestation", () => {
      const q = draftItem(NR_IDS[1]);
      const attested = hashJson(q);
      const rekeyed = { ...q, answerKey: { kind: "single_option", optionId: "a" } } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(rekeyed, attested).error).toBe("content_hash_mismatch");
    });
  });

  describe("fail-closed guardrails", () => {
    it("rejects an item with no registered solver", () => {
      const q = { ...draftItem(NR_IDS[0]), id: "scholarship-y6-nr-999" } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(q).error).toBe("missing_first_party_solver");
    });

    it("rejects inherited property names as solver ids", () => {
      const q = { ...draftItem(NR_IDS[0]), id: "constructor" } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(q).error).toBe("missing_first_party_solver");
    });

    it("rejects an out-of-scope subject or skill", () => {
      const q = draftItem(NR_IDS[0]);
      const wrongSubject = { ...q, metadata: { ...q.metadata, subject: "amc_mathematics" } } as CandidateQuestion;
      const wrongSkill = { ...q, metadata: { ...q.metadata, skill: "nr-number-series" } } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(wrongSubject).error).toBe("not_scholarship_attested_item");
      expect(verifyFirstPartyScholarshipAttestation(wrongSkill).error).toBe("not_scholarship_attested_item");
    });

    it("rejects a key that disagrees with the recompute", () => {
      const q = draftItem("scholarship-y6-nr-021");
      const wrong = { ...q, answerKey: { kind: "single_option", optionId: "b" } } as CandidateQuestion;
      const result = verifyFirstPartyScholarshipAttestation(wrong);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("key_mismatch");
      expect(result.computedValue).toBe(10);
    });

    it("rejects when the computed value matches no option", () => {
      const q = draftItem("scholarship-y6-nr-021");
      const noMatch = { ...q, options: q.options!.map((o) => (o.id === "a" ? { ...o, text: "11" } : o)) } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(noMatch).error).toBe("key_mismatch");
    });

    it("rejects when the computed value matches several options", () => {
      const q = draftItem("scholarship-y6-nr-021");
      const duplicated = { ...q, options: q.options!.map((o) => (o.id === "b" ? { ...o, text: "10" } : o)) } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(duplicated).error).toBe("option_match_ambiguous");
    });

    it("rejects when the prompt no longer states the numbers the solver is built on", () => {
      const q = draftItem("scholarship-y6-nr-021");
      const edited = { ...q, prompt: q.prompt.replace("68 legs", "70 legs") } as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(edited).error).toBe("prompt_givens_mismatch");
    });

    it("rejects unsupported question shapes", () => {
      const q = draftItem("scholarship-y6-nr-021");
      const numberEntry = { ...q, type: "number_entry", answerKey: { kind: "number", value: 10, tolerance: 0 } } as unknown as CandidateQuestion;
      expect(verifyFirstPartyScholarshipAttestation(numberEntry).error).toBe("unsupported_question_shape");
    });

    describe.each<[string, ScholarshipSolverEntry["solve"], string]>([
      ["throws", () => { throw new Error("boom"); }, "solver_execution_failed"],
      ["returns NaN", () => Number.NaN, "solver_execution_failed"],
      ["returns Infinity", () => Number.POSITIVE_INFINITY, "solver_execution_failed"],
      ["returns undefined", (() => undefined) as unknown as ScholarshipSolverEntry["solve"], "solver_execution_failed"],
      ["returns a string", (() => "10") as unknown as ScholarshipSolverEntry["solve"], "solver_execution_failed"],
    ])("a solver that %s", (_label, solve, expected) => {
      it(`fails closed with ${expected}`, () => {
        const id = "scholarship-y6-nr-021";
        const registry = SCHOLARSHIP_FIRST_PARTY_SOLVERS as Record<string, ScholarshipSolverEntry>;
        const original = registry[id];
        registry[id] = { givens: original.givens, solve };
        try {
          const result = verifyFirstPartyScholarshipAttestation(draftItem(id));
          expect(result.ok).toBe(false);
          expect(result.error).toBe(expected);
        } finally {
          registry[id] = original;
        }
      });
    });

    it("a solver that finds no unique solution fails closed instead of guessing", () => {
      const entry = SCHOLARSHIP_FIRST_PARTY_SOLVERS["scholarship-y6-nr-021"];
      // heads 24 with 69 legs has no integer solution
      expect(() => entry.solve([24, 69])).toThrow(/exactly one solution/);
    });
  });

  describe("candidate logic is never trusted", () => {
    it("ignores sidecar constraint strings: attestation is unchanged by hostile solverParams", () => {
      const marker = globalThis as typeof globalThis & { scholarshipConstraintExecuted?: boolean };
      marker.scholarshipConstraintExecuted = false;
      try {
        const q = {
          ...draftItem("scholarship-y6-nr-021"),
          solverParams: {
            solver: "arithmetical_reasoning",
            solverParams: {
              variables: [{ name: "S", min: 0, max: 24 }],
              targetVariable: "S",
              constraints: ["(globalThis.scholarshipConstraintExecuted = true, S === 3)"],
            },
          },
        } as unknown as CandidateQuestion;
        const result = verifyFirstPartyScholarshipAttestation(q);
        expect(result.ok).toBe(true);
        expect(result.computedValue).toBe(10);
        expect(marker.scholarshipConstraintExecuted).toBe(false);
      } finally {
        delete marker.scholarshipConstraintExecuted;
      }
    });

    it("publication gate refuses candidate-supplied solverParams on an attested item", async () => {
      const q = {
        ...draftItem("scholarship-y6-nr-021"),
        solverParams: { solver: "number_series", solverParams: { sequence: [2, 4, 6], rule: { kind: "arithmetic", diff: 2 } } },
      } as unknown as CandidateQuestion;
      const issues = await attestationIssues(q);
      expect(issues.some((issue) => issue.path === "solverParams" && /not permitted/i.test(issue.message))).toBe(true);
    });
  });

  describe("publication gate wiring", () => {
    it("raises no attestation issue for a correct, hash-bound item", async () => {
      const q = draftItem("scholarship-y6-nr-030");
      const fixture = buildCorrectnessFixture(q as unknown as Record<string, unknown>);
      const issues = await attestationIssues(q, (fixture.provenance as unknown as CandidateProvenance).contentHash);
      expect(issues.filter((issue) => issue.path === "scholarship_attestation")).toEqual([]);
    });

    it("raises an attestation issue when the item has no registered solver", async () => {
      const q = { ...draftItem("scholarship-y6-nr-030"), id: "scholarship-y6-nr-998" } as CandidateQuestion;
      const issues = await attestationIssues(q);
      expect(issues.some((issue) => issue.path === "scholarship_attestation" && /No first-party/.test(issue.message))).toBe(true);
    });

    it("raises an attestation issue when the stored content hash is stale", async () => {
      const q = draftItem("scholarship-y6-nr-030");
      const issues = await attestationIssues(q, "0".repeat(64));
      expect(issues.some((issue) => issue.path === "scholarship_attestation" && /content hash mismatch/i.test(issue.message))).toBe(true);
    });

    it("raises an attestation issue when the key is wrong", async () => {
      const q = { ...draftItem("scholarship-y6-nr-030"), answerKey: { kind: "single_option", optionId: "a" } } as CandidateQuestion;
      const issues = await attestationIssues(q);
      expect(issues.some((issue) => issue.path === "scholarship_attestation")).toBe(true);
    });
  });
});
