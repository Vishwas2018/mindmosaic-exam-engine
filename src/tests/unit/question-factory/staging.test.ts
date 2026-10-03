import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { orchestrateCorrectnessVerification } from "@/features/question-factory/correctness";
import { orchestrateDifficultyReview } from "@/features/question-factory/difficulty";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import { orchestrateOriginalityReview } from "@/features/question-factory/originality";
import { runPipeline } from "@/features/question-factory/pipeline";
import { appendReviewRecord, hashJson } from "@/features/question-factory/provenance";
import { attemptSemanticReviewTransition } from "@/features/question-factory/review";
import { orchestrateStaging } from "@/features/question-factory/staging";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

import { mission3dQuestion, seedAtState } from "./mission3d-fixtures";

/**
 * Mission 3E, first hop: `orchestrateStaging` drives
 * `difficulty_review_passed -> staged`. Every happy-path scenario begins
 * from a real `runManualIngestion` + `runPipeline` call, mirroring
 * `mission3d-integration.test.ts`'s own precedent exactly (never a
 * hand-seeded "passed" placeholder) — this is what proves the previously
 * missing wiring actually connects to the real five-gate pipeline, not
 * just to a fixture that pretends it did.
 */
let repoRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "staging-repo-"));
  inboxRoot = await mkdtemp(path.join(tmpdir(), "staging-inbox-"));
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

function computableCandidate(prompt: string, value: number): Record<string, unknown> {
  return {
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt,
    options: [],
    visuals: [],
    answerKey: { kind: "number", value, tolerance: 0 },
    explanation: `${prompt} equals ${value}.`,
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 45 },
  };
}

interface IngestedCandidate {
  readonly candidateId: string;
  readonly contentHash: string;
}

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
  return { candidateId: accepted.candidate.candidateId, contentHash: accepted.candidate.provenance.contentHash };
}

async function ingestAndRunToDifficultyPassed(idSuffix: string, prompt: string, value: number): Promise<IngestedCandidate> {
  const candidate = await ingestCandidate(
    numeracyBlueprint(`bp-stage-${idSuffix}`, `batch-stage-${idSuffix}`),
    computableCandidate(prompt, value),
    `${idSuffix}.json`,
  );
  const outcome = await runPipeline(
    { pipelineRunId: `run-stage-${idSuffix}`, batchId: `batch-stage-${idSuffix}`, candidateIds: [candidate.candidateId] },
    repo,
    lockOptions(),
  );
  if (outcome.status !== "completed" || outcome.report.candidateResults[0]?.endState !== "difficulty_review_passed") {
    throw new Error(`Fixture setup did not reach difficulty_review_passed: ${JSON.stringify(outcome)}`);
  }
  return candidate;
}

describe("orchestrateStaging — difficulty_review_passed -> staged (happy path)", () => {
  it("moves a fully governance-passed candidate into the single-purpose 'staged' compartment", async () => {
    const candidate = await ingestAndRunToDifficultyPassed("pass", "What is 23 + 19?", 42);

    const outcome = await orchestrateStaging(candidate.candidateId, repo);
    expect(outcome.outcome).toBe("staged");
    if (outcome.outcome !== "staged") return;
    expect(outcome.replayed).toBe(false);
    expect(outcome.contentHash).toBe(candidate.contentHash);

    expect(await repo.exists("staged", candidate.candidateId)).toBe(true);
    expect(await repo.exists("review-queue", candidate.candidateId)).toBe(false);

    const stored = (await repo.read("staged", candidate.candidateId)) as { readonly state: string };
    expect(stored.state).toBe("staged");
  });

  it("replays idempotently on a second call for an already-staged candidate", async () => {
    const candidate = await ingestAndRunToDifficultyPassed("replay", "What is 40 + 2?", 42);

    const first = await orchestrateStaging(candidate.candidateId, repo);
    expect(first.outcome).toBe("staged");

    const second = await orchestrateStaging(candidate.candidateId, repo);
    expect(second.outcome).toBe("staged");
    if (second.outcome !== "staged") return;
    expect(second.replayed).toBe(true);

    // Still exactly one copy of the candidate, never duplicated.
    expect(await repo.list("staged")).toEqual([candidate.candidateId]);
  });
});

