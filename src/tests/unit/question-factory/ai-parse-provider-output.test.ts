import { describe, expect, it } from "vitest";

import { parseGeneratedCandidates, parseReviewVerdict } from "@/features/question-factory/ai/parse-provider-output";

function validReviewResponse(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    reviewId: "review-ai-001",
    candidateId: "man-abc123",
    candidateRevision: 0,
    candidateContentHash: "hash-content",
    blueprintHash: "hash-blueprint",
    reviewerModel: "claude-sonnet-5",
    reviewerVersion: "1",
    result: "passed",
    confidence: 0.9,
    findings: ["Checked the arithmetic."],
    evidenceReferences: ["12 + 7 = 19"],
    ambiguityStatus: "none",
    reviewedAt: "2026-07-22T00:00:00.000Z",
    reviewPromptVersion: "1",
    reviewPromptHash: "hash-prompt",
    ...overrides,
  };
}

describe("parseGeneratedCandidates", () => {
  it("parses a well-formed JSON array of candidate objects", () => {
    const outcome = parseGeneratedCandidates(JSON.stringify([{ type: "multiple_choice", prompt: "What is 1+1?" }]));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.candidates).toHaveLength(1);
      expect(outcome.candidates[0]).toMatchObject({ type: "multiple_choice" });
    }
  });

  it("parses a well-formed single JSON candidate object", () => {
    const outcome = parseGeneratedCandidates(JSON.stringify({ type: "multiple_choice", prompt: "What is 1+1?" }));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.candidates).toHaveLength(1);
  });

  it("strips a defensive ```json code fence the model was told not to add", () => {
    const fenced = "```json\n" + JSON.stringify([{ type: "multiple_choice" }]) + "\n```";
    const outcome = parseGeneratedCandidates(fenced);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.candidates).toHaveLength(1);
  });

  it("fails cleanly on non-JSON provider output", () => {
    const outcome = parseGeneratedCandidates("Sure, here are your questions: ...");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issueCode).toBe("malformed_provider_response");
      expect(outcome.message).toMatch(/not valid JSON/);
    }
  });

  it("fails cleanly on an unsupported top-level shape (e.g. a bare string)", () => {
    const outcome = parseGeneratedCandidates(JSON.stringify("just a string"));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("malformed_provider_response");
  });

  it("fails cleanly on an array containing a non-object element", () => {
    const outcome = parseGeneratedCandidates(JSON.stringify([{ type: "multiple_choice" }, "oops"]));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("malformed_provider_response");
  });
});

describe("parseReviewVerdict", () => {
  it("parses and schema-validates a well-formed review response", () => {
    const outcome = parseReviewVerdict(JSON.stringify(validReviewResponse()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.review.result).toBe("passed");
      expect(outcome.review.candidateId).toBe("man-abc123");
    }
  });

  it("strips a defensive code fence before parsing", () => {
    const fenced = "```json\n" + JSON.stringify(validReviewResponse()) + "\n```";
    const outcome = parseReviewVerdict(fenced);
    expect(outcome.ok).toBe(true);
  });

  it("fails cleanly on non-JSON provider output", () => {
    const outcome = parseReviewVerdict("I reviewed it and it looks good.");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issueCode).toBe("malformed_provider_response");
      expect(outcome.message).toMatch(/not valid JSON/);
    }
  });

  it("fails cleanly when a required field is missing", () => {
    const withoutConfidence = validReviewResponse();
    delete withoutConfidence.confidence;
    const outcome = parseReviewVerdict(JSON.stringify(withoutConfidence));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("malformed_provider_response");
  });

  it("fails cleanly when result is not one of the closed set", () => {
    const outcome = parseReviewVerdict(JSON.stringify(validReviewResponse({ result: "maybe" })));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("malformed_provider_response");
  });

  it("fails cleanly when confidence is out of the 0-1 range", () => {
    const outcome = parseReviewVerdict(JSON.stringify(validReviewResponse({ confidence: 1.5 })));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("malformed_provider_response");
  });
});
