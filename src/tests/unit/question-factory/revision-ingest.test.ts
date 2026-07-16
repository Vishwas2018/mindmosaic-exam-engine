import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Blueprint } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { hashJson } from "@/features/question-factory/provenance";
import { ingestRevision, mintRevisionCandidateId, type ReviseIngestionInput } from "@/features/question-factory/revision";
import { buildStructuralValidationReportId } from "@/features/question-factory/validation";

vi.setConfig({ testTimeout: 30_000 });
import { FACTORY_COMPARTMENTS, FsFactoryRepository, type FactoryRepository } from "@/features/question-factory/storage";

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
  /** Skip writing a `blueprints` record entirely — simulates a missing/deleted bound blueprint. */
  readonly skipBlueprint?: boolean;
  /** Write this raw value to the `blueprints` compartment instead of a valid `blueprint()` — simulates a stored-but-invalid bound blueprint (wrong shape, missing/wrongly-typed fields, unknown skill, unsupported type, etc.). */
  readonly blueprintOverride?: unknown;
}

/** Builds a blueprint-shaped object with the given keys omitted and/or overridden — mirrors `metadataWithout`'s pattern for constructing deliberately malformed runtime payloads. */
function blueprintWithout(omit: readonly string[], overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = { ...blueprint(), ...overrides };
  for (const key of omit) delete base[key];
  return base;
}

