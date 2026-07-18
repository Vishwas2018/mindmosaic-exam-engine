-- Phase 0: roles, data model, and server-authoritative exam storage.
-- Implements the schema and Row Level Security rules defined in
-- docs/DATA_MODEL_AND_ROLES.md. Every table holding student data is
-- RLS-enabled and default-deny; anon has no access to any of them.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('student', 'parent', 'teacher', 'admin')),
  display_name text,
  -- Students only (3 or 5); null for every other role.
  year_level int check (year_level is null or year_level in (3, 5)),
  created_at timestamptz not null default now()
);

create table public.parent_children (
  parent_id uuid not null references public.profiles (id) on delete cascade,
  child_id uuid not null references public.profiles (id) on delete cascade,
  primary key (parent_id, child_id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  year_level int,
  created_at timestamptz not null default now()
);

create table public.class_students (
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  primary key (class_id, student_id)
);

-- One row per started, server-selected exam. selected_question_ids is chosen
-- by the server and never client-supplied — see docs/ASSESSMENT_SECURITY_MODEL.md.
create table public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  config jsonb not null,
  seed text not null,
  selected_question_ids text[] not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- One row per submitted result. result is the full ExamResult, computed
-- server-side from the server's own copy of the question bank.
create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.exam_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  responses jsonb not null,
  result jsonb not null,
  submitted_at timestamptz not null default now()
);

-- Teacher-created assignments (Phase 3 feature; schema and RLS land now so
-- the model is complete and later phases only add UI).
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  config jsonb not null,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.assignment_students (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'assigned'
    check (status in ('assigned', 'in_progress', 'submitted')),
  attempt_id uuid references public.exam_attempts (id) on delete set null,
  primary key (assignment_id, student_id)
);

create index exam_sessions_student_id_idx on public.exam_sessions (student_id);
create index exam_attempts_student_id_idx on public.exam_attempts (student_id);
create index exam_attempts_session_id_idx on public.exam_attempts (session_id);
create index class_students_student_id_idx on public.class_students (student_id);
create index parent_children_child_id_idx on public.parent_children (child_id);
create index assignments_class_id_idx on public.assignments (class_id);
create index assignment_students_student_id_idx on public.assignment_students (student_id);

-- ---------------------------------------------------------------------------
-- Role assignment on sign-up
-- ---------------------------------------------------------------------------

-- Creates the profiles row when a Supabase Auth user is created. Only the
-- self-service roles can come from client-supplied metadata; anything else
-- (including 'teacher' and 'admin', which are assigned manually in the
-- database) falls back to 'student'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    case when requested_role in ('student', 'parent') then requested_role else 'student' end,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS helper functions
--
-- Policies below only ever compare a row's own columns to auth.uid() or call
-- one of these SECURITY DEFINER helpers. The helpers bypass RLS for their
-- internal lookup, which keeps cross-table policies (parent -> children,
-- teacher -> class roster) from recursing into each other's policies.
-- ---------------------------------------------------------------------------

create or replace function public.is_parent_of(child uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.parent_children pc
    where pc.parent_id = auth.uid()
      and pc.child_id = child
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
    where cs.student_id = student
      and c.teacher_id = auth.uid()
  );
$$;

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
    where c.id = class_row
      and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_member_of_class(class_row uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.class_students cs
    where cs.class_id = class_row
      and cs.student_id = auth.uid()
  );
$$;

