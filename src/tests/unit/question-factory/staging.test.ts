import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import { runPipeline } from "@/features/question-factory/pipeline";
import { hashJson } from "@/features/question-factory/provenance";
import { orchestrateStaging } from "@/features/question-factory/staging";
import { FsFactoryRepository } from "@/features/question-factory/storage";

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
});
