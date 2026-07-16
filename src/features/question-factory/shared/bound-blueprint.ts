import { questionRendererRegistry } from "@/features/exam-engine/question-renderers/question-renderer-registry";

import { blueprintSchema, type Blueprint } from "../blueprints";
import { hashJson } from "../provenance";
import { skillTaxonomyRegistry } from "../taxonomy";
import type { FactoryRepository } from "../storage";

export interface BoundBlueprintResolutionSuccess {
  readonly ok: true;
  readonly blueprint: Blueprint;
  readonly blueprintHash: string;
}

export interface BoundBlueprintResolutionFailure {
  readonly ok: false;
  /**
   * Domain-agnostic failure classification — deliberately not a Mission
   * 3B/3C issue code. Every caller (revision, correctness, review) maps
   * this onto its own issue-code catalogue, since each mission's outcome
   * contract owns its own vocabulary; this module has no opinion on it.
   */
  readonly kind: "missing" | "invalid";
  readonly message: string;
}

export type BoundBlueprintResolution = BoundBlueprintResolutionSuccess | BoundBlueprintResolutionFailure;

/**
 * The single, shared, fail-closed resolver for a candidate's *bound*
 * blueprint — the stored authority every gate that reasons about
 * blueprint identity or immutable-field compatibility must resolve
 * through, never re-implement conditionally. Originally written for
 * Mission 3C's revision boundary (`revision/revise.ts`), then found to be
 * needed identically by Mission 3B's correctness-verification and
 * semantic-review orchestration — both of which independently read
 * `repository.read("blueprints", blueprintId)` and computed a
 * `blueprintHash` only `if (blueprintRecord !== undefined)`, silently
 * leaving `blueprintHash` `undefined` (or, in one case, an empty string)
 * whenever the bound blueprint was missing, unreadable, or invalid. That
 * let a downstream vacuous comparison (`stored !== undefined
 * ? undefined : undefined` is always `false`) treat an *unverifiable*
 * blueprint binding as a *matching* one, allowing evidence to be built,
 * review chains to be appended, and lifecycle transitions to be
 * committed with no actual blueprint identity ever confirmed.
 *
 * Every failure mode is caught here and converted into an explicit,
 * typed result, never an uncaught exception and never a silently-skipped
 * downstream check:
 * - `kind: "missing"` — the record does not exist, or was unreadable/
 *   malformed JSON at the storage layer (`FactoryRepository.read()`
 *   already normalises both to "absent", quarantining a corrupted file).
 * - `kind: "invalid"` — the record was read but does not conform to
 *   `blueprintSchema` (wrong top-level type, missing/wrongly-typed
 *   required field), declares a `skill` that does not resolve against
 *   `skillTaxonomyRegistry`, or a `questionType` with no registered
 *   renderer. Deliberately narrower than the full blueprint-authoring
 *   `validateBlueprint` planning-time validator (`blueprints/validate.ts`):
 *   only the two sub-checks a blueprint-bound compatibility/identity
 *   comparison actually depends on are enforced — `validateBlueprint`'s
 *   broader curation-quality checks (recommended type for skill,
 *   difficulty support, hotspot/visual consistency) are blueprint-
 *   authoring concerns asserted once at creation time, not re-litigated
 *   at every gate against every blueprint already bound to a candidate.
 *
 * The returned `blueprintHash` is computed from the *raw* stored record
 * (before `blueprintSchema` parsing/normalisation), preserving the exact
 * hash semantics every existing caller (tests, CLIs, blueprint planning)
 * already computes via `hashJson(blueprint)` on its own local object.
 *
 * Never falls back to caller-supplied or candidate-derived blueprint
 * data — the stored bound blueprint is the sole authority.
 */
export async function resolveBoundBlueprint(
  blueprintId: string,
  repository: FactoryRepository,
): Promise<BoundBlueprintResolution> {
  let blueprintRecord: unknown;
  try {
    blueprintRecord = await repository.read("blueprints", blueprintId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, kind: "invalid", message: `Bound blueprint '${blueprintId}' could not be read from storage: ${message}` };
  }

  if (blueprintRecord === undefined) {
    return {
      ok: false,
      kind: "missing",
      message: `No blueprint '${blueprintId}' exists in the blueprints compartment (or it was unreadable/malformed at the storage layer).`,
    };
  }

  const parsedBlueprint = blueprintSchema.safeParse(blueprintRecord);
  if (!parsedBlueprint.success) {
    return {
      ok: false,
      kind: "invalid",
      message: `Blueprint '${blueprintId}' does not conform to the blueprint schema: ${parsedBlueprint.error.issues.map((issue) => issue.message).join("; ")}`,
    };
  }

  if (skillTaxonomyRegistry.resolve(parsedBlueprint.data.skill) === undefined) {
    return {
      ok: false,
      kind: "invalid",
      message: `Blueprint '${blueprintId}' declares skill '${parsedBlueprint.data.skill}', which does not resolve to any taxonomy id or declared alias.`,
    };
  }

  if (!questionRendererRegistry.supports(parsedBlueprint.data.questionType)) {
    return {
      ok: false,
      kind: "invalid",
      message: `Blueprint '${blueprintId}' declares question type '${parsedBlueprint.data.questionType}', which has no registered renderer.`,
    };
  }

  return { ok: true, blueprint: parsedBlueprint.data, blueprintHash: hashJson(blueprintRecord) };
}
