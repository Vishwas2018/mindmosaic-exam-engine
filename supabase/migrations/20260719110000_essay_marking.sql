-- Teacher marking workflow for manual-review (essay) responses.
--
-- exam_attempts.result already carries, per question, whether it is
-- pending manual review (src/features/exam-engine/scoring/question-scorers.ts
-- scoreEssay -> exam-report.ts QuestionResultDetail.pendingManualReview).
-- That result blob is immutable once written (see phase0 migration), so a
-- mark is never written back into it. Instead this table holds one row per
-- (attempt, question) once a teacher has actually recorded a mark for it.
--
-- "Pending" is therefore not a stored status value here — it is the
-- absence of a row for a question the server already flagged as
-- pendingManualReview. src/features/teacher/marking-data.ts is the single
-- place that joins exam_attempts.result against this table to derive the
-- pending queue; see its deriveMarkingQueue for the pure transition logic.

create table public.essay_marks (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts (id) on delete cascade,
  -- Content-bank question id (src/content/questions/**), not a DB foreign
  -- key: the question bank lives in code, not in Postgres.
  question_id text not null,
  marked_by uuid not null references public.profiles (id) on delete cascade,
  awarded_marks numeric not null check (awarded_marks >= 0),
  -- Captured at mark time from the question's own metadata.marks so a mark
  -- stays interpretable even if the bank content changes later.
  max_marks numeric not null check (max_marks >= 0),
  feedback text,
  marked_at timestamptz not null default now(),
  constraint essay_marks_awarded_within_max check (awarded_marks <= max_marks),
  unique (attempt_id, question_id)
);

create index essay_marks_attempt_id_idx on public.essay_marks (attempt_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Reuses the is_teacher_of_student helper from the phase0 migration: a
-- teacher may read or write a mark only when the underlying attempt
-- belongs to a student in one of their own classes. There is no student or
-- parent policy — individual per-question marks are not exposed to them
-- directly; aggregate results continue to flow through exam_attempts.result
-- as they already do.
-- ---------------------------------------------------------------------------

alter table public.essay_marks enable row level security;

revoke all on public.essay_marks from anon;

create policy "essay_marks: teacher reads own class students' marks" on public.essay_marks
  for select to authenticated
  using (
    exists (
      select 1
      from public.exam_attempts a
      where a.id = attempt_id
        and public.is_teacher_of_student(a.student_id)
    )
  );

create policy "essay_marks: teacher marks own class students" on public.essay_marks
  for insert to authenticated
  with check (
    marked_by = auth.uid()
    and exists (
      select 1
      from public.exam_attempts a
      where a.id = attempt_id
        and public.is_teacher_of_student(a.student_id)
    )
  );

create policy "essay_marks: teacher updates own class students' marks" on public.essay_marks
  for update to authenticated
  using (
    exists (
      select 1
      from public.exam_attempts a
      where a.id = attempt_id
        and public.is_teacher_of_student(a.student_id)
    )
  )
  with check (
    marked_by = auth.uid()
    and exists (
      select 1
      from public.exam_attempts a
      where a.id = attempt_id
        and public.is_teacher_of_student(a.student_id)
    )
  );

-- No delete policy: a recorded mark is kept as an audit trail; teachers
-- re-mark by updating awarded_marks/feedback, never by removing the row.
