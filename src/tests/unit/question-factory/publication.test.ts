import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { buildDifficultyReportId } from "@/features/question-factory/difficulty";
import { buildDifficultyEvidence } from "@/features/question-factory/difficulty/evidence";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import { runPipeline } from "@/features/question-factory/pipeline";
import { assemblePublishedQuestions, orchestratePublication } from "@/features/question-factory/publication";
import { orchestrateStaging } from "@/features/question-factory/staging";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { questionSchema } from "@/schemas/question.schema";

import { baseProvenance } from "./correctness-fixtures";
import { mission3dQuestion, seedLegitimateOriginalityReport } from "./mission3d-fixtures";

/**
 * Mission 3E, second (final) hop: `orchestratePublication` drives
 * `staged -> published` — the previously entirely-missing wiring that let
 * factory-approved content actually reach a production `Question` and the
 * production-bank assembly path (`assemblePublishedQuestions`). Happy-path
 * scenarios begin from a real `runManualIngestion` + `runPipeline` +
 * `orchestrateStaging` call, mirroring `mission3d-integration.test.ts`/
 * `staging.test.ts`'s own precedent — never a hand-seeded "passed"
 * placeholder for the parts of the chain being exercised end to end.
 */
let repoRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "publication-repo-"));
  inboxRoot = await mkdtemp(path.join(tmpdir(), "publication-inbox-"));
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
    numeracyBlueprint(`bp-pub-${idSuffix}`, `batch-pub-${idSuffix}`),
    computableCandidate(prompt, value),
    `${idSuffix}.json`,
  );
  const outcome = await runPipeline(
    { pipelineRunId: `run-pub-${idSuffix}`, batchId: `batch-pub-${idSuffix}`, candidateIds: [candidate.candidateId] },
    repo,
    lockOptions(),
  );
  if (outcome.status !== "completed" || outcome.report.candidateResults[0]?.endState !== "difficulty_review_passed") {
    throw new Error(`Fixture setup did not reach difficulty_review_passed: ${JSON.stringify(outcome)}`);
  }
  return candidate;
}

async function ingestStageAndReturn(idSuffix: string, prompt: string, value: number): Promise<IngestedCandidate> {
  const candidate = await ingestAndRunToDifficultyPassed(idSuffix, prompt, value);
  const stageOutcome = await orchestrateStaging(candidate.candidateId, repo);
  if (stageOutcome.outcome !== "staged") {
    throw new Error(`Fixture setup did not reach staged: ${JSON.stringify(stageOutcome)}`);
  }
  return candidate;
}

/** Mirrors `mission3d-fixtures.ts`'s `seedLegitimateCorrectnessReport`/`seedLegitimateOriginalityReport` style: a genuine, fingerprint-consistent `df-*` report built via the real `buildDifficultyEvidence`, never a hand-faked fingerprint. */
async function seedLegitimateDifficultyReport(
  candidateId: string,
  candidateRevision: number,
  candidateContentHash: string,
  blueprintHash: string,
): Promise<void> {
  const evidence = buildDifficultyEvidence({
    candidateId,
    candidateRevision,
    candidateContentHash,
    blueprintHash,
    declaredDifficulty: "easy",
    estimatedDifficulty: "easy",
    estimateConfidence: 0.9,
    deviation: 0,
    signals: { wordCount: 10, readingLoadScore: 0.1, vocabularyComplexityScore: 0.1, reasoningStepScore: 0.1 },
    validatedAt: "2026-01-01T00:00:00.000Z",
    issues: [],
    outcome: "passed",
  });
  const report = { candidateId, result: { status: "passed" as const, evidence } };
  await repo.create("reports", buildDifficultyReportId(candidateId), report);
}

/** Hand-seeds a candidate directly into the single-purpose `staged` compartment, bypassing the real staging orchestrator — used only to isolate one specific publication-eligibility check from the rest of the chain. */
async function seedStagedCandidate(
  candidateId: string,
  question: Record<string, unknown>,
  provenanceOverrides: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const provenance = baseProvenance(question, { blueprintId: "mission3d-fixture-blueprint", ...provenanceOverrides });
  await repo.create("staged", candidateId, { candidateId, state: "staged", question, provenance });
  return provenance;
}

