-- MM-AUD-SEC-002: privilege escalation through classes.
--
-- The Phase 0 class policies checked ownership without ever checking role:
--
--   "classes: teacher creates own"  with check (teacher_id = auth.uid())
--   "classes: teacher updates own"  using/with check (teacher_id = auth.uid())
--   "class_students: teacher adds to own class"  with check (teaches_class(class_id))
--
-- Every authenticated identity satisfies teacher_id = auth.uid() for a row
-- it is inserting — that condition says "the class I am creating names me",
-- not "I am a teacher". So any signed-in user (a student, a parent, a
-- self-service sign-up) could create a class naming itself the teacher,
-- then add an arbitrary student UUID to its roster, since the roster gate
-- was teaches_class() alone — which the forged class had just satisfied.
--
-- What made that an escalation rather than a junk row is that
-- is_teacher_of_student() is not a read-only helper. It gates:
--
--   profiles / exam_sessions / exam_attempts  "teacher reads own class
--     students" (Phase 0) — read access to another child's identity, their
--     sessions and their scored attempts;
--   essay_marks INSERT and UPDATE (20260719110000) — the ability to WRITE
--     marks on another child's attempts, attributed to the attacker.
--
-- So the chain ended in writing to another learner's academic record. It
-- needed only an authenticated account and a known student UUID.
--
-- Three changes, because closing only the first door leaves the others:
--
--   1. classes INSERT/UPDATE now require the caller to actually hold
--      role = 'teacher'.
--   2. class_students INSERT now requires BOTH that the caller is a teacher
--      and that the target profile is a student. The caller check is not
--      redundant with (1): teaches_class() would still return true for a
--      class row that predates this migration, so without it a non-teacher
--      holding such a row could still attach learners. The target check
--      stops a roster being used to point at a parent, teacher or admin
--      profile.
--   3. teaches_class() and is_teacher_of_student() now additionally require
--      the class's OWNER to hold role = 'teacher'.
--
-- (3) is what makes this safe to deploy without a data migration. Policies
-- only govern new writes; a class row forged before this migration would
-- otherwise keep working forever, because every downstream check went
-- through those two helpers. Hardening the helpers neutralises such a row
-- in place — it stops conferring anything — without deleting data that an
-- operator has not looked at. Verified on the live project before writing
-- this: 0 classes, 0 roster entries, 0 essay_marks and 0 teacher profiles
-- exist, so nothing has been exploited and there is nothing to clean up.
-- The detection query, for any other environment:
--
--   select c.* from public.classes c
--   join public.profiles p on p.id = c.teacher_id
--   where p.role <> 'teacher';
--
-- No legitimate flow changes. A genuine teacher holds role = 'teacher', so
-- both helpers return exactly what they did before for every real class,
-- and the assignments policies that also build on teaches_class() are
-- unaffected. Nothing in the application calls either helper directly (the
-- teacher marking route relies on the policies themselves; see
-- src/app/api/teacher/marking/route.ts).
--
-- The role lookups go through SECURITY DEFINER helpers rather than an
-- inline subquery on public.profiles, for the reason the Phase 0 helpers
-- exist: a subquery inside a policy is evaluated under the CALLER's own
-- RLS. profiles is readable only for your own row, your linked children, or
-- students already in your class — so an inline check of the roster target
-- would have returned false for exactly the case that must work, a teacher
-- adding a student who is not yet in any of their classes.

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------

-- "Is the caller a teacher." Distinct from teaches_class(), which asks
-- about one class; this asks about the identity itself.
create or replace function public.caller_is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'teacher'
  );
$$;

-- "Is this profile a student." Used for the roster target, which is someone
-- other than the caller and therefore usually unreadable to them.
create or replace function public.is_student_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target
      and p.role = 'student'
  );
$$;

-- ---------------------------------------------------------------------------
-- Hardened helpers — the class owner must be a teacher
--
-- Same signature and same semantics for every genuine class; the added
-- join is what stops a forged or legacy class row from conferring teacher
-- authority over the learners on its roster.
-- ---------------------------------------------------------------------------

create or replace function public.teaches_class(class_row uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.classes c
    join public.profiles p on p.id = c.teacher_id
    where c.id = class_row
      and c.teacher_id = auth.uid()
      and p.role = 'teacher'
  );
$$;

create or replace function public.is_teacher_of_student(student uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    join public.profiles p on p.id = c.teacher_id
    where cs.student_id = student
      and c.teacher_id = auth.uid()
      and p.role = 'teacher'
  );
$$;

-- ---------------------------------------------------------------------------
-- classes — creating and renaming a class is a teacher action
-- ---------------------------------------------------------------------------

drop policy "classes: teacher creates own" on public.classes;

create policy "classes: teacher creates own" on public.classes
  for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and public.caller_is_teacher()
  );

drop policy "classes: teacher updates own" on public.classes;

-- The role condition is in USING as well as WITH CHECK: USING decides which
-- rows are visible to the update at all, so without it a non-teacher
-- holding a pre-existing class row could still edit it.
create policy "classes: teacher updates own" on public.classes
  for update to authenticated
  using (
    teacher_id = auth.uid()
    and public.caller_is_teacher()
  )
  with check (
    teacher_id = auth.uid()
    and public.caller_is_teacher()
  );

-- SELECT and DELETE are deliberately left alone. Reading or deleting your
-- own class row confers nothing on anyone else — it is the roster, not the
-- class, that grants authority over a learner — and a non-teacher who
-- somehow holds a row should still be able to remove it.

-- ---------------------------------------------------------------------------
-- class_students — the roster is the actual grant of authority
-- ---------------------------------------------------------------------------

drop policy "class_students: teacher adds to own class" on public.class_students;

create policy "class_students: teacher adds to own class" on public.class_students
  for insert to authenticated
  with check (
    public.teaches_class(class_id)
    and public.caller_is_teacher()
    and public.is_student_profile(student_id)
  );
