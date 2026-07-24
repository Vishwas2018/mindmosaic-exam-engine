-- MM-AUTH-01: the "exam_sessions: student creates own" insert policy only
-- ever checked ownership (student_id = auth.uid()), never role. A parent
-- or teacher signed in under their own account satisfies student_id =
-- auth.uid() just as readily as a real student, so either could insert a
-- genuine exam_sessions row attributed to themselves. Every real student
-- profile is parent-provisioned (see src/features/auth/provision-child.ts),
-- so role = 'student' is the complete, correct set of authorised
-- identities for this insert — re-added here as a second, independent
-- enforcement point alongside the same check now in
-- src/app/api/exam/session/route.ts (route checks give a clear error
-- code; RLS is the real boundary, per the pattern already used
-- throughout this schema).

drop policy "exam_sessions: student creates own" on public.exam_sessions;

create policy "exam_sessions: student creates own" on public.exam_sessions
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'student'
    )
  );
