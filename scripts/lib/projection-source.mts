/* Must precede every other import: `@/server/exam-bank` is `server-only`. */
import "./allow-server-only.mts";

import { execFileSync } from "node:child_process";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import { buildProjectionPlan, loadPublishedManifests, type ProjectionPlan } from "@/features/content-projection";
import { getExamBank } from "@/server/exam-bank";

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
 * Taken from the last commit that touched the curated bank, so the value is a
 * real fact about when that content was published and, crucially, is STABLE:
 * a wall-clock default would rewrite `published_at` on 1,005 rows every run and
 * make "did anything change" unanswerable. Falls back to a fixed constant
 * outside a git checkout.
 */
const CURATED_FALLBACK_PUBLISHED_AT = "2026-08-12T00:00:00.000Z";

export function curatedPublishedAt(): string {
  try {
    const iso = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", "src/content/questions/question-bank.ts"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return iso ? new Date(iso).toISOString() : CURATED_FALLBACK_PUBLISHED_AT;
  } catch {
    return CURATED_FALLBACK_PUBLISHED_AT;
  }
}

export async function buildPlanFromRepository(): Promise<ProjectionPlan> {
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