describe("orchestrateStaging — refusals", () => {
  it("returns not_found for a candidate id that does not exist anywhere in the workspace", async () => {
    const outcome = await orchestrateStaging("no-such-candidate-at-all", repo);
    expect(outcome.outcome).toBe("not_found");
  });

  it("refuses a candidate that has not yet reached difficulty_review_passed", async () => {
    const question = mission3dQuestion("cand-stage-too-early");
    const { candidateId } = await seedAtState(repo, question, "correctness_check_passed");

    const outcome = await orchestrateStaging(candidateId, repo);
    expect(outcome.outcome).toBe("invalid_lifecycle_state");
    if (outcome.outcome === "invalid_lifecycle_state") {
      expect(outcome.actualState).toBe("correctness_check_passed");
    }
    expect(await repo.exists("staged", candidateId)).toBe(false);
  });

  it("refuses a candidate at difficulty_review_passed with no genuine, bound difficulty report (state field alone is never trusted)", async () => {
    const question = mission3dQuestion("cand-stage-no-evidence");
    const { candidateId } = await seedAtState(repo, question, "difficulty_review_passed");

    const outcome = await orchestrateStaging(candidateId, repo);
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    expect(await repo.exists("staged", candidateId)).toBe(false);
    // The bogus state field alone must never have been enough to move it.
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
  });

  it("refuses a candidate whose stored question content no longer matches its recorded content hash (tamper detection)", async () => {
    const question = mission3dQuestion("cand-stage-tampered");
    const { candidateId } = await seedAtState(repo, question, "difficulty_review_passed");
    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const tamperedQuestion = { ...(stored.question as Record<string, unknown>), prompt: "A different prompt entirely, post-hoc edited." };
    await repo.update("review-queue", candidateId, { ...stored, question: tamperedQuestion }, { expectedContentHash: hashJson(stored) });

    const outcome = await orchestrateStaging(candidateId, repo);
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });

  it("proves a semantic_objective candidate cannot reach staged without independent review from a different model family", async () => {
    const bpInput = {
      id: "bp-reading-semantic",
      batchId: "batch-reading-semantic",
      yearLevel: "year-5" as const,
      examStyle: "naplan_style" as const,
      subject: "reading",
      strand: "Comprehension",
      skill: "lit.reading.inference",
      difficulty: "easy" as const,
      questionType: "short_answer",
      targetCount: 1,
      marks: 1,
      estimatedTimeSeconds: 60,
      learningObjective: "Infer main theme.",
      misconceptionTargets: [],
      reasoningSteps: 1,
      accessibilityConstraints: [],
      originalityConstraints: [],
      generationConstraints: [],
    };
    const bp = blueprintSchema.parse(bpInput);
    await repo.create("blueprints", bp.id, bp);

    const generatorIdentity = normaliseIdentityOrThrow("claude-sonnet-5");

    async function seedCandidate(id: string) {
      const q = candidateQuestionSchema.parse({
        id,
        type: "short_answer",
        yearLevel: 5,
        examStyle: "naplan_style",
        prompt: "What is the main idea of the story?",
        options: [],
        visuals: [],
        answerKey: { kind: "text", acceptableAnswers: ["friendship"] },
        explanation: "The story focuses on friendship.",
        metadata: { subject: "reading", strand: "Comprehension", skill: "lit.reading.inference", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60, tags: [] },
      });
      const cHash = hashJson(q);
      await repo.create("generated", id, {
        candidateId: id,
        state: "generated",
        question: q,
        provenance: {
          candidateId: id,
          blueprintId: bp.id,
          batchId: bp.batchId,
          pipelineRunId: "run-reading",
          revision: 0,
          generatedAt: "2026-07-01T00:00:00.000Z",
          generatorAdapter: { class: "manual_external", identity: generatorIdentity },
          generatorVersion: "1",
          promptVersion: "v1",
          schemaVersion: "1",
          taxonomyVersion: "1",
          contentHash: cHash,
          reviewRecords: [],
        },
      });
      const structOutcome = await orchestrateStructuralValidation(id, repo, { validatedAt: "2026-07-01T00:00:01.000Z" });
      expect(structOutcome.outcome).toBe("passed");
      const correctnessOutcome = await orchestrateCorrectnessVerification(id, repo, { verifiedAt: "2026-07-01T00:00:02.000Z" });
      expect(correctnessOutcome.outcome).toBe("passed_pending_semantic_review");
      return { question: q, contentHash: cHash };
    }

    // 1. Without review records -> semantic transition quarantines
    const c1 = "cand-reading-no-review";
    await seedCandidate(c1);
    const semanticNoReview = await attemptSemanticReviewTransition(c1, repo);
    expect(semanticNoReview.outcome).toBe("quarantined");

    const stageNoReview = await orchestrateStaging(c1, repo);
    expect(stageNoReview.outcome).not.toBe("staged");

    // 2. With same-family review (Claude Opus reviewing Claude Sonnet) -> semantic transition quarantines
    const c2 = "cand-reading-same-family";
    const { contentHash: c2Hash } = await seedCandidate(c2);
    const sameFamilyIdentity = normaliseIdentityOrThrow("claude-opus-4-8");
    const sameFamilyRecord = appendReviewRecord([], {
      candidateId: c2,
      stage: "correctness_check_passed",
      reviewerIdentity: sameFamilyIdentity,
      reviewerVersion: "1",
      result: "passed",
      confidence: 0.95,
      findings: ["Looks good."],
      evidenceReferences: ["Line 1"],
      ambiguityStatus: "none",
      reviewedAt: "2026-07-01T00:00:03.000Z",
      reviewPromptVersion: "v1",
      reviewPromptHash: "hash-prompt",
      evidenceBinding: {
        candidateRevision: 0,
        candidateContentHash: c2Hash,
        blueprintHash: hashJson(bp),
        reviewResultHash: "hash-result",
        semanticClassification: "semantic_objective",
      },
    });

    const storedCandidate = (await repo.read("review-queue", c2)) as Record<string, unknown>;
    await repo.update("review-queue", c2, {
      ...storedCandidate,
      provenance: {
        ...(storedCandidate.provenance as Record<string, unknown>),
        reviewRecords: [sameFamilyRecord],
      },
    }, { expectedContentHash: hashJson(storedCandidate) });

    const semanticSameFamily = await attemptSemanticReviewTransition(c2, repo);
    expect(semanticSameFamily.outcome).toBe("quarantined");

    // 3. With independent different-family review (GPT-4o reviewing Claude) -> passes semantic gate
    const c3 = "cand-reading-independent";
    const { contentHash: c3Hash } = await seedCandidate(c3);
    const independentIdentity = normaliseIdentityOrThrow("gpt-4o");
    const independentRecord = appendReviewRecord([], {
      candidateId: c3,
      stage: "correctness_check_passed",
      reviewerIdentity: independentIdentity,
      reviewerVersion: "1",
      result: "passed",
      confidence: 0.95,
      findings: ["Independent validation confirmed."],
      evidenceReferences: ["Theme is friendship throughout text."],
      ambiguityStatus: "none",
      reviewedAt: "2026-07-01T00:00:04.000Z",
      reviewPromptVersion: "v1",
      reviewPromptHash: "hash-prompt",
      evidenceBinding: {
        candidateRevision: 0,
        candidateContentHash: c3Hash,
        blueprintHash: hashJson(bp),
        reviewResultHash: "hash-result-2",
        semanticClassification: "semantic_objective",
      },
    });

    const storedForIndep = (await repo.read("review-queue", c3)) as Record<string, unknown>;
    await repo.update("review-queue", c3, {
      ...storedForIndep,
      provenance: {
        ...(storedForIndep.provenance as Record<string, unknown>),
        reviewRecords: [independentRecord],
      },
    }, { expectedContentHash: hashJson(storedForIndep) });

    const semanticIndep = await attemptSemanticReviewTransition(c3, repo);
    expect(semanticIndep.outcome).toBe("passed");

    // Continue through originality and difficulty gates
    const originality = await orchestrateOriginalityReview(c3, repo, { validatedAt: "2026-07-01T00:00:05.000Z" });
    expect(originality.outcome).toBe("passed");
    const difficulty = await orchestrateDifficultyReview(c3, repo, { validatedAt: "2026-07-01T00:00:06.000Z" });
    expect(difficulty.outcome).toBe("passed");

    // Candidate is now at difficulty_review_passed with complete independent review chain -> reaches staged!
    const stageOutcome = await orchestrateStaging(c3, repo);
    expect(stageOutcome.outcome).toBe("staged");
    expect(await repo.exists("staged", c3)).toBe(true);
  });
});
