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
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

/**
 * Genuine end-to-end proof of the Mission 3B chain, starting from
 * `questions:ingest` behaviour (never a direct `repository.create` seed at
 * `correctness_check_passed`) and running the real
 * structural -> correctness -> semantic-review-ingestion -> semantic-gate
 * sequence for every semantic classification.
 *
 * Post-Mission-3B-audit remediation (P1-1): prior to this fix, Mission
 * 2C's correctness gate quarantined every `semantic_objective`/
 * `manual_review_writing` candidate immediately, so those classifications
 * could never legitimately reach `correctness_check_passed` and this file
 * had to directly seed that state to test anything past it. The
 * correctness-gate routing fix (`correctness/orchestrate-correctness-verification.ts`'s
 * `passed_pending_semantic_review` outcome) makes that reachable through
 * the real pipeline — every test below proves it starting from
 * `questions:ingest`.
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

function numeracyBlueprint(): BlueprintInput {
  return {
    id: "batch-3b-bp-numeracy",
    batchId: "batch-3b-numeracy",
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

/** semantic_objective: short_answer + text-kind answer key. */
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
    metadata: {
      subject: "reading",
      strand: "Comprehension",
      skill: "lit.reading.inference",
      difficulty: "medium",
      marks: 2,
      estimatedTimeSeconds: 90,
    },
  };
}

/** manual_review_writing: reading_comprehension (always manual_review_writing regardless of answerKey.kind). */
function manualReviewWritingCandidate(): Record<string, unknown> {
  return {
    type: "reading_comprehension",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt: "According to the passage, why did the character return home early?",
    stimulus: { body: "A short synthetic passage about a character who returned home early because of rain." },
    options: [
      { id: "opt-a", text: "Because it started raining" },
      { id: "opt-b", text: "Because it was time for dinner" },
    ],
    visuals: [],
    answerKey: { kind: "single_option", optionId: "opt-a" },
    explanation: "The passage states the character left because of the rain.",
    metadata: {
      subject: "reading",
      strand: "Comprehension",
      skill: "lit.reading.inference",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
    },
  };
}

/** deterministically_computable, but whose prompt has no arithmetic expression a deterministic deriver can resolve — genuinely undecidable at the correctness gate. */
function underivableNumericCandidate(): Record<string, unknown> {
  return {
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "Sam has some apples and gives some away. How many does Sam have left?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 3, tolerance: 0 },
    explanation: "Sam has 3 apples left.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      skill: "num.addition.two-digit",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
    },
  };
}

interface IngestedCandidate {
  readonly candidateId: string;
  readonly contentHash: string;
  readonly blueprintHash: string;
}

/** Runs the real `questions:ingest` behaviour for one candidate file and returns its minted identity. */
async function ingestCandidate(
  blueprint: BlueprintInput,
  candidate: Record<string, unknown>,
  fileName: string,
  source: "claude" | "qwen" | "chatgpt" = "claude",
): Promise<IngestedCandidate> {
  const parsedBlueprint = blueprintSchema.parse(blueprint);
  await repo.create("blueprints", parsedBlueprint.id, parsedBlueprint);
  await writeFile(path.join(inboxRoot, fileName), JSON.stringify(candidate), "utf8");

  const ingestOutcome = await runManualIngestion(
    {
      source,
      batchId: parsedBlueprint.batchId,
      promptVersion: "v1",
      blueprintId: parsedBlueprint.id,
      pipelineRunId: `${parsedBlueprint.batchId}-ingest-manual`,
      inboxRoot,
    },
    repo,
  );
  if (ingestOutcome.status !== "completed") {
    throw new Error(`Ingestion did not complete: ${JSON.stringify(ingestOutcome)}`);
  }
  const fileResult = ingestOutcome.result.fileResults.find((result) => result.fileName === fileName);
  const accepted = fileResult?.candidateResults[0];
  if (accepted?.status !== "accepted") {
    throw new Error(`Candidate was not accepted: ${JSON.stringify(accepted)}`);
  }
  return {
    candidateId: accepted.candidate.candidateId,
    contentHash: accepted.candidate.provenance.contentHash,
    blueprintHash: hashJson(parsedBlueprint),
  };
}

/** Runs the real structural-validation and correctness-verification gates for an already-ingested candidate. */
async function runToCorrectnessGate(candidateId: string) {
  const structuralOutcome = await orchestrateStructuralValidation(candidateId, repo, {
    validatedAt: new Date().toISOString(),
  });
  const correctnessOutcome = await orchestrateCorrectnessVerification(candidateId, repo, {
    verifiedAt: new Date().toISOString(),
  });
  return { structuralOutcome, correctnessOutcome };
}

