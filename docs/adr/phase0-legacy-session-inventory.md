# Phase 0 legacy-session dependency inventory

**Spec:** §12.7 step 1 ("Inventory and freeze the contract") · **Phase:** 0 ·
**Status:** complete as of commit `d54a7b8` (branch
`fix/close-exam-write-trust-boundary`), 2026-08-12

This is **not** an ADR. It is the frozen input contract that
[ADR-005](005-legacy-exam-table-cutover.md) and Phase 2 are written against.
Spec §12.7 requires every reader and writer of `exam_sessions`,
`exam_responses`, `exam_attempts` and `essay_marks` to be documented —
route handlers, reporting, assignment linkage, marking, RLS policies, triggers,
constraints, and the two write RPCs — before any cutover work begins.

Method: the known-reader list supplied with the Phase 0 brief, verified and
extended by a repository-wide grep for the four table names plus
`create_exam_session` / `record_exam_attempt`, then cross-checked against
`supabase/migrations/*.sql` and `scripts/migrations/registry.ts`.

**Anything not listed here is out of contract.** A Phase 2 change that breaks a
consumer absent from this document means this document was wrong, and it must be
corrected before the change lands.

---

## 1. Schema summary

| Table | Introduced | Shape relevant to cutover |
| --- | --- | --- |
| `public.exam_sessions` | `20260718090000_phase0_roles_and_exam_schema.sql` | `id`, `student_id`, `config` jsonb (an `ExamSelectionConfig` plus `bankId`), `seed`, `selected_question_ids` **text[] of bare question IDs — not version-pinned**, `created_at`, `expires_at`. Indexed on `student_id`. |
| `public.exam_attempts` | `20260718090000` | `id`, `session_id` → `exam_sessions(id) on delete cascade`, `student_id`, `submitted_at`, `result` jsonb (whole server-computed `ExamResult`). Indexed on `student_id`, `session_id`. **Unique** on `session_id` (`exam_attempts_session_id_key`, `20260722100000`). |
| `public.exam_responses` | `20260719100000_exam_responses.sql` | `session_id` **primary key** → `exam_sessions(id) on delete cascade`, `student_id`, `responses` jsonb, `current_question_index`, `flagged_question_ids`, `updated_at`. One row per session; upserted. |
| `public.essay_marks` | `20260719110000_essay_marking.sql` | `attempt_id` → `exam_attempts(id) on delete cascade`, `question_id`, `marked_by`, `awarded_marks`, `max_marks`, `feedback`, `marked_at`. Unique on `(attempt_id, question_id)`; check `awarded_marks <= max_marks`. Indexed on `attempt_id`. |

Also referencing these tables: `public.assignments.attempt_id → exam_attempts(id)
on delete set null` (`20260718090000`).

**Cutover-critical property.** `selected_question_ids` stores bare question IDs
resolved at scoring time against whichever compiled bank the running deployment
has (`src/app/api/exam/session/[id]/submit/route.ts:99-107`). No revision, no
content hash. Under spec §12.7 step 4 every legacy session whose IDs cannot be
bound to an exact imported item revision must be classified
`legacy_unversioned`. On current evidence that is **all** of them.

---

## 2. Write paths

There are exactly three application write paths. Two are SECURITY DEFINER RPCs;
one is a direct upsert.

| # | Writer | Target | Mechanism | Notes |
| --- | --- | --- | --- | --- |
| W1 | `POST /api/exam/session` — `src/app/api/exam/session/route.ts:158` | `exam_sessions` | `rpc("create_exam_session", { p_config, p_seed, p_selected_question_ids, p_expires_at })` | `student_id` comes from `auth.uid()` inside the function. Route pre-checks `profiles.role === "student"` for a clear 403; the function re-checks independently (`MM002`). `authenticated` holds **no INSERT** on the table. |
| W2 | `POST /api/exam/session/[id]/submit` — `src/app/api/exam/session/[id]/submit/route.ts:139` | `exam_attempts` | `rpc("record_exam_attempt", { p_session_id, p_responses, p_result })` | `result` is produced only by `buildExamResult()` server-side. Function re-derives ownership and expiry (`MM003`/`MM004`). Unique-violation `23505` → idempotent 409. |
| W3 | `POST /api/exam/session/[id]/responses` — `src/app/api/exam/session/[id]/responses/route.ts:80` | `exam_responses` | **direct** `.upsert(..., { onConflict: "session_id" })` through the caller's JWT | The one table a learner still writes directly. Guarded by RLS policies that include `not session_has_attempt(session_id)`. Route also returns 409 `already_submitted` when an attempt exists. |
| W4 | `POST /api/teacher/marking` — `src/app/api/teacher/marking/route.ts:88` | `essay_marks` | **direct** `.upsert(..., { onConflict: "attempt_id,question_id" })` | Runs as the teacher; `max_marks` is read back from the attempt's own server-computed `result`, never from the client. |

