import { createHash } from "node:crypto";

import { validateBlueprint } from "../blueprints";
import { resolveBoundBlueprint } from "../shared/bound-blueprint";
import type { FactoryRepository } from "../storage";
import { mintBindingBlueprintId, serialiseCanonicalTuple, type CanonicalBindingTuple } from "./canonical-tuple";
import { BINDING_MANIFEST_VERSION, type BindingManifest } from "./binding-manifest";

/**
 * A strictly non-mutating view of a repository for preflight resolution.
 * `FactoryRepository.read()` REPAIRS malformed stored records (quarantine
 * move + report write) — correct for operational gate reads, but a
 * preflight refusal must leave the workspace byte-identical, so every
 * blueprint read this module performs goes through `inspectRecord`
 * instead: present → the decoded record; absent → `undefined`; malformed →
 * a thrown, descriptive error that `resolveBoundBlueprint` converts into
 * its fail-closed `invalid` outcome. All validation logic stays in
 * `resolveBoundBlueprint` itself — only the byte-access path changes.
 * Implementations without `inspectRecord` (in-memory test doubles, which
 * have no repair behaviour to suppress) fall back to their own `read()`.
 */
function readOnlyRepositoryView(repository: FactoryRepository): FactoryRepository {
  return {
    read: async (compartment, candidateId) => {
      if (repository.inspectRecord === undefined) return repository.read(compartment, candidateId);
      const inspection = await repository.inspectRecord(compartment, candidateId);
      if (inspection.status === "present") return inspection.record;
      if (inspection.status === "absent") return undefined;
      throw new Error(inspection.message);
    },
    inspectRecord: repository.inspectRecord?.bind(repository),
    exists: repository.exists.bind(repository),
    list: repository.list.bind(repository),
    // Mutating operations are never invoked on this view; they delegate so
    // the object still satisfies the full interface without duplicating
    // behaviour, but resolveBoundBlueprint only ever calls read().
    create: repository.create.bind(repository),
    update: repository.update.bind(repository),
    remove: repository.remove.bind(repository),
    move: repository.move.bind(repository),
    reconcile: repository.reconcile.bind(repository),
  };
}

export interface StagedPackFile {
  readonly fileName: string;
  readonly rawContent: string;
  /** Which physical root the file was found under — reported in failures so a crash-recovery retry is diagnosable. */
  readonly root: "inbox" | "processing" | "processed";
}

export interface BindingPreflightFailure {
  readonly code:
    | "manifest_version_unsupported"
    | "fingerprint_mismatch"
    | "batch_mismatch"
    | "pack_missing"
    | "pack_hash_mismatch"
    | "pack_unexpected"
    | "pack_unparseable"
    | "pack_count_mismatch"
    | "candidate_id_duplicate"
    | "binding_missing"
    | "binding_unknown_candidate"
    | "binding_duplicate"
    | "tuple_mismatch"
    | "blueprint_id_not_deterministic"
    | "blueprint_id_collision"
    | "blueprint_unresolved"
    | "blueprint_hash_mismatch"
    | "blueprint_validation_failed";
  readonly message: string;
}

export type BindingPreflightOutcome =
  | { readonly ok: true; readonly blueprintIdByCandidateKey: ReadonlyMap<string, string> }
  | { readonly ok: false; readonly failures: readonly BindingPreflightFailure[] };

interface StagedCandidate {
  readonly inFileId: string;
  readonly tuple: CanonicalBindingTuple | undefined;
  readonly fileName: string;
}

