/**
 * Pre-run hardening coverage for the blueprint-binding workflow:
 * deterministic timestamps, defensive manifest-version validation,
 * required expected-fingerprint comparison, and canonical pack ordering.
 * Real filesystem storage throughout; no mocks.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  generateBindingArtefacts,
  seedBindingBlueprints,
  type BindingManifest,
} from "@/features/question-factory/binding";
import { runManualIngestion } from "@/features/question-factory/manual-ingestion";
import { hashJson } from "@/features/question-factory/provenance";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { skillTaxonomyRegistry } from "@/features/question-factory/taxonomy";

const FROZEN_FINGERPRINT = "3c1b120ae03ce49311acd5a1eae575dadf42cfa0bc840475229ea6ac21945e3c";
const PINNED_AT = "2026-07-17T00:00:00.000Z";

let rootDir: string;
let workspaceRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "binding-hardening-"));
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

function candidateFixture(id: string, left: number, right: number, difficulty = "medium"): Record<string, unknown> {
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
      difficulty,
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
  };
}

const packs = () => [
  { fileName: "hard-pack-a.json", rawContent: JSON.stringify([candidateFixture("hard-a1", 12, 34)], null, 2) + "\n" },
  { fileName: "hard-pack-b.json", rawContent: JSON.stringify([candidateFixture("hard-b1", 21, 43, "easy")], null, 2) + "\n" },
];

const generate = (packInputs = packs(), generatedAt = PINNED_AT) =>
  generateBindingArtefacts({ batchId: "hard", frozenFingerprint: FROZEN_FINGERPRINT, packs: packInputs, generatedAt });

/**
 * COMPLETE recursive filesystem snapshot: every directory (including empty
 * and hidden ones — `.locks`, `.processing`, …) and every file with its
 * exact bytes. Nothing is excluded, so "byte-identical" here really means
 * no new directory, no new file, no rename and no changed byte anywhere
 * under the workspace or inbox roots.
 */
async function snapshot(): Promise<string> {
  const lines: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return;
    }
    lines.push(`D ${dir}`);
    for (const name of entries.sort()) {
      const full = path.join(dir, name);
      const stats = await fs.stat(full);
      if (stats.isDirectory()) await walk(full);
      else lines.push(`F ${full} ${createHash("sha256").update(await fs.readFile(full)).digest("hex")}`);
    }
  }
  await walk(workspaceRoot);
  await walk(inboxRoot);
  return lines.join("\n");
}

async function stageAndSeed(manifest: BindingManifest, blueprints: readonly unknown[], packInputs = packs()): Promise<void> {
  for (const pack of packInputs) await fs.writeFile(path.join(inboxRoot, pack.fileName), pack.rawContent, "utf8");
  const seeded = await seedBindingBlueprints(blueprints as never, repo);
  expect(seeded.conflicts).toEqual([]);
  void manifest;
}

const baseRequest = (manifest: BindingManifest, overrides: Record<string, unknown> = {}) =>
  ({
    source: "claude",
    batchId: "hard",
    promptVersion: "hardening-v1",
    pipelineRunId: "hard-run",
    inboxRoot,
    bindingManifest: manifest,
    expectedFrozenFingerprint: FROZEN_FINGERPRINT,
    ...overrides,
  }) as never;

describe("deterministic timestamps and ordering", () => {
  it("identical inputs with a pinned timestamp produce byte-identical artefacts", () => {
    const first = generate();
    const second = generate();
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(JSON.stringify(second.manifest)).toBe(JSON.stringify(first.manifest));
      expect(JSON.stringify(second.blueprints)).toBe(JSON.stringify(first.blueprints));
      expect(second.evidence.manifestHash).toBe(first.evidence.manifestHash);
      expect(second.evidence.blueprintSetHash).toBe(first.evidence.blueprintSetHash);
    }
  });

  it("a different timestamp changes only generatedAt (bindings, packs and blueprints identical); pinning is the reproducibility mechanism", () => {
    const first = generate();
    const later = generate(packs(), "2026-07-18T12:00:00.000Z");
    expect(first.ok && later.ok).toBe(true);
    if (first.ok && later.ok) {
      expect(hashJson(later.manifest.bindings)).toBe(hashJson(first.manifest.bindings));
      expect(hashJson(later.manifest.packs)).toBe(hashJson(first.manifest.packs));
      expect(hashJson(later.blueprints)).toBe(hashJson(first.blueprints));
      expect(later.evidence.manifestHash).not.toBe(first.evidence.manifestHash);
    }
  });

  it("caller-supplied pack order does not change the generated artefacts", () => {
    const forward = generate();
    const reversed = generate([...packs()].reverse());
    expect(forward.ok && reversed.ok).toBe(true);
    if (forward.ok && reversed.ok) {
      expect(JSON.stringify(reversed.manifest)).toBe(JSON.stringify(forward.manifest));
      expect(JSON.stringify(reversed.blueprints)).toBe(JSON.stringify(forward.blueprints));
    }
  });
});

/** Asserts a preflight refusal left the workspace completely untouched: expected refusal, no `.locks`, no new directory/file, no changed bytes (which also covers repository records, provenance and reports). */
async function expectUntouchedRefusal(
  before: string,
  outcome: Awaited<ReturnType<typeof runManualIngestion>>,
  messagePattern: RegExp,
): Promise<void> {
  expect(outcome.status).toBe("request_invalid");
  if (outcome.status === "request_invalid") {
    expect(outcome.issueCode).toBe("binding_manifest_invalid");
    expect(outcome.message).toMatch(messagePattern);
  }
  const after = await snapshot();
  expect(after).toBe(before);
  expect(after).not.toContain(".locks");
}

