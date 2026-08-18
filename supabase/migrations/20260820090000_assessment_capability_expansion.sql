-- Scalable assessment capabilities: stable families/offerings, governed audio,
-- immutable item groups, and version-pinned group membership. Additive only.

alter table public.item_versions drop constraint item_versions_answer_kind_known;
alter table public.item_versions add constraint item_versions_answer_kind_known
  check (answer_kind is null or answer_kind in (
    'single_option', 'multiple_options', 'number', 'text', 'fill_blank',
    'dropdown', 'boolean', 'matching', 'ordering', 'manual', 'hotspot',
    'drag_drop', 'hot_text', 'matrix', 'structured'
  ));

create table public.assessment_families (
  id text primary key check (id ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  display_name text not null,
  description text not null,
  active boolean not null default true
);

create table public.programmes (
  id text primary key check (id ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  assessment_family_id text not null references public.assessment_families (id) on delete restrict,
  display_name text not null,
  style_disclaimer text not null,
  configuration jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

create table public.programme_offerings (
  id uuid primary key default gen_random_uuid(),
  programme_id text not null references public.programmes (id) on delete restrict,
  subject_id text not null,
  year_level smallint not null check (year_level between 1 and 12),
  locale text not null check (locale ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  region text not null default 'global',
  active boolean not null default true,
  constraint programme_offerings_natural_key
    unique (programme_id, subject_id, year_level, locale, region)
);

insert into public.assessment_families (id, display_name, description) values
  ('naplan_style', 'NAPLAN-style practice', 'Original style-aligned practice; not affiliated with or endorsed by ACARA.'),
  ('icas_style', 'ICAS-style practice', 'Original style-aligned practice; not affiliated with or endorsed by ICAS.'),
  ('curriculum_practice', 'Curriculum practice', 'Original curriculum-aligned practice.'),
  ('mathematics_competition', 'Mathematics competition practice', 'Original competition-style mathematics practice.'),
  ('selective_entry', 'Selective-entry practice', 'Original selective-entry-style practice.'),
  ('singapore_curriculum', 'Singapore curriculum practice', 'Original Singapore-curriculum-aligned practice.')
on conflict (id) do nothing;

insert into public.programmes (id, assessment_family_id, display_name, style_disclaimer) values
  ('australian_mathematics_competition', 'mathematics_competition', 'Australian Mathematics Competition practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('nsw_selective_high_school', 'selective_entry', 'NSW Selective High School practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('nsw_opportunity_class', 'selective_entry', 'NSW Opportunity Class practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('victorian_selective_entry', 'selective_entry', 'Victorian Selective Entry practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('wa_aset', 'selective_entry', 'WA ASET practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('singapore_primary_mathematics', 'singapore_curriculum', 'Singapore Primary Mathematics practice', 'Original curriculum-aligned practice; no official endorsement is implied.')
on conflict (id) do nothing;

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

grant update (part_score_evidence) on public.session_responses to mindmosaic_scoring;

create table public.media_playback_events (
  id uuid primary key default gen_random_uuid(),
  session_item_id uuid not null references public.assessment_session_items (id) on delete cascade,
  media_asset_version_id uuid not null references public.media_asset_versions (id) on delete restrict,
  play_ordinal smallint not null check (play_ordinal between 1 and 20),
  occurred_at timestamptz not null default now(),
  constraint media_playback_events_ordinal_key unique (session_item_id, media_asset_version_id, play_ordinal)
);

create index programme_offerings_lookup_idx on public.programme_offerings (programme_id, subject_id, year_level, locale, region);
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

alter table public.assessment_families enable row level security;
alter table public.programmes enable row level security;
alter table public.programme_offerings enable row level security;
alter table public.media_assets enable row level security;
alter table public.media_asset_versions enable row level security;
alter table public.media_asset_private_scripts enable row level security;
alter table public.item_version_media enable row level security;
alter table public.item_groups enable row level security;
alter table public.item_group_versions enable row level security;
alter table public.item_group_version_stimuli enable row level security;
alter table public.item_group_version_items enable row level security;
alter table public.media_playback_events enable row level security;

revoke all on public.assessment_families, public.programmes, public.programme_offerings,
  public.media_assets, public.media_asset_versions, public.media_asset_private_scripts,
  public.item_version_media, public.item_groups, public.item_group_versions,
  public.item_group_version_stimuli, public.item_group_version_items,
  public.media_playback_events from anon, authenticated;

comment on table public.media_asset_private_scripts is
  'Private transcript/script boundary. Never project review_only or accommodation_only text into learner DTOs.';
comment on table public.media_playback_events is
  'Minimal playback count evidence; intentionally stores no transcript, response, or question text.';