function extractCandidates(pack: StagedPackFile): { readonly candidates: StagedCandidate[] } | { readonly error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(pack.rawContent);
  } catch (error) {
    return { error: `${pack.fileName}: not valid JSON (${error instanceof Error ? error.message : String(error)}).` };
  }
  if (!Array.isArray(parsed)) return { error: `${pack.fileName}: expected a top-level candidate array.` };
  const candidates: StagedCandidate[] = [];
  for (const [index, raw] of parsed.entries()) {
    if (typeof raw !== "object" || raw === null) return { error: `${pack.fileName}[${index}]: candidate is not an object.` };
    const c = raw as Record<string, unknown>;
    const metadata = (typeof c.metadata === "object" && c.metadata !== null ? c.metadata : {}) as Record<string, unknown>;
    const inFileId = typeof c.id === "string" ? c.id : "";
    let tuple: CanonicalBindingTuple | undefined;
    if (
      typeof metadata.skill === "string" &&
      typeof metadata.subject === "string" &&
      typeof metadata.strand === "string" &&
      typeof metadata.difficulty === "string" &&
      typeof c.type === "string" &&
      typeof c.examStyle === "string" &&
      typeof c.yearLevel === "number"
    ) {
      tuple = {
        skill: metadata.skill,
        yearLevel: c.yearLevel as CanonicalBindingTuple["yearLevel"],
        examStyle: c.examStyle as CanonicalBindingTuple["examStyle"],
        subject: metadata.subject,
        strand: metadata.strand,
        difficulty: metadata.difficulty,
        questionType: c.type,
      };
    }
    candidates.push({ inFileId, tuple, fileName: pack.fileName });
  }
  return { candidates };
}

/**
 * The complete, read-only binding preflight. Runs before any repository
 * write, any inbox claim/rename and any candidate ingestion; a single
 * failure fails the entire run and the caller must leave the workspace
 * byte-identical. Validates, in order: manifest↔request batch identity,
 * staged-pack membership + byte integrity against the manifest's pack
 * table, per-pack candidate counts, in-file candidate-id uniqueness,
 * one-to-one binding completeness (no missing, unknown, pilot or duplicate
 * entries), canonical-tuple equality against each candidate's own stored
 * metadata, deterministic blueprint-id agreement (including cross-tuple
 * collision detection), and — for every distinct bound blueprint — real
 * resolution through the shared fail-closed `resolveBoundBlueprint`, exact
 * hash agreement with the manifest, and full authoring-time
 * `validateBlueprint` success.
 */
