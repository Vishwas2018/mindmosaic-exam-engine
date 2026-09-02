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
 * Two modules are sanctioned, one per operation: answer-access.ts is the sole
 * SELECT-side reader (20260812110000, mindmosaic_scoring); answer-version-
 * writer.ts is the sole INSERT-side writer (20260902090000,
 * mindmosaic_content_answer_writer). Each holds its own distinct credential
 * and its own least-privilege role — the read role has no INSERT grant, the
 * write role has no SELECT grant — so a leak of one never exposes the other's
 * capability. The checks below assert both directions independently, so a
 * write path bypassing answer-version-writer.ts (the failure that motivated
 * splitting this file) is caught the same way a rogue read path already was.
 *
 * The RLS suite proves each role holds only its intended grants. That is the
 * database half. This is the application half, and the two are independent: a
 * perfectly scoped credential pasted into a second file is still a second
 * holder of the answer table, and no amount of SQL testing would notice.
 *
 * All checks here are static reads of the source tree. Nothing is imported —
 * an import would prove the module loads, not that nothing else references it.
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");
const SCORING_MODULE = "src/server/scoring/answer-access.ts";
const SCORING_CREDENTIAL_ENV = "SCORING_DB_URL";
const WRITER_MODULE = "src/server/scoring/answer-version-writer.ts";
const WRITER_CREDENTIAL_ENV = "CONTENT_ANSWER_WRITER_DB_URL";
const BOUNDARY_MODULES = [
  { module: SCORING_MODULE, credentialEnv: SCORING_CREDENTIAL_ENV },
  { module: WRITER_MODULE, credentialEnv: WRITER_CREDENTIAL_ENV },
];
const SANCTIONED_TABLE_MODULES = new Set([SCORING_MODULE, WRITER_MODULE]);

/** Every other database credential either module must never fall back to. */
const FORBIDDEN_FALLBACK_CREDENTIALS = [
  "SUPABASE_DB_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SERVICE_ROLE",
  "DATABASE_URL",
  "RLS_TEST_DB_URL",
];

/**
 * Where a credential is legitimately named. Each is a deliberate exception
 * with a reason, and the list is short on purpose — extending it is the thing
 * this test is meant to make someone think twice about.
 */
