/**
 * Projects the published question bank into the Phase 1 runtime content tables
 * (spec Â§9, Â§21 Phase 1; ADR-002/003).
 *
 *   npm run projection:apply            # write
 *   npm run projection:apply -- --dry   # build and report, write nothing
 *
 * Source of truth stays in Git. This writes a DERIVED, immutable projection â€”
 * it never edits `content/` or `src/content/`, and it is the only sanctioned
 * writer of these six tables (ADR-002 Â§5-6). Losing the tables is recoverable
 * by re-running this; losing the manifests is not, which is the correct
 * asymmetry.
 *
 * IDEMPOTENT BY CONSTRUCTION. Every primary key is derived deterministically
 * from stable content (`itemIdOf`, `itemVersionIdOf`, `stimulusVersionIdOf`),
 * and every insert is `on conflict do nothing`. Re-running produces zero new
 * rows; an interrupted run resumes rather than duplicating. Nothing is ever
 * UPDATEd â€” the immutability trigger in the migration would reject it anyway,
 * for every role including this one.
 *
 * The whole run is one transaction: a partial projection is not a state any
 * verification step should have to reason about.
 */
import { Client } from "pg";

import { buildPlanFromRepository, projectionDbUrl } from "./lib/projection-source.mjs";

const DRY_RUN = process.argv.includes("--dry");

function fail(message: string): never {
  console.error(`\nâœ— ${message}`);
  process.exit(1);
}

const plan = await buildPlanFromRepository();

console.log("Runtime content projection");
console.log("==========================");
console.log(`  source items          ${plan.counts.total}`);
console.log(`    curated (git)       ${plan.counts.curated}`);
console.log(`    factory (manifest)  ${plan.counts.factory}`);
console.log(`  manifests             ${plan.manifests.length}`);
console.log(`  items with stimulus   ${plan.counts.withStimulus}`);
console.log(`  distinct stimuli      ${plan.counts.distinctStimuli}`);

if (plan.problems.length > 0) {
  for (const problem of plan.problems) console.error(`  ! ${problem}`);
  fail(`${plan.problems.length} problem(s) in the source; nothing was written.`);
}

if (DRY_RUN) {
  console.log("\n--dry: plan is clean, nothing written.");
  process.exit(0);
}

const url = projectionDbUrl();
if (!url) {
  fail(
    "No database URL. Set PROJECTION_DB_URL (or RLS_TEST_DB_URL / SUPABASE_DB_URL / DATABASE_URL).\n" +
      "  For a local stack: supabase start, then re-run.",
  );
}

const client = new Client({ connectionString: url });
await client.connect();

/** Rows actually inserted, per table â€” zero everywhere on a re-run. */
const inserted: Record<string, number> = {};

async function insert(table: string, sql: string, values: readonly unknown[][]): Promise<void> {
  let count = 0;
  for (const row of values) {
    const result = await client.query(sql, row as unknown[]);
    count += result.rowCount ?? 0;
  }
  inserted[table] = count;
}

