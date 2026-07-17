import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { orchestrateCorrectnessVerification } from "@/features/question-factory/correctness";
import { orchestrateOriginalityReview } from "@/features/question-factory/originality";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import { runPipeline } from "@/features/question-factory/pipeline";
import { hashJson } from "@/features/question-factory/provenance";
import { attemptSemanticReviewTransition, ingestExternalReview } from "@/features/question-factory/review";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";
import { questionBank } from "@/content/questions/question-bank";

/**
 * Mission 3D full production-path integration: every scenario begins from
 * a real `runManualIngestion` call, mirroring `mission3c-integration.test.ts`'s
 * own precedent exactly. Covers the full five-stage chain (structural ->
 * correctness -> semantic -> originality -> difficulty), the pipeline's
 * hard stop at `difficulty_review_passed`, mid-pipeline resume, and the
 * negative-space assertion that no candidate ever reaches staging or
 * publication.
 */
let repoRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "mission3d-integration-repo-"));
  inboxRoot = await mkdtemp(path.join(tmpdir(), "mission3d-integration-inbox-"));
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

/** Distinctive, unpublished-content prompt: passes correctness's arithmetic derivation and stays well clear of the real production corpus, and its low word count / simple vocabulary confirms cleanly against an "easy" declared difficulty. */
function computableCandidate(prompt = "What is 23 + 19?", value = 42): Record<string, unknown> {
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

/**
 * A candidate whose comparable text (prompt + stimulus + options) is
 * byte-identical to a real, currently-existing production-bank question —
 * the originality gate must catch this regardless of the candidate's own
 * declared type/answer. Copies every field `extractComparableText` reads,
 * not just `prompt` — a prompt-only copy under-represents a corpus entry
 * whose comparable text is dominated by its options/stimulus, and would
 * under-count the true similarity.
 */
/**
 * `short_answer`/`text`-answer-key (rather than `number_entry`) so this
 * candidate classifies as `semantic_objective` and can pass a *real*
 * correctness run (declared-answer scoring only, no independent
 * derivation) despite its copied, non-arithmetic prompt text (Mission 3D
 * third remediation). `caseSensitive`/`trimWhitespace` are stamped
 * explicitly (matching the schema's own defaults) so the raw object's
 * `hashJson` already equals the post-parse, structural-validation-
 * recomputed content hash.
 */
function hardDuplicateCandidate(): Record<string, unknown> {
  const target = questionBank[0];
  return {
    type: "short_answer",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: target.prompt,
    ...(target.stimulus ? { stimulus: { body: target.stimulus.body } } : {}),
    options: target.options.map((option, index) => ({ id: `dup-opt-${index}`, text: option.text })),
    visuals: [],
    answerKey: { kind: "text", acceptableAnswers: ["duplicate-fixture-answer"], caseSensitive: false, trimWhitespace: true },
    explanation: "An unrelated explanation.",
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 45 },
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

describe("Mission 3D full production path — one runPipeline call through all five stages", () => {
  it("drives a fully computable candidate from generated to difficulty_review_passed, in exact stage order, with zero staging/publication reach", async () => {
    const candidate = await ingestCandidate(
      numeracyBlueprint("bp-3d-full-pass", "batch-3d-full-pass"),
      computableCandidate(),
      "full-pass.json",
    );

    const outcome = await runPipeline(
      { pipelineRunId: "run-3d-full-pass", batchId: "batch-3d-full-pass", candidateIds: [candidate.candidateId] },
      repo,
      lockOptions(),
    );
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    const result = outcome.report.candidateResults[0];
    expect(result?.endState).toBe("difficulty_review_passed");
    expect(result?.gateResults.map((g) => g.gate)).toEqual(["structural", "correctness", "semantic", "originality", "difficulty"]);
    expect(result?.gateResults.every((g) => g.outcome === "passed")).toBe(true);

    const stored = (await repo.read("review-queue", candidate.candidateId)) as { state: string };
    expect(stored.state).toBe("difficulty_review_passed");

    expect(await repo.list("staged")).toEqual([]);
    expect(await repo.list("published-manifests")).toEqual([]);
  });

  it("a second call with a new pipelineRunId against the already-passed candidate halts immediately with zero gate calls (the hard stop at difficulty_review_passed)", async () => {
    const candidate = await ingestCandidate(
      numeracyBlueprint("bp-3d-stop-point", "batch-3d-stop-point"),
      computableCandidate("What is 40 + 2?", 42),
      "stop-point.json",
    );
    await runPipeline({ pipelineRunId: "run-3d-stop-point-1", batchId: "batch-3d-stop-point", candidateIds: [candidate.candidateId] }, repo, lockOptions());

    const second = await runPipeline(
      { pipelineRunId: "run-3d-stop-point-2", batchId: "batch-3d-stop-point", candidateIds: [candidate.candidateId] },
      repo,
      lockOptions(),
    );
    expect(second.status).toBe("completed");
    if (second.status !== "completed") return;
    const result = second.report.candidateResults[0];
    expect(result?.gateResults).toEqual([]);
    // `difficulty_review_passed` accepts no further stage (there is no
    // sixth entry — the plan's §5a/§5d hard stop) — the loop finds no
    // eligible stage and halts before making a single gate call.
    expect(result?.resultKind).toBe("ineligible_state");
    expect(result?.endState).toBe("difficulty_review_passed");
  });
});

/**
 * Drives a candidate whose comparable text is deliberately copied verbatim
 * from a real production-bank question — so the originality gate has
 * something genuine to catch — through the *real* ingestion, structural-
 * validation, correctness-verification, and (via a real
 * `ingestExternalReview` call) semantic-review orchestrators, reaching
 * `semantic_review_passed` without any fabrication (Mission 3D third
 * remediation). `hardDuplicateCandidate()`'s `short_answer`/`text`-
 * answer-key shape means the correctness gate only needs the *declared*
 * answer to score full marks through the real scoring engine — never
 * independent derivation — so its copied, non-arithmetic prompt text
 * (the production entry may rely on a visual/table this candidate does
 * not carry) passes a real correctness run legitimately, classified
 * `semantic_objective`. A real, generator-independent `"human"` reviewer
 * then supplies genuine semantic-completion evidence.
 */
async function seedHardDuplicateAtSemanticReviewPassed(blueprintId: string, batchId: string, fileName: string): Promise<IngestedCandidate> {
  const ingested = await ingestCandidate(numeracyBlueprint(blueprintId, batchId), hardDuplicateCandidate(), fileName);

  const structural = await orchestrateStructuralValidation(ingested.candidateId, repo, { validatedAt: "2026-01-01T00:00:00.000Z" });
  if (structural.outcome !== "passed") {
    throw new Error(`seedHardDuplicateAtSemanticReviewPassed: candidate '${ingested.candidateId}' failed real structural validation: ${JSON.stringify(structural)}`);
  }
  const correctness = await orchestrateCorrectnessVerification(ingested.candidateId, repo, { verifiedAt: "2026-01-01T00:00:01.000Z" });
  if (correctness.outcome !== "passed_pending_semantic_review") {
    throw new Error(`seedHardDuplicateAtSemanticReviewPassed: candidate '${ingested.candidateId}' did not reach 'passed_pending_semantic_review': ${JSON.stringify(correctness)}`);
  }

  const reviewOutcome = await ingestExternalReview(
    {
      reviewId: `${ingested.candidateId}-review-1`,
      candidateId: ingested.candidateId,
      candidateRevision: 0,
      candidateContentHash: ingested.contentHash,
      blueprintHash: ingested.blueprintHash,
      reviewerModel: "human",
      reviewerVersion: "fixture-v1",
      result: "passed",
      confidence: 0.95,
      findings: ["Fixture-genuine independent review."],
      evidenceReferences: ["fixture-evidence-reference"],
      ambiguityStatus: "none",
      reviewedAt: "2026-01-01T00:00:02.000Z",
      reviewPromptVersion: "v1",
      reviewPromptHash: "fixture-review-prompt-hash",
    },
    repo,
  );
  if (reviewOutcome.status !== "accepted" || reviewOutcome.gateOutcome.outcome !== "passed") {
    throw new Error(`seedHardDuplicateAtSemanticReviewPassed: candidate '${ingested.candidateId}' failed real independent-review ingestion: ${JSON.stringify(reviewOutcome)}`);
  }

  return ingested;
}

describe("Mission 3D full production path — hard duplicate against the live production corpus", () => {
  it("rejects a candidate whose text is byte-identical to a real production-bank question, never reaching difficulty_review_passed", async () => {
    const ingested = await seedHardDuplicateAtSemanticReviewPassed("bp-3d-hard-dup", "batch-3d-hard-dup", "hard-dup.json");
    const candidateId = ingested.candidateId;

    const outcome = await runPipeline(
      { pipelineRunId: "run-3d-hard-dup", batchId: "batch-3d-hard-dup", candidateIds: [candidateId] },
      repo,
      lockOptions(),
    );
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const result = outcome.report.candidateResults[0];
    expect(result?.endState).toBe("rejected");
    expect(result?.gateResults.map((g) => g.gate)).toEqual(["originality"]);
    expect(result?.gateResults.at(-1)?.outcome).toBe("failed");

    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("rejected/originality", candidateId)).toBe(true);
    expect(await repo.list("staged")).toEqual([]);
  });
});

describe("Mission 3D full production path — stage ordering and resume", () => {
  it("resumes exactly at the difficulty stage for a candidate already advanced by real gate calls to originality_review_passed — no earlier stage re-runs", async () => {
    const candidate = await ingestCandidate(
      numeracyBlueprint("bp-3d-resume", "batch-3d-resume"),
      computableCandidate("What is 30 + 12?", 42),
      "resume.json",
    );

    // Advance through the first four gates via real, individual gate
    // calls (never a direct repository.create seed) — proving the
    // registry's `acceptsState` chain is genuinely walkable one stage at
    // a time, not just via the all-in-one runPipeline loop.
    const structural = await orchestrateStructuralValidation(candidate.candidateId, repo, { validatedAt: new Date().toISOString() });
    expect(structural.outcome).toBe("passed");
    const correctness = await orchestrateCorrectnessVerification(candidate.candidateId, repo, { verifiedAt: new Date().toISOString() });
    expect(correctness.outcome).toBe("passed");
    const semantic = await attemptSemanticReviewTransition(candidate.candidateId, repo);
    expect(semantic.outcome).toBe("passed");
    const originality = await orchestrateOriginalityReview(candidate.candidateId, repo, { validatedAt: new Date().toISOString() });
    expect(originality.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", candidate.candidateId)) as { state: string };
    expect(stored.state).toBe("originality_review_passed");

    // A fresh runPipeline call must resume at exactly the difficulty
    // stage — one gate call, not five.
    const outcome = await runPipeline(
      { pipelineRunId: "run-3d-resume", batchId: "batch-3d-resume", candidateIds: [candidate.candidateId] },
      repo,
      lockOptions(),
    );
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const result = outcome.report.candidateResults[0];
    expect(result?.gateResults.map((g) => g.gate)).toEqual(["difficulty"]);
    expect(result?.endState).toBe("difficulty_review_passed");
  });
});

describe("Mission 3D full production path — multi-candidate isolation across the full batch", () => {
  it("one candidate's hard-duplicate rejection never affects a sibling candidate's own progression in the same runPipeline call", async () => {
    const passing = await ingestCandidate(
      numeracyBlueprint("bp-3d-batch-pass", "batch-3d-batch"),
      computableCandidate("What is 17 + 26?", 43),
      "batch-pass.json",
    );
    const duplicate = await seedHardDuplicateAtSemanticReviewPassed("bp-3d-batch-dup", "batch-3d-batch", "batch-dup.json");
    const duplicateId = duplicate.candidateId;

    const outcome = await runPipeline(
      { pipelineRunId: "run-3d-batch", batchId: "batch-3d-batch", candidateIds: [passing.candidateId, duplicateId] },
      repo,
      lockOptions(),
    );
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    const passingResult = outcome.report.candidateResults.find((r) => r.candidateId === passing.candidateId);
    const duplicateResult = outcome.report.candidateResults.find((r) => r.candidateId === duplicateId);
    expect(passingResult?.endState).toBe("difficulty_review_passed");
    expect(duplicateResult?.endState).toBe("rejected");

    expect(await repo.list("staged")).toEqual([]);
    expect(await repo.list("published-manifests")).toEqual([]);
  });
});

describe("Mission 3D full production path — zero progression on missing blueprint", () => {
  it("a candidate whose blueprint was deleted before the originality stage runs is refused at that stage, never advancing to originality_review_passed or difficulty_review_passed", async () => {
    const candidate = await ingestCandidate(
      numeracyBlueprint("bp-3d-missing-blueprint", "batch-3d-missing-blueprint"),
      computableCandidate("What is 8 + 11?", 19),
      "missing-blueprint.json",
    );

    // Advance to semantic_review_passed via real gate calls, then remove
    // the bound blueprint out from under the candidate before the
    // originality gate ever runs.
    await orchestrateStructuralValidation(candidate.candidateId, repo, { validatedAt: new Date().toISOString() });
    await orchestrateCorrectnessVerification(candidate.candidateId, repo, { verifiedAt: new Date().toISOString() });
    await attemptSemanticReviewTransition(candidate.candidateId, repo);
    await repo.remove("blueprints", candidate.blueprintId);

    const originalityOutcome = await orchestrateOriginalityReview(candidate.candidateId, repo, { validatedAt: new Date().toISOString() });
    expect(originalityOutcome.outcome).toBe("blueprint_unresolved");

    const stored = (await repo.read("review-queue", candidate.candidateId)) as { state: string };
    expect(stored.state).toBe("semantic_review_passed");
    expect(await repo.list("reports")).toEqual(
      expect.not.arrayContaining([expect.stringMatching(/^og-/)]),
    );
  });
});
