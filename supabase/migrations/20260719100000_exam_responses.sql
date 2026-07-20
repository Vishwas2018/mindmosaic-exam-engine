-- Debounced in-progress answer autosave. Session creation and the final
-- result already persist server-side (exam_sessions / exam_attempts, see
-- the Phase 0 migration and docs/DATA_MODEL_AND_ROLES.md); this table
-- closes the one remaining gap — in-progress responses between those two
-- points, so a browser refresh mid-exam no longer loses them.
--
-- One row per session (session_id is the primary key), upserted
-- repeatedly by the debounced autosave endpoint. It never holds a
-- question, an answer key, or a score — only the same candidate-response
-- shape the exam UI already collects (ExamResponses, keyed by question
-- id), plus the current question index and flags needed to resume
-- exactly where the student left off. See
-- docs/ASSESSMENT_SECURITY_MODEL.md: nothing added here crosses the
-- candidate/authoring boundary.

create table public.exam_responses (
  session_id uuid primary key references public.exam_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  responses jsonb not null default '{}'::jsonb,
  current_question_index int not null default 0,
  flagged_question_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security — same default-deny pattern as every other table
-- holding a student's own exam data (see the Phase 0 migration): RLS
-- enabled, anon fully revoked, a student may only select/insert/update
-- their own rows.
-- ---------------------------------------------------------------------------

alter table public.exam_responses enable row level security;

revoke all on public.exam_responses from anon;

-- Explicit grants rather than relying on Supabase's legacy auto-expose
-- default for new tables: a fresh local instance (auto_expose_new_tables
-- off, the CLI's current default) grants authenticated only
-- REFERENCES/TRIGGER/TRUNCATE on a newly created table otherwise, which
-- would fail every autosave and resume read closed before RLS is ever
-- evaluated (see docs/RLS_TEST_PLAN.md's "How to run" section for the
-- full finding from the last time this bit a fresh local instance). Being
-- explicit here means this table works regardless of that CLI default.
grant select, insert, update on public.exam_responses to authenticated;

create policy "exam_responses: student reads own" on public.exam_responses
  for select to authenticated
  using (student_id = auth.uid());

-- A student may only attach an autosave row to their own session — same
-- shape as the "exam_attempts: student submits own" insert policy.
create policy "exam_responses: student inserts own" on public.exam_responses
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1
      from public.exam_sessions s
      where s.id = session_id
        and s.student_id = auth.uid()
    )
  );

create policy "exam_responses: student updates own" on public.exam_responses
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- No delete policy: a stale autosave row left after submission duplicates
-- content exam_attempts.responses already recorded permanently, and
-- cleaning it up is not required for this feature.
