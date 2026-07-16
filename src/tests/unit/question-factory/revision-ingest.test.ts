import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Blueprint } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { hashJson } from "@/features/question-factory/provenance";
import { ingestRevision, type ReviseIngestionInput } from "@/features/question-factory/revision";

vi.setConfig({ testTimeout: 30_000 });
import { FsFactoryRepository } from "@/features/question-factory/storage";

let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "revision-ingest-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function blueprint(): Blueprint {
  return {
    id: "bp-revision",
    batchId: "batch-revision",
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

function question(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "candidate-parent",
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
      strand: "Comprehension",
      skill: "lit.reading.inference",
      difficulty: "medium",
      marks: 2,
      estimatedTimeSeconds: 90,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
    ...overrides,
  };
}

interface SeedOptions {
  readonly candidateId: string;
  readonly revision?: number;
  readonly generatorModel?: string;
}

async function seedParentAtNeedsRevision(options: SeedOptions): Promise<{ readonly contentHash: string; readonly blueprintHash: string }> {
  const bp = blueprint();
  await repo.create("blueprints", bp.id, bp);
  const q = question({ id: options.candidateId });
  const contentHash = hashJson(q);
  await repo.create("review-queue", options.candidateId, {
    candidateId: options.candidateId,
    state: "needs_revision",
    question: q,
    provenance: {
      candidateId: options.candidateId,
      blueprintId: bp.id,
      batchId: bp.batchId,
      pipelineRunId: `${bp.batchId}-pipeline`,
      revision: options.revision ?? 0,
      generatedAt: "2026-07-01T00:00:00.000Z",
      generatorAdapter: { class: "manual_external", identity: normaliseIdentityOrThrow(options.generatorModel ?? "qwen") },
      generatorVersion: "1",
      promptVersion: "v1",
      schemaVersion: "1",
      taxonomyVersion: "1",
      contentHash,
      reviewRecords: [],
    },
  });
  return { contentHash, blueprintHash: hashJson(bp) };
}

function baseInput(overrides: Partial<ReviseIngestionInput> = {}): ReviseIngestionInput {
  return {
    revisionRequestId: "rev-req-1",
    parentCandidateId: "candidate-parent",
    parentContentHash: "placeholder",
    parentRevision: 0,
    parentBlueprintHash: "placeholder",
    revisedContent: question({ prompt: "What is the main idea of the passage, revised?" }),
    authorModel: "claude",
    requestedAt: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

describe("ingestRevision — happy path and provenance", () => {
  it("creates a new, linked candidate at 'generated' with correct parentCandidateId/revision/content hash, and preserves the parent unchanged except for its supersededBy stamp", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash }), repo);

    expect(outcome.status).toBe("accepted");
    if (outcome.status !== "accepted") return;
    expect(outcome.replayed).toBe(false);
    expect(outcome.revision).toBe(1);
    expect(outcome.candidateId.startsWith("rev-")).toBe(true);

    const child = (await repo.read("generated", outcome.candidateId)) as {
      readonly state: string;
      readonly provenance: { readonly parentCandidateId: string; readonly revision: number; readonly reviewRecords: readonly unknown[] };
    };
    expect(child.state).toBe("generated");
    expect(child.provenance.parentCandidateId).toBe("candidate-parent");
    expect(child.provenance.revision).toBe(1);
    expect(child.provenance.reviewRecords).toEqual([]);

    const parent = (await repo.read("review-queue", "candidate-parent")) as {
      readonly state: string;
      readonly provenance: { readonly contentHash: string; readonly supersededBy?: { readonly candidateId: string } };
    };
    expect(parent.state).toBe("needs_revision");
    expect(parent.provenance.contentHash).toBe(contentHash);
    expect(parent.provenance.supersededBy?.candidateId).toBe(outcome.candidateId);
  });
});

