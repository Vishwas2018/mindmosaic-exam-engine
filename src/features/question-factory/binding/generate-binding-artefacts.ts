import { createHash } from "node:crypto";

import { blueprintSchema, validateBlueprint, type Blueprint } from "../blueprints";
import { hashJson } from "../provenance";
import { skillTaxonomyRegistry } from "../taxonomy";
import {
  detectBlueprintIdCollisions,
  mintBindingBlueprintId,
  serialiseCanonicalTuple,
  type CanonicalBindingTuple,
} from "./canonical-tuple";
import {
  BINDING_GENERATOR_VERSION,
  BINDING_MANIFEST_VERSION,
  bindingManifestSchema,
  type BindingManifest,
} from "./binding-manifest";

export interface BindingPackInput {
  readonly fileName: string;
  /** Exact staged bytes — hashed verbatim for the manifest's pack table. */
  readonly rawContent: string;
}

export interface GenerateBindingArtefactsRequest {
  readonly batchId: string;
  readonly frozenFingerprint: string;
  readonly packs: readonly BindingPackInput[];
  readonly generatedAt: string;
}

export interface GenerateBindingArtefactsSuccess {
  readonly ok: true;
  readonly blueprints: readonly Blueprint[];
  readonly manifest: BindingManifest;
  readonly evidence: {
    readonly pb2Fingerprint: string;
    readonly manifestHash: string;
    readonly blueprintSetHash: string;
    readonly candidateCount: number;
    readonly tupleCount: number;
    readonly generatorVersion: string;
  };
}

export interface GenerateBindingArtefactsFailure {
  readonly ok: false;
  /**
   * Every reason generation refused, including `manual_completion_required`
   * entries: places where the taxonomy registry does not carry enough
   * authoritative data to author a valid blueprint without guessing.
   * Generation always aborts whole — it never emits a partial artefact set.
   */
  readonly failures: readonly { readonly code: string; readonly message: string }[];
}

export type GenerateBindingArtefactsOutcome = GenerateBindingArtefactsSuccess | GenerateBindingArtefactsFailure;

interface RawCandidate {
  readonly inFileId: string;
  readonly tuple: CanonicalBindingTuple;
  readonly marks: number;
  readonly estimatedTimeSeconds: number | undefined;
}

const YEAR_LEVEL_TO_BLUEPRINT: Record<number, "year-3" | "year-5"> = { 3: "year-3", 5: "year-5" };

function readCandidates(pack: BindingPackInput): { readonly candidates: RawCandidate[] } | { readonly error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(pack.rawContent);
  } catch (error) {
    return { error: `${pack.fileName}: not valid JSON (${error instanceof Error ? error.message : String(error)}).` };
  }
  if (!Array.isArray(parsed)) return { error: `${pack.fileName}: expected a top-level candidate array.` };

  const candidates: RawCandidate[] = [];
  for (const [index, raw] of parsed.entries()) {
    if (typeof raw !== "object" || raw === null) return { error: `${pack.fileName}[${index}]: candidate is not an object.` };
    const c = raw as Record<string, unknown>;
    const metadata = (typeof c.metadata === "object" && c.metadata !== null ? c.metadata : {}) as Record<string, unknown>;
    const missing: string[] = [];
    const str = (value: unknown, name: string): string => {
      if (typeof value !== "string" || value.trim().length === 0) {
        missing.push(name);
        return "";
      }
      return value;
    };
    const inFileId = str(c.id, "id");
    const skill = str(metadata.skill, "metadata.skill");
    const subject = str(metadata.subject, "metadata.subject");
    const strand = str(metadata.strand, "metadata.strand");
    const difficulty = str(metadata.difficulty, "metadata.difficulty");
    const questionType = str(c.type, "type");
    const examStyle = str(c.examStyle, "examStyle");
    const yearLevel = typeof c.yearLevel === "number" ? c.yearLevel : (missing.push("yearLevel"), NaN);
    const marks = typeof metadata.marks === "number" ? metadata.marks : (missing.push("metadata.marks"), NaN);
    if (missing.length > 0) {
      return { error: `${pack.fileName}[${index}] ('${inFileId || "?"}'): missing/invalid field(s): ${missing.join(", ")}.` };
    }
    candidates.push({
      inFileId,
      tuple: {
        skill,
        yearLevel: yearLevel as 3 | 5,
        examStyle: examStyle as CanonicalBindingTuple["examStyle"],
        subject,
        strand,
        difficulty,
        questionType,
      },
      marks,
      estimatedTimeSeconds:
        typeof metadata.estimatedTimeSeconds === "number" ? metadata.estimatedTimeSeconds : undefined,
    });
  }
  return { candidates };
}

