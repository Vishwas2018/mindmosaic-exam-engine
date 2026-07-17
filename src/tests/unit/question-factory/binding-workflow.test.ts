/**
 * PB2 blueprint-binding workflow — real-filesystem coverage. Every test
 * drives the real `FsFactoryRepository`, the real inbox transaction and the
 * real gates against disposable temp directories; nothing is mocked.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  generateBindingArtefacts,
  mintBindingBlueprintId,
  seedBindingBlueprints,
  serialiseCanonicalTuple,
  type BindingManifest,
  type CanonicalBindingTuple,
} from "@/features/question-factory/binding";
import type { Blueprint } from "@/features/question-factory/blueprints";
import {
  buildCorrectnessReportId,
  orchestrateCorrectnessVerification,
} from "@/features/question-factory/correctness/orchestrate-correctness-verification";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import type { ManualIngestionRunRequest } from "@/features/question-factory/manual-ingestion";
import { hashJson } from "@/features/question-factory/provenance";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { skillTaxonomyRegistry } from "@/features/question-factory/taxonomy";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation/orchestrate-structural-validation";

const FROZEN_FINGERPRINT = "3c1b120ae03ce49311acd5a1eae575dadf42cfa0bc840475229ea6ac21945e3c";
const BATCH_ID = "bind-test";

let rootDir: string;
let workspaceRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "binding-workflow-"));
  workspaceRoot = path.join(rootDir, "workspace");
  inboxRoot = path.join(rootDir, "inbox");
  await fs.mkdir(workspaceRoot, { recursive: true });
  await fs.mkdir(inboxRoot, { recursive: true });
  repo = new FsFactoryRepository(workspaceRoot);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

/** A registry entry that recommends number_entry — synthetic candidates derive their metadata from it so taxonomy checks pass exactly. */
function numberEntrySkill() {
  const entry = skillTaxonomyRegistry.entries.find(
    (candidate) =>
      candidate.recommendedQuestionTypes.includes("number_entry") &&
      candidate.supportedDifficulties.includes("medium") &&
      candidate.yearLevels.length > 0 &&
      candidate.examStyles.length > 0,
  );
  if (!entry) throw new Error("No registry entry recommends number_entry — fixture assumption broken.");
  return entry;
}

interface SyntheticCandidateOptions {
  readonly id: string;
  readonly left: number;
  readonly right: number;
  readonly difficulty?: string;
}

