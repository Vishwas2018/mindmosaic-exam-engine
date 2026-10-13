/* Must precede every other import: `@/server/exam-bank` is `server-only`. */
import "./allow-server-only.mts";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import { buildProjectionPlan, loadPublishedManifests, type ProjectionPlan } from "@/features/content-projection";
import { getExamBank } from "@/server/exam-bank";
import { getPublicationEligibility } from "@/server/publication-evidence";

/**
 * Assembles the Phase 1 projection plan from the served bank and the factory
 * manifests. Shared by `project-runtime-content.mts` and
 * `shadow-compare-runtime-content.mts`, so the writer and the verifier can
 * never disagree about what the source says.
 *
 * Reads the bank through `@/server/exam-bank` — the same module the app serves
 * from — rather than parsing `content/`. `audit-bank.mts` established that rule
 * for the same reason it applies here: a count or a hash derived from files can
 * differ from what a child is actually given, and the whole point of a shadow
 * comparison is that it cannot.
 */

/**
 * Publication date for curated items, which have no per-item manifest.
 *
 * Commit 9b78c957 last changed the curated bank at 2026-08-10T17:47:09+10:00.
 * Pin that verified date rather than asking `git log` at runtime: shallow CI
 * checkouts treat the checkout commit as the file's first commit and would
 * falsely make historical questions appear newly published. Update this fact
 * deliberately when the curated bank itself changes.
 */
const CURATED_PUBLISHED_AT = "2026-08-10T07:47:09.000Z";

export function curatedPublishedAt(): string {
  return CURATED_PUBLISHED_AT;
}

export async function buildPlanFromRepository(): Promise<ProjectionPlan> {
  const eligibility = getPublicationEligibility();
  if (eligibility.problems.length) throw new Error(eligibility.problems.join("\n"));
  const { manifests, rejected } = await loadPublishedManifests();
  if (rejected.length > 0) {
    /* A manifest that fails the factory's own review-evidence rules must never
       reach the runtime (ADR-002 §4). Refusing the whole run rather than
       skipping the row keeps "projected" and "governed" the same set. */
    const detail = rejected
      .map((entry) => `  ${entry.file}\n    ${entry.issues.join("\n    ")}`)
      .join("\n");
    throw new Error(`${rejected.length} manifest(s) failed review-evidence validation:\n${detail}`);
  }

  return buildProjectionPlan({
    questions: getExamBank("published"),
    manifests,
    factoryQuestionIds: new Set(factoryPublishedQuestions.map((question) => question.id)),
    curatedPublishedAt: curatedPublishedAt(),
    ...(eligibility.approvals.size > 0 ? { approvals: eligibility.approvals } : {}),
  });
}

/** `RLS_TEST_DB_URL` first so a developer's existing local stack just works. */
export function projectionDbUrl(): string | undefined {
  return (
    process.env.PROJECTION_DB_URL ??
    process.env.RLS_TEST_DB_URL ??
    process.env.SUPABASE_DB_URL ??
    process.env.DATABASE_URL
  );
}
