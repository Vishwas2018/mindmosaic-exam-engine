-- Scalable assessment capabilities: stable families/offerings, governed audio,
-- immutable item groups, and version-pinned group membership. Additive only.

alter table public.item_versions drop constraint item_versions_answer_kind_known;
alter table public.item_versions add constraint item_versions_answer_kind_known
  check (answer_kind is null or answer_kind in (
    'single_option', 'multiple_options', 'number', 'text', 'fill_blank',
    'dropdown', 'boolean', 'matching', 'ordering', 'manual', 'hotspot',
    'drag_drop', 'hot_text', 'matrix', 'structured'
  ));

/* assessment_families, programmes and programme_offerings are NOT created
   here. This migration originally created them, but 20260822090000
   (programme_offering_authority, already on main) is their superset — same
   shapes plus subjects and a real FK — and its header comment documents
   this deletion as the reconciliation step for this migration on rebase.
   RLS-enable and revoke for the three tables live there too. */

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  stable_code text not null unique check (stable_code ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  retired_at timestamptz
);

create table public.media_asset_versions (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets (id) on delete restrict,
  revision integer not null check (revision >= 1),
  kind text not null check (kind = 'audio'),
  storage_bucket text not null check (storage_bucket = 'assessment-media'),
  storage_path text not null check (storage_path ~ '^audio/[a-z0-9][a-z0-9/_-]*\.(mp3|m4a|ogg|wav)$'),
  mime_type text not null check (mime_type in ('audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav')),
  duration_seconds numeric not null check (duration_seconds > 0 and duration_seconds <= 3600),
  title text not null,
  learner_instruction text,
  max_plays smallint check (max_plays between 1 and 20),
  autoplay boolean not null default false check (autoplay = false),
  fallback_message text not null,
  accommodation_required boolean not null default true,
  creator text not null,
  licence text not null,
  copyright_notice text not null,
  sha256 text not null unique check (sha256 ~ '^[a-f0-9]{64}$'),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 50000000),
  published_at timestamptz not null,
  constraint media_asset_versions_revision_key unique (media_asset_id, revision)
);

create table public.media_asset_private_scripts (
  media_asset_version_id uuid primary key references public.media_asset_versions (id) on delete restrict,
  visibility text not null check (visibility in ('learner', 'review_only', 'accommodation_only')),
  script text not null,
  rubric_version text
);

create table public.item_version_media (
  item_version_id uuid not null references public.item_versions (id) on delete restrict,
  media_asset_version_id uuid not null references public.media_asset_versions (id) on delete restrict,
  ordinal smallint not null check (ordinal >= 1),
  primary key (item_version_id, media_asset_version_id),
  constraint item_version_media_ordinal_key unique (item_version_id, ordinal)
);