There is no other writer. No trigger writes to any of the four tables; the only
trigger in the schema is `handle_new_user` on `auth.users` → `profiles`.

---

## 3. Read paths, grouped by role

### 3.1 Route handlers (`src/app/api/`)

| File | Reads | Purpose |
| --- | --- | --- |
| `api/exam/session/route.ts` | — (writes via W1; reads `profiles`) | Session creation. |
| `api/exam/session/active/route.ts:42,56,85` | `exam_sessions`, `exam_attempts`, `exam_responses` | Resume: most recent unexpired session, reject if an attempt exists, then load the autosave row. |
| `api/exam/session/[id]/responses/route.ts:54,71` | `exam_sessions`, `exam_attempts` | Ownership + expiry + already-submitted pre-checks before W3. |
| `api/exam/session/[id]/submit/route.ts:67,81` | `exam_sessions`, `exam_attempts` | Ownership/expiry, submitted pre-check, and the stored `config`/`seed`/`selected_question_ids` used to recompute the paper before W2. |
| `api/teacher/marking/route.ts:69` | `exam_attempts` | Reads `result` to bound `awarded_marks` before W4. |

### 3.2 Results and history (learner-facing reporting)

| File | Reads | Notes |
| --- | --- | --- |
| `src/app/results/history-fetch.ts:72,111` | `exam_attempts` join `exam_sessions(config)` | Two fetchers: full history, and history excluding the just-submitted `session_id`. |
| `src/app/results/ResultsHistoryPanel.tsx:15` | consumes the above | Takes `exam_sessions.id` as a prop to exclude the current attempt. |
| `src/features/exam-engine/components/ActiveSessionBanner.tsx` | consumes `/api/exam/session/active` | Resume prompt; dismissal is client-side only in v1. |
| `src/features/exam-engine/state/resume.ts:12,15` | shape only | Types the resume payload: `exam_sessions.created_at` as the authoritative start instant, plus the `exam_responses` row. |
| `src/features/exam-engine/scoring/server-scoring-contract.ts:143` | shape only | Zod contracts for the session/submit/autosave DTOs, including `exam_sessions.created_at`. |
| `src/features/exam-engine/scoring/server-authoritative-scoring-service.ts:18` | shape only | Documents that the `exam_attempts` row is the trustworthy one. |

### 3.3 Parent dashboard

| File | Reads | Notes |
| --- | --- | --- |
| `src/features/parent-dashboard/queries.ts:98-115` | `exam_attempts` join `exam_sessions(config)` | Via the `parent reads linked children` policies; no service-role client. |
| `src/features/parent-dashboard/summary.ts:49-56` | consumes the above | Validates `result` jsonb rather than assuming its shape. |

### 3.4 Student surfaces

| File | Reads | Notes |
| --- | --- | --- |
| `src/features/student/data.ts:22` | `exam_attempts` join `exam_sessions(config)` | Both RLS-scoped to the student. |
| `src/features/student/attempt-summary.ts` | already-fetched `exam_attempts` rows | Pure reducer. |
| `src/features/student/engagement/fetch-engagement.ts:31` | `exam_attempts` | Streaks/achievements source. |
| `src/features/student/engagement/attempts.ts`, `achievements.ts`, `components/EngagementView.tsx` | derived | All downstream of the above. |
| `src/features/student/components/RecentAttemptsCard.tsx` | derived | Review links to the results route. |
| `src/features/student/assignments/fetch-student-assignments.ts:70` | `exam_attempts` | Assignment completion state. |
| `src/features/student/assignments/types.ts:11` | shape only | Assignment config mirrors `exam_sessions.config`. |

