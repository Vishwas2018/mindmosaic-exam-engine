import "server-only";

/** Server/operator-only database orchestration. Never import from client code. */
import { createHash, randomUUID } from "node:crypto";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";
import { authoringOriginSchema, canonicalContentHash, canonicalQuestionRevisionSchema, type CanonicalQuestionRevision } from "./contracts";
import { deterministicQualityIssues } from "./quality-validation";
import { blindSolveResultSchema, comparisonReviewResultSchema, qualityEvidenceAllowsAutomaticApproval } from "./quality-contracts";
import { classifyPublicationRisk } from "./risk";
import { questionFingerprints } from "./fingerprints";
import { insertAnswerVersion } from "@/server/scoring/answer-version-writer";

export interface OperatorConfig { databaseUrl: string; ownerId: string }

export class ContentOperatorService {
  constructor(private readonly config: OperatorConfig) {}

  private async connected<T>(work: (client: Client) => Promise<T>): Promise<T> {
    const client = new Client({ connectionString: this.config.databaseUrl });
    await client.connect();
    try { return await work(client); } finally { await client.end(); }
  }

  async createBatch(input: { origin: string; idempotencyKey: string; blueprintAssignment?: unknown }) {
    const origin = authoringOriginSchema.parse(input.origin);
    return this.connected(async (client) => {
      const result = await client.query(
        `insert into public.content_batches(idempotency_key,origin,blueprint_assignment,created_by)
         values($1,$2,$3::jsonb,$4) on conflict(idempotency_key) do update set idempotency_key=excluded.idempotency_key
         returning id,origin,state,idempotency_key,created_at`,
        [input.idempotencyKey, origin, JSON.stringify(input.blueprintAssignment ?? {}), this.config.ownerId],
      );
      return result.rows[0];
    });
  }

  async importRevisions(batchId: string, revisions: readonly CanonicalQuestionRevision[], sourceHash: string) {
    return this.connected(async (client) => {
      await client.query("begin");
      try {
        const accepted: string[] = [];
        let insertedCount = 0;
        for (const raw of revisions) {
          const revision = canonicalQuestionRevisionSchema.parse(raw);
          const contentHash = canonicalContentHash(revision);
          const existing = await client.query("select id from public.authoring_question_revisions where content_hash=$1", [contentHash]);
          if (existing.rowCount) { accepted.push(existing.rows[0].id); continue; }
          await client.query("insert into public.authoring_questions(id) values($1) on conflict(id) do nothing", [revision.logicalQuestionId]);
          const inserted = await client.query(
            `insert into public.authoring_question_revisions(question_id,revision,batch_id,origin,state,schema_version,canonical_content,private_evidence,content_hash,created_by)
             values($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10) returning id`,
            [revision.logicalQuestionId, revision.revision, batchId, revision.origin, revision.origin.startsWith("ai_") ? "generated" : "draft", revision.schemaVersion, JSON.stringify(revision), JSON.stringify(revision.privateEvidence), contentHash, this.config.ownerId],
          );
          const insertedId = inserted.rows[0].id;
          insertedCount += 1;
          for (const [kind, fingerprint] of Object.entries(questionFingerprints(revision))) {
            if (fingerprint) await client.query("insert into public.content_fingerprints(revision_id,fingerprint_kind,fingerprint) values($1,$2,$3)", [insertedId, kind, fingerprint]);
          }
          accepted.push(insertedId);
        }
        await client.query("update public.content_batches set source_archive=jsonb_build_object('sourceHash',$2::text),updated_at=now() where id=$1", [batchId, sourceHash]);
        await client.query("commit");
        return { batchId, acceptedRevisionIds: accepted, imported: insertedCount, reused: accepted.length - insertedCount, idempotent: insertedCount === 0 };
      } catch (error) { await client.query("rollback"); throw error; }
    });
  }

