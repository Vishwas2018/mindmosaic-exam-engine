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
let profileVersionId: string | null = null;

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);

  const profileRes = await client.query<{ profile_version_id: string }>(`
    select apv.id as profile_version_id
    from public.programme_offerings po
    join public.assessment_profile_versions apv on apv.programme_offering_id = po.id
    where po.subject_id = 'numeracy' and po.year_level = 3 and apv.availability = 'available'
    limit 1
  `);
  profileVersionId = profileRes.rows[0]?.profile_version_id ?? null;

  await client.query(`insert into public.items (id,item_code,origin,provenance_class)
    values ($1,'approval-boundary-fixture','original_seed','curated_git_authored')`, [ITEM]);
  await client.query(`insert into public.item_versions
    (id,item_id,revision,question_type,prompt,candidate_content,accessibility,estimated_time_seconds,
     authored_difficulty,marks_available,content_schema_version,content_hash,provenance_class,published_at,
     source_year_level,source_exam_style,source_subject,answer_kind,source_strand,source_topic)
    values ($1,$2,1,'multiple_choice','Private test fixture','{"options":[]}','{}',40,'easy',1,1,$3,
     'curated_git_authored',now(),3,'naplan_style','numeracy','single_option','number','addition')`, [VERSION, ITEM, HASH]);
  await client.query(`insert into public.assessment_sessions
    (id,student_id,assessment_profile_version,assessment_profile_version_id,framework_version,blueprint_version,taxonomy_version,
     engine_algorithm_version,scoring_algorithm_version,content_build_version,seed,config,expires_at)
    values ($1,$2,'phase2-fixed-profile.v1',$3,'phase2-fixed-framework.v1','phase2-unblueprinted.v1',
     'phase2-untaxonomised.v1','fixed_scope_seeded.v1','question-scorers.v1','fixture','seed','{}',now()+interval '1 hour')`,
    [SESSION, STUDENT_A, profileVersionId]);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

async function enableEnforcement(programmeId = "naplan-y3-numeracy", enforced = true) {
  await client.query(`
    insert into public.publication_gate_settings (programme_id, enforced)
    values ($1, $2)
    on conflict (programme_id) do update set enforced = excluded.enforced
  `, [programmeId, enforced]);
}

async function approve(contentHash = HASH) {
  const evidence = {
    kind: "human_publication_approval",
    schemaVersion: 1,
    approvedBy: "fixture-human-reviewer",
    approvedAt: TIME,
    revision: 1,
    fingerprint: FINGERPRINT,
    question: { id: "approval-boundary-fixture" },
    checks: { correctness: true, originality: true, ageAppropriateness: true },
  };
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
  it("defaults to report mode: allows allocation when gate is not enforced or row is absent", async () => {
    // Default state: no row in publication_gate_settings
    await expect(allocate()).resolves.toMatchObject({ rowCount: 1 });
  });

  it("rejects allocation of unapproved content when programme is in enforce mode", async () => {
    await enableEnforcement("naplan-y3-numeracy", true);
    await expect(allocate()).rejects.toMatchObject({ code: "MM212" });
  });

  it("proves a client cannot choose or bypass gate mode via request payload or session config", async () => {
    await enableEnforcement("naplan-y3-numeracy", true);
    // Client attempts to bypass enforcement by supplying arbitrary config JSON
    await client.query("update public.assessment_sessions set version = version + 1, config = '{\"programme\":\"non-enforced-programme\",\"gate\":\"report\"}' where id = $1", [SESSION]);
    // The server trigger resolves programme from canonical offering relationship, ignoring client JSON
    await expect(allocate()).rejects.toMatchObject({ code: "MM212" });
  });

  it("allows an explicitly approved matching immutable version in enforce mode", async () => {
    await enableEnforcement("naplan-y3-numeracy", true);
    await approve();
    await expect(allocate()).resolves.toMatchObject({ rowCount: 1 });
  });

  it("historical sessions are never approval-gated on read: session remains readable with zero approvals", async () => {
    // 1. Session was created and allocated unapproved content in report mode (or historically)
    await allocate();

    // 2. Gate is subsequently turned on for this programme
    await enableEnforcement("naplan-y3-numeracy", true);

    // 3. Historical session read remains readable even with 0 approvals
    await asAuthenticated(client, STUDENT_A);
    const result = await client.query("select public.get_assessment_session($1) as session", [SESSION]);
    expect(result.rows[0].session).toBeTruthy();
  });

  it("defaults to report mode for unlinked/legacy session with no canonical programme", async () => {
    await enableEnforcement("naplan-y3-numeracy", true);
    // Unlink canonical offering (simulate legacy/unlinked session)
    await client.query("update public.assessment_sessions set version = version + 1, assessment_profile_version_id = null where id = $1", [SESSION]);
    // Should default to report mode (not enforced)
    await expect(allocate()).resolves.toMatchObject({ rowCount: 1 });
  });

  it("rejects an approval bound to a different projection hash", async () => {
    await enableEnforcement("naplan-y3-numeracy", true);
    await approve("c".repeat(64));
    await expect(allocate()).rejects.toMatchObject({ code: "MM212" });
  });

  it.each(["anon", "authenticated"])("keeps private approval snapshots inaccessible to %s", async (role) => {
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
