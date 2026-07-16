import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Blueprint } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { hashJson } from "@/features/question-factory/provenance";
import { ingestRevision, mintRevisionCandidateId, type ReviseIngestionInput } from "@/features/question-factory/revision";
import { buildStructuralValidationReportId } from "@/features/question-factory/validation";

vi.setConfig({ testTimeout: 30_000 });
import { FACTORY_COMPARTMENTS, FsFactoryRepository } from "@/features/question-factory/storage";

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

async function readParentSnapshotHash(): Promise<string> {
  const record = await repo.read("review-queue", "candidate-parent");
  return hashJson(record);
}

/** Recursively scans `rootDir` for any file whose name still carries `FsFactoryRepository`'s atomic-write temp-file marker (`.tmp-`) — proves a rejected revision leaves no partial/temporary artefact behind. */
async function findTempFiles(dir: string): Promise<readonly string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const found: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await findTempFiles(entryPath)));
    } else if (entry.name.includes(".tmp-")) {
      found.push(entryPath);
    }
  }
  return found;
}

/**
 * Full zero-write assertion for a rejected revision: the deterministic
 * candidate id the revision *would* have minted exists in none of the
 * repository's compartments (never just `generated`), the parent's entire
 * stored record is byte-identical to its pre-call snapshot, no structural-
 * validation evidence report exists under that would-be id, and no
 * atomic-write temp file remains anywhere under the repository root.
 */
async function assertZeroWriteOutcome(params: {
  readonly parentSnapshotHashBefore: string;
  readonly revisionRequestId: string;
  readonly revisedContent: unknown;
}): Promise<void> {
  const potentialChildId = mintRevisionCandidateId({
    parentCandidateId: "candidate-parent",
    revisionRequestId: params.revisionRequestId,
    revisedContentHash: hashJson(params.revisedContent),
  });

  for (const compartment of FACTORY_COMPARTMENTS) {
    expect(await repo.exists(compartment, potentialChildId)).toBe(false);
  }
  expect(await repo.list("generated")).toEqual([]);

  const parent = (await repo.read("review-queue", "candidate-parent")) as {
    readonly state: string;
    readonly provenance: { readonly supersededBy?: unknown };
  };
  expect(parent.state).toBe("needs_revision");
  expect(parent.provenance.supersededBy).toBeUndefined();
  expect(await readParentSnapshotHash()).toBe(params.parentSnapshotHashBefore);

  expect(await repo.exists("reports", buildStructuralValidationReportId(potentialChildId))).toBe(false);
  expect(await findTempFiles(rootDir)).toEqual([]);
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

/**
 * Mission 3C second P1 remediation. The first remediation's
 * `checkRevisionBlueprintCompatibility` only compared a dimension when the
 * revised content already carried a correctly-typed, non-empty value for
 * it — silently *skipping* the check for a missing, `null`, wrongly-typed,
 * empty, or unresolvable value. That let malformed revised content claim
 * the parent's `supersededBy` slot and create a child candidate, with the
 * defect caught only by structural validation afterwards — exactly the
 * governance bypass this remediation closes. Every payload here is
 * constructed as a plain runtime object (a handful via a genuine
 * `JSON.parse(JSON.stringify(...))` round-trip, which is what actually
 * drops an `undefined`-valued key into true absence), never a TypeScript
 * type assertion, to prove untrusted external JSON cannot bypass the
 * boundary. `assertZeroWriteOutcome` checks every compartment (not just
 * `generated`), the parent's full byte-identical snapshot, the absence of
 * a structural-validation evidence report under the would-be child id, and
 * the absence of any atomic-write temp file.
 */
function metadataWithout(omit: readonly string[], overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
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
    ...overrides,
  };
  for (const key of omit) delete base[key];
  return base;
}

