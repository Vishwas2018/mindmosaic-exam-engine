-- Phase 2 step 4: the content-identity classifier and the two predicates the
-- backfill decides with (spec §12.7 step 4, §5.3, §14.3; ADR-005 §4).
--
-- Separated from the backfill itself (20260812150000) because it answers a
-- different question. The backfill asks "which sittings move"; this asks "what
-- can be PROVED about the content each one served". The second question is the
-- one §12.7 step 4 is about, and it has an answer worth stating on its own: for
-- every legacy sitting in this database, nothing can be proved, and the honest
-- label is legacy_unversioned.
--
-- Nothing here writes anything. All three functions are pure reads.

-- ---------------------------------------------------------------------------
-- The version pins a backfilled sitting truthfully has
-- ---------------------------------------------------------------------------
-- assessment_sessions requires all seven §12.3 version columns NOT NULL, and a
-- legacy sitting has none of them. The honest value is a marker that says so.
-- They are deliberately not plausible-looking version strings: a reader who sees
-- 'legacy:unpinned' cannot mistake it for a version that was consulted.
--
-- scoring_algorithm_version is 'legacy:exam-engine' and NOT 'question-scorers.v1'
-- on purpose. src/server/scoring/answer-access.ts refuses an algorithm version
-- it does not implement, so this is a SECOND independent reason it will refuse a
-- backfilled sitting, the first being content_identity <> 'version_pinned'. Two
-- unrelated guards against recomputation, either of which is sufficient.
create or replace function public.legacy_backfill_pin(p_kind text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_kind
    when 'scoring' then 'legacy:exam-engine'
    when 'content_build' then 'legacy:unknown'
    else 'legacy:unpinned'
  end;
$$;

-- ---------------------------------------------------------------------------
-- Is this legacy result blob mappable onto the typed result columns?
-- ---------------------------------------------------------------------------
-- Every field assessment_results requires NOT NULL, checked before the insert
-- rather than discovered by a failing cast partway through.
--
-- The alternative was to let a malformed blob abort the whole run. That is the
-- safe direction for correctness and the wrong one for operations: one
-- unparseable historical row would block every other sitting from ever being
-- backfilled, and the pressure would then be to "just fix" the blob — editing
-- the historical fact, which §5.3 calls immutable evidence.
--
-- So a blob that cannot be mapped is SKIPPED, counted, and reported. It is never
-- partially mapped and never defaulted to zero: a result row with an invented
-- zero in it is worse than no result row, because it looks like a score. The
-- session still backfills (its responses and its lifecycle are not in doubt);
-- it simply has no assessment_results row, and scripts/cutover-verify.mts fails
-- on exactly that condition — a legacy attempt with no target result — so the
-- skip surfaces as a blocking discrepancy with a reason rather than as silence.
create or replace function public.legacy_result_is_mappable(p_result jsonb)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select p_result is not null
     and jsonb_typeof(p_result) = 'object'
     and p_result ?& array[
       'totalQuestions', 'attemptedQuestions', 'autoMarkedQuestions',
       'manualReviewQuestions', 'correctCount', 'incorrectCount',
       'unansweredCount', 'objectiveMarksEarned', 'objectiveMarksAvailable',
       'objectivePercentage', 'pendingManualMarks', 'timeTakenSeconds',
       'startedAt', 'submittedAt', 'submissionReason'
     ]
     /* submission_reason is a closed set on the target column; a blob carrying
        anything else would fail the check constraint mid-insert. */
     and p_result ->> 'submissionReason' in ('user_submitted', 'timer_expired');
$$;

-- ---------------------------------------------------------------------------
-- The content-identity classifier (§12.7 step 4, ADR-005 §4)
-- ---------------------------------------------------------------------------
-- Returns the item_version_id each of a legacy session's question ids binds to,
-- or nothing at all when the binding cannot be PROVED.
--
-- What counts as proof. Not "this question id still matches an items.item_code"
-- — that proves the code exists today, not that the learner saw that revision,
-- and §12.7 step 4 asks for a binding to "an exact imported item
-- revision/content hash". Proof means the legacy row itself carries the content
-- hash of what was served. The one recognised carrier is
-- `exam_sessions.config -> 'contentHashes'`, an object mapping question id to
-- the sha256 that was rendered.
--
-- No legacy row in this database carries it, so today this returns zero rows for
-- every session and every backfilled sitting is legacy_unversioned. That is the
-- expected answer, and the reconciliation report states the number rather than
-- assuming it. The function is written to LOOK for the evidence rather than to
-- hardcode its absence (ADR-005 §4's closing sentence), so a legacy row that
-- does carry hashes binds instead of being labelled — and
-- tests/rls/backfill-legacy-sessions.test.ts seeds exactly such a row to prove
-- the bound branch is reachable rather than dead code.
--
-- The binding is deliberately strict in three ways. The hash must match an
-- item_versions row exactly; that row's item must carry the item_code the
-- legacy id names, so a hash collision across items cannot bind the wrong
-- question; and EVERY served question must bind or the session binds none of
-- them. A half-pinned ledger would be worse than no ledger: §12.4 calls
-- assessment_session_items "the authoritative exposure ledger", and a ledger
-- that is authoritative for some rows and invented for others is not one.
create or replace function public.classify_legacy_session_content(p_legacy_session_id uuid)
returns table (ordinal integer, question_id text, item_id uuid, item_version_id uuid, content_hash text)
language sql
stable
set search_path = public, pg_temp
as $$
  with served as (
    select q.ordinality::integer as ordinal, q.question_id,
           es.config -> 'contentHashes' ->> q.question_id as claimed_hash
    from public.exam_sessions es
    cross join lateral unnest(es.selected_question_ids) with ordinality as q(question_id, ordinality)
    where es.id = p_legacy_session_id
  ),
  bound as (
    select s.ordinal, s.question_id, iv.item_id, iv.id as item_version_id, iv.content_hash
    from served s
    join public.item_versions iv on iv.content_hash = s.claimed_hash
    join public.items i on i.id = iv.item_id and i.item_code = s.question_id
  )
  select b.ordinal, b.question_id, b.item_id, b.item_version_id, b.content_hash
  from bound b
  /* All or nothing: if any served question failed to bind, return no rows. */
  where (select count(*) from bound) = (select count(*) from served)
    and (select count(*) from served) > 0;
$$;


-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- `create function` grants EXECUTE to PUBLIC by default, and this project's
-- local stack adds per-role grants via ALTER DEFAULT PRIVILEGES, so every
-- function is named individually -- one omitted from this list is one `anon`
-- can call. classify_legacy_session_content in particular reads exam_sessions
-- and item_versions, and a learner holds no privilege on the latter at all.
revoke all on function public.classify_legacy_session_content(uuid) from public, anon, authenticated;
revoke all on function public.legacy_result_is_mappable(jsonb) from public, anon, authenticated;
revoke all on function public.legacy_backfill_pin(text) from public, anon, authenticated;

comment on function public.classify_legacy_session_content(uuid) is
  'Spec §12.7 step 4 / ADR-005 §4. Binds a legacy session''s question ids to exact item_versions ONLY on recorded evidence — config.contentHashes — and returns no rows unless every served question binds. Absence of evidence yields legacy_unversioned, never a fabricated ledger.';
