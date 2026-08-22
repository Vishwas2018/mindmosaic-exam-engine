-- Phase 3 step 1 of docs/spec/scalable-assessment-platform-spec-v1.md: the
-- immutable config-version tables ADR-006 §1 deferred (spec §10.1-§10.3;
-- ADR-004, now accepted -- see docs/adr/004-framework-blueprint-profile-form-
-- versioning.md's "Decision" section added alongside this migration).
--
-- WHY NOW, AND WHY THIS SHAPE. ADR-004 records a 2026-08-21 attempt at
-- exactly this that stopped on a real semantic question, not a storage
-- question: `assessmentProfileVersionSchema` (src/schemas/platform/,
-- Phase 0) assumes a curated, blueprint-governed paper -- one offering, one
-- blueprint, an exact item count or proportion per cell -- and Phase 2's
-- `create_assessment_session` is a dynamically-filtered pool allocation with
-- no such shape (`c_blueprint_version constant text :=
-- 'phase2-unblueprinted.v1'`, deliberately named so). ADR-004 named two ways
-- to resolve that and left the choice to the product owner. The decision is
-- now made: option 1 -- "one trivial 'whole matching pool, no further
-- constraint' blueprint per offering, each genuinely representing 'no
-- constraint beyond the offering itself' rather than a placeholder." This
-- migration builds the tables that shape requires; the next migration seeds
-- them for real; the one after that wires a session's pin to them.
--
-- WHAT THIS MIGRATION DOES NOT DO. No seed rows, no session-model change, no
-- forms/form-versions (spec §10.4, explicitly the next Phase 3 step per this
-- effort's scope), no capacity simulator (spec §13.4). Schema only, exactly
-- like 20260812100000's own "schema only" first step for the session model.
--
-- SHAPE, PER TABLE.
--
--   framework_versions (§10.1) -- delivery behaviour shared across profiles.
--   Identity (framework_id, revision, label, delivery_mode) are real columns
--   because they need uniqueness and FK targets; the nested behavioural
--   structure spec §10.1 explicitly permits as JSONB (stages, navigation,
--   timing, submission, scoring, supportedQuestionTypes, tools,
--   adaptiveRouting) lives in `config`, shaped to validate against
--   `frameworkVersionSchema` once `kind`/`schemaVersion`/the identity columns
--   are spread back in -- see scripts/verify-config-versions.mts.
--
--   blueprint_versions + blueprint_cells (§10.2) -- what the assessment
--   measures. Every field `assessmentBlueprintVersionSchema` /
--   `assessmentBlueprintCellSchema` define maps to a real column: spec
--   §10.2 is explicit that "normalized cells MUST support queries by"
--   section/stage, subject, strand/skill, difficulty band, question type,
--   cognitive demand, stimulus requirement, marks, item count, estimated
--   time and machine/manual scoring eligibility -- a JSONB blob of cells
--   would not be queryable that way. No jsonb column on either table: there
--   is nothing left over once identity and cells are both real columns.
--
--   assessment_profile_versions (§10.3) -- the binding a session pins.
--   `offering` is `programme_offering_id` (FK to the real A16 table, not a
--   restated family/programme/subject/year/locale tuple); `frameworkId`
--   `frameworkRevision` and `blueprintId`/`blueprintRevision` are each a
--   single FK to the exact pinned row, which encodes id+revision together
--   more strongly than two columns compared for agreement ever could. Fully
--   normalized; no jsonb column here either.
--
-- IMMUTABLE, IN FULL, ON ALL FOUR TABLES. Spec §10.3: "A session MUST
-- reference the exact profile version, never a mutable 'current' profile" --
-- which only holds if the profile (and everything it pins) cannot change
-- under a session that already referenced it. Unlike item_versions
-- (20260819090000), there is no mutable-timestamp exception here: nothing
-- about a config version has an operational-only column analogous to
-- `projected_at`. A profile whose `availability` needs to change (e.g.
-- withdrawn) gets a NEW revision row with the new value -- never an in-place
-- update -- exactly the same discipline `revisionSchema`'s doc comment
-- states ("never reused").
--
-- CROSS-TABLE CONSISTENCY. Postgres CHECK cannot see another table, so the
-- three cross-checks `resolvedAssessmentProfileSchema`'s superRefine makes
-- in TypeScript (profile.deliveryMode matches its framework's; profile's
-- scoringAlgorithmId/Version matches the framework's scoring policy; every
-- blueprint cell's stageId is a stage the framework declares) are enforced
-- here by a BEFORE INSERT trigger on assessment_profile_versions. Only
-- INSERT needs covering: nothing here is ever updated.
--
-- RLS AND PRIVILEGES. Same posture as programme_offerings/item_versions:
-- RLS enabled, zero anon/authenticated privilege, no policy. Nothing
-- learner-facing reads a config version directly; the sanctioned reader is
-- create_assessment_session (SECURITY DEFINER), arriving in the pin-wiring
-- migration.
--
-- ERROR CODES: continuing the series. MM240 (immutability), MM241-MM243
-- (the three profile-consistency checks).

-- ---------------------------------------------------------------------------
-- framework_versions (§10.1)
-- ---------------------------------------------------------------------------
create table public.framework_versions (
  id            uuid primary key default gen_random_uuid(),
  framework_id  text        not null check (framework_id ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  revision      integer     not null check (revision >= 1),
  label         text        not null check (char_length(label) between 1 and 160),
  delivery_mode text        not null check (delivery_mode in ('fixed_path', 'adaptive_mst')),

  -- Everything frameworkVersionSchema models as nested structure rather than
  -- a scalar: stages, navigation, timing, submission, scoring,
  -- supportedQuestionTypes, tools, adaptiveRouting (present only for
  -- adaptive_mst). Not re-validated by a CHECK -- Postgres cannot run a Zod
  -- refinement -- scripts/verify-config-versions.mts is the enforcement
  -- point, run in CI (see that script's own header).
  config        jsonb       not null,

  created_at    timestamptz not null default now(),

  constraint framework_versions_natural_key unique (framework_id, revision)
);

comment on table public.framework_versions is
  'Immutable, versioned delivery behaviour (spec §10.1, ADR-004 accepted). Identity columns are real; the nested behavioural structure frameworkVersionSchema models is `config` jsonb. Validated by src/schemas/platform/framework-version.schema.ts via scripts/verify-config-versions.mts, never by an in-database refinement.';

-- ---------------------------------------------------------------------------
-- blueprint_versions + blueprint_cells (§10.2)
-- ---------------------------------------------------------------------------
create table public.blueprint_versions (
  id           uuid primary key default gen_random_uuid(),
  blueprint_id text        not null check (blueprint_id ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  revision     integer     not null check (revision >= 1),
  label        text        not null check (char_length(label) between 1 and 160),

  -- Asserted against blueprint_cells by the verification script (marks sum,
  -- proportions sum to 1 or item counts sum to totalItems) -- the same
  -- arithmetic assessmentBlueprintVersionSchema's superRefine performs, now
  -- over normalized rows instead of an array literal.
  total_items  integer     not null check (total_items >= 1 and total_items <= 500),
  total_marks  integer     not null check (total_marks >= 1 and total_marks <= 1000),

  created_at   timestamptz not null default now(),

  constraint blueprint_versions_natural_key unique (blueprint_id, revision)
);

comment on table public.blueprint_versions is
  'Immutable, versioned measurement specification (spec §10.2, ADR-004 accepted). No jsonb column: every field assessmentBlueprintVersionSchema defines is either here or on blueprint_cells, which is what makes the cells queryable by the axes §10.2 requires rather than opaque JSON.';

create table public.blueprint_cells (
  id                    uuid primary key default gen_random_uuid(),
  blueprint_version_id  uuid        not null references public.blueprint_versions (id) on delete cascade,
  cell_id               text        not null check (cell_id ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),

  -- Where in the paper (§10.2 "section or stage"). section_id is optional,
  -- exactly as assessmentBlueprintCellSchema leaves it; stage_id is required
  -- and must name a stage the pinning profile's framework actually declares
  -- -- checked by the profile-insert trigger below, not here, because the
  -- framework a cell's stage must agree with is only known once a profile
  -- binds this blueprint to one.
  section_id            text,
  stage_id              text        not null,

  -- What it selects (§10.2's required query axes).
  subject_id            text        not null references public.subjects (id) on delete restrict,
  strand_id             text,
  skill_node_id         text,
  difficulty_band       text        check (difficulty_band in ('easy', 'medium', 'challenging')),
  question_types        text[],
  cognitive_demand      text        check (cognitive_demand in ('recall', 'apply', 'analyse', 'evaluate')),
  stimulus_requirement  text        not null default 'any'
                                    check (stimulus_requirement in ('required', 'forbidden', 'any')),
  scoring_eligibility    text       not null default 'machine'
                                    check (scoring_eligibility in ('machine', 'manual', 'either')),

  -- How much of it. Exactly one of the two, matching assessmentBlueprintCellSchema's superRefine.
  item_count            integer     check (item_count > 0 and item_count <= 200),
  proportion             numeric   check (proportion > 0 and proportion <= 1),

  marks                 integer     not null check (marks > 0 and marks <= 200),
  estimated_time_seconds integer    not null check (estimated_time_seconds > 0 and estimated_time_seconds <= 86400),

  created_at             timestamptz not null default now(),

  constraint blueprint_cells_natural_key unique (blueprint_version_id, cell_id),
  constraint blueprint_cells_exactly_one_of_count_or_proportion check (
    (item_count is not null and proportion is null)
    or (item_count is null and proportion is not null)
  ),
  -- reading_comprehension always carries a stimulus (matches the schema's own
  -- superRefine on this exact pair).
  constraint blueprint_cells_stimulus_forbidden_excludes_reading check (
    stimulus_requirement <> 'forbidden' or question_types is null
    or not (question_types @> array['reading_comprehension'])
  )
);

-- The §10.2 query axes.
create index blueprint_cells_version_subject_idx on public.blueprint_cells (blueprint_version_id, subject_id);
create index blueprint_cells_version_stage_idx on public.blueprint_cells (blueprint_version_id, stage_id);
create index blueprint_cells_version_difficulty_idx on public.blueprint_cells (blueprint_version_id, difficulty_band);
create index blueprint_cells_question_types_gin on public.blueprint_cells using gin (question_types);

comment on table public.blueprint_cells is
  'Normalized measurement cells (spec §10.2). Every column is queryable directly -- section/stage, subject, strand/skill, difficulty band, question type, cognitive demand, stimulus requirement, marks/count, time, scoring eligibility -- rather than hidden inside a parent JSONB blob. Immutable with its parent blueprint_versions row.';

-- ---------------------------------------------------------------------------
-- assessment_profile_versions (§10.3)
-- ---------------------------------------------------------------------------
create table public.assessment_profile_versions (
  id                       uuid primary key default gen_random_uuid(),
  profile_id               text        not null check (profile_id ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  revision                 integer     not null check (revision >= 1),
  label                    text        not null check (char_length(label) between 1 and 160),

  programme_offering_id    uuid        not null references public.programme_offerings (id) on delete restrict,
  -- Pinned by exact row, not by (id, revision) pair restated -- the FK target
  -- already IS one exact immutable revision.
  framework_version_id     uuid        not null references public.framework_versions (id) on delete restrict,
  blueprint_version_id     uuid        not null references public.blueprint_versions (id) on delete restrict,

  delivery_mode            text        not null check (delivery_mode in ('fixed_path', 'adaptive_mst')),
  duration_seconds         integer     check (duration_seconds > 0 and duration_seconds <= 86400),
  scoring_algorithm_id     text        not null,
  scoring_algorithm_version integer    not null check (scoring_algorithm_version >= 1),

  availability             text        not null default 'available'
                                       check (availability in ('draft', 'available', 'withdrawn')),
  withdrawn_at             timestamptz,

  created_at               timestamptz not null default now(),

  constraint assessment_profile_versions_natural_key unique (profile_id, revision),
  constraint assessment_profile_versions_withdrawn_has_timestamp
    check ((availability = 'withdrawn') = (withdrawn_at is not null))
);

-- At most one non-withdrawn profile per offering, so a session-creation
-- resolver has an unambiguous row to pin rather than needing a "pick the
-- latest" tie-break rule this migration would otherwise have to invent.
create unique index assessment_profile_versions_current_per_offering
  on public.assessment_profile_versions (programme_offering_id)
  where availability <> 'withdrawn';

comment on table public.assessment_profile_versions is
  'Immutable, versioned binding of an offering to an exact framework and blueprint version (spec §10.3, ADR-004 accepted). "A session MUST reference the exact profile version, never a mutable current profile" -- enforced by full immutability, not convention.';

-- The three cross-checks resolvedAssessmentProfileSchema's superRefine
-- performs in TypeScript, re-run here because Postgres CHECK cannot see
-- another table. INSERT-only: nothing on this table is ever updated.
create or replace function public.enforce_assessment_profile_version_consistency()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_framework_delivery_mode text;
  v_framework_scoring_id    text;
  v_framework_scoring_ver   integer;
  v_framework_stage_ids     text[];
  v_bad_cell_stage          text;
begin
  select f.delivery_mode, f.config->'scoring'->>'algorithmId',
         (f.config->'scoring'->>'algorithmVersion')::integer
  into v_framework_delivery_mode, v_framework_scoring_id, v_framework_scoring_ver
  from public.framework_versions f
  where f.id = new.framework_version_id;

  if v_framework_delivery_mode is distinct from new.delivery_mode then
    raise exception 'profile delivery_mode % disagrees with framework %', new.delivery_mode, v_framework_delivery_mode
      using errcode = 'MM241';
  end if;

  if v_framework_scoring_id is distinct from new.scoring_algorithm_id
     or v_framework_scoring_ver is distinct from new.scoring_algorithm_version then
    raise exception 'profile scoring algorithm %/% disagrees with framework %/%',
      new.scoring_algorithm_id, new.scoring_algorithm_version, v_framework_scoring_id, v_framework_scoring_ver
      using errcode = 'MM242';
  end if;

  select array_agg(distinct s ->> 'stageId')
  into v_framework_stage_ids
  from jsonb_array_elements(coalesce((select config -> 'stages' from public.framework_versions where id = new.framework_version_id), '[]'::jsonb)) as s;

  select bc.stage_id into v_bad_cell_stage
  from public.blueprint_cells bc
  where bc.blueprint_version_id = new.blueprint_version_id
    and not (bc.stage_id = any (coalesce(v_framework_stage_ids, array[]::text[])))
  limit 1;

  if v_bad_cell_stage is not null then
    raise exception 'blueprint cell references stage % which framework % does not declare',
      v_bad_cell_stage, new.framework_version_id
      using errcode = 'MM243';
  end if;

  return new;
end;
$$;

create trigger assessment_profile_versions_consistency
  before insert on public.assessment_profile_versions
  for each row execute function public.enforce_assessment_profile_version_consistency();

-- ---------------------------------------------------------------------------
-- Immutability, for every role including the owner
-- ---------------------------------------------------------------------------
-- No mutable-column exception on any of these four (contrast item_versions'
-- projected_at, 20260819090000): nothing here has an operational-only column.
-- A profile that needs a different availability gets a new revision row.
create or replace function public.reject_config_version_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception '% is immutable; insert a new revision instead', tg_table_name
    using errcode = 'MM240';
end;
$$;

create trigger framework_versions_immutable
  before update on public.framework_versions
  for each row execute function public.reject_config_version_mutation();

create trigger blueprint_versions_immutable
  before update on public.blueprint_versions
  for each row execute function public.reject_config_version_mutation();

create trigger blueprint_cells_immutable
  before update on public.blueprint_cells
  for each row execute function public.reject_config_version_mutation();

create trigger assessment_profile_versions_immutable
  before update on public.assessment_profile_versions
  for each row execute function public.reject_config_version_mutation();

-- ---------------------------------------------------------------------------
-- RLS and privileges
-- ---------------------------------------------------------------------------
-- Same posture as programme_offerings/item_versions: RLS on, no policy, zero
-- anon/authenticated privilege. The only sanctioned reader is
-- create_assessment_session (SECURITY DEFINER, arriving in the pin-wiring
-- migration), which runs as the owner and bypasses no invariant by doing so.
alter table public.framework_versions          enable row level security;
alter table public.blueprint_versions          enable row level security;
alter table public.blueprint_cells             enable row level security;
alter table public.assessment_profile_versions enable row level security;

revoke all on public.framework_versions          from anon, authenticated;
revoke all on public.blueprint_versions          from anon, authenticated;
revoke all on public.blueprint_cells             from anon, authenticated;
revoke all on public.assessment_profile_versions from anon, authenticated;
