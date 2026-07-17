/**
 * Read-only preflight remediation coverage: blueprint resolution during
 * binding preflight must never mutate the workspace — most critically, a
 * MALFORMED stored blueprint must be refused without the quarantine repair
 * that ordinary `FactoryRepository.read()` performs. Also covers the
 * hardened lstat snapshot utility's link handling. Real filesystem
 * storage throughout; no mocks.
 */
import * as fs from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  generateBindingArtefacts,
  runBindingPreflight,
  seedBindingBlueprints,
  type BindingManifest,
} from "@/features/question-factory/binding";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import type { FactoryCompartment, FactoryRepository, RecordInspection } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { skillTaxonomyRegistry } from "@/features/question-factory/taxonomy";

import { snapshotWorkspace } from "./workspace-snapshot";

const FROZEN_FINGERPRINT = "3c1b120ae03ce49311acd5a1eae575dadf42cfa0bc840475229ea6ac21945e3c";
const PACK = "ro-pack.json";

let rootDir: string;
let workspaceRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "binding-ro-preflight-"));
  workspaceRoot = path.join(rootDir, "workspace");
  inboxRoot = path.join(rootDir, "inbox");
  await fs.mkdir(workspaceRoot, { recursive: true });
  await fs.mkdir(inboxRoot, { recursive: true });
  repo = new FsFactoryRepository(workspaceRoot);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

const entry = () =>
  skillTaxonomyRegistry.entries.find(
    (candidate) => candidate.recommendedQuestionTypes.includes("number_entry") && candidate.supportedDifficulties.includes("medium"),
  )!;