async function seedParentAtNeedsRevision(options: SeedOptions): Promise<{ readonly contentHash: string; readonly blueprintHash: string }> {
  const bp = blueprint();
  if (!options.skipBlueprint) {
    await repo.create("blueprints", bp.id, options.blueprintOverride !== undefined ? options.blueprintOverride : bp);
  }
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

/** Writes raw bytes directly to a `blueprints/<id>.json` file, bypassing `repository.create()`'s JSON-serialisation — the only way to simulate an empty file, truncated/malformed JSON, or a wrong-top-level-type payload actually sitting on disk. */
async function writeRawBlueprintFile(blueprintId: string, rawContent: string): Promise<void> {
  const dir = path.join(rootDir, "blueprints");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${blueprintId}.json`), rawContent, "utf8");
}

/** Wraps a real repository so `.read("blueprints", blueprintId)` throws (simulating an I/O fault/unreadable file), delegating every other call and every other compartment/id verbatim — proves `resolveBoundBlueprint` converts an unexpected throw into a deterministic rejection rather than an uncaught exception. */
function buildBlueprintReadThrowingRepo(realRepo: FactoryRepository, blueprintId: string): FactoryRepository {
  return {
    create: realRepo.create.bind(realRepo),
    read: async (compartment, candidateId) => {
      if (compartment === "blueprints" && candidateId === blueprintId) {
        throw new Error("simulated unreadable blueprint file (fault injection)");
      }
      return realRepo.read(compartment, candidateId);
    },
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: realRepo.move.bind(realRepo),
    update: realRepo.update.bind(realRepo),
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

/**
 * Mission 3C third P1 remediation. The first two remediations closed
 * `revision_blueprint_mismatch` gaps for the *caller-declared* side of the
 * check (wrong hash, malformed revised content). This one closes the
 * *stored* side: `ingestRevision` previously computed `blueprintHash` only
 * when `repository.read("blueprints", ...)` returned a defined value, and
 * ran the compatibility check only when that value additionally parsed
 * against `blueprintSchema` — a missing, unreadable, empty, malformed,
 * schema-invalid, or semantically-invalid (unknown skill, unsupported
 * question type) stored blueprint silently skipped *both* checks entirely,
 * letting the revision proceed straight to claim resolution and child
 * creation with **no verified blueprint identity or immutable-field
 * validation whatsoever**. `resolveBoundBlueprint` (`revision/revise.ts`)
 * closes this: every one of the failure modes below is now a deterministic
 * `revision_blueprint_missing`/`revision_blueprint_invalid` rejection,
 * evaluated before any parent claim or child write, using the real
 * `blueprintSchema` and `validateBlueprint` (never a second, divergent
 * blueprint validator) against the real filesystem repository.
 */
describe("ingestRevision — bound blueprint resolution (missing, unreadable, schema-invalid, semantically-invalid)", () => {
  interface BlueprintFailureCase {
    readonly name: string;
    readonly expectedIssueCode: "revision_blueprint_missing" | "revision_blueprint_invalid";
    readonly seed: () => Promise<{ readonly contentHash: string }>;
  }

  const cases: readonly BlueprintFailureCase[] = [
    {
      name: "1. blueprint record missing entirely",
      expectedIssueCode: "revision_blueprint_missing",
      seed: () => seedParentAtNeedsRevision({ candidateId: "candidate-parent", skipBlueprint: true }),
    },
    {
      name: "2. blueprint file present but empty",
      expectedIssueCode: "revision_blueprint_missing",
      seed: async () => {
        const result = await seedParentAtNeedsRevision({ candidateId: "candidate-parent", skipBlueprint: true });
        await writeRawBlueprintFile("bp-revision", "");
        return result;
      },
    },
    {
      name: "3. malformed JSON",
      expectedIssueCode: "revision_blueprint_missing",
      seed: async () => {
        const result = await seedParentAtNeedsRevision({ candidateId: "candidate-parent", skipBlueprint: true });
        await writeRawBlueprintFile("bp-revision", "{ this is not valid json");
        return result;
      },
    },
    {
      name: "4. valid JSON but wrong top-level type (an array, not a record)",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: async () => {
        const result = await seedParentAtNeedsRevision({ candidateId: "candidate-parent", skipBlueprint: true });
        await writeRawBlueprintFile("bp-revision", JSON.stringify(["not", "a", "blueprint", "record"]));
        return result;
      },
    },
    {
      name: "5. missing required blueprint id",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: () =>
        seedParentAtNeedsRevision({ candidateId: "candidate-parent", blueprintOverride: blueprintWithout(["id"]) }),
    },
    {
      name: "6. missing year/cohort constraint",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: () =>
        seedParentAtNeedsRevision({ candidateId: "candidate-parent", blueprintOverride: blueprintWithout(["yearLevel"]) }),
    },
    {
      name: "7. missing subject constraint",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: () =>
        seedParentAtNeedsRevision({ candidateId: "candidate-parent", blueprintOverride: blueprintWithout(["subject"]) }),
    },
    {
      name: "8. missing exam-style constraint",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: () =>
        seedParentAtNeedsRevision({ candidateId: "candidate-parent", blueprintOverride: blueprintWithout(["examStyle"]) }),
    },
    {
      name: "9. missing skill constraint",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: () =>
        seedParentAtNeedsRevision({ candidateId: "candidate-parent", blueprintOverride: blueprintWithout(["skill"]) }),
    },
    {
      name: "10. missing question-type constraint",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: () =>
        seedParentAtNeedsRevision({ candidateId: "candidate-parent", blueprintOverride: blueprintWithout(["questionType"]) }),
    },
    {
      name: "11. wrongly typed immutable blueprint field (yearLevel as a number)",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: () =>
        seedParentAtNeedsRevision({
          candidateId: "candidate-parent",
          blueprintOverride: blueprintWithout([], { yearLevel: 5 }),
        }),
    },
    {
      name: "12. unknown taxonomy skill in blueprint",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: () =>
        seedParentAtNeedsRevision({
          candidateId: "candidate-parent",
          blueprintOverride: blueprintWithout([], { skill: "totally.unknown.skill.xyz" }),
        }),
    },
    {
      name: "13. unsupported question type in blueprint",
      expectedIssueCode: "revision_blueprint_invalid",
      seed: () =>
        seedParentAtNeedsRevision({
          candidateId: "candidate-parent",
          blueprintOverride: blueprintWithout([], { questionType: "not_a_real_question_type_xyz" }),
        }),
    },
    {
      name: "15. truncated blueprint record (JSON cut off mid-object)",
      expectedIssueCode: "revision_blueprint_missing",
      seed: async () => {
        const result = await seedParentAtNeedsRevision({ candidateId: "candidate-parent", skipBlueprint: true });
        await writeRawBlueprintFile("bp-revision", '{"id":"bp-revision","batchId":"batch-revision","yearLevel":"year-5"');
        return result;
      },
    },
  ];

  for (const testCase of cases) {
    it(`rejects with ${testCase.expectedIssueCode}: ${testCase.name}`, async () => {
      const { contentHash } = await testCase.seed();
      const parentSnapshotHashBefore = await readParentSnapshotHash();
      const revisedContent = question({ prompt: "Would-be compatible correction, irrelevant to this failure mode." });

      const outcome = await ingestRevision(
        baseInput({ parentContentHash: contentHash, parentBlueprintHash: "irrelevant-declared-hash", revisedContent }),
        repo,
      );

      expect(outcome.status).toBe("rejected");
      if (outcome.status !== "rejected") return;
      expect(outcome.issueCode).toBe(testCase.expectedIssueCode);
      await assertZeroWriteOutcome({ parentSnapshotHashBefore, revisionRequestId: "rev-req-1", revisedContent });
    });
  }

  it("14. resolution fails as revision_blueprint_missing even when the caller declares the exact hash of the intended valid blueprint — the hash is never consulted once resolution itself has already failed", async () => {
    const intendedBlueprintHash = hashJson(blueprint());
    const { contentHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent", skipBlueprint: true });
    await writeRawBlueprintFile("bp-revision", "");
    const parentSnapshotHashBefore = await readParentSnapshotHash();
    const revisedContent = question({ prompt: "Correctly-remembered hash, but the stored blueprint itself is gone." });

    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: intendedBlueprintHash, revisedContent }),
      repo,
    );

    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_missing");
    await assertZeroWriteOutcome({ parentSnapshotHashBefore, revisionRequestId: "rev-req-1", revisedContent });
  });

  it("16. an unreadable blueprint (fault-injected read failure) rejects with revision_blueprint_invalid, never an uncaught exception", async () => {
    const { contentHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    const parentSnapshotHashBefore = await readParentSnapshotHash();
    const revisedContent = question({ prompt: "A read that will fault-inject before it ever reaches the blueprint." });
    const faultyRepo = buildBlueprintReadThrowingRepo(repo, "bp-revision");

    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: "irrelevant-declared-hash", revisedContent }),
      faultyRepo,
    );

    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_invalid");
    await assertZeroWriteOutcome({ parentSnapshotHashBefore, revisionRequestId: "rev-req-1", revisedContent });
  });

  it("blueprint deletion between the parent read and blueprint resolution is treated identically to a blueprint that was always missing", async () => {
    const { contentHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
    await repo.remove("blueprints", "bp-revision");
    const parentSnapshotHashBefore = await readParentSnapshotHash();
    const revisedContent = question({ prompt: "The blueprint existed when the parent was created, not any more." });

    const outcome = await ingestRevision(
      baseInput({ parentContentHash: contentHash, parentBlueprintHash: "irrelevant-declared-hash", revisedContent }),
      repo,
    );

    expect(outcome.status).toBe("rejected");
    if (outcome.status !== "rejected") return;
    expect(outcome.issueCode).toBe("revision_blueprint_missing");
    await assertZeroWriteOutcome({ parentSnapshotHashBefore, revisionRequestId: "rev-req-1", revisedContent });
  });

  it("a retry after a missing-blueprint failure succeeds cleanly once the blueprint is restored — no stale failure record blocks it", async () => {
    const { contentHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent", skipBlueprint: true });
    const revisedContent = question({ prompt: "Will succeed once the blueprint comes back." });
    const input = baseInput({ parentContentHash: contentHash, parentBlueprintHash: "irrelevant-declared-hash", revisedContent });

    const firstAttempt = await ingestRevision(input, repo);
    expect(firstAttempt.status).toBe("rejected");
    if (firstAttempt.status === "rejected") expect(firstAttempt.issueCode).toBe("revision_blueprint_missing");
    expect(await repo.list("generated")).toEqual([]);

    const bp = blueprint();
    await repo.create("blueprints", bp.id, bp);
    const retryInput = baseInput({
      parentContentHash: contentHash,
      parentBlueprintHash: hashJson(bp),
      revisedContent,
    });
    const retry = await ingestRevision(retryInput, repo);

    expect(retry.status).toBe("accepted");
    if (retry.status !== "accepted") return;
    expect(retry.replayed).toBe(false);
    expect(await repo.list("generated")).toEqual([retry.candidateId]);
  });

  describe("precedence: blueprint resolution vs. stale-input, hash-mismatch and conflict checks", () => {
    it("a stale declared parent content hash still takes precedence over a missing bound blueprint", async () => {
      await seedParentAtNeedsRevision({ candidateId: "candidate-parent", skipBlueprint: true });
      const outcome = await ingestRevision(
        baseInput({ parentContentHash: "stale-hash-does-not-match", parentBlueprintHash: "irrelevant" }),
        repo,
      );
      expect(outcome.status).toBe("rejected");
      if (outcome.status !== "rejected") return;
      // The parent-binding staleness check (order step 3) runs strictly
      // before blueprint resolution (order steps 4-9) — a missing
      // blueprint never masks a stale caller-declared parent binding.
      expect(outcome.issueCode).toBe("stale_revision_parent");
      expect(await repo.list("generated")).toEqual([]);
    });

    it("a wrong declared parentBlueprintHash never surfaces as revision_blueprint_mismatch when the stored blueprint itself is invalid — resolution failure always takes precedence", async () => {
      const { contentHash } = await seedParentAtNeedsRevision({
        candidateId: "candidate-parent",
        blueprintOverride: blueprintWithout([], { yearLevel: 999 }),
      });
      const outcome = await ingestRevision(
        baseInput({ parentContentHash: contentHash, parentBlueprintHash: "definitely-the-wrong-hash" }),
        repo,
      );
      expect(outcome.status).toBe("rejected");
      if (outcome.status !== "rejected") return;
      expect(outcome.issueCode).toBe("revision_blueprint_invalid");
      expect(await repo.list("generated")).toEqual([]);
    });

    it("an already-claimed parent whose blueprint has since become invalid rejects with revision_blueprint_invalid, not revision_parent_conflict", async () => {
      const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
      const first = await ingestRevision(
        baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash }),
        repo,
      );
      expect(first.status).toBe("accepted");

      await repo.update("blueprints", "bp-revision", blueprintWithout([], { yearLevel: 999 }));
      const parentSnapshotHashBefore = await readParentSnapshotHash();
      const divergentContent = question({ prompt: "A different request against a now-invalid-blueprint claimed parent." });

      const second = await ingestRevision(
        baseInput({
          parentContentHash: contentHash,
          parentBlueprintHash: blueprintHash,
          revisionRequestId: "rev-req-different",
          revisedContent: divergentContent,
        }),
        repo,
      );

      expect(second.status).toBe("rejected");
      if (second.status !== "rejected") return;
      // Blueprint resolution (steps 4-9) runs strictly before claim
      // resolution (step 12) — an already-claimed parent whose blueprint
      // has since become invalid is refused on the blueprint, never
      // misreported as an ordinary parent conflict.
      expect(second.issueCode).toBe("revision_blueprint_invalid");
      expect(await readParentSnapshotHash()).toBe(parentSnapshotHashBefore);
      expect(await repo.list("generated")).toHaveLength(1);
    });

    it("documented precedence decision: a replay of a previously-accepted request is refused, not replayed, once the bound blueprint has since been removed", async () => {
      const { contentHash, blueprintHash } = await seedParentAtNeedsRevision({ candidateId: "candidate-parent" });
      const revisedContent = question({ prompt: "Accepted once, blueprint corrupted afterwards." });
      const input = baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash, revisedContent });

      const first = await ingestRevision(input, repo);
      expect(first.status).toBe("accepted");
      if (first.status !== "accepted") return;
      const acceptedChildId = first.candidateId;

      // Corrupt the bound blueprint after the successful accept — an
      // out-of-band event unrelated to this specific request.
      await repo.remove("blueprints", "bp-revision");

      // A byte-identical resubmission of the exact same request would,
      // absent blueprint resolution, land on `resolveClaim`'s
      // `replay_child` branch and report a clean replay. Because blueprint
      // resolution (order steps 4-9) runs unconditionally, strictly before
      // claim resolution (order step 12) — including for what would
      // otherwise be a pure replay — it is refused instead. This is a
      // deliberate, documented precedence decision: the stored blueprint
      // is re-verified on every call, replay or not, because a corrupted
      // authority must never be trusted merely because an earlier call
      // once found it valid.
      const replayAttempt = await ingestRevision(input, repo);
      expect(replayAttempt.status).toBe("rejected");
      if (replayAttempt.status !== "rejected") return;
      expect(replayAttempt.issueCode).toBe("revision_blueprint_missing");

      // The original accepted child is untouched by the refused replay attempt.
      expect(await repo.exists("generated", acceptedChildId)).toBe(true);
      expect(await repo.list("generated")).toEqual([acceptedChildId]);
    });
  });
});
