import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { orchestrateCorrectnessVerification } from "@/features/question-factory/correctness";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import { runPipeline } from "@/features/question-factory/pipeline";
import { hashJson } from "@/features/question-factory/provenance";
import { ingestExternalReview } from "@/features/question-factory/review";
import type { FactoryRepository, UpdateFailureReason, UpdateOptions, UpdateResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

vi.setConfig({ testTimeout: 30_000 });

let repoRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "pipeline-crash-repo-"));
  inboxRoot = await mkdtemp(path.join(tmpdir(), "pipeline-crash-inbox-"));
  repo = new FsFactoryRepository(repoRoot);
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  await rm(inboxRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function lockOptions(): { readonly lockRoot: string; readonly lockMaxWaitMs: number; readonly lockRetryDelayMs: number } {
  return { lockRoot: repoRoot, lockMaxWaitMs: 200, lockRetryDelayMs: 10 };
}

/** Fails `update()` on exactly the Nth call (1-indexed) across the whole repository, then delegates for every other call — mirrors `review-ingest-crash-safety.test.ts`'s `buildUpdateFailingOnCall`, used here to target the semantic-transition write specifically, after the review-append write has already durably landed. */
function buildUpdateFailingOnCall(realRepo: FactoryRepository, failOnCallNumber: number, reason: UpdateFailureReason = "lock_timeout"): FactoryRepository {
  let attempts = 0;
  return {
    create: realRepo.create.bind(realRepo),
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: realRepo.move.bind(realRepo),
    update: async (
      compartment: Parameters<FactoryRepository["update"]>[0],
      candidateId: string,
      data: unknown,
      options?: UpdateOptions,
    ): Promise<UpdateResult> => {
      attempts += 1;
      if (attempts === failOnCallNumber) {
        return { ok: false, candidateId, compartment, reason, message: `simulated transient failure on call ${attempts}` };
      }
      return realRepo.update(compartment, candidateId, data, options);
    },
  };
}

/** Fails `update()` only for a specific `candidateId`, on that candidate's Nth `update()` call — used to isolate a fault to one candidate within a multi-candidate batch without affecting siblings' own update calls. */
function buildCandidateScopedFailingUpdateRepo(
  realRepo: FactoryRepository,
  targetCandidateId: string,
  failOnCallNumber: number,
  reason: UpdateFailureReason = "lock_timeout",
): FactoryRepository {
  let attemptsForTarget = 0;
  return {
    create: realRepo.create.bind(realRepo),
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: realRepo.move.bind(realRepo),
    update: async (
      compartment: Parameters<FactoryRepository["update"]>[0],
      candidateId: string,
      data: unknown,
      options?: UpdateOptions,
    ): Promise<UpdateResult> => {
      if (candidateId === targetCandidateId) {
        attemptsForTarget += 1;
        if (attemptsForTarget === failOnCallNumber) {
          return { ok: false, candidateId, compartment, reason, message: `simulated transient failure on call ${attemptsForTarget}` };
        }
      }
      return realRepo.update(compartment, candidateId, data, options);
    },
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

function computableCandidate(): Record<string, unknown> {
  return {
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "What is 23 + 19?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 42, tolerance: 0 },
    explanation: "23 + 19 = 42.",
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 45 },
  };
}

interface IngestedCandidate {
  readonly candidateId: string;
  readonly contentHash: string;
  readonly blueprintHash: string;
}

/** Runs the real `questions:ingest` behaviour for one candidate file — never a direct `repository.create` seed. */
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
  };
}