describe("zero-write preflight refusals (audited defect regression)", () => {
  it("unsupported manifestVersion: the exact audited case — refusal with a fully byte-identical workspace, no .locks", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    const before = await snapshot();
    expect(before).not.toContain(".locks");
    const futureVersion = { ...generated.manifest, manifestVersion: "999" } as unknown as BindingManifest;
    const outcome = await runManualIngestion(baseRequest(futureVersion), repo);
    await expectUntouchedRefusal(before, outcome, /manifest_version_unsupported|manifestVersion/);
  });

  it("malformed expected fingerprint refuses untouched", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    const before = await snapshot();
    const outcome = await runManualIngestion(baseRequest(generated.manifest, { expectedFrozenFingerprint: "NOT-A-HASH" }), repo);
    await expectUntouchedRefusal(before, outcome, /expectedFrozenFingerprint|64-hex/);
  });

  it("malformed manifest object (typed-caller junk) refuses untouched via defensive schema re-validation", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    const before = await snapshot();
    const junk = { manifestVersion: "1", bindings: "not-an-array" } as unknown as BindingManifest;
    const outcome = await runManualIngestion(baseRequest(junk), repo);
    await expectUntouchedRefusal(before, outcome, /schema validation/);
  });

  it("invalid binding reference (unknown candidate) refuses untouched", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    const before = await snapshot();
    const withGhost = {
      ...generated.manifest,
      bindings: [...generated.manifest.bindings, { ...generated.manifest.bindings[0], candidateKey: "ghost-candidate" }],
    } as BindingManifest;
    const outcome = await runManualIngestion(baseRequest(withGhost), repo);
    await expectUntouchedRefusal(before, outcome, /binding_unknown_candidate/);
  });

  it("successful preflight acquires the lock normally, ingests, and releases without residue", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    const outcome = await runManualIngestion(baseRequest(generated.manifest), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status === "completed") expect(outcome.result.candidatesCreated).toBe(2);
    // Lock fully released: no scan.lock file, and the transient .locks
    // directory itself is removed on release.
    const after = await snapshot();
    expect(after).not.toContain("scan.lock");
    expect(after).not.toContain(".locks");
    // Replay is idempotent after re-drop.
    for (const pack of packs()) await fs.writeFile(path.join(inboxRoot, pack.fileName), pack.rawContent, "utf8");
    const replay = await runManualIngestion(baseRequest(generated.manifest), repo);
    expect(replay.status).toBe("completed");
    if (replay.status === "completed") {
      expect(replay.result.candidatesReplayed).toBe(2);
      expect(replay.result.candidatesCreated).toBe(0);
    }
  });

  it("a valid manifest still respects the scan lock (concurrency protection unweakened)", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    // A foreign run holds the lock.
    const lockRoot = path.join(inboxRoot, ".locks");
    await fs.mkdir(lockRoot, { recursive: true });
    await fs.writeFile(path.join(lockRoot, "scan.lock"), JSON.stringify({ token: "foreign" }), "utf8");
    const before = await snapshot();
    const outcome = await runManualIngestion(baseRequest(generated.manifest), repo, { lockMaxWaitMs: 100, lockRetryDelayMs: 10 } as never);
    expect(outcome.status).toBe("lock_timeout");
    expect(await snapshot()).toBe(before);
  });
});

describe("fingerprint and version enforcement (zero-write)", () => {
  it("refuses when the run's expected fingerprint differs from the manifest's declaration", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    const before = await snapshot();
    const outcome = await runManualIngestion(baseRequest(generated.manifest, { expectedFrozenFingerprint: "0".repeat(64) }), repo);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status === "request_invalid") {
      expect(outcome.issueCode).toBe("binding_manifest_invalid");
      expect(outcome.message).toMatch(/fingerprint_mismatch/);
    }
    expect(await snapshot()).toBe(before);
  });

  it("refuses a binding run that declares no expected fingerprint", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    const before = await snapshot();
    const outcome = await runManualIngestion(baseRequest(generated.manifest, { expectedFrozenFingerprint: undefined }), repo);
    expect(outcome.status).toBe("request_invalid");
    expect(await snapshot()).toBe(before);
  });

  it("refuses an unsupported manifest version at library level, even from a typed caller", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    const before = await snapshot();
    const futureVersion = { ...generated.manifest, manifestVersion: "999" } as unknown as BindingManifest;
    const outcome = await runManualIngestion(baseRequest(futureVersion), repo);
    expect(outcome.status).toBe("request_invalid");
    // The pre-lock defensive schema re-validation catches the version first;
    // runBindingPreflight's own manifest_version_unsupported remains as the
    // second line of defence for any caller that bypasses the wrapper.
    if (outcome.status === "request_invalid") expect(outcome.message).toMatch(/manifest_version_unsupported|manifestVersion/);
    expect(await snapshot()).toBe(before);
  });

  it("a matching expected fingerprint proceeds to a successful bound ingestion", async () => {
    const generated = generate();
    if (!generated.ok) throw new Error("fixture generation failed");
    await stageAndSeed(generated.manifest, generated.blueprints);
    const outcome = await runManualIngestion(baseRequest(generated.manifest), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status === "completed") expect(outcome.result.candidatesCreated).toBe(2);
  });
});
