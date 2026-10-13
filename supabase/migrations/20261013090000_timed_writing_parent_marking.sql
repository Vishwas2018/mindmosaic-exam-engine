-- Timed writing practice with parent rubric marking.
--
-- WHY NEW TABLES AND NOT manual_marks. manual_marks.session_id is a hard FK to
-- assessment_sessions, which needs pinned published item_versions and a valid
-- programme offering. An unapproved writing task can have neither, and adding an
-- offering is catalogue work this feature must not do. So writing carries its
-- own attempt row and the SAME marking model as essay_marks / manual_marks:
--   * the ceiling (max_marks) is derived server-side from the rubric, never sent;
--   * the marker is auth.uid(), never a parameter;
--   * writes go through SECURITY DEFINER functions, never direct DML;
--   * "pending" is the absence of a writing_marks row, not a stored status;
--   * a mark is never deleted (re-marking updates it).
-- Per-criterion scores are the one addition (writing_mark_criteria).
--
-- DEADLINE. deadline_at is set once, by the server, when a timed attempt
-- starts. submit_writing_attempt mirrors state/deadline.ts exactly: a
-- submission at or after the deadline is authoritatively `timer_expired`,
-- whatever the caller claimed, and submitted_at is clamped to the deadline.
--
-- NO AI. Nothing here scores, rewrites or comments on a child's writing
-- (docs/design.md section 29.3). Marks come from a linked parent.

-- ---------------------------------------------------------------------------
-- writing_rubrics: rubrics stored as data
-- ---------------------------------------------------------------------------
create table public.writing_rubrics (
  id          text     not null,
  version     integer  not null check (version >= 1),
  title       text     not null,
  scale_min   smallint not null default 1,
  scale_max   smallint not null default 5,
  -- [{ "id": "punctuation", "label": "Punctuation" }, ...]. Descriptive anchors
  -- live in src/features/writing/rubrics (long prose, and the UI is their only
  -- reader); the server only needs ids and the scale, and
  -- src/tests/unit/writing-rubric.test.ts pins the two copies together.
  criteria    jsonb    not null check (jsonb_typeof(criteria) = 'array' and jsonb_array_length(criteria) between 1 and 12),
  primary key (id, version),
  constraint writing_rubrics_scale check (scale_min >= 0 and scale_max > scale_min)
);

insert into public.writing_rubrics (id, version, title, scale_min, scale_max, criteria)
values (
  'scholarship-written-expression', 1, 'Scholarship-style written expression', 1, 5,
  '[{"id":"punctuation","label":"Punctuation"},
    {"id":"creativity","label":"Creativity"},
    {"id":"construction","label":"Construction"},
    {"id":"grammar","label":"Grammar"},
    {"id":"spelling","label":"Spelling"},
    {"id":"relevance","label":"Relevance"}]'::jsonb
);

-- ---------------------------------------------------------------------------
-- writing_attempts
-- ---------------------------------------------------------------------------
create table public.writing_attempts (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.profiles (id) on delete cascade,
  -- Task id from src/features/writing; not a foreign key (tasks live in code).
  task_id          text not null check (char_length(task_id) between 1 and 120),
  -- timed: on screen against deadline_at. untimed: on screen, no deadline.
  -- paper: sat on paper; a parent typed the response in afterwards.
  mode             text not null check (mode in ('timed', 'untimed', 'paper')),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 60 and 3600),
  started_at       timestamptz not null default now(),
  deadline_at      timestamptz,
  response_text    text not null default '' check (char_length(response_text) <= 20000),
  response_source  text not null default 'student_typed' check (response_source in ('student_typed', 'parent_typed')),
  draft_saved_at   timestamptz,
  submitted_at     timestamptz,
  submission_reason text check (submission_reason in ('user_submitted', 'timer_expired')),
  created_by       uuid not null references public.profiles (id) on delete cascade,
  constraint writing_attempts_timed_has_deadline check (
    (mode = 'timed' and deadline_at is not null and duration_seconds is not null)
    or (mode <> 'timed' and deadline_at is null)
  ),
  constraint writing_attempts_submitted_pair check (
    (submitted_at is null) = (submission_reason is null)
  ),
  constraint writing_attempts_paper_is_submitted check (mode <> 'paper' or submitted_at is not null)
);