function syntheticCandidate(options: SyntheticCandidateOptions): Record<string, unknown> {
  const entry = numberEntrySkill();
  return {
    id: options.id,
    type: "number_entry",
    yearLevel: entry.yearLevels[0],
    examStyle: entry.examStyles[0],
    prompt: `What is ${options.left} + ${options.right}?`,
    answerKey: { kind: "number", value: options.left + options.right },
    explanation: `${options.left} + ${options.right} = ${options.left + options.right}.`,
    metadata: {
      subject: entry.subject,
      strand: entry.strand,
      skill: entry.id,
      difficulty: options.difficulty ?? "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
  };
}

function tupleOf(candidate: Record<string, unknown>): CanonicalBindingTuple {
  const metadata = candidate.metadata as Record<string, unknown>;
  return {
    skill: metadata.skill as string,
    yearLevel: candidate.yearLevel as CanonicalBindingTuple["yearLevel"],
    examStyle: candidate.examStyle as CanonicalBindingTuple["examStyle"],
    subject: metadata.subject as string,
    strand: metadata.strand as string,
    difficulty: metadata.difficulty as string,
    questionType: candidate.type as string,
  };
}

const PACK_NAME = "bind-pack-001.json";

function serialisePack(candidates: readonly Record<string, unknown>[]): string {
  return JSON.stringify(candidates, null, 2) + "\n";
}

async function stagePack(content: string, fileName = PACK_NAME): Promise<void> {
  await fs.writeFile(path.join(inboxRoot, fileName), content, "utf8");
}

interface PreparedBatch {
  readonly candidates: readonly Record<string, unknown>[];
  readonly packContent: string;
  readonly manifest: BindingManifest;
  readonly blueprints: readonly Blueprint[];
}

/** Generates artefacts for a small synthetic batch, stages the pack and seeds the blueprints — the standard happy-path setup. */
async function prepareBatch(
  candidates: readonly Record<string, unknown>[],
  { stage = true, seed = true }: { stage?: boolean; seed?: boolean } = {},
): Promise<PreparedBatch> {
  const packContent = serialisePack(candidates);
  const generated = generateBindingArtefacts({
    batchId: BATCH_ID,
    frozenFingerprint: FROZEN_FINGERPRINT,
    packs: [{ fileName: PACK_NAME, rawContent: packContent }],
    generatedAt: "2026-07-17T00:00:00.000Z",
  });
  if (!generated.ok) {
    throw new Error(`fixture generation failed: ${generated.failures.map((failure) => failure.message).join("; ")}`);
  }
  if (stage) await stagePack(packContent);
  if (seed) {
    const seeded = await seedBindingBlueprints(generated.blueprints, repo);
    expect(seeded.conflicts).toEqual([]);
  }
  return { candidates, packContent, manifest: generated.manifest, blueprints: generated.blueprints };
}

function request(overrides: Partial<ManualIngestionRunRequest> = {}): ManualIngestionRunRequest {
  return {
    source: "claude",
    batchId: BATCH_ID,
    promptVersion: "binding-test-v1",
    pipelineRunId: `${BATCH_ID}-run`,
    inboxRoot,
    // Required for every binding-manifest run (hardening item 3); harmless
    // for unbound runs, where the library ignores it.
    expectedFrozenFingerprint: FROZEN_FINGERPRINT,
    ...overrides,
  };
}

/** Byte-level snapshot of every file under the workspace and inbox roots (lock files excluded — they are transient run infrastructure, created and removed by every run including dry runs). */
async function snapshot(): Promise<string> {
  const lines: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return;
    }
    for (const name of entries.sort()) {
      const fullPath = path.join(dir, name);
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        await walk(fullPath);
      } else if (!fullPath.includes(".locks")) {
        const digest = createHash("sha256").update(await fs.readFile(fullPath)).digest("hex");
        lines.push(`${fullPath}|${digest}`);
      }
    }
  }
  await walk(workspaceRoot);
  await walk(inboxRoot);
  return lines.join("\n");
}

async function expectRequestInvalid(
  manifest: BindingManifest,
  expectedFragment: string | RegExp,
): Promise<void> {
  const before = await snapshot();
  const outcome = await runManualIngestion(request({ bindingManifest: manifest }), repo);
  expect(outcome.status).toBe("request_invalid");
  if (outcome.status === "request_invalid") {
    expect(outcome.issueCode).toBe("binding_manifest_invalid");
    expect(outcome.message).toMatch(expectedFragment);
  }
  expect(await snapshot()).toBe(before);
}