const CREDENTIAL_EXCEPTIONS = new Set([
  /* The modules themselves. */
  SCORING_MODULE,
  WRITER_MODULE,
  /* This file, which names them in order to look for them. */
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

describe("each boundary credential is referenced by exactly one module", () => {
  it.each(BOUNDARY_MODULES)("names $credentialEnv nowhere else under src/", ({ module, credentialEnv }) => {
    const offenders = listSourceFiles("src").filter(
      (path) => !CREDENTIAL_EXCEPTIONS.has(path) && readCode(path).includes(credentialEnv),
    );
    expect(
      offenders,
      `${credentialEnv} may be read by ${module} alone (spec §9.3.1).`,
    ).toEqual([]);
  });

  it.each(BOUNDARY_MODULES)("$module refuses to fall back to any other database credential", ({ module, credentialEnv }) => {
    /* The failure this prevents is a well-meaning `?? SUPABASE_DB_URL` added
       to make a test or a local run easier: it would silently read or write
       with a credential that bypasses RLS, and every assertion in the RLS
       suite would still pass. Each module's own credential is excluded from
       its own forbidden list; the OTHER boundary module's credential is
       included, since answer-access.ts falling back to the writer's
       INSERT-only credential (or vice versa) is exactly the kind of
       cross-module leak this file exists to catch. */
    const source = readCode(module);
    const otherCredentials = BOUNDARY_MODULES.filter((entry) => entry.credentialEnv !== credentialEnv).map(
      (entry) => entry.credentialEnv,
    );
    for (const forbidden of [...FORBIDDEN_FALLBACK_CREDENTIALS, ...otherCredentials]) {
      expect(source, `${module} must not reach for ${forbidden}`).not.toContain(forbidden);
    }
  });
});

describe("each boundary module is server-only and unreachable from a client bundle", () => {
  it.each(BOUNDARY_MODULES)("$module carries the server-only runtime guard", ({ module }) => {
    expect(readSource(module)).toMatch(/import\s+["']server-only["'];/);
  });

  it.each(BOUNDARY_MODULES)("$module is imported by no 'use client' file", ({ module }) => {
    const importSpecifier = module.replace(/^src\//, "").replace(/\.ts$/, "");
    const candidates = listSourceFiles("src").filter((path) => path !== module);
    const offenders = candidates.filter((path) => {
      const source = readSource(path);
      if (!/^"use client";/.test(source)) return false;
      return source.includes(importSpecifier);
    });
    expect(offenders).toEqual([]);
  });

  it("neither module is re-exported from any barrel", () => {
    /* A barrel re-export is how a server-only module ends up in a client
       bundle without any client file naming it. Both boundary modules live
       under server/scoring/, so one pattern covers both. */
    const barrels = listSourceFiles("src").filter((path) => path.endsWith("/index.ts"));
    const offenders = barrels.filter((path) =>
      /export\s+.*from\s+["'][^"']*server\/scoring/.test(readSource(path)),
    );
    expect(offenders).toEqual([]);
  });
});

describe("each boundary module logs nothing (§17.4)", () => {
  it.each(BOUNDARY_MODULES)("$module contains no console call of any kind", ({ module }) => {
    /* §17.4 forbids answer keys in logs. Rather than trying to decide which log
       statements would be safe in a function that holds the answer key in a
       local variable, each module simply does not log — which is checkable,
       and "this log line does not include the key" is not, at least not
       durably. */
    const source = readSource(module);
    expect(source).not.toMatch(/console\s*\.\s*(log|info|warn|error|debug|trace|dir|table)\b/);
  });

  it("the scoring module exports no type that could carry answer data", () => {
    /* answer-access.ts never accepts an answer key as input either — it reads
       one internally and must never let it back out through a return type.
       The exported surface is the boundary: if a forbidden name ever appears
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

  it("the writer module accepts the answer key as input but returns none of it", () => {
    /* answer-version-writer.ts is the mirror image of answer-access.ts: its
       whole job is to ACCEPT the raw answer key, grading rules, rubric and
       private explanation as input, so "exports no type naming these fields"
       does not apply — an input type is not a leak. What must hold instead is
       that nothing comes back out: the insert function's declared return type
       is Promise<void>, so there is no return value a caller could read the
       key back out of. */
    const source = readSource(WRITER_MODULE);
    expect(
      source,
      `${WRITER_MODULE} must export an answer-insert function returning Promise<void>`,
    ).toMatch(/export\s+async\s+function\s+\w+\([^)]*\)\s*:\s*Promise<void>\s*\{/);
  });
});

describe("general application server code cannot read or write answers", () => {
  const READ_PATTERN = /\b(from|join)\s+public\.item_answer_versions\b/i;
  const WRITE_PATTERN = /\b(insert\s+into|update)\s+public\.item_answer_versions\b/i;

  it("no file outside the scoring module selects from item_answer_versions", () => {
    /* Spec §9.3: "general application server code MUST NOT select answer rows
       directly". The credentials the rest of the app holds could not do it
       anyway — anon and authenticated have zero privileges on that table, and
       the RLS suite asserts it — so this catches the other direction: someone
       adding a query through a credential that WOULD work, such as the
       service-role client in src/features/auth/provision-child.ts. Excludes
       answer-version-writer.ts too — that module is INSERT-only and must
       never gain a read path of its own; a select appearing there is the same
       failure as one appearing anywhere else. */
    const offenders = listSourceFiles("src")
      .filter((path) => path !== SCORING_MODULE && !path.startsWith("src/tests/"))
      .filter((path) => READ_PATTERN.test(readCode(path)));
    expect(offenders).toEqual([]);
  });

  it("no file outside the answer-version writer inserts or updates item_answer_versions", () => {
    /* The write-side counterpart: operator-service.ts's direct insert (the
       violation this file was written to catch) is exactly what this rejects
       now. Excludes answer-access.ts too — that module is SELECT-only and
       must never gain a write path of its own. */
    const offenders = listSourceFiles("src")
      .filter((path) => path !== WRITER_MODULE && !path.startsWith("src/tests/"))
      .filter((path) => WRITE_PATTERN.test(readCode(path)));
    expect(offenders).toEqual([]);
  });

  it("no file outside the two sanctioned modules references item_answer_versions at all", () => {
    /* The blanket containment check: even a mention that is neither a
       recognisable select nor a recognisable write (a differently-phrased
       query, a raw string built by concatenation) should not exist outside
       the two modules the spec sanctions. */
    const offenders = listSourceFiles("src")
      .filter((path) => !SANCTIONED_TABLE_MODULES.has(path) && !path.startsWith("src/tests/"))
      .filter((path) => readCode(path).includes("item_answer_versions"));
    expect(offenders).toEqual([]);
  });
});
