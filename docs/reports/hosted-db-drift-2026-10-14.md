# Hosted database drift against `dev` (requested 14 October 2026)

Inspected on 13 October 2026 against `dev` at `90350726` (all of #35, #45, #33, #46, #48 and #47 merged).

**Nothing in this document has been applied to the hosted database.** The hosted inspection was read-only (method below). The only migrations run anywhere were on a local throwaway stack, now removed.

## 1. Summary

- **Ten migrations on `dev` are not on the hosted database.** Eight predate 5 October (the "nine" Codex reported, less the scoring-role item, which is explained below). Two are new since: `20261005090000` (publication approvals) and `20261013090000` (timed writing).
- **The scoring-role "ledger mismatch" still exists, but it is not a ghost.** The role and its grants are correct for what is applied. The registry expects a ninth column grant (`session_responses.part_score_evidence`) that is created by `20260820090000`, which is one of the ten missing. Applying that migration clears it. No role repair is needed.
- **The hosted database holds almost no data.** 6 auth users (2 parents, 4 students: two in Year 3, two in Year 5), and **zero** sessions, responses, manual marks, items and item versions. No migration here rewrites or backfills existing child rows. The only child-data table any of them touches is `profiles` (4 student rows), and only by adding defaulted or nullable columns, widening a check, and changing column grants.
- **No migration is destructive.** Every step is additive or widening. None drops a populated table or column.
- **Publication gate: every programme stays in report mode.** The migration creates `publication_gate_settings` empty, and nothing in the repository writes to it (details in section 4).
- **All ten applied cleanly, in timestamp order, on a local copy of the hosted state** (39 migrations plus the same 6 profiles). Each step passed its own registry check, the full registry then passed 49 of 49, and 70 RLS tests across three suites passed against it.
- **Plain `supabase db push` will refuse.** The hosted ledger already holds later versions (`20260821`, `20260822`, `20260823`) than the first missing ones, so the CLI needs `--include-all`.

## 2. Method (all read-only)

- Direct Postgres connection with the session forced read-only (`default_transaction_read_only=on`, 20 s statement timeout). Confirmed `ro = on`, Postgres 17.6. Only `SELECT` was issued.
- Migration objects were checked with the repository's own registry checks (`scripts/migrations/registry.ts`, all `SELECT`), plus the ledger table `supabase_migrations.schema_migrations`.
- Data was inspected as **counts only**. No row contents were read.
- Function source for three functions was read with `pg_get_functiondef` and compared with the repository.
- `supabase migration list --db-url` (read-only) was used as an independent view of the ledger. It agrees: 10 local-only versions and none remote-only.
- Not checkable read-only: whether `mindmosaic_scoring` has a password set (that lives in `pg_authid`), what Vercel environment variables are set, and what backups or point-in-time recovery the hosted plan provides.

## 3. The exact list

Repository: 49 migration files. Hosted ledger: 39. Registry object checks: 38 pass and 11 fail (the 10 below plus the scoring-role check).

| # | Version | Name | In ledger | Objects present | Failing checks |
|---|---|---|---|---|---|
| 1 | `20260818090000` | `naplan_interaction_answer_kinds` | no | no | 1 |
| 2 | `20260820090000` | `assessment_capability_expansion` | no | no | 21 |
| 3 | `20260825090000` | `content_factory_phase1` | no | no | 16 |
| 4 | `20260827090000` | `curriculum_platform_foundation` | no | no | 17 |
| 5 | `20260902090000` | `content_answer_writer_role` | no | no | 4 |
| 6 | `20260922100000` | `student_onboarding_preferences` | no | no | 4 |
| 7 | `20260923090000` | `amc_programme_offerings` | no | no | 2 |
| 8 | `20260923100000` | `amc_phase2_config_backfill` | no | no | 1 |
| 9 | `20261005090000` | `revision_bound_publication_approvals` | no | no | 3 |
| 10 | `20261013090000` | `timed_writing_parent_marking` | no | no | 14 |
| — | `20260812110000` | `scoring_role` | **yes** | role yes, **one grant check fails** | 1 (section 5) |

No migration file is missing from the registry, and no ledger row lacks a file.

## 4. Hosted data snapshot (counts only)

| Table | Rows |
|---|---|
| `auth.users` | 6 |
| `profiles` | 6 (2 parent with no year, 2 student Year 3, 2 student Year 5) |
| `assessment_sessions`, `session_responses`, `manual_marks`, `assessment_session_items` | 0 |
| `items`, `item_versions` | 0 |
| `programme_offerings` | 99 active, all region `global` |
| `blueprint_versions`, `assessment_profile_versions` | 99 each |

Consequence: the database-backed sitting path has never been used on hosted, and nothing that references a session or item can be affected. Whether the 4 student profiles are real children or test accounts is not something the database can say; this report treats them as real.

## 5. The scoring-role mismatch

- **Reported:** `mindmosaic_scoring holds exactly its nine column-level UPDATE grants` fails, while the ledger says `scoring_role` is applied.
- **Found:** the role exists with the right attributes (`LOGIN`, not superuser, not create-db, not create-role, `NOINHERIT`, `NOBYPASSRLS`). It holds 8 column `UPDATE` grants (`assessment_sessions.status/submitted_at/version`, and `session_responses.score_status/is_correct/awarded_marks/available_marks/scored_at`), 22 `INSERT` columns on `assessment_results`, six table `SELECT`/`INSERT` grants and eight policies. All correct for the migrations that are applied.
- **Cause:** the ninth grant, `grant update (part_score_evidence) on public.session_responses to mindmosaic_scoring`, is made by `20260820090000` (line 226). That migration is not applied, so the registry (which expects nine) correctly reports eight.
- **Still exists:** yes, and it resolves itself at step 2 of the plan. No repair, re-grant or ledger edit is needed.
- **Unknown, owner to confirm:** whether the role has a password and whether `SCORING_DB_PASSWORD` is set in the hosted app's environment. It cannot be read without superuser access.

## 6. Per-migration assessment

Classes: **Safe** (additive or widening, no data dependency), **Safe, needs provisioning**, **Safe, check first** (a precondition to verify), none **Destructive**, none **Needs backfill by hand** (the one backfill is inside migration 8 and idempotent).

| # | Migration | What it does | Class | Dependencies | Notes for a database with child data |
|---|---|---|---|---|---|
| 1 | `20260818090000` | Widens the `item_versions.answer_kind` check to allow `hot_text` and `matrix`. | Safe | None. Superseded by 2, which re-lists the same kinds plus `structured`. | Zero item versions, so the constraint re-check scans nothing. Application support for the new kinds is on `dev`; deploy it before content uses them. |
| 2 | `20260820090000` | Adds 9 media and item-group tables (RLS on, no learner grants), `assessment_session_items` group columns, `session_responses.part_score_evidence`, `manual_marks.part_id/rubric_version`; replaces the unique index `manual_marks_item_key` and `record_manual_mark`'s conflict target; grants the 9th scoring column. | Safe | After 1 (harmless order). Needs `manual_marks`, `session_responses` (present). | Index swap is equivalent for existing rows (`part_id` null, `NULLS NOT DISTINCT`). Hosted has 0 marks and 0 duplicates. The restated `record_manual_mark` body is otherwise unchanged (compared line by line). Clears the scoring-role mismatch. |
| 3 | `20260825090000` | Adds the content-factory authoring tables (16, RLS on), 3 enum types, owner-approval functions, a private storage bucket `content-assets-private`; widens provenance checks; adds `item_versions.learner_explanation` and `asset_refs`. | Safe, check first | None on the others. | Re-creates two `item_versions` constraints (0 rows). No name or type clash on hosted. The bucket insert is `on conflict do update` and keeps the bucket private. `owner_approve_*` functions are executable by `authenticated` but require `profiles.role = 'admin'`; hosted has no admin profile. |
| 4 | `20260827090000` | Adds 9 curriculum registry tables (RLS on, no learner grants, immutable), seeds 9 AU jurisdictions, adds `programme_offerings_region_known`, widens `profiles.year_level` check from {3,5} to 1–12, adds nullable `profiles.curriculum_jurisdiction_code` and `curriculum_school_sector`. | Safe, check first | None. | Touches `profiles`: the widened check admits every existing row; the two new columns are nullable with no inference ("null means not yet collected"). All 99 offerings are `global`, which the new region check allows. |
| 5 | `20260902090000` | Creates role `mindmosaic_content_answer_writer` (`LOGIN`, no password), one `INSERT` grant and one policy on `item_answer_versions`. | Safe, needs provisioning | None. | The role cannot authenticate until a password is set out of band. Do **not** put a credential in the migration. Only needed by the content-publishing path. |
| 6 | `20260922100000` | Adds `profiles.onboarding_completed_at`, `diagnostic_completed_at` (nullable), `interests` (`{}`), `weekly_goal_minutes` (60); revokes then re-grants column `UPDATE` on `profiles` to `authenticated`. | Safe, check first | After 4 (order only). | Touches the 4 student profiles. Defaults are constants (no table rewrite). The revoke and re-grant run in one transaction; the end state is display name, year level and the four new columns (a superset of today's display name and year level), so nothing a learner can do today is removed. No completion state is inferred for existing students: they will be treated as not onboarded. |
| 7 | `20260923090000` | Seeds subject `amc_mathematics` and two AMC offerings (Year 3 and 5). | Safe | Programme `australian_mathematics_competition` (present), region check from 4 (`global` allowed). | Offerings go from 99 to 101 active. They have no items. Nothing in `src/` lists `programme_offerings` for display, so no new tile was found; confirm in the UI after applying. |
| 8 | `20260923100000` | Backfills one blueprint version, cell and profile version for each of the two AMC offerings. | Safe | **After 7.** Needs `phase2-fixed-framework` revision 1 (present). | Idempotent (`on conflict do nothing`), raises if the framework row is absent. 101 offerings, 101 profile versions, 101 blueprint versions afterwards. |
| 9 | `20261005090000` | Creates `item_publication_approvals` and `publication_gate_settings` (both private, empty); adds trigger `approved_session_item` on `assessment_session_items`; **restates `create_assessment_session`**. | Safe, check first | Needs `assessment_profile_versions`, `programmes.assessment_family_id` (present). Independent of 1–8: applied alone on the hosted-like copy. | The one that changes a hot path; see section 7. |
| 10 | `20261013090000` | Timed writing: 4 tables, 6 functions, read-only RLS, one seeded rubric; restates `erase_student` to also delete a child's writing attempts. | Safe | Independent of 1–9: applied alone, and after 9, on the hosted-like copy. | Restated `erase_student` differs from the hosted body only by the writing additions (counts and deletes of `writing_attempts`); compared line by line. No writing prompt is approved, so no child can reach the feature. |

## 7. What matters for a database holding child data

### Publication approvals and `publication_gate_settings`

- **Report mode is the default by construction.** `publication_gate_settings` is created empty; the migration comment and the code both treat "no row" as report mode. In the rehearsal the table had 0 rows after the migration.
- **Nothing can switch a programme on by accident.** No code in `src/` or `scripts/` inserts into `publication_gate_settings` (`scripts/check-publication-gates.mts` only reads it, to compare against the TypeScript map), and the TypeScript map `PROGRAMME_PUBLICATION_MODES` is empty. Enforcement needs a person to insert a row.
- **The trigger is inert in report mode.** `guard_approved_session_item` resolves the programme server-side from the session; it only raises (`MM212`) when a matching settings row has `enforced = true`. Sessions with no resolvable programme are treated as report mode. With zero rows it never fires.
- **The restated `create_assessment_session` differs from the hosted function only by the gate.** The hosted body is identical to `20260823110000` (differences are comment text only). `20261005090000` then differs from that by exactly: three extra declarations, the offering lookup also returning `programme_id` and a programme key, a settings lookup, and one added condition `(not enforced or exists approval)` on item selection. Signature, grants, idempotency, cohort and profile-pin logic are unchanged.
- **Approval rows:** `item_publication_approvals` is empty and has no learner privileges. Writing prompts use a different file-based record and are not stored here (follow-up #49 covers a database check).
- **Do not insert gate rows as part of this work.** Switching any programme to `enforce` needs named human approval coverage first.

### Other child-data touchpoints

- `profiles` is the only table with child rows touched. Steps 4 and 6 add columns and change the year check and column grants; step 10 changes `erase_student`. None rewrites a row.
- Old application code remains compatible with every step as far as the SQL shows: new columns are nullable or defaulted, constraints are widened, restated functions keep their signatures, and the column grants are a superset. This was assessed from the SQL, not by running the currently deployed bundle (production tracks `main`, which is behind `dev`).
- Apply migrations **before** deploying the newer application. The reverse order breaks (for example, onboarding and writing code expect their tables and columns).

## 8. Ordered apply plan

### Before anything

1. **Backup.** Take a hosted backup (or confirm point-in-time recovery is on) and record its identifier. This is the real rollback for every step.
2. **Window.** A short maintenance window. Rehearsal times were under 1.3 s per migration on empty tables.
3. **Confirm the scoring credential** is set in the app environment (section 5, unknown).
4. **Confirm nobody else is changing the schema** (Codex or any parallel session).
5. **Dry run** (read-only, owner): `supabase db push --include-all --dry-run --db-url "$SUPABASE_DB_URL"`. Expect exactly the ten versions in section 3, in that order.

### How to apply

Either apply all ten with `supabase db push --include-all --db-url "$SUPABASE_DB_URL"` (the CLI records each in the ledger), or apply them one file at a time in a single transaction each and then record with `npm run migrations:record`, which refuses to record anything whose objects are absent. **Stop after any failure; do not continue past a failed step.** After each step, `npm run migrations:status` (read-only) should show one fewer failing migration than before; start from 11 (the ten plus the scoring check) and expect 10, 8, 7, 6, 5, 4, 3, 2, 1, 0. Step 2 drops two, because it also clears the scoring-role check.

Quick read-only SQL checks per step are below. All are `SELECT`.

| Step | Migration | Verify after | Rollback note |
|---|---|---|---|
| 1 | `20260818090000` | `select pg_get_constraintdef(oid) from pg_constraint where conname='item_versions_answer_kind_known'` lists `hot_text` and `matrix`. | Re-add the constraint without those two kinds. Only valid while no item uses them (today 0 items). Restore from backup otherwise. |
| 2 | `20260820090000` | `to_regclass('public.media_assets')` and `public.item_groups` not null; `manual_marks_item_key` definition includes `part_id` and `NULLS NOT DISTINCT`; 9 `UPDATE` column grants for `mindmosaic_scoring`. | Drop the 9 new tables and the added columns and constraints; recreate the old index on `(session_id, session_item_id)`; restore `record_manual_mark` from `20260816100000`; revoke the `part_score_evidence` grant; restore the kind list without `structured`. Safe only while the new tables and columns are empty. |
| 3 | `20260825090000` | `to_regclass('public.content_batches')` not null; `select id, public from storage.buckets where id='content-assets-private'` returns `public = false`; types `content_origin` etc. exist. | Drop the 16 tables, 3 types and 3 functions (and their triggers); remove the bucket through the Storage API; restore the two provenance checks; drop `learner_explanation` and `asset_refs`. Safe while empty. |
| 4 | `20260827090000` | `select count(*) from curriculum_jurisdictions` = 9; `profiles_year_level_check` allows 1–12; the two new nullable columns exist; `programme_offerings_region_known` exists. | Drop the 9 tables, the two columns and their constraints, and the region check; restore the year check to {3,5} only if no profile has another year. Safe while empty. |
| 5 | `20260902090000` | `select rolname, rolcanlogin, rolbypassrls from pg_roles where rolname='mindmosaic_content_answer_writer'` returns login true, bypass false; one policy on `item_answer_versions` names it. | Drop the policy, `revoke insert`, `drop role`. Then set its password separately (see approvals). |
| 6 | `20260922100000` | Four new `profiles` columns exist; the 4 student rows read back unchanged for `display_name`, `year_level`; `authenticated` `UPDATE` columns are `display_name`, `year_level` plus the four new. | Drop the four columns; `revoke update on profiles from authenticated; grant update (display_name, year_level) on profiles to authenticated`. |
| 7 | `20260923090000` | Subject `amc_mathematics` exists; 2 AMC offerings; 101 active offerings. | Roll back step 8 first, then delete the two offerings and the subject. |
| 8 | `20260923100000` | Active offerings = profile versions = blueprint versions = 101; each AMC offering has one of each. | Delete the AMC blueprint cells, then versions, then profile versions (none are referenced while there are no sessions). |
| 9 | `20261005090000` | Both tables exist with RLS on and `count(*) = 0`; trigger `approved_session_item` exists; `select count(*) from publication_gate_settings` = 0. | `drop trigger approved_session_item`, drop `guard_approved_session_item`, restore `create_assessment_session` from `20260823110000_assessment_session_profile_version_pin.sql`, drop the two tables. |
| 10 | `20261013090000` | Four `writing_*` tables, 6 functions, 1 rubric (`select count(*) from writing_rubrics` = 1). | Drop the 6 functions and 4 tables; restore `erase_student` from `20260815110000_erase_student_both_models.sql`. Safe while no writing attempt exists. |

### After

1. `npm run migrations:status` against the hosted database must report 49 of 49 with no drift (read-only).
2. Run a no-write smoke check of the live app against the hosted backend (sign-in, student dashboard) before deploying the newer application.
3. Deploy the newer application only after step 10 is verified.
4. Leave `publication_gate_settings` empty. Do not run any approval or gate command against the hosted database.

## 9. What you need to approve or run yourself

You need to approve:
- the maintenance window and the backup you will rely on for rollback;
- applying all ten migrations in the order above (or each step individually), including writing the ledger rows;
- provisioning a password for `mindmosaic_content_answer_writer` through your secrets process (step 5), if and when the content-publishing path is to be used;
- confirming `SCORING_DB_PASSWORD` for `mindmosaic_scoring` in the app environment;
- deploying the newer application after the migrations.

You run (or authorise me to run) against the hosted database:
- the dry run and the apply (`supabase db push --include-all ...`), or the per-file apply plus `migrations:record`;
- the post-apply `migrations:status` check, which is read-only.

I have not run, and will not run, any of the above.

## 10. Rehearsal evidence (local throwaway stack, removed)

- Built a local stack from only the 39 migrations recorded in the hosted ledger, seeded the same 6 profile shapes, and added a stub `storage.buckets` table (the storage service was not running locally; hosted has the real one).
- Applied the 10 missing migrations in timestamp order, each in its own transaction. No errors. Each took under 1.3 s. The registry check for each version passed straight after it was applied.
- Final registry: 49 of 49 passing. `mindmosaic_scoring` then held 9 `UPDATE` column grants. Profiles unchanged (2 parent, 2 Year 3, 2 Year 5). Gate settings 0 rows, approvals 0 rows. Offerings 101, profile versions 101, blueprint versions 101. Writing rubric seeded (1).
- Separate resets showed `20261005090000` applies alone on the hosted-like state, and `20261013090000` applies after it.
- 70 RLS tests passed against the migrated copy: `publication-approvals`, `writing-parent-marking` and `privilege-hardening`. The full RLS suite assumes a pristine database (it asserts global counts), so it was not run against a seeded copy.
- Teardown: stack stopped, its volumes and working directory removed.

## 11. Limits of this report

- It shows the state of the schema and data on 13 October 2026, not proof that every migration is safe against any future data.
- Timings are from empty tables; hosted is also near-empty, so they should hold, but they are not a load test.
- Backup and recovery capability, role passwords, and the application's environment were not inspectable from here.
- Whether the deployed production bundle tolerates each intermediate state was assessed from SQL, not run.
