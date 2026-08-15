-- Gate A item A2: a teacher can clear a target sitting's manual-review item.
--
-- 20260812100000 created `manual_marks` and said, in the comment above its RLS
-- block, that "writes go through a SECURITY DEFINER RPC (next migration)". That
-- migration was never written, so until now the only thing that had ever
-- inserted a `manual_marks` row was the backfill. ADR-005 Amendment B4 recorded
-- the consequence: the marking queue reads through the shared views but is
-- filtered to legacy-origin sittings, because listing a target sitting would put
-- a row in a teacher's queue that no button can clear. This is the button.
--
-- WHY AN RPC AND NOT AN INSERT POLICY. `essay_marks` takes teacher writes
-- directly, under a policy, and that works there because everything a policy
-- must guarantee is expressible as a predicate over the row: the attempt belongs
-- to one of my students, and marked_by is me. The property that matters HERE is
-- not expressible that way — `max_marks` must be the pinned item version's
-- `marks_available` rather than a number the request chose, and "this value came
-- from the server's own record" is a fact about how a row was PRODUCED, not a
-- fact about the row. A WITH CHECK cannot see the difference between a correct
-- ceiling and a forged one. That is the same reasoning 20260811090000 used to
-- move `exam_attempts.result` behind a function, and §14.1's "learners MUST NOT
-- directly insert marks earned" is the same rule one audience further along:
-- a teacher may decide the mark, and may not decide what it is out of.
--
-- WHAT A CALLER CANNOT SEND. There is no `max_marks` parameter, no `marked_by`
-- parameter and no student parameter. The ceiling is read from the ledger, the
-- marker is `auth.uid()`, and the student is whoever the session says it is. The
-- only two things the request decides are the mark and the feedback, which is
-- exactly the teacher's own judgement and nothing else (§17.2).
--
-- WHAT "NOT YOURS" LOOKS LIKE. One code, MM217, for every one of: no such
-- session, no such served item, a sitting on the legacy model, a sitting the
-- caller does not teach. A distinct "exists but not yours" would tell a signed-in
-- stranger that a given session id is real, which is a fact about a child. The
-- route maps MM217 to 404 for the same reason the read paths already collapse
-- absent and forbidden into one answer.
--
-- ERROR CODES, continuing the series:
--
--   MM001  no authenticated caller
--   MM217  no markable item of that identity is visible to this caller
--   MM218  the item is not awaiting a human mark
--   MM219  the mark exceeds what the pinned item version is worth
--
-- Additive. `essay_marks`, its policies and the legacy marking write are
-- untouched; a legacy sitting is marked exactly as it was yesterday.