describe("ingestRevision — eligibility and binding rejections", () => {
  it("refuses a parent not at needs_revision (invalid_revision_source_state)", async () => {
    await repo.create("blueprints", blueprint().id, blueprint());
    const q = question();
    await repo.create("review-queue", "candidate-parent", {
      candidateId: "candidate-parent",
      state: "correctness_check_passed",
      question: q,
      provenance: {
        candidateId: "candidate-parent",
        blueprintId: blueprint().id,
        batchId: blueprint().batchId,
        pipelineRunId: "p",
        revision: 0,
        generatedAt: "2026-07-01T00:00:00.000Z",
        generatorAdapter: { class: "manual_external", identity: normaliseIdentityOrThrow("qwen") },
        generatorVersion: "1",
        promptVersion: "v1",
        schemaVersion: "1",
        taxonomyVersion: "1",
        contentHash: hashJson(q),
        reviewRecords: [],
      },
    });

    const outcome = await ingestRevision(baseInput(), repo);
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("invalid_revision_source_state");
  });

  it("refuses an unknown parent candidate", async () => {
    const outcome = await ingestRevision(baseInput(), repo);
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("unknown_parent_candidate");
  });

  it("refuses a stale declared parent content hash", async () => {
    const { blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(baseInput({ parentContentHash: "wrong-hash", parentBlueprintHash: blueprintHash }), repo);
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("stale_revision_parent");
  });

  it("refuses a stale declared parent revision number", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash, parentRevision: 7 }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("stale_revision_parent");
  });

  it("refuses a declared parentBlueprintHash that no longer matches the parent's current blueprint binding", async () => {
    const { contentHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: "wrong-blueprint-hash" }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
  });

  it("refuses revised content that is not materially different from the parent's current content", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash, revisedContent: question({ id: "candidate-parent" }) }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_no_material_change");
  });

  it("refuses a revision that would exceed the configured revision limit", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent", revision: 2 });
    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash, parentRevision: 2 }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_limit_exhausted");
  });

  it("refuses an unsupported author identity", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash, authorModel: "totally-unknown-model-xyz" }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("unsupported_author_identity");
  });

  it("rejects a malformed request before any repository access", async () => {
    const outcome = await ingestRevision({ notEvenClose: true }, repo);
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("malformed_revision_request");
  });
});

describe("ingestRevision — replay", () => {
  it("an identical revisionRequestId + identical content resubmission replays cleanly, no duplicate candidate", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const input = baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash });

    const first = await ingestRevision(input, repo);
    expect(first.status).toBe("accepted");
    if (first.status !== "accepted") return;
    expect(first.replayed).toBe(false);

    const second = await ingestRevision(input, repo);
    expect(second.status).toBe("accepted");
    if (second.status !== "accepted") return;
    expect(second.replayed).toBe(true);
    expect(second.candidateId).toBe(first.candidateId);

    expect(await repo.list("generated")).toEqual([first.candidateId]);
  });
});

/**
 * Mission 3C P1 remediation: `parentBlueprintHash` equality alone only
 * proves the caller referenced the same blueprint record — it never proved
 * the revised content itself still conforms to that blueprint's immutable
 * cohort/subject/exam-style/skill/question-type. These tests exercise the
 * new `checkRevisionBlueprintCompatibility` gate directly through
 * `ingestRevision`'s production entry point (never the pure function in
 * isolation), asserting the full zero-write contract: no child candidate,
 * no parent mutation (`supersededBy` stays unset, `contentHash`/`state`
 * unchanged), and no candidate-count drift.
 */
