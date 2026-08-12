import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The §9.3.1 module boundary, enforced by an automated check rather than by
 * convention — which is what the spec clause actually requires:
 *
 *   "Its credential MUST be distinct from every other database credential the
 *    application holds, and MUST be referenced by exactly one module."
 *   "The raw answer key, grading rules, rubric, and private explanation MUST
 *    NOT leave that module: never returned to a caller, never placed in a DTO,
 *    never logged (§17.4)."
 *   "...and the module boundary MUST be enforced by an automated check rather
 *    than by convention."
 *
 * The RLS suite proves the role holds only its intended grants. That is the
 * database half. This is the application half, and the two are independent: a
 * perfectly scoped credential pasted into a second file is still a second
 * holder of the answer table, and no amount of SQL testing would notice.
 *
 * All checks here are static reads of the source tree. Nothing is imported —
 * an import would prove the module loads, not that nothing else references it.
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");
const SCORING_MODULE = "src/server/scoring/answer-access.ts";
const CREDENTIAL_ENV = "SCORING_DB_URL";

/**
 * Where the credential is legitimately named. Each is a deliberate exception
 * with a reason, and the list is short on purpose — extending it is the thing
 * this test is meant to make someone think twice about.
 */
const CREDENTIAL_EXCEPTIONS = new Set([
  /* The module itself. */
  SCORING_MODULE,
  /* This file, which names it in order to look for it. */
  "src/tests/unit/scoring-module-boundary.test.ts",
]);

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

/**
 * Source with comments removed.
 *
 * Needed because the checks below look for table and variable names, and those
 * names legitimately appear in prose — `question-scorers.ts` explains where its
 * answer key comes from, and being able to write that sentence is worth more
 * than the simplicity of a raw substring search. Mangling a `//` inside a
 * string literal is harmless here: the result is only ever tested with
 * `includes`, never parsed.
 */
function readCode(relativePath: string): string {
  return readSource(relativePath)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
}

function listSourceFiles(relativeDir: string): string[] {
  const absoluteDir = join(ROOT, relativeDir);
  const entries: string[] = [];
  for (const entry of readdirSync(absoluteDir)) {
    const absolutePath = join(absoluteDir, entry);
    if (statSync(absolutePath).isDirectory()) {
      entries.push(...listSourceFiles(relative(ROOT, absolutePath)));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      entries.push(relative(ROOT, absolutePath).split("\\").join("/"));
    }
  }
  return entries;
}

describe("the scoring credential is referenced by exactly one module", () => {
  it("names SCORING_DB_URL nowhere else under src/", () => {
    const offenders = listSourceFiles("src").filter(
      (path) => !CREDENTIAL_EXCEPTIONS.has(path) && readCode(path).includes(CREDENTIAL_ENV),
    );
    expect(
      offenders,
      `${CREDENTIAL_ENV} is the mindmosaic_scoring credential and may be read by ` +
        `${SCORING_MODULE} alone (spec §9.3.1).`,
    ).toEqual([]);
  });

  it("refuses to fall back to any other database credential", () => {
    /* The failure this prevents is a well-meaning `?? SUPABASE_DB_URL` added
       to make a test or a local run easier: it would silently score with a
       credential that bypasses RLS, and every assertion in the RLS suite would
       still pass. */
    const source = readCode(SCORING_MODULE);
    for (const forbidden of [
      "SUPABASE_DB_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SERVICE_ROLE",
      "DATABASE_URL",
      "RLS_TEST_DB_URL",
    ]) {
      expect(source, `${SCORING_MODULE} must not reach for ${forbidden}`).not.toContain(
        forbidden,
      );
    }
  });
});

describe("the scoring module is server-only and unreachable from a client bundle", () => {
  it("carries the server-only runtime guard", () => {
    expect(readSource(SCORING_MODULE)).toMatch(/import\s+["']server-only["'];/);
  });

  it("is imported by no 'use client' file", () => {
    const candidates = listSourceFiles("src").filter((path) => path !== SCORING_MODULE);
    const offenders = candidates.filter((path) => {
      const source = readSource(path);
      if (!/^"use client";/.test(source)) return false;
      return source.includes("server/scoring/answer-access");
    });
    expect(offenders).toEqual([]);
  });

  it("is not re-exported from any barrel", () => {
    /* A barrel re-export is how a server-only module ends up in a client
       bundle without any client file naming it. */
    const barrels = listSourceFiles("src").filter((path) => path.endsWith("/index.ts"));
    const offenders = barrels.filter((path) =>
      /export\s+.*from\s+["'][^"']*server\/scoring/.test(readSource(path)),
    );
    expect(offenders).toEqual([]);
  });
});

describe("the scoring module logs nothing (§17.4)", () => {
  it("contains no console call of any kind", () => {
    /* §17.4 forbids answer keys in logs. Rather than trying to decide which log
       statements would be safe in a function that holds the answer key in a
       local variable, the module simply does not log — which is checkable, and
       "this log line does not include the key" is not, at least not durably. */
    const source = readSource(SCORING_MODULE);
    expect(source).not.toMatch(/console\s*\.\s*(log|info|warn|error|debug|trace|dir|table)\b/);
  });

  it("exports no type that could carry answer data", () => {
    /* The exported surface is the boundary. If a type named below ever appears
       in it, the answer has a route out that type-checks. */
    const source = readSource(SCORING_MODULE);
    const exported = source.match(/^export\s+(interface|type|class|function|const)\s+\w+/gm) ?? [];
    expect(exported.length, "the module must export something").toBeGreaterThan(0);

    for (const forbidden of ["answerKey", "answer_key", "rubric", "gradingRules", "privateExplanation"]) {
      /* Searched over the whole file rather than only the export list, then
         narrowed: the module DOES read these columns, so the assertion is that
         none of them appears inside an exported interface. */
      const inExportedInterface = new RegExp(
        `export\\s+interface\\s+\\w+\\s*\\{[^}]*\\b${forbidden}\\b`,
        "s",
      );
      expect(source, `${forbidden} must not appear in an exported interface`).not.toMatch(
        inExportedInterface,
      );
    }
  });
});

describe("general application server code cannot read answers", () => {
  it("no file outside the scoring module selects from item_answer_versions", () => {
    /* Spec §9.3: "general application server code MUST NOT select answer rows
       directly". The credentials the rest of the app holds could not do it
       anyway — anon and authenticated have zero privileges on that table, and
       the RLS suite asserts it — so this catches the other direction: someone
       adding a query through a credential that WOULD work, such as the
       service-role client in src/features/auth/provision-child.ts. */
    const offenders = listSourceFiles("src")
      .filter((path) => path !== SCORING_MODULE && !path.startsWith("src/tests/"))
      .filter((path) => readCode(path).includes("item_answer_versions"));
    expect(offenders).toEqual([]);
  });
});
