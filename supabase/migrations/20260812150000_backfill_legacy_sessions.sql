-- Phase 2 step 3: the idempotent terminal backfill (spec §12.7 step 3, §5.3,
-- §19.1; ADR-005 §3).
--
-- The classifier and its predicates are 20260812140000; this migration is only
-- the copy. It decides which sittings move and moves them; what may be claimed
-- about their content is not its question.
--
-- THIS MIGRATION MOVES NO DATA. It creates a function. The data movement is an
-- explicit operational step (`npm run cutover:backfill`), for two reasons that
-- both matter: a migration runs exactly once, so a backfill written as migration
-- body could never be re-run, and §12.7 step 3 requires the backfill to BE
-- re-runnable; and a fresh CI apply has no legacy rows at all, so a data
-- migration there would be a no-op that proves nothing while looking like it
-- passed.
--
-- WHAT IS READ-ONLY AND WHAT IS WRITTEN. Nothing here writes exam_sessions,
-- exam_attempts, exam_responses or essay_marks. Not an UPDATE, not a DELETE, not
-- a status column, not a "backfilled_at" marker -- the legacy tables are read
-- and nothing else, so the legacy model remains exactly as authoritative after a
-- backfill as before one, and a botched run is recoverable by deleting target
-- rows. The idempotency key is on the TARGET side (legacy_session_id,
-- legacy_attempt_id, legacy_essay_mark_id, all unique), which is what lets the
-- source stay untouched. The migration registry asserts the absence of any
-- legacy write against this function's own body.
--
-- TERMINAL ONLY. A session is backfilled when it has an exam_attempts row, or
-- when it is already past expires_at. An active sitting -- no attempt, not yet
-- expired -- is never copied. ADR-005 §1 makes "a session never changes storage
-- model" the invariant this whole phase protects, and the selection predicate
-- below is the first line of that defence rather than something the RPCs are
-- trusted to have handled.
--
-- NOTHING IS RE-SCORED. exam_attempts.result is the historical fact: the score
-- the learner was actually shown. It is copied into assessment_results verbatim
-- on legacy_result, and its totals are mapped onto the typed columns. No scorer
-- runs. Re-deriving a score from today's bank would produce a number for content
-- the learner may never have seen, which is precisely the drift this phase
-- exists to end (ADR-005 "Alternatives considered": recompute -- rejected as
-- fabrication).
--
-- ONE HONEST DIFFERENCE, RECORDED HERE BECAUSE THE VERIFIER MUST KNOW IT. The
-- legacy result stores `awardedMarks: 0` for a manual-review question, because
-- buildExamResult coalesces a null earnedMarks to zero. The target model stores
-- NULL, enforced by session_responses_manual_review_has_no_correctness, because
-- §14.3 forbids fabricated correctness on an unmarked item. So a pending essay
-- reads as 0 in the legacy blob and NULL in the target row. That is a deliberate
-- correction, not a mismatch, and scripts/cutover-verify.mts reports it as an
-- explained difference. The legacy blob keeps its own 0 untouched.

-- ---------------------------------------------------------------------------
-- The backfill (§12.7 step 3)
-- ---------------------------------------------------------------------------
-- Idempotent by construction: every insert conflicts against a unique legacy
-- source id and does nothing. Re-runnable is not a claim made here — it is
-- asserted by scripts/cutover-verify.mts, which runs this twice and fails if the
-- second pass changes any count (spec §22, "Backfill twice idempotently").
--
-- ORDERING IS LOAD-BEARING. Responses are written while the session is still
-- 'created', and the status is flipped last. 20260812100000's terminal-response
-- lock refuses any write to a submitted session's responses for EVERY role
-- including the owner, and it has no exemption by design — an ordering is a hole
-- that does not exist, where an exemption flag is a hole that has to be trusted.
-- On a second run the session is already terminal, and every step below is
-- scoped to sessions still in 'created', so nothing is attempted and the lock is
-- never even approached.
create or replace function public.backfill_legacy_terminal_sessions()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_sessions_before  bigint;
  v_sessions         bigint;
  v_responses        bigint;
  v_results          bigint;
  v_marks            bigint;
  v_items            bigint;
  v_pinned           bigint;
  v_unversioned      bigint;
  v_submitted        bigint;
  v_unmappable       bigint;
  v_abandoned        bigint;