describe("ingestRevision — blueprint compatibility rejections", () => {
  async function assertNoMutationOccurred(contentHashBefore: string): Promise<void> {
    expect(await repo.list("generated")).toEqual([]);
    const parent = (await repo.read("review-queue", "candidate-parent")) as {
      readonly state: string;
      readonly provenance: { readonly contentHash: string; readonly supersededBy?: unknown };
    };
    expect(parent.state).toBe("needs_revision");
    expect(parent.provenance.contentHash).toBe(contentHashBefore);
    expect(parent.provenance.supersededBy).toBeUndefined();
  }

  it("refuses a revision whose year level/cohort differs from the bound blueprint", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({
        parentContentHash: contentHash,
        parentBlueprintHash: blueprintHash,
        revisedContent: question({ yearLevel: 3, prompt: "Revised, but for the wrong cohort." }),
      }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
    await assertNoMutationOccurred(contentHash);
  });

  it("refuses a revision whose subject differs from the bound blueprint", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({
        parentContentHash: contentHash,
        parentBlueprintHash: blueprintHash,
        revisedContent: question({
          prompt: "Revised, but for the wrong subject.",
          metadata: {
            subject: "numeracy",
            strand: "Comprehension",
            skill: "lit.reading.inference",
            difficulty: "medium",
            marks: 2,
            estimatedTimeSeconds: 90,
            tags: [],
            locale: "en-AU",
            source: "original",
            schemaVersion: 1,
          },
        }),
      }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
    await assertNoMutationOccurred(contentHash);
  });

  it("refuses a revision whose exam style differs from the bound blueprint", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({
        parentContentHash: contentHash,
        parentBlueprintHash: blueprintHash,
        revisedContent: question({ examStyle: "icas_style", prompt: "Revised, but for the wrong exam style." }),
      }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
    await assertNoMutationOccurred(contentHash);
  });

  it("refuses a revision whose skill differs from the bound blueprint", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({
        parentContentHash: contentHash,
        parentBlueprintHash: blueprintHash,
        revisedContent: question({
          prompt: "Revised, but for the wrong skill.",
          metadata: {
            subject: "reading",
            strand: "Comprehension",
            skill: "lang.prod.grammar.verb-tense",
            difficulty: "medium",
            marks: 2,
            estimatedTimeSeconds: 90,
            tags: [],
            locale: "en-AU",
            source: "original",
            schemaVersion: 1,
          },
        }),
      }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
    await assertNoMutationOccurred(contentHash);
  });

  it("refuses a revision whose question type is not the type allowed by the bound blueprint", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({
        parentContentHash: contentHash,
        parentBlueprintHash: blueprintHash,
        revisedContent: question({ type: "multiple_choice", prompt: "Revised, but for the wrong question type." }),
      }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
    await assertNoMutationOccurred(contentHash);
  });

  it("refuses a revision that changes multiple blueprint-bound fields at once", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({
        parentContentHash: contentHash,
        parentBlueprintHash: blueprintHash,
        revisedContent: question({
          yearLevel: 3,
          examStyle: "icas_style",
          prompt: "Revised, but wrong on multiple blueprint dimensions.",
          metadata: {
            subject: "numeracy",
            strand: "Comprehension",
            skill: "lang.prod.grammar.verb-tense",
            difficulty: "medium",
            marks: 2,
            estimatedTimeSeconds: 90,
            tags: [],
            locale: "en-AU",
            source: "original",
            schemaVersion: 1,
          },
        }),
      }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
    expect(outcome.message).toMatch(/yearLevel/);
    expect(outcome.message).toMatch(/subject/);
    expect(outcome.message).toMatch(/examStyle/);
    expect(outcome.message).toMatch(/skill/);
    await assertNoMutationOccurred(contentHash);
  });

  it("a compatible content revision (no blueprint-bound field changed) still succeeds", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({
        parentContentHash: contentHash,
        parentBlueprintHash: blueprintHash,
        revisedContent: question({ prompt: "A compatible correction — same cohort, subject, exam style, skill and question type." }),
      }),
      repo,
    );
    expect(outcome.status).toBe("accepted");
    if (outcome.status !== "accepted") return;
    expect(outcome.replayed).toBe(false);

    const child = (await repo.read("generated", outcome.candidateId)) as {
      readonly state: string;
    };
    expect(child.state).toBe("generated");
  });

  it("a wrong parentBlueprintHash is still refused as revision_blueprint_mismatch even when the content itself is compatible", async () => {
    const { contentHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({
        parentContentHash: contentHash,
        parentBlueprintHash: "wrong-blueprint-hash",
        revisedContent: question({ prompt: "Compatible content, but the wrong declared blueprint hash." }),
      }),
      repo,
    );
    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
    await assertNoMutationOccurred(contentHash);
  });
});
