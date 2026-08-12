-- Phase 2 step 2b, part 1: the dedicated least-privilege scoring role
-- (spec v1.2 §9.3.1, §17.1; ADR-006 Amendment A; ADR-003 Amendment B).
--
-- WHAT CHANGED AND WHY. Spec v1.1 §9.3 permitted exactly one runtime reader of
-- item_answer_versions: a SECURITY DEFINER function that scored in PL/pgSQL and
-- returned outcomes rather than rows. Honouring that means writing the scoring
-- rules a second time in SQL, because the TypeScript scorer
-- (src/features/exam-engine/scoring/question-scorers.ts) cannot be retired —
-- the guest path has no database and must keep scoring locally. Twelve
-- answer-key kinds would then exist twice, including the ones with real
-- semantic depth: per-blank accepted-answer lists under en-AU case and
-- whitespace normalisation, numeric tolerance, set-versus-order comparison,
-- record equality with exact key-set matching, and the blank/attempted/manual
-- three-way that blank-sitting-aggregates.test.ts exists to protect.
--
-- A parity test does not make two implementations equal. It reports when they
-- have stopped being equal, after the divergence is written, and only for the
-- cases the bank happens to contain. So spec v1.2 §9.3.1 admits a second path
-- and makes its compensating controls normative. This migration is those
-- controls, expressed as catalogue facts rather than as intentions.
--
-- WHAT THIS ROLE IS FOR, EXACTLY. One module
-- (src/server/scoring/answer-access.ts) connects as this role to read the
-- answer version a session pinned, score it, and persist the derived outcome.
-- Nothing else uses the credential, and the credential is useless for anything
-- else: its whole privilege set is the eight grants below.
--
-- WHY NOT service_role. That key already exists in this repository
-- (src/features/auth/provision-child.ts) and reaching for it here would have
-- been one environment variable's work. It bypasses RLS on every table at once,
-- so a leaked scoring credential would expose the entire database rather than
-- one table's answer keys. This is the same reasoning 20260811090000 used to
-- prefer a definer function over the service-role client, applied to a role
-- instead of a function.
--
-- WHY POLICIES APPEAR ON PREVIOUSLY POLICY-FREE TABLES. RLS applies to every
-- non-owner role that lacks BYPASSRLS, and this role deliberately lacks it. A
-- table with RLS on and no policy is therefore invisible to it. The four
-- policies below are scoped `to mindmosaic_scoring` and to nothing else, so the
-- Phase 1/2a posture is unchanged for learners: anon and authenticated still
-- have no privilege to police and still have no policy naming them. The
-- registry check and tests that previously asserted "no policy at all" on the
-- definer-only tables are tightened rather than relaxed — they now assert no
-- policy reachable by anon, authenticated or PUBLIC, which is the property that
-- was actually meant.

-- ---------------------------------------------------------------------------
-- The role
-- ---------------------------------------------------------------------------
-- NOINHERIT and NOBYPASSRLS are the load-bearing attributes. NOINHERIT means
-- that if this role is ever granted membership in another, it does not acquire
-- that role's privileges implicitly; NOBYPASSRLS means row security applies to
-- it exactly as it applies to a learner.
--
-- No password is set here, deliberately: a migration is committed to the
-- repository and a credential must not be. The role cannot authenticate until a
-- password is set out of band —
-- `alter role mindmosaic_scoring password :'secret'` from a secrets-managed
-- deploy step, or scripts/bootstrap-scoring-role.mts for local and CI.
-- `create role ... login` with no password is not a usable login under
-- scram/md5 authentication, which is the intended state for a fresh apply.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mindmosaic_scoring') then
    create role mindmosaic_scoring
      with login
           nosuperuser
           nocreatedb
           nocreaterole
           noinherit
           nobypassrls
           noreplication;
  else
    /* Idempotent re-apply: assert the attributes rather than assume them, so a
       role hand-created with different flags is corrected rather than trusted. */
    alter role mindmosaic_scoring
      with login nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication;
  end if;
end;
$$;

comment on role mindmosaic_scoring is
  'Spec §9.3.1 dedicated scoring role. Held by src/server/scoring/answer-access.ts and nothing else. Its entire purpose is to read the answer version a session pinned and persist the derived outcome; it holds no other privilege on any object. NOT service_role: no RLS bypass, no broad access. Credential set out of band, never in a migration.';

-- ---------------------------------------------------------------------------
-- Exactly the privileges it needs
-- ---------------------------------------------------------------------------
grant usage on schema public to mindmosaic_scoring;