### 3.5 Teacher: marking and class data

| File | Reads | Notes |
| --- | --- | --- |
| `src/features/teacher/marking-data.ts:48,94` | `exam_attempts`, `essay_marks` | RLS on both is the enforcement mechanism; the module is otherwise pure. |
| `src/features/teacher/marking-queue.ts` | derived | Builds the queue from `exam_attempts.result` + one `essay_marks` row per (attempt, question), because `result` is immutable. |
| `src/app/teacher/marking/[attemptId]/[questionId]/page.tsx:61` | `exam_attempts` | Single-question marking screen. |
| `src/features/teacher/data.ts:133` | `exam_attempts` | Class/student listing. |
| `src/features/teacher/analytics.ts:5` | `exam_attempts.result` | Class-level aggregates. |
| `src/features/teacher/assignment-contract.ts:13` | shape only | Assignment config is stored in the same shape as `exam_sessions.config`. |

### 3.6 Admin analytics — indirect only

`src/server/admin-analytics.ts` **never queries the four tables directly**
(stated explicitly at `:28-29`). It reads six admin views defined in
`20260718120000_admin_aggregate_views.sql`, each of which is built over
`public.exam_attempts` (and `exam_sessions` for the platform totals) behind an
`is_admin()` guard:

`admin_platform_totals` · `admin_weekly_activity` · `admin_score_distribution` ·
`admin_subject_performance` · `admin_skill_performance` · `admin_question_stats`

These views are a Phase 2 cutover dependency even though no application file
names the tables: **the view definitions must be re-pointed** at the target
model, or they will silently report only legacy sittings.

### 3.7 Non-consumers worth recording

- `src/app/exam/error.tsx:10` — comment only, no query.
- `src/app/api/teacher/assignments/route.ts` — touches `profiles`, `classes`,
  `class_students`, `assignments`, `assignment_students`. It does **not** read
  the four tables, but `assignments.attempt_id → exam_attempts(id)` makes it a
  referential dependency.
- The guest flow (`/api/exam/guest-bank`, client-side practice) touches none of
  these tables and has no server-side session at all. Spec §21 Phase 2 requires
  it be preserved unchanged.

---

## 4. RLS policies

RLS is enabled on all four tables; `anon` privileges were revoked at creation.

### `exam_sessions` (`20260718090000`, amended `20260724090000`, `20260811091000`, `20260811093000`)

| Policy | Command | Status |
| --- | --- | --- |
| `exam_sessions: student reads own` | select | live |
| `exam_sessions: student creates own` | insert | **dead** — rewritten by `20260724090000` to add a role gate, then made unreachable by `20260811091000`, which revoked `INSERT` from `authenticated` entirely. Retained but inert; the role gate now lives in `create_exam_session` (`MM002`). |
| `exam_sessions: parent reads linked children` | select | live, via `is_parent_of` |
| `exam_sessions: teacher reads own class students` | select | live, via `is_teacher_of_student` |

No update or delete policy — a session is immutable once created by design.
`20260811093000` revoked `truncate, update, delete` so the privilege matches that
intent.

### `exam_attempts` (`20260718090000`, amended `20260811091000`, `20260811093000`)

| Policy | Command | Status |
| --- | --- | --- |
| `exam_attempts: student reads own` | select | live |
| `exam_attempts: student submits own` | insert | **dead** — `20260811091000` revoked `INSERT` from `authenticated`; the write is now `record_exam_attempt`. The old policy constrained ownership only, leaving `result` unconstrained. |
| `exam_attempts: parent reads linked children` | select | live |
| `exam_attempts: teacher reads own class students` | select | live |

No update/delete policy; `truncate, update, delete` revoked by `20260811093000`.

### `exam_responses` (`20260719100000`, amended `20260811092000`, `20260811093000`)

| Policy | Command | Status |
| --- | --- | --- |
| `exam_responses: student reads own` | select | live |
| `exam_responses: student inserts own` | insert | **live and load-bearing** — recreated by `20260811092000` with `student_id = auth.uid()` AND session ownership AND `not session_has_attempt(session_id)` |
| `exam_responses: student updates own` | update | **live and load-bearing** — same guard in both `USING` and `WITH CHECK` |

