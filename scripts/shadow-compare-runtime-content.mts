/**
 * The Phase 1 exit-gate proof (spec Â§21 Phase 1, Â§9; ADR-002/003).
 *
 *   npm run projection:verify              # source side only â€” no database needed
 *   npm run projection:verify -- --live    # source side + the projected rows
 *
 * "Every published runtime item matches a governed SOURCE â€” a factory manifest
 * or the Git-authored curated bank â€” and answer tables are inaccessible to
 * learner roles."
 *
 * Two halves, deliberately separable:
 *
 *   SOURCE (always) â€” every item in `publishedExamBank` maps to exactly one
 *   planned version with a recomputed matching hash; every manifest is claimed
 *   exactly once; the candidate/answer split holds; the total is 1,297. This
 *   runs anywhere, which is why the same assertions also live in
 *   `src/tests/unit/content-projection.test.ts` and gate every commit.
 *
 *   LIVE (--live) â€” the rows actually landed: counts agree, hashes agree
 *   item-by-item, answer keys round-trip through JSON, no orphans, no
 *   duplicates, and no privilege exists for anon/authenticated on any of the
 *   six tables.
 *
 * Any drift, orphan or duplicate exits non-zero. There is no "warn" level:
 * a shadow comparison that tolerates a mismatch is not a comparison.
 */
import { Client } from "pg";

import { buildPlanFromRepository, projectionDbUrl } from "./lib/projection-source.mjs";

const LIVE = process.argv.includes("--live");

const failures: string[] = [];
const notes: string[] = [];

function check(condition: boolean, description: string, detail?: string): void {
  if (condition) {
    console.log(`  âœ“ ${description}`);
    return;
  }
  console.log(`  âœ— ${description}${detail ? ` â€” ${detail}` : ""}`);
  failures.push(description);
}

/* ------------------------------------------------------------------ */
/* Source side                                                         */
/* ------------------------------------------------------------------ */

const plan = await buildPlanFromRepository();

console.log("Shadow comparison â€” source side");
console.log("===============================");

check(plan.problems.length === 0, "the plan reports no problems", plan.problems.join("; "));
check(plan.counts.total === 1548, `1,548 projected items (got ${plan.counts.total})`);
check(plan.counts.curated === 1005, `1,005 curated (got ${plan.counts.curated})`);
check(plan.counts.factory === 543, `543 factory (got ${plan.counts.factory})`);
check(
  plan.counts.curated + plan.counts.factory === plan.counts.total,
  "the two pools account for every item",
);

const hashes = new Set(plan.items.map((item) => item.contentHash));
check(hashes.size === plan.items.length, "every content hash is distinct");

const codes = new Set(plan.items.map((item) => item.itemCode));
check(codes.size === plan.items.length, "every item code is distinct");

const claimed = plan.items
  .map((item) => item.publicationManifestId)
  .filter((id): id is string => id !== null);
check(claimed.length === plan.manifests.length, "every manifest is claimed exactly once");
check(new Set(claimed).size === claimed.length, "no manifest is claimed twice");

check(
  plan.items.every((item) =>
    item.provenanceClass === "factory_manifest"
      ? item.publicationManifestId !== null
      : item.publicationManifestId === null,
  ),
  "provenance_class and manifest id agree on every row",
);

check(
  plan.stimuli.length === plan.counts.distinctStimuli &&
    plan.stimuli.reduce((sum, s) => sum + s.usedBy.length, 0) === plan.counts.withStimulus,
  `stimulus dedupe accounts for every use (${plan.counts.withStimulus} uses -> ${plan.counts.distinctStimuli} rows)`,
);

const evidence = new Map<string, number>();
for (const manifest of plan.manifests) {
  evidence.set(manifest.reviewEvidenceKind, (evidence.get(manifest.reviewEvidenceKind) ?? 0) + 1);
}
notes.push(
  `review evidence: ${[...evidence.entries()]
    .sort()
    .map(([kind, n]) => `${kind}=${n}`)
    .join(", ")}`,
);

/* ------------------------------------------------------------------ */
/* Live side                                                           */
/* ------------------------------------------------------------------ */

