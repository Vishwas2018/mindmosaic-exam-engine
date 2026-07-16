import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { orchestrateCorrectnessVerification } from "@/features/question-factory/correctness";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import { runPipeline } from "@/features/question-factory/pipeline";
import { appendReviewRecord, hashJson } from "@/features/question-factory/provenance";
import { ingestExternalReview } from "@/features/question-factory/review";
import { ingestRevision, type ReviseIngestionInput } from "@/features/question-factory/revision";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

/**
 * Mission 3C full production-path integration: every scenario begins from
 * a real `runManualIngestion` call, never a direct `repository.create`
 * seed at an intermediate lifecycle state — with one documented, narrow
 * exception (below) that mirrors an established precedent in this exact
 * codebase for exactly this class of situation.
 *
 * **The `needs_revision` seeding exception.** No gate currently
 * implemented (structural, correctness, semantic) ever constructs
 * `severity: "soft_fail"` — the only severity `decideGateFailureOutcome`
 * routes to `needs_revision` — so no real production call site can reach
 * `needs_revision` today (a pre-existing gap in the three already-audited
 * gates, not something Mission 3C's scope — revision workflow + pipeline
 * runner — is responsible for closing). This mirrors
 * `mission3b-integration.test.ts`'s own precedent: *"prior to \[Mission
 * 3B's P1-1\] fix, Mission 2C's correctness gate quarantined every
 * semantic_objective/manual_review_writing candidate immediately, so
 * those classifications could never legitimately reach
 * correctness_check_passed and this file had to directly seed that state
 * to test anything past it."* The parent candidate below is created via
 * real ingestion; only its final `needs_revision` transition is a
 * minimal, single, documented `repository.update` step — everything
 * after it (the actual subject of this test: `ingestRevision` and the
 * full pipeline rerun via `runPipeline`) is driven entirely through real
 * production entry points.
 */
vi.setConfig({ testTimeout: 30_000 });

let repoRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "mission3c-integration-repo-"));
  inboxRoot = await mkdtemp(path.join(tmpdir(), "mission3c-integration-inbox-"));
  repo = new FsFactoryRepository(repoRoot);
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  await rm(inboxRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function lockOptions(): { readonly lockRoot: string; readonly lockMaxWaitMs: number; readonly lockRetryDelayMs: number } {
  return { lockRoot: repoRoot, lockMaxWaitMs: 200, lockRetryDelayMs: 10 };
}

function numeracyBlueprint(id: string, batchId: string): BlueprintInput {
  return {
    id,
    batchId,
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

function readingBlueprint(id: string, batchId: string): BlueprintInput {
  return {
    id,
    batchId,
    yearLevel: "year-5",
    examStyle: "naplan_style",
    subject: "reading",
    strand: "Comprehension",
    skill: "lit.reading.inference",
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

function computableCandidate(prompt = "What is 23 + 19?", value = 42): Record<string, unknown> {
  return {
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt,
    options: [],
    visuals: [],
    answerKey: { kind: "number", value, tolerance: 0 },
    explanation: `${prompt} = ${value}.`,
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 45 },
  };
}

function invalidStructuralCandidate(): Record<string, unknown> {
  return { ...computableCandidate(), type: "not_a_real_question_type" };
}

function underivableCandidate(): Record<string, unknown> {
  return {
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "Sam has some apples and gives some away. How many does Sam have left?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 3, tolerance: 0 },
    explanation: "Sam has 3 apples left.",
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 45 },
  };
}

function semanticObjectiveCandidate(): Record<string, unknown> {
  return {
    type: "short_answer",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt: "What is the main idea of the passage?",
    stimulus: { body: "A short synthetic passage about two friends who help each other after school." },
    options: [],
    visuals: [],
    answerKey: { kind: "text", acceptableAnswers: ["friendship"] },
    explanation: "The passage centres on friendship.",
    metadata: { subject: "reading", strand: "Comprehension", skill: "lit.reading.inference", difficulty: "medium", marks: 2, estimatedTimeSeconds: 90 },
  };
}

interface IngestedCandidate {
  readonly candidateId: string;
  readonly contentHash: string;
  readonly blueprintHash: string;
  readonly blueprintId: string;
}

/** Runs the real `questions:ingest` behaviour for one candidate file and returns its minted identity — never a direct `repository.create` seed. */
async function ingestCandidate(blueprint: BlueprintInput, candidate: Record<string, unknown>, fileName: string): Promise<IngestedCandidate> {
  const parsedBlueprint = blueprintSchema.parse(blueprint);
  await repo.create("blueprints", parsedBlueprint.id, parsedBlueprint);
  await writeFile(path.join(inboxRoot, fileName), JSON.stringify(candidate), "utf8");

  const ingestOutcome = await runManualIngestion(
    {
      source: "qwen",
      batchId: parsedBlueprint.batchId,
      promptVersion: "v1",
      blueprintId: parsedBlueprint.id,
      pipelineRunId: `${parsedBlueprint.batchId}-ingest-manual`,
      inboxRoot,
    },
    repo,
  );
  if (ingestOutcome.status !== "completed") throw new Error(`Ingestion did not complete: ${JSON.stringify(ingestOutcome)}`);
  const fileResult = ingestOutcome.result.fileResults.find((result) => result.fileName === fileName);
  const accepted = fileResult?.candidateResults[0];
  if (accepted?.status !== "accepted") throw new Error(`Candidate was not accepted: ${JSON.stringify(accepted)}`);
  return {
    candidateId: accepted.candidate.candidateId,
    contentHash: accepted.candidate.provenance.contentHash,
    blueprintHash: hashJson(parsedBlueprint),
    blueprintId: parsedBlueprint.id,
  };
}

describe("Mission 3C full chain — revision cycle after a real ingestion", () => {
  it("a real-ingested candidate moved to needs_revision (the one documented exception, see class doc) is revised via ingestRevision and the corrected successor passes the full real pipeline rerun", async () => {
    const parent = await ingestCandidate(
      numeracyBlueprint("bp-3c-revision-cycle", "batch-3c-revision-cycle"),
      computableCandidate("What is 12 + 8?", 999), // deliberately wrong answer — the flaw a reviewer would flag
      "candidate-to-revise.json",
    );

    // The one documented, narrow exception (class doc above): no real gate
    // can currently produce needs_revision, so this single state
    // transition is a minimal direct step — everything else in this test
    // is real.
    const parentRaw = (await repo.read("generated", parent.candidateId)) as Record<string, unknown>;
    const parentProvenance = parentRaw.provenance as Record<string, unknown>;
    const terminalReview = appendReviewRecord([], {
      candidateId: parent.candidateId,
      stage: "correctness_check_passed",
      reviewerIdentity: { provider: "anthropic", modelId: "claude-sonnet-5", modelFamily: "claude", interactionMode: "api" },
      reviewerVersion: "1.0.0",
      result: "failed",
      confidence: 0.9,
      findings: ["12 + 8 = 20, not 999 — the declared answer is arithmetically wrong."],
      recommendedCorrections: ["Correct the declared answer to 20."],
      evidenceReferences: ["arithmetic recomputation"],
      ambiguityStatus: "none",
      reviewedAt: "2026-07-16T00:00:00.000Z",
      reviewPromptVersion: "v1",
      reviewPromptHash: "review-prompt-hash-revision-cycle",
      evidenceBinding: {
        candidateContentHash: parent.contentHash,
        blueprintHash: parent.blueprintHash,
        candidateRevision: 0,
        reviewResultHash: "result-hash-revision-cycle",
      },
    });
    await repo.move(parent.candidateId, "generated", "review-queue");
    await repo.update("review-queue", parent.candidateId, {
      ...parentRaw,
      state: "needs_revision",
      provenance: { ...parentProvenance, reviewRecords: [terminalReview] },
    });

    const parentAtNeedsRevision = (await repo.read("review-queue", parent.candidateId)) as { readonly state: string };
    expect(parentAtNeedsRevision.state).toBe("needs_revision");

    // --- Everything from here on is real production entry points. -------
    const revisedContent = computableCandidate("What is 12 + 8?", 20); // the corrected answer
    const revisionInput: ReviseIngestionInput = {
      revisionRequestId: "rev-req-3c-cycle-1",
      parentCandidateId: parent.candidateId,
      parentContentHash: parent.contentHash,
      parentRevision: 0,
      parentBlueprintHash: parent.blueprintHash,
      revisedContent,
      authorModel: "claude",
      revisionNotes: ["Corrected 12 + 8 from 999 to 20."],
      requestedAt: "2026-07-16T01:00:00.000Z",
    };
    const revisionOutcome = await ingestRevision(revisionInput, repo);
    expect(revisionOutcome.status).toBe("accepted");
    if (revisionOutcome.status !== "accepted") return;
    expect(revisionOutcome.revision).toBe(1);

    const child = (await repo.read("generated", revisionOutcome.candidateId)) as {
      readonly state: string;
      readonly provenance: { readonly reviewRecords: readonly unknown[]; readonly revision: number; readonly parentCandidateId: string };
    };
    expect(child.state).toBe("generated");
    expect(child.provenance.reviewRecords).toEqual([]);
    expect(child.provenance.revision).toBe(1);
    expect(child.provenance.parentCandidateId).toBe(parent.candidateId);

    // Full real pipeline rerun via runPipeline — the same gate that would
    // have caught the original defect (correctness verification) now sees
    // the corrected content and passes it.
    const pipelineOutcome = await runPipeline(
      { pipelineRunId: "run-3c-revision-cycle", batchId: "batch-3c-revision-cycle", candidateIds: [revisionOutcome.candidateId] },
      repo,
      lockOptions(),
    );
    expect(pipelineOutcome.status).toBe("completed");
    if (pipelineOutcome.status !== "completed") return;
    const result = pipelineOutcome.report.candidateResults[0];
    expect(result?.endState).toBe("difficulty_review_passed");
    expect(result?.gateResults.every((g) => g.outcome === "passed")).toBe(true);

    // The parent's own record is permanently, unalterably preserved as the
    // historical "what was wrong and why" audit trail.
    const parentFinal = (await repo.read("review-queue", parent.candidateId)) as {
      readonly state: string;
      readonly provenance: { readonly reviewRecords: readonly unknown[]; readonly supersededBy?: { readonly candidateId: string } };
    };
    expect(parentFinal.state).toBe("needs_revision");
    expect(parentFinal.provenance.reviewRecords).toHaveLength(1);
    expect(parentFinal.provenance.supersededBy?.candidateId).toBe(revisionOutcome.candidateId);
  });
});

describe("Mission 3C full chain — one runPipeline call across a mixed five-candidate batch, all via real ingestion", () => {
  it("drives every candidate to its correct terminal or passing state, with a single explicit ordered candidate list", async () => {
    const passing = await ingestCandidate(numeracyBlueprint("bp-3c-batch-pass", "batch-3c-batch"), computableCandidate(), "pass.json");
    const structurallyInvalid = await ingestCandidate(
      numeracyBlueprint("bp-3c-batch-invalid", "batch-3c-batch"),
      invalidStructuralCandidate(),
      "invalid.json",
    );
    const undecidable = await ingestCandidate(numeracyBlueprint("bp-3c-batch-undecidable", "batch-3c-batch"), underivableCandidate(), "undecidable.json");
    const semanticNoReview = await ingestCandidate(
      readingBlueprint("bp-3c-batch-semantic-noreview", "batch-3c-batch"),
      semanticObjectiveCandidate(),
      "semantic-no-review.json",
    );
    const semanticReviewed = await ingestCandidate(
      readingBlueprint("bp-3c-batch-semantic-reviewed", "batch-3c-batch"),
      semanticObjectiveCandidate(),
      "semantic-reviewed.json",
    );

    // Pre-advance the "reviewed" candidate to correctness_check_passed and
    // append a real independent review — real gate calls, no seeding —
    // so the batch run below completes it via its semantic stage alone.
    await orchestrateStructuralValidation(semanticReviewed.candidateId, repo, { validatedAt: new Date().toISOString() });
    await orchestrateCorrectnessVerification(semanticReviewed.candidateId, repo, { verifiedAt: new Date().toISOString() });
    const reviewOutcome = await ingestExternalReview(
      {
        reviewId: "review-3c-batch-1",
        candidateId: semanticReviewed.candidateId,
        candidateRevision: 0,
        candidateContentHash: semanticReviewed.contentHash,
        blueprintHash: semanticReviewed.blueprintHash,
        reviewerModel: "chatgpt",
        reviewerVersion: "1.0.0",
        result: "passed",
        confidence: 0.9,
        findings: ["Main idea correctly identified as friendship."],
        evidenceReferences: ["passage closing paragraph"],
        ambiguityStatus: "none",
        reviewedAt: "2026-07-16T00:00:00.000Z",
        reviewPromptVersion: "v1",
        reviewPromptHash: "review-prompt-hash-3c-batch",
      },
      repo,
    );
    expect(reviewOutcome.status).toBe("accepted");

    const candidateIds = [
      passing.candidateId,
      structurallyInvalid.candidateId,
      undecidable.candidateId,
      semanticNoReview.candidateId,
      semanticReviewed.candidateId,
    ];
    const outcome = await runPipeline({ pipelineRunId: "run-3c-batch-1", batchId: "batch-3c-batch", candidateIds }, repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    expect(outcome.report.candidateResults.map((r) => r.candidateId)).toEqual(candidateIds);
    const byId = new Map(outcome.report.candidateResults.map((r) => [r.candidateId, r]));

    expect(byId.get(passing.candidateId)?.endState).toBe("difficulty_review_passed");
    expect(byId.get(structurallyInvalid.candidateId)?.endState).toBe("rejected");
    expect(byId.get(undecidable.candidateId)?.endState).toBe("quarantined");
    expect(byId.get(semanticNoReview.candidateId)?.endState).toBe("quarantined");
    // Already advanced to semantic_review_passed by its own real
    // ingestExternalReview call before the batch run (that call attempts
    // the transition immediately on a durable, sufficient review). Since
    // Mission 3D, semantic_review_passed is no longer a terminal state —
    // the originality stage accepts it — so the batch run genuinely
    // resumes this candidate at the originality stage rather than
    // reporting it as already-done; its short, simple-vocabulary text
    // then genuinely deviates from its blueprint's declared "medium"
    // difficulty at the difficulty stage (the same real, deterministic
    // finding as `semanticObjectiveCandidate()`'s other uses in this
    // suite), so it stops at needs_revision.
    expect(byId.get(semanticReviewed.candidateId)?.resultKind).toBe("advanced");
    expect(byId.get(semanticReviewed.candidateId)?.endState).toBe("needs_revision");

    // Every candidate reached its correct physical compartment.
    for (const id of [passing.candidateId, semanticReviewed.candidateId]) {
      expect(await repo.exists("review-queue", id)).toBe(true);
    }
    expect(await repo.exists("rejected/structural", structurallyInvalid.candidateId)).toBe(true);
    expect(await repo.exists("quarantined", undecidable.candidateId)).toBe(true);
    expect(await repo.exists("quarantined", semanticNoReview.candidateId)).toBe(true);
  });
});
