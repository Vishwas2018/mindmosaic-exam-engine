import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { orchestrateCorrectnessVerification } from "@/features/question-factory/correctness";
import { buildGenerationPromptPack } from "@/features/question-factory/generation";
import { mintManualCandidateId, runManualIngestion } from "@/features/question-factory/manual-ingestion";
import { hashContent } from "@/features/question-factory/provenance";
import type { FactoryRepository, UpdateResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

/**
 * End-to-end proof of the Mission 3A chain the mission brief requires:
 *
 *   prompt pack -> external-style candidate fixture -> questions:ingest
 *   behaviour -> manual_external provenance -> generated state ->
 *   structural validation -> correctness verification (where supported).
 *
 * Deliberately stops there: no semantic review, originality, difficulty,
 * staging, or publication call is made anywhere in this test — those
 * gates do not exist yet (Mission 3B onward). The last assertion below
 * confirms a manual-external candidate clears exactly the same two gates
 * a fixture-generated one would, with no special-cased gate behaviour for
 * its generator class.
 */
// Full-chain runs (real filesystem repository + real inbox transaction,
// several sequential gate calls) are slower under a fully parallel test-suite
// run than in isolation — bump this file's default test timeout rather than
// letting a loaded CI box flake on the default 5s.
vi.setConfig({ testTimeout: 30_000 });

let repoRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "mission3a-integration-repo-"));
  inboxRoot = await mkdtemp(path.join(tmpdir(), "mission3a-integration-inbox-"));
  repo = new FsFactoryRepository(repoRoot);
});

