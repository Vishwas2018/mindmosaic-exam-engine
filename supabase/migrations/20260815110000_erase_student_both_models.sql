-- Phase 2 step 8: erasure that covers BOTH storage models (spec §17.5, ADR-012).
--
-- WHY NOW. A child's assessment data used to live in four legacy tables. After
-- step 3 it can also live in `assessment_*` — natively, or as a backfill copy of
-- a legacy sitting — and after step 6 a new sitting can be created there. An
-- erasure workflow that knew only the legacy tables would leave a complete,
-- linkable record of a child who had asked to be forgotten, and it would leave
-- it in the model the platform is moving TO.
--
-- There was no erasure workflow at all before this migration. ADR-012 is still a
-- placeholder for the full retention schedule — telemetry, logs, backups, legal
-- hold, the parent-facing request flow — and this does not pretend to be that.
-- It decides the one part step 8 cannot leave undecided: what erasure MEANS for
-- assessment data that now spans two models, and it makes that executable.
--
-- THE SEMANTICS, and why deletion rather than de-identification:
--
--   * §17.5 requires links removed from "sessions, responses, results, marks,
--     assignments, analytics, exports, caches" and says replacing a child id
--     with a stable reversible pseudonym is NOT erasure.
--   * Every analytic in this system is computed from those rows at read time —
--     the six admin views aggregate `resolved_sittings`, which is a view, not a
--     materialisation. Deleting the rows therefore removes the child from every
--     aggregate by construction, with no second pass to forget and no
--     de-identified residue to argue about.
--   * De-identification would have to be argued: a small cohort plus a
--     timestamp plus a score distribution can re-identify (ADR-012's own words).
--     Deletion needs no argument.
--
-- WHAT IS DELIBERATELY NOT HERE: any grant. This function is executable only by
-- a role that bypasses RLS — an operator connection or a service task — because
-- §17.5's first step is verifying the requesting parent or guardian, and that
-- verification is a product flow that does not exist yet. Wiring a caller before
-- the verification exists would be the wrong half to build first.

-- ---------------------------------------------------------------------------
-- The audit, which must record the event and nothing about the person
-- ---------------------------------------------------------------------------
-- §17.5 step 7: "a minimal erasure audit that contains no deleted response or
-- profile payload". So: no name, no email, no score, no answer, no config.
--
-- The subject's uuid IS retained, and that is a considered choice rather than an
-- oversight. It is a random opaque identifier whose mapping to a human being —
-- the `auth.users` row and the profile — is deleted by this same function. What
-- remains is a record that an erasure happened, which is the evidence the
-- obligation itself requires; what does not remain is anything that could say
-- whose.
create table public.erasure_audit (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid        not null,
  erased_at    timestamptz not null default now(),
  -- Counts only. "How much was removed" is auditable without any of it being
  -- recorded, and a count that comes back non-zero on a second run would mean
  -- the first run did not finish.
  legacy_sessions_deleted    integer not null default 0,
  target_sessions_deleted    integer not null default 0,
  legacy_responses_deleted   integer not null default 0,
  marks_deleted              integer not null default 0,
  assignment_links_cleared   integer not null default 0,
  -- Free text about the REQUEST, never about the child. A ticket reference
  -- belongs here; a reason a parent gave in their own words does not.
  request_ref  text,
  constraint erasure_audit_request_ref_short check (request_ref is null or length(request_ref) <= 200)
);

alter table public.erasure_audit enable row level security;
revoke all on public.erasure_audit from anon, authenticated;
-- No policy, deliberately, as for platform_flags: with RLS on and no policy the
-- table is invisible to every role that does not bypass RLS. An erasure log is
-- not learner-facing, parent-facing or teacher-facing data.

comment on table public.erasure_audit is
  'One row per completed erasure (spec §17.5 step 7). Counts and a request reference only — no name, email, response, score or config. The subject uuid is retained because its mapping to a person is deleted by the same transaction.';

-- ---------------------------------------------------------------------------
-- erase_student — one transaction, both models, no reversible link left
-- ---------------------------------------------------------------------------
-- ORDER IS LOAD-BEARING, and it is dictated by two ON DELETE RESTRICT edges the
-- backfill deliberately created (ADR-005 §3):
--
--   assessment_sessions.legacy_session_id -> exam_sessions(id)   ON DELETE RESTRICT
--   assessment_results.legacy_attempt_id  -> exam_attempts(id)   ON DELETE RESTRICT
--
-- Those exist so a legacy row can never be deleted out from under the copy that
-- claims to reproduce it. The consequence here is that the TARGET model must be
-- erased first: deleting the legacy sitting while its copy still points at it
-- raises, which is the constraint doing its job. A workflow that deleted in the
-- obvious order would fail loudly on exactly the children who have been through
-- the cutover — which is better than succeeding halfway, and is why this is one
-- transaction rather than a script issuing statements.
create or replace function public.erase_student(
  p_student uuid,
  p_request_ref text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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
$$;

-- No grant to anon or authenticated, and the revoke is explicit because EXECUTE
-- is granted to PUBLIC by default on a new function and this project's local
-- stack additionally grants it per-role through ALTER DEFAULT PRIVILEGES.
revoke all on function public.erase_student(uuid, text) from public, anon, authenticated;

comment on function public.erase_student(uuid, text) is
  'Erases one child across BOTH storage models in one transaction (spec §17.5, ADR-012): sessions, responses, results, marks, assignment links, idempotency records, the profile and the auth identity. Target model first — the backfill''s ON DELETE RESTRICT edges require it. Executable only by a role that bypasses RLS: the requester-verification flow §17.5 step 1 requires does not exist yet.';
