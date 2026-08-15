-- Gate A item A3: an assignment can be linked to a target-model sitting.
--
-- `assignment_students.attempt_id` (20260718090000) references
-- `exam_attempts (id)`. A target sitting has no attempt, so until now a sitting
-- on the new model could not be linked to an assignment AT ALL — ADR-005
-- Amendment B4 recorded it as one of the two consumers step 8 could not move,
-- and ADR-005 §7 lists assignment linkage as workflow move 5.
--
-- WHERE THE LINK GOES. Beside `attempt_id`, on the row that already IS the link
-- between an assignment and a child. The alternatives were a column on
-- `assessment_results` or a separate link table, and both put the relationship
-- somewhere the existing one is not:
--
--   * `assessment_results` is immutable by trigger and written once by the
--     scoring module, whose grant set is deliberately six tables wide and knows
--     nothing about assignments. Linking there would mean either widening that
--     credential or making the result row mutable — and the result row being
--     immutable is what stops a mark being edited into a score.
--   * A separate link table would make "which sitting answers this assignment"
--     a question with two possible homes, and the moment two rows disagreed
--     there would be no rule for which is the assignment's sitting.
--
-- ONE SITTING PER ASSIGNMENT-STUDENT, AND ONE ASSIGNMENT PER SITTING. Both are
-- constraints rather than conventions, because this is the exact place a
-- cutover produces double counting:
--
--   * `assignment_students_one_sitting_model` — a row carries an attempt id or
--     a session id, never both. A row with both would be one child credited
--     with two sittings for one assignment, and a score lookup resolving both
--     would report the assignment twice.
--   * `assignment_students_session_once` — a session id appears on at most one
--     row. Without it the same sitting could satisfy two assignments, which is
--     the same double count seen from the other end.
--
-- WHAT THIS DELIBERATELY DOES NOT DO: touch `status`. Nothing has ever written
-- that column after the teacher's initial INSERT, and making the linkage a
-- status writer would be a second concern in this migration and a half-built
-- one — there is no target submit route yet to advance it to 'submitted', so a
-- link that set 'in_progress' would leave every completed target assignment
-- stuck there for good. The read derives what it needs from the linked sitting,
-- which is one fact rather than two that can disagree.
--
-- ERROR CODES, continuing the series:
--
--   MM220  no assignment of that identity is assigned to this caller, or no
--          target sitting of that identity is theirs
--   MM221  one of the two is already linked to something else
--
-- Additive. The legacy `attempt_id` column, its foreign key and every reader of
-- it are untouched; a legacy assignment is scored exactly as it was yesterday.

alter table public.assignment_students
  add column session_id uuid references public.assessment_sessions (id) on delete set null;

comment on column public.assignment_students.session_id is
  'The target-model sitting that answers this assignment (spec §12.7 step 8, ADR-005 §7 workflow move 5). Mutually exclusive with attempt_id, which is the legacy model''s counterpart: a sitting is linked through the model that created it, exactly once.';

alter table public.assignment_students
  add constraint assignment_students_one_sitting_model
    check (attempt_id is null or session_id is null);

-- Partial, so the many rows with no sitting yet do not collide on null.
create unique index assignment_students_session_once
  on public.assignment_students (session_id)
  where session_id is not null;

-- §20.2 shape: the student assignments screen resolves scores from these rows.
create index assignment_students_session_idx
  on public.assignment_students (session_id)
  where session_id is not null;

-- ---------------------------------------------------------------------------
-- The new column is the function's alone to write
-- ---------------------------------------------------------------------------
-- `assignment_students` grants `authenticated` a whole-table UPDATE, gated by
-- the teacher policy ("teaches_assignment"). Left as it was, that would make a
-- teacher able to set `session_id` on their own assignment rows directly — to
-- any session id that satisfies the foreign key, including a sitting belonging
-- to a different child, which the score lookup would then attribute to this
-- one.
--
-- So the grant is narrowed to the columns that already had a writer, the same
-- way `profiles` narrows UPDATE to keep `role` out of a user's reach
-- (20260718090000). `status` and `attempt_id` keep exactly the privileges they
-- have today — the legacy path is untouched — and `session_id` has one writer,
-- the function below, which checks the sitting against `auth.uid()` before it
-- records anything.
revoke update on public.assignment_students from authenticated;
grant update (status, attempt_id) on public.assignment_students to authenticated;