`INSERT` and `UPDATE` are deliberately retained for `authenticated` (this is W3's
upsert). `truncate, delete` revoked by `20260811093000` — `TRUNCATE` was a live
hole here because RLS does not apply to it and no incoming foreign key existed.

### `essay_marks` (`20260719110000`)

| Policy | Command |
| --- | --- |
| `essay_marks: teacher reads own class students' marks` | select |
| `essay_marks: teacher marks own class students` | insert |
| `essay_marks: teacher updates own class students' marks` | update |

All three via `is_teacher_of_student`. No delete policy. **Not** covered by
`20260811093000`, so `authenticated` retains `TRUNCATE` on this table — see §7.

### Helper functions these policies depend on

`is_parent_of`, `is_teacher_of_student`, `teaches_class`, `is_member_of_class`,
`teaches_assignment`, `is_assigned_to` (all `20260718090000`, all SECURITY
DEFINER); `session_has_attempt` (`20260811092000`); `is_admin`
(`20260718120000`, for the views); `caller_is_teacher`, `is_student_profile`,
and redefined `teaches_class` / `is_teacher_of_student` (`20260811094000`).

They are SECURITY DEFINER for a reason that Phase 2 must preserve: a policy
sub-querying another table directly would have that subquery evaluated under the
caller's own RLS, making the guard depend on the caller's read policies rather
than on the fact being asked about.

---

## 5. Write RPCs

| Function | Migration | Contract |
| --- | --- | --- |
| `public.create_exam_session(jsonb, text, text[], timestamptz)` | `20260811090000` | SECURITY DEFINER, fixed `search_path`. Takes `student_id` from `auth.uid()`. Re-checks `profiles.role = 'student'` and raises `MM002` otherwise. Returns the new session id. `revoke all` then `grant execute to authenticated`. |
| `public.record_exam_attempt(uuid, jsonb, jsonb)` | `20260811090000` | SECURITY DEFINER, fixed `search_path`. Takes `student_id` from `auth.uid()`; re-derives session ownership (`MM003`) and expiry (`MM004`). Deliberately does **not** catch `23505` so the unique-violation surfaces to the route as an idempotent 409. |
| `public.session_has_attempt(uuid)` | `20260811092000` | SECURITY DEFINER predicate used inside the `exam_responses` policies. Answers "does an attempt exist for this session" independently of the caller's read policies. |

---

## 6. Hardening migrations (the `20260811*` set)

All five are verified by `scripts/migrations/registry.ts` (`npm run
migrations:status`), and `src/tests/unit/migration-registry.test.ts` covers the
registry itself.

| Migration | What it did | Why it matters to Phase 2 |
| --- | --- | --- |
| `20260811090000_exam_write_rpcs` | Added `create_exam_session` and `record_exam_attempt`. | The target model needs *version-pinned replacement RPCs* with the same guarantees; these are the reference implementation. |
| `20260811091000_exam_writes_revoke_direct_insert` | Revoked `INSERT` on `exam_sessions` and `exam_attempts` from `authenticated`. | Closes the hole where a policy could constrain *who* a row belonged to but not *what* `result` or `selected_question_ids` contained. Spec §12.7 step 9 revokes the RPCs themselves only after no active legacy session remains. |
| `20260811092000_exam_responses_locked_after_submit` | Added `session_has_attempt()`; recreated both `exam_responses` write policies to refuse writes once an attempt exists. | The submitted-state guarantee ADR-006 must reproduce in the normalized response model. Guards INSERT as well as UPDATE, because the autosave path is an upsert. |
| `20260811093000_exam_tables_revoke_residual_writes` | Revoked `truncate, update, delete` on `exam_sessions`/`exam_attempts` and `truncate, delete` on `exam_responses`. | Establishes "privilege, not policy, is the boundary". Its own SCOPE note records the residual issue in §7. |
| `20260811094000_classes_require_teacher_role` | Added `caller_is_teacher()`; class/roster creation now requires the teacher role. | Adjacent, not one of the four tables, but it is the authorization precedent ADR-013 builds on. |

