import * as fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  approvalFingerprint, canonicalQuestionHash, publicationManifestFacts, selectApprovedQuestions,
  validatePublicationSource, type HumanPublicationApproval,
} from "@/features/content-governance/publication-integrity";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { assemblePublishedQuestions } from "@/features/question-factory/publication/assemble-published-bank";
import { orchestratePublication } from "@/features/question-factory/publication/publish-candidate";
import { manifestGeneratorAttributionIssue, validateManifestReviewEvidence } from "@/features/question-factory/publication/manifest-schema";
import type { FactoryRepository } from "@/features/question-factory/storage";

/**
 * Task 1 of the PR #74 hardening review: can removing, replacing or forging the
 * optional `generatorAdapter` on a publication manifest make an unknown-origin
 * question eligible? Every case below is a manifest an attacker could write to
 * disk; each must be refused by every consumer.
 *
 * Fixture data is synthetic: it mirrors the shape of `publication-integrity.test.ts`.
 */
const question = questionBank[0];
const approvedAt = "2026-10-05T05:00:00.000Z";
const LEGACY = { class: "legacy_import", identity: null };
const KNOWN = { class: "manual_external", identity: { provider: "human", modelId: "x", modelFamily: "human", interactionMode: "external_manual" } };

type Manifest = Record<string, unknown>;

/** Builds a manifest whose fingerprint is self-consistent for the given adapter value. */
function seal(adapter: unknown, omitAdapter = false): Manifest {
  const facts: Manifest = { candidateId: "fixture-candidate", questionId: question.id,
    contentHash: "a".repeat(64), revision: 0, blueprintId: "fixture-blueprint", batchId: "fixture-batch",
    originalityFingerprint: "b".repeat(64), difficultyFingerprint: "c".repeat(64), publishedAt: approvedAt, question };
  if (!omitAdapter) facts.generatorAdapter = adapter;
  return { ...facts, manifestFingerprint: hashJson(publicationManifestFacts(facts)), noChainRecovered: true };
}

/** A human approval bound to this exact manifest, as the real approval flow would produce. */
function approve(manifest: Manifest): HumanPublicationApproval {
  const source = validatePublicationSource(manifest, question);
  const withoutApproval = { ...manifest };
  delete withoutApproval.humanApproval;
  const sourceManifestHash = source.ok ? source.sourceManifestHash : hashJson(withoutApproval);
  const facts = { kind: "human_publication_approval" as const, schemaVersion: 1 as const,
    questionId: question.id, revision: 0, approvedBy: "fixture-human-reviewer", approvedAt,
    contentHash: canonicalQuestionHash(question), sourceManifestHash,
    checks: { correctness: true as const, originality: true as const, ageAppropriateness: true as const }, question };
  return { ...facts, fingerprint: approvalFingerprint(facts) };
}

function repo(manifest: Manifest): FactoryRepository {
  return {
    list: async () => [String(manifest.candidateId)],
    read: async (compartment: string) => (compartment === "published-manifests" ? manifest : undefined),
  } as unknown as FactoryRepository;
}

/** Runs one manifest through every consumer that could admit it. */
async function admitted(manifest: Manifest, approval: HumanPublicationApproval) {
  const assembled = await assemblePublishedQuestions(repo(manifest), [approval]);
  const selected = selectApprovedQuestions([question], new Set([question.id]), [manifest], [approval]);
  // Replay reads the approval embedded in the manifest (it is outside the sealed source hash).
  const embedded = { ...manifest, humanApproval: approval };
  const replay = await orchestratePublication(String(manifest.candidateId), repo(embedded), { publishedAt: approvedAt });
  return {
    assembly: assembled.questions.length > 0,
    selection: selected.questions.length > 0,
    replay: replay.outcome === "published",
    source: validatePublicationSource(manifest, question).ok,
  };
}

/** Admission outcomes only. The evidence validator is asserted separately: it does not recompute fingerprints. */
const NOWHERE = { assembly: false, selection: false, replay: false, source: false };
const evidenceOk = (manifest: Manifest) => validateManifestReviewEvidence(manifest as never).ok;