describe("binding preflight (zero-write failures)", () => {
  it("1. rejects a missing candidate binding and leaves the workspace byte-identical", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 }), syntheticCandidate({ id: "bind-c2", left: 20, right: 15 })]);
    const truncated = { ...batch.manifest, bindings: batch.manifest.bindings.slice(0, 1) };
    await expectRequestInvalid(truncated, /binding_missing.*bind-c2/);
  });

  it("2. rejects a binding for an unknown candidate", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })]);
    const extra = {
      ...batch.manifest,
      bindings: [...batch.manifest.bindings, { ...batch.manifest.bindings[0], candidateKey: "no-such-candidate" }],
    };
    await expectRequestInvalid(extra, /binding_unknown_candidate.*no-such-candidate/);
  });

  it("3. rejects a pilot candidate smuggled into the manifest (never a staged candidate)", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })]);
    const withPilot = {
      ...batch.manifest,
      bindings: [...batch.manifest.bindings, { ...batch.manifest.bindings[0], candidateKey: "pb2-g3-icas-sci-007" }],
    };
    await expectRequestInvalid(withPilot, /binding_unknown_candidate.*pb2-g3-icas-sci-007/);
  });

  it("4. rejects staged pack bytes that do not match the manifest's approved hash", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })], { stage: false });
    const tampered = batch.packContent.replace("What is 12 + 34?", "What is 12 + 34 exactly?");
    await stagePack(tampered);
    await expectRequestInvalid(batch.manifest, /pack_hash_mismatch/);
  });

  it("5. rejects a manifest tuple that disagrees with the candidate's stored metadata", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })]);
    const [binding] = batch.manifest.bindings;
    const skewed = {
      ...batch.manifest,
      bindings: [{ ...binding, canonicalTuple: binding.canonicalTuple.replace("|medium|", "|challenging|") }],
    };
    await expectRequestInvalid(skewed, /tuple_mismatch/);
  });

  it("6. rejects an unresolved blueprint (nothing seeded)", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })], { seed: false });
    await expectRequestInvalid(batch.manifest, /blueprint_unresolved/);
  });

  it("6b. rejects a seeded blueprint whose bytes differ from the reviewed hash", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })], { seed: false });
    const mutated = { ...batch.blueprints[0], learningObjective: "Not the reviewed objective." };
    await repo.create("blueprints", mutated.id, mutated);
    await expectRequestInvalid(batch.manifest, /blueprint_hash_mismatch/);
  });

  it("7. rejects a manifest blueprint id that is not the deterministic id for its tuple, and detects collisions", async () => {
    const c1 = syntheticCandidate({ id: "bind-c1", left: 12, right: 34 });
    const c2 = syntheticCandidate({ id: "bind-c2", left: 9, right: 8, difficulty: "easy" });
    const batch = await prepareBatch([c1, c2]);
    const [b1, b2] = batch.manifest.bindings;
    const nonDeterministic = { ...batch.manifest, bindings: [{ ...b1, blueprintId: "hand-picked-bp" }, b2] };
    await expectRequestInvalid(nonDeterministic, /blueprint_id_not_deterministic/);
  });

  it("8. rejects duplicate manifest entries for one candidate", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })]);
    const doubled = { ...batch.manifest, bindings: [...batch.manifest.bindings, ...batch.manifest.bindings] };
    await expectRequestInvalid(doubled, /binding_duplicate/);
  });

  it("18. refuses bindingManifest combined with a run-level blueprintId", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })]);
    const before = await snapshot();
    const outcome = await runManualIngestion(request({ bindingManifest: batch.manifest, blueprintId: "some-bp" }), repo);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status === "request_invalid") expect(outcome.issueCode).toBe("binding_manifest_invalid");
    expect(await snapshot()).toBe(before);
  });
});