describe("Mission 3B full chain — deterministically_computable auto-clears", () => {
  it("carries a manual_external candidate from ingestion through structural, correctness, and semantic review with zero reviews", async () => {
    const candidate = await ingestCandidate(numeracyBlueprint(), {
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
    }, "external-candidate.json");

    const { structuralOutcome, correctnessOutcome } = await runToCorrectnessGate(candidate.candidateId);
    expect(structuralOutcome.outcome).toBe("passed");
    expect(correctnessOutcome.outcome).toBe("passed");

    const semanticOutcome = await attemptSemanticReviewTransition(candidate.candidateId, repo);
    expect(semanticOutcome.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", candidate.candidateId)) as { readonly state: string };
    expect(stored.state).toBe("semantic_review_passed");
  });
});

describe("Mission 3B full chain — semantic_objective reaches correctness_check_passed, then passes only with independent review", () => {
  it("advances through structural and correctness verification to correctness_check_passed via passed_pending_semantic_review", async () => {
    const candidate = await ingestCandidate(
      readingBlueprint("batch-3b-bp-semantic-a", "batch-3b-semantic-a"),
      semanticObjectiveCandidate(),
      "semantic-objective.json",
      "qwen",
    );

    const { structuralOutcome, correctnessOutcome } = await runToCorrectnessGate(candidate.candidateId);
    expect(structuralOutcome.outcome).toBe("passed");
    expect(correctnessOutcome.outcome).toBe("passed_pending_semantic_review");

    const stored = (await repo.read("review-queue", candidate.candidateId)) as { readonly state: string };
    expect(stored.state).toBe("correctness_check_passed");
  });

  it("passes the semantic gate only once a genuinely independent review is ingested", async () => {
    const candidate = await ingestCandidate(
      readingBlueprint("batch-3b-bp-semantic-b", "batch-3b-semantic-b"),
      semanticObjectiveCandidate(),
      "semantic-objective.json",
      "qwen",
    );
    await runToCorrectnessGate(candidate.candidateId);

    const reviewOutcome = await ingestExternalReview(
      {
        reviewId: "review-semantic-b-1",
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
        reviewedAt: "2026-07-15T00:00:00.000Z",
        reviewPromptVersion: "v1",
        reviewPromptHash: "review-prompt-hash-semantic-b",
      },
      repo,
    );
    expect(reviewOutcome.status).toBe("accepted");
    if (reviewOutcome.status !== "accepted") return;
    expect(reviewOutcome.gateOutcome.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", candidate.candidateId)) as { readonly state: string };
    expect(stored.state).toBe("semantic_review_passed");
  });

  it("quarantines the same candidate at the semantic gate when no independent review is ever ingested", async () => {
    const candidate = await ingestCandidate(
      readingBlueprint("batch-3b-bp-semantic-c", "batch-3b-semantic-c"),
      semanticObjectiveCandidate(),
      "semantic-objective.json",
      "qwen",
    );
    const { correctnessOutcome } = await runToCorrectnessGate(candidate.candidateId);
    expect(correctnessOutcome.outcome).toBe("passed_pending_semantic_review");

    const semanticOutcome = await attemptSemanticReviewTransition(candidate.candidateId, repo);
    expect(semanticOutcome.outcome).toBe("quarantined");
    expect(await repo.exists("quarantined", candidate.candidateId)).toBe(true);
    expect(await repo.exists("review-queue", candidate.candidateId)).toBe(false);
  });
});

describe("Mission 3B full chain — manual_review_writing reaches correctness_check_passed, then passes only with independent review", () => {
  it("advances through structural and correctness verification to correctness_check_passed via passed_pending_semantic_review", async () => {
    const candidate = await ingestCandidate(
      readingBlueprint("batch-3b-bp-manual-a", "batch-3b-manual-a"),
      manualReviewWritingCandidate(),
      "manual-review-writing.json",
      "qwen",
    );

    const { structuralOutcome, correctnessOutcome } = await runToCorrectnessGate(candidate.candidateId);
    expect(structuralOutcome.outcome).toBe("passed");
    expect(correctnessOutcome.outcome).toBe("passed_pending_semantic_review");

    const stored = (await repo.read("review-queue", candidate.candidateId)) as { readonly state: string };
    expect(stored.state).toBe("correctness_check_passed");
  });

  it("passes the semantic gate only once a genuinely independent review is ingested", async () => {
    const candidate = await ingestCandidate(
      readingBlueprint("batch-3b-bp-manual-b", "batch-3b-manual-b"),
      manualReviewWritingCandidate(),
      "manual-review-writing.json",
      "qwen",
    );
    await runToCorrectnessGate(candidate.candidateId);

    const reviewOutcome = await ingestExternalReview(
      {
        reviewId: "review-manual-b-1",
        candidateId: candidate.candidateId,
        candidateRevision: 0,
        candidateContentHash: candidate.contentHash,
        blueprintHash: candidate.blueprintHash,
        reviewerModel: "chatgpt",
        reviewerVersion: "1.0.0",
        result: "passed",
        confidence: 0.9,
        findings: ["Correct option identified with clear textual evidence."],
        evidenceReferences: ["passage first sentence"],
        ambiguityStatus: "none",
        reviewedAt: "2026-07-15T00:00:00.000Z",
        reviewPromptVersion: "v1",
        reviewPromptHash: "review-prompt-hash-manual-b",
      },
      repo,
    );
    expect(reviewOutcome.status).toBe("accepted");
    if (reviewOutcome.status !== "accepted") return;
    expect(reviewOutcome.gateOutcome.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", candidate.candidateId)) as { readonly state: string };
    expect(stored.state).toBe("semantic_review_passed");
  });

  it("quarantines the same candidate at the semantic gate when no independent review is ever ingested", async () => {
    const candidate = await ingestCandidate(
      readingBlueprint("batch-3b-bp-manual-c", "batch-3b-manual-c"),
      manualReviewWritingCandidate(),
      "manual-review-writing.json",
      "qwen",
    );
    await runToCorrectnessGate(candidate.candidateId);

    const semanticOutcome = await attemptSemanticReviewTransition(candidate.candidateId, repo);
    expect(semanticOutcome.outcome).toBe("quarantined");
  });
});

describe("Mission 3B full chain — review-integrity rejections against a legitimately-reached correctness_check_passed candidate", () => {
  it("rejects self-review: reviewer identity equals the candidate's own generator identity", async () => {
    const candidate = await ingestCandidate(
      readingBlueprint("batch-3b-bp-self", "batch-3b-self"),
      semanticObjectiveCandidate(),
      "semantic-objective.json",
      "claude",
    );
    await runToCorrectnessGate(candidate.candidateId);

    const reviewOutcome = await ingestExternalReview(
      {
        reviewId: "review-self-1",
        candidateId: candidate.candidateId,
        candidateRevision: 0,
        candidateContentHash: candidate.contentHash,
        blueprintHash: candidate.blueprintHash,
        reviewerModel: "claude",
        reviewerVersion: "1.0.0",
        result: "passed",
        confidence: 0.95,
        findings: ["Looks correct."],
        evidenceReferences: ["evidence"],
        ambiguityStatus: "none",
        reviewedAt: "2026-07-15T00:00:00.000Z",
        reviewPromptVersion: "v1",
        reviewPromptHash: "review-prompt-hash-self",
      },
      repo,
    );
    expect(reviewOutcome.status).toBe("rejected");
    if (reviewOutcome.status !== "rejected") return;
    expect(reviewOutcome.issueCode).toBe("self_review_rejected");

    const stored = (await repo.read("review-queue", candidate.candidateId)) as { readonly state: string };
    expect(stored.state).toBe("correctness_check_passed");
  });

  it("rejects a stale review whose declared candidateRevision no longer matches the current candidate", async () => {
    const candidate = await ingestCandidate(
      readingBlueprint("batch-3b-bp-stale", "batch-3b-stale"),
      semanticObjectiveCandidate(),
      "semantic-objective.json",
      "qwen",
    );
    await runToCorrectnessGate(candidate.candidateId);

    const reviewOutcome = await ingestExternalReview(
      {
        reviewId: "review-stale-1",
        candidateId: candidate.candidateId,
        candidateRevision: 7,
        candidateContentHash: candidate.contentHash,
        blueprintHash: candidate.blueprintHash,
        reviewerModel: "claude",
        reviewerVersion: "1.0.0",
        result: "passed",
        confidence: 0.95,
        findings: ["Looks correct."],
        evidenceReferences: ["evidence"],
        ambiguityStatus: "none",
        reviewedAt: "2026-07-15T00:00:00.000Z",
        reviewPromptVersion: "v1",
        reviewPromptHash: "review-prompt-hash-stale",
      },
      repo,
    );
    expect(reviewOutcome.status).toBe("rejected");
    if (reviewOutcome.status !== "rejected") return;
    expect(reviewOutcome.issueCode).toBe("stale_review_revision");
  });
});

describe("Mission 3B full chain — genuinely undecidable correctness still quarantines", () => {
  it("quarantines a deterministically_computable candidate whose answer the correctness gate cannot independently derive", async () => {
    const candidate = await ingestCandidate(numeracyBlueprint(), underivableNumericCandidate(), "underivable.json");
    const { structuralOutcome, correctnessOutcome } = await runToCorrectnessGate(candidate.candidateId);
    expect(structuralOutcome.outcome).toBe("passed");
    expect(correctnessOutcome.outcome).toBe("quarantined");
    expect(await repo.exists("quarantined", candidate.candidateId)).toBe(true);
    expect(await repo.exists("review-queue", candidate.candidateId)).toBe(false);
  });
});