-- ---------------------------------------------------------------------------
-- record_manual_mark — the write
-- ---------------------------------------------------------------------------
create or replace function public.record_manual_mark(
  p_session_id uuid,
  p_session_item_id uuid,
  p_awarded_marks numeric,
  p_feedback text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_teacher   uuid := auth.uid();
  v_student   uuid;
  v_status    text;
  v_max_marks numeric;
  v_score     text;
  v_mark_id   uuid;
begin
  if v_teacher is null then
    raise exception 'record_manual_mark requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  /* THE OWNERSHIP GATE, RE-DERIVED HERE (§17.2). `is_teacher_of_student` is the
     same SECURITY DEFINER helper every teacher policy in this schema uses,
     including the `manual_marks` SELECT policy — so a teacher can write exactly
     the rows they can already read, and the two cannot drift apart by being
     expressed differently.

     There is deliberately no separate "are you a teacher" check. Holding the
     role is not what authorises this write; teaching THIS child is, and a
     non-teacher satisfies the predicate for nobody. A role check would only
     change which error a parent gets, and the answer they should get is that
     there is no such item.

     `legacy_session_id is null` restricts this to sittings the target model
     CREATED. A backfill copy is a copy of a legacy sitting (ADR-005 Amendment
     A2/A4); marking it here would put the mark on the row nothing reads, while
     the teacher's queue went on showing the legacy original as pending. */
  select s.student_id, s.status
    into v_student, v_status
  from public.assessment_sessions s
  where s.id = p_session_id
    and s.legacy_session_id is null
    and public.is_teacher_of_student(s.student_id);

  if not found then
    raise exception 'no markable sitting of that identity is visible to this caller'
      using errcode = 'MM217';
  end if;

  /* A sitting that has not been submitted has not been scored, so nothing on it
     has been flagged for review yet. Marking one would be marking work still in
     progress — and §14.3's manual/blank distinction is not even decided until
     the scorer has run. */
  if v_status not in ('submitted', 'processed') then
    raise exception 'sitting % has not been submitted' , p_session_id
      using errcode = 'MM217';
  end if;

  /* The item must be a served item of THIS sitting, and the scorer must have
     found it to need a person. Both facts are read from the server's own rows:
     the ledger says what was served, and `score_status` is written only by the
     scoring module under the §9.3.1 role.

     §14.3 is why this is `= 'manual_review'` and not "the answer kind is
     manual": a BLANK manual item is `unanswered`, not pending review — there is
     nothing for a person to read — and marking one would be inventing a mark
     for work that was never done. */
  select iv.marks_available, r.score_status
    into v_max_marks, v_score
  from public.assessment_session_items si
  join public.item_versions iv on iv.id = si.item_version_id
  left join public.session_responses r
    on r.session_item_id = si.id and r.session_id = si.session_id
  where si.id = p_session_item_id and si.session_id = p_session_id;

  if not found then
    raise exception 'no such served item in that sitting'
      using errcode = 'MM217';
  end if;

  if v_score is distinct from 'manual_review' then
    raise exception 'item % is not awaiting a human mark', p_session_item_id
      using errcode = 'MM218';
  end if;

  /* THE CEILING IS THE SERVER'S, NOT THE REQUEST'S. Read from the item version
     the sitting pinned, so it is what this learner's paper was actually worth
     and not what the item is worth after a later revision. */
  if p_awarded_marks is null or p_awarded_marks < 0 or p_awarded_marks > v_max_marks then
    raise exception 'awarded marks % are outside 0..% for this item', p_awarded_marks, v_max_marks
      using errcode = 'MM219';
  end if;

  insert into public.manual_marks as mm
    (session_id, session_item_id, marked_by, awarded_marks, max_marks, feedback, marked_at)
  values (p_session_id, p_session_item_id, v_teacher, p_awarded_marks, v_max_marks, p_feedback, now())
  on conflict (session_id, session_item_id) where session_item_id is not null
  /* Re-marking is an UPDATE, exactly as it is on `essay_marks`: there is no
     delete path on either table, because a recorded mark is a child's academic
     record and the audit trail is the row staying put. `marked_by` moves to
     whoever most recently decided — which is the same semantics the legacy
     policy's WITH CHECK enforces. */
  do update set
    marked_by     = excluded.marked_by,
    awarded_marks = excluded.awarded_marks,
    max_marks     = excluded.max_marks,
    feedback      = excluded.feedback,
    marked_at     = excluded.marked_at
  returning mm.id into v_mark_id;

  return jsonb_build_object(
    'markId', v_mark_id,
    'sessionId', p_session_id,
    'sessionItemId', p_session_item_id,
    'awardedMarks', p_awarded_marks,
    'maxMarks', v_max_marks
  );
end;
$$;

revoke all on function public.record_manual_mark(uuid, uuid, numeric, text) from public, anon;
grant execute on function public.record_manual_mark(uuid, uuid, numeric, text) to authenticated;

comment on function public.record_manual_mark(uuid, uuid, numeric, text) is
  'Records a teacher''s mark for one manual-review item of a target-model sitting (spec §14.1, §14.3; ADR-005 Amendment B4). Teacher-of-student only, through the same is_teacher_of_student helper the read policy uses. max_marks is read from the item version the sitting pinned and is not a parameter; marked_by is auth.uid(). Absent, legacy-origin and not-mine all raise MM217 so existence does not leak.';

-- ---------------------------------------------------------------------------
-- get_manual_review_response — what the marker is marking
-- ---------------------------------------------------------------------------
-- A write path a teacher cannot see the work through is not a usable write path,
-- and `session_responses` has RLS on, no policy and no `authenticated`
-- privileges (20260812100000) — deliberately, and that must not change. So the
-- teacher's read of one manual-review response is a definer function with the
-- same gate as the write beside it, returning one item of one sitting and
-- nothing that would let it be used to browse.
--
-- WHAT IT DOES NOT TOUCH: `item_answer_versions`. Not the answer, not the
-- grading rules, not the private explanation — AND NOT THE RUBRIC, which lives
-- there too. ADR-006 Amendment D2 rejected reaching into that table from an
-- application-callable function even for a single harmless-looking column,
-- because the boundary is the role and the module rather than the select list,
-- and the next person to edit this function would be editing one that already
-- had the answer table in scope. The consequence is stated plainly rather than
-- worked around: a teacher marking a TARGET sitting sees the prompt, the child's
-- response and the marks available, and does not see the authored rubric the
-- legacy marking screen shows from the compiled bank. That is a real gap, it is
-- recorded in the readiness checklist, and closing it means deciding where a
-- marker-visible rubric belongs — not widening this function.
create or replace function public.get_manual_review_response(
  p_session_id uuid,
  p_session_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_teacher uuid := auth.uid();
  v_body    jsonb;
begin
  if v_teacher is null then
    raise exception 'get_manual_review_response requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  -- THE COLUMNS ARE LISTED, NEVER SPREAD — 20260812120000's rule, for the same
  -- reason: an `alter table` on item_versions must not silently widen what a
  -- teacher receives.
  select jsonb_build_object(
           'sessionId', s.id,
           'sessionItemId', si.id,
           'studentId', s.student_id,
           'submittedAt', s.submitted_at,
           'itemCode', i.item_code,
           'questionType', iv.question_type,
           'answerKind', iv.answer_kind,
           'minWords', iv.min_words,
           'maxWords', iv.max_words,
           'prompt', iv.prompt,
           'marksAvailable', iv.marks_available,
           'responseValue', r.response_value,
           'awardedMarks', mm.awarded_marks,
           'feedback', mm.feedback
         )
    into v_body
  from public.assessment_sessions s
  join public.assessment_session_items si on si.session_id = s.id
  join public.item_versions iv on iv.id = si.item_version_id
  join public.items i on i.id = si.item_id
  join public.session_responses r
    on r.session_item_id = si.id and r.session_id = s.id
  left join public.manual_marks mm
    on mm.session_id = s.id and mm.session_item_id = si.id
  where s.id = p_session_id
    and si.id = p_session_item_id
    and s.legacy_session_id is null
    and s.status in ('submitted', 'processed')
    /* Only an item the scorer actually flagged. A teacher has no business
       reading an arbitrary answer of an arbitrary child through here — the
       queue is the authorisation for looking, and this is the same predicate
       the queue is built from. */
    and r.score_status = 'manual_review'
    and public.is_teacher_of_student(s.student_id);

  if v_body is null then
    raise exception 'no markable item of that identity is visible to this caller'
      using errcode = 'MM217';
  end if;

  return v_body;
end;
$$;

revoke all on function public.get_manual_review_response(uuid, uuid) from public, anon;
grant execute on function public.get_manual_review_response(uuid, uuid) to authenticated;

comment on function public.get_manual_review_response(uuid, uuid) is
  'One manual-review response of one target-model sitting, for the teacher who marks it. Same gate as record_manual_mark. Returns candidate content, the child''s answer and the marks available; never an answer key, grading rules, private explanation or rubric — it does not read item_answer_versions at all (§17.1, ADR-006 Amendment D2).';

-- ---------------------------------------------------------------------------
-- The queue carries the identity the write is keyed by
-- ---------------------------------------------------------------------------
-- `resolved_sitting_questions` normalises "which questions still need a human
-- mark" across both models, and 20260815090000 keyed it on `question_key` —
-- the legacy bare question id on one side, the item code on the other — because
-- that was the only identity both halves had and nothing yet wrote a mark
-- against the target half.
--
-- `record_manual_mark` is keyed on `assessment_session_items.id`, as §12.5
-- requires of anything that references a served item, so the queue has to be
-- able to hand the write path that id. Adding it as a nullable trailing column
-- keeps every existing consumer's select list valid: the three admin aggregates
-- name their columns, and `create or replace view` permits an append.
--
-- Null for the legacy half, and that is the honest value rather than an
-- inconvenience — the legacy model recorded no per-item identity, which is the
-- same absence ADR-005 §4 refuses to paper over anywhere else. The marking route
-- reads the origin to decide which write path to use, and null is what it
-- expects on the branch that does not need one.
create or replace view public.resolved_sitting_questions
with (security_barrier) as

  select
    rs.origin,
    rs.session_id,
    rs.student_id,
    rs.submitted_at,
    rs.objective_percentage                             as sitting_percentage,
    qd.value ->> 'questionId'                           as question_key,
    qd.value ->> 'status'                               as status,
    coalesce((qd.value ->> 'pendingManualReview')::boolean, false) as pending_manual,
    coalesce((qd.value ->> 'attempted')::boolean, false) as attempted,
    (qd.value ->> 'awardedMarks')::numeric              as awarded_marks,
    (qd.value ->> 'availableMarks')::numeric            as available_marks,
    /* The legacy model recorded per-question status but never per-question
       subject or skill — only the aggregate `breakdowns` beside them. Null here
       is the honest answer, and it is why the subject and skill aggregates read
       those breakdowns for this half rather than grouping these rows. */
    null::text                                          as subject,
    null::text                                          as skill,
    null::uuid                                          as session_item_id
  from public.resolved_sittings rs
  cross join lateral jsonb_array_elements(rs.legacy_result -> 'questionDetails') as qd(value)
  where rs.origin = 'legacy' and rs.legacy_result is not null

  union all

  select
    rs.origin,
    rs.session_id,
    rs.student_id,
    rs.submitted_at,
    rs.objective_percentage                             as sitting_percentage,
    i.item_code                                         as question_key,
    /* The scorer's own words, mapped to the legacy vocabulary so one consumer
       can count both. `unanswered` is a status on both sides; `manual_review`
       is reported as pending rather than as a mark. */
    coalesce(resp.score_status, 'unanswered')           as status,
    resp.score_status is not distinct from 'manual_review' as pending_manual,
    resp.response_value is not null                     as attempted,
    resp.awarded_marks::numeric                         as awarded_marks,
    coalesce(resp.available_marks, iv.marks_available)::numeric as available_marks,
    /* The target model knows what the legacy model could only aggregate: the
       subject and skill of the exact item version served. */
    iv.source_subject                                   as subject,
    coalesce(iv.source_skill, iv.source_topic)          as skill,
    si.id                                               as session_item_id
  from public.resolved_sittings rs
  join public.assessment_session_items si on si.session_id = rs.session_id
  join public.item_versions iv on iv.id = si.item_version_id
  join public.items i on i.id = si.item_id
  left join public.session_responses resp on resp.session_item_id = si.id
  where rs.origin = 'version_pinned' and rs.submitted_at is not null;

-- `select q.*` was expanded when the wrapper was created, so the wrapper does
-- not inherit a column added to its base afterwards. Replaced rather than left
-- to drift — a queue that could not see the new column would still be listing
-- target items with no way to name them.
create or replace view public.visible_sitting_questions
with (security_barrier) as
  select q.*
  from public.resolved_sitting_questions q
  where q.student_id = auth.uid()
     or public.is_parent_of(q.student_id)
     or public.is_teacher_of_student(q.student_id);

revoke all on public.resolved_sitting_questions from anon, authenticated, public;
revoke all on public.visible_sitting_questions from anon, public;
grant select on public.visible_sitting_questions to authenticated;
