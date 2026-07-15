import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Blueprint } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { hashJson } from "@/features/question-factory/provenance";
import {
  attemptSemanticReviewTransition,
  ingestExternalReview,
  parseReviewResponseText,
  type ReviewIngestionInput,
} from "@/features/question-factory/review";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import type { Question } from "@/schemas/question.schema";

let repoRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "review-ingest-test-"));
  repo = new FsFactoryRepository(repoRoot);
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function blueprint(): Blueprint {
  return {
    id: "bp-review",
    batchId: "batch-review",
    yearLevel: "year-5",
    examStyle: "naplan_style",
    subject: "reading",
    strand: "Reading",
    skill: "reading.inference.basic",
    difficulty: "medium",
    questionType: "short_answer",
    targetCount: 1,
    marks: 2,
    estimatedTimeSeconds: 90,
    learningObjective: "Answer a short inferential question.",
    misconceptionTargets: [],
    reasoningSteps: 2,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
  };
}

function semanticObjectiveQuestion(): Question {
  return {
    id: "candidate-under-review",
    type: "short_answer",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "draft",
    origin: "original_seed",
    prompt: "What is the main idea of the passage?",
    options: [],
    visuals: [],
    answerKey: { kind: "text", acceptableAnswers: ["friendship"], caseSensitive: false, trimWhitespace: true },
    explanation: "The passage centres on friendship.",
    metadata: {
      subject: "reading",
      strand: "Reading",
      topic: "Inference",
      difficulty: "medium",
      marks: 2,
      estimatedTimeSeconds: 90,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
  } as Question;
}

interface SeedCandidateOptions {
  readonly candidateId: string;
  readonly generatorModel: string;
  readonly question?: Question;
  readonly revision?: number;
}

async function seedCandidateAtCorrectnessPassed(
  options: SeedCandidateOptions,
): Promise<{ readonly contentHash: string; readonly blueprintHash: string }> {
  const bp = blueprint();
  await repo.create("blueprints", bp.id, bp);
  const blueprintHash = hashJson(bp);
  const question = options.question ?? semanticObjectiveQuestion();
  const contentHash = hashJson(question);

  await repo.create("review-queue", options.candidateId, {
    candidateId: options.candidateId,
    state: "correctness_check_passed",
    question,
    provenance: {
      candidateId: options.candidateId,
      blueprintId: bp.id,
      batchId: bp.batchId,
      pipelineRunId: `${bp.batchId}-pipeline`,
      revision: options.revision ?? 0,
      generatedAt: "2026-07-01T00:00:00.000Z",
      generatorAdapter: { class: "manual_external", identity: normaliseModel(options.generatorModel) },
      generatorVersion: "1",
      promptVersion: "v1",
      schemaVersion: "1",
      taxonomyVersion: "1",
      contentHash,
      reviewRecords: [],
    },
  });

  return { contentHash, blueprintHash };
}

function normaliseModel(model: string) {
  return normaliseIdentityOrThrow(model);
}

function baseReviewInput(overrides: Partial<ReviewIngestionInput> = {}): ReviewIngestionInput {
  return {
    reviewId: "review-001",
    candidateId: "candidate-under-review",
    candidateRevision: 0,
    candidateContentHash: "placeholder",
    blueprintHash: "placeholder",
    reviewerModel: "claude",
    reviewerVersion: "1.0.0",
    result: "passed",
    confidence: 0.9,
    findings: ["Main idea correctly identified."],
    evidenceReferences: ["passage paragraph 2"],
    ambiguityStatus: "none",
    reviewedAt: "2026-07-15T00:00:00.000Z",
    reviewPromptVersion: "v1",
    reviewPromptHash: "review-prompt-hash",
    ...overrides,
  };
}

describe("ingestExternalReview — reviewer independence matrix", () => {
  it("qwen-generated -> claude-reviewed passes", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c1", generatorModel: "qwen" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c1", candidateContentHash: contentHash, blueprintHash, reviewerModel: "claude" }),
      repo,
    );
    expect(outcome.status).toBe("accepted");
    if (outcome.status !== "accepted") return;
    expect(outcome.gateOutcome.outcome).toBe("passed");
  });

  it("claude-generated -> qwen-reviewed passes", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c2", generatorModel: "claude" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c2", candidateContentHash: contentHash, blueprintHash, reviewerModel: "qwen" }),
      repo,
    );
    expect(outcome.status).toBe("accepted");
    if (outcome.status !== "accepted") return;
    expect(outcome.gateOutcome.outcome).toBe("passed");
  });

  it("claude-generated -> chatgpt-reviewed passes", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c3", generatorModel: "claude" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c3", candidateContentHash: contentHash, blueprintHash, reviewerModel: "chatgpt" }),
      repo,
    );
    expect(outcome.status).toBe("accepted");
    if (outcome.status !== "accepted") return;
    expect(outcome.gateOutcome.outcome).toBe("passed");
  });

  it("rejects same normalised identity self-review (exact declared string match)", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c4", generatorModel: "claude" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c4", candidateContentHash: contentHash, blueprintHash, reviewerModel: "claude" }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("self_review_rejected");
  });

  it("rejects an alias-equivalent self-review (different declared name, same normalised identity)", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c5", generatorModel: "claude-sonnet-5" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c5", candidateContentHash: contentHash, blueprintHash, reviewerModel: "claude sonnet 5" }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("self_review_rejected");
  });

  it("treats a different modelId within the same family/provider as independent (not self-review)", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c6", generatorModel: "claude-opus-4-8" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c6", candidateContentHash: contentHash, blueprintHash, reviewerModel: "claude-sonnet-5" }),
      repo,
    );
    expect(outcome.status).toBe("accepted");
  });

  it("rejects an unsupported reviewer identity", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c7", generatorModel: "claude" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c7", candidateContentHash: contentHash, blueprintHash, reviewerModel: "some-new-model-xyz" }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("unsupported_reviewer_identity");
  });
});