  async validateBatch(batchId: string) {
    return this.connected(async (client) => {
      const rows = await client.query("select id,canonical_content,content_hash,state from public.authoring_question_revisions where batch_id=$1 order by created_at,id", [batchId]);
      const reports = [];
      for (const row of rows.rows) {
        const parsed = canonicalQuestionRevisionSchema.safeParse(row.canonical_content);
        const issues = parsed.success ? [...deterministicQualityIssues(parsed.data)] : parsed.error.issues.map((issue) => ({ code: "canonical_schema_failed", severity: "hard" as const, message: issue.message }));
        const duplicates = await client.query(
          `select f.fingerprint_kind,count(*)::integer count from public.content_fingerprints f
           join public.content_fingerprints mine on mine.revision_id=$1 and mine.fingerprint_kind=f.fingerprint_kind and mine.fingerprint=f.fingerprint
           where f.revision_id<>$1 and f.fingerprint_kind in ('normalised_stem','scenario_template','reading_stimulus','distractor_pattern','learner_explanation','visual_structure')
           group by f.fingerprint_kind`, [row.id],
        );
        for (const duplicate of duplicates.rows) issues.push({ code: `duplicate_${duplicate.fingerprint_kind}`, severity: duplicate.fingerprint_kind === "normalised_stem" || duplicate.fingerprint_kind === "reading_stimulus" ? "hard" as const : "risk" as const, message: `Fingerprint matches ${duplicate.count} other corpus revision(s).` });
        const hard = issues.filter((issue) => issue.severity === "hard");
        const risks = issues.filter((issue) => issue.severity === "risk");
        await client.query(
          `insert into public.content_validation_runs(revision_id,revision_content_hash,validator_contract_version,passed,hard_failures,risk_signals,evidence)
           values($1,$2,'quality-v1',$3,$4::jsonb,$5::jsonb,$6::jsonb)`,
          [row.id, row.content_hash, hard.length === 0, JSON.stringify(hard), JSON.stringify(risks), JSON.stringify({ issues })],
        );
        if (hard.length === 0 && ["draft", "generated"].includes(row.state)) await client.query("update public.authoring_question_revisions set state='validated' where id=$1", [row.id]);
        reports.push({ revisionId: row.id, passed: hard.length === 0, hardFailures: hard, riskSignals: risks });
      }
      return reports;
    });
  }

  async ingestReview(revisionId: string, raw: unknown) {
    const record = raw as { blind?: unknown; comparison?: unknown };
    const blind = blindSolveResultSchema.parse(record.blind);
    const comparison = comparisonReviewResultSchema.parse(record.comparison);
    return this.connected(async (client) => {
      const current = await client.query("select id,origin,content_hash,canonical_content,state from public.authoring_question_revisions where id=$1", [revisionId]);
      if (current.rowCount !== 1) throw new Error("Unknown question revision.");
      const row = current.rows[0];
      if (blind.candidateContentHash !== row.content_hash || comparison.candidateContentHash !== row.content_hash) throw new Error("Review evidence is stale.");
      if (comparison.blindSolveHash !== canonicalContentHash(blind)) throw new Error("Comparison is not bound to the supplied blind-solve evidence.");
      if ((row.origin === "ai_codex" && blind.reviewerKind === "ai_codex") || (row.origin === "ai_claude" && blind.reviewerKind === "ai_claude")) throw new Error("Generating agent cannot review its own content.");
      const qualityPass = qualityEvidenceAllowsAutomaticApproval(blind, comparison);
      const decision = qualityPass ? "pass" : comparison.outcome === "reject" ? "reject" : comparison.outcome === "human_required" ? "escalate" : "revise";
      await client.query(
        `insert into public.content_reviews(revision_id,revision_content_hash,reviewer_kind,reviewer_id,generator_origin,review_contract_version,review_stage,blind_solve_hash,decision,supplied_answer_agreement,structured_evidence)
         values($1,$2,$3,$4,$5,'quality-review-v1','comparison',$6,$7,$8,$9::jsonb)`,
        [revisionId, row.content_hash, blind.reviewerKind, blind.reviewerId, row.origin, canonicalContentHash(blind), decision, comparison.declaredAnswerAgreement, JSON.stringify({ blind, comparison })],
      );
      const canonical = canonicalQuestionRevisionSchema.parse(row.canonical_content);
      const legacyReview = { reviewerKind: blind.reviewerKind, reviewerId: blind.reviewerId, generatorKind: row.origin, independentlySolvedAnswer: blind.expectedAnswer, suppliedAnswerAgreement: comparison.declaredAnswerAgreement, decision: qualityPass ? "pass" : "escalate", issueCodes: comparison.issueCodes, rationale: comparison.answerComparisonEvidence.join(" ") } as const;
      const risk = classifyPublicationRisk(canonical, { hardGateFailures: [], riskSignals: [] }, legacyReview, { blind, comparison });
      await client.query("insert into public.content_risk_assessments(revision_id,revision_content_hash,level,signals,requires_individual_owner_review) values($1,$2,$3,$4::jsonb,$5)", [revisionId, row.content_hash, risk.level, JSON.stringify(risk.signals), risk.requiresIndividualOwnerReview]);
      if (row.state === "validated") await client.query("update public.authoring_question_revisions set state='reviewed' where id=$1", [revisionId]);
      return { revisionId, decision, risk };
    });
  }

