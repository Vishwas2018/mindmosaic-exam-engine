import { hashContent } from "@/features/question-factory/provenance/content-hash";
import type { Question } from "@/schemas/question.schema";

import type { LoadedManifest } from "./load-manifests";
import {
  findAnswerLeaks,
  projectQuestion,
  type ProjectedQuestion,
  type ProjectedStimulus,
  type ProjectionSource,
} from "./project-question";

/**
 * Turns the served bank plus the factory manifests into the exact set of rows
 * the runtime projection should contain (spec §9, ADR-002/003).
 *
 * Pure and offline — no database, no filesystem. That is what lets the whole
 * 1,293-item projection be built and checked in `npm test`, and it means the
 * shadow-compare's source side is proven by the same code the insert side uses.
 */

/**
 * A deterministic UUID for an item, derived from its stable code.
 *
 * Derived rather than database-generated so that re-running the projection
 * produces the same `items.id` every time. Idempotency then does not depend on
 * reading existing rows back before writing, and a partially completed run
 * resumes cleanly instead of creating a second identity for the same question.
 *
 * Formatted as a valid v8 (custom) UUID: RFC 9562 reserves version 8 for
 * implementation-defined derivation, which is exactly what this is. Using v4's
 * bits would claim randomness this value does not have.
 */
export function itemIdOf(itemCode: string): string {
  const hex = hashContent(`mindmosaic:item:${itemCode}`);
  const version = "8";
  /* Variant 10xx — one of 8, 9, a, b. */
  const variant = "89ab"[parseInt(hex[16], 16) % 4];
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    version + hex.slice(13, 16),
    variant + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join("-");
}

/** Same derivation, for a deduplicated stimulus. */
export function stimulusIdOf(stimulusCode: string): string {
  return itemIdOf(`stimulus:${stimulusCode}`);
}

/**
 * ...and for the version row. Separate from `stimulusIdOf` because a stimulus
 * and its first version are different rows that must not share a primary key,
 * and keyed on the content hash so re-running lands on the same version.
 */
export function stimulusVersionIdOf(contentHash: string): string {
  return itemIdOf(`stimulus-version:${contentHash}`);
}

/** And for the item version, so an interrupted run resumes rather than duplicates. */
export function itemVersionIdOf(contentHash: string): string {
  return itemIdOf(`item-version:${contentHash}`);
}

export interface PlannedStimulus extends ProjectedStimulus {
  readonly stimulusId: string;
  readonly stimulusVersionId: string;
  readonly revision: number;
  /** Item codes that pin this stimulus — the dedupe evidence. */
  readonly usedBy: readonly string[];
}

export interface PlannedItem extends ProjectedQuestion {
  readonly itemId: string;
  readonly itemVersionId: string;
  readonly stimulusId: string | null;
  readonly stimulusVersionId: string | null;
}

export interface ProjectionPlan {
  readonly items: readonly PlannedItem[];
  readonly stimuli: readonly PlannedStimulus[];
  readonly manifests: readonly LoadedManifest[];
  /** Anything that would make the projection wrong. Non-empty = do not write. */
  readonly problems: readonly string[];
  readonly counts: {
    readonly total: number;
    readonly curated: number;
    readonly factory: number;
    readonly withStimulus: number;
    readonly distinctStimuli: number;
  };
}

export interface BuildPlanInput {
  /** `publishedExamBank` — curated plus factory-published, in bank order. */
  readonly questions: readonly Question[];
  /** Loaded from `content/question-factory/published-manifests/`. */
  readonly manifests: readonly LoadedManifest[];
  /**
   * Ids belonging to the factory pool (`factoryPublishedQuestions`). Passed in
   * rather than inferred from the id prefix: `man-` is a convention, and a
   * convention is not a provenance record.
   */
  readonly factoryQuestionIds: ReadonlySet<string>;
  /**
   * Publication timestamp for curated items, which have no manifest and so no
   * per-item date. The caller supplies one deterministic value — the projection
   * script uses the bank's own git commit date — so re-running does not churn.
   */
  readonly curatedPublishedAt: string;
}