describe("ingestRevision — malformed/missing blueprint field rejections (runtime-untrusted JSON)", () => {
  interface Case {
    readonly name: string;
    readonly revisedContent: unknown;
  }

  const yearLevelCases: readonly Case[] = [
    { name: "yearLevel missing (dropped via JSON round-trip)", revisedContent: JSON.parse(JSON.stringify(question({ yearLevel: undefined }))) },
    { name: "yearLevel undefined", revisedContent: question({ yearLevel: undefined }) },
    { name: "yearLevel null", revisedContent: question({ yearLevel: null }) },
    { name: "yearLevel a string", revisedContent: question({ yearLevel: "5" }) },
    { name: "yearLevel an unsupported numeric value", revisedContent: question({ yearLevel: 4 }) },
  ];

  const subjectCases: readonly Case[] = [
    { name: "metadata missing entirely", revisedContent: JSON.parse(JSON.stringify(question({ metadata: undefined }))) },
    { name: "metadata malformed (an array, not a record)", revisedContent: question({ metadata: ["not", "a", "record"] }) },
    { name: "subject missing from metadata", revisedContent: question({ metadata: metadataWithout(["subject"]) }) },
    { name: "subject null", revisedContent: question({ metadata: metadataWithout([], { subject: null }) }) },
    { name: "subject wrongly typed (a number)", revisedContent: question({ metadata: metadataWithout([], { subject: 42 }) }) },
    { name: "subject unknown", revisedContent: question({ metadata: metadataWithout([], { subject: "science" }) }) },
  ];

  const examStyleCases: readonly Case[] = [
    { name: "examStyle missing", revisedContent: question({ examStyle: undefined }) },
    { name: "examStyle null", revisedContent: question({ examStyle: null }) },
    { name: "examStyle wrongly typed (a number)", revisedContent: question({ examStyle: 5 }) },
    { name: "examStyle unknown value", revisedContent: question({ examStyle: "vic_style" }) },
  ];

  const skillCases: readonly Case[] = [
    { name: "skill missing from metadata", revisedContent: question({ metadata: metadataWithout(["skill"]) }) },
    { name: "skill an empty string", revisedContent: question({ metadata: metadataWithout([], { skill: "" }) }) },
    { name: "skill whitespace-only", revisedContent: question({ metadata: metadataWithout([], { skill: "   " }) }) },
    { name: "skill null", revisedContent: question({ metadata: metadataWithout([], { skill: null }) }) },
    { name: "skill wrongly typed (a number)", revisedContent: question({ metadata: metadataWithout([], { skill: 123 }) }) },
    { name: "skill unresolvable against the taxonomy registry", revisedContent: question({ metadata: metadataWithout([], { skill: "totally.unknown.skill.xyz" }) }) },
  ];

  const questionTypeCases: readonly Case[] = [
    { name: "type missing", revisedContent: question({ type: undefined }) },
    { name: "type null", revisedContent: question({ type: null }) },
    { name: "type wrongly typed (a number)", revisedContent: question({ type: 42 }) },
    { name: "type unknown to the renderer registry", revisedContent: question({ type: "totally_unknown_type_xyz" }) },
    { name: "type valid and known but incompatible with the bound blueprint", revisedContent: question({ type: "multiple_choice" }) },
  ];

  for (const group of [
    { dimension: "yearLevel", cases: yearLevelCases },
    { dimension: "subject", cases: subjectCases },
    { dimension: "examStyle", cases: examStyleCases },
    { dimension: "skill", cases: skillCases },
    { dimension: "questionType", cases: questionTypeCases },
  ]) {
    describe(`${group.dimension}`, () => {
      for (const testCase of group.cases) {
        it(`rejects with revision_blueprint_mismatch: ${testCase.name}`, async () => {
          const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
          const parentSnapshotHashBefore = await readParentSnapshotHash();

          const outcome = await ingestRevision(
            baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash, revisedContent: testCase.revisedContent }),
            repo,
          );

          expect(outcome.status).toBe("rejected");
          if (outcome.status !== "rejected") return;
          expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
          await assertZeroWriteOutcome({
            parentSnapshotHashBefore,
            revisionRequestId: "rev-req-1",
            revisedContent: testCase.revisedContent,
          });
        });
      }
    });
  }

  it("rejects with revision_blueprint_mismatch when several dimensions are missing/malformed together", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const parentSnapshotHashBefore = await readParentSnapshotHash();

    const revisedContent = question({
      yearLevel: undefined,
      examStyle: null,
      type: 42,
      metadata: metadataWithout([], { subject: "science", skill: "" }),
    });

    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash, revisedContent }),
      repo,
    );

    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
    expect(outcome.message).toMatch(/yearLevel/);
    expect(outcome.message).toMatch(/subject/);
    expect(outcome.message).toMatch(/examStyle/);
    expect(outcome.message).toMatch(/skill/);
    expect(outcome.message).toMatch(/questionType/);
    await assertZeroWriteOutcome({ parentSnapshotHashBefore, revisionRequestId: "rev-req-1", revisedContent });
  });

  it("a fully valid, compatible revision still succeeds (the strengthened checker does not weaken the happy path)", async () => {
    const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const outcome = await ingestRevision(
      baseInput({
        parentContentHash: contentHash,
        parentBlueprintHash: blueprintHash,
        revisedContent: question({ prompt: "A genuinely compatible correction." }),
      }),
      repo,
    );
    expect(outcome.status).toBe("accepted");
  });

  it("a wrong parentBlueprintHash still rejects with revision_blueprint_mismatch even when combined with otherwise-malformed content", async () => {
    const { contentHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const parentSnapshotHashBefore = await readParentSnapshotHash();
    const revisedContent = question({ yearLevel: undefined });

    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: "wrong-blueprint-hash", revisedContent }),
      repo,
    );

    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_mismatch");
    await assertZeroWriteOutcome({ parentSnapshotHashBefore, revisionRequestId: "rev-req-1", revisedContent });
  });

  describe("precedence: malformed content vs. stale-input, conflict and replay checks", () => {
    it("a stale declared parent content hash still takes precedence over malformed revised content", async () => {
      const { blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
      const outcome = await ingestRevision(
        baseInput({
          parentContentHash: "stale-hash-does-not-match",
          parentBlueprintHash: blueprintHash,
          revisedContent: question({ yearLevel: undefined, type: null }),
        }),
        repo,
      );
      expect(outcome.status).toBe("rejected");
      if (outcome.status !== "rejected") return;
      // The parent-binding staleness check (order step 3) runs strictly
      // before the blueprint-compatibility check (steps 5-6) — malformed
      // content must never be allowed to reach, let alone bypass, a check
      // that runs earlier in the sequence.
      expect(outcome.issueCode).toBe("stale_revision_parent");
      expect(await repo.list("generated")).toEqual([]);
    });

    it("a resubmission reusing an already-claimed revisionRequestId with now-malformed content is refused as revision_blueprint_mismatch, not revision_request_conflict", async () => {
      const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
      const first = await ingestRevision(
        baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash }),
        repo,
      );
      expect(first.status).toBe("accepted");

      const parentSnapshotHashBefore = await readParentSnapshotHash();
      const malformedContent = question({ yearLevel: undefined, prompt: "Same request id, now malformed." });
      const second = await ingestRevision(
        baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash, revisedContent: malformedContent }),
        repo,
      );

      expect(second.status).toBe("rejected");
      if (second.status !== "rejected") return;
      // Blueprint-compatibility validation (steps 5-6) runs strictly before
      // claim resolution (step 7) — a reused revisionRequestId whose new
      // content is malformed must fail on content, never be treated as a
      // conflict (or, worse, a replay) first.
      expect(second.issueCode).toBe("revision_blueprint_mismatch");
      expect(await readParentSnapshotHash()).toBe(parentSnapshotHashBefore);
      expect(await repo.list("generated")).toHaveLength(1);
    });

    it("a different revisionRequestId with malformed content against an already-claimed parent is refused as revision_blueprint_mismatch, not revision_parent_conflict", async () => {
      const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
      const first = await ingestRevision(
        baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash }),
        repo,
      );
      expect(first.status).toBe("accepted");

      const parentSnapshotHashBefore = await readParentSnapshotHash();
      const malformedContent = question({ metadata: metadataWithout([], { subject: "science" }), prompt: "Different request id, malformed subject." });
      const second = await ingestRevision(
        baseInput({
          parentContentHash: contentHash,
          parentBlueprintHash: blueprintHash,
          revisionRequestId: "rev-req-different",
          revisedContent: malformedContent,
        }),
        repo,
      );

      expect(second.status).toBe("rejected");
      if (second.status !== "rejected") return;
      expect(second.issueCode).toBe("revision_blueprint_mismatch");
      expect(await readParentSnapshotHash()).toBe(parentSnapshotHashBefore);
      expect(await repo.list("generated")).toHaveLength(1);
    });
  });
});