function candidateFixture(id: string, left: number, right: number): Record<string, unknown> {
  const skill = entry();
  return {
    id,
    type: "number_entry",
    yearLevel: skill.yearLevels[0],
    examStyle: skill.examStyles[0],
    prompt: `What is ${left} + ${right}?`,
    answerKey: { kind: "number", value: left + right },
    explanation: `${left} + ${right} = ${left + right}.`,
    metadata: {
      subject: skill.subject,
      strand: skill.strand,
      skill: skill.id,
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
  };
}

async function prepare(options: { seed?: boolean } = {}): Promise<{ manifest: BindingManifest; blueprints: readonly unknown[]; blueprintId: string }> {
  const packContent = JSON.stringify([candidateFixture("ro-c1", 12, 34)], null, 2) + "\n";
  const generated = generateBindingArtefacts({
    batchId: "ro",
    frozenFingerprint: FROZEN_FINGERPRINT,
    packs: [{ fileName: PACK, rawContent: packContent }],
    generatedAt: "2026-07-17T00:00:00.000Z",
  });
  if (!generated.ok) throw new Error("fixture generation failed");
  await fs.writeFile(path.join(inboxRoot, PACK), packContent, "utf8");
  if (options.seed !== false) {
    const seeded = await seedBindingBlueprints(generated.blueprints, repo);
    expect(seeded.conflicts).toEqual([]);
  }
  return { manifest: generated.manifest, blueprints: generated.blueprints, blueprintId: generated.manifest.bindings[0].blueprintId };
}

const request = (manifest: BindingManifest) =>
  ({
    source: "claude",
    batchId: "ro",
    promptVersion: "ro-v1",
    pipelineRunId: "ro-run",
    inboxRoot,
    bindingManifest: manifest,
    expectedFrozenFingerprint: FROZEN_FINGERPRINT,
  }) as never;

const blueprintFilePath = (blueprintId: string) => path.join(workspaceRoot, "blueprints", `${blueprintId}.json`);

async function expectUntouchedBindingRefusal(before: string, outcome: Awaited<ReturnType<typeof runManualIngestion>>, pattern: RegExp): Promise<void> {
  expect(outcome.status).toBe("request_invalid");
  if (outcome.status === "request_invalid") {
    expect(outcome.issueCode).toBe("binding_manifest_invalid");
    expect(outcome.message).toMatch(pattern);
  }
  const after = await snapshotWorkspace([workspaceRoot, inboxRoot]);
  expect(after).toBe(before);
  expect(after).not.toContain(".locks");
  expect(after).not.toContain("quarantined");
  expect(after).not.toContain(".quarantine-reports");
  expect(after).not.toContain(".processing");
}

describe("malformed stored blueprints during preflight (the audited defect)", () => {
  it("1+13+14. pre-lock refusal of a malformed blueprint leaves the complete lstat snapshot identical — no quarantine, no report, no lock residue", async () => {
    const { manifest, blueprintId } = await prepare({ seed: false });
    const malformed = "{ this is deliberately NOT valid JSON ]";
    await fs.mkdir(path.dirname(blueprintFilePath(blueprintId)), { recursive: true });
    await fs.writeFile(blueprintFilePath(blueprintId), malformed, "utf8");

    const before = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    const outcome = await runManualIngestion(request(manifest), repo);
    await expectUntouchedBindingRefusal(before, outcome, /blueprint_unresolved/);
    // The malformed original is byte-identical, exactly where it was.
    expect(await fs.readFile(blueprintFilePath(blueprintId), "utf8")).toBe(malformed);
  });

  it("2. a blueprint that becomes malformed between the pre-lock preflight and the under-lock revalidation is refused without repair", async () => {
    const { manifest, blueprintId } = await prepare();
    const malformed = "{ corrupted mid-run ]";

    // Real-filesystem race simulation: the second (under-lock) preflight
    // observes a file that was corrupted after the first preflight passed.
    let blueprintInspections = 0;
    const racingRepo: FactoryRepository = {
      create: repo.create.bind(repo),
      read: repo.read.bind(repo),
      exists: repo.exists.bind(repo),
      remove: repo.remove.bind(repo),
      list: repo.list.bind(repo),
      move: repo.move.bind(repo),
      update: repo.update.bind(repo),
      reconcile: repo.reconcile.bind(repo),
      inspectRecord: async (compartment: FactoryCompartment, candidateId: string): Promise<RecordInspection> => {
        if (compartment === "blueprints") {
          blueprintInspections += 1;
          if (blueprintInspections === 2) {
            await fs.writeFile(blueprintFilePath(blueprintId), malformed, "utf8");
          }
        }
        return repo.inspectRecord(compartment, candidateId);
      },
    };

    const outcome = await runManualIngestion(request(manifest), racingRepo);
    expect(blueprintInspections).toBeGreaterThanOrEqual(2);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status === "request_invalid") expect(outcome.message).toMatch(/blueprint_unresolved/);
    // No repair, no quarantine, no lock residue; the corrupted bytes remain.
    expect(await fs.readFile(blueprintFilePath(blueprintId), "utf8")).toBe(malformed);
    const after = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    expect(after).not.toContain("quarantined");
    expect(after).not.toContain(".quarantine-reports");
    expect(after).not.toContain(".locks");
    expect(await repo.list("generated")).toEqual([]);
  });

  it("3. a missing blueprint refuses untouched", async () => {
    const { manifest } = await prepare({ seed: false });
    const before = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    const outcome = await runManualIngestion(request(manifest), repo);
    await expectUntouchedBindingRefusal(before, outcome, /blueprint_unresolved/);
  });

  it("4. valid JSON that fails the blueprint schema refuses untouched", async () => {
    const { manifest, blueprintId } = await prepare({ seed: false });
    await repo.create("blueprints", blueprintId, { id: blueprintId, definitely: "not a blueprint" });
    const before = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    const outcome = await runManualIngestion(request(manifest), repo);
    await expectUntouchedBindingRefusal(before, outcome, /blueprint_unresolved|blueprint_hash_mismatch/);
  });

  it("5. a valid blueprint stored under the bound id but with different content (wrong kind/identity) refuses untouched", async () => {
    const { manifest, blueprints, blueprintId } = await prepare({ seed: false });
    const impostor = { ...(blueprints[0] as Record<string, unknown>), learningObjective: "A different blueprint entirely." };
    await repo.create("blueprints", blueprintId, impostor);
    const before = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    const outcome = await runManualIngestion(request(manifest), repo);
    await expectUntouchedBindingRefusal(before, outcome, /blueprint_hash_mismatch/);
  });

  it("6+15. a valid blueprint resolves and the run completes; replay stays idempotent", async () => {
    const { manifest } = await prepare();
    const outcome = await runManualIngestion(request(manifest), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status === "completed") expect(outcome.result.candidatesCreated).toBe(1);
    const packContent = JSON.stringify([candidateFixture("ro-c1", 12, 34)], null, 2) + "\n";
    await fs.writeFile(path.join(inboxRoot, PACK), packContent, "utf8");
    const replay = await runManualIngestion(request(manifest), repo);
    expect(replay.status).toBe("completed");
    if (replay.status === "completed") {
      expect(replay.result.candidatesReplayed).toBe(1);
      expect(replay.result.candidatesCreated).toBe(0);
    }
  });
});