create table public.item_groups (
  id uuid primary key default gen_random_uuid(),
  stable_code text not null unique check (stable_code ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  item_family_id text,
  created_at timestamptz not null default now(),
  retired_at timestamptz
);

create table public.item_group_versions (
  id uuid primary key default gen_random_uuid(),
  item_group_id uuid not null references public.item_groups (id) on delete restrict,
  revision integer not null check (revision >= 1),
  title text not null,
  shared_instructions text,
  accessibility jsonb not null,
  content_hash text not null unique check (content_hash ~ '^[a-f0-9]{64}$'),
  published_at timestamptz not null,
  constraint item_group_versions_revision_key unique (item_group_id, revision)
);

create table public.item_group_version_stimuli (
  item_group_version_id uuid not null references public.item_group_versions (id) on delete restrict,
  stimulus_version_id uuid not null references public.stimulus_versions (id) on delete restrict,
  ordinal smallint not null check (ordinal >= 1),
  primary key (item_group_version_id, stimulus_version_id),
  constraint item_group_version_stimuli_ordinal_key unique (item_group_version_id, ordinal)
);

create table public.item_group_version_items (
  item_group_version_id uuid not null references public.item_group_versions (id) on delete restrict,
  item_version_id uuid not null references public.item_versions (id) on delete restrict,
  ordinal smallint not null check (ordinal >= 1),
  part_label text check (part_label is null or length(part_label) between 1 and 20),
  primary key (item_group_version_id, item_version_id),
  constraint item_group_version_items_ordinal_key unique (item_group_version_id, ordinal)
);

alter table public.assessment_session_items
  add column item_group_version_id uuid references public.item_group_versions (id) on delete restrict,
  add column group_ordinal smallint,
  add column part_label text,
  add constraint assessment_session_items_group_membership_complete check (
    (item_group_version_id is null and group_ordinal is null and part_label is null)
    or (item_group_version_id is not null and group_ordinal >= 1)
  ),
  add constraint assessment_session_items_group_ordinal_key unique (session_id, item_group_version_id, group_ordinal);

alter table public.session_responses
  add column part_score_evidence jsonb,
  add constraint session_responses_part_score_evidence_array check (
    part_score_evidence is null or jsonb_typeof(part_score_evidence) = 'array'
  );

alter table public.manual_marks
  add column part_id text,
  add column rubric_version text;
drop index public.manual_marks_item_key;
create unique index manual_marks_item_key
  on public.manual_marks (session_id, session_item_id, part_id) nulls not distinct
  where session_item_id is not null;

/* Restate record_manual_mark so its ON CONFLICT target matches the new index
   shape. The index now includes part_id, so the conflict clause must match.
   The function itself is unchanged — only the conflict target moves. */
create or replace function public.record_manual_mark(
  p_session_id uuid,
  p_session_item_id uuid,
  p_awarded_marks numeric,
  p_feedback text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_teacher   uuid := auth.uid();
  v_student   uuid;
  v_status    text;
  v_max_marks numeric;
  v_score     text;
  v_mark_id   uuid;
begin
  if v_teacher is null then
    raise exception 'record_manual_mark requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  select s.student_id, s.status
    into v_student, v_status
  from public.assessment_sessions s
  where s.id = p_session_id
    and s.legacy_session_id is null
    and public.is_teacher_of_student(s.student_id);

  if not found then
    raise exception 'no markable sitting of that identity is visible to this caller'
      using errcode = 'MM217';
  end if;

  if v_status not in ('submitted', 'processed') then
    raise exception 'sitting % has not been submitted' , p_session_id
      using errcode = 'MM217';
  end if;

  select iv.marks_available, r.score_status
    into v_max_marks, v_score
  from public.assessment_session_items si
  join public.item_versions iv on iv.id = si.item_version_id
  left join public.session_responses r
    on r.session_item_id = si.id and r.session_id = si.session_id
  where si.id = p_session_item_id and si.session_id = p_session_id;

  if not found then
    raise exception 'no such served item in that sitting'
      using errcode = 'MM217';
  end if;

  if v_score is distinct from 'manual_review' then
    raise exception 'item % is not awaiting a human mark', p_session_item_id
      using errcode = 'MM218';
  end if;

  if p_awarded_marks is null or p_awarded_marks < 0 or p_awarded_marks > v_max_marks then
    raise exception 'awarded marks % are outside 0..% for this item', p_awarded_marks, v_max_marks
      using errcode = 'MM219';
  end if;

  insert into public.manual_marks as mm
    (session_id, session_item_id, marked_by, awarded_marks, max_marks, feedback, marked_at)
  values (p_session_id, p_session_item_id, v_teacher, p_awarded_marks, v_max_marks, p_feedback, now())
  on conflict (session_id, session_item_id, part_id) where session_item_id is not null
  do update set
    marked_by     = excluded.marked_by,
    awarded_marks = excluded.awarded_marks,
    max_marks     = excluded.max_marks,
    feedback      = excluded.feedback,
    marked_at     = excluded.marked_at
  returning mm.id into v_mark_id;

  return jsonb_build_object(
    'markId', v_mark_id,
    'sessionId', p_session_id,
    'sessionItemId', p_session_item_id,
    'awardedMarks', p_awarded_marks,
    'maxMarks', v_max_marks
  );
end;
$$;

revoke all on function public.record_manual_mark(uuid, uuid, numeric, text) from public, anon;
grant execute on function public.record_manual_mark(uuid, uuid, numeric, text) to authenticated;

comment on function public.record_manual_mark(uuid, uuid, numeric, text) is
  'Records a teacher''s mark for one manual-review item of a target-model sitting (spec §14.1, §14.3; ADR-005 Amendment B4). Teacher-of-student only, through the same is_teacher_of_student helper the read policy uses. max_marks is read from the item version the sitting pinned and is not a parameter; marked_by is auth.uid(). Absent, legacy-origin and not-mine all raise MM217 so existence does not leak.';

/* The capability expansion requires mindmosaic_scoring to write part_score_evidence
   on session_responses after scoring a part-based item. This is a genuine,
   load-bearing privilege for the feature. The registry allowlist in
   scripts/migrations/registry.ts (20260812110000_scoring_role) is extended to
   recognise this ninth column-level UPDATE grant. */
grant update (part_score_evidence) on public.session_responses to mindmosaic_scoring;

create table public.media_playback_events (
  id uuid primary key default gen_random_uuid(),
  session_item_id uuid not null references public.assessment_session_items (id) on delete cascade,
  media_asset_version_id uuid not null references public.media_asset_versions (id) on delete restrict,
  play_ordinal smallint not null check (play_ordinal between 1 and 20),
  occurred_at timestamptz not null default now(),
  constraint media_playback_events_ordinal_key unique (session_item_id, media_asset_version_id, play_ordinal)
);

create index item_group_version_items_item_idx on public.item_group_version_items (item_version_id);
create index assessment_session_items_group_idx on public.assessment_session_items (session_id, item_group_version_id, group_ordinal);

create or replace function public.reject_assessment_capability_version_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception '% is immutable; publish a new revision instead', tg_table_name using errcode = '55000';
end;
$$;

create trigger media_asset_versions_immutable before update on public.media_asset_versions
for each row execute function public.reject_assessment_capability_version_update();
create trigger media_asset_private_scripts_immutable before update on public.media_asset_private_scripts
for each row execute function public.reject_assessment_capability_version_update();
create trigger item_group_versions_immutable before update on public.item_group_versions
for each row execute function public.reject_assessment_capability_version_update();
create trigger item_group_version_stimuli_immutable before update on public.item_group_version_stimuli
for each row execute function public.reject_assessment_capability_version_update();
create trigger item_group_version_items_immutable before update on public.item_group_version_items
for each row execute function public.reject_assessment_capability_version_update();

alter table public.media_assets enable row level security;
alter table public.media_asset_versions enable row level security;
alter table public.media_asset_private_scripts enable row level security;
alter table public.item_version_media enable row level security;
alter table public.item_groups enable row level security;
alter table public.item_group_versions enable row level security;
alter table public.item_group_version_stimuli enable row level security;
alter table public.item_group_version_items enable row level security;
alter table public.media_playback_events enable row level security;

revoke all on
  public.media_assets, public.media_asset_versions, public.media_asset_private_scripts,
  public.item_version_media, public.item_groups, public.item_group_versions,
  public.item_group_version_stimuli, public.item_group_version_items,
  public.media_playback_events from anon, authenticated;

comment on table public.media_asset_private_scripts is
  'Private transcript/script boundary. Never project review_only or accommodation_only text into learner DTOs.';
comment on table public.media_playback_events is
  'Minimal playback count evidence; intentionally stores no transcript, response, or question text.';
