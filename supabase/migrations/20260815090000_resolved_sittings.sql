-- Phase 2 step 8: ONE place where "which model does this sitting belong to" is
-- answered (spec §12.7 step 8; ADR-005 Amendment A).
--
-- Step 7 put the resolution rule in TypeScript, which was enough for three
-- learner-facing readers. Step 8 has to move consumers TypeScript cannot reach:
-- the six admin aggregate views are SQL, defined only in
-- 20260718120000_admin_aggregate_views.sql, and no application file names the
-- tables they read (ADR-005 §7 — "a file-grep misses them"). A rule that lives
-- in the application cannot govern them, and a second copy written in SQL is
-- two rules that will disagree the first time one is edited.
--
-- So the rule moves here, once, and everything reads through it: the admin views
-- directly, and `src/server/assessment/read-dispatch.ts` through the
-- learner-facing wrapper below.
--
-- THE RULE, unchanged from Amendment A: a sitting is read from the model that
-- CREATED it. A backfill copy — an `assessment_sessions` row with
-- `legacy_session_id` set — is not a target-model sitting; it is a copy of a
-- legacy one, and it is excluded here so that it is read by nothing. The
-- discriminator is a unique column, never a timestamp heuristic.
--
-- Read-side and additive. No table, policy, grant or write path changes; the
-- legacy tables keep every reader they had until its replacement is verified.

-- ---------------------------------------------------------------------------
-- resolved_sittings — every sitting, once, from its origin
-- ---------------------------------------------------------------------------
-- Owner-rights (the Postgres default for a view), so it sees both models whole,
-- and therefore granted to NOBODY. It is an implementation detail with two
-- consumers: `visible_sittings` below, which applies the learner/parent/teacher
-- predicate, and the admin views, which apply `is_admin()`. Access control is
-- per audience; the resolution rule is shared. Those are different things and
-- collapsing them is what would force a choice between an admin seeing nothing
-- and a learner seeing everything.
--
-- `security_barrier` for the same reason the admin views carry it: it stops a
-- caller-supplied predicate being pushed down past the access check in whatever
-- selects from it.
create view public.resolved_sittings
with (security_barrier) as

  -- The legacy half. One row per exam_sessions row, submitted or not: an
  -- unsubmitted sitting is still a sitting, and resume needs it.
  select
    'legacy'::text                                      as origin,
    s.id                                                as session_id,
    /* The backfill copy's id, so that a caller holding EITHER identity resolves
       to this one row. Without it "exactly one source per sitting" would be true
       of the list and false of a lookup by the copy's id. */
    c.id                                                as alias_session_id,
    s.student_id,
    a.id                                                as attempt_id,
    null::uuid                                          as result_id,
    s.config,
    s.created_at,
    s.expires_at,
    a.submitted_at,
    /* The legacy model has no status column; the attempt row IS the status, and
       expiry is the only other terminal state it records. */
    case
      when a.id is not null then 'submitted'
      when s.expires_at <= now() then 'abandoned'
      else 'active'
    end                                                 as status,
    (a.result ->> 'totalQuestions')::integer            as total_items,
    (a.result ->> 'attemptedQuestions')::integer        as attempted_items,
    (a.result ->> 'correctCount')::integer              as correct_count,
    (a.result ->> 'incorrectCount')::integer            as incorrect_count,
    (a.result ->> 'unansweredCount')::integer           as unanswered_count,
    (a.result ->> 'objectiveMarksEarned')::integer      as objective_awarded_marks,
    (a.result ->> 'objectiveMarksAvailable')::integer   as objective_available_marks,
    (a.result ->> 'objectivePercentage')::integer       as objective_percentage,
    (a.result ->> 'pendingManualMarks')::integer        as pending_manual_marks,
    (a.result ->> 'timeTakenSeconds')::integer          as time_taken_seconds,
    /* The original ExamResult, kept because the admin views need parts of it no
       column carries — the per-subject, per-skill and per-question breakdowns
       the legacy scorer computed once and stored. */
    a.result                                            as legacy_result,
    /* The per-subject/per-skill/per-question-type rollup, in the shape
       `exam-report.ts` emits. Carried as a column so that one consumer can read
       it for either model: the legacy scorer computed it once and stored it,
       and the target half below derives the same shape from the served items.
       Without this, subject mastery on the student and parent screens would
       silently count legacy sittings only. */
    a.result -> 'breakdowns'                            as breakdowns
  from public.exam_sessions s
  left join public.exam_attempts a on a.session_id = s.id
  left join public.assessment_sessions c on c.legacy_session_id = s.id

  union all

  -- The target half, NATIVE SITTINGS ONLY. `legacy_session_id is null` is the
  -- whole de-duplication: it selects the sittings this model created, and
  -- excludes the ones it was handed by the backfill, whose `exam_sessions` row
  -- is already in the half above.
  select
    'version_pinned'::text                              as origin,
    s.id                                                as session_id,
    null::uuid                                          as alias_session_id,
    s.student_id,
    null::uuid                                          as attempt_id,
    r.id                                                as result_id,
    s.config,
    s.created_at,
    s.expires_at,
    r.submitted_at,
    s.status,
    r.total_items,
    r.attempted_items,
    r.correct_count,
    r.incorrect_count,
    r.unanswered_count,
    r.objective_awarded_marks,
    r.objective_available_marks,
    r.objective_percentage,
    r.pending_manual_marks,
    r.time_taken_seconds,
    null::jsonb                                         as legacy_result,
    /* Derived, not stored. The target model records one row per served item
       with the scorer's verdict on it, so the same rollup is an aggregation
       rather than a second scoring implementation — nothing here decides
       whether an answer was right, it only counts verdicts that already exist.
       Null for a sitting with no result yet, matching the legacy half, where
       an unsubmitted session has no stored breakdowns either. */
    case when r.id is null then null else (
      select jsonb_build_object(
        'bySubject', coalesce(jsonb_object_agg(g.subject, g.row) filter (where g.subject is not null), '{}'::jsonb),
        'bySkill',   coalesce(jsonb_object_agg(g.skill,   g.row) filter (where g.skill   is not null), '{}'::jsonb)
      )
      from (
        select
          iv.source_subject as subject,
          coalesce(iv.source_skill, iv.source_topic) as skill,
          jsonb_build_object(
            'total',        count(*),
            'attempted',    count(*) filter (where resp.response_value is not null),
            'correct',      count(*) filter (where resp.score_status = 'correct'),
            'incorrect',    count(*) filter (where resp.score_status = 'incorrect'),
            'unanswered',   count(*) filter (where resp.score_status is null or resp.score_status = 'unanswered'),
            'manualReview', count(*) filter (where resp.score_status = 'manual_review'),
            'objectiveMarksEarned', coalesce(sum(resp.awarded_marks) filter (where resp.score_status <> 'manual_review'), 0),
            'objectiveMarksAvailable', coalesce(sum(coalesce(resp.available_marks, iv.marks_available))
                                                 filter (where resp.score_status is distinct from 'manual_review'), 0)
          ) as row
        from public.assessment_session_items si
        join public.item_versions iv on iv.id = si.item_version_id
        left join public.session_responses resp on resp.session_item_id = si.id
        where si.session_id = s.id
        group by grouping sets ((iv.source_subject), (coalesce(iv.source_skill, iv.source_topic)))
      ) g
    ) end                                               as breakdowns
  from public.assessment_sessions s
  left join public.assessment_results r on r.session_id = s.id
  where s.legacy_session_id is null;