create index writing_attempts_student_idx on public.writing_attempts (student_id, started_at desc);
-- One open (unsubmitted) attempt per child per task: starting again resumes.
create unique index writing_attempts_one_open_per_task
  on public.writing_attempts (student_id, task_id) where submitted_at is null;

-- ---------------------------------------------------------------------------
-- writing_marks / writing_mark_criteria
-- ---------------------------------------------------------------------------
create table public.writing_marks (
  id             uuid primary key default gen_random_uuid(),
  attempt_id     uuid not null unique references public.writing_attempts (id) on delete cascade,
  rubric_id      text not null,
  rubric_version integer not null,
  marked_by      uuid not null references public.profiles (id) on delete cascade,
  awarded_marks  numeric not null check (awarded_marks >= 0),
  max_marks      numeric not null check (max_marks > 0),
  feedback       text check (feedback is null or char_length(feedback) <= 2000),
  marked_at      timestamptz not null default now(),
  foreign key (rubric_id, rubric_version) references public.writing_rubrics (id, version),
  constraint writing_marks_awarded_within_max check (awarded_marks <= max_marks)
);

create table public.writing_mark_criteria (
  mark_id      uuid     not null references public.writing_marks (id) on delete cascade,
  criterion_id text     not null,
  score        smallint not null check (score between 0 and 10),
  comment      text check (comment is null or char_length(comment) <= 500),
  primary key (mark_id, criterion_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security: read only. Every write is a function below.
-- ---------------------------------------------------------------------------
alter table public.writing_rubrics         enable row level security;
alter table public.writing_attempts        enable row level security;
alter table public.writing_marks           enable row level security;
alter table public.writing_mark_criteria   enable row level security;

revoke all on public.writing_rubrics, public.writing_attempts, public.writing_marks,
  public.writing_mark_criteria from anon, authenticated;
grant select on public.writing_rubrics, public.writing_attempts, public.writing_marks,
  public.writing_mark_criteria to authenticated;

create policy "writing_rubrics: signed-in read" on public.writing_rubrics
  for select to authenticated using (true);

create policy "writing_attempts: student reads own" on public.writing_attempts
  for select to authenticated using (student_id = auth.uid());
create policy "writing_attempts: parent reads linked children" on public.writing_attempts
  for select to authenticated using (public.is_parent_of(student_id));

create policy "writing_marks: student reads own" on public.writing_marks
  for select to authenticated
  using (exists (select 1 from public.writing_attempts a where a.id = attempt_id and a.student_id = auth.uid()));
create policy "writing_marks: parent reads linked children" on public.writing_marks
  for select to authenticated
  using (exists (select 1 from public.writing_attempts a where a.id = attempt_id and public.is_parent_of(a.student_id)));

create policy "writing_mark_criteria: student reads own" on public.writing_mark_criteria
  for select to authenticated
  using (exists (
    select 1 from public.writing_marks m join public.writing_attempts a on a.id = m.attempt_id
    where m.id = mark_id and a.student_id = auth.uid()));
create policy "writing_mark_criteria: parent reads linked children" on public.writing_mark_criteria
  for select to authenticated
  using (exists (
    select 1 from public.writing_marks m join public.writing_attempts a on a.id = m.attempt_id
    where m.id = mark_id and public.is_parent_of(a.student_id)));

-- ---------------------------------------------------------------------------
-- Functions. Error codes MM310-MM313 (MM301-MM304 are already taken).
--   MM310 not found / not yours (one code for both, so existence never leaks)
--   MM311 attempt already submitted / not yet submitted for the operation
--   MM312 invalid argument
--   MM313 attempt has expired and can only be submitted
-- ---------------------------------------------------------------------------

create or replace function public.start_writing_attempt(
  p_task_id text, p_mode text, p_duration_seconds integer
) returns public.writing_attempts
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_row public.writing_attempts;
begin
  if v_user is null or not exists (select 1 from public.profiles where id = v_user and role = 'student') then
    raise exception 'only a student can start a writing attempt' using errcode = 'MM310';
  end if;
  if p_mode not in ('timed', 'untimed') then
    raise exception 'mode must be timed or untimed' using errcode = 'MM312';
  end if;
  if p_mode = 'timed' and (p_duration_seconds is null or p_duration_seconds not between 60 and 3600) then
    raise exception 'a timed attempt needs a duration of 60 to 3600 seconds' using errcode = 'MM312';
  end if;

  -- Resume the open attempt for this task rather than starting a second clock.
  select * into v_row from public.writing_attempts
  where student_id = v_user and task_id = p_task_id and submitted_at is null;
  if found then
    return v_row;
  end if;

  insert into public.writing_attempts
    (student_id, task_id, mode, duration_seconds, started_at, deadline_at, created_by)
  values (
    v_user, p_task_id, p_mode,
    case when p_mode = 'timed' then p_duration_seconds end,
    now(),
    case when p_mode = 'timed' then now() + make_interval(secs => p_duration_seconds) end,
    v_user
  )
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.save_writing_draft(p_attempt_id uuid, p_text text)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row public.writing_attempts;
begin
  select * into v_row from public.writing_attempts
  where id = p_attempt_id and student_id = auth.uid();
  if not found then
    raise exception 'no such writing attempt' using errcode = 'MM310';
  end if;
  if v_row.submitted_at is not null then
    raise exception 'attempt already submitted' using errcode = 'MM311';
  end if;
  /* Past the deadline nothing more is autosaved; the only thing left is the
     final submit, which carries the text itself (same as the exam engine). */
  if v_row.deadline_at is not null and now() >= v_row.deadline_at then
    raise exception 'attempt has expired' using errcode = 'MM313';
  end if;
  if p_text is null or char_length(p_text) > 20000 then
    raise exception 'invalid response text' using errcode = 'MM312';
  end if;
  update public.writing_attempts
     set response_text = p_text, draft_saved_at = now()
   where id = p_attempt_id;
  return now();
end;
$$;

create or replace function public.submit_writing_attempt(
  p_attempt_id uuid, p_text text, p_reason text
) returns public.writing_attempts
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row public.writing_attempts;
  v_reason text;
  v_at timestamptz;
begin
  if p_reason not in ('user_submitted', 'timer_expired') then
    raise exception 'invalid submission reason' using errcode = 'MM312';
  end if;
  if p_text is not null and char_length(p_text) > 20000 then
    raise exception 'invalid response text' using errcode = 'MM312';
  end if;

  select * into v_row from public.writing_attempts
  where id = p_attempt_id and student_id = auth.uid()
  for update;
  if not found then
    raise exception 'no such writing attempt' using errcode = 'MM310';
  end if;
  -- Idempotent: a retry after the first submit changes nothing.
  if v_row.submitted_at is not null then
    return v_row;
  end if;

  -- state/deadline.ts: expiry is exclusive of the instant it names, the
  -- reason is advisory once the deadline has passed, and the recorded time is
  -- clamped to the deadline.
  if v_row.deadline_at is not null and now() >= v_row.deadline_at then
    v_reason := 'timer_expired';
  else
    v_reason := p_reason;
  end if;
  v_at := case when v_row.deadline_at is not null and now() > v_row.deadline_at
               then v_row.deadline_at else now() end;

  update public.writing_attempts
     set response_text = coalesce(p_text, response_text),
         submitted_at = v_at,
         submission_reason = v_reason
   where id = p_attempt_id
  returning * into v_row;
  return v_row;
end;
$$;

-- A parent records a response that was handwritten on paper. Creates an
-- already-submitted `paper` attempt for a linked child.
create or replace function public.record_paper_writing_attempt(
  p_child uuid, p_task_id text, p_text text, p_duration_seconds integer
) returns public.writing_attempts
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_row public.writing_attempts;
begin
  if auth.uid() is null or not public.is_parent_of(p_child) then
    raise exception 'no such linked child' using errcode = 'MM310';
  end if;
  if p_text is null or char_length(btrim(p_text)) = 0 or char_length(p_text) > 20000 then
    raise exception 'a typed response is required' using errcode = 'MM312';
  end if;
  if p_duration_seconds is not null and p_duration_seconds not between 60 and 3600 then
    raise exception 'invalid duration' using errcode = 'MM312';
  end if;
  insert into public.writing_attempts
    (student_id, task_id, mode, duration_seconds, started_at, response_text,
     response_source, submitted_at, submission_reason, created_by)
  values (p_child, p_task_id, 'paper', p_duration_seconds, now(), p_text,
          'parent_typed', now(), 'user_submitted', auth.uid())
  returning * into v_row;
  return v_row;
end;
$$;

-- A linked parent marks a submitted attempt against a rubric.
-- p_scores:   { "<criterionId>": <whole-number score>, ... }  (every criterion, exactly)
-- p_comments: { "<criterionId>": "<optional comment>", ... }
create or replace function public.mark_writing_attempt(
  p_attempt_id uuid, p_rubric_id text, p_rubric_version integer,
  p_scores jsonb, p_comments jsonb, p_feedback text
) returns public.writing_marks
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_attempt public.writing_attempts;
  v_rubric public.writing_rubrics;
  v_mark public.writing_marks;
  v_crit jsonb;
  v_id text;
  v_score integer;
  v_total integer := 0;
  v_count integer := 0;
begin
  select a.* into v_attempt from public.writing_attempts a
  where a.id = p_attempt_id and auth.uid() is not null and public.is_parent_of(a.student_id);
  if not found then
    raise exception 'no markable attempt visible to this caller' using errcode = 'MM310';
  end if;
  if v_attempt.submitted_at is null then
    raise exception 'attempt has not been submitted' using errcode = 'MM311';
  end if;

  select * into v_rubric from public.writing_rubrics where id = p_rubric_id and version = p_rubric_version;
  if not found then
    raise exception 'unknown rubric' using errcode = 'MM312';
  end if;
  if p_scores is null or jsonb_typeof(p_scores) <> 'object'
     or (select count(*) from jsonb_object_keys(p_scores)) <> jsonb_array_length(v_rubric.criteria) then
    raise exception 'scores must cover every rubric criterion exactly' using errcode = 'MM312';
  end if;

  for v_crit in select * from jsonb_array_elements(v_rubric.criteria) loop
    v_id := v_crit ->> 'id';
    if not (p_scores ? v_id) or jsonb_typeof(p_scores -> v_id) <> 'number' then
      raise exception 'missing score for %', v_id using errcode = 'MM312';
    end if;
    v_score := (p_scores ->> v_id)::numeric::integer;
    if (p_scores ->> v_id)::numeric <> v_score or v_score < v_rubric.scale_min or v_score > v_rubric.scale_max then
      raise exception 'score for % must be a whole number % to %', v_id, v_rubric.scale_min, v_rubric.scale_max
        using errcode = 'MM312';
    end if;
    v_total := v_total + v_score;
    v_count := v_count + 1;
  end loop;

  insert into public.writing_marks as m
    (attempt_id, rubric_id, rubric_version, marked_by, awarded_marks, max_marks, feedback, marked_at)
  values (p_attempt_id, v_rubric.id, v_rubric.version, auth.uid(), v_total,
          v_count * v_rubric.scale_max, nullif(btrim(p_feedback), ''), now())
  on conflict (attempt_id) do update
    set rubric_id = excluded.rubric_id, rubric_version = excluded.rubric_version,
        marked_by = excluded.marked_by, awarded_marks = excluded.awarded_marks,
        max_marks = excluded.max_marks, feedback = excluded.feedback, marked_at = excluded.marked_at
  returning * into v_mark;

  delete from public.writing_mark_criteria where mark_id = v_mark.id;
  insert into public.writing_mark_criteria (mark_id, criterion_id, score, comment)
  select v_mark.id, c ->> 'id', (p_scores ->> (c ->> 'id'))::numeric::integer,
         nullif(left(btrim(coalesce(p_comments ->> (c ->> 'id'), '')), 500), '')
  from jsonb_array_elements(v_rubric.criteria) c;

  return v_mark;
end;
$$;

revoke all on function public.start_writing_attempt(text, text, integer) from public, anon;
revoke all on function public.save_writing_draft(uuid, text) from public, anon;
revoke all on function public.submit_writing_attempt(uuid, text, text) from public, anon;
revoke all on function public.record_paper_writing_attempt(uuid, text, text, integer) from public, anon;
revoke all on function public.mark_writing_attempt(uuid, text, integer, jsonb, jsonb, text) from public, anon;
grant execute on function public.start_writing_attempt(text, text, integer) to authenticated;
grant execute on function public.save_writing_draft(uuid, text) to authenticated;
grant execute on function public.submit_writing_attempt(uuid, text, text) to authenticated;
grant execute on function public.record_paper_writing_attempt(uuid, text, text, integer) to authenticated;
grant execute on function public.mark_writing_attempt(uuid, text, integer, jsonb, jsonb, text) to authenticated;