try {
  await client.query("begin");

  await insert(
    "publication_manifests",
    `insert into public.publication_manifests
       (id, question_id, content_hash, revision, blueprint_id, batch_id, generator_adapter,
        originality_fingerprint, difficulty_fingerprint, manifest_fingerprint,
        manifest_schema_version, review_evidence, review_evidence_kind, published_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     on conflict (id) do nothing`,
    plan.manifests.map((manifest) => [
      manifest.id,
      manifest.questionId,
      manifest.contentHash,
      manifest.revision,
      manifest.blueprintId,
      manifest.batchId,
      JSON.stringify(manifest.generatorAdapter),
      manifest.originalityFingerprint,
      manifest.difficultyFingerprint,
      manifest.manifestFingerprint,
      manifest.manifestSchemaVersion,
      JSON.stringify(manifest.reviewEvidence),
      manifest.reviewEvidenceKind,
      manifest.publishedAt,
    ]),
  );

  await insert(
    "stimuli",
    `insert into public.stimuli (id, stimulus_code) values ($1,$2)
     on conflict (stimulus_code) do nothing`,
    plan.stimuli.map((stimulus) => [stimulus.stimulusId, stimulus.stimulusCode]),
  );

  await insert(
    "stimulus_versions",
    `insert into public.stimulus_versions (id, stimulus_id, revision, content, content_hash)
     values ($1,$2,$3,$4,$5)
     on conflict (content_hash) do nothing`,
    plan.stimuli.map((stimulus) => [
      stimulus.stimulusVersionId,
      stimulus.stimulusId,
      stimulus.revision,
      JSON.stringify(stimulus.content),
      stimulus.contentHash,
    ]),
  );

  await insert(
    "items",
    `insert into public.items (id, item_code, origin, provenance_class) values ($1,$2,$3,$4)
     on conflict (item_code) do nothing`,
    plan.items.map((item) => [item.itemId, item.itemCode, item.origin, item.provenanceClass]),
  );

  await insert(
    "item_versions",
    `insert into public.item_versions
       (id, item_id, revision, question_type, prompt, candidate_content, visuals, accessibility,
        estimated_time_seconds, authored_difficulty, marks_available, stimulus_version_id,
        locale, content_schema_version, content_hash, provenance_class, publication_manifest_id,
        published_at, source_year_level, source_exam_style, source_subject, source_skill)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
     on conflict (content_hash) do nothing`,
    plan.items.map((item) => [
      item.itemVersionId,
      item.itemId,
      item.revision,
      item.candidate.questionType,
      item.candidate.prompt,
      JSON.stringify(item.candidate.candidateContent),
      JSON.stringify(item.candidate.visuals),
      JSON.stringify(item.candidate.accessibility),
      item.candidate.estimatedTimeSeconds,
      item.candidate.authoredDifficulty,
      item.candidate.marksAvailable,
      item.stimulusVersionId,
      item.candidate.locale,
      item.candidate.contentSchemaVersion,
      item.contentHash,
      item.provenanceClass,
      item.publicationManifestId,
      item.publishedAt,
      item.sourceScope.yearLevel,
      item.sourceScope.examStyle,
      item.sourceScope.subject,
      item.sourceScope.skill,
    ]),
  );

  await insert(
    "item_answer_versions",
    `insert into public.item_answer_versions
       (item_version_id, answer_key, grading_rules, rubric, private_explanation, grading_schema_version)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (item_version_id) do nothing`,
    plan.items.map((item) => [
      item.itemVersionId,
      JSON.stringify(item.answer.answerKey),
      JSON.stringify(item.answer.gradingRules),
      item.answer.rubric === null ? null : JSON.stringify(item.answer.rubric),
      item.answer.privateExplanation,
      item.answer.gradingSchemaVersion,
    ]),
  );

  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  await client.end();
  fail(`projection failed and was rolled back: ${error instanceof Error ? error.message : error}`);
}

console.log("\nRows inserted this run (0 everywhere means already projected):");
for (const [table, count] of Object.entries(inserted)) {
  console.log(`  ${table.padEnd(22)} ${count}`);
}

const totals = await client.query<{ table_name: string; n: string }>(
  `select 'publication_manifests' as table_name, count(*)::text as n from public.publication_manifests
   union all select 'items', count(*)::text from public.items
   union all select 'stimuli', count(*)::text from public.stimuli
   union all select 'stimulus_versions', count(*)::text from public.stimulus_versions
   union all select 'item_versions', count(*)::text from public.item_versions
   union all select 'item_answer_versions', count(*)::text from public.item_answer_versions
   order by 1`,
);
console.log("\nTable totals:");
for (const row of totals.rows) console.log(`  ${row.table_name.padEnd(22)} ${row.n}`);

await client.end();
console.log("\nâœ“ projection complete. Run `npm run projection:verify` for the shadow comparison.");