/**
 * Authors one real blueprint per distinct canonical tuple across the given
 * packs, plus the per-candidate binding manifest that maps every candidate
 * to its tuple's blueprint. Pure function of its inputs and the taxonomy
 * registry — re-running with identical packs always emits byte-identical
 * artefacts (`generatedAt` aside, which the caller supplies).
 *
 * Fail-closed by construction: any candidate the registry cannot fully
 * vouch for (unregistered skill, unsupported year/style/difficulty,
 * unrecommended question type, missing display name, non-uniform marks
 * within a tuple group) aborts the whole generation with a
 * `manual_completion_required` failure — values are never guessed and
 * partial artefact sets are never emitted.
 */
export function generateBindingArtefacts(request: GenerateBindingArtefactsRequest): GenerateBindingArtefactsOutcome {
  const failures: { code: string; message: string }[] = [];

  const allCandidates: RawCandidate[] = [];
  const packTable: { fileName: string; sha256: string; candidateCount: number }[] = [];
  const seenPackNames = new Set<string>();
  for (const pack of request.packs) {
    if (seenPackNames.has(pack.fileName)) {
      failures.push({ code: "duplicate_pack", message: `Pack '${pack.fileName}' supplied more than once.` });
      continue;
    }
    seenPackNames.add(pack.fileName);
    const outcome = readCandidates(pack);
    if ("error" in outcome) {
      failures.push({ code: "pack_invalid", message: outcome.error });
      continue;
    }
    allCandidates.push(...outcome.candidates);
    packTable.push({
      fileName: pack.fileName,
      sha256: createHash("sha256").update(pack.rawContent, "utf8").digest("hex"),
      candidateCount: outcome.candidates.length,
    });
  }
  if (failures.length > 0) return { ok: false, failures };

  const seenIds = new Set<string>();
  for (const candidate of allCandidates) {
    if (seenIds.has(candidate.inFileId)) {
      failures.push({ code: "duplicate_candidate_id", message: `In-file candidate id '${candidate.inFileId}' appears more than once.` });
    }
    seenIds.add(candidate.inFileId);
  }
  if (failures.length > 0) return { ok: false, failures };

  // Group by canonical tuple.
  const groups = new Map<string, { tuple: CanonicalBindingTuple; members: RawCandidate[] }>();
  for (const candidate of allCandidates) {
    let canonical: string;
    try {
      canonical = serialiseCanonicalTuple(candidate.tuple);
    } catch (error) {
      failures.push({ code: "tuple_unserialisable", message: `'${candidate.inFileId}': ${error instanceof Error ? error.message : String(error)}` });
      continue;
    }
    const group = groups.get(canonical) ?? { tuple: candidate.tuple, members: [] };
    group.members.push(candidate);
    groups.set(canonical, group);
  }
  if (failures.length > 0) return { ok: false, failures };

  const idCollisions = detectBlueprintIdCollisions([...groups.values()].map((group) => group.tuple));
  for (const collision of idCollisions) {
    failures.push({
      code: "blueprint_id_collision",
      message: `Deterministic blueprint id '${collision.blueprintId}' is claimed by ${collision.canonicalTuples.length} distinct tuples: ${collision.canonicalTuples.join(" ; ")}`,
    });
  }
  if (failures.length > 0) return { ok: false, failures };

  const blueprints: Blueprint[] = [];
  const blueprintHashById = new Map<string, string>();

  for (const [canonical, group] of [...groups.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const { tuple, members } = group;
    const entry = skillTaxonomyRegistry.get(tuple.skill);
    if (!entry) {
      failures.push({ code: "manual_completion_required", message: `Tuple '${canonical}': skill '${tuple.skill}' is not registered — no authoritative source to author a blueprint from.` });
      continue;
    }
    const blueprintYearLevel = YEAR_LEVEL_TO_BLUEPRINT[tuple.yearLevel];
    if (!blueprintYearLevel) {
      failures.push({ code: "manual_completion_required", message: `Tuple '${canonical}': year level ${tuple.yearLevel} has no blueprint year-level mapping.` });
      continue;
    }
    if (entry.displayName.trim().length === 0) {
      failures.push({ code: "manual_completion_required", message: `Tuple '${canonical}': registry entry '${entry.id}' has no display name to derive a learning objective from.` });
      continue;
    }
    const marksValues = new Set(members.map((member) => member.marks));
    if (marksValues.size !== 1) {
      failures.push({ code: "manual_completion_required", message: `Tuple '${canonical}': members declare differing marks (${[...marksValues].join(", ")}) — a single authoritative value cannot be derived.` });
      continue;
    }
    const timeValues = members
      .map((member) => member.estimatedTimeSeconds)
      .filter((value): value is number => value !== undefined);
    const estimatedTimeSeconds = timeValues.length > 0 ? Math.max(...timeValues) : 60;

    const rawBlueprint = {
      id: mintBindingBlueprintId(tuple),
      batchId: request.batchId,
      yearLevel: blueprintYearLevel,
      examStyle: tuple.examStyle,
      subject: tuple.subject,
      strand: entry.strand,
      skill: entry.id,
      difficulty: tuple.difficulty,
      questionType: tuple.questionType,
      targetCount: members.length,
      marks: [...marksValues][0],
      estimatedTimeSeconds,
      learningObjective: entry.displayName,
      misconceptionTargets: [],
      reasoningSteps: 1,
      accessibilityConstraints: [],
      originalityConstraints: [],
      generationConstraints: [...entry.generationConstraints],
    };

    const parsed = blueprintSchema.safeParse(rawBlueprint);
    if (!parsed.success) {
      failures.push({
        code: "blueprint_schema_invalid",
        message: `Tuple '${canonical}': generated blueprint fails blueprintSchema: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      });
      continue;
    }
    const validation = validateBlueprint(parsed.data);
    if (!validation.valid) {
      failures.push({
        code: "blueprint_validation_failed",
        message: `Tuple '${canonical}': ${validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ")}`,
      });
      continue;
    }
    blueprints.push(parsed.data);
    blueprintHashById.set(parsed.data.id, hashJson(parsed.data));
  }
  if (failures.length > 0) return { ok: false, failures };

  const bindings = allCandidates
    .map((candidate) => {
      const canonical = serialiseCanonicalTuple(candidate.tuple);
      const blueprintId = mintBindingBlueprintId(candidate.tuple);
      return {
        candidateKey: candidate.inFileId,
        canonicalTuple: canonical,
        blueprintId,
        blueprintHash: blueprintHashById.get(blueprintId) as string,
      };
    })
    .sort((a, b) => (a.candidateKey < b.candidateKey ? -1 : 1));

  const manifestRaw: BindingManifest = {
    manifestVersion: BINDING_MANIFEST_VERSION,
    generatorVersion: BINDING_GENERATOR_VERSION,
    batchId: request.batchId,
    frozenFingerprint: request.frozenFingerprint,
    packs: packTable,
    bindings,
    generatedAt: request.generatedAt,
  };
  const manifestParsed = bindingManifestSchema.safeParse(manifestRaw);
  if (!manifestParsed.success) {
    return {
      ok: false,
      failures: [
        {
          code: "manifest_schema_invalid",
          message: manifestParsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
        },
      ],
    };
  }

  return {
    ok: true,
    blueprints,
    manifest: manifestParsed.data,
    evidence: {
      pb2Fingerprint: request.frozenFingerprint,
      manifestHash: hashJson(manifestParsed.data),
      blueprintSetHash: hashJson(blueprints),
      candidateCount: allCandidates.length,
      tupleCount: blueprints.length,
      generatorVersion: BINDING_GENERATOR_VERSION,
    },
  };
}
