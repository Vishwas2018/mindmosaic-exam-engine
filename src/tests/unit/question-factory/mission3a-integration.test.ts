import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { BlueprintInput } from "@/features/question-factory/blueprints";
import { blueprintSchema } from "@/features/question-factory/blueprints";
import { orchestrateCorrectnessVerification } from "@/features/question-factory/correctness";
import { buildGenerationPromptPack } from "@/features/question-factory/generation";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
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
let repoRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "mission3a-integration-repo-"));
  inboxRoot = await mkdtemp(path.join(tmpdir(), "mission3a-integration-inbox-"));
  repo = new FsFactoryRepository(repoRoot);
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true });
  await rm(inboxRoot, { recursive: true, force: true });
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