begin
  select count(*) into v_sessions_before
  from public.assessment_sessions where legacy_session_id is not null;

  -- 1. Sessions. Inserted as 'created' so their responses can still be written;
  --    the lifecycle flip is step 5. Timestamps are carried across rather than
  --    defaulted, because the reconciliation compares them.
  insert into public.assessment_sessions (
    student_id, assessment_profile_version, framework_version, blueprint_version,
    taxonomy_version, engine_algorithm_version, scoring_algorithm_version,
    content_build_version, delivery_mode, seed, config, status, content_identity,
    legacy_session_id, created_at, started_at, expires_at
  )
  select
    es.student_id,
    public.legacy_backfill_pin('profile'), public.legacy_backfill_pin('framework'),
    public.legacy_backfill_pin('blueprint'), public.legacy_backfill_pin('taxonomy'),
    public.legacy_backfill_pin('engine'), public.legacy_backfill_pin('scoring'),
    public.legacy_backfill_pin('content_build'),
    'fixed', es.seed, es.config, 'created',
    /* The classifier decides; this is the only place content_identity is set for
       a backfilled row, and it is set from evidence rather than from a default. */
    case when exists (select 1 from public.classify_legacy_session_content(es.id))
         then 'version_pinned' else 'legacy_unversioned' end,
    es.id, es.created_at, es.created_at, es.expires_at
  from public.exam_sessions es
  where (
      exists (select 1 from public.exam_attempts a where a.session_id = es.id)
      or es.expires_at < now()
    )
  on conflict (legacy_session_id) do nothing;

  get diagnostics v_sessions = row_count;

  -- 2. The served-item ledger, ONLY for sessions the classifier bound. §12.4's
  --    ledger is authoritative, and authoritative records are not invented — a
  --    legacy_unversioned session gets no rows here at all, which is what makes
  --    "this sitting is not reproducible" a structural fact rather than a label.
  insert into public.assessment_session_items (
    session_id, global_ordinal, stage_number, within_stage_ordinal,
    item_id, item_version_id, content_hash, allocation_reason, allocation_decision, seed
  )
  select s.id, c.ordinal, 1, c.ordinal, c.item_id, c.item_version_id, c.content_hash,
         'fixed_blueprint_selection',
         jsonb_build_object('source', 'legacy_backfill', 'boundBy', 'config.contentHashes'),
         s.seed
  from public.assessment_sessions s
  cross join lateral public.classify_legacy_session_content(s.legacy_session_id) c
  where s.legacy_session_id is not null
    and s.status = 'created'
    and s.content_identity = 'version_pinned'
  on conflict (session_id, global_ordinal) do nothing;

  get diagnostics v_items = row_count;

  -- 3. Responses, one per served question — not one per answered question. A
  --    question the learner never touched still has a recorded outcome
  --    ('unanswered'), and dropping it would make the response count disagree
  --    with the served count for a reason nobody could later reconstruct.
  --
  --    The response VALUE prefers the attempt's own snapshot over the
  --    exam_responses autosave row (ADR-005 §3): the snapshot is what was
  --    actually submitted and scored, the autosave buffer may lag it.
  --
  --    The per-question OUTCOME is copied from the result's questionDetails.
  --    That is transcription, not scoring — no scorer runs, and a question
  --    absent from questionDetails gets null columns rather than an invented
  --    status.
  insert into public.session_responses (
    session_id, session_item_id, legacy_question_id, response_value,
    score_status, is_correct, awarded_marks, available_marks, scored_at
  )
  select
    s.id,
    si.id,
    /* Exactly one identity branch (session_responses_one_identity_branch): a
       bound session points at its ledger row, an unbound one carries the bare
       legacy question id — the identifier whose binding cannot be proved. */
    case when si.id is null then served.question_id end,
    coalesce(att.responses, er.responses) -> served.question_id,
    detail ->> 'status',
    case detail ->> 'status'
      when 'correct' then true
      when 'incorrect' then false
      when 'unanswered' then false
      else null            /* manual_review: §14.3 forbids fabricated correctness */
    end,
    case when detail ->> 'status' = 'manual_review' then null
         else (detail ->> 'awardedMarks')::integer end,
    (detail ->> 'availableMarks')::integer,
    att.submitted_at
  from public.assessment_sessions s
  join public.exam_sessions es on es.id = s.legacy_session_id
  cross join lateral unnest(es.selected_question_ids) with ordinality
    as served(question_id, ordinal)
  left join public.exam_attempts att on att.session_id = es.id
  left join public.exam_responses er on er.session_id = es.id
  left join public.assessment_session_items si
    on si.session_id = s.id and si.global_ordinal = served.ordinal::integer
  left join lateral (
    select d
    from jsonb_array_elements(coalesce(att.result -> 'questionDetails', '[]'::jsonb)) as d
    where d ->> 'questionId' = served.question_id
    limit 1
  ) detail_row(detail) on true
  where s.legacy_session_id is not null
    and s.status = 'created'
  on conflict do nothing;

  get diagnostics v_responses = row_count;

  -- 4. Results. legacy_result carries the ORIGINAL jsonb verbatim (§12.7 step 4:
  --    "may preserve the original JSON result for history but MUST NOT be
  --    recomputed"); the typed columns are that same blob's own totals, mapped.
  --    If a blob is missing a field the cast fails and the whole backfill
  --    aborts, which is the correct direction: a result row with an invented
  --    zero in it is worse than no result row.
  insert into public.assessment_results (
    session_id, student_id, scoring_algorithm_version,
    total_items, attempted_items, auto_marked_items, manual_review_items,
    correct_count, incorrect_count, unanswered_count,
    objective_awarded_marks, objective_available_marks, objective_percentage,
    pending_manual_marks, time_taken_seconds, started_at, submitted_at,
    submission_reason, legacy_attempt_id, legacy_result
  )
  select
    s.id, att.student_id, public.legacy_backfill_pin('scoring'),
    (att.result ->> 'totalQuestions')::integer,
    (att.result ->> 'attemptedQuestions')::integer,
    (att.result ->> 'autoMarkedQuestions')::integer,
    (att.result ->> 'manualReviewQuestions')::integer,
    (att.result ->> 'correctCount')::integer,
    (att.result ->> 'incorrectCount')::integer,
    (att.result ->> 'unansweredCount')::integer,
    (att.result ->> 'objectiveMarksEarned')::integer,
    (att.result ->> 'objectiveMarksAvailable')::integer,
    (att.result ->> 'objectivePercentage')::integer,
    (att.result ->> 'pendingManualMarks')::integer,
    (att.result ->> 'timeTakenSeconds')::integer,
    /* Epoch milliseconds in the legacy blob; timestamptz here. */
    to_timestamp(((att.result ->> 'startedAt')::bigint) / 1000.0),
    to_timestamp(((att.result ->> 'submittedAt')::bigint) / 1000.0),
    att.result ->> 'submissionReason',
    att.id, att.result
  from public.assessment_sessions s
  join public.exam_attempts att on att.session_id = s.legacy_session_id
  where s.legacy_session_id is not null
    and public.legacy_result_is_mappable(att.result)
  on conflict (legacy_attempt_id) do nothing;

  get diagnostics v_results = row_count;

  /* Counted and returned, never swallowed. The verifier turns a non-zero value
     here into a blocking discrepancy naming each attempt. */
  select count(*) into v_unmappable
  from public.assessment_sessions s
  join public.exam_attempts att on att.session_id = s.legacy_session_id
  where s.legacy_session_id is not null
    and not public.legacy_result_is_mappable(att.result);

  -- 5. Manual marks. Same two identity branches, same reason.
  insert into public.manual_marks (
    session_id, session_item_id, legacy_question_id, marked_by,
    awarded_marks, max_marks, feedback, marked_at, legacy_essay_mark_id
  )
  select
    s.id, si.id,
    case when si.id is null then em.question_id end,
    em.marked_by, em.awarded_marks, em.max_marks, em.feedback, em.marked_at, em.id
  from public.essay_marks em
  join public.exam_attempts att on att.id = em.attempt_id
  join public.assessment_sessions s on s.legacy_session_id = att.session_id
  left join public.assessment_session_items si
    on si.session_id = s.id
   and si.item_id = (
     select i.id from public.items i where i.item_code = em.question_id limit 1
   )
  on conflict (legacy_essay_mark_id) do nothing;

  get diagnostics v_marks = row_count;

  -- 6. The lifecycle flip, last (§12.8). A sitting with an attempt was
  --    submitted; a sitting that merely expired without one was abandoned.
  --    Calling the latter 'submitted' would assert a submission that never
  --    happened.
  update public.assessment_sessions s
  set status = 'submitted', submitted_at = att.submitted_at, version = s.version + 1
  from public.exam_attempts att
  where att.session_id = s.legacy_session_id and s.status = 'created';

  get diagnostics v_submitted = row_count;

  update public.assessment_sessions s
  set status = 'abandoned', version = s.version + 1
  where s.legacy_session_id is not null
    and s.status = 'created'
    and not exists (select 1 from public.exam_attempts a where a.session_id = s.legacy_session_id);

  get diagnostics v_abandoned = row_count;

  select
    count(*) filter (where content_identity = 'version_pinned'),
    count(*) filter (where content_identity = 'legacy_unversioned')
  into v_pinned, v_unversioned
  from public.assessment_sessions where legacy_session_id is not null;

  return jsonb_build_object(
    'sessionsBefore', v_sessions_before,
    'sessionsInserted', v_sessions,
    'ledgerRowsInserted', v_items,
    'responsesInserted', v_responses,
    'resultsInserted', v_results,
    'resultsSkippedUnmappable', v_unmappable,
    'manualMarksInserted', v_marks,
    'sessionsSubmitted', v_submitted,
    'sessionsAbandoned', v_abandoned,
    'backfilledVersionPinned', v_pinned,
    'backfilledLegacyUnversioned', v_unversioned
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- Nobody but the owner may run the backfill. It is an operational step executed
-- with the deploy credential, not something a signed-in caller has any business
-- invoking — and unlike the delivery RPCs there is no application path that
-- needs it. The classifier is likewise not learner-facing: it reads
-- exam_sessions and item_versions, and a learner holds no privilege on the
-- latter at all.
-- `create function` grants EXECUTE to PUBLIC by default and this project's local
-- stack adds per-role grants via ALTER DEFAULT PRIVILEGES, so the revoke is not
-- optional: without it every signed-in caller could materialise target rows at
-- will. An earlier draft omitted one of the classifier predicates from its
-- revoke list, and the migration registry check is what caught it.
revoke all on function public.backfill_legacy_terminal_sessions() from public, anon, authenticated;

comment on function public.backfill_legacy_terminal_sessions() is
  'Spec §12.7 step 3. Copies TERMINAL legacy sittings into the target model, idempotently, keyed on unique legacy source ids. Reads the legacy tables and never writes them. Never re-scores: exam_attempts.result is preserved verbatim on assessment_results.legacy_result and its totals mapped across. Not executable by anon or authenticated.';
