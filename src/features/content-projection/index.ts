/**
 * Phase 1 runtime content projection (spec §9, §21 Phase 1; ADR-002/003).
 *
 * Everything here is pure or filesystem-only — no database client, no
 * `server-only` marker, no import of the served bank. The caller supplies the
 * questions (the scripts read them through `scripts/lib/allow-server-only.mts`,
 * as `audit-bank.mts` does), which keeps the whole projection unit-testable and
 * means the shadow-compare checks the same code path the writer uses.
 */
export {
  buildProjectionPlan,
  itemIdOf,
  itemVersionIdOf,
  stimulusIdOf,
  stimulusVersionIdOf,
  type BuildPlanInput,
  type PlannedItem,
  type PlannedStimulus,
  type ProjectionPlan,
} from "./build-projection-plan";

export {
  PUBLISHED_MANIFESTS_DIR,
  loadPublishedManifests,
  type LoadedManifest,
  type ManifestLoadResult,
  type ReviewEvidenceKind,
} from "./load-manifests";

export {
  ANSWER_BEARING_FIELDS,
  contentHashOf,
  findAnswerLeaks,
  projectQuestion,
  projectStimulus,
  stimulusCodeOf,
  type ProjectedAnswer,
  type ProjectedCandidate,
  type ProjectedQuestion,
  type ProjectedSourceScope,
  type ProjectedStimulus,
  type ProjectionContext,
  type ProjectionSource,
} from "./project-question";