describe("orchestratePublication — staged -> published (happy path)", () => {
  it("publishes a fully staged, governance-passed candidate, preserving provenance and fingerprint metadata end to end", async () => {
    const candidate = await ingestStageAndReturn("pass", "What is 15 + 27?", 42);

    const outcome = await orchestratePublication(candidate.candidateId, repo, { publishedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("published");
    if (outcome.outcome !== "published") return;
    expect(outcome.replayed).toBe(false);

    // Provenance/fingerprint preservation.
    expect(outcome.manifest.candidateId).toBe(candidate.candidateId);
    expect(outcome.manifest.contentHash).toBe(candidate.contentHash);
    expect(outcome.manifest.originalityFingerprint.length).toBeGreaterThan(0);
    expect(outcome.manifest.difficultyFingerprint.length).toBeGreaterThan(0);
    expect(outcome.manifest.manifestFingerprint.length).toBeGreaterThan(0);

    // The originality gate's guarantee is asserted on the published record.
    expect(outcome.manifest.question.status).toBe("published");
    expect(outcome.manifest.question.origin).toBe("original_seed");
    expect(questionSchema.safeParse(outcome.manifest.question).success).toBe(true);

    // Content leaves the factory workspace on publish; only the manifest remains.
    expect(await repo.exists("staged", candidate.candidateId)).toBe(false);
    expect(await repo.exists("published-manifests", candidate.candidateId)).toBe(true);

    // The production-bank assembly path can now see it.
    const assembled = await assemblePublishedQuestions(repo);
    expect(assembled.warnings).toEqual([]);
    const published = assembled.questions.find((question) => question.id === outcome.manifest.questionId);
    expect(published).toBeDefined();
    expect(published?.status).toBe("published");

    // The curated 100-question production bank is completely unaffected.
    expect(questionBank).toHaveLength(100);
  });

  it("replays idempotently on a second publish call with unchanged content", async () => {
    const candidate = await ingestStageAndReturn("replay", "What is 40 + 2?", 42);

    const first = await orchestratePublication(candidate.candidateId, repo, { publishedAt: "2026-03-01T00:00:00.000Z" });
    expect(first.outcome).toBe("published");
    if (first.outcome !== "published") return;

    const second = await orchestratePublication(candidate.candidateId, repo, { publishedAt: "2026-03-02T00:00:00.000Z" });
    expect(second.outcome).toBe("published");
    if (second.outcome !== "published") return;
    expect(second.replayed).toBe(true);
    expect(second.manifest.manifestFingerprint).toBe(first.manifest.manifestFingerprint);

    expect(await repo.list("published-manifests")).toEqual([candidate.candidateId]);
  });
});

describe("orchestratePublication — an unapproved / staged-only item can never be published", () => {
  it("refuses a candidate that finished the pipeline but was never staged (still at difficulty_review_passed)", async () => {
    const candidate = await ingestAndRunToDifficultyPassed("unstaged", "What is 9 + 8?", 17);

    const outcome = await orchestratePublication(candidate.candidateId, repo, { publishedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("not_staged");
    if (outcome.outcome === "not_staged") expect(outcome.foundState).toBe("difficulty_review_passed");
    expect(await repo.exists("published-manifests", candidate.candidateId)).toBe(false);
  });

  it("refuses a candidate that was only just ingested, never having entered any gate", async () => {
    const candidate = await ingestCandidate(numeracyBlueprint("bp-pub-fresh", "batch-pub-fresh"), computableCandidate("What is 3 + 4?", 7), "fresh.json");

    const outcome = await orchestratePublication(candidate.candidateId, repo, { publishedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("not_staged");
    if (outcome.outcome === "not_staged") expect(outcome.foundState).toBe("generated");
  });

  it("refuses a candidate id that does not exist anywhere in the workspace", async () => {
    const outcome = await orchestratePublication("no-such-candidate-at-all", repo, { publishedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("not_staged");
    if (outcome.outcome === "not_staged") expect(outcome.foundState).toBe("not_found");
  });

  it("refuses a deterministic-fixture-generated candidate even after it reached 'staged', unconditionally", async () => {
    const candidateId = "cand-pub-fixture-generator";
    const question = mission3dQuestion(candidateId);
    const provenance = await seedStagedCandidate(candidateId, question, {
      generatorAdapter: { class: "deterministic_fixture", identity: normaliseIdentityOrThrow("deterministic-fixture-generator") },
    });
    // Every other eligibility check genuinely passes — isolates the fixture-generator refusal.
    await seedLegitimateOriginalityReport(repo, candidateId, provenance.revision as number, provenance.contentHash as string, "mission3d-fixture-blueprint-hash");
    await seedLegitimateDifficultyReport(candidateId, provenance.revision as number, provenance.contentHash as string, "mission3d-fixture-blueprint-hash");

    const outcome = await orchestratePublication(candidateId, repo, { publishedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("ineligible");
    if (outcome.outcome === "ineligible") {
      expect(outcome.issues.some((issue) => issue.code === "publication_refused_fixture_generator")).toBe(true);
    }
    expect(await repo.exists("published-manifests", candidateId)).toBe(false);
    expect(await repo.exists("staged", candidateId)).toBe(true);
  });

  it("refuses a staged candidate with no genuine, bound originality evidence (state alone is never trusted)", async () => {
    const candidateId = "cand-pub-no-originality";
    const question = mission3dQuestion(candidateId);
    const provenance = await seedStagedCandidate(candidateId, question);
    // Difficulty evidence is genuinely present and passing; originality is not.
    await seedLegitimateDifficultyReport(candidateId, provenance.revision as number, provenance.contentHash as string, "mission3d-fixture-blueprint-hash");

    const outcome = await orchestratePublication(candidateId, repo, { publishedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("ineligible");
    if (outcome.outcome === "ineligible") {
      expect(outcome.issues.some((issue) => issue.code === "publication_upstream_evidence_invalid" && issue.path === "reports.originality")).toBe(
        true,
      );
    }
    expect(await repo.exists("published-manifests", candidateId)).toBe(false);
  });

  it("refuses a production-id collision against the curated bank's own ids", async () => {
    const collidingId = questionBank[0]!.id;
    const question = mission3dQuestion(collidingId);
    const provenance = await seedStagedCandidate(collidingId, question);
    await seedLegitimateOriginalityReport(repo, collidingId, provenance.revision as number, provenance.contentHash as string, "mission3d-fixture-blueprint-hash");
    await seedLegitimateDifficultyReport(collidingId, provenance.revision as number, provenance.contentHash as string, "mission3d-fixture-blueprint-hash");

    const outcome = await orchestratePublication(collidingId, repo, { publishedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("collision");
    if (outcome.outcome === "collision") {
      expect(outcome.issues.some((issue) => issue.code === "publication_production_id_collision")).toBe(true);
    }
    expect(await repo.exists("published-manifests", collidingId)).toBe(false);

    // The curated bank remains exactly as it was.
    expect(questionBank).toHaveLength(100);
  });

  it("treats a candidate id with no staged record but an existing manifest as an already-published replay, never a fresh publish", async () => {
    // `FactoryRepository` enforces candidate-id uniqueness workspace-wide
    // (`readMetadata` is a single global registry keyed by id — see
    // `fs-factory-repository.ts`'s `create()`), so a `staged` record and a
    // `published-manifests` record can never coexist for the same id.
    // Consequently the only way this function can ever observe an id with
    // no staged record and a pre-existing manifest is a genuine prior
    // publish — this proves that case replays rather than erroring, and
    // never fabricates a second, different manifest.
    const candidate = await ingestStageAndReturn("reuse-replay", "What is 21 + 6?", 27);
    const first = await orchestratePublication(candidate.candidateId, repo, { publishedAt: "2026-03-01T00:00:00.000Z" });
    expect(first.outcome).toBe("published");
    if (first.outcome !== "published") return;

    expect(await repo.exists("staged", candidate.candidateId)).toBe(false);

    const second = await orchestratePublication(candidate.candidateId, repo, { publishedAt: "2026-03-02T00:00:00.000Z" });
    expect(second.outcome).toBe("published");
    if (second.outcome === "published") {
      expect(second.replayed).toBe(true);
      expect(second.manifest.manifestFingerprint).toBe(first.manifest.manifestFingerprint);
    }
  });
});
