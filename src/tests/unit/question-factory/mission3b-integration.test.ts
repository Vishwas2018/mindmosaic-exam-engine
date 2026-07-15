import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { orchestrateCorrectnessVerification } from "@/features/question-factory/correctness";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import { hashJson } from "@/features/question-factory/provenance";
import { attemptSemanticReviewTransition, ingestExternalReview } from "@/features/question-factory/review";
import type { FactoryRepository } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

/**
 * End-to-end proof of the Mission 3B chain: manual ingestion -> structural
 * validation -> correctness verification -> external independent semantic
 * review -> `semantic_review_passed`. Uses `number_entry` (a
 * `deterministically_computable`-classified type), because — per a
 * discovered cross-mission finding recorded in the Mission 3B final
 * report — Mission 2C's already-approved correctness gate quarantines
 * every `semantic_objective`/`manual_review_writing`-classified candidate
 * immediately (`review_required` -> severity `"uncertain"` ->
 * unconditionally `quarantined`), so no such candidate can currently
 * reach `correctness_check_passed` through the real gate chain. The
 * independent-review path for those two classifications is proven
 * separately in `review-ingest.test.ts` against a directly-seeded
 * `correctness_check_passed` fixture, which is the only way to exercise
 * it given that upstream gap.
 */
vi.setConfig({ testTimeout: 30_000 });

let repoRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "mission3b-integration-repo-"));
  inboxRoot = await mkdtemp(path.join(tmpdir(), "mission3b-integration-inbox-"));
  repo = new FsFactoryRepository(repoRoot);
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  await rm(inboxRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function testBlueprint(): BlueprintInput {
  return {
    id: "batch-3b-bp-001",
    batchId: "batch-3b",
    yearLevel: "year-3",
    examStyle: "naplan_style",
    subject: "numeracy",
    strand: "Number",
    skill: "num.addition.two-digit",
    difficulty: "easy",
    questionType: "number_entry",
    targetCount: 1,
    marks: 1,
    estimatedTimeSeconds: 45,
    learningObjective: "Add two whole numbers.",
    misconceptionTargets: [],
    reasoningSteps: 1,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
  };
}

describe("Mission 3B full chain — ingest to semantic_review_passed (deterministically_computable auto-clear)", () => {
  it("carries a manual_external candidate from ingestion through structural, correctness, and semantic review", async () => {
    const blueprint = blueprintSchema.parse(testBlueprint());
    await repo.create("blueprints", blueprint.id, blueprint);

    const externalCandidate = {
      type: "number_entry",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: "What is 23 + 19?",
      options: [],
      visuals: [],
      answerKey: { kind: "number", value: 42, tolerance: 0 },
      explanation: "23 + 19 = 42.",
      metadata: {
        subject: "numeracy",
        strand: "Number",
        skill: "num.addition.two-digit",
        difficulty: "easy",
        marks: 1,
        estimatedTimeSeconds: 45,
      },
    };
    await writeFile(path.join(inboxRoot, "external-candidate.json"), JSON.stringify(externalCandidate), "utf8");

    const ingestOutcome = await runManualIngestion(
      {
        source: "claude",
        batchId: blueprint.batchId,
        promptVersion: "v1",
        blueprintId: blueprint.id,
        pipelineRunId: `${blueprint.batchId}-ingest-manual`,
        inboxRoot,
      },
      repo,
    );
    expect(ingestOutcome.status).toBe("completed");
    if (ingestOutcome.status !== "completed") return;
    const accepted = ingestOutcome.result.fileResults[0].candidateResults[0];
    expect(accepted.status).toBe("accepted");
    if (accepted.status !== "accepted") return;
    const candidateId = accepted.candidate.candidateId;

    const structuralOutcome = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: new Date().toISOString(),
    });
    expect(structuralOutcome.outcome).toBe("passed");

    const correctnessOutcome = await orchestrateCorrectnessVerification(candidateId, repo, {
      verifiedAt: new Date().toISOString(),
    });
    expect(correctnessOutcome.outcome).toBe("passed");

    // Semantic gate: deterministically_computable auto-clears without any
    // independent review needing to be ingested.
    const semanticOutcome = await attemptSemanticReviewTransition(candidateId, repo);
    expect(semanticOutcome.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", candidateId)) as { readonly state: string };
    expect(stored.state).toBe("semantic_review_passed");
  });
});

