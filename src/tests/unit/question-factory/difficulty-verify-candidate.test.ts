import { describe, expect, it } from "vitest";

import { FACTORY_THRESHOLDS } from "@/features/question-factory/config";
import type { QuestionFactoryCandidate } from "@/features/question-factory/difficulty/types";
import { verifyCandidateDifficulty } from "@/features/question-factory/difficulty/verify-candidate-difficulty";

import { baseProvenance } from "./correctness-fixtures";

const VALIDATED_AT = "2026-03-01T00:00:00.000Z";
const BLUEPRINT_HASH = "df-verify-blueprint-hash";

function candidateWith(prompt: string, explanation?: string): QuestionFactoryCandidate {
  const question = {
    id: "df-verify-fixture-001",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt,
    options: [],
    answerKey: { kind: "number", value: 1, tolerance: 0 },
    ...(explanation !== undefined ? { explanation } : {}),
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 45 },
  };
  return {
    candidateId: question.id,
    state: "originality_review_passed",
    question,
    provenance: baseProvenance(question),
  };
}

function shortPrompt(): string {
  return "Two plus two?"; // 3 words: below the 4-word (0.5) confidence floor
}

function longPrompt(wordCount: number): string {
  return Array.from({ length: wordCount }, (_, index) => `word${index}`).join(" ");
}

describe("verifyCandidateDifficulty — confirmed", () => {
  it("passes with outcome confirmed when deviation is within tolerance and confidence is sufficient", () => {
    // 40 words -> readingLoad 0.5; "wordN" tokens -> vocab ~0.25; no
    // explanation -> reasoning 0. difficultyScore ~= 0.25 -> band 'easy'.
    const result = verifyCandidateDifficulty(candidateWith(longPrompt(40)), {
      validatedAt: VALIDATED_AT,
      declaredDifficulty: "easy",
      blueprintHash: BLUEPRINT_HASH,
    });
    expect(result.status).toBe("passed");
    expect(result.outcome).toBe("confirmed");
    expect(result.evidence.outcome).toBe("passed");
  });
});

describe("verifyCandidateDifficulty — mismatch", () => {
  it("fails with outcome mismatch when a confident estimate deviates from the declared band", () => {
    const result = verifyCandidateDifficulty(candidateWith(longPrompt(70)), {
      validatedAt: VALIDATED_AT,
      declaredDifficulty: "easy",
      blueprintHash: BLUEPRINT_HASH,
    });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.outcome).toBe("mismatch");
      expect(result.issues.some((issue) => issue.code === "difficulty_deviation_exceeded")).toBe(true);
      expect(result.evidence.deviation).toBeGreaterThan(FACTORY_THRESHOLDS.DIFFICULTY_MATCH_TOLERANCE);
    }
  });
});

describe("verifyCandidateDifficulty — insufficient_evidence (unsupported)", () => {
  it("quarantines, never passes or fails, when confidence is below the floor", () => {
    const result = verifyCandidateDifficulty(candidateWith(shortPrompt()), {
      validatedAt: VALIDATED_AT,
      declaredDifficulty: "easy",
      blueprintHash: BLUEPRINT_HASH,
    });
    expect(result.status).toBe("quarantined");
    if (result.status === "quarantined") {
      expect(result.outcome).toBe("insufficient_evidence");
      expect(result.issues.some((issue) => issue.code === "difficulty_estimate_low_confidence")).toBe(true);
      expect(result.evidence.estimateConfidence).toBeLessThan(FACTORY_THRESHOLDS.MIN_DIFFICULTY_ESTIMATE_CONFIDENCE);
    }
  });

  it("quarantines on malformed candidate provenance — cannot compute, never passed", () => {
    const candidate = candidateWith(longPrompt(30));
    const malformed: QuestionFactoryCandidate = { ...candidate, provenance: { not: "valid" } };
    const result = verifyCandidateDifficulty(malformed, { validatedAt: VALIDATED_AT, declaredDifficulty: "easy", blueprintHash: BLUEPRINT_HASH });
    expect(result.status).toBe("quarantined");
    if (result.status === "quarantined") {
      expect(result.issues.some((issue) => issue.code === "difficulty_estimation_failed")).toBe(true);
    }
  });
});

describe("verifyCandidateDifficulty — never trusts author-declared difficulty", () => {
  it("compares against context.declaredDifficulty (the blueprint's value), never candidate.question.metadata.difficulty", () => {
    const question = {
      id: "df-verify-author-001",
      type: "number_entry",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: longPrompt(40),
      options: [],
      answerKey: { kind: "number", value: 1, tolerance: 0 },
      // Author declares "challenging" on the candidate itself — the gate
      // must ignore this and use context.declaredDifficulty ("easy")
      // instead, so the low-effort text still confirms against "easy".
      metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "challenging", marks: 1, estimatedTimeSeconds: 45 },
    };
    const candidate: QuestionFactoryCandidate = { candidateId: question.id, state: "originality_review_passed", question, provenance: baseProvenance(question) };
    const result = verifyCandidateDifficulty(candidate, { validatedAt: VALIDATED_AT, declaredDifficulty: "easy", blueprintHash: BLUEPRINT_HASH });
    expect(result.status).toBe("passed");
    expect(result.evidence.declaredDifficulty).toBe("easy");
  });
});

describe("verifyCandidateDifficulty — determinism", () => {
  it("produces an identical fingerprint for identical input regardless of validatedAt", () => {
    const candidate = candidateWith(longPrompt(40));
    const first = verifyCandidateDifficulty(candidate, { validatedAt: VALIDATED_AT, declaredDifficulty: "easy", blueprintHash: BLUEPRINT_HASH });
    const second = verifyCandidateDifficulty(candidate, { validatedAt: "2030-01-01T00:00:00.000Z", declaredDifficulty: "easy", blueprintHash: BLUEPRINT_HASH });
    expect(first.evidence.difficultyFingerprint).toBe(second.evidence.difficultyFingerprint);
  });
});