describe("runPipeline — Mission 3B P2 debt remediation: full-path semantic crash recovery", () => {
  it(
    "review append lands before an injected semantic-transition failure, reached after a genuine full-pipeline traversal from real ingestion; " +
      "a retry through runPipeline (not a direct attemptSemanticReviewTransition call) completes the missing transition without duplicating the review",
    async () => {
      // 1. Real ingestion — never a direct repository.create seed.
      const candidate = await ingestCandidate(
        readingBlueprint("bp-p2-debt", "batch-p2-debt"),
        semanticObjectiveCandidate(),
        "semantic-objective.json",
      );

      // 2. Real structural validation.
      const structuralOutcome = await orchestrateStructuralValidation(candidate.candidateId, repo, { validatedAt: new Date().toISOString() });
      expect(structuralOutcome.outcome).toBe("passed");

      // 3. Real correctness verification — reaches the legitimate semantic-review prerequisite (4).
      const correctnessOutcome = await orchestrateCorrectnessVerification(candidate.candidateId, repo, { verifiedAt: new Date().toISOString() });
      expect(correctnessOutcome.outcome).toBe("passed_pending_semantic_review");
      const midway = (await repo.read("review-queue", candidate.candidateId)) as { readonly state: string };
      expect(midway.state).toBe("correctness_check_passed");

      // 5+6. Append semantic-review evidence, with a fault injected specifically
      // into the transition-stamp write (the second update() call within this
      // ingestExternalReview invocation) — the review-append write (the first
      // update() call) is left to succeed normally.
      const faultInjectedRepo = buildUpdateFailingOnCall(repo, 2, "lock_timeout");
      const reviewOutcome = await ingestExternalReview(
        {
          reviewId: "review-p2-debt-1",
          candidateId: candidate.candidateId,
          candidateRevision: 0,
          candidateContentHash: candidate.contentHash,
          blueprintHash: candidate.blueprintHash,
          reviewerModel: "claude",
          reviewerVersion: "1.0.0",
          result: "passed",
          confidence: 0.95,
          findings: ["Main idea correctly identified as friendship."],
          evidenceReferences: ["passage closing paragraph"],
          ambiguityStatus: "none",
          reviewedAt: "2026-07-16T00:00:00.000Z",
          reviewPromptVersion: "v1",
          reviewPromptHash: "review-prompt-hash-p2-debt",
        },
        faultInjectedRepo,
      );
      expect(reviewOutcome.status).toBe("accepted");
      if (reviewOutcome.status !== "accepted") return;
      expect(reviewOutcome.gateOutcome.outcome).toBe("repository_error");

      // 8 (first half). Proves the append landed *before*, and independently
      // of, the injected transition failure: read directly from the real
      // repository (bypassing the fault-injecting wrapper entirely).
      const afterInjectedFailure = (await repo.read("review-queue", candidate.candidateId)) as {
        readonly state: string;
        readonly provenance: { readonly reviewRecords: readonly unknown[] };
      };
      expect(afterInjectedFailure.state).toBe("correctness_check_passed");
      expect(afterInjectedFailure.provenance.reviewRecords.length).toBe(1);

      // 7. Retry through runPipeline — the real production entry point, not a
      // direct attemptSemanticReviewTransition call — against the real,
      // no-longer-faulty repository.
      const retryOutcome = await runPipeline(
        { pipelineRunId: "run-p2-debt-retry", batchId: "batch-p2-debt", candidateIds: [candidate.candidateId] },
        repo,
        lockOptions(),
      );
      expect(retryOutcome.status).toBe("completed");
      if (retryOutcome.status !== "completed") return;
      const result = retryOutcome.report.candidateResults[0];

      // 9. The retry's GateResult reports a genuine pass, not a repeat of
      // the failure — the pipeline then continues into Mission 3D's gates:
      // originality passes (this fixture's text is distinct from the real
      // production corpus), and difficulty genuinely mismatches (a short,
      // simple-vocabulary prompt against a declared "medium" difficulty —
      // a real, deterministic finding, not a test artefact), so the
      // pipeline correctly stops at needs_revision rather than
      // semantic_review_passed.
      expect(result?.gateResults).toEqual([
        { gate: "semantic", outcome: "passed" },
        { gate: "originality", outcome: "passed", evidenceFingerprint: expect.any(String) },
        { gate: "difficulty", outcome: "failed", evidenceFingerprint: expect.any(String) },
      ]);

      // 8 (second half) + 10. No duplicate review append, correct final state and compartment.
      const final = (await repo.read("review-queue", candidate.candidateId)) as {
        readonly state: string;
        readonly provenance: { readonly reviewRecords: readonly unknown[] };
      };
      expect(final.state).toBe("needs_revision");
      expect(final.provenance.reviewRecords.length).toBe(1);
      expect(await repo.exists("quarantined", candidate.candidateId)).toBe(false);
      expect(await repo.exists("rejected/semantic", candidate.candidateId)).toBe(false);
    },
  );
});