  async batchStatus(batchId: string) {
    return this.connected(async (client) => {
      const summary = await client.query("select state,count(*)::integer as count from public.authoring_question_revisions where batch_id=$1 group by state order by state", [batchId]);
      const items = await client.query("select id,question_id,revision,state,content_hash from public.authoring_question_revisions where batch_id=$1 order by created_at,id", [batchId]);
      return { batchId, summary: summary.rows, items: items.rows };
    });
  }

  async getRevision(revisionId: string): Promise<CanonicalQuestionRevision> {
    return this.connected(async (client) => {
      const result = await client.query("select canonical_content from public.authoring_question_revisions where id=$1", [revisionId]);
      if (result.rowCount !== 1) throw new Error("Unknown question revision.");
      return canonicalQuestionRevisionSchema.parse(result.rows[0].canonical_content);
    });
  }

  async history(id: string) {
    return this.connected(async (client) => {
      const result = await client.query(`select q.id,q.question_id,q.revision,q.state,q.content_hash,q.created_at,
       (select jsonb_agg(v order by v.created_at) from public.content_validation_runs v where v.revision_id=q.id) validations,
       (select jsonb_agg(r order by r.created_at) from public.content_reviews r where r.revision_id=q.id) reviews,
       (select jsonb_agg(a order by a.approved_at) from public.content_owner_approvals a where a.revision_id=q.id or a.batch_id=q.batch_id) approvals
       from public.authoring_question_revisions q where q.id=$1 or q.question_id=$1 order by q.revision`, [id]);
      return result.rows;
    });
  }

  async publicationReadiness(revisionId: string) {
    return this.connected(async (client) => {
      const result = await client.query(
        `select q.id,q.state,q.content_hash,
          v.id validation_id,v.passed and v.revision_content_hash=q.content_hash validation_current,
          r.id review_id,r.decision='pass' and r.supplied_answer_agreement and r.revision_content_hash=q.content_hash and public.content_review_quality_passes(r.structured_evidence) review_current,
          a.id approval_id,
          risk.id risk_id,risk.revision_content_hash=q.content_hash and ((not risk.requires_individual_owner_review and risk.level='low') or a.approval_mode='individual') risk_clear
         from public.authoring_question_revisions q
         left join lateral(select * from public.content_validation_runs where revision_id=q.id order by created_at desc,id desc limit 1)v on true
         left join lateral(select * from public.content_reviews where revision_id=q.id order by created_at desc,id desc limit 1)r on true
         left join lateral(select * from public.content_risk_assessments where revision_id=q.id order by created_at desc,id desc limit 1)risk on true
         left join lateral(select * from public.content_owner_approvals where revision_id=q.id or batch_id=q.batch_id order by approved_at desc,id desc limit 1)a on true
         where q.id=$1`, [revisionId],
      );
      if (result.rowCount !== 1) throw new Error("Unknown question revision.");
      const row = result.rows[0];
      return { ...row, ready: row.state === "approved" && row.validation_current === true && row.review_current === true && row.risk_clear === true && Boolean(row.approval_id) };
    });
  }