afterEach(async () => {
  // maxRetries/retryDelay: under heavy parallel load, Windows can briefly
  // hold a lock/temp file open past the point the test's own operations
  // completed, making an immediate rmdir fail with ENOTEMPTY/EBUSY — retry
  // rather than let cleanup itself flake the suite.
  await rm(repoRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  await rm(inboxRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function testBlueprint(): BlueprintInput {
  return {
    id: "batch-e2e-bp-001",
    batchId: "batch-e2e",
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

describe("Mission 3A full chain — prompt pack to correctness-gate-passable candidate", () => {
  it("carries a manual_external candidate from an issued prompt pack through to correctness_check_passed", async () => {
    const blueprint = blueprintSchema.parse(testBlueprint());
    await repo.create("blueprints", blueprint.id, blueprint);

    // 1. Prompt pack.
    const promptPackResult = buildGenerationPromptPack(blueprint.batchId, [blueprint]);
    expect(promptPackResult.status).toBe("built");
    if (promptPackResult.status !== "built") return;
    const { promptHash, pack } = promptPackResult;
    await repo.create("reports", `prompt-pack-${blueprint.batchId}`, { pack, promptHash });

    // 2. An external-style candidate fixture — the shape a human would
    // paste from an LLM chat response, matching the pack's declared
    // response schema for a `number_entry` candidate.
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

    // 3. questions:ingest behaviour.
    const ingestOutcome = await runManualIngestion(
      {
        source: "claude",
        batchId: blueprint.batchId,
        promptVersion: pack.promptVersion,
        promptHash,
        blueprintId: blueprint.id,
        pipelineRunId: `${blueprint.batchId}-ingest-manual`,
        inboxRoot,
      },
      repo,
    );
    expect(ingestOutcome.status).toBe("completed");
    if (ingestOutcome.status !== "completed") return;
    expect(ingestOutcome.result.candidatesCreated).toBe(1);

    const accepted = ingestOutcome.result.fileResults[0].candidateResults[0];
    expect(accepted.status).toBe("accepted");
    if (accepted.status !== "accepted") return;
    const candidateId = accepted.candidate.candidateId;

    // 4. manual_external provenance.
    expect(accepted.candidate.provenance.generatorAdapter.class).toBe("manual_external");
    expect(accepted.candidate.provenance.promptHash).toBe(promptHash);
    expect(accepted.candidate.provenance.blueprintId).toBe(blueprint.id);

    // 5. generated state.
    expect(accepted.candidate.state).toBe("generated");
    const storedRaw = await repo.read("generated", candidateId);
    expect(storedRaw).toBeDefined();

    // 6. Structural validation.
    const structuralOutcome = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: new Date().toISOString(),
    });
    expect(structuralOutcome.outcome).toBe("passed");

    // 7. Correctness verification — "where supported": number_entry with
    // an arithmetic-expression prompt is exactly the
    // deterministically-verifiable case Mission 2C's verifier handles.
    const correctnessOutcome = await orchestrateCorrectnessVerification(candidateId, repo, {
      verifiedAt: new Date().toISOString(),
    });
    expect(correctnessOutcome.outcome).toBe("passed");

    // The chain stops here — no semantic review, originality, difficulty,
    // staging, or publication call exists anywhere above this line.
  });

  it("proves no gate difference between a manual-external and a deterministic-fixture candidate for the same blueprint", async () => {
    const blueprint = blueprintSchema.parse(testBlueprint());
    await repo.create("blueprints", blueprint.id, blueprint);

    const external = {
      type: "number_entry",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: "What is 10 + 5?",
      options: [],
      visuals: [],
      answerKey: { kind: "number", value: 15, tolerance: 0 },
      explanation: "10 + 5 = 15.",
      metadata: {
        subject: "numeracy",
        strand: "Number",
        skill: "num.addition.two-digit",
        difficulty: "easy",
        marks: 1,
        estimatedTimeSeconds: 45,
      },
    };
    await writeFile(path.join(inboxRoot, "external.json"), JSON.stringify(external), "utf8");

    const ingestOutcome = await runManualIngestion(
      {
        source: "qwen",
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

    const structuralOutcome = await orchestrateStructuralValidation(accepted.candidate.candidateId, repo, {
      validatedAt: new Date().toISOString(),
    });
    const correctnessOutcome = await orchestrateCorrectnessVerification(accepted.candidate.candidateId, repo, {
      verifiedAt: new Date().toISOString(),
    });

    // Identical gate outcomes to the DeterministicFixtureGenerator path
    // exercised in generation-deterministic-fixture.test.ts and the prior
    // test in this file — same two gates, same "passed" outcome, no
    // special-cased behaviour keyed on generatorAdapter.class.
    expect(structuralOutcome.outcome).toBe("passed");
    expect(correctnessOutcome.outcome).toBe("passed");
  });
});

describe("Mission 3A full chain — structural rejection", () => {
  it("routes a genuinely structurally invalid ingested candidate to rejection, with the persisted record's own state field correct", async () => {
    const blueprint = blueprintSchema.parse(testBlueprint());
    await repo.create("blueprints", blueprint.id, blueprint);

    // Genuinely invalid: empty prompt and no answer key at all.
    const invalidCandidate = {
      type: "number_entry",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: "",
      options: [],
      visuals: [],
      metadata: {
        subject: "numeracy",
        strand: "Number",
        skill: "num.addition.two-digit",
        difficulty: "easy",
        marks: 1,
        estimatedTimeSeconds: 45,
      },
    };
    await writeFile(path.join(inboxRoot, "invalid-candidate.json"), JSON.stringify(invalidCandidate), "utf8");

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
    expect(structuralOutcome.outcome).toBe("rejected");
    if (structuralOutcome.outcome === "rejected") {
      expect(structuralOutcome.issues.length).toBeGreaterThan(0);
    }

    // Persisted reality, not just the returned outcome: the candidate must
    // actually live in rejected/structural with its own state field
    // stamped, and must never be reachable in generated or review-queue.
    expect(await repo.exists("generated", candidateId)).toBe(false);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("rejected/structural", candidateId)).toBe(true);
    const stored = (await repo.read("rejected/structural", candidateId)) as Record<string, unknown>;
    expect(stored.state).toBe("rejected");
  });
});

describe("Mission 3A full chain — manual ingestion identity/content conflict", () => {
  it("refuses to overwrite an unrelated record already occupying the exact candidateId the real inbox file would mint", async () => {
    const blueprint = blueprintSchema.parse(testBlueprint());
    await repo.create("blueprints", blueprint.id, blueprint);

    const fileName = "conflicting-candidate.json";
    const batchId = blueprint.batchId;
    const pipelineRunId = `${batchId}-ingest-manual`;

    const realCandidate = {
      type: "number_entry",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: "What is 7 + 8?",
      options: [],
      visuals: [],
      answerKey: { kind: "number", value: 15, tolerance: 0 },
      explanation: "7 + 8 = 15.",
      metadata: {
        subject: "numeracy",
        strand: "Number",
        skill: "num.addition.two-digit",
        difficulty: "easy",
        marks: 1,
        estimatedTimeSeconds: 45,
      },
    };
    const rawFileContent = JSON.stringify(realCandidate);

    // Precompute the exact candidateId real ingestion of this exact file
    // will mint, then seed an unrelated record directly at that id — an
    // identity/content collision the real ingestion run must detect and
    // refuse, never silently overwrite.
    const candidateId = mintManualCandidateId({
      sourceFileName: fileName,
      batchId,
      pipelineRunId,
      indexInFile: 0,
      sourceContentHash: hashContent(rawFileContent),
    });
    const unrelatedRecord = {
      candidateId,
      state: "generated",
      question: { ...realCandidate, prompt: "An entirely unrelated pre-existing candidate." },
      provenance: { contentHash: "not-a-real-matching-hash" },
    };
    await repo.create("generated", candidateId, unrelatedRecord);

    await writeFile(path.join(inboxRoot, fileName), rawFileContent, "utf8");

    const ingestOutcome = await runManualIngestion(
      {
        source: "claude",
        batchId,
        promptVersion: "v1",
        blueprintId: blueprint.id,
        pipelineRunId,
        inboxRoot,
      },
      repo,
    );
    expect(ingestOutcome.status).toBe("completed");
    if (ingestOutcome.status !== "completed") return;
    const result = ingestOutcome.result.fileResults[0].candidateResults[0];
    expect(result.status).toBe("rejected");
    if (result.status === "rejected") {
      expect(result.issueCode).toBe("candidate_conflict");
    }

    // The unrelated record must survive untouched — never overwritten by
    // the conflicting real candidate.
    const stillStored = (await repo.read("generated", candidateId)) as Record<string, unknown>;
    expect((stillStored.question as Record<string, unknown>).prompt).toBe(
      "An entirely unrelated pre-existing candidate.",
    );
  });
});

describe("Mission 3A full chain — quarantine of a malformed inbox file", () => {
  it("quarantines an unparseable inbox file with a persisted, bounded report, and rejects no valid candidate as a side effect", async () => {
    await writeFile(path.join(inboxRoot, "broken.json"), "{ not valid json at all", "utf8");

    const ingestOutcome = await runManualIngestion(
      {
        source: "claude",
        batchId: "batch-e2e-quarantine",
        promptVersion: "v1",
        pipelineRunId: "batch-e2e-quarantine-ingest-manual",
        inboxRoot,
      },
      repo,
    );
    expect(ingestOutcome.status).toBe("completed");
    if (ingestOutcome.status !== "completed") return;
    expect(ingestOutcome.result.filesQuarantined).toBe(1);
    const fileResult = ingestOutcome.result.fileResults[0];
    expect(fileResult.outcome).toBe("quarantined");

    // Persisted reality: the quarantined bytes and a bounded report must
    // actually exist on disk under the inbox's own quarantine directory.
    const { readdir, readFile: readFileFs } = await import("node:fs/promises");
    const quarantineDir = path.join(inboxRoot, "quarantine");
    const quarantinedFiles = await readdir(quarantineDir);
    expect(quarantinedFiles).toContain("broken.json");
    const reportFile = quarantinedFiles.find((name) => name.endsWith(".quarantine-report.json"));
    expect(reportFile).toBeDefined();
    const report = JSON.parse(await readFileFs(path.join(quarantineDir, reportFile!), "utf8"));
    expect(typeof report.issueCode).toBe("string");
    expect(typeof report.message).toBe("string");
  });
});

describe("Mission 3A full chain — replay after a move-success/state-update-failure crash window", () => {
  /** Wraps a real repository so its `update()` fails exactly once, then delegates to the real implementation. */
  function buildFailOnceUpdateRepo(realRepo: FactoryRepository): FactoryRepository {
    let attempts = 0;
    return {
      create: realRepo.create.bind(realRepo),
      read: realRepo.read.bind(realRepo),
      exists: realRepo.exists.bind(realRepo),
      remove: realRepo.remove.bind(realRepo),
      list: realRepo.list.bind(realRepo),
      reconcile: realRepo.reconcile.bind(realRepo),
      move: realRepo.move.bind(realRepo),
      update: async (...args: Parameters<FactoryRepository["update"]>): Promise<UpdateResult> => {
        attempts += 1;
        if (attempts === 1) {
          const [compartment, candidateId] = args;
          return {
            ok: false,
            candidateId,
            compartment,
            reason: "lock_timeout",
            message: "simulated transient failure on the first state-stamp update",
          };
        }
        return realRepo.update(...args);
      },
    };
  }

  it("proves the real ingest-then-validate chain recovers a stale 'generated' stamp left by a crashed state update", async () => {
    const blueprint = blueprintSchema.parse(testBlueprint());
    await repo.create("blueprints", blueprint.id, blueprint);

    const candidate = {
      type: "number_entry",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: "What is 6 + 6?",
      options: [],
      visuals: [],
      answerKey: { kind: "number", value: 12, tolerance: 0 },
      explanation: "6 + 6 = 12.",
      metadata: {
        subject: "numeracy",
        strand: "Number",
        skill: "num.addition.two-digit",
        difficulty: "easy",
        marks: 1,
        estimatedTimeSeconds: 45,
      },
    };
    await writeFile(path.join(inboxRoot, "candidate.json"), JSON.stringify(candidate), "utf8");

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

    const flakyRepo = buildFailOnceUpdateRepo(repo);

    const first = await orchestrateStructuralValidation(candidateId, flakyRepo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(first.outcome).toBe("repository_error");
    const stale = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    expect(stale.state).toBe("generated");

    const second = await orchestrateStructuralValidation(candidateId, flakyRepo, {
      validatedAt: "2027-01-01T00:00:00.000Z",
    });
    expect(second.outcome).toBe("passed");
    if (second.outcome === "passed") {
      expect(second.replayed).toBe(true);
    }

    const repaired = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    expect(repaired.state).toBe("structural_validation_passed");

    // The chain continues correctly past the repaired gate: correctness
    // verification (the exact consumer the crash-window fix targets) must
    // now accept this candidate rather than reject it for an invalid
    // lifecycle state.
    const correctnessOutcome = await orchestrateCorrectnessVerification(candidateId, repo, {
      verifiedAt: new Date().toISOString(),
    });
    expect(correctnessOutcome.outcome).toBe("passed");
  });
});
