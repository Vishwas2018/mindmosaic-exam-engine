// @vitest-environment node
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import snapshot from "@/tests/fixtures/legacy-import/source-snapshot.json";
import { prepareScholarshipLegacyManifest } from "@/features/question-factory/legacy-import/bindings";
import { preflightLegacyImport } from "@/features/question-factory/legacy-import/preflight";
import { importLegacyBatch } from "@/features/question-factory/legacy-import/import";
import { buildLegacyRecord } from "@/features/question-factory/legacy-import/record";
import { GitLegacySourceReader, sha256 } from "@/features/question-factory/legacy-import/source";
import { candidateProvenanceSchema } from "@/features/question-factory/provenance/candidate-provenance";
import { identitiesAreIndependent, identitiesAreIndependentForJudgementReview, normaliseIdentity } from "@/features/question-factory/config/identity-normalisation";
import { appendReviewRecord, hashJson, isProductionGradeIndependentReview } from "@/features/question-factory/provenance";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { validateCandidateStructure } from "@/features/question-factory/validation";
import { checkPublicationEligibility } from "@/features/question-factory/publication/eligibility";
import { orchestrateStaging } from "@/features/question-factory/staging";
import { verifyUpstreamGateChain } from "@/features/question-factory/gate-chain";
import { verifyCandidateCorrectness } from "@/features/question-factory/correctness";
import { ingestExternalReview } from "@/features/question-factory/review";
import { validateManifestReviewEvidence } from "@/features/question-factory/publication/manifest-schema";
import type { LegacyImportManifest } from "@/features/question-factory/legacy-import/manifest";

let gitRoot: string, workspace: string, manifest: LegacyImportManifest, source: GitLegacySourceReader, repository: FsFactoryRepository;
const fixtureTime = "2000-01-01T00:00:00.000Z"; // Synthetic import event only, never an authoring date.
const git = (...args: string[]) => execFileSync("git", ["-C", gitRoot, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

beforeAll(async () => {
  gitRoot = await fs.mkdtemp(path.join(tmpdir(), "legacy-git-fixture-"));
  for (const [file, value] of Object.entries(snapshot.files)) {
    await fs.mkdir(path.dirname(path.join(gitRoot, file)), { recursive: true });
    await fs.writeFile(path.join(gitRoot, file), JSON.stringify(value, null, 2) + "\n");
  }
  git("init", "-q");
  git("remote", "add", "origin", "https://github.com/Vishwas2018/mindmosaic-exam-engine.git");
  git("add", ".");
  git("-c", "user.name=Synthetic Legacy Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "Synthetic Git snapshot for isolated importer tests; no original authorship claim");
  manifest = prepareScholarshipLegacyManifest(gitRoot, git("rev-parse", "HEAD").trim());
}, 30_000);
afterAll(async () => { await fs.rm(gitRoot, { recursive: true, force: true }); });
beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(tmpdir(), "legacy-factory-fixture-"));
  repository = new FsFactoryRepository(workspace);
  source = new GitLegacySourceReader(gitRoot);
  for (const item of manifest.items) {
    const blueprint = JSON.parse((await source.read({ repository: item.blueprint.repository, commit: item.blueprint.commit, path: item.blueprint.path, blob: item.blueprint.blob, sha256: item.blueprint.sha256 })).toString("utf8"));
    await repository.create("blueprints", item.blueprint.id, blueprint);
  }
});
afterEach(async () => { vi.restoreAllMocks(); await fs.rm(workspace, { recursive: true, force: true }); });

async function diskSnapshot(root: string): Promise<string> {
  const rows: string[] = [];
  async function walk(folder: string) {
    for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      rows.push(path.relative(root, file) + (entry.isDirectory() ? "/" : `:${sha256(await fs.readFile(file))}`));
      if (entry.isDirectory()) await walk(file);
    }
  }
  await walk(root);
  return rows.sort().join("\n");
}