-- Reads. Five tables, each with a stated reason; any sixth would need this
-- comment to grow, which is the point of listing them one per statement.
--
--   item_answer_versions  — the answer key, grading rules and rubric. THE
--                           reason this role exists.
--   item_versions         — question_type and marks_available. question-scorers
--                           dispatches on the first and awards the second, so
--                           scoring is impossible without them.
--   assessment_session_items — which item_version_id this sitting pinned. The
--                           join that makes §14.2 determinism structural: the
--                           answer is reached through the session's own ledger,
--                           so a later revision is a row this session does not
--                           point at.
--   session_responses     — the learner's submitted answers.
--   assessment_sessions   — status, ownership and scoring_algorithm_version, so
--                           the module can refuse a terminal session, refuse a
--                           legacy_unversioned one, and refuse an algorithm
--                           version it does not implement.
grant select on public.item_answer_versions     to mindmosaic_scoring;
grant select on public.item_versions            to mindmosaic_scoring;
grant select on public.assessment_session_items to mindmosaic_scoring;
grant select on public.session_responses        to mindmosaic_scoring;
grant select on public.assessment_sessions      to mindmosaic_scoring;

-- Writes. Column-level, not table-level, so the grant itself states which
-- columns a score may touch. The role cannot rewrite a learner's
-- response_value, cannot move client_sequence, and cannot alter the ledger.
grant update (score_status, is_correct, awarded_marks, available_marks, scored_at)
  on public.session_responses to mindmosaic_scoring;

grant insert on public.assessment_results to mindmosaic_scoring;

-- The lifecycle flip that ends a sitting. It belongs to this role because
-- 20260812100000's terminal-response lock requires responses to be written
-- while the session is still open: scoring stamps the outcomes and flips the
-- status last, in one transaction. Splitting the two across roles would mean
-- two transactions and a window in which a session is scored but not submitted.
grant update (status, submitted_at, version)
  on public.assessment_sessions to mindmosaic_scoring;

-- ---------------------------------------------------------------------------
-- The policies that make those grants reachable
-- ---------------------------------------------------------------------------
-- Each is `to mindmosaic_scoring` and each is `using (true)`, which deserves
-- justification rather than a shrug: row-level narrowing is not the control
-- here. The role scores whichever session was submitted, so at the row level
-- its legitimate scope genuinely is "any session". What confines it is the
-- table list above, the column list above, and the module that holds the
-- credential. Writing a bogus row predicate would suggest a restriction that
-- does not exist.
create policy "item_answer_versions: scoring role reads" on public.item_answer_versions
  for select to mindmosaic_scoring using (true);

create policy "item_versions: scoring role reads" on public.item_versions
  for select to mindmosaic_scoring using (true);

create policy "assessment_session_items: scoring role reads" on public.assessment_session_items
  for select to mindmosaic_scoring using (true);

create policy "session_responses: scoring role reads" on public.session_responses
  for select to mindmosaic_scoring using (true);

-- assessment_sessions already carries three `to authenticated` SELECT policies
-- (20260812100000), and none of them names this role — so the SELECT grant
-- above buys nothing without this. That is the failure mode this whole block
-- exists to prevent: a grant with no matching policy is not a narrower
-- permission, it is silently zero rows, and a scoring module that reads no
-- session looks identical to one reading a session that does not exist.
create policy "assessment_sessions: scoring role reads" on public.assessment_sessions
  for select to mindmosaic_scoring using (true);

-- The write policies. USING selects which rows may be updated; WITH CHECK
-- constrains what they may become. The manual-review rule of §14.3 is already a
-- table constraint (session_responses_manual_review_has_no_correctness), so it
-- is not restated here — one enforcement point, in the schema.
create policy "session_responses: scoring role scores" on public.session_responses
  for update to mindmosaic_scoring using (true) with check (true);

create policy "assessment_results: scoring role records" on public.assessment_results
  for insert to mindmosaic_scoring with check (true);

create policy "assessment_sessions: scoring role submits" on public.assessment_sessions
  for update to mindmosaic_scoring using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Learner posture, re-asserted rather than inherited
-- ---------------------------------------------------------------------------
-- These revokes are no-ops against the current catalogue and are written anyway.
-- §9.3.1 requires that anon and authenticated retain zero privileges on the
-- answer table "unchanged", and a migration that introduces a new reader of
-- that table is exactly where a reviewer should be able to see the old readers
-- being denied in the same breath.
revoke all on public.item_answer_versions from anon, authenticated;
revoke all (answer_key, grading_rules, rubric, private_explanation)
  on public.item_answer_versions from anon, authenticated;

-- 20260812090000's comment said the only sanctioned reader would be a SECURITY
-- DEFINER scoring function. That is no longer true, and a stale comment in the
-- catalogue is worse than none — it is the first thing a future reader will
-- trust.
comment on table public.item_answer_versions is
  'Private answers (spec §9.3). No anon/authenticated privileges and no policy naming them, by design. Exactly one runtime reader: the mindmosaic_scoring role (spec §9.3.1, ADR-006 Amendment A), held by src/server/scoring/answer-access.ts. The raw answer must never leave that module — not to a caller, not into a DTO, not into a log. No general answer-read RPC or view may ever be granted to authenticated.';