if (!LIVE) {
  console.log("\n(--live not given: the projected rows were not checked.)");
} else {
  const url = projectionDbUrl();
  if (!url) {
    console.error(
      "\nâœ— --live needs a database URL: set PROJECTION_DB_URL (or RLS_TEST_DB_URL / SUPABASE_DB_URL / DATABASE_URL).",
    );
    process.exit(1);
  }

  console.log("\nShadow comparison â€” projected rows");
  console.log("==================================");

  const client = new Client({ connectionString: url });
  await client.connect();

  const count = async (table: string): Promise<number> =>
    Number((await client.query<{ n: string }>(`select count(*)::text as n from public.${table}`)).rows[0].n);

  check((await count("item_versions")) === 1548, "item_versions holds 1,548 rows");
  check((await count("items")) === 1548, "items holds 1,548 rows");
  check((await count("item_answer_versions")) === 1548, "item_answer_versions holds 1,548 rows");
  check((await count("publication_manifests")) === 543, "publication_manifests holds 543 rows");
  check(
    (await count("stimulus_versions")) === plan.counts.distinctStimuli,
    `stimulus_versions holds ${plan.counts.distinctStimuli} rows`,
  );

  /* Item-by-item hash agreement â€” the substance of the comparison. Compared as
     a set difference in SQL rather than row-by-row in JS so a mismatch reports
     WHICH items differ rather than just that some do. */
  const projected = await client.query<{
    item_code: string;
    content_hash: string;
    provenance_class: string;
    publication_manifest_id: string | null;
  }>(
    `select i.item_code, v.content_hash, v.provenance_class, v.publication_manifest_id
       from public.item_versions v join public.items i on i.id = v.item_id`,
  );

  const expected = new Map(plan.items.map((item) => [item.itemCode, item]));
  const seen = new Set<string>();
  const drift: string[] = [];
  for (const row of projected.rows) {
    const item = expected.get(row.item_code);
    if (!item) {
      drift.push(`orphan row '${row.item_code}' is not in the bank`);
      continue;
    }
    seen.add(row.item_code);
    if (row.content_hash !== item.contentHash) drift.push(`'${row.item_code}' hash differs`);
    if (row.provenance_class !== item.provenanceClass) {
      drift.push(`'${row.item_code}' provenance_class differs`);
    }
    if ((row.publication_manifest_id ?? null) !== item.publicationManifestId) {
      drift.push(`'${row.item_code}' manifest link differs`);
    }
  }
  for (const item of plan.items) {
    if (!seen.has(item.itemCode)) drift.push(`'${item.itemCode}' was never projected`);
  }
  check(drift.length === 0, "every item's hash and provenance round-trip", drift.slice(0, 5).join("; "));

  /* Answer keys round-trip. Compared as canonical JSON text on both sides so
     jsonb key reordering is not mistaken for a difference. */
  const answers = await client.query<{ item_code: string; answer_key: unknown }>(
    `select i.item_code, a.answer_key
       from public.item_answer_versions a
       join public.item_versions v on v.id = a.item_version_id
       join public.items i on i.id = v.item_id`,
  );
  const answerDrift: string[] = [];
  for (const row of answers.rows) {
    const item = expected.get(row.item_code);
    if (!item) continue;
    const a = JSON.stringify(sortKeys(row.answer_key));
    const b = JSON.stringify(sortKeys(item.answer.answerKey));
    if (a !== b) answerDrift.push(row.item_code);
  }
  check(
    answerDrift.length === 0 && answers.rows.length === plan.items.length,
    "every answer key round-trips",
    answerDrift.slice(0, 5).join("; "),
  );

  /* Candidate metadata completeness (ADR-006 Amendment D). A version-pinned
     session serves its paper from these columns, and `get_assessment_session`
     refuses an allocation where any of them is missing — so an incomplete row
     is not a cosmetic gap, it is an item that cannot be sat. Checked as an
     absence across the whole table rather than per item, because the failure
     that matters is "some row somewhere", not "this row". */
  const incompleteCandidates = Number(
    (
      await client.query<{ n: string }>(
        `select count(*)::text as n from public.item_versions
          where answer_kind is null or source_strand is null
             or source_topic is null or source_tags is null`,
      )
    ).rows[0].n,
  );
  check(incompleteCandidates === 0, "every item version carries its candidate metadata");

  /* And it is the RIGHT kind. The column is a copy of a fact that also lives on
     the answer key, and a copy that can drift is worse than no copy: the
     renderer would dispatch on one value while the scorer used another. */
  const kindDrift = Number(
    (
      await client.query<{ n: string }>(
        `select count(*)::text as n
           from public.item_versions v
           join public.item_answer_versions a on a.item_version_id = v.id
          where v.answer_kind is distinct from a.answer_key->>'kind'`,
      )
    ).rows[0].n,
  );
  check(kindDrift === 0, "every projected answer kind matches its answer key");

  /* Referential sanity. */
  const orphanAnswers = Number(
    (
      await client.query<{ n: string }>(
        `select count(*)::text as n from public.item_answer_versions a
          where not exists (select 1 from public.item_versions v where v.id = a.item_version_id)`,
      )
    ).rows[0].n,
  );
  check(orphanAnswers === 0, "no answer row is orphaned");

  const orphanStimulusRefs = Number(
    (
      await client.query<{ n: string }>(
        `select count(*)::text as n from public.item_versions v
          where v.stimulus_version_id is not null
            and not exists (select 1 from public.stimulus_versions s where s.id = v.stimulus_version_id)`,
      )
    ).rows[0].n,
  );
  check(orphanStimulusRefs === 0, "every pinned stimulus version exists");

  /* Security: the half of the exit gate that is about access, not content. */
  const grants = await client.query<{ table_name: string; grantee: string; privilege_type: string }>(
    `select table_name, grantee, privilege_type
       from information_schema.role_table_grants
      where table_schema = 'public'
        and grantee in ('anon', 'authenticated')
        and table_name in ('publication_manifests','items','stimuli','stimulus_versions',
                           'item_versions','item_answer_versions')`,
  );
  check(
    grants.rowCount === 0,
    "anon/authenticated hold NO privileges on any projection table",
    grants.rows.map((r) => `${r.grantee}:${r.privilege_type} on ${r.table_name}`).join("; "),
  );

  const columnGrants = await client.query(
    `select 1 from information_schema.column_privileges
      where table_schema = 'public' and table_name = 'item_answer_versions'
        and grantee in ('anon','authenticated')`,
  );
  check(columnGrants.rowCount === 0, "no column-level grant on item_answer_versions");

  const rls = await client.query<{ n: string }>(
    `select count(*)::text as n from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relrowsecurity
        and c.relname in ('publication_manifests','items','stimuli','stimulus_versions',
                          'item_versions','item_answer_versions')`,
  );
  check(Number(rls.rows[0].n) === 6, "RLS is enabled on all six tables");

  await client.end();
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) out[key] = sortKeys(source[key]);
    return out;
  }
  return value;
}

console.log("");
for (const note of notes) console.log(`  note: ${note}`);

if (failures.length > 0) {
  console.error(`\nâœ— shadow comparison FAILED: ${failures.length} check(s).`);
  process.exit(1);
}
console.log(`\nâœ“ shadow comparison clean${LIVE ? " (source + projected rows)" : " (source side)"}.`);

