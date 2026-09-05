import fs from "node:fs";

import { describe, expect, it } from "vitest";

const capabilitySql = fs.readFileSync(
  "supabase/migrations/20260820090000_assessment_capability_expansion.sql",
  "utf8",
);

const authoritySql = fs.readFileSync(
  "supabase/migrations/20260822090000_programme_offering_authority.sql",
  "utf8",
);

const sql = `${capabilitySql}\n${authoritySql}`;

describe("assessment capability migration security contract", () => {
  it("enforces the programme offering natural key without conflating readiness", () => {
    expect(sql).toMatch(/unique\s*\(programme_id, subject_id, year_level, locale, region\)/i);
    expect(sql).not.toMatch(/content_ready\s+boolean/i);
  });

  it("keeps media scripts private and playback logs content-free", () => {
    expect(sql).toMatch(/create table public\.media_asset_private_scripts/i);
    expect(sql).toMatch(/revoke all[\s\S]*media_asset_private_scripts[\s\S]*from anon, authenticated/i);
    const playbackDefinition = sql.match(/create table public\.media_playback_events\s*\(([\s\S]*?)\);/i)?.[1] ?? "";
    expect(playbackDefinition).not.toMatch(/transcript|script|response|prompt/i);
  });

  it("enables RLS for every new scoped/private table and revokes learner grants", () => {
    for (const table of [
      "programme_offerings",
      "media_asset_versions",
      "media_asset_private_scripts",
      "item_version_media",
      "item_group_versions",
      "item_group_version_stimuli",
      "item_group_version_items",
      "media_playback_events",
    ]) {
      expect(sql).toContain(`alter table public.${table} enable row level security;`);
      expect(sql).toMatch(new RegExp(`revoke all[\\s\\S]*${table}[\\s\\S]*from anon, authenticated`, "i"));
    }
  });

  it("pins ordered group children and session membership", () => {
    expect(sql).toMatch(/unique\s*\(item_group_version_id, ordinal\)/i);
    expect(sql).toMatch(/unique\s*\(session_id, item_group_version_id, group_ordinal\)/i);
  });
});