  async publish(revisionId: string, execute: boolean) {
    const readiness = await this.publicationReadiness(revisionId);
    if (!readiness.ready || !execute) return { dryRun: !execute, published: false, readiness };

    /*
     * item_answer_versions is written by a separate, least-privilege
     * credential (mindmosaic_content_answer_writer, 20260902090000) held
     * solely by src/server/scoring/answer-version-writer.ts — this
     * connection's broad SUPABASE_DB_URL/DATABASE_URL role must never touch
     * that table directly (spec §9.3.1). That role change is why this method
     * is now three steps instead of one transaction:
     *   1. item_versions (and its item/stimulus dependencies) here, committed.
     *   2. the answer row, via the writer, over its own connection — which
     *      requires step 1 to already be committed, since item_answer_versions
     *      .item_version_id references item_versions(id) and a different
     *      credential's transaction cannot see this one's uncommitted rows.
     *   3. content_publications here, once the answer row exists — so a
     *      published receipt is never recorded for an item that has none.
     * A failure in step 2 or 3 leaves an item_versions row with no
     * publication receipt; nothing reachable through the runtime projection
     * or the scoring join requires an unpublished item_version to be absent,
     * only that it never gets served, and step 3 not having run is exactly
     * what keeps it from being treated as published.
     */
    const { itemVersionId, revision, contentHash } = await this.connected(async (client) => {
      await client.query("begin");
      try {
        const source = await client.query("select * from public.authoring_question_revisions where id=$1 for update", [revisionId]);
        const row = source.rows[0]; const revision = canonicalQuestionRevisionSchema.parse(row.canonical_content);
        for (const asset of revision.assets) {
          const match = await client.query("select 1 from public.content_asset_versions where asset_id=$1 and revision=$2 and content_hash=$3", [asset.assetId, asset.revision, asset.contentHash]);
          if (match.rowCount !== 1) throw new Error(`Asset ${asset.assetId} revision ${asset.revision} is missing or changed.`);
        }
        let stimulusVersionId: string | null = null;
        if (revision.question.stimulus) {
          const stimulusHash = canonicalContentHash(revision.question.stimulus);
          const existingStimulus = await client.query("select id from public.stimulus_versions where content_hash=$1", [stimulusHash]);
          if (existingStimulus.rowCount) stimulusVersionId = existingStimulus.rows[0].id;
          else {
            const stimulusId = randomUUID(); stimulusVersionId = randomUUID();
            await client.query("insert into public.stimuli(id,stimulus_code) values($1,$2)", [stimulusId, `db-${stimulusHash.slice(0,24)}`]);
            await client.query("insert into public.stimulus_versions(id,stimulus_id,revision,content,content_hash) values($1,$2,1,$3::jsonb,$4)", [stimulusVersionId, stimulusId, JSON.stringify(revision.question.stimulus), stimulusHash]);
          }
        }
        const itemCode = `mm-${revision.logicalQuestionId}`;
        const existingItem = await client.query("select id from public.items where item_code=$1", [itemCode]);
        const itemId = existingItem.rowCount ? existingItem.rows[0].id : randomUUID();
        if (!existingItem.rowCount) await client.query("insert into public.items(id,item_code,origin,provenance_class) values($1,$2,$3,'database_authoring')", [itemId, itemCode, revision.origin]);
        const itemVersionId = randomUUID(); const q = revision.question;
        await client.query(
          `insert into public.item_versions(id,item_id,revision,question_type,prompt,candidate_content,visuals,accessibility,estimated_time_seconds,authored_difficulty,marks_available,stimulus_version_id,locale,content_schema_version,content_hash,provenance_class,publication_manifest_id,published_at,source_year_level,source_exam_style,source_subject,source_skill,answer_kind,min_words,max_words,source_strand,source_topic,source_tags,learner_explanation,asset_refs)
           values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,'database_authoring',null,now(),$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27::jsonb)`,
          [itemVersionId,itemId,revision.revision,q.type,q.prompt,JSON.stringify({ instructions:q.instructions,options:q.options,interaction:q.interaction }),JSON.stringify(q.visuals),JSON.stringify({ altTextProvided:q.visuals.every((visual)=>Boolean(visual.altText)) && revision.assets.every((asset)=>!asset.role.includes("image") || Boolean(asset.altText)),answerableFromAccessibleRepresentation:true }),q.metadata.estimatedTimeSeconds,q.metadata.difficulty,q.metadata.marks,stimulusVersionId,q.metadata.locale,revision.schemaVersion,row.content_hash,q.yearLevel,q.examStyle,q.metadata.subject,q.metadata.skill,q.answerKey.kind,q.answerKey.kind==="manual"?q.answerKey.minWords:null,q.answerKey.kind==="manual"?q.answerKey.maxWords:null,q.metadata.strand,q.metadata.topic,q.metadata.tags,revision.learnerExplanation,JSON.stringify(revision.assets)],
        );
        await client.query("commit");
        return { itemVersionId, revision, contentHash: row.content_hash as string };
      } catch (error) { await client.query("rollback"); throw error; }
    });

    const q = revision.question;
    await insertAnswerVersion({
      itemVersionId,
      answerKey: q.answerKey,
      gradingRules: {},
      rubric: q.answerKey.kind === "manual" ? q.answerKey : null,
      privateExplanation: revision.privateEvidence.gradingRationale ?? null,
      gradingSchemaVersion: 1,
    });

    const evidenceHash = canonicalContentHash({ validation: readiness.validation_id, review: readiness.review_id, risk: readiness.risk_id, approval: readiness.approval_id });
    await this.connected(async (client) => {
      await client.query("begin");
      try {
        await client.query("insert into public.content_publications(revision_id,approval_id,runtime_item_version_id,revision_content_hash,evidence_bundle_hash) values($1,$2,$3,$4,$5)", [revisionId, readiness.approval_id, itemVersionId, contentHash, evidenceHash]);
        await client.query("commit");
      } catch (error) { await client.query("rollback"); throw error; }
    });

    return { dryRun: false, published: true, revisionId, itemVersionId, evidenceHash };
  }

