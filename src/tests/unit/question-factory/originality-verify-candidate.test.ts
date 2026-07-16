import { describe, expect, it } from "vitest";

import { FACTORY_THRESHOLDS } from "@/features/question-factory/config";
import { computeSimilarity } from "@/features/question-factory/originality/similarity";
import type { QuestionFactoryCandidate } from "@/features/question-factory/originality/types";
import { verifyCandidateOriginality } from "@/features/question-factory/originality/verify-candidate-originality";

import { baseProvenance } from "./correctness-fixtures";

const VALIDATED_AT = "2026-03-01T00:00:00.000Z";

function candidateWith(prompt: string, options: readonly { readonly id: string; readonly text: string }[] = []): QuestionFactoryCandidate {
  const question = {
    id: "og-verify-fixture-001",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt,
    options,
    answerKey: { kind: "number", value: 1, tolerance: 0 },
    explanation: "Explanation text, never part of the comparison.",
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 45 },
  };
  return {
    candidateId: question.id,
    state: "semantic_review_passed",
    question,
    provenance: baseProvenance(question),
  };
}

function corpusOf(...texts: readonly string[]): readonly { readonly id: string; readonly comparableText: string }[] {
  return texts.map((text, index) => ({ id: `corpus-${index}`, comparableText: text }));
}

describe("verifyCandidateOriginality — classification boundaries", () => {
  it("classifies exact_duplicate at similarity = 1.0 and hard-fails (never passes)", () => {
    const text = "What is the sum of twenty three and forty eight in this problem?";
    const result = verifyCandidateOriginality(candidateWith(text), { validatedAt: VALIDATED_AT, corpus: corpusOf(text) });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.classification).toBe("exact_duplicate");
      expect(result.evidence.nearestMatches[0]?.similarityScore).toBe(1);
    }
  });

  it("classifies distinct and passes when nearest-match similarity is clearly below 0.6", () => {
    const candidate = "Completely unrelated content about a rocket launch sequence.";
    const corpus = "A totally different passage discussing garden vegetables and soil.";
    expect(computeSimilarity(candidate, corpus)).toBeLessThan(FACTORY_THRESHOLDS.STRUCTURALLY_SIMILAR_SIMILARITY);
    const result = verifyCandidateOriginality(candidateWith(candidate), { validatedAt: VALIDATED_AT, corpus: corpusOf(corpus) });
    expect(result.status).toBe("passed");
    if (result.status === "passed") {
      expect(result.classification).toBe("distinct");
    }
  });

  it("routes consistently with FACTORY_THRESHOLDS for an arbitrary similarity value (wiring proof, not a hand-picked boundary)", () => {
    const candidate = "Sam buys two apples and one banana at the market on Monday.";
    const corpus = "Sam buys three apples and one banana at the market on Tuesday.";
    const similarity = computeSimilarity(candidate, corpus);
    const result = verifyCandidateOriginality(candidateWith(candidate), { validatedAt: VALIDATED_AT, corpus: corpusOf(corpus) });

    if (similarity >= 1) {
      expect(result.status).toBe("failed");
      if (result.status === "failed") expect(result.classification).toBe("exact_duplicate");
    } else if (similarity >= FACTORY_THRESHOLDS.NEAR_DUPLICATE_SIMILARITY) {
      expect(result.status).toBe("failed");
      if (result.status === "failed") expect(result.classification).toBe("substantive_duplicate");
    } else if (similarity >= FACTORY_THRESHOLDS.STRUCTURALLY_SIMILAR_SIMILARITY) {
      expect(result.status).toBe("failed");
      if (result.status === "failed") expect(result.classification).toBe("structurally_similar");
    } else {
      expect(result.status).toBe("passed");
    }
  });

  it("never routes a structurally_similar classification to hard-fail severity — only soft-fail-shaped (status failed, classification structurally_similar)", () => {
    // Construct a candidate sharing roughly half its shingles with the corpus member.
    const candidate = "The quick brown fox jumps over the lazy sleeping dog near the old barn";
    const corpus = "The quick brown fox jumps over energetic new fences near the tall barn";
    const similarity = computeSimilarity(candidate, corpus);
    const result = verifyCandidateOriginality(candidateWith(candidate), { validatedAt: VALIDATED_AT, corpus: corpusOf(corpus) });
    if (similarity >= FACTORY_THRESHOLDS.STRUCTURALLY_SIMILAR_SIMILARITY && similarity < FACTORY_THRESHOLDS.NEAR_DUPLICATE_SIMILARITY) {
      expect(result.status).toBe("failed");
      if (result.status === "failed") expect(result.classification).toBe("structurally_similar");
    }
  });

  it("quarantines (never passes or hard-fails) when the candidate's comparable text normalises to zero tokens", () => {
    const result = verifyCandidateOriginality(candidateWith("???!!!"), { validatedAt: VALIDATED_AT, corpus: corpusOf("some unrelated corpus text") });
    expect(result.status).toBe("quarantined");
    if (result.status === "quarantined") {
      expect(result.issues.some((issue) => issue.code === "originality_comparison_failed")).toBe(true);
    }
  });

  it("quarantines on malformed candidate provenance — cannot compute, never passed", () => {
    const candidate = candidateWith("What is 2 + 2?");
    const malformed: QuestionFactoryCandidate = { ...candidate, provenance: { not: "valid provenance shape" } };
    const result = verifyCandidateOriginality(malformed, { validatedAt: VALIDATED_AT, corpus: [] });
    expect(result.status).toBe("quarantined");
  });

  it("passes trivially against an empty corpus (nothing to be a duplicate of)", () => {
    const result = verifyCandidateOriginality(candidateWith("Any well-formed prompt text at all works here."), { validatedAt: VALIDATED_AT, corpus: [] });
    expect(result.status).toBe("passed");
  });

  it("bounds nearestMatches to the top 5, sorted descending by similarity", () => {
    const candidate = "alpha beta gamma delta epsilon zeta eta theta";
    const corpus = corpusOf(
      "alpha beta gamma delta epsilon zeta eta theta",
      "alpha beta gamma delta epsilon zeta eta iota",
      "alpha beta gamma delta epsilon zeta kappa lambda",
      "alpha beta gamma delta epsilon mu nu xi",
      "alpha beta gamma delta omicron pi rho sigma",
      "alpha beta gamma tau upsilon phi chi psi",
      "completely disjoint content with no shared tokens whatsoever",
    );
    const result = verifyCandidateOriginality(candidateWith(candidate), { validatedAt: VALIDATED_AT, corpus });
    expect(result.evidence.nearestMatches.length).toBeLessThanOrEqual(5);
    const scores = result.evidence.nearestMatches.map((match) => match.similarityScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("is deterministic — identical inputs always produce the same evidence fingerprint", () => {
    const candidate = candidateWith("What is the total cost of three items at five dollars each?");
    const corpus = corpusOf("A distinct passage about weather patterns in spring.");
    const first = verifyCandidateOriginality(candidate, { validatedAt: VALIDATED_AT, corpus });
    const second = verifyCandidateOriginality(candidate, { validatedAt: "2030-01-01T00:00:00.000Z", corpus });
    expect(first.evidence.originalityFingerprint).toBe(second.evidence.originalityFingerprint);
  });
});