-- ---------------------------------------------------------------------------
-- The write: a learner attaches their own sitting to their own assignment
-- ---------------------------------------------------------------------------
-- WHY THIS IS A FUNCTION AND NOT AN UPDATE POLICY. `assignment_students` has
-- exactly one UPDATE policy and it is the teacher's ("teaches_assignment"). The
-- actor here is the STUDENT — they are the one who sits the paper — so an
-- update path for them would be a new learner-facing write policy on a table
-- that currently has none, and it would have to be permissive enough to let
-- them set `session_id` while forbidding `status` and `attempt_id`. A
-- column-level grant plus a policy could express that; what neither can express
-- is that the session named is a sitting THEY sat, on the target model, not
-- already spoken for. So the write is a function, the table gains no new grant,
-- and §17.2's "client-provided ids MUST NOT be trusted" is satisfied by
-- checking rather than by constraining.
--
-- BOTH IDENTITIES COME FROM THE REQUEST AND NEITHER IS TRUSTED. The assignment
-- must already be assigned to `auth.uid()`, and the session must already belong
-- to `auth.uid()`. A caller who names somebody else's assignment, somebody
-- else's sitting, or a legacy sitting gets MM220 — one code, so which of the
-- three was wrong is not an oracle.
create or replace function public.link_assessment_session_to_assignment(
  p_assignment_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student  uuid := auth.uid();
  v_existing uuid;
  v_attempt  uuid;
  v_linked   uuid;
begin
  if v_student is null then
    raise exception 'link_assessment_session_to_assignment requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  /* The sitting must be the caller's own, and NATIVE to the target model.
     `legacy_session_id is null` excludes a backfill copy: that row is a copy of
     a legacy sitting (ADR-005 Amendment A2) and is read by nothing, so linking
     it would attribute a score the assignment screen could never resolve —
     while the legacy original sat unlinked. */
  perform 1
  from public.assessment_sessions s
  where s.id = p_session_id
    and s.student_id = v_student
    and s.legacy_session_id is null;

  if not found then
    raise exception 'no target sitting of that identity belongs to this caller'
      using errcode = 'MM220';
  end if;

  -- Locked, so two tabs cannot both attach a sitting to the same assignment.
  select ast.session_id, ast.attempt_id
    into v_existing, v_attempt
  from public.assignment_students ast
  where ast.assignment_id = p_assignment_id and ast.student_id = v_student
  for update;

  if not found then
    raise exception 'no assignment of that identity is assigned to this caller'
      using errcode = 'MM220';
  end if;

  /* Idempotent for the same pair, and a refusal for a different one. Re-linking
     is not an edit a learner gets to make: an assignment answered by one sitting
     and then re-pointed at another is a record of which sitting counted being
     rewritten after the fact. */
  if v_existing is not null and v_existing <> p_session_id then
    raise exception 'assignment % is already linked to another sitting', p_assignment_id
      using errcode = 'MM221';
  end if;

  if v_attempt is not null then
    raise exception 'assignment % is already linked to a legacy attempt', p_assignment_id
      using errcode = 'MM221';
  end if;

  /* And from the other side: a sitting answers at most one assignment. The
     unique index would refuse this anyway; raising here turns a constraint name
     into a code the route can map. */
  select ast.assignment_id into v_linked
  from public.assignment_students ast
  where ast.session_id = p_session_id and ast.assignment_id <> p_assignment_id;

  if found then
    raise exception 'sitting % is already linked to another assignment', p_session_id
      using errcode = 'MM221';
  end if;

  update public.assignment_students
  set session_id = p_session_id
  where assignment_id = p_assignment_id and student_id = v_student;

  return jsonb_build_object(
    'assignmentId', p_assignment_id,
    'sessionId', p_session_id
  );
end;
$$;

revoke all on function public.link_assessment_session_to_assignment(uuid, uuid) from public, anon;
grant execute on function public.link_assessment_session_to_assignment(uuid, uuid) to authenticated;

comment on function public.link_assessment_session_to_assignment(uuid, uuid) is
  'Attaches a learner''s own target-model sitting to an assignment they were given (ADR-005 §7 workflow move 5). Both identities are re-checked against auth.uid(); a backfill copy, another learner''s sitting and an unassigned assignment all raise MM220. Re-pointing an already-linked assignment or sitting raises MM221 rather than rewriting which sitting counted.';