describe("inspection vs operational read separation", () => {
  it("7. ordinary read() retains the operational quarantine repair (intentional, outside preflight)", async () => {
    await fs.mkdir(path.join(workspaceRoot, "blueprints"), { recursive: true });
    await fs.writeFile(path.join(workspaceRoot, "blueprints", "broken-bp.json"), "not json at all", "utf8");
    const result = await repo.read("blueprints", "broken-bp");
    expect(result).toBeUndefined();
    // Repaired: original moved to quarantine, report written.
    await expect(fs.readFile(path.join(workspaceRoot, "blueprints", "broken-bp.json"), "utf8")).rejects.toThrow();
    const after = await snapshotWorkspace([workspaceRoot]);
    expect(after).toContain("quarantined");
    expect(after).toContain(".quarantine-reports");
  });

  it("8. inspectRecord() never repairs: malformed content is reported and left byte-identical", async () => {
    await fs.mkdir(path.join(workspaceRoot, "blueprints"), { recursive: true });
    const malformed = "also not json {";
    await fs.writeFile(path.join(workspaceRoot, "blueprints", "broken-bp.json"), malformed, "utf8");
    const before = await snapshotWorkspace([workspaceRoot]);
    const inspection = await repo.inspectRecord("blueprints", "broken-bp");
    expect(inspection.status).toBe("malformed");
    expect(await snapshotWorkspace([workspaceRoot])).toBe(before);
    expect(await fs.readFile(path.join(workspaceRoot, "blueprints", "broken-bp.json"), "utf8")).toBe(malformed);
  });

  it("runBindingPreflight itself (the function both call sites share) never mutates on a malformed blueprint", async () => {
    const { manifest, blueprintId } = await prepare({ seed: false });
    await fs.mkdir(path.dirname(blueprintFilePath(blueprintId)), { recursive: true });
    await fs.writeFile(blueprintFilePath(blueprintId), "]]] broken", "utf8");
    const packContent = await fs.readFile(path.join(inboxRoot, PACK), "utf8");
    const before = await snapshotWorkspace([workspaceRoot]);
    const outcome = await runBindingPreflight(manifest, "ro", FROZEN_FINGERPRINT, [{ fileName: PACK, rawContent: packContent, root: "inbox" }], repo);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.failures.some((failure) => failure.code === "blueprint_unresolved")).toBe(true);
    expect(await snapshotWorkspace([workspaceRoot])).toBe(before);
  });
});

