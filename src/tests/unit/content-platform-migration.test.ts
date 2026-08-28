import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve("supabase/migrations/20260825090000_content_factory_phase1.sql"), "utf8");

describe("Content Platform Phase 1 migration", () => {
  it("isolates authoring, private evidence and answers from learner roles", () => {
    expect(sql).toContain("revoke all on public.%I from anon, authenticated");
    expect(sql).toContain("private_evidence jsonb");
    expect(sql).not.toMatch(/grant\s+select\s+on\s+public\.authoring_question_revisions\s+to\s+authenticated/i);
  });

  it("pins immutable question, asset and form revisions", () => {
    expect(sql).toContain("authoring_question_revisions_immutable");
    expect(sql).toContain("content_asset_versions_immutable");
    expect(sql).toContain("assessment_form_items_immutable");
    expect(sql).toContain("runtime_item_version_id uuid not null unique references public.item_versions(id)");
    expect(sql).toContain("asset_version_ids uuid[] not null");
  });

  it("derives approval identity from auth and rejects agent self-review", () => {
    expect(sql).toContain("approved_by uuid not null references auth.users(id)");
    expect(sql).toContain("where id=auth.uid()");
    expect(sql).toContain("generator_origin = 'ai_codex' and reviewer_kind = 'ai_codex'");
    expect(sql).toContain("generator_origin = 'ai_claude' and reviewer_kind = 'ai_claude'");
  });
});
