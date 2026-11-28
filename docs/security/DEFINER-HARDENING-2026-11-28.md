# SECURITY DEFINER hardening — DEV review, 2026-11-28

Scope: DEV only (`mfglzabnayacssgertat`). **Nothing in this document has been applied to any database.**
Migration `20261128090000_harden_definer_helpers.sql` (+ rollback) is prepared for owner approval.

## 1. Finding (confirmed on DEV, controlled fixtures)

Three SECURITY DEFINER helpers answer about a caller-supplied id as the table owner, and were executable by `anon`:

| Function | Caller-supplied id | Leak |
|---|---|---|
| `has_active_access(p uuid)` | a parent id | whether *any* parent has an active subscription/trial |
| `is_student_profile(target uuid)` | a profile id | whether *any* profile is a student |
| `session_has_attempt(session uuid)` | a session id | whether *any* session has a submitted attempt |

Probe (Supabase JS client, DEV, 3 throwaway fixtures: parent A with a trial subscription, child A linked to A with a
submitted session, unrelated parent B; PostgREST `rpc` as each caller; booleans only):

| Caller → call | Result before fix | Expected after fix |
|---|---|---|
| parent A → `has_active_access(A)` | true | true |
| child A → `has_active_access(A)` (production caller) | true | true |
| **anon** → `has_active_access(A)` | **true** | permission denied |
| **parent B** → `has_active_access(A)` | **true** | false |
| **anon** → `is_student_profile(child A)` | **true** | permission denied |
| **parent B** → `is_student_profile(child A)` | **true** | false |
| **anon** → `session_has_attempt(A's session)` | **true** | permission denied |
| **parent B** → `session_has_attempt(A's session)` | **true** | false |
| child A → `session_has_attempt(own)` | true | true |

Severity: medium. One bit per call and ids are random UUIDs (enumeration needs a known id), but it needs no
authentication and crosses the account boundary. No row data is exposed.

Fixtures (no accounts deleted; inert, `example.com`): tag `sechardmwzvdd7f` — parent A `821ac02c-…`, parent B `4e9b0af4-…`, child A `d2292507-…`.

## 2. Dependency review

| Function | Callers | Effect of hardening |
|---|---|---|
| `has_active_access` | `current_parent_has_access()` (passes `auth.uid()`); `src/features/billing/student-access.ts` (student asks about a linked parent, as the student) | both still satisfied: self, or caller is a linked child. Service role allowed. |
| `is_student_profile` | RLS policy `class_students: teacher adds to own class` (already ANDs `caller_is_teacher()`) | unchanged for teachers; everyone else gets false |
| `session_has_attempt` | `exam_responses` student insert/update policies (already require session ownership) | unchanged for owners; foreign sessions read false, which the policies already deny |

No signature changes. `EXECUTE` revoked from `PUBLIC` and `anon`; kept for `authenticated` (RLS policies evaluate the
helpers as the caller) and `service_role`.

## 3. Tests

* `tests/rls/definer-helper-isolation.test.ts` (new): self / linked child / unrelated caller / service role / anon for each
  helper, plus a check that the submit-lock policy still blocks writes to a submitted session.
* `tests/rls/subscriptions.test.ts`: the four `has_active_access` entitlement tests now call as the owning parent (the old
  tests called as the superuser for arbitrary ids, which is exactly the behaviour being closed).
* `scripts/migrations/registry.ts`: post-apply check that anon has no EXECUTE and authenticated keeps it.
* RLS tests need a local Supabase stack; they run in the `rls` CI job on the PR. Not run locally (Docker daemon off); the `rls` CI job on PR #169 ran them against real Postgres: 41 files, 641 tests pass, including the 12 new ones.

## 4. Apply / rollback (owner-approved, DEV only)

1. Merge the PR to `dev`; CI `rls` must be green.
2. Apply `20261128090000_harden_definer_helpers.sql` to DEV through the approved migration path; run the registry status check.
3. Re-run the probe in section 1 (anon and parent B must now be denied / false), then hosted `D`, billing S1–S4 and the student journey.
4. Rollback: `supabase/migrations/rollbacks/20261128090000_harden_definer_helpers.down.sql` (restores bodies and PUBLIC grants; re-opens the oracle, so owner approval).