describe("ingestExternalReview — review integrity", () => {
  it("rejects an unknown candidateId", async () => {
    const outcome = await ingestExternalReview(baseReviewInput({ candidateId: "does-not-exist" }), repo);
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("unknown_candidate");
  });

  it("rejects a stale candidateRevision", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c8", generatorModel: "qwen" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c8", candidateContentHash: contentHash, blueprintHash, candidateRevision: 7 }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("stale_review_revision");
  });

  it("rejects a wrong candidateContentHash", async () => {
    const { blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c9", generatorModel: "qwen" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c9", candidateContentHash: "wrong-hash", blueprintHash }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("content_hash_mismatch");
  });

  it("rejects a wrong blueprintHash", async () => {
    const { contentHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c10", generatorModel: "qwen" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c10", candidateContentHash: contentHash, blueprintHash: "wrong-blueprint-hash" }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("blueprint_hash_mismatch");
  });

  it("downgrades a 'passed' result with zero evidence references to 'warning' and does not advance the lifecycle from this record alone", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c11", generatorModel: "qwen" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c11", candidateContentHash: contentHash, blueprintHash, evidenceReferences: [] }),
      repo,
    );
    expect(outcome.status).toBe("accepted");
    if (outcome.status !== "accepted") return;
    expect(outcome.insufficientEvidenceDowngraded).toBe(true);
    expect(outcome.gateOutcome.outcome).toBe("quarantined");
  });

  it("records a low-confidence review but does not advance the lifecycle", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c12", generatorModel: "qwen" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c12", candidateContentHash: contentHash, blueprintHash, confidence: 0.3 }),
      repo,
    );
    expect(outcome.status).toBe("accepted");
    if (outcome.status !== "accepted") return;
    expect(outcome.gateOutcome.outcome).toBe("quarantined");
  });

  it("records an unresolved-ambiguity review but does not advance the lifecycle", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c13", generatorModel: "qwen" });
    const outcome = await ingestExternalReview(
      baseReviewInput({ candidateId: "c13", candidateContentHash: contentHash, blueprintHash, ambiguityStatus: "unresolved" }),
      repo,
    );
    expect(outcome.status).toBe("accepted");
    if (outcome.status !== "accepted") return;
    expect(outcome.gateOutcome.outcome).toBe("quarantined");
  });

  it("is idempotent: resubmitting the identical review under the same reviewId replays without a second chain entry", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c14", generatorModel: "qwen" });
    const input = baseReviewInput({ candidateId: "c14", candidateContentHash: contentHash, blueprintHash });
    const first = await ingestExternalReview(input, repo);
    expect(first.status).toBe("accepted");
    if (first.status !== "accepted") return;
    expect(first.replayed).toBe(false);

    const second = await ingestExternalReview(input, repo);
    expect(second.status).toBe("accepted");
    if (second.status !== "accepted") return;
    expect(second.replayed).toBe(true);

    const stored = (await repo.read("review-queue", "c14")) as { readonly provenance: { readonly reviewRecords: readonly unknown[] } };
    expect(stored.provenance.reviewRecords.length).toBe(1);
  });

  it("refuses a changed review under a reused reviewId (review_id_conflict), never silently overwriting", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c15", generatorModel: "qwen" });
    const input = baseReviewInput({ candidateId: "c15", candidateContentHash: contentHash, blueprintHash });
    const first = await ingestExternalReview(input, repo);
    expect(first.status).toBe("accepted");

    const changed = await ingestExternalReview({ ...input, confidence: 0.99, findings: ["A different finding."] }, repo);
    expect(changed.status).toBe("rejected");
    if (changed.status !== "rejected") return;
    expect(changed.issueCode).toBe("review_id_conflict");

    const stored = (await repo.read("review-queue", "c15")) as { readonly provenance: { readonly reviewRecords: readonly unknown[] } };
    expect(stored.provenance.reviewRecords.length).toBe(1);
  });

  it("rejects a malformed (unparseable) review response before any repository interaction", () => {
    const parsed = parseReviewResponseText("{ not valid json");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issueCode).toBe("malformed_review_response");
  });

  it("rejects a review response missing required identity fields at the schema layer", async () => {
    const { contentHash, blueprintHash } = await seedCandidateAtCorrectnessPassed({ candidateId: "c16", generatorModel: "qwen" });
    const malformed = { ...baseReviewInput({ candidateId: "c16", candidateContentHash: contentHash, blueprintHash }) } as Record<string, unknown>;
    delete malformed.reviewerModel;
    const outcome = await ingestExternalReview(malformed, repo);
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("malformed_review_response");
  });
});

