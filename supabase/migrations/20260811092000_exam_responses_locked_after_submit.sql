-- Locks a session's autosave row once its attempt exists.
--
-- public.exam_responses (20260719100000) is the one exam table a student
-- still writes directly, and correctly so: it holds only candidate
-- responses, a question index and a flag list — no question, no answer key,
-- no score. But its policies were scoped by ownership alone
-- (student_id = auth.uid()), with no notion of the session being finished,
-- so the row stayed writable for as long as the session row existed.
--
-- That leaves a rewrite-after-the-fact path. exam_attempts is immutable
-- (no update or delete policy, by design), so a submitted score cannot be
-- edited — but exam_responses is the record of what the student actually
-- answered, and it is what the resume flow reads and what a dispute over a
-- marked answer would be checked against. A student who has submitted could
-- PATCH their autosave row over PostgREST afterwards and leave the stored
-- responses disagreeing with the responses the attempt was scored from.
-- The autosave route already refuses this (it returns 409 already_submitted
-- when an attempt exists), which is precisely why the gap mattered: the
-- rule existed only in the route, and the route is not the only way in.
--
-- The guard is "an exam_attempts row exists for this session" rather than a
-- flag on the session, because that row IS the definition of submitted
-- everywhere else in this schema — the submit route's pre-check, the
-- autosave route's own 409, and the unique constraint from 20260722100000
-- all key off it. Adding a separate boolean would create a second answer to
-- the same question.
--
-- Both INSERT and UPDATE are guarded, not UPDATE alone. The autosave
-- endpoint upserts (on conflict session_id), so for a session that was
-- never autosaved mid-exam the post-submission write is an INSERT, not an
-- UPDATE — guarding only the update would leave that case open and would
-- also make the two halves of one upsert disagree.
--
-- No behaviour changes for a live exam: before submission no attempt row
-- exists, session_has_attempt() is false, and both policies read exactly as
-- they did.

-- Same SECURITY DEFINER shape as the Phase 0 RLS helpers (is_parent_of,
-- is_teacher_of_student, ...) and for the same reason: a policy that
-- sub-queried public.exam_attempts directly would have that subquery
-- evaluated under the caller's own RLS, making the guard depend on the
-- caller's read policies rather than on the fact being asked about. This
-- answers "does an attempt exist for this session" independently of who is
-- asking.
create or replace function public.session_has_attempt(session uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.exam_attempts a
    where a.session_id = session
  );
$$;

grant execute on function public.session_has_attempt(uuid) to authenticated;

-- Recreated rather than altered: a policy's USING/WITH CHECK cannot be
-- amended in place, and both need the new condition.
drop policy "exam_responses: student inserts own" on public.exam_responses;

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
    and not public.session_has_attempt(session_id)
  );

drop policy "exam_responses: student updates own" on public.exam_responses;

-- USING and WITH CHECK carry the same guard: USING decides which existing
-- rows the update can see (a submitted session's row becomes invisible to
-- UPDATE), WITH CHECK decides what the updated row may look like, and the
-- upsert path in the autosave route needs both to hold.
create policy "exam_responses: student updates own" on public.exam_responses
  for update to authenticated
  using (
    student_id = auth.uid()
    and not public.session_has_attempt(session_id)
  )
  with check (
    student_id = auth.uid()
    and not public.session_has_attempt(session_id)
  );