revoke all on public.resolved_sittings from anon, authenticated, public;

comment on view public.resolved_sittings is
  'Every sitting exactly once, from the model that created it (spec §12.7 step 8, ADR-005 Amendment A). Backfill copies are excluded by legacy_session_id, so no sitting is counted twice. Owner-rights and granted to nobody: read it through visible_sittings (learner/parent/teacher) or an is_admin()-gated aggregate view.';

-- ---------------------------------------------------------------------------
-- visible_sittings — the same rows, restricted to who may see them
-- ---------------------------------------------------------------------------
-- §17.3: "Each policy MUST contain a complete authorization predicate. A broad
-- tenant policy MUST NOT be combined with narrower ownership policies under
-- permissive OR semantics."
--
-- The three disjuncts below are not that. Each is itself a complete
-- authorization predicate — "this is my sitting", "I am this child's linked
-- parent", "I teach this child" — and there is no broad tenant disjunct for a
-- narrow one to be swallowed by. They mirror the three SELECT policies on
-- `exam_sessions` and `assessment_sessions` one for one, through the SAME
-- SECURITY DEFINER helpers, so this view can only widen access if those
-- policies do. `tests/rls/resolved-sittings.test.ts` asserts that equivalence
-- per role rather than trusting this paragraph.
--
-- The helpers stay SECURITY DEFINER for the reason the base policies do: a
-- subquery against another table would be evaluated under the caller's own RLS,
-- making the guard depend on the caller's read policies rather than on the fact
-- being asked about.
create view public.visible_sittings
with (security_barrier) as
  select *
  from public.resolved_sittings rs
  where rs.student_id = auth.uid()
     or public.is_parent_of(rs.student_id)
     or public.is_teacher_of_student(rs.student_id);

revoke all on public.visible_sittings from anon, public;
grant select on public.visible_sittings to authenticated;

comment on view public.visible_sittings is
  'resolved_sittings restricted to the caller: their own sittings, their linked children''s, or their class students''. Mirrors the three SELECT policies on exam_sessions/assessment_sessions through the same SECURITY DEFINER helpers (spec §17.3).';

