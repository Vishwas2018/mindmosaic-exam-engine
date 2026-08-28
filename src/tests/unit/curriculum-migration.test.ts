import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MIGRATIONS } from "../../../scripts/migrations/registry";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const SQL = readFileSync(
  join(ROOT, "supabase/migrations/20260827090000_curriculum_platform_foundation.sql"),
  "utf8",
);

describe("curriculum platform migration", () => {
  it("is present once in the canonical migration registry", () => {
    expect(MIGRATIONS.filter(({ name }) => name === "curriculum_platform_foundation")).toHaveLength(1);
  });

  it("creates the authoritative tables and licence evidence boundary", () => {
    for (const table of [
      "curriculum_jurisdictions",
      "curriculum_licence_evidence",
      "curriculum_sources",
      "curriculum_releases",
      "curriculum_nodes",
      "curriculum_applicabilities",
      "curriculum_crosswalks",
      "curriculum_taxonomy_alignments",
      "curriculum_review_events",
    ]) {
      expect(SQL).toContain(`create table public.${table}`);
    }
    expect(SQL).toContain("curriculum_sources_licence_evidence");
    expect(SQL).toContain("curriculum_releases_source_scope");
    expect(SQL).toContain("licence evidence does not permit official-text storage");
  });

  it("enforces terminal review transitions and append-only entities", () => {
    expect(SQL).toContain("first curriculum review status must be draft");
    expect(SQL).toContain("draft curriculum review may transition only to in_review");
    expect(SQL).toContain("approved or rejected curriculum review is terminal");
    expect(SQL).toContain("reject_curriculum_record_mutation");
  });

  it("widens profiles safely without granting direct preference updates", () => {
    expect(SQL).toContain("year_level between 1 and 12");
    expect(SQL).toContain("profiles_curriculum_preference_pair");
    expect(SQL).toContain("profiles_curriculum_preferences_students_only");
    expect(SQL).not.toMatch(
      /grant\s+update\s*\([^)]*curriculum_(?:jurisdiction_code|school_sector)[^)]*\)\s+on\s+public\.profiles\s+to\s+authenticated/i,
    );
  });

  it("does not seed descriptors or mutate assessment-delivery framework versions", () => {
    expect(SQL).not.toMatch(/insert\s+into\s+public\.curriculum_(?:sources|releases|nodes)/i);
    expect(SQL).not.toMatch(
      /(?:insert\s+into|update|delete\s+from)\s+public\.framework_versions/i,
    );
  });

  it("keeps programme regions aligned with the TypeScript vocabulary", () => {
    for (const region of ["AU", "ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]) {
      expect(SQL).toContain(`'${region}'`);
    }
    expect(SQL).toContain("region = 'global'");
  });
});
