-- Versioned Australian curriculum-support foundation (ADR-016).
--
-- Curriculum releases are a separate version domain from framework_versions:
-- framework_versions describes assessment delivery behaviour, while these
-- tables describe sourced curriculum records and reviewed relationships.
-- No official descriptor or achievement-standard text is seeded here.

-- ---------------------------------------------------------------------------
-- Jurisdiction/sector vocabulary and the programme-offering region seam
-- ---------------------------------------------------------------------------

create table public.curriculum_jurisdictions (
  code text primary key check (code in ('AU','ACT','NSW','NT','QLD','SA','TAS','VIC','WA')),
  display_name text not null,
  kind text not null check (kind in ('national','state','territory')),
  parent_code text references public.curriculum_jurisdictions(code) on delete restrict,
  check ((code = 'AU' and kind = 'national' and parent_code is null)
      or (code <> 'AU' and kind <> 'national' and parent_code = 'AU'))
);

insert into public.curriculum_jurisdictions (code, display_name, kind, parent_code) values
  ('AU', 'Australia', 'national', null),
  ('ACT', 'Australian Capital Territory', 'territory', 'AU'),
  ('NSW', 'New South Wales', 'state', 'AU'),
  ('NT', 'Northern Territory', 'territory', 'AU'),
  ('QLD', 'Queensland', 'state', 'AU'),
  ('SA', 'South Australia', 'state', 'AU'),
  ('TAS', 'Tasmania', 'state', 'AU'),
  ('VIC', 'Victoria', 'state', 'AU'),
  ('WA', 'Western Australia', 'state', 'AU');

alter table public.programme_offerings
  add constraint programme_offerings_region_known
  check (region = 'global' or region in ('AU','ACT','NSW','NT','QLD','SA','TAS','VIC','WA'));

comment on column public.programme_offerings.region is
  'Offering identity axis. Values are global or an Australian jurisdiction code; mirrored by programmeOfferingRefSchema.';

-- ---------------------------------------------------------------------------
-- Immutable source snapshots and releases
-- ---------------------------------------------------------------------------