export async function runBindingPreflight(
  manifest: BindingManifest,
  requestBatchId: string,
  /** The approved frozen-artefact fingerprint this governed run expects to bind — compared against the manifest's own declaration, never trusted from the manifest alone. */
  expectedFrozenFingerprint: string,
  stagedPacks: readonly StagedPackFile[],
  repository: FactoryRepository,
): Promise<BindingPreflightOutcome> {
  const failures: BindingPreflightFailure[] = [];

  // Defensive re-assertion of the schema literal: every shipped entry point
  // parses via `parseBindingManifest`, but a typed programmatic caller must
  // not be able to hand this function a future-versioned (or hand-built)
  // manifest and have it interpreted under version-1 rules.
  if (manifest.manifestVersion !== BINDING_MANIFEST_VERSION) {
    failures.push({
      code: "manifest_version_unsupported",
      message: `Manifest declares version '${String(manifest.manifestVersion)}'; this preflight only supports version '${BINDING_MANIFEST_VERSION}'.`,
    });
  }

  if (manifest.frozenFingerprint !== expectedFrozenFingerprint) {
    failures.push({
      code: "fingerprint_mismatch",
      message: `Manifest was generated against frozen fingerprint '${manifest.frozenFingerprint}', but this run expects '${expectedFrozenFingerprint}'. The manifest does not belong to the approved artefact set this run is authorised for.`,
    });
  }

  if (manifest.batchId !== requestBatchId) {
    failures.push({
      code: "batch_mismatch",
      message: `Manifest is for batch '${manifest.batchId}' but this run declares batch '${requestBatchId}'.`,
    });
  }
  if (failures.length > 0) return { ok: false, failures };

  // Pack membership + integrity. Staged inbox/processing files must all be
  // manifest packs; every manifest pack must be present exactly once across
  // the three roots (processed/ satisfies presence so a crash-recovery
  // retry of a partially completed run still preflights cleanly).
  const manifestPackByName = new Map(manifest.packs.map((pack) => [pack.fileName, pack]));
  const stagedByName = new Map<string, StagedPackFile[]>();
  for (const staged of stagedPacks) {
    stagedByName.set(staged.fileName, [...(stagedByName.get(staged.fileName) ?? []), staged]);
    if (!manifestPackByName.has(staged.fileName) && staged.root !== "processed") {
      failures.push({
        code: "pack_unexpected",
        message: `Staged file '${staged.fileName}' (${staged.root}) is not a pack declared by the binding manifest.`,
      });
    }
  }
  const packsToParse: StagedPackFile[] = [];
  for (const pack of manifest.packs) {
    const copies = stagedByName.get(pack.fileName) ?? [];
    if (copies.length === 0) {
      failures.push({ code: "pack_missing", message: `Manifest pack '${pack.fileName}' is not staged (inbox, .processing or processed).` });
      continue;
    }
    // Multiple physical copies are legitimate during an idempotent replay
    // (a byte-identical re-drop sits in `inbox` while the completed copy
    // sits in `processed`) — but only when *every* copy matches the
    // manifest's approved hash. Any divergent copy is a hard failure:
    // there must never be two different byte sets claiming to be the same
    // approved pack.
    let allCopiesApproved = true;
    for (const copy of copies) {
      const hash = createHash("sha256").update(copy.rawContent, "utf8").digest("hex");
      if (hash !== pack.sha256) {
        allCopiesApproved = false;
        failures.push({
          code: "pack_hash_mismatch",
          message: `Pack '${pack.fileName}' (${copy.root}) bytes (sha256 ${hash}) do not match the manifest's declared hash (${pack.sha256}) — the staged file is not the approved artefact.`,
        });
      }
    }
    if (!allCopiesApproved) continue;
    packsToParse.push(copies[0]);
  }
  if (failures.length > 0) return { ok: false, failures };

  // Parse packs and index candidates.
  const candidates: StagedCandidate[] = [];
  for (const staged of packsToParse) {
    const outcome = extractCandidates(staged);
    if ("error" in outcome) {
      failures.push({ code: "pack_unparseable", message: outcome.error });
      continue;
    }
    const declared = manifestPackByName.get(staged.fileName);
    if (declared !== undefined && outcome.candidates.length !== declared.candidateCount) {
      failures.push({
        code: "pack_count_mismatch",
        message: `Pack '${staged.fileName}' contains ${outcome.candidates.length} candidates but the manifest declares ${declared.candidateCount}.`,
      });
    }
    candidates.push(...outcome.candidates);
  }
  if (failures.length > 0) return { ok: false, failures };

  const candidateByKey = new Map<string, StagedCandidate>();
  for (const candidate of candidates) {
    if (candidate.inFileId.length === 0) {
      failures.push({ code: "binding_missing", message: `A candidate in '${candidate.fileName}' has no in-file id; binding-manifest ingestion requires one.` });
      continue;
    }
    if (candidateByKey.has(candidate.inFileId)) {
      failures.push({ code: "candidate_id_duplicate", message: `In-file candidate id '${candidate.inFileId}' appears more than once across the staged packs.` });
      continue;
    }
    candidateByKey.set(candidate.inFileId, candidate);
  }

  // One-to-one binding coverage.
  const bindingByKey = new Map<string, (typeof manifest.bindings)[number]>();
  for (const binding of manifest.bindings) {
    if (bindingByKey.has(binding.candidateKey)) {
      failures.push({ code: "binding_duplicate", message: `Manifest binds candidate '${binding.candidateKey}' more than once.` });
      continue;
    }
    bindingByKey.set(binding.candidateKey, binding);
    if (!candidateByKey.has(binding.candidateKey)) {
      failures.push({
        code: "binding_unknown_candidate",
        message: `Manifest binds '${binding.candidateKey}', which is not a candidate in any staged pack (unknown, pilot, or excluded content).`,
      });
    }
  }
  for (const key of candidateByKey.keys()) {
    if (!bindingByKey.has(key)) {
      failures.push({ code: "binding_missing", message: `Candidate '${key}' has no binding entry in the manifest.` });
    }
  }
  if (failures.length > 0) return { ok: false, failures };

  // Tuple equality + deterministic ids + collision detection.
  const canonicalByBlueprintId = new Map<string, string>();
  for (const [key, candidate] of candidateByKey) {
    const binding = bindingByKey.get(key);
    if (binding === undefined) continue; // already reported above
    if (candidate.tuple === undefined) {
      failures.push({ code: "tuple_mismatch", message: `Candidate '${key}' is missing the metadata fields required to form its canonical tuple.` });
      continue;
    }
    let canonical: string;
    try {
      canonical = serialiseCanonicalTuple(candidate.tuple);
    } catch (error) {
      failures.push({ code: "tuple_mismatch", message: `Candidate '${key}': ${error instanceof Error ? error.message : String(error)}` });
      continue;
    }
    if (canonical !== binding.canonicalTuple) {
      failures.push({
        code: "tuple_mismatch",
        message: `Candidate '${key}': stored metadata tuple '${canonical}' does not equal the manifest's '${binding.canonicalTuple}'.`,
      });
      continue;
    }
    const expectedId = mintBindingBlueprintId(candidate.tuple);
    if (expectedId !== binding.blueprintId) {
      failures.push({
        code: "blueprint_id_not_deterministic",
        message: `Candidate '${key}': manifest blueprint id '${binding.blueprintId}' is not the deterministic id '${expectedId}' for its tuple.`,
      });
      continue;
    }
    const existingCanonical = canonicalByBlueprintId.get(binding.blueprintId);
    if (existingCanonical !== undefined && existingCanonical !== canonical) {
      failures.push({
        code: "blueprint_id_collision",
        message: `Blueprint id '${binding.blueprintId}' is claimed by two distinct tuples ('${existingCanonical}' and '${canonical}').`,
      });
      continue;
    }
    canonicalByBlueprintId.set(binding.blueprintId, canonical);
  }
  if (failures.length > 0) return { ok: false, failures };

  // Blueprint-set integrity: every distinct bound blueprint must resolve
  // fail-closed, hash-match the manifest, and pass authoring validation.
  const expectedHashByBlueprintId = new Map<string, string>();
  for (const binding of manifest.bindings) {
    const existing = expectedHashByBlueprintId.get(binding.blueprintId);
    if (existing !== undefined && existing !== binding.blueprintHash) {
      failures.push({
        code: "blueprint_hash_mismatch",
        message: `Manifest declares two different hashes for blueprint '${binding.blueprintId}'.`,
      });
    }
    expectedHashByBlueprintId.set(binding.blueprintId, binding.blueprintHash);
  }
  // All blueprint resolution below is strictly non-mutating: preflight runs
  // both before the scan lock (zero-write rejection contract) and again
  // under it (TOCTOU revalidation), and a refusal in EITHER position must
  // leave persistent workspace state unchanged — including malformed stored
  // blueprints, which stay in place for a later operational read to repair.
  const inspectionRepository = readOnlyRepositoryView(repository);
  for (const [blueprintId, expectedHash] of expectedHashByBlueprintId) {
    const resolution = await resolveBoundBlueprint(blueprintId, inspectionRepository);
    if (!resolution.ok) {
      failures.push({
        code: "blueprint_unresolved",
        message: `Blueprint '${blueprintId}' does not resolve (${resolution.kind}): ${resolution.message}`,
      });
      continue;
    }
    if (resolution.blueprintHash !== expectedHash) {
      failures.push({
        code: "blueprint_hash_mismatch",
        message: `Blueprint '${blueprintId}' resolves with hash ${resolution.blueprintHash}, but the manifest binds hash ${expectedHash} — the seeded record is not the reviewed one.`,
      });
      continue;
    }
    const validation = validateBlueprint(resolution.blueprint);
    if (!validation.valid) {
      failures.push({
        code: "blueprint_validation_failed",
        message: `Blueprint '${blueprintId}': ${validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ")}`,
      });
    }
  }
  if (failures.length > 0) return { ok: false, failures };

  const blueprintIdByCandidateKey = new Map<string, string>();
  for (const [key, binding] of bindingByKey) {
    blueprintIdByCandidateKey.set(key, binding.blueprintId);
  }
  return { ok: true, blueprintIdByCandidateKey };
}