create or replace function public.teaches_assignment(assignment uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.assignments a
    join public.classes c on c.id = a.class_id
    where a.id = assignment
      and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_assigned_to(assignment uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.assignment_students ast
    where ast.assignment_id = assignment
      and ast.student_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Default-deny: enabling RLS with no anon policies means anon can read and
-- write nothing. The explicit revokes below are belt-and-braces on top of
-- that. Policies are granted to authenticated only.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.parent_children enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_students enable row level security;

revoke all on public.profiles from anon;
revoke all on public.parent_children from anon;
revoke all on public.classes from anon;
revoke all on public.class_students from anon;
revoke all on public.exam_sessions from anon;
revoke all on public.exam_attempts from anon;
revoke all on public.assignments from anon;
revoke all on public.assignment_students from anon;

-- profiles ------------------------------------------------------------------

create policy "profiles: own row" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles: parent reads linked children" on public.profiles
  for select to authenticated
  using (public.is_parent_of(id));

create policy "profiles: teacher reads own class students" on public.profiles
  for select to authenticated
  using (public.is_teacher_of_student(id));

-- Updates are limited at the column level so a user can never change their
-- own role: only display_name and year_level are grantable.
revoke update on public.profiles from authenticated;
grant update (display_name, year_level) on public.profiles to authenticated;

create policy "profiles: update own row" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No insert policy: profile rows are created by the on_auth_user_created
-- trigger (security definer), or manually for teacher/admin.

-- parent_children -----------------------------------------------------------

-- Links are created manually (or via a later, explicit linking flow using the
-- service role); clients can only read links they are part of.
create policy "parent_children: own links" on public.parent_children
  for select to authenticated
  using (parent_id = auth.uid() or child_id = auth.uid());

-- classes -------------------------------------------------------------------

create policy "classes: teacher manages own" on public.classes
  for select to authenticated
  using (teacher_id = auth.uid());

create policy "classes: teacher creates own" on public.classes
  for insert to authenticated
  with check (teacher_id = auth.uid());

create policy "classes: teacher updates own" on public.classes
  for update to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "classes: teacher deletes own" on public.classes
  for delete to authenticated
  using (teacher_id = auth.uid());

create policy "classes: student reads own classes" on public.classes
  for select to authenticated
  using (public.is_member_of_class(id));

-- class_students ------------------------------------------------------------

create policy "class_students: student reads own membership" on public.class_students
  for select to authenticated
  using (student_id = auth.uid());

create policy "class_students: teacher reads own roster" on public.class_students
  for select to authenticated
  using (public.teaches_class(class_id));

create policy "class_students: teacher adds to own class" on public.class_students
  for insert to authenticated
  with check (public.teaches_class(class_id));

create policy "class_students: teacher removes from own class" on public.class_students
  for delete to authenticated
  using (public.teaches_class(class_id));

-- exam_sessions -------------------------------------------------------------

create policy "exam_sessions: student reads own" on public.exam_sessions
  for select to authenticated
  using (student_id = auth.uid());

create policy "exam_sessions: student creates own" on public.exam_sessions
  for insert to authenticated
  with check (student_id = auth.uid());

create policy "exam_sessions: parent reads linked children" on public.exam_sessions
  for select to authenticated
  using (public.is_parent_of(student_id));

create policy "exam_sessions: teacher reads own class students" on public.exam_sessions
  for select to authenticated
  using (public.is_teacher_of_student(student_id));

-- No update/delete policies: a session is immutable once created.

-- exam_attempts -------------------------------------------------------------

create policy "exam_attempts: student reads own" on public.exam_attempts
  for select to authenticated
  using (student_id = auth.uid());

-- A student may only attach an attempt to their own session.
create policy "exam_attempts: student submits own" on public.exam_attempts
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

create policy "exam_attempts: parent reads linked children" on public.exam_attempts
  for select to authenticated
  using (public.is_parent_of(student_id));

create policy "exam_attempts: teacher reads own class students" on public.exam_attempts
  for select to authenticated
  using (public.is_teacher_of_student(student_id));

-- No update/delete policies: an attempt is immutable once written.

-- assignments ---------------------------------------------------------------

create policy "assignments: teacher reads own classes" on public.assignments
  for select to authenticated
  using (public.teaches_class(class_id));

create policy "assignments: teacher creates for own class" on public.assignments
  for insert to authenticated
  with check (created_by = auth.uid() and public.teaches_class(class_id));

create policy "assignments: teacher updates own classes" on public.assignments
  for update to authenticated
  using (public.teaches_class(class_id))
  with check (public.teaches_class(class_id));

create policy "assignments: teacher deletes own classes" on public.assignments
  for delete to authenticated
  using (public.teaches_class(class_id));

create policy "assignments: student reads assigned" on public.assignments
  for select to authenticated
  using (public.is_assigned_to(id));

-- assignment_students -------------------------------------------------------

create policy "assignment_students: student reads own" on public.assignment_students
  for select to authenticated
  using (student_id = auth.uid());

create policy "assignment_students: teacher reads own assignments" on public.assignment_students
  for select to authenticated
  using (public.teaches_assignment(assignment_id));

create policy "assignment_students: teacher assigns own" on public.assignment_students
  for insert to authenticated
  with check (public.teaches_assignment(assignment_id));

create policy "assignment_students: teacher updates own" on public.assignment_students
  for update to authenticated
  using (public.teaches_assignment(assignment_id))
  with check (public.teaches_assignment(assignment_id));

create policy "assignment_students: teacher removes own" on public.assignment_students
  for delete to authenticated
  using (public.teaches_assignment(assignment_id));