create table public.curriculum_licence_evidence (
  id uuid primary key default gen_random_uuid(),
  evidence_key text not null unique check (evidence_key ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  schema_version integer not null default 1 check (schema_version = 1),
  licence_id text not null,
  evidence_url text not null check (evidence_url ~ '^https?://'),
  retrieved_at timestamptz not null,
  evidence_fingerprint text not null check (evidence_fingerprint ~ '^[0-9a-f]{64}$'),
  permits_storage boolean not null,
  permits_display boolean not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (id, licence_id),
  check (not permits_display or permits_storage)
);

create table public.curriculum_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique check (source_key ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  schema_version integer not null default 1 check (schema_version = 1),
  authority_code text not null check (authority_code ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  authority_name text not null,
  jurisdiction_code text not null references public.curriculum_jurisdictions(code) on delete restrict,
  school_sectors text[] not null,
  title text not null,
  source_url text not null check (source_url ~ '^https?://'),
  retrieved_at timestamptz not null,
  source_fingerprint text not null check (source_fingerprint ~ '^[0-9a-f]{64}$'),
  licence_evidence_id uuid not null,
  licence_id text not null,
  licence_name text not null,
  licence_url text check (licence_url is null or licence_url ~ '^https?://'),
  official_text_access text not null check (official_text_access in ('metadata_only','store_only','display')),
  attribution text,
  created_at timestamptz not null default now(),
  foreign key (licence_evidence_id, licence_id)
    references public.curriculum_licence_evidence(id, licence_id) on delete restrict,
  check (cardinality(school_sectors) between 1 and 3),
  check (school_sectors <@ array['government','catholic','independent']::text[])
);

create or replace function public.enforce_curriculum_source_licence_evidence()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_permits_storage boolean;
  v_permits_display boolean;
begin
  select permits_storage, permits_display
    into v_permits_storage, v_permits_display
    from public.curriculum_licence_evidence
   where id = new.licence_evidence_id
     and licence_id = new.licence_id;

  if not found then
    raise exception 'curriculum source requires matching licence evidence'
      using errcode = 'MM301';
  end if;
  if new.official_text_access in ('store_only','display') and not v_permits_storage then
    raise exception 'licence evidence does not permit official-text storage'
      using errcode = 'MM301';
  end if;
  if new.official_text_access = 'display' and not v_permits_display then
    raise exception 'licence evidence does not permit official-text display'
      using errcode = 'MM301';
  end if;
  return new;
end $$;

create trigger curriculum_sources_licence_evidence
  before insert on public.curriculum_sources
  for each row execute function public.enforce_curriculum_source_licence_evidence();

create table public.curriculum_releases (
  id uuid primary key default gen_random_uuid(),
  release_key text not null unique check (release_key ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  schema_version integer not null default 1 check (schema_version = 1),
  source_id uuid not null references public.curriculum_sources(id) on delete restrict,
  framework_scope text not null check (framework_scope in ('national','state','territory')),
  jurisdiction_code text not null references public.curriculum_jurisdictions(code) on delete restrict,
  school_sectors text[] not null,
  title text not null,
  release_version text not null,
  effective_from date,
  effective_to date,
  published_at timestamptz,
  supersedes_release_id uuid references public.curriculum_releases(id) on delete restrict,
  source_fingerprint text not null check (source_fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  check (cardinality(school_sectors) between 1 and 3),
  check (school_sectors <@ array['government','catholic','independent']::text[]),
  check (effective_from is null or effective_to is null or effective_to >= effective_from),
  check ((framework_scope = 'national' and jurisdiction_code = 'AU')
      or (framework_scope <> 'national' and jurisdiction_code <> 'AU')),
  check (supersedes_release_id is null or supersedes_release_id <> id)
);

create or replace function public.enforce_curriculum_release_source_scope()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_jurisdiction text;
  v_school_sectors text[];
begin
  select jurisdiction_code, school_sectors
    into v_jurisdiction, v_school_sectors
    from public.curriculum_sources
   where id = new.source_id;

  if not found then
    raise exception 'curriculum release source does not exist' using errcode = 'MM302';
  end if;
  if new.jurisdiction_code <> v_jurisdiction then
    raise exception 'curriculum release jurisdiction must match its source' using errcode = 'MM302';
  end if;
  if not (new.school_sectors <@ v_school_sectors) then
    raise exception 'curriculum release sectors must be a subset of source sectors' using errcode = 'MM302';
  end if;
  return new;
end $$;

create trigger curriculum_releases_source_scope
  before insert on public.curriculum_releases
  for each row execute function public.enforce_curriculum_release_source_scope();

create index curriculum_releases_catalogue_idx
  on public.curriculum_releases (jurisdiction_code, release_version);

-- ---------------------------------------------------------------------------
-- Release-scoped hierarchy, including descriptors and achievement standards
-- ---------------------------------------------------------------------------

create table public.curriculum_nodes (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.curriculum_releases(id) on delete restrict,
  node_key text not null check (node_key ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  node_kind text not null check (node_kind in (
    'year','level','band','stage','learning_area','discipline','strand','sub_strand',
    'content_descriptor','achievement_standard'
  )),
  parent_node_id uuid,
  official_code text,
  label text not null,
  official_text text,
  official_text_licence_id text,
  official_text_attribution text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (release_id, node_key),
  unique (release_id, id),
  foreign key (release_id, parent_node_id)
    references public.curriculum_nodes(release_id, id) on delete restrict,
  check (parent_node_id is null or parent_node_id <> id),
  check ((official_text is null and official_text_licence_id is null and official_text_attribution is null)
      or (official_text is not null and official_text_licence_id is not null and official_text_attribution is not null))
);

create index curriculum_nodes_hierarchy_idx
  on public.curriculum_nodes (release_id, parent_node_id, sort_order, id);
create index curriculum_nodes_kind_idx
  on public.curriculum_nodes (release_id, node_kind);

create or replace function public.enforce_curriculum_official_text_licence()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.official_text is not null and not exists (
    select 1
      from public.curriculum_releases r
      join public.curriculum_sources s on s.id = r.source_id
      join public.curriculum_licence_evidence e
        on e.id = s.licence_evidence_id and e.licence_id = s.licence_id
     where r.id = new.release_id
        and s.official_text_access in ('store_only','display')
        and s.licence_id = new.official_text_licence_id
        and e.permits_storage
  ) then
    raise exception 'official curriculum text requires a matching storage licence'
      using errcode = 'MM301';
  end if;
  return new;
end $$;

create trigger curriculum_nodes_official_text_licence
  before insert on public.curriculum_nodes
  for each row execute function public.enforce_curriculum_official_text_licence();

create table public.curriculum_applicabilities (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null,
  node_id uuid not null,
  jurisdiction_code text not null references public.curriculum_jurisdictions(code) on delete restrict,
  school_sectors text[] not null,
  year_levels smallint[] not null default '{}',
  level_codes text[] not null default '{}',
  band_codes text[] not null default '{}',
  stage_codes text[] not null default '{}',
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  foreign key (release_id, node_id)
    references public.curriculum_nodes(release_id, id) on delete restrict,
  check (cardinality(school_sectors) between 1 and 3),
  check (school_sectors <@ array['government','catholic','independent']::text[]),
  check (year_levels <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]),
  check (cardinality(year_levels) + cardinality(level_codes) + cardinality(band_codes) + cardinality(stage_codes) > 0),
  check (effective_from is null or effective_to is null or effective_to >= effective_from)
);

create index curriculum_applicabilities_catalogue_idx
  on public.curriculum_applicabilities (jurisdiction_code, node_id);

-- ---------------------------------------------------------------------------
-- Directional crosswalks and MindMosaic taxonomy mappings
-- ---------------------------------------------------------------------------

create table public.curriculum_crosswalks (
  id uuid primary key default gen_random_uuid(),
  source_release_id uuid not null,
  source_node_id uuid not null,
  target_release_id uuid,
  target_node_id uuid,
  relation text not null check (relation in ('exact','equivalent','broader','narrower','related','unmapped')),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  rationale text not null,
  provenance_method text not null check (provenance_method in ('human_review','structured_import','machine_suggested_human_reviewed')),
  provenance_source_url text not null check (provenance_source_url ~ '^https?://'),
  provenance_retrieved_at timestamptz not null,
  supersedes_crosswalk_id uuid references public.curriculum_crosswalks(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (source_release_id, source_node_id)
    references public.curriculum_nodes(release_id, id) on delete restrict,
  foreign key (target_release_id, target_node_id)
    references public.curriculum_nodes(release_id, id) on delete restrict,
  check ((relation = 'unmapped' and target_release_id is null and target_node_id is null)
      or (relation <> 'unmapped' and target_release_id is not null and target_node_id is not null)),
  check (target_node_id is null or target_node_id <> source_node_id),
  check (supersedes_crosswalk_id is null or supersedes_crosswalk_id <> id)
);

comment on column public.curriculum_crosswalks.relation is
  'Directional from source to target: broader means the source is broader; narrower means the source is narrower. No relation is inferred from jurisdiction.';

create index curriculum_crosswalks_source_idx
  on public.curriculum_crosswalks (source_release_id, source_node_id, relation);
create index curriculum_crosswalks_target_idx
  on public.curriculum_crosswalks (target_release_id, target_node_id, relation)
  where target_node_id is not null;

create table public.curriculum_taxonomy_alignments (
  id uuid primary key default gen_random_uuid(),
  curriculum_release_id uuid not null,
  curriculum_node_id uuid not null,
  taxonomy_id text not null check (taxonomy_id ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  taxonomy_version text not null,
  taxonomy_node_id text,
  relation text not null check (relation in ('exact','equivalent','broader','narrower','related','unmapped')),
  rationale text not null,
  aligned_by text not null,
  aligned_at timestamptz not null,
  supersedes_alignment_id uuid references public.curriculum_taxonomy_alignments(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (curriculum_release_id, curriculum_node_id)
    references public.curriculum_nodes(release_id, id) on delete restrict,
  check ((relation = 'unmapped' and taxonomy_node_id is null)
      or (relation <> 'unmapped' and taxonomy_node_id is not null)),
  check (supersedes_alignment_id is null or supersedes_alignment_id <> id)
);

create index curriculum_taxonomy_alignments_node_idx
  on public.curriculum_taxonomy_alignments (curriculum_release_id, curriculum_node_id);
create index curriculum_taxonomy_alignments_taxonomy_idx
  on public.curriculum_taxonomy_alignments (taxonomy_id, taxonomy_version, taxonomy_node_id);

-- A curriculum node exists independently of an alignment or supporting item.
-- Coverage is computed by a catalogue adapter, not stored as curriculum truth.
comment on table public.curriculum_taxonomy_alignments is
  'Reviewed mapping to a separately versioned MindMosaic taxonomy. Absence of a row does not mean the curriculum node does not exist, and presence does not claim content coverage.';

-- ---------------------------------------------------------------------------
-- Append-only review events; latest status is a projection, never an update
-- ---------------------------------------------------------------------------

create table public.curriculum_review_events (
  id uuid primary key default gen_random_uuid(),
  event_sequence bigint generated always as identity unique,
  entity_kind text not null check (entity_kind in ('release','node','crosswalk','taxonomy_alignment')),
  entity_id uuid not null,
  status text not null check (status in ('draft','in_review','approved','rejected')),
  reviewer_id text,
  notes text,
  evidence_hash text check (evidence_hash is null or evidence_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  check ((status in ('approved','rejected') and reviewer_id is not null)
      or (status in ('draft','in_review')))
);

create index curriculum_review_events_latest_idx
  on public.curriculum_review_events (entity_kind, entity_id, event_sequence desc);

create or replace function public.enforce_curriculum_review_target()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_previous_status text;
begin
  -- Lock the reviewed entity so concurrent inserts cannot both observe the
  -- same previous status and fork the append-only review history.
  if new.entity_kind = 'release' then
    perform 1 from public.curriculum_releases where id = new.entity_id for update;
  elsif new.entity_kind = 'node' then
    perform 1 from public.curriculum_nodes where id = new.entity_id for update;
  elsif new.entity_kind = 'crosswalk' then
    perform 1 from public.curriculum_crosswalks where id = new.entity_id for update;
  elsif new.entity_kind = 'taxonomy_alignment' then
    perform 1 from public.curriculum_taxonomy_alignments where id = new.entity_id for update;
  end if;

  if not found then
    raise exception 'curriculum review target does not exist' using errcode = 'MM302';
  end if;

  select status into v_previous_status
    from public.curriculum_review_events
   where entity_kind = new.entity_kind and entity_id = new.entity_id
   order by event_sequence desc
   limit 1;

  if v_previous_status is null and new.status <> 'draft' then
    raise exception 'first curriculum review status must be draft' using errcode = 'MM304';
  elsif v_previous_status = 'draft' and new.status <> 'in_review' then
    raise exception 'draft curriculum review may transition only to in_review' using errcode = 'MM304';
  elsif v_previous_status = 'in_review' and new.status not in ('approved','rejected') then
    raise exception 'in_review curriculum review may transition only to approved or rejected' using errcode = 'MM304';
  elsif v_previous_status in ('approved','rejected') then
    raise exception 'approved or rejected curriculum review is terminal' using errcode = 'MM304';
  end if;
  return new;
end $$;

create trigger curriculum_review_events_target
  before insert on public.curriculum_review_events
  for each row execute function public.enforce_curriculum_review_target();

create view public.curriculum_latest_review_statuses as
select distinct on (entity_kind, entity_id)
  entity_kind, entity_id, status, reviewer_id, notes, evidence_hash, created_at, event_sequence
from public.curriculum_review_events
order by entity_kind, entity_id, event_sequence desc;

-- ---------------------------------------------------------------------------
-- Learner Years 1-12 and nullable, pairwise curriculum preferences
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_year_level_check;
alter table public.profiles
  add constraint profiles_year_level_check
  check (year_level is null or year_level between 1 and 12);

alter table public.profiles
  add column curriculum_jurisdiction_code text references public.curriculum_jurisdictions(code) on delete restrict,
  add column curriculum_school_sector text check (curriculum_school_sector in ('government','catholic','independent')),
  add constraint profiles_curriculum_preference_pair
    check ((curriculum_jurisdiction_code is null) = (curriculum_school_sector is null)),
  add constraint profiles_curriculum_preferences_students_only
    check (role = 'student' or (curriculum_jurisdiction_code is null and curriculum_school_sector is null));

comment on column public.profiles.curriculum_jurisdiction_code is
  'Nullable learner preference. Null preserves existing profiles and means not yet collected, not AU/default.';
comment on column public.profiles.curriculum_school_sector is
  'Nullable learner preference paired with curriculum_jurisdiction_code; no curriculum equivalence is inferred.';

-- ---------------------------------------------------------------------------
-- Immutability and access: authoritative data is server-catalogue only
-- ---------------------------------------------------------------------------

create or replace function public.reject_curriculum_record_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception '% is append-only; insert a superseding record', tg_table_name
    using errcode = 'MM303';
end $$;

create trigger curriculum_jurisdictions_immutable before update or delete on public.curriculum_jurisdictions
  for each row execute function public.reject_curriculum_record_mutation();
create trigger curriculum_licence_evidence_immutable before update or delete on public.curriculum_licence_evidence
  for each row execute function public.reject_curriculum_record_mutation();
create trigger curriculum_sources_immutable before update or delete on public.curriculum_sources
  for each row execute function public.reject_curriculum_record_mutation();
create trigger curriculum_releases_immutable before update or delete on public.curriculum_releases
  for each row execute function public.reject_curriculum_record_mutation();
create trigger curriculum_nodes_immutable before update or delete on public.curriculum_nodes
  for each row execute function public.reject_curriculum_record_mutation();
create trigger curriculum_applicabilities_immutable before update or delete on public.curriculum_applicabilities
  for each row execute function public.reject_curriculum_record_mutation();
create trigger curriculum_crosswalks_immutable before update or delete on public.curriculum_crosswalks
  for each row execute function public.reject_curriculum_record_mutation();
create trigger curriculum_taxonomy_alignments_immutable before update or delete on public.curriculum_taxonomy_alignments
  for each row execute function public.reject_curriculum_record_mutation();
create trigger curriculum_review_events_immutable before update or delete on public.curriculum_review_events
  for each row execute function public.reject_curriculum_record_mutation();

alter table public.curriculum_jurisdictions enable row level security;
alter table public.curriculum_licence_evidence enable row level security;
alter table public.curriculum_sources enable row level security;
alter table public.curriculum_releases enable row level security;
alter table public.curriculum_nodes enable row level security;
alter table public.curriculum_applicabilities enable row level security;
alter table public.curriculum_crosswalks enable row level security;
alter table public.curriculum_taxonomy_alignments enable row level security;
alter table public.curriculum_review_events enable row level security;

revoke all on public.curriculum_jurisdictions, public.curriculum_licence_evidence, public.curriculum_sources,
  public.curriculum_releases, public.curriculum_nodes, public.curriculum_applicabilities,
  public.curriculum_crosswalks, public.curriculum_taxonomy_alignments,
  public.curriculum_review_events, public.curriculum_latest_review_statuses
  from anon, authenticated;

comment on view public.curriculum_latest_review_statuses is
  'Server-side catalogue projection of append-only review events. No direct learner grant; UI consumes the validated CurriculumCatalogue interface.';
