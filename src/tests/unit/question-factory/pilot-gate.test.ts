import { describe, expect, it } from "vitest";

import {
  assertPilotDomainPassed,
  DEFAULT_PILOT_CONFIG,
  evaluatePilotDomain,
  type PilotCandidateEvaluation,
} from "@/features/question-factory/pipeline/pilot-gate";

describe("evaluatePilotDomain — quality gate for pilot domain runs", () => {
  it("defaults to min 5, max 10 candidates, and 80% structural pass rate", () => {
    expect(DEFAULT_PILOT_CONFIG.MIN_BATCH_SIZE).toBe(5);
    expect(DEFAULT_PILOT_CONFIG.MAX_BATCH_SIZE).toBe(10);
    expect(DEFAULT_PILOT_CONFIG.MIN_PASS_RATE).toBe(0.8);
  });

  it("passes when a domain meets or exceeds the 80% pass threshold (e.g. 7/7 = 100% on Language pilot)", () => {
    const candidates: PilotCandidateEvaluation[] = Array.from({ length: 7 }, (_, i) => ({
      candidateId: `lang-pilot-${i + 1}`,
      passedStructural: true,
      passedCorrectness: true,
    }));

    const outcome = evaluatePilotDomain({
      domain: "language_conventions",
      candidates,
    });

    expect(outcome.passed).toBe(true);
    if (!outcome.passed) return;
    expect(outcome.domain).toBe("language_conventions");
    expect(outcome.passedCount).toBe(7);
    expect(outcome.totalCount).toBe(7);
    expect(outcome.passRate).toBe(1);
    expect(outcome.message).toContain("passed gate");
  });

  it("HALTS the run when a pilot domain scores 0% (the exact September numeracy defect: 0/5 passed on visual schema)", () => {
    // 5 candidates generated, all 5 rejected at structural/visual gate
    const candidates: PilotCandidateEvaluation[] = Array.from({ length: 5 }, (_, i) => ({
      candidateId: `num-pilot-${i + 1}`,
      passedStructural: false,
      failureReason: "invalid_visuals: perimeter visual lacked mandatory dimensions",
    }));

    const outcome = evaluatePilotDomain({
      domain: "numeracy",
      candidates,
    });

    expect(outcome.passed).toBe(false);
    if (outcome.passed) return;
    expect(outcome.status).toBe("halted");
    expect(outcome.issueCode).toBe("pilot_pass_rate_below_threshold");
    expect(outcome.domain).toBe("numeracy");
    expect(outcome.passedCount).toBe(0);
    expect(outcome.totalCount).toBe(5);
    expect(outcome.passRate).toBe(0);
    expect(outcome.message).toContain("failed structural schema gate: 0/5 passed (0.0% < 80.0% required)");
    expect(outcome.message).toContain("Run halted for domain 'numeracy'");
  });

  it("HALTS the run when structural pass rate is below 80% (e.g. 3/5 = 60%)", () => {
    const candidates: PilotCandidateEvaluation[] = [
      { candidateId: "c1", passedStructural: true },
      { candidateId: "c2", passedStructural: true },
      { candidateId: "c3", passedStructural: true },
      { candidateId: "c4", passedStructural: false },
      { candidateId: "c5", passedStructural: false },
    ];

    const outcome = evaluatePilotDomain({
      domain: "science",
      candidates,
    });

    expect(outcome.passed).toBe(false);
    if (outcome.passed) return;
    expect(outcome.status).toBe("halted");
    expect(outcome.issueCode).toBe("pilot_pass_rate_below_threshold");
    expect(outcome.passedCount).toBe(3);
    expect(outcome.passRate).toBe(0.6);
  });

  it("HALTS when pilot batch size is fewer than 5 candidates", () => {
    const candidates: PilotCandidateEvaluation[] = [
      { candidateId: "c1", passedStructural: true },
      { candidateId: "c2", passedStructural: true },
      { candidateId: "c3", passedStructural: true },
    ];

    const outcome = evaluatePilotDomain({
      domain: "reading",
      candidates,
    });

    expect(outcome.passed).toBe(false);
    if (outcome.passed) return;
    expect(outcome.status).toBe("halted");
    expect(outcome.issueCode).toBe("pilot_batch_size_invalid");
    expect(outcome.message).toContain("has 3 candidates; requires between 5 and 10");
  });

  it("HALTS when pilot batch size exceeds 10 candidates", () => {
    const candidates: PilotCandidateEvaluation[] = Array.from({ length: 11 }, (_, i) => ({
      candidateId: `c-${i + 1}`,
      passedStructural: true,
    }));

    const outcome = evaluatePilotDomain({
      domain: "reading",
      candidates,
    });

    expect(outcome.passed).toBe(false);
    if (outcome.passed) return;
    expect(outcome.status).toBe("halted");
    expect(outcome.issueCode).toBe("pilot_batch_size_invalid");
  });

  it("HALTS when machine correctness verification fails on any candidate", () => {
    const candidates: PilotCandidateEvaluation[] = Array.from({ length: 6 }, (_, i) => ({
      candidateId: `num-${i + 1}`,
      passedStructural: true,
      passedCorrectness: i !== 0, // item 0 failed correctness
    }));

    const outcome = evaluatePilotDomain({
      domain: "numeracy",
      candidates,
    });

    expect(outcome.passed).toBe(false);
    if (outcome.passed) return;
    expect(outcome.status).toBe("halted");
    expect(outcome.issueCode).toBe("pilot_correctness_failed");
    expect(outcome.message).toContain("failed correctness check on 1 candidate(s)");
  });

  it("assertPilotDomainPassed throws a descriptive error on failure and returns quietly on pass", () => {
    const failing: PilotCandidateEvaluation[] = Array.from({ length: 5 }, (_, i) => ({
      candidateId: `f-${i}`,
      passedStructural: false,
    }));

    expect(() =>
      assertPilotDomainPassed({ domain: "numeracy", candidates: failing }),
    ).toThrow(/\[PILOT GATE HALTED\] Pilot domain 'numeracy' failed structural schema gate: 0\/5 passed/);

    const passing: PilotCandidateEvaluation[] = Array.from({ length: 5 }, (_, i) => ({
      candidateId: `p-${i}`,
      passedStructural: true,
    }));

    expect(() =>
      assertPilotDomainPassed({ domain: "numeracy", candidates: passing }),
    ).not.toThrow();
  });
});