describe("hardened lstat snapshot: links and junctions", () => {
  it("9+10. a directory junction is captured as a link with its target, is not followed, and a loop back into the workspace cannot hang the walk", async () => {
    const realDir = path.join(workspaceRoot, "real-dir");
    await fs.mkdir(realDir, { recursive: true });
    await fs.writeFile(path.join(realDir, "inner.txt"), "inner", "utf8");
    const junctionPath = path.join(workspaceRoot, "junction-entry");
    await fs.symlink(realDir, junctionPath, "junction");
    // Loop: a junction pointing back at the workspace root itself.
    const loopPath = path.join(workspaceRoot, "loop-entry");
    await fs.symlink(workspaceRoot, loopPath, "junction");

    const snap = await snapshotWorkspace([workspaceRoot]);
    expect(snap).toMatch(/L .*junction-entry -> .*real-dir/);
    expect(snap).toMatch(/L .*loop-entry -> /);
    // Not followed: inner.txt appears exactly once (under the real path).
    expect(snap.match(/inner\.txt/g)?.length).toBe(1);
  });

  it("11. changing a junction's target changes the snapshot", async () => {
    const dirA = path.join(workspaceRoot, "dir-a");
    const dirB = path.join(workspaceRoot, "dir-b");
    await fs.mkdir(dirA);
    await fs.mkdir(dirB);
    const link = path.join(workspaceRoot, "swinging-link");
    await fs.symlink(dirA, link, "junction");
    const first = await snapshotWorkspace([workspaceRoot]);
    await fs.rm(link, { recursive: false, force: true });
    await fs.symlink(dirB, link, "junction");
    const second = await snapshotWorkspace([workspaceRoot]);
    expect(second).not.toBe(first);
  });

  it("12. replacing a directory with a junction (and back) changes the snapshot's entry type", async () => {
    const target = path.join(workspaceRoot, "target-dir");
    await fs.mkdir(target);
    const spot = path.join(workspaceRoot, "spot");
    await fs.mkdir(spot);
    const asDir = await snapshotWorkspace([workspaceRoot]);
    expect(asDir).toMatch(/D .*spot/);
    await fs.rmdir(spot);
    await fs.symlink(target, spot, "junction");
    const asLink = await snapshotWorkspace([workspaceRoot]);
    expect(asLink).toMatch(/L .*spot -> /);
    expect(asLink).not.toBe(asDir);
    await fs.rm(spot, { force: true });
    await fs.mkdir(spot);
    const asDirAgain = await snapshotWorkspace([workspaceRoot]);
    expect(asDirAgain).toMatch(/D .*spot/);
    expect(asDirAgain).not.toBe(asLink);
  });

  it("12b. replacing a file with a link is visible where file symlinks are creatable (skipped without privilege)", async () => {
    const target = path.join(workspaceRoot, "target.txt");
    await fs.writeFile(target, "target", "utf8");
    const spot = path.join(workspaceRoot, "file-spot.txt");
    await fs.writeFile(spot, "plain file", "utf8");
    const asFile = await snapshotWorkspace([workspaceRoot]);
    await fs.rm(spot);
    try {
      await fs.symlink(target, spot, "file");
    } catch (error) {
      // Windows without Developer Mode/admin: file symlinks are privileged.
      console.warn(`file-symlink sub-case skipped: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    const asLink = await snapshotWorkspace([workspaceRoot]);
    expect(asLink).toMatch(/L .*file-spot\.txt -> /);
    expect(asLink).not.toBe(asFile);
  });
});

/**
 * PB2 blueprint-binding governed-authority remediation: the audited
 * defect was `readOnlyRepositoryView()` silently falling back to a
 * mutating `repository.read()` whenever `inspectRecord` was unavailable
 * — a wrapped/decorated repository (exactly the shape dependency
 * injection produces) could omit `inspectRecord` and reintroduce the
 * original zero-write defect. `resolveReadOnlyRepository` +
 * `toInspectionOnlyView` (`binding/preflight.ts`) replace that fallback
 * with a deterministic governed refusal (`read_only_inspection_unavailable`)
 * that never calls `read()` at all — proven below with a repository whose
 * `read()` is deliberately instrumented to mutate, so a silent fallback
 * would be caught red-handed rather than merely inferred from a green
 * assertion.
 */
describe("mandatory read-only inspection capability (governed-authority remediation)", () => {
  /** Every method except `inspectRecord`, delegating to the real `repo` — the exact shape a decorator/wrapper that forgets `inspectRecord` produces. */
  function repositoryWithoutInspection(overrides: Partial<FactoryRepository> = {}): FactoryRepository {
    return {
      create: repo.create.bind(repo),
      read: repo.read.bind(repo),
      exists: repo.exists.bind(repo),
      remove: repo.remove.bind(repo),
      list: repo.list.bind(repo),
      move: repo.move.bind(repo),
      update: repo.update.bind(repo),
      reconcile: repo.reconcile.bind(repo),
      ...overrides,
    };
  }

  it("1. a repository with inspectRecord() continues to succeed normally (baseline)", async () => {
    const { manifest } = await prepare();
    const outcome = await runManualIngestion(request(manifest), repo);
    expect(outcome.status).toBe("completed");
  });

  it("2. a repository without inspectRecord() fails closed with read_only_inspection_unavailable", async () => {
    const { manifest } = await prepare();
    const before = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    const outcome = await runManualIngestion(request(manifest), repositoryWithoutInspection());
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status === "request_invalid") {
      // PB2 follow-up: the inspection-unavailable refusal is now hoisted to
      // the very top of the binding path and carries its own distinct
      // issue code, rather than surfacing later as a generic
      // binding_manifest_invalid preflight failure.
      expect(outcome.issueCode).toBe("read_only_inspection_unavailable");
      expect(outcome.message).toMatch(/inspectRecord/);
    }
    expect(await snapshotWorkspace([workspaceRoot, inboxRoot])).toBe(before);
  });

  it("3. a repository without inspectRecord() never has its read() called during preflight", async () => {
    const { manifest } = await prepare();
    let readCalls = 0;
    const countingRepo = repositoryWithoutInspection({
      read: async (compartment, candidateId) => {
        readCalls += 1;
        return repo.read(compartment, candidateId);
      },
    });
    const outcome = await runManualIngestion(request(manifest), countingRepo);
    expect(outcome.status).toBe("request_invalid");
    expect(readCalls).toBe(0);
  });

  it("4. a repository whose read() deliberately mutates (creates a marker file) is never touched — preflight refuses without ever calling it", async () => {
    const { manifest } = await prepare();
    const markerPath = path.join(rootDir, "read-was-called.marker");
    let readCalls = 0;
    const trapRepo = repositoryWithoutInspection({
      read: async (compartment, candidateId) => {
        readCalls += 1;
        // Deliberately mutating: a real `read()` that "repairs" by moving
        // a file is exactly the shape of the original audited defect.
        await fs.writeFile(markerPath, "read() was called", "utf8");
        return repo.read(compartment, candidateId);
      },
    });
    const before = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    const outcome = await runManualIngestion(request(manifest), trapRepo);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status === "request_invalid") {
      expect(outcome.issueCode).toBe("read_only_inspection_unavailable");
      expect(outcome.message).toMatch(/inspectRecord/);
    }
    expect(readCalls).toBe(0);
    await expect(fs.access(markerPath)).rejects.toThrow();
    expect(await snapshotWorkspace([workspaceRoot, inboxRoot])).toBe(before);
  });

  it("5. a wrapped FsFactoryRepository that hides inspectRecord (the exact dependency-injection shape of the audited defect) returns a governed refusal with full snapshot identity", async () => {
    const { manifest, blueprintId } = await prepare({ seed: false });
    const malformed = "{ this is deliberately NOT valid JSON ]";
    await fs.mkdir(path.dirname(blueprintFilePath(blueprintId)), { recursive: true });
    await fs.writeFile(blueprintFilePath(blueprintId), malformed, "utf8");

    const before = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    const outcome = await runManualIngestion(request(manifest), repositoryWithoutInspection());
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status === "request_invalid") {
      expect(outcome.issueCode).toBe("read_only_inspection_unavailable");
      expect(outcome.message).toMatch(/inspectRecord/);
    }
    // 6. Malformed blueprint remains byte-identical — the wrapped
    // repository's read() (which would have quarantined it) was never
    // invoked at all.
    expect(await fs.readFile(blueprintFilePath(blueprintId), "utf8")).toBe(malformed);
    // 7/8/9/10. No quarantined/, no .quarantine-reports/, no .locks/, no
    // .processing/ — and the full lstat snapshot (11: no repository,
    // provenance, or report writes of any kind) is byte-identical.
    const after = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    expect(after).toBe(before);
    expect(after).not.toContain("quarantined");
    expect(after).not.toContain(".quarantine-reports");
    expect(after).not.toContain(".locks");
    expect(after).not.toContain(".processing");
    expect(await repo.list("generated")).toEqual([]);
    expect(await repo.list("review-queue")).toEqual([]);
    expect(await repo.list("reports")).toEqual([]);
  });

  it("12. runBindingPreflight itself (the exact function both the pre-lock and under-lock call sites share) refuses without inspection capability — proving both positions are covered by the same enforced check", async () => {
    const { manifest } = await prepare();
    const packContent = await fs.readFile(path.join(inboxRoot, PACK), "utf8");
    const before = await snapshotWorkspace([workspaceRoot]);
    const outcome = await runBindingPreflight(
      manifest,
      "ro",
      FROZEN_FINGERPRINT,
      [{ fileName: PACK, rawContent: packContent, root: "inbox" }],
      repositoryWithoutInspection(),
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.failures.some((failure) => failure.code === "read_only_inspection_unavailable")).toBe(true);
    expect(await snapshotWorkspace([workspaceRoot])).toBe(before);
  });

  it("a repository with a genuine inspectRecord() is unaffected by the new gate — full round trip still succeeds and replays idempotently", async () => {
    const { manifest } = await prepare();
    const first = await runManualIngestion(request(manifest), repo);
    expect(first.status).toBe("completed");
    const packContent = JSON.stringify([candidateFixture("ro-c1", 12, 34)], null, 2) + "\n";
    await fs.writeFile(path.join(inboxRoot, PACK), packContent, "utf8");
    const replay = await runManualIngestion(request(manifest), repo);
    expect(replay.status).toBe("completed");
    if (replay.status === "completed") expect(replay.result.candidatesReplayed).toBe(1);
  });
});

/**
 * PB2 blueprint-binding follow-up: the prompt-pack cross-check was the last
 * repository read on a binding run's path that still went through the
 * repairing `read()` (which quarantines a malformed record). It now runs
 * through the mandatory non-mutating inspection capability, resolved and
 * fail-closed at the very top of the binding path — so a malformed stored
 * prompt pack is reported and refused, never quarantined, and a repository
 * lacking inspection is refused before the read is ever attempted. The
 * operational (non-binding) run keeps its repairing read unchanged.
 */
describe("binding-run prompt-pack cross-check is non-mutating (PB2 follow-up)", () => {
  const bindingRequestWithPromptHash = (manifest: BindingManifest, promptHash: string) =>
    ({
      source: "claude",
      batchId: "ro",
      promptVersion: "ro-v1",
      pipelineRunId: "ro-run",
      inboxRoot,
      bindingManifest: manifest,
      expectedFrozenFingerprint: FROZEN_FINGERPRINT,
      promptHash,
    }) as never;

  const promptPackPath = path.join(workspaceRoot, "reports", "prompt-pack-ro.json");

  function repositoryWithoutInspection(overrides: Partial<FactoryRepository> = {}): FactoryRepository {
    return {
      create: repo.create.bind(repo),
      read: repo.read.bind(repo),
      exists: repo.exists.bind(repo),
      remove: repo.remove.bind(repo),
      list: repo.list.bind(repo),
      move: repo.move.bind(repo),
      update: repo.update.bind(repo),
      reconcile: repo.reconcile.bind(repo),
      ...overrides,
    };
  }

  it("A1. a malformed stored prompt pack is refused (prompt_pack_unreadable) without quarantine — workspace byte-identical", async () => {
    const { manifest } = await prepare();
    await fs.mkdir(path.join(workspaceRoot, "reports"), { recursive: true });
    const malformed = "{ prompt pack not valid json ]";
    await fs.writeFile(promptPackPath, malformed, "utf8");

    const before = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    const outcome = await runManualIngestion(bindingRequestWithPromptHash(manifest, "abc"), repo);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status === "request_invalid") expect(outcome.issueCode).toBe("prompt_pack_unreadable");
    // Not quarantined: the malformed bytes remain exactly where they were.
    expect(await fs.readFile(promptPackPath, "utf8")).toBe(malformed);
    const after = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    expect(after).toBe(before);
    expect(after).not.toContain("quarantined");
    expect(after).not.toContain(".quarantine-reports");
    expect(after).not.toContain(".locks");
    expect(after).not.toContain(".processing");
  });

  it("A2. no inspection capability + malformed prompt pack: refused before the prompt-pack read is ever attempted (read spy stays 0)", async () => {
    const { manifest } = await prepare();
    await fs.mkdir(path.join(workspaceRoot, "reports"), { recursive: true });
    const malformed = "{ prompt pack not valid json ]";
    await fs.writeFile(promptPackPath, malformed, "utf8");
    let readCalls = 0;
    const countingRepo = repositoryWithoutInspection({
      read: async (compartment, candidateId) => {
        readCalls += 1;
        return repo.read(compartment, candidateId);
      },
    });
    const before = await snapshotWorkspace([workspaceRoot, inboxRoot]);
    const outcome = await runManualIngestion(bindingRequestWithPromptHash(manifest, "abc"), countingRepo);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status === "request_invalid") expect(outcome.issueCode).toBe("read_only_inspection_unavailable");
    expect(readCalls).toBe(0);
    expect(await fs.readFile(promptPackPath, "utf8")).toBe(malformed);
    expect(await snapshotWorkspace([workspaceRoot, inboxRoot])).toBe(before);
  });

  it("A3. a present, mismatched prompt pack is refused (prompt_pack_reference_mismatch) via inspection", async () => {
    const { manifest } = await prepare();
    await repo.create("reports", "prompt-pack-ro", { pack: { promptVersion: "ro-v1" }, promptHash: "the-real-hash" });
    const outcome = await runManualIngestion(bindingRequestWithPromptHash(manifest, "a-different-hash"), repo);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status === "request_invalid") expect(outcome.issueCode).toBe("prompt_pack_reference_mismatch");
  });

  it("A4. a present, matching prompt pack lets the binding run complete", async () => {
    const { manifest } = await prepare();
    await repo.create("reports", "prompt-pack-ro", { pack: { promptVersion: "ro-v1" }, promptHash: "the-real-hash" });
    const outcome = await runManualIngestion(bindingRequestWithPromptHash(manifest, "the-real-hash"), repo);
    expect(outcome.status).toBe("completed");
  });

  it("A5. an absent prompt pack skips the check and the binding run completes", async () => {
    const { manifest } = await prepare();
    const outcome = await runManualIngestion(bindingRequestWithPromptHash(manifest, "any-hash"), repo);
    expect(outcome.status).toBe("completed");
  });

  it("A6. a NON-binding run keeps the operational repairing read (out of scope) — a malformed prompt pack is still quarantined", async () => {
    await fs.mkdir(path.join(workspaceRoot, "reports"), { recursive: true });
    await fs.writeFile(promptPackPath, "{ malformed operational report ]", "utf8");
    const nonBindingRequest = {
      source: "claude",
      batchId: "ro",
      promptVersion: "ro-v1",
      pipelineRunId: "ro-run",
      inboxRoot,
      promptHash: "any-hash",
    } as never;
    const outcome = await runManualIngestion(nonBindingRequest, repo);
    expect(outcome.status).toBe("completed");
    // The operational read repaired (quarantined) the malformed record — the
    // behaviour we deliberately did NOT change for non-binding runs.
    const after = await snapshotWorkspace([workspaceRoot]);
    expect(after).toContain("quarantined");
  });
});