Earlier, still-relevant: `20260722100000` (unique `exam_attempts.session_id`) and
`20260724090000` (the now-superseded session role gate, whose registry check was
rewritten to accept the gate living in either the policy or the function).

---

## 7. Open issue carried into Phase 2

`20260811093000` revoked `TRUNCATE` on the three exam tables only. Its own SCOPE
note records that `authenticated` still holds `TRUNCATE` on the remaining public
tables — **including `essay_marks`**, which is in this inventory's scope — and
that RLS cannot cover `TRUNCATE` at all, because there is no per-row filtering
to apply. The grant is the only control.

This is deliberately out of Phase 0's contracts-only scope (no migrations). It is
recorded here so ADR-005 inherits it rather than rediscovering it: a cutover that
adds target tables without revoking `TRUNCATE` on them would carry the same
defect forward into the new model.

---

## 8. Test coverage of the current contract

Phase 2 must keep these green, or change them deliberately and say why.

**Unit** — `src/tests/unit/`: `exam-session-create-route.test.ts`,
`exam-session-active-route.test.ts`, `exam-responses-route.test.ts`,
`exam-submit-route.test.ts`, `teacher-marking-route.test.ts`,
`teacher-marking-queue.test.ts`, `assignment-shape-seam.test.ts`,
`blank-sitting-aggregates.test.ts`, `migration-registry.test.ts`.

**RLS** (`npm run test:rls`, real local Postgres) — `tests/rls/`:
`exam-attempts.test.ts` (includes the MM-AUTH-01 role cases),
`exam-responses.test.ts`, `essay-marks.test.ts`, `classes.test.ts`,
`fixtures.ts`.

**E2E** — `e2e/auth/student-exam-session.spec.ts`, with `e2e/fixtures/seed.ts`
and `e2e/fixtures/cleanup.ts` creating and removing rows in these tables
directly. The cleanup script is a fourth writer in the *test* environment and
must be updated alongside any cutover.

---

## 9. Phase 2 step-1 reconfirmation (2026-08-12)

Spec §12.7 step 1 is an input contract, so Phase 2 re-ran it rather than
inheriting it. The same method as §0: a repository-wide grep for the four table
names plus `create_exam_session` / `record_exam_attempt` across `*.ts`, `*.tsx`,
`*.mts` and `*.sql`, cross-checked against `supabase/migrations/` and
`scripts/migrations/registry.ts`.

**Result: the inventory still holds, unchanged.** Every hit outside
`.claude/worktrees/` (a stale worktree copy, not the working tree) appears in
§2, §3 or §8 above. No reader or writer has been added since commit `d54a7b8`,
and the two commits since — `68bed16` and `88e0a79`, the Phase 1 content
projection — touch none of the four tables.

Both cutover-critical details re-verified against the live schema:

- The **six admin views** are still defined only in
  `20260718120000_admin_aggregate_views.sql` and still read `public.exam_attempts`
  (plus `public.exam_sessions` for platform totals). No application file names the
  tables, which is why ADR-005 §7 moves them as an explicit workflow step rather
  than trusting a grep.
- The **two dead policies** are gone, not merely inert: `20260811091000` drops
  both `"exam_sessions: student creates own"` and
  `"exam_attempts: student submits own"` with `drop policy if exists`. §4 above
  describes them as "retained but inert", which was true of the state
  `20260724090000` left; after `20260811091000` they no longer exist. The role
  gate lives in `create_exam_session` (`MM002`), as §4 already records.
- The residual `TRUNCATE` grant on `essay_marks` (§7) is still present, and the
  live grant list shows it is not alone: `authenticated` holds
  `select, insert, update, delete, truncate` on that table. The three policies in
  §4 cover select/insert/update; `DELETE` is unreachable only because no delete
  policy exists, and `TRUNCATE` is unreachable by nothing at all. Both are closed
  by ADR-005 §8's step-9 migration, which revokes `truncate, delete` — the same
  pairing `20260811093000` applied to `exam_responses`.

Verified against the running local stack (`pg_policy`,
`information_schema.role_table_grants`), not read off the migration files: a
migration that says `drop policy if exists` proves an intent, and the catalogue
proves the state.
