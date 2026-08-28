import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { connect } from "./db";
import { asAuthenticated, seed, STUDENT_A, TEACHER_D } from "./fixtures";

let client: Client;
const BATCH = "90000000-0000-4000-8000-000000000001";
const QUESTION = "90000000-0000-4000-8000-000000000002";
const REVISION = "90000000-0000-4000-8000-000000000003";
const HASH = "a".repeat(64);

async function seedReviewedRevision(target: Client): Promise<void> {
  await target.query("update public.profiles set role='admin' where id=$1", [TEACHER_D]);
  await target.query("insert into public.content_batches(id,idempotency_key,origin,state,created_by) values($1,'rls-quality','manual_owner','reviewed',$2)", [BATCH, TEACHER_D]);
  await target.query("insert into public.authoring_questions(id) values($1)", [QUESTION]);
  await target.query(`insert into public.authoring_question_revisions(id,question_id,revision,batch_id,origin,state,schema_version,canonical_content,private_evidence,content_hash,created_by)
    values($1,$2,1,$3,'manual_owner','reviewed',2,'{}','{}',$4,$5)`, [REVISION, QUESTION, BATCH, HASH, TEACHER_D]);
  await target.query("insert into public.content_validation_runs(revision_id,revision_content_hash,validator_contract_version,passed) values($1,$2,'quality-v1',true)", [REVISION, HASH]);
  const evidence = { blind: { ambiguityStatus: "clear", uniquelyDefensible: true, sufficientInformation: true, visualStatus: "supported", assessmentFit: "appropriate", australianEnglishIssues: [] }, comparison: { declaredAnswerAgreement: true, explanationQuality: "good", outcome: "pass" } };
  await target.query(`insert into public.content_reviews(revision_id,revision_content_hash,reviewer_kind,reviewer_id,generator_origin,review_contract_version,review_stage,blind_solve_hash,decision,supplied_answer_agreement,structured_evidence)
    values($1,$2,'ai_claude','claude-test','manual_owner','quality-review-v1','comparison',$3,'pass',true,$4::jsonb)`, [REVISION, HASH, "b".repeat(64), JSON.stringify(evidence)]);
  await target.query("insert into public.content_risk_assessments(revision_id,revision_content_hash,level,signals,requires_individual_owner_review) values($1,$2,'low','[]',false)", [REVISION, HASH]);
}

beforeEach(async () => { client = await connect(); await client.query("begin"); await seed(client); await seedReviewedRevision(client); });
afterEach(async () => { await client.query("rollback"); await client.end(); });

describe("Content Platform v2 authoring security", () => {
  it("denies learners all authoring and private review evidence", async () => {
    const grants = await client.query(`select table_name from information_schema.role_table_grants where grantee='authenticated' and table_name=any($1)`, [["authoring_question_revisions", "content_validation_runs", "content_reviews", "content_owner_approvals"]]);
    expect(grants.rows).toEqual([]);
    await asAuthenticated(client, STUDENT_A);
    await expect(client.query("select * from public.authoring_question_revisions")).rejects.toMatchObject({ code: "42501" });
  });

  it("refuses a direct approval even to the unrestricted database connection", async () => {
    await expect(client.query("insert into public.content_owner_approvals(revision_id,approved_by,approval_mode,qa_evidence) values($1,$2,'individual','{}')", [REVISION, TEACHER_D])).rejects.toMatchObject({ code: "42501" });
  });

  it("allows only the authenticated admin RPC to mint approval", async () => {
    await asAuthenticated(client, TEACHER_D);
    const result = await client.query("select public.owner_approve_content($1,'{}'::jsonb) id", [REVISION]);
    expect(result.rows[0].id).toBeTruthy();
    await client.query("reset role");
    const state = await client.query("select state from public.authoring_question_revisions where id=$1", [REVISION]);
    expect(state.rows[0].state).toBe("approved");
  });

  it("rejects stale review evidence during approval", async () => {
    const evidence = { blind: { ambiguityStatus: "clear", uniquelyDefensible: true, sufficientInformation: true, visualStatus: "supported", assessmentFit: "appropriate", australianEnglishIssues: [] }, comparison: { declaredAnswerAgreement: true, explanationQuality: "good", outcome: "pass" } };
    await client.query(`insert into public.content_reviews(revision_id,revision_content_hash,reviewer_kind,reviewer_id,generator_origin,review_contract_version,review_stage,blind_solve_hash,decision,supplied_answer_agreement,structured_evidence,created_at)
      values($1,$2,'ai_claude','claude-stale','manual_owner','quality-review-v1','comparison',$3,'pass',true,$4::jsonb,now()+interval '1 second')`, [REVISION, "c".repeat(64), "d".repeat(64), JSON.stringify(evidence)]);
    await asAuthenticated(client, TEACHER_D);
    await expect(client.query("select public.owner_approve_content($1,'{}'::jsonb)", [REVISION])).rejects.toMatchObject({ code: "MM102" });
  });

  it("makes revision content immutable after review and approval", async () => {
    await expect(client.query("update public.authoring_question_revisions set canonical_content='{\"changed\":true}' where id=$1", [REVISION])).rejects.toMatchObject({ code: "MM101" });
  });

  it("denies authenticated agents publication and rejects a stale approval hash", async () => {
    await asAuthenticated(client, TEACHER_D);
    const approval = await client.query("select public.owner_approve_content($1,'{}'::jsonb) id", [REVISION]);
    await client.query("savepoint agent_publish");
    await expect(client.query("insert into public.content_publications(revision_id,approval_id,runtime_item_version_id,revision_content_hash,evidence_bundle_hash) values($1,$2,$3,$4,$5)", [REVISION, approval.rows[0].id, "90000000-0000-4000-8000-000000000099", HASH, "e".repeat(64)])).rejects.toMatchObject({ code: "42501" });
    await client.query("rollback to savepoint agent_publish");
    await client.query("reset role");
    await expect(client.query("insert into public.content_publications(revision_id,approval_id,runtime_item_version_id,revision_content_hash,evidence_bundle_hash) values($1,$2,$3,$4,$5)", [REVISION, approval.rows[0].id, "90000000-0000-4000-8000-000000000099", "f".repeat(64), "e".repeat(64)])).rejects.toMatchObject({ code: "MM105" });
  });
});