## 5. Views (nine flagged)

Static reading of migrations: the non-`security_invoker` views readable by `authenticated` are the six `admin_*`
aggregate views and the three `visible_*` views.

* `admin_platform_totals`, `admin_weekly_activity`, `admin_score_distribution`, `admin_subject_performance`,
  `admin_skill_performance`, `admin_question_stats`: each body is gated by `where public.is_admin()`
  (`20260815100000_admin_views_resolution_aware.sql`); anon revoked. Non-admins read zero rows. **By design**, and
  `is_admin()` is entitlement-based since the multi-role migration. Recommendation: keep; add `security_barrier` and an RLS test per view (low).
* `visible_sittings`, `visible_sitting_questions`, `visible_manual_marks`: `security_barrier`; each disjunct is a complete
  ownership / linked-parent / teacher predicate mirroring the base-table SELECT policies; anon revoked. **By design.** The
  `resolved_*` base views are revoked from every client role.
* Not verifiable from migrations: whether DEV carries an extra or drifted view. Needs a catalog query (section 7).

## 6. SECURITY DEFINER functions (static review)

Latest definition of each of the 49 definer functions in `supabase/migrations`, grants and revokes parsed in order
(multi-function `revoke` statements may be under-counted).

* **Authenticated-executable with an internal relationship check (OK):** `create_exam_session`, `record_exam_attempt`,
  `create_assessment_session`, `get_assessment_session`, `commit_assessment_responses`, `record_manual_mark` and
  `get_manual_review_response` (`is_teacher_of_student`), `link_assessment_session_to_assignment`,
  `request_student_erasure`, `cancel_student_erasure`, `admin_trigger_due_erasures`, `owner_approve_content`,
  `owner_approve_batch` (`is_admin()`), `record_paper_writing_attempt` and `mark_writing_attempt` (`is_parent_of`),
  `record_marked_paper_attempt` (wrapper; inherits both checks through `auth.uid()`), `start/save/submit_writing_attempt`,
  `session_storage_model_for_caller`.
* **Booleans with no argument-based leak:** `authenticated_admin_email` (own email), `admin_mfa_required` (global flag).
* **Service-role only (correct):** `apply_stripe_subscription_event`, `backfill_legacy_terminal_sessions`,
  `session_storage_model_for`, `erase_student`, `process_due_erasures`, `create_exam_session_for`,
  `record_exam_attempt_for`, `grant_admin_role`, `revoke_admin_role`.
* **Still anon-executable by default grant (low; all read `auth.uid()`, so they return false/null for anon):**
  `is_parent_of`, `is_teacher_of_student`, `teaches_class`, `is_member_of_class`, `teaches_assignment`,
  `is_assigned_to`, `is_admin`, `caller_is_teacher`, `current_parent_has_access`, `admin_mfa_satisfied`,
  `has_active_admin_role`; trigger functions `handle_new_user`, `create_parent_trial_subscription` (return `trigger`, not RPC-callable).
  Recommendation (phase 2, separate approval): revoke execute from `public, anon` after confirming no `to anon` policy evaluates them.
* No authenticated-executable function with an id argument and **no** check was found.

## 7. Limits and next steps

* This is a static review plus a live behavioural probe. The Supabase DEV MCP needs owner read-only OAuth, so the live
  catalog (`pg_proc` ACLs, view options, advisors) was **not read**. After approval run:
  `select p.proname, has_function_privilege('anon', p.oid, 'EXECUTE') as anon_x, has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_x from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosecdef order by 1;`
  to confirm the 13 anon / 36 authenticated counts match this review.
* Phase 2 (not in this PR): revoke anon on the RLS helper set; add `security_barrier` to the admin views; add a CI test that
  fails if any public SECURITY DEFINER function is anon-executable outside an allow-list.