describe("legacy import preflight and transaction", () => {
  it("serialises competing creates without overwrite or an empty lock directory", async () => {
    const id = "synthetic-create-race";
    const results = await Promise.all(Array.from({ length: 8 }, (_, marker) => repository.create("generated", id, { marker })));
    expect(results.filter(result => result.ok)).toHaveLength(1);
    const winner = results.findIndex(result => result.ok);
    expect(await repository.inspectRecord("generated", id)).toMatchObject({ status: "present", record: { marker: winner } });
    await expect(fs.stat(path.join(workspace, ".locks"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("runs the real CLI in dry-run mode with exact manifest SHA and zero workspace mutation", async () => {
    const file = path.join(gitRoot, "synthetic-preflight-manifest.json");
    const bytes = JSON.stringify(manifest, null, 2) + "\n";
    await fs.writeFile(file, bytes);
    const before = await diskSnapshot(workspace);
    const args = ["--import", "tsx", "scripts/questions-import-legacy.mts", "--manifest", file, "--expected-manifest-sha256", sha256(bytes), "--repository", gitRoot, "--dry-run"];
    const run = (input: string[]) => execFileSync(process.execPath, input, { cwd: process.cwd(), env: { ...process.env, MINDMOSAIC_QUESTION_FACTORY_ROOT: workspace }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const result = JSON.parse(run(args));
    expect(result.status).toBe("preflight_passed");
    expect(result.items).toHaveLength(12);
    expect(result.writesPerformed).toBe(false);
    expect(result.independentReviewEligible).toBe(false);
    expect(result.publicationEligible).toBe(false);
    expect(() => run([...args, "--apply"])).toThrow();
    expect(await diskSnapshot(workspace)).toBe(before);
  }, 20_000);
  it("checks all twelve frozen source-register revisions without writing a byte or directory", async () => {
    const before = await diskSnapshot(workspace);
    const plan = await preflightLegacyImport(manifest, source, repository);
    expect(plan.items).toHaveLength(12);
    expect(plan.items.map(entry => entry.item.sourceCandidateHash)).toEqual(snapshot.files["docs/reviews/scholarship-sample-2026-10-22/provenance/source-register.json"].items.map(item => item.currentCandidateHash));
    expect(plan.items.filter(entry => entry.item.transformation)).toHaveLength(2);
    expect(await diskSnapshot(workspace)).toBe(before);
  });

  it.each(["rawQuestionHash", "sourceCandidateHash", "candidateHash", "publicationContentHash"] as const)("rejects changed %s before any writes", async field => {
    const modified = structuredClone(manifest);
    modified.items[0][field] = "0".repeat(64);
    const before = await diskSnapshot(workspace);
    await expect(importLegacyBatch(modified, source, workspace)).rejects.toThrow();
    expect(await diskSnapshot(workspace)).toBe(before);
  });

  it.each(["commit", "path", "blob", "sha256", "repository"] as const)("refuses a forged source %s", async field => {
    const modified = structuredClone(manifest);
    modified.items[0].source[field] = field === "path" ? "../outside.json" : field === "repository" ? "forged/repository" : "0".repeat(field === "sha256" ? 64 : 40);
    await expect(preflightLegacyImport(modified, source, repository)).rejects.toThrow();
  });

  it("refuses stale blueprint, review packet and sidecar bindings", async () => {
    for (const kind of ["blueprint", "reviewPacket", "sidecar"] as const) {
      const modified = structuredClone(manifest);
      if (kind === "blueprint") modified.items[0].blueprint.contentHash = "0".repeat(64);
      else if (kind === "reviewPacket") modified.items[0].reviewPacket.projectionHash = "0".repeat(64);
      else modified.items.find(item => item.transformation)!.transformation!.sidecarHash = "0".repeat(64);
      await expect(preflightLegacyImport(modified, source, repository)).rejects.toThrow();
    }
  });

  it("rejects modified source bytes even if an adapter returns them under an unchanged Git binding", async () => {
    const before = await diskSnapshot(workspace);
    const corruptReader = { read: async (binding: Parameters<GitLegacySourceReader["read"]>[0]) => {
      const bytes = await source.read(binding);
      return binding.path === manifest.items[0].source.path ? Buffer.concat([bytes, Buffer.from("\n")]) : bytes;
    } };
    await expect(preflightLegacyImport(manifest, corruptReader, repository)).rejects.toThrow("source_sha256_mismatch");
    expect(await diskSnapshot(workspace)).toBe(before);
  });

  it("rejects duplicate IDs and forged generation-event fields", async () => {
    await expect(preflightLegacyImport({ ...manifest, items: [...manifest.items, manifest.items[0]] }, source, repository)).rejects.toThrow();
    await expect(preflightLegacyImport({ ...manifest, generationEvent: "forged-provider-event" }, source, repository)).rejects.toThrow();
  });

  it("does not quarantine or repair a malformed existing record", async () => {
    await fs.mkdir(path.join(workspace, "generated"));
    await fs.writeFile(path.join(workspace, "generated", `${manifest.items[0].id}.json`), "{broken");
    const before = await diskSnapshot(workspace);
    await expect(preflightLegacyImport(manifest, source, repository)).rejects.toThrow("malformed");
    expect(await diskSnapshot(workspace)).toBe(before);
  });

  it("imports only generated records in an isolated fixture, with idempotent retries and no review inheritance", async () => {
    const result = await importLegacyBatch(manifest, source, workspace);
    expect(result.replayed).toBe(false);
    const before = await repository.inspectRecord("generated", manifest.items[0].id);
    const retry = await importLegacyBatch(manifest, source, workspace);
    expect(retry.replayed).toBe(true);
    expect(await repository.inspectRecord("generated", manifest.items[0].id)).toEqual(before);
    expect(await repository.list("generated")).toHaveLength(12);
    for (const compartment of ["staged", "published-manifests", "review-queue", "reports"] as const) expect(await repository.list(compartment)).toEqual([]);
    const stored = before.status === "present" ? before.record as { provenance: unknown; state: string } : null;
    expect(stored?.state).toBe("generated");
    const provenance = candidateProvenanceSchema.parse(stored?.provenance);
    expect(provenance.generatorAdapter.identity).toBeNull();
    expect(provenance.generatedAt).toBeNull();
    expect(provenance.reviewRecords).toEqual([]);
  });

  it("rejects pre-existing candidates rather than overwriting or attaching provenance", async () => {
    await repository.create("generated", manifest.items[3].id, { candidateId: manifest.items[3].id, question: "unrelated" });
    const before = await diskSnapshot(workspace);
    await expect(importLegacyBatch(manifest, source, workspace)).rejects.toThrow("conflict");
    expect(await diskSnapshot(workspace)).toBe(before);
  });

  it("resumes a prepared transaction after an interrupted create without overwriting earlier candidates", async () => {
    const original = FsFactoryRepository.prototype.create;
    let created = 0;
    const spy = vi.spyOn(FsFactoryRepository.prototype, "create").mockImplementation(async function(this: FsFactoryRepository, ...args) {
      if (++created === 3) throw new Error("synthetic crash injection");
      return original.apply(this, args);
    });
    await expect(importLegacyBatch(manifest, source, workspace)).rejects.toThrow("synthetic crash");
    spy.mockRestore();
    expect(await repository.list("generated")).toHaveLength(2);
    const before = await repository.inspectRecord("generated", manifest.items[0].id);
    await importLegacyBatch(manifest, source, workspace);
    expect(await repository.list("generated")).toHaveLength(12);
    expect(await repository.inspectRecord("generated", manifest.items[0].id)).toEqual(before);
  });

  it("refuses an occupied transaction lock without stealing it", async () => {
    await fs.mkdir(path.join(workspace, ".legacy-import"));
    await fs.writeFile(path.join(workspace, ".legacy-import/lock.json"), JSON.stringify({ token: "synthetic-owner" }));
    await expect(importLegacyBatch(manifest, source, workspace)).rejects.toThrow("locked");
    expect(await repository.list("generated")).toEqual([]);
    expect(JSON.parse(await fs.readFile(path.join(workspace, ".legacy-import/lock.json"), "utf8")).token).toBe("synthetic-owner");
  });

  it("prevents concurrent legacy applies from duplicating candidates", async () => {
    const outcomes = await Promise.allSettled([importLegacyBatch(manifest, source, workspace), importLegacyBatch(manifest, source, workspace)]);
    expect(outcomes.some(outcome => outcome.status === "fulfilled")).toBe(true);
    expect(await repository.list("generated")).toHaveLength(12);
    const journal = JSON.parse(await fs.readFile(path.join(workspace, ".legacy-import", `${hashJson(manifest)}.json`), "utf8"));
    expect(journal.status).toBe("committed");
    expect(journal.candidates).toHaveLength(12);
  });

  it("fails closed if an interrupted create left a data record without storage metadata", async () => {
    const original = FsFactoryRepository.prototype.create;
    let interrupted = false;
    const spy = vi.spyOn(FsFactoryRepository.prototype, "create").mockImplementation(async function(this: FsFactoryRepository, ...args) {
      const result = await original.apply(this, args);
      if (!interrupted && args[0] === "generated") {
        interrupted = true;
        await fs.rm(path.join(workspace, ".metadata", `${args[1]}.json`));
        throw new Error("synthetic metadata-write interruption");
      }
      return result;
    });
    await expect(importLegacyBatch(manifest, source, workspace)).rejects.toThrow("synthetic metadata");
    spy.mockRestore();
    await expect(importLegacyBatch(manifest, source, workspace)).rejects.toThrow("legacy_metadata_recovery_required");
    const journal = JSON.parse(await fs.readFile(path.join(workspace, ".legacy-import", `${hashJson(manifest)}.json`), "utf8"));
    expect(journal.status).toBe("prepared");
    expect(await repository.list("staged")).toEqual([]);
  });
});

describe("legacy governance boundaries", () => {
  it("has a strict unverified original-generation schema and separates the import timestamp", async () => {
    const plan = await preflightLegacyImport(manifest, source, repository);
    const record = buildLegacyRecord(plan, plan.items[0], fixtureTime);
    expect(candidateProvenanceSchema.safeParse(record.provenance).success).toBe(true);
    for (const forged of [
      { ...record.provenance, generatedAt: fixtureTime },
      { ...record.provenance, generatorAdapter: { class: "legacy_import", identity: normaliseIdentity("human") } },
      { ...record.provenance, originalGeneration: { ...record.provenance.originalGeneration, event: "invented" } },
      { ...record.provenance, kind: "generated", generatorAdapter: { class: "manual_external", identity: normaliseIdentity("claude") } },
    ]) expect(candidateProvenanceSchema.safeParse(forged).success).toBe(false);
    expect(record.provenance.originalGeneration.provider).toBeNull();
    expect(record.provenance.repositoryImport.importedAt).toBe(fixtureTime);
  });

  it("never treats unknown origin as independent of a known reviewer", () => {
    for (const reviewer of ["chatgpt", "claude", "human", "qwen"]) {
      expect(identitiesAreIndependent(null, normaliseIdentity(reviewer))).toBe(false);
      expect(identitiesAreIndependentForJudgementReview(null, normaliseIdentity(reviewer))).toBe(false);
      expect(identitiesAreIndependent(normaliseIdentity(reviewer), null)).toBe(false);
    }
    expect(identitiesAreIndependentForJudgementReview(normaliseIdentity("claude"), normaliseIdentity("chatgpt"))).toBe(true);
    expect(identitiesAreIndependentForJudgementReview({ provider: "other", modelId: "unknown", modelFamily: "unknown", interactionMode: "external_manual" }, normaliseIdentity("chatgpt"))).toBe(false);
  });

  it("does not launder a valid review chain into independent legacy evidence", async () => {
    const plan = await preflightLegacyImport(manifest, source, repository);
    const record = buildLegacyRecord(plan, plan.items[0], fixtureTime);
    const current = { candidateId: record.candidateId, revision: 0, contentHash: record.provenance.contentHash, blueprintHash: record.provenance.repositoryImport.blueprint.contentHash };
    const review = appendReviewRecord([], { candidateId: record.candidateId, stage: "correctness_check_passed", reviewerIdentity: normaliseIdentity("chatgpt")!, reviewerVersion: "synthetic-fixture-v1", result: "passed", confidence: 1, findings: [], evidenceReferences: ["synthetic-fixture-evidence"], ambiguityStatus: "none", reviewedAt: fixtureTime, reviewPromptVersion: "synthetic-v1", reviewPromptHash: "synthetic-prompt-hash", evidenceBinding: { candidateContentHash: current.contentHash, candidateRevision: 0, blueprintHash: current.blueprintHash, reviewResultHash: "synthetic-result-hash" } });
    const evidence = { chain: [review], reviewHash: review.reviewHash, expectedTerminalReviewHash: review.reviewHash };
    expect(isProductionGradeIndependentReview(normaliseIdentity("claude")!, evidence, current, 0.9)).toBe(true);
    expect(isProductionGradeIndependentReview(null, evidence, current, 0.9)).toBe(false);
    await repository.create("review-queue", record.candidateId, { ...record, state: "correctness_check_passed" });
    const before = await diskSnapshot(workspace);
    const outcome = await ingestExternalReview({ reviewId: "synthetic-external-review", candidateId: record.candidateId, candidateRevision: 0, candidateContentHash: current.contentHash, blueprintHash: current.blueprintHash, reviewerModel: "chatgpt", reviewerVersion: "synthetic-v1", result: "passed", confidence: 1, findings: [], evidenceReferences: ["synthetic-evidence"], ambiguityStatus: "none", reviewedAt: fixtureTime, reviewPromptVersion: "synthetic-v1", reviewPromptHash: "synthetic-hash" }, repository);
    expect(outcome).toMatchObject({ status: "rejected", issueCode: "legacy_origin_unverified" });
    expect(await diskSnapshot(workspace)).toBe(before);
    expect(validateManifestReviewEvidence({ candidateId: record.candidateId, contentHash: current.contentHash, revision: 0, generatorAdapter: { class: "legacy_import" } }).ok).toBe(false);
  });

  it("continues to prove deterministic correctness without asserting original authorship", async () => {
    const plan = await preflightLegacyImport(manifest, source, repository);
    const entry = plan.items.find(item => item.item.id === "scholarship-y6-maths-004")!;
    const record = buildLegacyRecord(plan, entry, fixtureTime);
    const blueprintHash = record.provenance.repositoryImport.blueprint.contentHash;
    const structural = validateCandidateStructure(record, { validatedAt: fixtureTime, blueprintHash });
    expect(structural.status).toBe("passed");
    const correctness = verifyCandidateCorrectness({ ...record, state: "structural_validation_passed" }, { verifiedAt: fixtureTime, blueprintHash, structuralEvidence: structural.evidence });
    expect(correctness.status).toBe("passed");
    expect((await checkPublicationEligibility(record, repository)).ok).toBe(false);
  });

  it("accepts exact structural bindings but refuses staging/publication even with a forged advanced state", async () => {
    const plan = await preflightLegacyImport(manifest, source, repository);
    const record = buildLegacyRecord(plan, plan.items[0], fixtureTime);
    const structural = validateCandidateStructure(record, { validatedAt: fixtureTime, blueprintHash: record.provenance.repositoryImport.blueprint.contentHash });
    expect(structural.status).toBe("passed");
    expect((await verifyUpstreamGateChain({ candidateId: record.candidateId, provenance: record.provenance }, repository)).ok).toBe(false);
    await repository.create("review-queue", record.candidateId, { ...record, state: "difficulty_review_passed" });
    expect((await orchestrateStaging(record.candidateId, repository)).outcome).toBe("upstream_evidence_invalid");
    expect((await checkPublicationEligibility(record, repository)).ok).toBe(false);
    expect(await repository.list("staged")).toEqual([]);
  });
});
