import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { connect } from "./db";
import { asAnon, asAuthenticated, seed, STUDENT_A } from "./fixtures";

const ITEM = "99999999-0000-0000-0000-000000000001";
const VERSION = "99999999-0000-0000-0000-000000000002";
const SESSION = "99999999-0000-0000-0000-000000000003";
const HASH = "a".repeat(64);
const FINGERPRINT = "b".repeat(64);
const TIME = "2026-10-05T05:00:00.000Z";
let client: Client;

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
  await client.query(`insert into public.items (id,item_code,origin,provenance_class)
    values ($1,'approval-boundary-fixture','original_seed','curated_git_authored')`, [ITEM]);
  await client.query(`insert into public.item_versions
    (id,item_id,revision,question_type,prompt,candidate_content,accessibility,estimated_time_seconds,
     authored_difficulty,marks_available,content_schema_version,content_hash,provenance_class,published_at,
     source_year_level,source_exam_style,source_subject,answer_kind,source_strand,source_topic)
    values ($1,$2,1,'multiple_choice','Private test fixture','{"options":[]}','{}',40,'easy',1,1,$3,
     'curated_git_authored',now(),3,'naplan_style','numeracy','single_option','number','addition')`, [VERSION, ITEM, HASH]);
  await client.query(`insert into public.assessment_sessions
    (id,student_id,assessment_profile_version,framework_version,blueprint_version,taxonomy_version,
     engine_algorithm_version,scoring_algorithm_version,content_build_version,seed,config,expires_at)
    values ($1,$2,'phase2-fixed-profile.v1','phase2-fixed-framework.v1','phase2-unblueprinted.v1',
     'phase2-untaxonomised.v1','fixed_scope_seeded.v1','question-scorers.v1','fixture','seed','{}',now()+interval '1 hour')`,
    [SESSION, STUDENT_A]);
});
afterEach(async () => { await client.query("rollback"); await client.end(); });

async function approve(contentHash = HASH) {
  const evidence = { kind: "human_publication_approval", schemaVersion: 1, approvedBy: "fixture-human-reviewer",
    approvedAt: TIME, revision: 1, fingerprint: FINGERPRINT, question: { id: "approval-boundary-fixture" },
    checks: { correctness: true, originality: true, ageAppropriateness: true } };
  await client.query(`insert into public.item_publication_approvals
    (item_version_id,content_hash,approved_by,approved_at,source_revision,approval_fingerprint,approval_evidence)
    values ($1,$2,'fixture-human-reviewer',$3,1,$4,$5)`, [VERSION, contentHash, TIME, FINGERPRINT, evidence]);
}
async function allocate() {
  return client.query(`insert into public.assessment_session_items
    (session_id,global_ordinal,within_stage_ordinal,item_id,item_version_id,content_hash,seed)
    values ($1,1,1,$2,$3,$4,'seed')`, [SESSION, ITEM, VERSION, HASH]);
}

describe("revision-bound database publication gate", () => {
  it("rejects allocation of unsigned content", async () => {
    await expect(allocate()).rejects.toMatchObject({ code: "MM212" });
  });
  it("allows an explicitly approved matching immutable version", async () => {
    await approve();
    await expect(allocate()).resolves.toMatchObject({ rowCount: 1 });
    await asAuthenticated(client, STUDENT_A);
    const result = await client.query("select public.get_assessment_session($1) as session", [SESSION]);
    expect(result.rows[0].session).toBeTruthy();
  });
  it("rejects an approval bound to a different projection hash", async () => {
    await approve("c".repeat(64));
    await expect(allocate()).rejects.toMatchObject({ code: "MM212" });
  });
  it.each(["anon", "authenticated"])("keeps private approval snapshots inaccessible to %s", async role => {
    await approve();
    if (role === "anon") await asAnon(client); else await asAuthenticated(client, STUDENT_A);
    await expect(client.query("select * from public.item_publication_approvals")).rejects.toMatchObject({ code: "42501" });
  });
  it("prevents rewriting recorded approval evidence", async () => {
    await approve();
    await expect(client.query("update public.item_publication_approvals set approved_by='changed'")).rejects.toThrow();
  });
  it("rejects an empty approval evidence object", async () => {
    await expect(client.query(`insert into public.item_publication_approvals
      (item_version_id,content_hash,approved_by,approved_at,source_revision,approval_fingerprint,approval_evidence)
      values ($1,$2,'fixture-human-reviewer',$3,1,$4,'{}')`, [VERSION, HASH, TIME, FINGERPRINT]))
      .rejects.toMatchObject({ code: "23514" });
  });
});
