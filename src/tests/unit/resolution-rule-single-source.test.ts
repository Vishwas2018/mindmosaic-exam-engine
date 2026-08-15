import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The resolution rule lives in exactly one place (spec §12.7 step 8).
 *
 * Step 8's central risk is not that a consumer resolves wrongly — it is that a
 * consumer resolves *separately*. Two implementations of "which model owns this
 * sitting, and how do I avoid counting a backfilled one twice" will agree on the
 * day they are written and disagree the first time one is edited, and the
 * disagreement surfaces as a dashboard and a history screen reporting different
 * numbers for the same child.
 *
 * So the rule is a database view, and this test is the fence around it: no
 * application file outside the dispatcher may name the tables the rule
 * reconciles. It walks the source tree rather than grepping a fixed list,
 * because ADR-005 §7's whole lesson is that a hand-maintained list of consumers
 * is exactly what misses one.
 */

const SOURCE_ROOT = join(process.cwd(), "src");

/** The tables the resolution rule reconciles, and must be the only reader of. */
const RECONCILED_TABLES = [
  "exam_attempts",
  "assessment_results",
  "assessment_sessions",
  "essay_marks",
  "manual_marks",
];

/**
 * Files allowed to name them, each for a stated reason.
 *
 * `read-dispatch.ts` is the rule's application-side entry point and reads the
 * views; it still names `exam_sessions`/`exam_responses` to fetch one legacy
 * sitting's paper, which is a per-session read rather than a resolution.
 *
 * The write paths name their own tables because they write them, and §12.7 step
 * 9 — not step 8 — is where legacy writes close. The marking route and marking
 * screen both resolve the SITTING through `visible_sittings` first and only then
 * read one legacy attempt's stored answers, by an id the resolution rule handed
 * them — which is a per-sitting read on the branch that needs it, not a second
 * answer to "which model owns this".
 */
const ALLOWED = new Set(
  [
    "server/assessment/read-dispatch.ts",
    "app/api/exam/session/[id]/responses/route.ts",
    "app/api/exam/session/[id]/submit/route.ts",
    "app/api/teacher/marking/route.ts",
    "app/teacher/marking/[sessionId]/[questionId]/page.tsx",
  ].map((path) => path.replace(/\//g, "\\")),
);

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "tests") continue;
      found.push(...sourceFiles(full));
      continue;
    }
    if (/\.tsx?$/.test(entry)) found.push(full);
  }
  return found;
}

/** A query, not a mention: `.from("exam_attempts")` rather than a comment. */
function queriesTable(source: string, table: string): boolean {
  return new RegExp(`\\.from\\(\\s*["'\`]${table}["'\`]`).test(source);
}

describe("the resolution rule has exactly one implementation", () => {
  it("no consumer queries the reconciled tables directly", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(SOURCE_ROOT)) {
      const relativePath = relative(SOURCE_ROOT, file);
      const normalised = relativePath.replace(/\//g, "\\");
      if (ALLOWED.has(normalised)) continue;

      const source = readFileSync(file, "utf8");
      for (const table of RECONCILED_TABLES) {
        if (queriesTable(source, table)) offenders.push(`${relativePath} -> ${table}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("the dispatcher reads the shared views rather than assembling its own union", () => {
    const dispatcher = readFileSync(
      join(SOURCE_ROOT, "server", "assessment", "read-dispatch.ts"),
      "utf8",
    );

    /* The rule's two halves — which model owns a sitting, and which rows to
       exclude — must both come from SQL. A `legacy_session_id` or
       `legacy_attempt_id` filter appearing here would mean the de-duplication
       had been re-implemented in TypeScript, where the admin views cannot
       reach it. */
    expect(dispatcher).toContain('"visible_sittings"');
    /* Inside a filter call, so this is about column names the dispatcher passes
       to the database — not about the prose around them, which has every reason
       to explain what `legacy_session_id` is and why the view uses it. */
    expect(dispatcher).not.toMatch(
      /\.(eq|is|not|select|or)\(\s*["'][^"']*legacy_(attempt|session)_id/,
    );
  });

  it("names every allowed exception, so an addition is a decision", () => {
    /* A list nobody has to justify is a list that grows. Each entry above has a
       reason written next to it; this asserts the list itself has not quietly
       expanded past what step 8 left behind. */
    expect(ALLOWED.size).toBe(5);
  });
});