  async addAsset(input: { batchId: string; path: string; bytes: Uint8Array; mimeType: string; altText?: string }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) throw new Error("Asset upload requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    const assetId = randomUUID(); const versionId = randomUUID(); const hash = createHash("sha256").update(input.bytes).digest("hex");
    const storagePath = `${input.batchId}/${assetId}/1/${input.path.split(/[\\/]/).pop()}`;
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const uploaded = await supabase.storage.from("content-assets-private").upload(storagePath, input.bytes, { contentType: input.mimeType, upsert: false });
    if (uploaded.error) throw uploaded.error;
    try {
      return await this.connected(async (client) => {
        await client.query("begin");
        try {
          await client.query("insert into public.content_assets(id,created_by) values($1,$2)", [assetId, this.config.ownerId]);
          await client.query(`insert into public.content_asset_versions(id,asset_id,revision,storage_path,media_type,asset_type,byte_size,content_hash,accessibility,origin,provenance,licence_declaration)
            values($1,$2,1,$3,$4,$5,$6,$7,$8::jsonb,'owner_created',$9::jsonb,'MindMosaic owner-created original')`,
          [versionId, assetId, storagePath, input.mimeType, input.mimeType.startsWith("image/") ? "image" : input.mimeType.startsWith("audio/") ? "audio" : "other", input.bytes.byteLength, hash, JSON.stringify({ altText: input.altText }), JSON.stringify({ batchId: input.batchId })]);
          await client.query("commit"); return { assetId, revision: 1, assetVersionId: versionId, contentHash: hash, storagePath };
        } catch (error) { await client.query("rollback"); throw error; }
      });
    } catch (error) { await supabase.storage.from("content-assets-private").remove([storagePath]); throw error; }
  }
}

export function operatorConfigFromEnvironment(ownerId?: string): OperatorConfig {
  const databaseUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  const resolvedOwner = ownerId ?? process.env.MM_CONTENT_OWNER_ID;
  if (!databaseUrl) throw new Error("Set SUPABASE_DB_URL or DATABASE_URL.");
  if (!resolvedOwner) throw new Error("Set MM_CONTENT_OWNER_ID or pass --owner-id.");
  return { databaseUrl, ownerId: resolvedOwner };
}