describe("publication-manifest generatorAdapter tampering (unknown origin)", () => {
  it("control: a genuine known-generation manifest with valid fingerprint and approval is admitted", async () => {
    const manifest = seal(KNOWN);
    expect(await admitted(manifest, approve(manifest))).toEqual({ assembly: true, selection: true, replay: true, source: true });
  });

  it("control: the historical shape (adapter without identity) stays admitted", async () => {
    const manifest = seal({ class: "manual_external" });
    expect((await admitted(manifest, approve(manifest))).assembly).toBe(true);
  });

  it("refuses an honestly legacy-marked manifest everywhere, even with a valid approval", async () => {
    const manifest = seal(LEGACY);
    expect(await admitted(manifest, approve(manifest))).toEqual(NOWHERE);
    expect(evidenceOk(manifest)).toBe(false);
  });

  it("detects the marker being removed after sealing (fingerprint and approval both bind it)", async () => {
    const sealed = seal(LEGACY);
    const approval = approve(sealed);
    const { generatorAdapter: _removed, ...stripped } = sealed;
    void _removed;
    expect(await admitted(stripped, approval)).toEqual(NOWHERE);
    expect(validatePublicationSource(stripped, question)).toEqual({ ok: false, reason: "manifest_fingerprint_mismatch" });
  });

  it("detects the marker being replaced by a known identity after sealing", async () => {
    const sealed = seal(LEGACY);
    const approval = approve(sealed);
    const replaced = { ...sealed, generatorAdapter: KNOWN };
    expect(await admitted(replaced, approval)).toEqual(NOWHERE);
    expect(validatePublicationSource(replaced, question)).toEqual({ ok: false, reason: "manifest_fingerprint_mismatch" });
  });

  it("detects a replaced marker with a recomputed fingerprint but the original approval", async () => {
    const approval = approve(seal(LEGACY));
    const refingerprinted = seal(KNOWN);
    expect(await admitted(refingerprinted, approval)).toEqual({ ...NOWHERE, source: true });
    expect(selectApprovedQuestions([question], new Set([question.id]), [refingerprinted], [approval]).problems)
      .toContain(`${question.id}: approval_source_mismatch`);
  });

  it("detects embedded-approval reuse after the marker changes", async () => {
    const sealed = seal(LEGACY);
    const embedded = { ...seal(KNOWN), humanApproval: approve(sealed) };
    expect(await admitted(embedded, embedded.humanApproval)).toEqual({ ...NOWHERE, source: true });
  });

  // A manifest with no adapter at all, or a malformed/aliased one, must not be a way round the
  // marker even when an attacker also recomputes the fingerprint and approval. Allow-list, not deny-list.
  const MALFORMED: ReadonlyArray<readonly [string, unknown, boolean]> = [
    ["absent", undefined, true],
    ["null", null, false],
    ["a bare string", "legacy_import", false],
    ["an array", [], false],
    ["an empty object", {}, false],
    ["a non-string class", { class: 7 }, false],
    ["an unknown class", { class: "unverified" }, false],
    ["a case-variant of the marker", { class: "LEGACY_IMPORT", identity: null }, false],
    ["a whitespace-padded marker", { class: " legacy_import", identity: null }, false],
    ["a legacy class with a forged identity", { class: "legacy_import", identity: KNOWN.identity }, false],
  ];
  for (const [label, adapter, omit] of MALFORMED) {
    it(`refuses a fully re-sealed manifest whose generatorAdapter is ${label}`, async () => {
      const manifest = seal(adapter, omit);
      expect(await admitted(manifest, approve(manifest))).toEqual(NOWHERE);
      expect(validatePublicationSource(manifest, question)).toEqual({ ok: false, reason: "invalid_generator_attribution" });
    });
  }

  it("is not affected by extra provenance-looking fields smuggled into a legacy manifest", async () => {
    const manifest = { ...seal(LEGACY), originalGeneration: { status: "verified" }, provenance: { kind: "generated" } };
    expect((await admitted(manifest, approve(manifest))).assembly).toBe(false);
  });

  it("preserves historical compatibility: every committed manifest keeps a well-formed known adapter", () => {
    const dir = path.resolve(process.cwd(), "content/question-factory/published-manifests");
    const files = fs.readdirSync(dir).filter((name) => name.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) as Manifest;
      const adapter = manifest.generatorAdapter as { class?: unknown } | undefined;
      expect(["deterministic_fixture", "manual_external", "live_provider"], name).toContain(adapter?.class);
      // The allow-list rule must not be what rejects a real, historical manifest.
      expect(manifestGeneratorAttributionIssue(manifest.generatorAdapter), name).toBeUndefined();
    }
  });
});