describe("Mission 3B full chain — external review-ingestion drives the semantic gate for a directly-seeded semantic_objective candidate", () => {
  it("reaches semantic_review_passed only via a genuinely independent, chain-verified review", async () => {
    const blueprint = blueprintSchema.parse({
      id: "batch-3b-bp-002",
      batchId: "batch-3b-semantic",
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
    } satisfies BlueprintInput);
    await repo.create("blueprints", blueprint.id, blueprint);

    const question = {
      id: "candidate-semantic-e2e",
      type: "short_answer",
      yearLevel: 5,
      examStyle: "naplan_style",
      prompt: "What is the main idea of the passage?",
      options: [],
      visuals: [],
      answerKey: { kind: "text", acceptableAnswers: ["friendship"] },
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
    };
    const contentHash = hashJson(question);

    // Directly seeded at `correctness_check_passed` — see this file's top
    // doc comment for why a real end-to-end correctness-gate run cannot
    // currently produce a semantic_objective candidate at this state.
    await repo.create("review-queue", "candidate-semantic-e2e", {
      candidateId: "candidate-semantic-e2e",
      state: "correctness_check_passed",
      question,
      provenance: {
        candidateId: "candidate-semantic-e2e",
        blueprintId: blueprint.id,
        batchId: blueprint.batchId,
        pipelineRunId: `${blueprint.batchId}-pipeline`,
        revision: 0,
        generatedAt: "2026-07-01T00:00:00.000Z",
        generatorAdapter: { class: "manual_external", identity: { provider: "qwen", modelId: "qwen-max", modelFamily: "qwen", interactionMode: "external_manual" } },
        generatorVersion: "1",
        promptVersion: "v1",
        schemaVersion: "1",
        taxonomyVersion: "1",
        contentHash,
        reviewRecords: [],
      },
    });

    // Before any review: the gate must refuse to pass and must never
    // guess — routed to quarantined, not needs_revision.
    const beforeReview = await attemptSemanticReviewTransition("candidate-semantic-e2e", repo);
    expect(beforeReview.outcome).toBe("quarantined");

    // Re-seed (the candidate above was moved to quarantined) to exercise
    // the real acceptance path from a fresh correctness_check_passed state.
    await repo.remove("quarantined", "candidate-semantic-e2e");
    await repo.create("review-queue", "candidate-semantic-e2e", {
      candidateId: "candidate-semantic-e2e",
      state: "correctness_check_passed",
      question,
      provenance: {
        candidateId: "candidate-semantic-e2e",
        blueprintId: blueprint.id,
        batchId: blueprint.batchId,
        pipelineRunId: `${blueprint.batchId}-pipeline`,
        revision: 0,
        generatedAt: "2026-07-01T00:00:00.000Z",
        generatorAdapter: { class: "manual_external", identity: { provider: "qwen", modelId: "qwen-max", modelFamily: "qwen", interactionMode: "external_manual" } },
        generatorVersion: "1",
        promptVersion: "v1",
        schemaVersion: "1",
        taxonomyVersion: "1",
        contentHash,
        reviewRecords: [],
      },
    });

    const reviewOutcome = await ingestExternalReview(
      {
        reviewId: "review-e2e-1",
        candidateId: "candidate-semantic-e2e",
        candidateRevision: 0,
        candidateContentHash: contentHash,
        blueprintHash: hashJson(blueprint),
        reviewerModel: "claude",
        reviewerVersion: "1.0.0",
        result: "passed",
        confidence: 0.95,
        findings: ["Main idea correctly identified as friendship."],
        evidenceReferences: ["passage closing paragraph"],
        ambiguityStatus: "none",
        reviewedAt: "2026-07-15T00:00:00.000Z",
        reviewPromptVersion: "v1",
        reviewPromptHash: "review-prompt-hash-e2e",
      },
      repo as unknown as FactoryRepository,
    );

    expect(reviewOutcome.status).toBe("accepted");
    if (reviewOutcome.status !== "accepted") return;
    expect(reviewOutcome.gateOutcome.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", "candidate-semantic-e2e")) as { readonly state: string };
    expect(stored.state).toBe("semantic_review_passed");
  });
});