-- ---------------------------------------------------------------------------
-- resolved_sitting_questions — per-question rows, once, from the origin
-- ---------------------------------------------------------------------------
-- The admin item statistics need one row per answered question, and the two
-- models record that in different places: the legacy model in the immutable
-- `questionDetails` array inside the stored result, the target model as
-- `session_responses` joined to the served-item ledger.
--
-- Both halves are driven FROM `resolved_sittings`, so the origin rule and the
-- de-duplication are inherited rather than restated. What differs per branch is
-- only where the detail is read from.
--
-- `question_key` is the legacy bare question id on one side and the item code on
-- the other, which are the same identifier space: the projection set
-- `items.item_code` from the authored question's id (20260812090000).
create view public.resolved_sitting_questions
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
    null::text                                          as skill
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
    coalesce(iv.source_skill, iv.source_topic)          as skill
  from public.resolved_sittings rs
  join public.assessment_session_items si on si.session_id = rs.session_id
  join public.item_versions iv on iv.id = si.item_version_id
  join public.items i on i.id = si.item_id
  left join public.session_responses resp on resp.session_item_id = si.id
  where rs.origin = 'version_pinned' and rs.submitted_at is not null;

revoke all on public.resolved_sitting_questions from anon, authenticated, public;

comment on view public.resolved_sitting_questions is
  'One row per answered question per sitting, once, from the model that created the sitting (spec §12.7 step 8). Driven from resolved_sittings so the origin rule is inherited, not restated. Owner-rights and granted to nobody: the admin aggregates are its only consumer.';

-- ---------------------------------------------------------------------------
-- visible_sitting_questions — the per-question rows a teacher may see
-- ---------------------------------------------------------------------------
-- The marking queue is per question, not per sitting: "which questions in my
-- students' sittings still need a human mark". Both models can answer, and they
-- answer from different places, which is exactly the shape
-- `resolved_sitting_questions` already normalises.
--
-- Restricted by the same three relationships as `visible_sittings`, for the same
-- §17.3 reason: three complete predicates, no broad tenant disjunct, mirroring
-- the policies on the tables underneath.
create view public.visible_sitting_questions
with (security_barrier) as
  select q.*
  from public.resolved_sitting_questions q
  where q.student_id = auth.uid()
     or public.is_parent_of(q.student_id)
     or public.is_teacher_of_student(q.student_id);

revoke all on public.visible_sitting_questions from anon, public;
grant select on public.visible_sitting_questions to authenticated;

comment on view public.visible_sitting_questions is
  'resolved_sitting_questions restricted to the caller (spec §12.7 step 8). The marking queue''s source: one row per question per sitting, from the model that created the sitting.';

-- ---------------------------------------------------------------------------
-- resolved_manual_marks — a human mark, whichever model holds it
-- ---------------------------------------------------------------------------
-- `essay_marks` is keyed on the legacy attempt; `manual_marks` on the target
-- session. Both are "a teacher awarded n of m for this question of this
-- sitting", and the marking screen should not have to know which table it came
-- from — so both are keyed here on the SITTING, which is the identity the
-- resolution rule is expressed in.
--
-- The legacy half joins through `exam_attempts` to reach the session, and the
-- target half is restricted to native sittings by joining `resolved_sittings`,
-- so a mark against a backfilled copy could not appear twice.
create view public.resolved_manual_marks
with (security_barrier) as

  select
    'legacy'::text        as origin,
    a.session_id          as session_id,
    a.student_id          as student_id,
    m.question_id         as question_key,
    m.marked_by,
    m.awarded_marks::numeric,
    m.max_marks::numeric,
    m.feedback,
    m.marked_at
  from public.essay_marks m
  join public.exam_attempts a on a.id = m.attempt_id

  union all

  select
    'version_pinned'::text as origin,
    rs.session_id,
    rs.student_id,
    coalesce(i.item_code, m.legacy_question_id) as question_key,
    m.marked_by,
    m.awarded_marks,
    m.max_marks,
    m.feedback,
    m.marked_at
  from public.manual_marks m
  join public.resolved_sittings rs
    on rs.session_id = m.session_id and rs.origin = 'version_pinned'
  left join public.assessment_session_items si on si.id = m.session_item_id
  left join public.items i on i.id = si.item_id;

revoke all on public.resolved_manual_marks from anon, authenticated, public;

-- TEACHERS ONLY, and deliberately narrower than the two views above.
-- `essay_marks` has exactly one policy — "teacher reads own class students'
-- marks" — and 20260812100000 restated that for `manual_marks` in as many
-- words: "no student or parent policy — per-question marks are not exposed to
-- them directly on the legacy path either, and widening that here would be a
-- product change smuggled in as a migration". The same sentence applies to a
-- view over both, so this predicate is one disjunct, not three.
create view public.visible_manual_marks
with (security_barrier) as
  select m.*
  from public.resolved_manual_marks m
  where public.is_teacher_of_student(m.student_id);

revoke all on public.visible_manual_marks from anon, public;
grant select on public.visible_manual_marks to authenticated;

comment on view public.visible_manual_marks is
  'Human marks from either model, keyed on the sitting rather than on the attempt or the session-item, so the marking screen does not have to know which table holds one (spec §12.7 step 8).';