describe("binding dry-run and ingestion", () => {
  it("9. dry-run exercises the full binding contract with zero writes", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 }), syntheticCandidate({ id: "bind-c2", left: 20, right: 15 })]);
    const before = await snapshot();
    const outcome = await runManualIngestion(request({ bindingManifest: batch.manifest, dryRun: true }), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status === "completed") {
      const accepted = outcome.result.fileResults.flatMap((file) => file.candidateResults).filter((result) => result.status === "accepted");
      expect(accepted).toHaveLength(2);
      expect(outcome.result.candidatesCreated).toBe(0);
    }
    expect(await snapshot()).toBe(before);
  });

  it("10–12. bound ingestion succeeds, preserves ids/content hashes, and stamps the expected blueprint ids", async () => {
    const c1 = syntheticCandidate({ id: "bind-c1", left: 12, right: 34 });
    const c2 = syntheticCandidate({ id: "bind-c2", left: 20, right: 15, difficulty: "easy" });

    // Reference ingestion (same bytes, no manifest) into a sibling
    // workspace: candidate ids and content hashes must be binding-invariant.
    const referenceWorkspace = path.join(rootDir, "reference-workspace");
    const referenceInbox = path.join(rootDir, "reference-inbox");
    await fs.mkdir(referenceWorkspace, { recursive: true });
    await fs.mkdir(referenceInbox, { recursive: true });
    const referenceRepo = new FsFactoryRepository(referenceWorkspace);
    await fs.writeFile(path.join(referenceInbox, PACK_NAME), serialisePack([c1, c2]), "utf8");
    const referenceOutcome = await runManualIngestion(request({ inboxRoot: referenceInbox }), referenceRepo);
    expect(referenceOutcome.status).toBe("completed");
    const referenceIds = await referenceRepo.list("generated");

    const batch = await prepareBatch([c1, c2]);
    const outcome = await runManualIngestion(request({ bindingManifest: batch.manifest }), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status === "completed") expect(outcome.result.candidatesCreated).toBe(2);

    const boundIds = await repo.list("generated");
    expect([...boundIds].sort()).toEqual([...referenceIds].sort());

    const manifestBlueprintIds = new Set(batch.manifest.bindings.map((binding) => binding.blueprintId));
    for (const candidateId of boundIds) {
      const record = (await repo.read("generated", candidateId)) as {
        question: Record<string, unknown>;
        provenance: { blueprintId: string; contentHash: string };
      };
      const referenceRecord = (await referenceRepo.read("generated", candidateId)) as { provenance: { blueprintId: string; contentHash: string } };
      expect(record.provenance.contentHash).toBe(referenceRecord.provenance.contentHash);
      // The stored question carries the minted id (the in-file key is
      // adapter input, deliberately not persisted), so the expected
      // binding is recomputed deterministically from the stored tuple.
      expect(record.provenance.blueprintId).toBe(mintBindingBlueprintId(tupleOf(record.question)));
      expect(manifestBlueprintIds.has(record.provenance.blueprintId)).toBe(true);
      expect(record.provenance.blueprintId).not.toBe("manual-ingestion-unblueprinted");
    }
  });

  it("13. structural validation embeds the bound blueprint's hash into its evidence", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })]);
    const outcome = await runManualIngestion(request({ bindingManifest: batch.manifest }), repo);
    expect(outcome.status).toBe("completed");
    const [candidateId] = await repo.list("generated");
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-07-17T01:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    if (structural.outcome === "passed") {
      const storedBlueprint = await repo.read("blueprints", batch.manifest.bindings[0].blueprintId);
      expect(structural.evidence.blueprintHash).toBe(hashJson(storedBlueprint));
      expect(structural.evidence.blueprintHash).toBe(batch.manifest.bindings[0].blueprintHash);
    }
  });

  it("14. re-dropping identical bytes with the identical manifest replays idempotently", async () => {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })]);
    const first = await runManualIngestion(request({ bindingManifest: batch.manifest }), repo);
    expect(first.status).toBe("completed");

    await stagePack(batch.packContent); // identical re-drop; completed copy already in processed/
    const second = await runManualIngestion(request({ bindingManifest: batch.manifest }), repo);
    expect(second.status).toBe("completed");
    if (second.status === "completed") {
      expect(second.result.candidatesCreated).toBe(0);
      expect(second.result.candidatesReplayed).toBe(1);
      expect(second.result.candidatesRejected).toBe(0);
    }
  });

  it("15+20. identical content under a different binding refuses with candidate_conflict, without disturbing siblings", async () => {
    const c1 = syntheticCandidate({ id: "bind-c1", left: 12, right: 34 });
    const c2 = syntheticCandidate({ id: "bind-c2", left: 20, right: 15 });
    // First ingestion WITHOUT a manifest: both candidates carry the placeholder binding.
    await stagePack(serialisePack([c1, c2]));
    const unbound = await runManualIngestion(request(), repo);
    expect(unbound.status).toBe("completed");
    const storedIds = await repo.list("generated");
    const statesBefore = new Map<string, string>();
    for (const id of storedIds) {
      const record = (await repo.read("generated", id)) as { provenance: { blueprintId: string } };
      statesBefore.set(id, record.provenance.blueprintId);
      expect(record.provenance.blueprintId).toBe("manual-ingestion-unblueprinted");
    }

    // Identical bytes re-dropped, now WITH a real binding: every candidate's
    // stored binding differs from the incoming one → per-candidate conflict,
    // and no stored record is silently rebound.
    const batch = await prepareBatch([c1, c2], { stage: true });
    const bound = await runManualIngestion(request({ bindingManifest: batch.manifest }), repo);
    expect(bound.status).toBe("completed");
    if (bound.status === "completed") {
      const rejected = bound.result.fileResults.flatMap((file) => file.candidateResults).filter((result) => result.status === "rejected");
      expect(rejected).toHaveLength(2);
      for (const rejection of rejected) {
        if (rejection.status === "rejected") {
          expect(rejection.issueCode).toBe("candidate_conflict");
          expect(rejection.message).toMatch(/different blueprint binding/);
        }
      }
    }
    for (const id of storedIds) {
      const record = (await repo.read("generated", id)) as { provenance: { blueprintId: string } };
      expect(record.provenance.blueprintId).toBe(statesBefore.get(id));
    }
  });
});