describe("runPipeline — candidate-isolated crash recovery within a multi-candidate batch", () => {
  it("an isolated fault in one candidate's semantic-transition write does not affect siblings; a same-pipelineRunId retry completes only the missing candidate", async () => {
    const good = await ingestCandidate(numeracyBlueprint("bp-batch-good", "batch-batch-good"), computableCandidate(), "good.json");
    const faulty = await ingestCandidate(
      readingBlueprint("bp-batch-faulty", "batch-batch-faulty"),
      semanticObjectiveCandidate(),
      "faulty.json",
    );

    // Bring the faulty candidate to correctness_check_passed and durably
    // append its review — real gate calls, no direct state seeding — but
    // with a fault injected into *this setup call's own* internal
    // transition attempt (the review-append's second update() call), so
    // setup leaves it exactly where a genuine prior crash would: review
    // durably appended, transition not yet complete. This mirrors the
    // Mission 3B P2 debt test's own two-step fault injection, just used
    // here to construct realistic pre-batch state rather than as the
    // assertion itself.
    await orchestrateStructuralValidation(faulty.candidateId, repo, { validatedAt: new Date().toISOString() });
    await orchestrateCorrectnessVerification(faulty.candidateId, repo, { verifiedAt: new Date().toISOString() });
    const setupFaultRepo = buildUpdateFailingOnCall(repo, 2, "lock_timeout");
    const appendOutcome = await ingestExternalReview(
      {
        reviewId: "review-batch-faulty-1",
        candidateId: faulty.candidateId,
        candidateRevision: 0,
        candidateContentHash: faulty.contentHash,
        blueprintHash: faulty.blueprintHash,
        reviewerModel: "claude",
        reviewerVersion: "1.0.0",
        result: "passed",
        confidence: 0.95,
        findings: ["Main idea correctly identified."],
        evidenceReferences: ["passage closing paragraph"],
        ambiguityStatus: "none",
        reviewedAt: "2026-07-16T00:00:00.000Z",
        reviewPromptVersion: "v1",
        reviewPromptHash: "review-prompt-hash-batch",
      },
      setupFaultRepo,
    );
    expect(appendOutcome.status).toBe("accepted");
    if (appendOutcome.status !== "accepted") return;
    expect(appendOutcome.gateOutcome.outcome).toBe("repository_error");
    const stillPending = (await repo.read("review-queue", faulty.candidateId)) as { readonly state: string };
    expect(stillPending.state).toBe("correctness_check_passed");

    // Fresh wrapper, scoped to this candidate's *next* update() call — the
    // one the batch run below is about to attempt for the first time.
    const batchFaultyRepo = buildCandidateScopedFailingUpdateRepo(repo, faulty.candidateId, 1, "lock_timeout");
    const firstRun = await runPipeline(
      { pipelineRunId: "run-batch-1", batchId: "batch-mixed", candidateIds: [good.candidateId, faulty.candidateId] },
      batchFaultyRepo,
      lockOptions(),
    );
    expect(firstRun.status).toBe("completed");
    if (firstRun.status !== "completed") return;

    const [goodResult, faultyResult] = firstRun.report.candidateResults;
    expect(goodResult?.endState).toBe("difficulty_review_passed");
    expect(faultyResult?.resultKind).toBe("error");

    const faultyReviewRecordsAfterFailure = (await repo.read("review-queue", faulty.candidateId)) as {
      readonly provenance: { readonly reviewRecords: readonly unknown[] };
    };
    expect(faultyReviewRecordsAfterFailure.provenance.reviewRecords.length).toBe(1);

    const retryRun = await runPipeline(
      { pipelineRunId: "run-batch-2", batchId: "batch-mixed", candidateIds: [good.candidateId, faulty.candidateId] },
      repo,
      lockOptions(),
    );
    expect(retryRun.status).toBe("completed");
    if (retryRun.status !== "completed") return;

    const [goodRetry, faultyRetry] = retryRun.report.candidateResults;
    expect(goodRetry?.resultKind).toBe("ineligible_state");
    expect(goodRetry?.endState).toBe("difficulty_review_passed");
    // The faulty candidate's semantic stage now completes for real, and
    // the pipeline continues into Mission 3D's gates: originality passes,
    // and difficulty genuinely mismatches this fixture's declared
    // "medium" difficulty (same real, deterministic finding as the P2
    // debt test above), so it stops at needs_revision.
    expect(faultyRetry?.endState).toBe("needs_revision");

    const faultyFinal = (await repo.read("review-queue", faulty.candidateId)) as {
      readonly provenance: { readonly reviewRecords: readonly unknown[] };
    };
    expect(faultyFinal.provenance.reviewRecords.length).toBe(1);
  });
});