describe("attemptSemanticReviewTransition — deterministically_computable auto-clear", () => {
  it("advances a deterministically_computable candidate to semantic_review_passed with zero reviews", async () => {
    const numericQuestion: Question = {
      id: "candidate-numeric",
      type: "number_entry",
      yearLevel: 5,
      examStyle: "naplan_style",
      status: "draft",
      origin: "original_seed",
      prompt: "What is 4 + 5?",
      options: [],
      visuals: [],
      answerKey: { kind: "number", value: 9, tolerance: 0 },
      explanation: "4 + 5 = 9.",
      metadata: {
        subject: "numeracy",
        strand: "Number",
        topic: "Addition",
        difficulty: "easy",
        marks: 1,
        estimatedTimeSeconds: 45,
        tags: [],
        locale: "en-AU",
        source: "original",
        schemaVersion: 1,
      },
    } as Question;
    await seedCandidateAtCorrectnessPassed({ candidateId: "c-det", generatorModel: "qwen", question: numericQuestion });

    const outcome = await attemptSemanticReviewTransition("c-det", repo);
    expect(outcome.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", "c-det")) as { readonly state: string };
    expect(stored.state).toBe("semantic_review_passed");
  });

  it("routes a semantic_objective candidate with no review at all to quarantined, never needs_revision", async () => {
    await seedCandidateAtCorrectnessPassed({ candidateId: "c-no-review", generatorModel: "qwen" });
    const outcome = await attemptSemanticReviewTransition("c-no-review", repo);
    expect(outcome.outcome).toBe("quarantined");
    expect(await repo.exists("quarantined", "c-no-review")).toBe(true);
    expect(await repo.exists("review-queue", "c-no-review")).toBe(false);
  });

  it("is idempotent: replaying against an already-passed candidate reports replayed:true without re-mutating", async () => {
    const numericQuestion: Question = {
      id: "candidate-numeric-2",
      type: "true_false",
      yearLevel: 5,
      examStyle: "naplan_style",
      status: "draft",
      origin: "original_seed",
      prompt: "Is 4 + 5 = 9?",
      options: [],
      visuals: [],
      answerKey: { kind: "boolean", value: true },
      explanation: "4 + 5 = 9, so the statement is true.",
      metadata: {
        subject: "numeracy",
        strand: "Number",
        topic: "Addition",
        difficulty: "easy",
        marks: 1,
        estimatedTimeSeconds: 45,
        tags: [],
        locale: "en-AU",
        source: "original",
        schemaVersion: 1,
      },
    } as Question;
    await seedCandidateAtCorrectnessPassed({ candidateId: "c-replay", generatorModel: "qwen", question: numericQuestion });

    const first = await attemptSemanticReviewTransition("c-replay", repo);
    expect(first.outcome).toBe("passed");
    if (first.outcome === "passed") expect(first.replayed).toBe(false);

    const second = await attemptSemanticReviewTransition("c-replay", repo);
    expect(second.outcome).toBe("passed");
    if (second.outcome === "passed") expect(second.replayed).toBe(true);
  });
});
