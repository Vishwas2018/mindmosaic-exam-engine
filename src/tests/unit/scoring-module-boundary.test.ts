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

export type ItemAnswerVersionsAccessKind = "read" | "write_only" | "none";

/**
 * Inspects stripped source code for references to item_answer_versions.
 * Identifies whether any read (SELECT, JOIN, table scan, dynamic reference) is attempted,
 * or whether EVERY occurrence is strictly an authorized publication write (INSERT).
 *
 * Spec §9.3: "Publication/administration jobs may write through separately
 * audited server credentials, but general application server code MUST NOT
 * select answer rows directly."
 *
 * Fail-closed design:
 * 1. If "item_answer_versions" does not appear at all -> "none".
 * 2. If any known read pattern appears (SELECT, FROM, JOIN, Supabase .select()) -> "read".
 * 3. We identify and strip out all recognized write-only expressions (SQL INSERT, Supabase .insert()).
 * 4. After removing recognized write-only expressions, if ANY occurrence of "item_answer_versions"
 *    remains unaccounted for in the file, it is classified as "read" (fail-closed).
 * 5. If at least one recognized write was found and zero references remain -> "write_only".
 */
export function classifyItemAnswerVersionsAccess(code: string): ItemAnswerVersionsAccessKind {
  const normalized = code.toLowerCase();
  if (!normalized.includes("item_answer_versions")) {
    return "none";
  }

  // Known read patterns that immediately fail as "read"
  const hasFromOrJoin = /\b(from|join)\s+(public\.)?item_answer_versions\b/i.test(code);
  const hasSupabaseSelect = /\.from\(\s*["'](public\.)?item_answer_versions["']\s*\)\s*\.select\b/i.test(code);

  if (hasFromOrJoin || hasSupabaseSelect) {
    return "read";
  }

  // Strip all recognized write-only expressions:
  // 1. Raw SQL INSERT INTO [public.]item_answer_versions
  // 2. Supabase client .from(["'][public.]item_answer_versions["']).insert
  const remaining = code
    .replace(/\binsert\s+into\s+(public\.)?item_answer_versions\b/gi, "")
    .replace(/\.from\(\s*["'](public\.)?item_answer_versions["']\s*\)\s*\.insert\b/gi, "");

  // If any reference to item_answer_versions remains unaccounted for after stripping writes,
  // it is treated as a read (fail-closed defense in depth).
  if (remaining.toLowerCase().includes("item_answer_versions")) {
    return "read";
  }

  return "write_only";
}

/** Authorized publication/administration writers permitted by spec §9.3. */
const AUTHORIZED_PUBLICATION_WRITERS = new Set([
  "src/features/content-platform/operator-service.ts",
]);

describe("general application server code cannot read answers (§9.3)", () => {
  it("no file outside the scoring module selects or reads from item_answer_versions", () => {
    /* Spec §9.3: "general application server code MUST NOT select answer rows
       directly". The credentials the rest of the app holds could not do it
       anyway — anon and authenticated have zero privileges on that table, and
       the RLS suite asserts it — so this catches the other direction: someone
       adding a query through a credential that WOULD work, such as the
       service-role client in src/features/auth/provision-child.ts. */
    const readers = listSourceFiles("src")
      .filter((path) => path !== SCORING_MODULE && !path.startsWith("src/tests/"))
      .filter((path) => classifyItemAnswerVersionsAccess(readCode(path)) === "read");
    expect(readers).toEqual([]);
  });

  it("only authorized publication services may execute INSERT into item_answer_versions", () => {
    /* Spec §9.3: "Publication/administration jobs may write through separately
       audited server credentials". This asserts that only documented publication
       modules write to the answer table. */
    const writers = listSourceFiles("src")
      .filter((path) => !path.startsWith("src/tests/"))
      .filter((path) => classifyItemAnswerVersionsAccess(readCode(path)) === "write_only")
      .filter((path) => !AUTHORIZED_PUBLICATION_WRITERS.has(path));
    expect(writers).toEqual([]);
  });

  it("proves the existing publication INSERT in operator-service.ts is authorized and present", () => {
    const operatorPath = "src/features/content-platform/operator-service.ts";
    const access = classifyItemAnswerVersionsAccess(readCode(operatorPath));
    expect(access).toBe("write_only");
    expect(AUTHORIZED_PUBLICATION_WRITERS.has(operatorPath)).toBe(true);
  });
});

describe("regression coverage for item_answer_versions access classifier", () => {
  it("classifies unauthorized SQL SELECT as read", () => {
    const code = 'const res = await client.query("SELECT * FROM public.item_answer_versions WHERE item_version_id = $1");';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("read");
  });

  it("classifies SQL JOIN with item_answer_versions as read", () => {
    const code = 'const res = await client.query("SELECT iv.id, av.answer_key FROM item_versions iv JOIN item_answer_versions av ON av.item_version_id = iv.id");';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("read");
  });

  it("classifies Supabase postgrest select as read", () => {
    const code = 'const { data } = await supabase.from("item_answer_versions").select("answer_key").eq("item_version_id", id);';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("read");
  });

  it("classifies raw publication INSERT as write_only", () => {
    const code = 'await client.query("insert into public.item_answer_versions(item_version_id, answer_key) values($1, $2)", [id, key]);';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("write_only");
  });

  it("classifies Supabase postgrest insert as write_only", () => {
    const code = 'await supabase.from("item_answer_versions").insert({ item_version_id: id, answer_key: key });';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("write_only");
  });

  it("classifies code without table reference as none", () => {
    const code = 'const x = 42; console.log(x);';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("none");
  });

  it("fails closed on ambiguous non-insert table reference", () => {
    const code = 'const tableName = "item_answer_versions"; doSomethingDynamic(tableName);';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("read");
  });

  // Specific regression coverage for user-mandated cases
  it("classifies authorized INSERT plus dynamic Supabase read using table-name variable as read", () => {
    const code = `
      await client.query("insert into public.item_answer_versions(item_version_id, answer_key) values($1, $2)", [id, key]);
      const table = "item_answer_versions";
      const { data } = await supabase.from(table).select("*");
    `;
    expect(classifyItemAnswerVersionsAccess(code)).toBe("read");
  });

  it("classifies authorized INSERT plus unrecognized SQL read form as read", () => {
    const code = `
      await client.query("insert into public.item_answer_versions(item_version_id, answer_key) values($1, $2)", [id, key]);
      const rawQuery = "TABLE " + "item_answer_versions";
      const res = await client.query(rawQuery);
    `;
    expect(classifyItemAnswerVersionsAccess(code)).toBe("read");
  });

  it("classifies multiple authorized INSERT statements with no reads as write_only", () => {
    const code = `
      await client.query("insert into public.item_answer_versions(item_version_id, answer_key) values($1, $2)", [id1, key1]);
      await client.query("insert into item_answer_versions(item_version_id, answer_key) values($1, $2)", [id2, key2]);
      await supabase.from("item_answer_versions").insert({ item_version_id: id3, answer_key: key3 });
      await supabase.from('public.item_answer_versions').insert({ item_version_id: id4, answer_key: key4 });
    `;
    expect(classifyItemAnswerVersionsAccess(code)).toBe("write_only");
  });

  it("classifies the existing operator-service.ts as write_only", () => {
    const operatorPath = "src/features/content-platform/operator-service.ts";
    const access = classifyItemAnswerVersionsAccess(readCode(operatorPath));
    expect(access).toBe("write_only");
  });

  // Case-insensitive SQL classification regression tests
  it("classifies uppercase SELECT * FROM ITEM_ANSWER_VERSIONS as read", () => {
    const code = 'const res = await client.query("SELECT * FROM ITEM_ANSWER_VERSIONS WHERE ITEM_VERSION_ID = $1");';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("read");
  });

  it("classifies mixed-case JOIN Public.Item_Answer_Versions as read", () => {
    const code = 'const res = await client.query("SELECT iv.id FROM Item_Versions iv JOIN Public.Item_Answer_Versions av ON av.item_version_id = iv.id");';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("read");
  });

  it("classifies uppercase INSERT INTO PUBLIC.ITEM_ANSWER_VERSIONS as write_only", () => {
    const code = 'await client.query("INSERT INTO PUBLIC.ITEM_ANSWER_VERSIONS(ITEM_VERSION_ID, ANSWER_KEY) VALUES($1, $2)", [id, key]);';
    expect(classifyItemAnswerVersionsAccess(code)).toBe("write_only");
  });

  it("classifies uppercase insert combined with uppercase/dynamic read as read", () => {
    const code = `
      await client.query("INSERT INTO PUBLIC.ITEM_ANSWER_VERSIONS(ITEM_VERSION_ID, ANSWER_KEY) VALUES($1, $2)", [id, key]);
      const DYNAMIC_TABLE = "ITEM_ANSWER_VERSIONS";
      await client.query("TABLE " + DYNAMIC_TABLE);
    `;
    expect(classifyItemAnswerVersionsAccess(code)).toBe("read");
  });

  it("preserves standard lowercase behavior across all checks", () => {
    const readCodeSnippet = 'select answer_key from item_answer_versions;';
    const writeCodeSnippet = 'insert into item_answer_versions(id) values(1);';
    expect(classifyItemAnswerVersionsAccess(readCodeSnippet)).toBe("read");
    expect(classifyItemAnswerVersionsAccess(writeCodeSnippet)).toBe("write_only");
  });
});
