-- rollback-10.sql: reverse migration 20261013090000 (timed writing + parent marking).
-- REHEARSED on a restored copy of the hosted schema (see release plan, runbook R3). NOT run on hosted.
-- Aborts (nothing changes) if any writing attempt or mark exists. Restores erase_student verbatim
-- from the pre-migration definition.
-- Run:  psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f docs/plans/rollback/rollback-10.sql
begin;
do $guard$
begin
  if (select count(*) from public.writing_attempts) > 0
     or (select count(*) from public.writing_marks) > 0
     or (select count(*) from public.writing_mark_criteria) > 0 then
    raise exception 'rollback-10: writing data exists; refusing to drop';
  end if;
  if not exists (select 1 from supabase_migrations.schema_migrations where version = '20261013090000') then
    raise exception 'rollback-10: ledger has no 20261013090000';
  end if;
end
$guard$;
drop function public.start_writing_attempt(text, text, integer);
drop function public.save_writing_draft(uuid, text);
drop function public.submit_writing_attempt(uuid, text, text);
drop function public.record_paper_writing_attempt(uuid, text, text, integer);
drop function public.mark_writing_attempt(uuid, text, integer, jsonb, jsonb, text);
drop function public.record_marked_paper_attempt(uuid, text, text, integer, text, integer, jsonb, jsonb, text);
drop table public.writing_mark_criteria;
drop table public.writing_marks;
drop table public.writing_attempts;
drop table public.writing_rubrics;
CREATE OR REPLACE FUNCTION public.erase_student(p_student uuid, p_request_ref text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_legacy_sessions  integer := 0;
  v_target_sessions  integer := 0;
  v_legacy_responses integer := 0;
  v_marks            integer := 0;
  v_assignments      integer := 0;
begin
  if p_student is null then
    raise exception 'erase_student requires a subject'
      using errcode = 'MM001';
  end if;

  /* Assignments first: `assignments.attempt_id` is ON DELETE SET NULL, but
     `assignment_students` rows name the child directly and must go rather than
     be nulled — a row saying "someone was assigned this" keyed to a deleted
     child is a link to that child. */
  delete from public.assignment_students where student_id = p_student;
  get diagnostics v_assignments = row_count;

  /* Marks the child received. `essay_marks` cascades from `exam_attempts` and
     `manual_marks` from `assessment_sessions`, so both would go with the
     sittings below — they are counted here explicitly because "marks" is one of
     the surfaces §17.5 names, and a count of zero that came from a cascade
     nobody checked is not evidence. */
  select count(*) into v_marks
  from (
    select 1 from public.essay_marks m
    join public.exam_attempts a on a.id = m.attempt_id
    where a.student_id = p_student
    union all
    select 1 from public.manual_marks m
    join public.assessment_sessions s on s.id = m.session_id
    where s.student_id = p_student
  ) counted;

  select count(*) into v_legacy_responses
  from public.exam_responses where student_id = p_student;

  /* THE TARGET MODEL FIRST — see the header. This removes native sittings and
     backfill copies alike, and with them the ledger rows, the responses, the
     results and the manual marks that cascade from them. */
  delete from public.assessment_sessions where student_id = p_student;
  get diagnostics v_target_sessions = row_count;

  /* Belt: a result row whose session was already gone would be orphaned, which
     the schema forbids, but an erasure that trusted the schema and left one
     behind would be indistinguishable from one that worked. */
  delete from public.assessment_results where student_id = p_student;

  /* Now the legacy model. Attempts, autosave buffers and essay marks cascade. */
  delete from public.exam_sessions where student_id = p_student;
  get diagnostics v_legacy_sessions = row_count;
  delete from public.exam_attempts where student_id = p_student;
  delete from public.exam_responses where student_id = p_student;

  /* Everything else that names the child. Idempotency records are §17.5's
     "transient job payloads": they hold the request body of a create call,
     which is the child's chosen exam scope. */
  delete from public.idempotency_keys where actor_id = p_student;
  delete from public.parent_children where child_id = p_student;
  delete from public.class_students where student_id = p_student;

  /* The profile, and then the mapping key itself. §17.5 step 5: erasure that
     leaves the identity row behind has replaced a name with a uuid, which is a
     reversible pseudonym and is not erasure. */
  delete from public.profiles where id = p_student;
  delete from auth.users where id = p_student;

  insert into public.erasure_audit (
    subject_id, legacy_sessions_deleted, target_sessions_deleted,
    legacy_responses_deleted, marks_deleted, assignment_links_cleared, request_ref
  ) values (
    p_student, v_legacy_sessions, v_target_sessions,
    v_legacy_responses, v_marks, v_assignments, p_request_ref
  );

  return jsonb_build_object(
    'subjectId', p_student,
    'legacySessionsDeleted', v_legacy_sessions,
    'targetSessionsDeleted', v_target_sessions,
    'legacyResponsesDeleted', v_legacy_responses,
    'marksDeleted', v_marks,
    'assignmentLinksCleared', v_assignments
  );
end;
$function$
;

delete from supabase_migrations.schema_migrations where version = '20261013090000';
commit;