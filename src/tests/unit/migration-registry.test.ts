import fs from "node:fs";

import { describe, expect, it } from "vitest";

import { MIGRATIONS, fileNameFor } from "../../../scripts/migrations/registry";

/**
 * Guards the *completeness* of the migration verification registry, without
 * touching a database, so it runs in the ordinary suite.
 *
 * `npm run migrations:status` is the command that catches repo-vs-live
 * drift, but it can only check migrations the registry knows about. Adding a
 * migration file and forgetting to register it would leave that migration
 * silently unverifiable — the drift checker would report "no drift" while
 * being blind to it, which is a worse failure than having no checker at all.
 * This test makes that omission fail immediately, in CI, with no database
 * needed.
 */

const MIGRATIONS_DIR = "supabase/migrations";

const filesOnDisk = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith(".sql"))
  .sort();

describe("migration verification registry", () => {
  it("has an entry for every migration file on disk", () => {
    const registered = MIGRATIONS.map(fileNameFor).sort();
    expect(registered).toEqual(filesOnDisk);
  });

  it("has no entry without a matching file", () => {
    for (const entry of MIGRATIONS) {
      expect(
        fs.existsSync(`${MIGRATIONS_DIR}/${fileNameFor(entry)}`),
        `registry lists ${fileNameFor(entry)}, which is not on disk`,
      ).toBe(true);
    }
  });

  /*
   * An entry with no checks would be recorded as "applied" the moment the
   * command ran, because every one of its zero checks passes vacuously —
   * exactly the dishonest baseline this whole mechanism exists to prevent.
   */
  it("gives every migration at least one object check", () => {
    for (const entry of MIGRATIONS) {
      expect(entry.checks.length, `${entry.version}_${entry.name} has no checks`).toBeGreaterThan(0);
    }
  });

  it("keeps versions unique and in filename order", () => {
    const versions = MIGRATIONS.map((entry) => entry.version);
    expect(new Set(versions).size).toBe(versions.length);
    expect([...versions].sort()).toEqual(versions);
  });

  it("names every check and gives it SQL returning a `present` column", () => {
    for (const entry of MIGRATIONS) {
      for (const check of entry.checks) {
        expect(check.describes.trim().length).toBeGreaterThan(0);
        expect(check.sql).toMatch(/\bas present\b/);
        /* Read-only by construction: a check must never mutate the schema
           it is inspecting. */
        expect(check.sql).not.toMatch(/\b(insert|update|delete|drop|alter|create|truncate)\b/i);
      }
    }
  });

  /*
   * Two migrations are only distinguishable from their un-applied state by
   * something subtler than "does an object exist" — a policy predicate and a
   * dropped index. Both were missed by an earlier, naive audit that checked
   * table names only, so they are pinned here.
   */
  it("verifies the exam_sessions role gate by predicate, not by policy existence", () => {
    const entry = MIGRATIONS.find((m) => m.name === "exam_sessions_student_role_gate");
    expect(entry).toBeDefined();
    expect(entry?.checks.some((check) => /role = ''student''/.test(check.sql))).toBe(true);
  });

  it("verifies the unique-session migration dropped its redundant index", () => {
    const entry = MIGRATIONS.find((m) => m.name === "exam_attempts_unique_session_id");
    expect(entry).toBeDefined();
    expect(
      entry?.checks.some((check) => /exam_attempts_session_id_idx/.test(check.sql)),
    ).toBe(true);
  });
});
