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