export function buildProjectionPlan(input: BuildPlanInput): ProjectionPlan {
  const { questions, manifests, factoryQuestionIds, curatedPublishedAt } = input;
  const problems: string[] = [];

  const manifestByQuestionId = new Map<string, LoadedManifest>();
  for (const manifest of manifests) {
    const existing = manifestByQuestionId.get(manifest.questionId);
    if (existing) {
      /* Two manifests claiming one question means provenance is ambiguous, and
         picking either would be a guess recorded as a fact. */
      problems.push(
        `question '${manifest.questionId}' has two manifests: ${existing.id} and ${manifest.id}`,
      );
      continue;
    }
    manifestByQuestionId.set(manifest.questionId, manifest);
  }

  const items: PlannedItem[] = [];
  const stimulusByHash = new Map<string, { stimulus: ProjectedStimulus; usedBy: string[] }>();
  const seenCodes = new Set<string>();
  const seenHashes = new Map<string, string>();

  for (const question of questions) {
    if (seenCodes.has(question.id)) {
      problems.push(`duplicate item code '${question.id}' in the source bank`);
      continue;
    }
    seenCodes.add(question.id);

    const isFactory = factoryQuestionIds.has(question.id);
    const manifest = manifestByQuestionId.get(question.id);

    if (isFactory && !manifest) {
      problems.push(`factory question '${question.id}' has no published manifest`);
      continue;
    }
    if (!isFactory && manifest) {
      /* A curated question with a manifest would mean the two pools overlap,
         and provenance_class could not be assigned from pool membership. */
      problems.push(
        `curated question '${question.id}' unexpectedly has manifest ${manifest.id}`,
      );
      continue;
    }

    const source: ProjectionSource = manifest
      ? {
          provenanceClass: "factory_manifest",
          manifestId: manifest.id,
          manifestSchemaVersion: manifest.manifestSchemaVersion,
          ...(manifest.correctnessBasis ? { correctnessBasis: manifest.correctnessBasis } : {}),
          reviewEvidenceKind: manifest.reviewEvidenceKind,
          publishedAt: manifest.publishedAt,
          revision: manifest.revision,
          ...(manifest.blueprintId ? { blueprintId: manifest.blueprintId } : {}),
        }
      : { provenanceClass: "curated_git_authored", publishedAt: curatedPublishedAt };

    const itemId = itemIdOf(question.id);

    let projected: ProjectedQuestion;
    try {
      projected = projectQuestion(question, { itemId, source });
    } catch (error) {
      problems.push(
        `'${question.id}' failed runtime-content-version validation: ${
          error instanceof Error ? error.message.split("\n")[0] : String(error)
        }`,
      );
      continue;
    }

    const leaks = findAnswerLeaks(projected.candidate);
    if (leaks.length > 0) {
      /* §9.3. A leak here is not a warning: it would put an answer key in a
         table learners are eventually meant to read from. */
      problems.push(`'${question.id}' leaks answer material into candidate content: ${leaks.join(", ")}`);
      continue;
    }

    const collidesWith = seenHashes.get(projected.contentHash);
    if (collidesWith) {
      problems.push(
        `content-hash collision: '${question.id}' and '${collidesWith}' hash identically`,
      );
      continue;
    }
    seenHashes.set(projected.contentHash, question.id);

    let stimulusId: string | null = null;
    let stimulusVersionId: string | null = null;
    if (projected.stimulus) {
      const entry = stimulusByHash.get(projected.stimulus.contentHash);
      if (entry) {
        entry.usedBy.push(question.id);
      } else {
        stimulusByHash.set(projected.stimulus.contentHash, {
          stimulus: projected.stimulus,
          usedBy: [question.id],
        });
      }
      stimulusId = stimulusIdOf(projected.stimulus.stimulusCode);
      stimulusVersionId = stimulusVersionIdOf(projected.stimulus.contentHash);
    }

    items.push({
      ...projected,
      itemId,
      itemVersionId: itemVersionIdOf(projected.contentHash),
      stimulusId,
      stimulusVersionId,
    });
  }

  const stimuli: PlannedStimulus[] = [...stimulusByHash.values()]
    .map(({ stimulus, usedBy }) => ({
      ...stimulus,
      stimulusId: stimulusIdOf(stimulus.stimulusCode),
      stimulusVersionId: stimulusVersionIdOf(stimulus.contentHash),
      revision: 1,
      usedBy,
    }))
    .sort((a, b) => a.stimulusCode.localeCompare(b.stimulusCode));

  /* Every manifest must be claimed by exactly one projected item. An orphan
     means either a published question vanished from the bank or the pools
     disagree — both are drift the exit gate must catch, not tolerate. */
  const projectedManifestIds = new Set(
    items.map((item) => item.publicationManifestId).filter((id): id is string => id !== null),
  );
  for (const manifest of manifests) {
    if (!projectedManifestIds.has(manifest.id)) {
      problems.push(`manifest ${manifest.id} (question '${manifest.questionId}') projects nothing`);
    }
  }

  const curated = items.filter((item) => item.provenanceClass === "curated_git_authored").length;

  return {
    items,
    stimuli,
    manifests,
    problems,
    counts: {
      total: items.length,
      curated,
      factory: items.length - curated,
      withStimulus: items.filter((item) => item.stimulus !== null).length,
      distinctStimuli: stimuli.length,
    },
  };
}
