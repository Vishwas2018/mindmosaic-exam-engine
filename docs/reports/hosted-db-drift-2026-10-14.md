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
- **The live site already expects 8 of the 10 migrations (follow-up, section 12).** Production serves `main` at `47c11ba8`, which contains those 8 migrations and code that uses their columns. The student shell is degraded now: year level reads as missing, onboarding cannot complete. Not an outage.
- **The project is on the Free tier: no scheduled backups, no PITR (owner-confirmed, section 14.1).** A manual dump is the only safety net. One was taken and **proven to restore** (section 14.2).
- **Section 15 closes the restore gap; section 16 stages the two options (migration 6 only, or all 8) for the owner to choose.** A working `psql` path to hosted exists, the Supabase access token in `.env.local` is dead (401), and the in-place restore was rehearsed as a non-superuser `postgres` with attributes matching hosted.
- **Scope decision: apply migrations 1 to 8 only (section 14.3).** 9 and 10 are held until `dev` ships. Running the apply from a checkout of `main` (`47c11ba8`) applies exactly those eight. The ordered command, per-step checks and restore procedure are in sections 14.4 and 14.5. **Nothing has been applied.**
- **Plain `supabase db push` will refuse.** The hosted ledger already holds later versions (`20260821`, `20260822`, `20260823`) than the first missing ones, so the CLI needs `--include-all`.

## 2. Method (all read-only)