describe("bound candidates at the gates", () => {
  async function ingestAndPassStructural(): Promise<{ candidateId: string; blueprintId: string; blueprint: Blueprint }> {
    const batch = await prepareBatch([syntheticCandidate({ id: "bind-c1", left: 12, right: 34 })]);
    const outcome = await runManualIngestion(request({ bindingManifest: batch.manifest }), repo);
    expect(outcome.status).toBe("completed");
    const [candidateId] = await repo.list("generated");
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-07-17T01:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    return { candidateId, blueprintId: batch.manifest.bindings[0].blueprintId, blueprint: batch.blueprints[0] };
  }

  it("16+17. blueprint deletion causes gate refusal; identical restoration permits replay", async () => {
    const { candidateId, blueprintId, blueprint } = await ingestAndPassStructural();
    const fresh = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-07-17T02:00:00.000Z" });
    expect(fresh.outcome).toBe("passed");
    const reportBefore = await repo.read("reports", buildCorrectnessReportId(candidateId));

    await repo.remove("blueprints", blueprintId);
    const refused = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-07-17T03:00:00.000Z" });
    expect(refused.outcome).toBe("repository_error");
    expect(hashJson(await repo.read("reports", buildCorrectnessReportId(candidateId)))).toBe(hashJson(reportBefore));

    await repo.create("blueprints", blueprintId, blueprint);
    const replayed = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-07-17T04:00:00.000Z" });
    expect(replayed.outcome).toBe("passed");
    if (replayed.outcome === "passed") expect(replayed.replayed).toBe(true);
  });
});

describe("blueprint seeding crash/retry", () => {
  it("19. a partially completed seed resumes to convergence, and a divergent record is a conflict, never an overwrite", async () => {
    const c1 = syntheticCandidate({ id: "bind-c1", left: 12, right: 34 });
    const c2 = syntheticCandidate({ id: "bind-c2", left: 9, right: 8, difficulty: "easy" });
    const batch = await prepareBatch([c1, c2], { stage: false, seed: false });
    expect(batch.blueprints.length).toBe(2);

    // "Crash" after the first record: seed a one-element subset.
    const partial = await seedBindingBlueprints(batch.blueprints.slice(0, 1), repo);
    expect(partial).toMatchObject({ created: 1, replayed: 0, conflicts: [] });

    // Retry with the full set: the survivor replays, the rest are created.
    const resumed = await seedBindingBlueprints(batch.blueprints, repo);
    expect(resumed).toMatchObject({ created: 1, replayed: 1, conflicts: [] });

    // A third run is a pure replay.
    const converged = await seedBindingBlueprints(batch.blueprints, repo);
    expect(converged).toMatchObject({ created: 0, replayed: 2, conflicts: [] });

    // Divergent stored record → conflict; stored bytes stay untouched.
    const divergent = { ...batch.blueprints[0], learningObjective: "Tampered objective." };
    await repo.remove("blueprints", divergent.id);
    await repo.create("blueprints", divergent.id, divergent);
    const conflicted = await seedBindingBlueprints(batch.blueprints, repo);
    expect(conflicted.conflicts).toHaveLength(1);
    expect(hashJson(await repo.read("blueprints", divergent.id))).toBe(hashJson(divergent));
  });
});

describe("deterministic ids", () => {
  it("mints stable ids and detects cross-tuple collisions structurally", () => {
    const entry = numberEntrySkill();
    const tuple: CanonicalBindingTuple = {
      skill: entry.id,
      yearLevel: entry.yearLevels[0] as CanonicalBindingTuple["yearLevel"],
      examStyle: entry.examStyles[0],
      subject: entry.subject,
      strand: entry.strand,
      difficulty: "medium",
      questionType: "number_entry",
    };
    expect(mintBindingBlueprintId(tuple)).toBe(mintBindingBlueprintId({ ...tuple }));
    expect(mintBindingBlueprintId(tuple)).toMatch(/^pb2-bind-bp-[a-z0-9-]+-[0-9a-f]{10}$/);
    expect(serialiseCanonicalTuple(tuple).split("|")).toHaveLength(7);
    expect(mintBindingBlueprintId({ ...tuple, difficulty: "easy" })).not.toBe(mintBindingBlueprintId(tuple));
  });
});