- Direct Postgres connection with the session forced read-only (`default_transaction_read_only=on`, 20 s statement timeout). Confirmed `ro = on`, Postgres 17.6. Only `SELECT` was issued.
- Migration objects were checked with the repository's own registry checks (`scripts/migrations/registry.ts`, all `SELECT`), plus the ledger table `supabase_migrations.schema_migrations`.
- Data was inspected as **counts only**. No row contents were read.
- Function source for three functions was read with `pg_get_functiondef` and compared with the repository.
- `supabase migration list --db-url` (read-only) was used as an independent view of the ledger. It agrees: 10 local-only versions and none remote-only.
- Not checkable read-only: whether `mindmosaic_scoring` has a password set (that lives in `pg_authid`), what Vercel environment variables are set, and what backups or point-in-time recovery the hosted plan provides (follow-up in section 13: still not readable).

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
| â€” | `20260812110000` | `scoring_role` | **yes** | role yes, **one grant check fails** | 1 (section 5) |

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
| 4 | `20260827090000` | Adds 9 curriculum registry tables (RLS on, no learner grants, immutable), seeds 9 AU jurisdictions, adds `programme_offerings_region_known`, widens `profiles.year_level` check from {3,5} to 1â€“12, adds nullable `profiles.curriculum_jurisdiction_code` and `curriculum_school_sector`. | Safe, check first | None. | Touches `profiles`: the widened check admits every existing row; the two new columns are nullable with no inference ("null means not yet collected"). All 99 offerings are `global`, which the new region check allows. |
| 5 | `20260902090000` | Creates role `mindmosaic_content_answer_writer` (`LOGIN`, no password), one `INSERT` grant and one policy on `item_answer_versions`. | Safe, needs provisioning | None. | The role cannot authenticate until a password is set out of band. Do **not** put a credential in the migration. Only needed by the content-publishing path. |
| 6 | `20260922100000` | Adds `profiles.onboarding_completed_at`, `diagnostic_completed_at` (nullable), `interests` (`{}`), `weekly_goal_minutes` (60); revokes then re-grants column `UPDATE` on `profiles` to `authenticated`. | Safe, check first | After 4 (order only). | Touches the 4 student profiles. Defaults are constants (no table rewrite). The revoke and re-grant run in one transaction; the end state is display name, year level and the four new columns (a superset of today's display name and year level), so nothing a learner can do today is removed. No completion state is inferred for existing students: they will be treated as not onboarded. |
| 7 | `20260923090000` | Seeds subject `amc_mathematics` and two AMC offerings (Year 3 and 5). | Safe | Programme `australian_mathematics_competition` (present), region check from 4 (`global` allowed). | Offerings go from 99 to 101 active. They have no items. Nothing in `src/` lists `programme_offerings` for display, so no new tile was found; confirm in the UI after applying. |
| 8 | `20260923100000` | Backfills one blueprint version, cell and profile version for each of the two AMC offerings. | Safe | **After 7.** Needs `phase2-fixed-framework` revision 1 (present). | Idempotent (`on conflict do nothing`), raises if the framework row is absent. 101 offerings, 101 profile versions, 101 blueprint versions afterwards. |
| 9 | `20261005090000` | Creates `item_publication_approvals` and `publication_gate_settings` (both private, empty); adds trigger `approved_session_item` on `assessment_session_items`; **restates `create_assessment_session`**. | Safe, check first | Needs `assessment_profile_versions`, `programmes.assessment_family_id` (present). Independent of 1â€“8: applied alone on the hosted-like copy. | The one that changes a hot path; see section 7. |
| 10 | `20261013090000` | Timed writing: 4 tables, 6 functions, read-only RLS, one seeded rubric; restates `erase_student` to also delete a child's writing attempts. | Safe | Independent of 1â€“9: applied alone, and after 9, on the hosted-like copy. | Restated `erase_student` differs from the hosted body only by the writing additions (counts and deletes of `writing_attempts`); compared line by line. No writing prompt is approved, so no child can reach the feature. |

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
- (Superseded by section 12 for the code actually deployed: production is `main`, and `main` already needs migration 6 and part of 4.) Old application code remains compatible with every step as far as the SQL shows: new columns are nullable or defaulted, constraints are widened, restated functions keep their signatures, and the column grants are a superset. This was assessed from the SQL, not by running the currently deployed bundle (production tracks `main`, which is behind `dev`).
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
| 4 | `20260827090000` | `select count(*) from curriculum_jurisdictions` = 9; `profiles_year_level_check` allows 1â€“12; the two new nullable columns exist; `programme_offerings_region_known` exists. | Drop the 9 tables, the two columns and their constraints, and the region check; restore the year check to {3,5} only if no profile has another year. Safe while empty. |
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

## 12. Follow-up: what the live site expects (added 14 October 2026, read-only)

**Method.** Production deployment checked with the Vercel CLI: the latest Production deployment (about 3 Oct 2026) was built from `main` at `47c11ba8`, "Merge pull request #23 from Vishwas2018/dev". I then read `origin/main` at that commit. This is static analysis of the code against the hosted schema in sections 3 and 6. I did not request pages from the live site, and I did not touch the database.

**Answer: yes.** `main` already contains migration files 1 to 8 (not 9 and 10, which exist only on `dev`), and some of its application code uses objects those migrations create. Those objects are absent on hosted, so the following is broken or degraded on the live site right now.

| Severity | Feature (code on `main`) | Missing object | What happens on hosted today |
|---|---|---|---|
| **Moderate, every signed-in student** | Student shell loader `requireStudent()` (`src/features/student/require-student.ts`), used by `/student`, `/student/practice`, `/student/learn*`, `/student/engagement`, `/student/exam-preparation` and the app header | `profiles.onboarding_completed_at`, `diagnostic_completed_at`, `interests`, `weekly_goal_minutes` (migration 6) | The `select` names columns that do not exist, so PostgREST returns an error. The code ignores the error and gets no profile. Year level reads as null, which `/student/practice` turns into **Year 3, so a Year 5 student is shown Year 3 content** (hosted has 2 Year 5 students). Display name falls back to the auth metadata name. Onboarding is always "not completed", so the prompt shows on every visit. I read the practice page; the other callers share the loader but I did not read each one. |
| **Moderate, feature unusable** | `POST /api/student/onboarding/complete` | Same four `profiles` columns (migration 6) | The route selects `onboarding_completed_at` for its role check, gets no profile, and returns **403 `students_only`** before creating anything. A student cannot finish onboarding or the diagnostic. No partial writes. |
| **Moderate, feature unusable** | `POST /api/student/onboarding/preferences` | `profiles.interests`, `weekly_goal_minutes` (migration 6) | The profile update fails. Preferences cannot be saved. |
| **Low, dormant** | Parent add-child and edit-child APIs when `curriculumPreference` is sent | `profiles.curriculum_jurisdiction_code`, `curriculum_school_sector` (migration 4) | With that field present, add-child fails after the auth user is created ("account was not set up"; an orphaned auth row, no parent link) and edit-child returns 500. No form in `src/` sends the field, so only a direct API call triggers it. Without the field both work. |
| **Low** | `/parent/curriculum-explorer` | `curriculum_*` tables (migration 4) | The page catches the query failure and shows "Unable to load curriculum". Nothing in `src/` links to it. After migration 4 it loads but shows nothing until `scripts/curriculum-import.mts` is run; the migration only seeds jurisdictions. |
| **None for the web app** | Content-factory operator CLI (`scripts/mm-content.mts`, `content-quality-pilots.mts`) | Migration 3 tables, bucket `content-assets-private`, migration 5 role | Used only from scripts, not by any web route. Those scripts would fail against hosted. |
| **None found** | Migrations 1, 2, 7, 8 | answer kinds, media/group tables, `part_score_evidence`, AMC offerings | No `main` code path in `src/` reads these. `rpc("record_manual_mark")` on `main` passes only the four original parameters, which the hosted function accepts. The sitting and marking paths are unused anyway (0 sessions). I found no AMC tile that reads `programme_offerings`. |

**What still works.** Sign-in, role lookup and the parent, teacher and billing profile reads select only columns that exist, so I found nothing there that breaks.

**Practical reading.** The live site is not down. The student-facing damage is the year-level fallback and an onboarding flow that cannot complete, on a database with 4 student profiles and no sessions. Whether those 4 are real children is unknown. Applying migrations 4 and 6 removes all of it, and the apply plan already orders them correctly. It also means `main` was deployed ahead of its own schema, which is worth a release check afterwards.

**For `dev`.** The newer application would additionally need migrations 9 and 10 (publication approvals and timed writing). It is not deployed, so those two cause no live breakage today.

## 13. Follow-up: backup and point-in-time recovery

**Status: could not be read from here. Resolved by the owner: Free tier, no backups (section 14.1).**

- The Supabase CLI session on this machine is signed in to a different account: `supabase projects list` shows three projects (`taxops`, `subtwo`, `equitylens-staging`), none of them MindMosaic.
- The MindMosaic project reference, taken from the public URL in `.env.local`, is `uermhsptduikehuyceiz`. The read-only `supabase backups list --project-ref uermhsptduikehuyceiz` returned `401 Invalid access token`.
- **Correction:** this section originally said no Management API token was available. That was wrong: I had not looked. `.env.local` does contain a `SUPABASE_ACCESS_TOKEN` (and so does `.env.e2e.local`). I have not used either, and I do not know which account they belong to.

**Where you check it (Supabase dashboard, project `uermhsptduikehuyceiz`).** Labels may differ slightly between dashboard versions.

1. **Database, then Backups.**
   - *Scheduled backups* tab: you want a daily backup timestamped within the last 24 hours, with a listed retention (7 days on Pro; more on higher plans or add-ons).
   - *Point in Time* tab: you want PITR **enabled**, and an earliest restorable time before today. If it only offers to enable it, it is off.
2. **Organization settings, then Billing.** Confirm the plan. On the Free plan the dashboard offers no restorable backups, and PITR is not available.
3. **Project is not paused**, and runs Postgres 17 (the inspection saw 17.6).

**What the result means for the apply:**

- PITR on, or a daily backup taken after the last schema or data change: you have a platform rollback. Record its timestamp or ID before starting.
- Free plan or no usable backup: take your own dump first, for example `supabase db dump --db-url "$SUPABASE_DB_URL" -f pre-apply-schema.sql` plus a `--data-only` dump to a second file, stored outside the repository. The data is only 6 users and 6 profiles, so this is quick. The per-step rollback notes in section 8 remain valid either way, but only while the new tables are empty.
- Restoring a hosted backup rolls back everything written since, including any sign-ups. On a live site that is a reason to watch the apply rather than leave it unattended.

**Not done, by instruction:** no migration or ledger write has been run and no gate row inserted. (Section 14 later reads hosted with `SELECT` and `pg_dump` only.)

## 14. Free tier, verified dump, scope 1 to 8, and the staged apply (added 14 October 2026)

**Nothing in this section has been applied to the hosted database. No deploy has been made.** Hosted was touched only by `pg_dump` (via `supabase db dump`) and read-only `SELECT`s (via `supabase db query`).

### 14.1 Free tier: the dump is the only safety net

The owner confirmed in the dashboard that the project is on the Free tier: no scheduled backups, no PITR, nothing restorable. A tested manual dump is therefore mandatory before any apply.

**What the direct connection (`SUPABASE_DB_URL`) can and cannot do**

| Operation | Status |
|---|---|
| `SELECT` / catalog reads | Done, many times (`supabase db query --db-url`). |
| Full dump (schema and data, including `auth`, `storage`) | Done (`supabase db dump --db-url`; `pg_dump` runs inside the CLI). |
| DDL (what `db push` does) | Same connection and role. **Not exercised**, so not proven. The role's privileges were not probed. |
| Backup list, PITR status, pause status, project settings | Need a Management API token for **this** project. The CLI here is logged in to another account. `.env.local` holds a `SUPABASE_ACCESS_TOKEN` I have not used. |
| Deleting a Storage bucket | Not SQL: Supabase blocks direct deletes on `storage.*` ("Use the Storage API instead"; seen in rehearsal). Needs the service-role key on the Storage API. |

Environment limits found on this machine: there is no local `psql` or `pg_dump`; the database host is IPv6-only and Docker cannot reach it. The CLI's own dump works regardless. I tried a loopback TCP relay to run `pg_dump` from a container; it was blocked by the permission classifier, so I did not use it. It was never left running and nothing is listening.

### 14.2 The dump, and proof that it restores

- **Location (outside every git work tree):** `C:\Users\vishw\mindmosaic-backups\hosted-2026-10-14\`. I checked: `git rev-parse` fails there and no `.git` exists in any parent folder. The repository's `.gitignore` is irrelevant because the folder is not under the repository at all.
- **Taken:** 14 October 2026, before any change.

| File | Bytes | SHA-256 (first 16) | Contents |
|---|---|---|---|
| `roles.sql` | 422 | `3D9566943C3911EE` | Custom roles and role settings (`mindmosaic_scoring`). **No passwords.** |
| `schema-all.sql` | 330,290 | `C523F8C60C20638F` | Schema for `public`, `auth`, `storage`, `supabase_migrations`. |
| `data-all.sql` | 941,804 | `97F0333E16BF6721` | Data (`COPY`) for the same four schemas. |
| `schema-public-and-ledger.sql` | 227,326 | `7A9DDCFC7421C274` | `public` and `supabase_migrations` schema only (for in-place restore). |
| `data-public-and-ledger.sql` | 922,652 | `AACA8683A08861B8` | `public` and `supabase_migrations` data only. |

Total about 2.4 MB. **The files contain password hashes and child profile data. Keep them off shared drives and out of chat, and keep a second copy somewhere safe: this laptop is currently the only copy.**

**Not in the dump:** role passwords (including `mindmosaic_scoring`; reset it if it is ever restored), Auth provider/SMTP settings and other dashboard configuration, Vercel environment variables, and any Storage file bytes (only the `storage.*` rows).

**Restore test.** A throwaway local Supabase Postgres 17.6 container was built from `roles.sql`, `schema-all.sql`, `data-all.sql` only. The image ships stub `auth` and `storage` schemas, which must be dropped first or they collide. Result: **0 errors** on all three files. Compared with live hosted by count and by content hash (no row contents read):

| Check | Restored copy | Live hosted |
|---|---|---|
| `auth.users` / `auth.identities` | 6 / 6 | 6 / 6 |
| `profiles`: students / parents / Year 3 / Year 5 | 4 / 2 / 2 / 2 | 4 / 2 / 2 / 2 |
| `parent_children`, ledger rows, offerings, blueprint versions, sessions | 4, 39, 99, 99, 0 | same |
| public tables / policies / functions / `mindmosaic_scoring` | 41 / 53 / 43 / present | same |
| md5 of `auth.users`, `auth.identities`, `profiles`, ledger, offerings (full row text) | `86a5ffd8â€¦`, `6bb942f7â€¦`, `f56cad91â€¦`, `99d44436â€¦`, `43b10165â€¦` | identical |

The dump restores. The Teardown is complete: container removed, no ports open.

One caveat on process: my first rehearsal pass was invalid (my file extraction collapsed line endings, so each migration became a comment and "applied" as a no-op). I discarded it and redid everything from files compared byte-for-byte against git (sizes match `git cat-file -s`).

### 14.3 Scope: migrations 1 to 8 only

- **Self-contained.** No migration from 1 to 8 references an object from 9 or 10 (grep for the approval, gate, trigger and `writing_*` names: no hits). `origin/main` has exactly 47 migration files, which is the 39 on hosted plus these 8; files 9 and 10 do not exist on `main`.
- **Dry run (read-only), from a checkout of `origin/main` `47c11ba8`:** `supabase db push --include-all --dry-run` lists exactly 8 migrations, in this order: `20260818090000`, `20260820090000`, `20260825090000`, `20260827090000`, `20260902090000`, `20260922100000`, `20260923090000`, `20260923100000`. **Run from `dev` it would also apply 9 and 10, so the apply must be run from the `main` checkout.**
- **Rehearsal on the restored copy.** All 8 applied in order, one transaction each, no errors (0.6 s to 2.9 s each); the per-step checks in 14.4 all pass; ledger 47; `profiles` rows unchanged (md5 of the original columns identical to live hosted: `b9f5903eâ€¦`), `auth.users` unchanged; offerings 99 to 101 as expected.
- **Does it fix both bugs? Yes, and migration 6 alone is what does it.** On the rehearsed copy, acting as role `authenticated` for a Year 5 student, I ran the exact statements `main` issues:
  1. `requireStudent()` select (`display_name, year_level, onboarding_completed_at, diagnostic_completed_at, interests, weekly_goal_minutes`) returns **`year_level = 5`**, not an error. That removes the Year-5-sees-Year-3 fallback.
  2. The onboarding route's role check (`select role, onboarding_completed_at`) returns the row, so the **403 `students_only` no longer occurs**.
  3. The onboarding profile update (`year_level, interests, weekly_goal_minutes, onboarding_completed_at, diagnostic_completed_at`) succeeds; an attempt to update `role` is still refused.
  Limits: this proves the database side. I did not run the Next.js app against the copy.
- **Correction to section 12:** it said migrations 4 and 6 remove the damage. Only 6 is needed for these two bugs. Migration 4 matters for the dormant `curriculumPreference` API path and the unlinked curriculum explorer. Both are inside 1 to 8 anyway, so the scope decision is unchanged. Migration 6 has no dependency on 4 (it only adds columns and re-grants).

### 14.4 The staged apply (one reviewed command, owner present)

**Before you say go**

1. Project shows **Active** (not Paused) in the dashboard (14.6).
2. Take a fresh dump immediately before the apply, if more than a few hours have passed since 14.2 (commands below), so the restore point matches the live state.
3. Open a clean checkout of `main`, nothing else:
   ```powershell
   git fetch origin
   git worktree add --detach C:\tmp\wt-main-apply origin/main      # must show 47c11ba8 (or later main commit with the same 47 files)
   Set-Location C:\tmp\wt-main-apply
   (Get-ChildItem supabase\migrations\*.sql).Count                  # must print 47
   ```
4. `SUPABASE_DB_URL` set to the hosted direct connection string (from `.env.local`; do not paste it into chat).

**Fresh dump (same commands as 14.2)**
```powershell
$d = "C:\Users\vishw\mindmosaic-backups\hosted-<date>"; New-Item -ItemType Directory $d
supabase db dump --db-url $env:SUPABASE_DB_URL --role-only -f "$d\roles.sql"
supabase db dump --db-url $env:SUPABASE_DB_URL -s public,auth,storage,supabase_migrations -f "$d\schema-all.sql"
supabase db dump --db-url $env:SUPABASE_DB_URL -s public,auth,storage,supabase_migrations --data-only --use-copy -f "$d\data-all.sql"
supabase db dump --db-url $env:SUPABASE_DB_URL -s public,supabase_migrations -f "$d\schema-public-and-ledger.sql"
supabase db dump --db-url $env:SUPABASE_DB_URL -s public,supabase_migrations --data-only --use-copy -f "$d\data-public-and-ledger.sql"
```
(The CLI prints a harmless PostHog telemetry timeout at the end.)

**The apply: two commands, in this order**
```powershell
# 1. read-only. Must list EXACTLY these 8, in this order, and nothing else:
supabase db push --include-all --dry-run --db-url $env:SUPABASE_DB_URL

# 2. the apply (asks for confirmation; answer Y only if step 1 was exactly the 8)
supabase db push --include-all --db-url $env:SUPABASE_DB_URL
```
`--include-all` is required because the hosted ledger already holds later versions (`20260821` to `20260823`) than the first missing ones. The CLI applies in version order and stops at the first failure.

| Step | Version | Name |
|---|---|---|
| 1 | `20260818090000` | `naplan_interaction_answer_kinds` |
| 2 | `20260820090000` | `assessment_capability_expansion` |
| 3 | `20260825090000` | `content_factory_phase1` |
| 4 | `20260827090000` | `curriculum_platform_foundation` |
| 5 | `20260902090000` | `content_answer_writer_role` |
| 6 | `20260922100000` | `student_onboarding_preferences` |
| 7 | `20260923090000` | `amc_programme_offerings` |
| 8 | `20260923100000` | `amc_phase2_config_backfill` |

**Verification, run after the apply (or after a failure, to see how far it got).** One read-only query, 17 rows, every `ok` must be `t`. If the push stops at migration N, the rows for steps below N are `t` and the rest `f`. Run it with `supabase db query --db-url $env:SUPABASE_DB_URL -f docs\reports\hosted-db-drift-2026-10-14-verify-1-8.sql -o table`. (It was run in rehearsal and all 17 passed.)

```sql
select step, check_name, ok from (values
 (1, 'item_versions answer-kind check allows hot_text and matrix',
   (select pg_get_constraintdef(oid) like '%hot_text%' and pg_get_constraintdef(oid) like '%matrix%' from pg_constraint where conname = 'item_versions_answer_kind_known')),
 (2, 'media_assets and item_groups exist',
   to_regclass('public.media_assets') is not null and to_regclass('public.item_groups') is not null),
 (2, 'manual_marks_item_key includes part_id, NULLS NOT DISTINCT',
   (select indexdef like '%part_id%' and indexdef ilike '%nulls not distinct%' from pg_indexes where schemaname = 'public' and indexname = 'manual_marks_item_key')),
 (2, 'mindmosaic_scoring holds 9 UPDATE column grants',
   (select count(*) = 9 from information_schema.column_privileges where grantee = 'mindmosaic_scoring' and privilege_type = 'UPDATE' and table_schema = 'public')),
 (3, 'content_batches exists',
   to_regclass('public.content_batches') is not null),
 (3, 'bucket content-assets-private exists and is private',
   (select coalesce(bool_and(not public), false) and count(*) = 1 from storage.buckets where id = 'content-assets-private')),
 (4, '9 curriculum jurisdictions seeded',
   (select count(*) = 9 from public.curriculum_jurisdictions)),
 (4, 'profiles has both curriculum columns',
   (select count(*) = 2 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name in ('curriculum_jurisdiction_code', 'curriculum_school_sector'))),
 (4, 'profiles_year_level_check allows 1-12',
   (select pg_get_constraintdef(oid) like '%12%' from pg_constraint where conname = 'profiles_year_level_check')),
 (4, 'programme_offerings_region_known exists',
   exists (select 1 from pg_constraint where conname = 'programme_offerings_region_known')),
 (5, 'content answer writer role: login, no bypassrls',
   (select rolcanlogin and not rolbypassrls from pg_roles where rolname = 'mindmosaic_content_answer_writer')),
 (6, 'profiles has the 4 onboarding columns',
   (select count(*) = 4 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name in ('onboarding_completed_at', 'diagnostic_completed_at', 'interests', 'weekly_goal_minutes'))),
 (6, 'authenticated can UPDATE exactly the 6 intended profile columns',
   (select count(*) = 6 and bool_and(column_name in ('display_name', 'year_level', 'onboarding_completed_at', 'diagnostic_completed_at', 'interests', 'weekly_goal_minutes')) from information_schema.column_privileges where grantee = 'authenticated' and privilege_type = 'UPDATE' and table_schema = 'public' and table_name = 'profiles')),
 (7, 'subject amc_mathematics exists',
   exists (select 1 from public.subjects where id = 'amc_mathematics')),
 (7, '101 active offerings',
   (select count(*) = 101 from public.programme_offerings where active)),
 (8, '101 offerings = 101 profile versions = 101 blueprint versions',
   (select count(*) from public.assessment_profile_versions) = 101 and (select count(*) from public.blueprint_versions) = 101),
 (0, 'ledger holds 47 rows',
   (select count(*) = 47 from supabase_migrations.schema_migrations))
) as t(step, check_name, ok) order by step, check_name;
```

**After the apply**

1. The verification query is all `t`.
2. Owner smoke test on the live site with a Year 5 student account: the student pages show Year 5, and the onboarding flow completes (no 403). Sign-in still works. (This part is not something I can test.)
3. `npm run migrations:status` from the `main` checkout against hosted should report no drift. I have not run it against hosted.
4. Leave `publication_gate_settings` and anything in 9 and 10 alone. The database is now exactly at `main`.
5. `git worktree remove C:\tmp\wt-main-apply`.

**Not part of this apply:** setting a password for `mindmosaic_content_answer_writer` (only needed by the content-publishing scripts, not the web app), running `scripts/curriculum-import.mts` (the curriculum explorer will load but be empty), and migrations 9 and 10.

### 14.5 If anything goes wrong

Work down this list; stop at the first level that fixes it.

1. **A migration fails mid-push.** The CLI stops. The failing file should leave no partial change (the CLI sends each file with its ledger insert in one batch; I rehearsed one transaction per file and did not independently test the CLI's transaction behaviour, so check with the verification query rather than assuming). Earlier steps are additive and safe to leave in place. Fix the cause and run the same `db push --include-all` again; it resumes from the first unrecorded version.
2. **Undo specific steps.** Use the per-step rollback notes in section 8. They hold while the new tables are empty, which they will be, because nothing writes to them yet.
3. **Restore `public` and the ledger from the dump (in place).** Rehearsed locally: apply 1 to 8 to the restored copy, then roll back this way. Result: ledger 39, 41 public tables, 53 policies, 43 functions, `mindmosaic_scoring` back to 8 update columns, writer role gone, and the md5 of the profiles (original columns), ledger and offerings **identical to the pre-apply values**.
   1. Remove the bucket through the **Storage API** (service-role key), not SQL: `DELETE /storage/v1/bucket/content-assets-private` (it is empty). Direct SQL is blocked.
   2. Run, as the owner role:
      ```sql
      begin;
      drop schema public cascade;
      drop schema supabase_migrations cascade;
      drop role mindmosaic_content_answer_writer;
      commit;
      ```
      (Do **not** add `drop owned by mindmosaic_content_answer_writer`: as the non-superuser `postgres` it fails with "permission denied to drop objects", which is what blocked my first attempt. It is not needed, because dropping the schema removes the role's grants. Use only the role drop if the role exists, i.e. only if migration 5 was applied.)
   3. Restore, in this order, with `psql -v ON_ERROR_STOP=0 -f`: `schema-public-and-ledger.sql`, then `data-public-and-ledger.sql`.
   4. Re-run the "before" checks (ledger 39 rows, `select count(*) from auth.users` = 6).

   **Superseded caveat:** the earlier version of this section said the in-place path was only rehearsed as a superuser. It has since been rehearsed as the non-superuser `postgres` role, whose attributes match hosted's exactly (section 15). `auth` is untouched by this path, which is deliberate: migrations 1 to 8 do not change `auth` data or schema (migration 3 only adds foreign keys from new `public` tables to `auth.users`, and inserts one `storage.buckets` row), and the hosted `postgres` role cannot drop it. A working `psql` client now exists on this machine (section 15).
4. **Last resort: full restore.** `roles.sql`, `schema-all.sql`, `data-all.sql` restore cleanly into a local Supabase Postgres (14.2), but restoring `auth` into a hosted project needs a new project, new keys in Vercel, and re-imported users. Plan that separately if it is ever needed.

A restore returns the database to the dump moment. Anything written after it (new sign-ups, onboarding) is lost, which is another reason to dump immediately before the apply and to be watching while it runs.

### 14.6 Free-tier notes that affect this

- **Auto-pause.** See section 15.3 for the policy from Supabase's published docs. Effect on the apply: if the project is paused, `db push` and the dump fail at connect, before any change. The apply itself takes seconds to a few minutes, so a pause during it is not a realistic risk. Check the project shows **Active** immediately before starting. Effect on the live site: a paused project takes sign-in and all data down until restored from the dashboard.
- **Single copy.** With no platform backups, the dump on this laptop is the only copy. Copy it to a second location you trust before the apply.
- **Config warning.** The CLI prints: `api.auto_expose_new_tables is deprecated and will be removed on 2026-10-30` (new default: revoke Data API privileges on new tables in `public`). Migrations 1 to 8 grant and revoke explicitly, so they are unaffected. It matters for any later migration that relies on implicit exposure (there is already a branch `chore/supabase-explicit-grants`).
- **Pre-existing worktree.** `C:\Users\vishw\Vish\Vish\.worktrees\hosted-drift` already exists on this PR branch at an older commit (`4fd5f3e9`). I did not touch it; pull before editing there.

## 15. Closing the restore gap (added 14 October 2026, later the same day)

**Nothing here changed hosted.** Hosted was touched only by `SELECT`s, through `psql` and `supabase db query`, with the session set read-only where the tool allowed it.

### 15.1 A working client path to hosted

| Route | Result |
|---|---|
| **Native PostgreSQL 17.6 client tools on Windows (works)** | Installed at `C:\Users\vishw\pgclient\pg17\pgsql\bin` (the EnterpriseDB binaries zip, extracted; no installer, no admin rights, nothing on PATH). `psql` connects directly to the hosted direct connection over IPv6 and ran a read-only query: `postgres | ro=on | PostgreSQL 17.6 | 6 auth users | 39 ledger rows`. |
| Dashboard IPv4 pooler string + Docker | Not needed, so not tried. It remains the fallback: the pooler region is not in the repository, so it would need to be copied from the dashboard. |
| Docker with the direct connection | Does not work (IPv6-only host). |

Notes: the binaries are EDB's official build downloaded over HTTPS, but they are **not Authenticode-signed and I did not verify them against a published checksum**. Delete `C:\Users\vishw\pgclient` when finished if that matters to you. Native `pg_dump` 17.6 **fails** against this Supabase server (it drops the connection on a `set_config('restrict_nonsystem_relation_kind', â€¦)` call), so keep using `supabase db dump` for dumps and `psql` for restores.

### 15.2 Project plan and pause status from the API: not possible, the token is dead

- `SUPABASE_ACCESS_TOKEN` in `.env.local` (the `sbp_` token; `.env.e2e.local` holds the identical value) returns **HTTP 401** on `GET /v1/projects` and on `GET /v1/projects/uermhsptduikehuyceiz`. It is expired, revoked, or for a different account.
- So I could not read the plan or pause status from the API. To get it, create a new personal access token in the dashboard (Account, then Access Tokens), put it in `SUPABASE_ACCESS_TOKEN` in your session only, and I can read project status and backups with two GETs. The plan itself was confirmed by you in the dashboard (Free).
- What I can say from the database side: the project is active right now (it answered many queries today).

### 15.3 Auto-pause window, from Supabase's published docs (not from memory)

From `supabase.com/docs/guides/platform/free-project-pausing`:
- Free projects are paused for **"low activity over a 7-day period"**.
- The owner gets a **warning email roughly one week before** the pause takes effect, and a second email after.
- A paused project can be restored from the dashboard **"up to 1 year after it was paused"**. A second copy of the same guide on another host still says 90 days, so the window has changed over time; confirm on the live page. After the window the docs say backups are no longer retained.
- Supabase says paid plans are not paused.

What to do: look for a pause-warning email to the account owner, and check the project status shows Active before the apply.

### 15.4 The restore path, proved as closely as possible without touching hosted

**Is hosted's `postgres` role able to do what the rehearsal did?** I compared the role the connection uses on hosted against the role used in the local rehearsal, read-only:

| Attribute | Hosted | Local rehearsal |
|---|---|---|
| connected as | `postgres` | `postgres` |
| superuser | no | no |
| `CREATEROLE` / `CREATEDB` / `BYPASSRLS` | yes / yes / yes | yes / yes / yes |
| database owner; member of it | `postgres`; yes | `postgres`; yes |
| `public` schema owner | `pg_database_owner` | `pg_database_owner` |
| `supabase_migrations` schema owner | `postgres` | `postgres` |
| `public` relations / functions not owned by `postgres` | 0 / 0 | 0 / 0 |
| `supabase_migrations` relations not owned by `postgres` | 0 | 0 |
| event triggers (all owned by `supabase_admin`) | 6 | 6 (identical list) |
| server version | 17.6 | 17.6 |

They match on every attribute I could compare. On that basis I re-ran the whole lifecycle locally **as the non-superuser `postgres` role** (previously I used a superuser):

1. Restored the dump into a fresh local Supabase Postgres (as `supabase_admin`, since the image's `auth` and `storage` schemas belong to it; on hosted they already exist).
2. Applied migrations 1 to 8 as `postgres` (what `db push` does): 8 of 8 succeeded. Migrations 2 and 5 create roles, which works because `postgres` has `CREATEROLE`.
3. Rolled back as `postgres`: `drop schema public cascade; drop schema supabase_migrations cascade; drop role mindmosaic_content_answer_writer;`: succeeded.
4. Restored `schema-public-and-ledger.sql` and `data-public-and-ledger.sql` as `postgres`: 0 errors.
5. Result: ledger 39, 41 public tables, 53 policies, 43 functions, writer role gone, `mindmosaic_scoring` back to 8 update columns, `authenticated` back to 2 profile update columns, and the md5 of the profiles (original columns), the ledger and the offerings **identical to live hosted before the apply** (`b9f5903eâ€¦`, `99d44436â€¦`, `43b10165â€¦`).

**One failure found and fixed in the procedure:** `drop owned by mindmosaic_content_answer_writer` fails for `postgres` ("permission denied to drop objects"). It is not needed and has been removed from 14.5.

**What is still not proven:**
- It has not been run against hosted, by design.
- The one step that cannot be SQL, deleting the `content-assets-private` bucket through the Storage API with the service-role key, was **not exercised** (no Storage service locally; the key exists in `.env.local` but I have not tried it). It is only needed if the apply reached migration 3, and an empty private bucket left behind is harmless.
- `auth` and `storage` data are not part of this restore path. Migrations 1 to 8 do not change them, apart from the one bucket row.

**What a real recovery would require, and how long it would take**
1. Decide to restore, and put the site in a known state (the `public` schema will not exist for a few minutes, so every data call on the live site fails during it; nothing is lost that the dump holds).
2. `psql` from `C:\Users\vishw\pgclient\pg17\pgsql\bin`, with `SUPABASE_DB_URL`.
3. Optional: delete the bucket through the Storage API.
4. Run the three statements above, then the two restore files, then the "before" checks.

*Timing, measured:* locally the drop and restore took 4.8 s in total (0.6 s drop, 3.6 s schema, 0.6 s data). Against hosted, round trips cost about 145 ms each (200 sequential statements took 28.9 s, including the connection). The schema file has about 780 statements and the data file 42 `COPY` blocks, so the **restore itself should take about 3 to 5 minutes**. Allow another 5 minutes for deciding, connecting and checking. Expect **roughly 10 minutes of degraded site** end to end. This is an estimate from those numbers, not a run against hosted.

## 16. The two options, corrected and staged (owner decides; nothing applied)

**Correction to earlier text:** migration 6 alone fixes both live bugs (Year 5 shown as Year 3, and the onboarding 403). Migration 4 is not needed for either. And the apply **must be run from a checkout of `main`**, never `dev`: `dev` also contains migrations 9 and 10, and `db push --include-all` there would apply them.

**Guard, run in whichever checkout you apply from. All three lines must print True.**
```powershell
git merge-base --is-ancestor HEAD origin/main; $?                      # HEAD is on main's history
(Get-ChildItem supabase\migrations\*.sql).Count -eq 47                  # main has 47 files; dev has 49
-not (Test-Path supabase\migrations\20261005090000_*.sql) -and -not (Test-Path supabase\migrations\20261013090000_*.sql)   # no 9 or 10
```

### Option (a): migration 6 only (the minimum that fixes the live bug)

Rehearsed on the restored copy as `postgres`: migration 6 applied alone in one transaction together with its ledger row; as a Year 5 student `requireStudent()`'s select returned `year_level = 5`, the onboarding role check returned the row, and the onboarding update succeeded. Then the other seven applied in version order afterwards (1, 2, 3, 4, 5, 7, 8) and all 17 checks passed with 47 ledger rows, so applying 6 first and the rest later is safe.

`db push` cannot apply a subset, so this uses `psql` and writes the ledger row itself, in one transaction:
```powershell
$psql = 'C:\Users\vishw\pgclient\pg17\pgsql\bin\psql.exe'
& $psql $env:SUPABASE_DB_URL -X -v ON_ERROR_STOP=1 --single-transaction `
  -f supabase\migrations\20260922100000_student_onboarding_preferences.sql `
  -c "insert into supabase_migrations.schema_migrations(version,name) values ('20260922100000','student_onboarding_preferences')"
```
Either both the migration and its ledger row commit, or neither does. Then verify, and confirm the CLI agrees:
```powershell
supabase db query --db-url $env:SUPABASE_DB_URL -f docs\reports\hosted-db-drift-2026-10-14-verify-6-only.sql -o table
supabase migration list --db-url $env:SUPABASE_DB_URL      # 20260922100000 should show on both sides; 7 versions remain local-only
```
`docs\reports\hosted-db-drift-2026-10-14-verify-6-only.sql` (also in this PR; read-only; every `ok` must be `t`. Run on today's hosted state it returns `f f f f t t`, which I did to validate the syntax):
```sql
select check_name, ok from (values
 ('profiles has the 4 onboarding columns',
   (select count(*) = 4 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name in ('onboarding_completed_at', 'diagnostic_completed_at', 'interests', 'weekly_goal_minutes'))),
 ('authenticated can UPDATE exactly the 6 intended profile columns',
   (select count(*) = 6 and bool_and(column_name in ('display_name', 'year_level', 'onboarding_completed_at', 'diagnostic_completed_at', 'interests', 'weekly_goal_minutes')) from information_schema.column_privileges where grantee = 'authenticated' and privilege_type = 'UPDATE' and table_schema = 'public' and table_name = 'profiles')),
 ('ledger holds 40 rows (39 + migration 6)',
   (select count(*) = 40 from supabase_migrations.schema_migrations)),
 ('migration 6 is the newest ledger row',
   (select max(version) = '20260922100000' from supabase_migrations.schema_migrations)),
 ('profiles unchanged: 6 rows, 4 students, 2 in Year 3, 2 in Year 5',
   (select count(*) = 6 and count(*) filter (where role = 'student') = 4 and count(*) filter (where role = 'student' and year_level = 3) = 2 and count(*) filter (where role = 'student' and year_level = 5) = 2 from public.profiles)),
 ('no student marked onboarded by the migration',
   (select count(*) = 0 from public.profiles p where to_jsonb(p)->>'onboarding_completed_at' is not null or to_jsonb(p)->>'diagnostic_completed_at' is not null))
) as t(check_name, ok);
```
Then the owner smoke test on the live site (Year 5 student sees Year 5; onboarding completes with no 403).

*Rollback for (a):* the migration only adds four columns and swaps the column grants on `profiles`. Undo with `alter table public.profiles drop column onboarding_completed_at, drop column diagnostic_completed_at, drop column interests, drop column weekly_goal_minutes; revoke update on public.profiles from authenticated; grant update (display_name, year_level) on public.profiles to authenticated; delete from supabase_migrations.schema_migrations where version = '20260922100000';`. **Do that only before any student has used the new onboarding**, otherwise dropping the columns discards their answers. Beyond that, 14.5 applies.

*What (a) leaves:* hosted still lacks migrations 1 to 5, 7 and 8. `main`'s content-factory scripts, the curriculum explorer and the `curriculumPreference` API path stay unsupported, and the ledger is one short of `main`'s files.

### Option (b): all 8, aligning hosted with deployed `main`

Exactly as in 14.4: the guard above, a fresh dump, the dry run that must list exactly the 8, then `supabase db push --include-all --db-url $env:SUPABASE_DB_URL`, then the 17-row verification. Rehearsed end to end as `postgres` (section 14.3 and 15.4).

### Comparison

| | (a) migration 6 only | (b) all 8 |
|---|---|---|
| Fixes Year-5-sees-Year-3 and the onboarding 403 | Yes (rehearsed) | Yes (rehearsed) |
| Tooling | `psql` + manual ledger insert (one transaction) | `supabase db push` (standard path) |
| Objects changed on hosted | 4 columns + 1 grant swap on `profiles` | 34 new tables, new roles and bucket, 99 to 101 offerings, `profiles` columns and grants |
| Leaves hosted behind `main` | Yes, 7 migrations | No |
| Later work | Still need to apply the other 7 (rehearsed as safe in any order after 6) | None |
| Blast radius if it fails | Smallest | Larger, but each file is its own transaction and it stops at the first failure |


## 17. Applied: migrations 1 to 8 on hosted (14 October 2026)

**Decision (owner):** option (b), all 8, to leave hosted exactly matching deployed `main`. Go-ahead given with the owner present and watching; his acknowledgement was received before the apply started.

### 17.1 Pre-flight (all passed, before anything was changed)

- Dump folder `C:\Users\vishw\mindmosaic-backups\hosted-2026-10-14\`: 5 files, sizes and SHA-256 prefixes all matched the recorded values.
- Hosted was unchanged since the dump: content hashes of `auth.users`, profiles (original columns), the ledger and offerings were identical to the dump-time values, so no re-dump was needed.
- `psql` 17.6 reached hosted as `postgres` with the session read-only. The project answered queries, so it was not paused.
- Checkout: detached `origin/main` = `47c11ba8`; HEAD on main's history; 47 migration files; no migration 9 or 10 files; not the `dev` tip.
- `supabase db push --include-all --dry-run` listed exactly the 8 migrations, in order.

### 17.2 The apply

Command, run from the `main` checkout (the connection string was not printed or stored):
```
supabase db push --include-all --yes --db-url <hosted direct connection>
```
(`--yes` answered the Y/n prompt; the CLI displayed the 8-file list first and the answer was recorded as `y`.)

Result: exit code 0 in 10.7 s. The CLI applied, in this order, with no error on any of them:

| # | Migration | Result |
|---|---|---|
| 1 | `20260818090000_naplan_interaction_answer_kinds` | applied |
| 2 | `20260820090000_assessment_capability_expansion` | applied |
| 3 | `20260825090000_content_factory_phase1` | applied |
| 4 | `20260827090000_curriculum_platform_foundation` | applied |
| 5 | `20260902090000_content_answer_writer_role` | applied |
| 6 | `20260922100000_student_onboarding_preferences` | applied |
| 7 | `20260923090000_amc_programme_offerings` | applied |
| 8 | `20260923100000_amc_phase2_config_backfill` | applied |

The CLI also printed a warning after the last migration: `failed to cache migrations catalog: ... pgdelta-target-ca.crt: ENOENT`. That is a post-step local cache of the migration catalog on the machine running the CLI; it is not a database operation, and the verification below confirms the database state independently. The usual deprecation warnings about `[inbucket]` and `api.auto_expose_new_tables` also appeared.

### 17.3 Verification (read-only, against hosted)

- **Ledger:** 47 rows (was 39). The 8 new versions are present, and `supabase migration list` shows each on both the local and remote side.
- **The 17 checks** (`hosted-db-drift-2026-10-14-verify-1-8.sql`): **17 of 17 true.**
- **Year 5 student, acting as role `authenticated`, in a transaction that was rolled back:**
  - A. The `requireStudent()` select returned `year_level = 5` (and `onboarded = false`, `goal = 60`), not an error.
  - B. The onboarding role-check select returned `role = student` with no error, so the 403 `students_only` path is gone.
  - C. The onboarding profile update (`year_level, interests, weekly_goal_minutes, onboarding_completed_at, diagnostic_completed_at`) succeeded.
  - Afterwards: 0 profile rows have an onboarding or diagnostic timestamp, so nothing from the test persisted.
- **Data unchanged:** 6 auth users, 6 profiles, 2 Year 5 students, 0 sessions. The md5 of `auth.users` (`86a5ffd8…`) and of the profiles' original columns (`b9f5903e…`) are identical to the dump-time values.
- **Scope held:** `public.item_publication_approvals` (migration 9) and `public.writing_attempts` (migration 10) do not exist.

### 17.4 New hosted state

| | Before | After |
|---|---|---|
| Ledger rows / newest version | 39 / `20260823110000` | 47 / `20260923100000` |
| Public tables | 41 | 75 |
| Active programme offerings | 99 | 101 (two AMC) |
| `profiles` columns | no onboarding or curriculum columns | +4 onboarding columns, +2 curriculum columns, year check 1 to 12 |
| `mindmosaic_scoring` UPDATE column grants | 8 | 9 (the long-standing registry mismatch is cleared) |
| Roles | `mindmosaic_scoring` | + `mindmosaic_content_answer_writer` (login, **no password set**) |
| Storage | none | + private bucket `content-assets-private` (empty) |
| Auth users, profiles, sessions | 6, 6, 0 | 6, 6, 0 (unchanged) |

Hosted now matches deployed `main` (`47c11ba8`). Migrations 9 and 10 remain held until `dev` ships.

### 17.5 Not done, and what is next

- **No deploy, no code change, no approval, no gate row.** `publication_gate_settings` does not exist yet (migration 9).
- **Owner smoke test, not done:** on the live site, sign in as a Year 5 student and confirm Year 5 content shows, then complete onboarding. The database side is proven; the running site was not exercised.
- `npm run migrations:status` was **not** run (it needs the project's Node dependencies, and the machine was short of memory). The 17-row SQL check and the CLI ledger listing stand in for it.
- `mindmosaic_content_answer_writer` has no password; set one through your secrets process only when the content-publishing scripts need it.
- The curriculum explorer will now load but be empty until `scripts/curriculum-import.mts` is run.
- **The dump is now a pre-apply restore point.** Restoring it would return hosted to the state before this apply (section 14.5, rehearsed). Keep it until you are satisfied, and take a fresh dump before applying 9 and 10.
- Housekeeping: delete the extracted PostgreSQL client folder `C:\Users\vishw\pgclient` when finished, and remove the temporary worktrees.