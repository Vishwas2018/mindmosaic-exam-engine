-- Gate A item A16 (docs/phase2-cutover-readiness-checklist.md): the canonical
-- programme-offering authority (spec §6.2-§6.4, §22; ADR-001 clause 6).
--
-- Before this migration, "is (examStyle, yearLevel, subject) a real sitting"
-- lived twice: once as TypeScript (year-registry.ts's EXAM_STYLE_YEAR_LEVELS,
-- subject-registry.ts's isSubjectSatIn) and once as a hand-restated SQL
-- mirror inside create_assessment_session itself (20260821090000, Gate A item
-- A11) — a hardcoded CASE mapping the six selection-config subject filters to
-- their bank subject ids, and two hardcoded IF branches restating the
-- NAPLAN/ICAS year lists. That mirror was kept honest only by a source-text
-- test (target-selector-offering.test.ts reading the TS constants and
-- grepping the function body), not by a shared source of truth. This
-- migration retires that shim: `assessment_families`, `subjects`,
-- `programmes` and `programme_offerings` become the single reference-table
-- authority the RPC queries at runtime, and the TS registries remain the
-- source the seed data below is derived from (still restated as literal SQL,
-- because Postgres cannot import a TypeScript module — see the "SHARED WITH
-- TS, NOT IMPORTED FROM IT" note below).
--
-- Validity (does this offering exist) stays separate from readiness (does
-- content exist for it) per spec §6.3 and ADR-001 clause 7: this migration
-- adds nothing that counts published items, and coverage.ts is untouched.
--
-- ---------------------------------------------------------------------------
-- Convergence with feat/assessment-capability-expansion (20260820090000)
-- ---------------------------------------------------------------------------
-- That branch (untracked/concurrent per docs/phase2-cutover-readiness-
-- checklist.md item B5) independently created `assessment_families`,
-- `programmes` and `programme_offerings` with the same shapes as below
-- (stable text ids, `programme_offerings` unique on
-- `(programme_id, subject_id, year_level, locale, region)`, RLS enabled with
-- all privileges revoked from anon/authenticated) and seeded six families
-- (naplan_style, icas_style, curriculum_practice, mathematics_competition,
-- selective_entry, singapore_curriculum) and six programmes under the latter
-- three families. It did not add a `subjects` table (its
-- `programme_offerings.subject_id` carries no foreign key) and it seeded no
-- offering rows at all.
--
-- This migration is designed as that schema's superset, not its competitor:
-- the six families and six programmes are reproduced verbatim below under
-- `on conflict (id) do nothing`, so applying both migrations in either order
-- leaves identical data. When that branch rebases onto this one, its own
-- `create table public.assessment_families`, `create table
-- public.programmes`, `create table public.programme_offerings` and their
-- seed `insert`s (and the `create index programme_offerings_lookup_idx`,
-- reproduced here under the same name) become no-ops to delete — everything
-- downstream of those three tables in that branch's migration (media assets,
-- item groups, etc.) is unaffected and keeps working against the tables this
-- migration creates. The one strengthening this migration adds beyond that
-- branch's shape is `programme_offerings.subject_id references
-- public.subjects (id)` — a new foreign key that branch's rows (there are
-- none yet) cannot violate.
--
-- ---------------------------------------------------------------------------
-- subjects (spec §6.4)
-- ---------------------------------------------------------------------------
create table public.subjects (
  id text primary key check (id ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  display_name text not null,
  /* The one place the selection engine's filter vocabulary and the
     registry's subject vocabulary disagree: the configurator's "language"
     filter selects the bank subject `language_conventions`
     (REGISTRY_SUBJECT_BY_FILTER, src/features/exam-engine/selection/
     selection-config.ts). Every other isolable filter equals its subject id
     exactly, so this column is null for all but one row. */
  selection_filter_alias text unique,
  active boolean not null default true
);

comment on table public.subjects is
  'Stable subject ids, restated as literal SQL from SUBJECT_REGISTRY (src/features/taxonomy/subject-registry.ts) — see src/tests/unit/year-authority.test.ts sibling pattern; kept honest by tests/rls/programme-offering-authority.test.ts, which reads the registry at test time. Strands/skills stay TS-only (not yet a DB concern); this table exists so programme_offerings.subject_id has a real reference target (spec §6.4, ADR-001 clause 6).';

insert into public.subjects (id, display_name, selection_filter_alias) values
  ('numeracy', 'Numeracy', null),
  ('reading', 'Reading', null),
  ('writing', 'Writing', null),
  ('language_conventions', 'Language Conventions', 'language'),
  ('science', 'Science', null),
  ('digital_technologies', 'Digital Technologies', null),
  ('spelling', 'Spelling', null),
  ('critical_creative_thinking', 'Critical and Creative Thinking', null);

-- ---------------------------------------------------------------------------
-- assessment_families (spec §6.2) — superset of 20260820090000's table
-- ---------------------------------------------------------------------------
create table public.assessment_families (
  id text primary key check (id ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  display_name text not null,
  description text not null,
  active boolean not null default true
);

insert into public.assessment_families (id, display_name, description) values
  ('naplan_style', 'NAPLAN-style practice', 'Original style-aligned practice; not affiliated with or endorsed by ACARA.'),
  ('icas_style', 'ICAS-style practice', 'Original style-aligned practice; not affiliated with or endorsed by ICAS.'),
  ('curriculum_practice', 'Curriculum practice', 'Original curriculum-aligned practice.'),
  ('mathematics_competition', 'Mathematics competition practice', 'Original competition-style mathematics practice.'),
  ('selective_entry', 'Selective-entry practice', 'Original selective-entry-style practice.'),
  ('singapore_curriculum', 'Singapore curriculum practice', 'Original Singapore-curriculum-aligned practice.')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- programmes (spec §6.2) — superset of 20260820090000's table, plus the two
-- programmes the two EXISTING styles are seeded under below.
-- ---------------------------------------------------------------------------
create table public.programmes (
  id text primary key check (id ~ '^[a-z0-9]+([_-][a-z0-9]+)*$'),
  assessment_family_id text not null references public.assessment_families (id) on delete restrict,
  display_name text not null,
  style_disclaimer text not null,
  configuration jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

insert into public.programmes (id, assessment_family_id, display_name, style_disclaimer) values
  ('australian_mathematics_competition', 'mathematics_competition', 'Australian Mathematics Competition practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('nsw_selective_high_school', 'selective_entry', 'NSW Selective High School practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('nsw_opportunity_class', 'selective_entry', 'NSW Opportunity Class practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('victorian_selective_entry', 'selective_entry', 'Victorian Selective Entry practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('wa_aset', 'selective_entry', 'WA ASET practice', 'Original style-aligned practice; no official endorsement is implied.'),
  ('singapore_primary_mathematics', 'singapore_curriculum', 'Singapore Primary Mathematics practice', 'Original curriculum-aligned practice; no official endorsement is implied.')
on conflict (id) do nothing;

insert into public.programmes (id, assessment_family_id, display_name, style_disclaimer) values
  ('naplan_style_practice', 'naplan_style', 'NAPLAN-style practice programme', 'Original style-aligned practice; not affiliated with or endorsed by ACARA.'),
  ('icas_style_practice', 'icas_style', 'ICAS-style practice programme', 'Original style-aligned practice; not affiliated with or endorsed by ICAS.')
on conflict (id) do nothing;

create index programmes_assessment_family_idx on public.programmes (assessment_family_id);

-- ---------------------------------------------------------------------------
-- programme_offerings (spec §6.3) — the offering tuple, unique on
-- programme x subject x year_level x locale/region. Same shape as
-- 20260820090000's table plus the subjects foreign key noted above.
-- ---------------------------------------------------------------------------
create table public.programme_offerings (
  id uuid primary key default gen_random_uuid(),
  programme_id text not null references public.programmes (id) on delete restrict,
  subject_id text not null references public.subjects (id) on delete restrict,
  year_level smallint not null check (year_level between 1 and 12),
  locale text not null check (locale ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  region text not null default 'global',
  active boolean not null default true,
  constraint programme_offerings_natural_key
    unique (programme_id, subject_id, year_level, locale, region)
);

create index programme_offerings_lookup_idx on public.programme_offerings (programme_id, subject_id, year_level, locale, region);

comment on table public.programme_offerings is
  'The single offering-validity authority (spec §6.3; ADR-001 clause 6, 7). A row existing means the (programme, subject, year_level, locale/region) combination is a real, administrable sitting -- separate from readiness (has content), which stays in the server-only src/features/taxonomy/coverage.ts. create_assessment_session (20260822090000) queries this table directly instead of the hardcoded mirror A11 (20260821090000) restated inline; see tests/rls/programme-offering-authority.test.ts for the source-of-truth cross-check against EXAM_STYLE_YEAR_LEVELS and SUBJECT_REGISTRY.';

/*
 * SHARED WITH TS, NOT IMPORTED FROM IT. This seed is the SQL restatement of
 * EXAM_STYLE_YEAR_LEVELS (src/features/taxonomy/year-registry.ts) crossed
 * with each subject's `supportedExamStyles`/`yearLevels`
 * (src/features/taxonomy/subject-registry.ts) -- i.e. exactly what
 * isSubjectSatIn() computes for every (style, year, subject) triple. Kept
 * honest by tests/rls/programme-offering-authority.test.ts, which computes
 * the same set from the TS registries at test time and asserts this table
 * matches it exactly (no more, no fewer rows).
 *
 * NAPLAN assesses only numeracy, reading, writing and language_conventions
 * (neither science nor digital_technologies nor spelling nor
 * critical_creative_thinking). ICAS assesses all eight subjects, narrowed to
 * Years 2-7 for digital_technologies only
 * (ICAS_DIGITAL_TECHNOLOGIES_YEARS intersected with
 * EXAM_STYLE_YEAR_LEVELS.icas_style) -- every other ICAS subject runs the
 * style's full Years 2-12 span.
 */
insert into public.programme_offerings (programme_id, subject_id, year_level, locale, region)
select
  case sitting.exam_style when 'naplan_style' then 'naplan_style_practice' else 'icas_style_practice' end,
  subject.subject_id,
  sitting.year_level,
  'en-AU',
  'global'
from (
  values
    ('naplan_style', 3), ('naplan_style', 5), ('naplan_style', 7), ('naplan_style', 9),
    ('icas_style', 2), ('icas_style', 3), ('icas_style', 4), ('icas_style', 5),
    ('icas_style', 6), ('icas_style', 7), ('icas_style', 8), ('icas_style', 9),
    ('icas_style', 10), ('icas_style', 11), ('icas_style', 12)
) as sitting(exam_style, year_level)
cross join (
  values
    ('numeracy'), ('reading'), ('writing'), ('language_conventions'),
    ('science'), ('digital_technologies'), ('spelling'), ('critical_creative_thinking')
) as subject(subject_id)
where
  (sitting.exam_style = 'naplan_style'
    and subject.subject_id in ('numeracy', 'reading', 'writing', 'language_conventions'))
  or (sitting.exam_style = 'icas_style'
    and subject.subject_id in ('numeracy', 'reading', 'writing', 'language_conventions',
                                'science', 'spelling', 'critical_creative_thinking'))
  or (sitting.exam_style = 'icas_style'
    and subject.subject_id = 'digital_technologies' and sitting.year_level between 2 and 7)
on conflict (programme_id, subject_id, year_level, locale, region) do nothing;

-- ---------------------------------------------------------------------------
-- RLS and privileges: read-appropriate, not learner-writable. Matches the
-- platform_flags/item_versions posture elsewhere in this schema (e.g.
-- 20260812120000, 20260812090000) and 20260820090000's own choice for these
-- exact three table names: RLS on, no policy, all privileges revoked from
-- anon/authenticated. Nothing user-facing reads these tables directly today
-- -- create_assessment_session (below, SECURITY DEFINER, runs as owner) is
-- the only reader -- so "read-appropriate" means read happens through that
-- boundary, not through a raw table grant a learner's session could exploit
-- to enumerate every programme/offering ahead of a real catalogue surface.
-- ---------------------------------------------------------------------------
alter table public.subjects enable row level security;
alter table public.assessment_families enable row level security;
alter table public.programmes enable row level security;
alter table public.programme_offerings enable row level security;

revoke all on public.subjects, public.assessment_families, public.programmes, public.programme_offerings
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_assessment_session — retiring A11's inline shim (Gate A item A16)
-- ---------------------------------------------------------------------------
-- Restated in full because `create or replace` requires it. Two blocks
-- changed from 20260821090000: the subject filter is resolved by looking up
-- public.subjects (by id, or by selection_filter_alias for 'language')
-- instead of a hardcoded CASE; and the offering boundary is two exists()
-- checks against public.programme_offerings instead of two hardcoded IF
-- branches restating EXAM_STYLE_YEAR_LEVELS. Everything else -- the pins,
-- idempotency handling, ledger write, cohort gate, allocation query -- is
-- unchanged; see 20260812120000 for the allocation/idempotency mechanics and
-- 20260821090000 for A11's own history.
--
-- The offering boundary is now STRICTER than A11 left it: A11 validated only
-- (examStyle, yearLevel); this validates (examStyle, yearLevel, subject) once
-- the subject filter resolves to a real subjects.id, because
-- programme_offerings' natural key includes subject_id and there is no
-- longer a reason not to use it. A NAPLAN-style Science request (a real
-- subject, a real style/year, but not a real sitting -- NAPLAN does not set
-- Science) now fails MM229 at the boundary instead of falling through to
-- MM212 indistinguishably from an empty pool. An UNRECOGNISED subject filter
-- (not a subjects.id or alias at all) still fails MM212 via the content
-- query, exactly as A11 left it -- MM229 is reserved for combinations this
-- table can name as invalid, not for garbage input it has never heard of.
create or replace function public.create_assessment_session(
  p_config jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_endpoint      constant text := 'assessment.sessions.create';
  /* The Phase 2 fixed-delivery pins (§12.3). Constants rather than parameters:
     a version a caller can choose is not a pin. They are text literals rather
     than lookups because framework_versions, blueprint_versions and
     assessment_profile_versions are Phase 3 tables that do not exist yet
     (ADR-006 §1) — Phase 3 replaces each of these with a real reference, and
     the sessions created before then stay honest because they name the
     placeholder they were actually created under rather than a version that
     was never consulted. */
  c_profile_version  constant text := 'phase2-fixed-profile.v1';
  c_framework_version constant text := 'phase2-fixed-framework.v1';
  c_blueprint_version constant text := 'phase2-unblueprinted.v1';
  c_taxonomy_version  constant text := 'phase2-untaxonomised.v1';
  c_engine_version    constant text := 'fixed_scope_seeded.v1';
  /* The one pin that must be right today (§14.2, and 20260812100000's header):
     the scoring module refuses a version it does not implement rather than
     scoring with an algorithm the session was never sat under. */
  c_scoring_version   constant text := 'question-scorers.v1';
  /* Spec §18's upper bound on a paper, matching examSelectionConfigSchema's
     `questionCount` max so the two cannot disagree about what is pathological. */
  c_max_items     constant integer := 200;
  /* An untimed sitting still has to expire — an unbounded session is a row that
     can never be reconciled or reaped (§17.5). */
  c_untimed_ttl   constant interval := interval '24 hours';
  /* The same shape of grace window the legacy timed path uses (TIMED_GRACE_SECONDS). */
  c_timed_grace   constant integer := 300;
  /* Only the two families that currently have any seeded programme_offerings
     rows are checked against the offering boundary below -- see the note at
     the original IF branches this replaces (20260821090000) on why an
     exam_style outside this pair (including the RLS harness's isolation
     fixture style, and 'mixed', already NULL by this point) is left to fall
     through to the content query untouched: there is nothing in
     programme_offerings for those styles to check it against, so treating
     their absence as invalid would be wrong, not merely unchecked. */
  c_offering_families constant text[] := array['naplan_style', 'icas_style'];
  c_unrecognised_subject constant text := '__mm_a16_unrecognised_subject_filter__';

  v_student        uuid := auth.uid();
  v_request_hash   text;
  v_stored         public.idempotency_keys%rowtype;
  v_seed           text;
  v_year_level     smallint;
  v_exam_style     text;
  v_subject_filter text;
  v_subject        text;
  v_limit          integer;
  v_timed          boolean;
  v_version_ids    uuid[];
  v_estimated      integer;
  v_content_build  text;
  v_session_id     uuid;
  v_expires_at     timestamptz;
  v_response       jsonb;
begin
  if v_student is null then
    raise exception 'create_assessment_session requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = v_student and p.role = 'student'
  ) then
    raise exception 'only a student may create an assessment session'
      using errcode = 'MM002';
  end if;

  /* THE ROUTING GATE, and the reason it lives here rather than in the route.
     This function is granted to `authenticated`, so PostgREST exposes it to
     every signed-in client. A cohort held in the application's environment
     decides what our routes do and says nothing about what happens when a
     learner calls this directly. So the decision is taken here, from the
     database's own flag, and an out-of-cohort caller gets MM210 no matter how
     the request was shaped (ADR-006 Amendment C1). */
  if public.session_storage_model_for(v_student) <> 'version_pinned' then
    raise exception 'the version-pinned session model is not enabled for this student'
      using errcode = 'MM210';
  end if;

  -- §18: "Write endpoints that can be safely retried MUST accept an idempotency
  -- key. Reusing a key with a different request hash MUST fail." jsonb is
  -- already canonical — Postgres normalises key order and whitespace on input —
  -- so md5 over its text form is a stable hash of the request rather than of
  -- however the client happened to serialise it.
  v_request_hash := md5(p_config::text);

  insert into public.idempotency_keys (actor_id, endpoint, key, request_hash)
  values (v_student, c_endpoint, p_idempotency_key, v_request_hash)
  on conflict (actor_id, endpoint, key) do nothing;

  if not found then
    /* Either a genuine replay, or a concurrent first call that has already
       committed. A concurrent call still IN FLIGHT blocks the insert above on
       the primary key until it commits or rolls back, so by the time control
       reaches here the winner's row is visible with its response. */
    select * into v_stored from public.idempotency_keys
    where actor_id = v_student and endpoint = c_endpoint and key = p_idempotency_key;

    if v_stored.request_hash is distinct from v_request_hash then
      raise exception 'idempotency key % was used with a different request', p_idempotency_key
        using errcode = 'MM211';
    end if;

    if v_stored.response_body is null then
      /* The first attempt claimed the key and then failed after committing the
         claim, which this function's single transaction should make impossible.
         Raising beats returning null: a caller that retried into this state
         needs a new key, not a session it cannot identify. */
      raise exception 'idempotency key % has no stored response', p_idempotency_key
        using errcode = 'MM213';
    end if;

    return v_stored.response_body;
  end if;

  -- Server-chosen and unpredictable. This is the property that stops a learner
  -- predicting their own paper even though they choose its scope; a seed that
  -- came from the request would make the selection below reproducible by the
  -- person being examined.
  v_seed := gen_random_uuid()::text;

  /* 'mixed' means "do not filter on this axis", matching
     examSelectionConfigSchema. */
  v_year_level     := nullif(p_config->>'yearLevel', 'mixed')::smallint;
  v_exam_style     := nullif(p_config->>'examStyle', 'mixed');
  v_subject_filter := nullif(p_config->>'subject', 'mixed');
  v_limit          := least(coalesce(nullif(p_config->>'questionCount', 'full')::integer, c_max_items),
                        c_max_items);
  v_timed          := coalesce(p_config->>'timing', 'timed') = 'timed';

  if v_limit < 1 then
    raise exception 'a session must contain at least one item'
      using errcode = 'MM212';
  end if;

  /* THE CANONICAL SUBJECT MAPPING (Gate A item A16), now sourced from
     public.subjects instead of a hardcoded CASE. A filter that matches
     neither a subjects.id nor a selection_filter_alias maps to a sentinel no
     real source_subject can ever equal, preserving the existing fail-closed
     behaviour: an unrecognised subject matches nothing and falls out as
     MM212, the same way it always has. */
  select s.id into v_subject
  from public.subjects s
  where v_subject_filter is not null
    and (s.id = v_subject_filter or s.selection_filter_alias = v_subject_filter);

  if v_subject_filter is not null and v_subject is null then
    v_subject := c_unrecognised_subject;
  end if;

  /* THE OFFERING BOUNDARY (Gate A item A16), checked before any content is
     queried. Two checks, subject-agnostic then subject-scoped, so the two
     failure modes stay distinguishable at the same errcode a caller already
     handles (MM229): */
  if v_exam_style = any (c_offering_families) and v_year_level is not null then
    /* (1) Is (examStyle, yearLevel) a real sitting at all -- the A11 check,
       now read from programme_offerings instead of a hardcoded year list.
       True the moment ANY subject is offered at that (family, year), which
       is exactly what EXAM_STYLE_YEAR_LEVELS asserts once every real sitting
       has at least one seeded subject (numeracy, for both families). */
    if not exists (
      select 1
      from public.programme_offerings po
      join public.programmes pr on pr.id = po.programme_id
      where pr.assessment_family_id = v_exam_style
        and po.year_level = v_year_level
    ) then
      raise exception '% is not sat at year %', v_exam_style, v_year_level
        using errcode = 'MM229';
    end if;

    /* (2) Given a RECOGNISED subject (not the sentinel above, not the NULL
       'mixed' means-every-subject case), is THIS (examStyle, yearLevel,
       subject) triple a real sitting? NAPLAN-style Science is the case A11
       could not catch: a real style, a real year, a real subject id, but not
       a paper NAPLAN sets -- previously indistinguishable from an empty
       pool (MM212); now named explicitly (MM229). */
    if v_subject is not null and v_subject <> c_unrecognised_subject and not exists (
      select 1
      from public.programme_offerings po
      join public.programmes pr on pr.id = po.programme_id
      where pr.assessment_family_id = v_exam_style
        and po.year_level = v_year_level
        and po.subject_id = v_subject
    ) then
      raise exception '% subject % is not offered at year %', v_exam_style, v_subject, v_year_level
        using errcode = 'MM229';
    end if;
  end if;

  /* THE ALLOCATION. Three properties are worth naming because each is load-
     bearing rather than incidental:

       * `distinct on (item_id) ... order by revision desc` serves the current
         revision of each item and never two revisions of the same question —
         which assessment_session_items_item_once_per_session would reject
         anyway, but as an error rather than as a paper.
       * the join to item_answer_versions is not decoration: an item with no
         answer row cannot be scored, and allocating one would produce a
         sitting that can be sat and not marked. Unscoreable content is not
         eligible content.
       * ordering by md5(seed || content_hash) is deterministic given the seed,
         so the same seed reproduces the same paper — which is what makes the
         allocation replayable from the ledger rather than merely recorded in
         it. content_hash breaks ties so the order is total. */
  with latest as (
    select distinct on (iv.item_id)
           iv.id, iv.item_id, iv.content_hash, iv.estimated_time_seconds
    from public.item_versions iv
    join public.items i on i.id = iv.item_id
    where i.retired_at is null
      and (v_year_level is null or iv.source_year_level = v_year_level)
      and (v_exam_style is null or iv.source_exam_style = v_exam_style)
      and (v_subject    is null or iv.source_subject    = v_subject)
    order by iv.item_id, iv.revision desc
  ),
  eligible as (
    select l.id, l.content_hash, l.estimated_time_seconds
    from latest l
    join public.item_answer_versions a on a.item_version_id = l.id
    order by md5(v_seed || l.content_hash), l.content_hash
    limit v_limit
  ),
  ordered as (
    select e.id, e.estimated_time_seconds,
           row_number() over (order by md5(v_seed || e.content_hash), e.content_hash) as ord
    from eligible e
  )
  select array_agg(o.id order by o.ord), coalesce(sum(o.estimated_time_seconds), 0)
  into v_version_ids, v_estimated
  from ordered o;

  if v_version_ids is null or cardinality(v_version_ids) = 0 then
    raise exception 'no eligible published content for the requested scope'
      using errcode = 'MM212';
  end if;

  /* §12.3's "content publication/build version". Phase 1 records no build
     identity — the projection stamps rows, not builds — so the honest pin is a
     digest of what is actually projected right now, computed the same way for
     every session so two sessions created against the same bank agree. It is a
     full scan of item_versions' hashes; at the current ~1.3k rows that is
     negligible, and Phase 3 should replace it with a recorded build id rather
     than let it grow into a per-create table scan. */
  select md5(string_agg(iv.content_hash, ',' order by iv.content_hash))
  into v_content_build
  from public.item_versions iv;

  /* Timed sittings expire on the content's own estimated time plus the same
     grace the legacy path allows; untimed ones still expire, just generously.
     Phase 3's assessment profile version owns durations properly — this is the
     interim rule, and it is derived from pinned content rather than from a
     request parameter a learner could inflate. */
  v_expires_at := now() + case
    when v_timed then make_interval(secs => v_estimated + c_timed_grace)
    else c_untimed_ttl
  end;

  insert into public.assessment_sessions (
    student_id, assessment_profile_version, framework_version, blueprint_version,
    taxonomy_version, engine_algorithm_version, scoring_algorithm_version,
    content_build_version, delivery_mode, seed, config, expires_at, storage_model
  ) values (
    v_student, c_profile_version, c_framework_version, c_blueprint_version,
    c_taxonomy_version, c_engine_version, c_scoring_version,
    v_content_build, 'fixed', v_seed, p_config, v_expires_at,
    /* Stated, not inferred (ADR-006 Amendment C4). The transition guard refuses
       to change it afterwards, which is what makes "a session never changes
       storage model" a schema fact rather than a claim. */
    'version_pinned'
  )
  returning id into v_session_id;

  -- §12.4's ledger. Written in the same transaction as the session, which is
  -- what makes assessment_sessions_unversioned_only_from_legacy true by
  -- construction: a natively created session cannot exist without its pins.
  insert into public.assessment_session_items (
    session_id, global_ordinal, stage_number, within_stage_ordinal,
    item_id, item_version_id, content_hash, stimulus_id, stimulus_version_id,
    allocation_reason, allocation_decision, seed
  )
  select
    v_session_id, o.ord, 1, o.ord,
    iv.item_id, iv.id, iv.content_hash, sv.stimulus_id, iv.stimulus_version_id,
    'fixed_blueprint_selection',
    jsonb_build_object(
      'engineAlgorithmVersion', c_engine_version,
      'requestedCount', v_limit,
      'scope', jsonb_build_object(
        'yearLevel', v_year_level, 'examStyle', v_exam_style, 'subject', v_subject
      )
    ),
    v_seed
  from unnest(v_version_ids) with ordinality as o(version_id, ord)
  join public.item_versions iv on iv.id = o.version_id
  left join public.stimulus_versions sv on sv.id = iv.stimulus_version_id;

  v_response := jsonb_build_object(
    'sessionId', v_session_id,
    'status', 'created',
    'version', 1,
    'itemCount', cardinality(v_version_ids),
    'expiresAt', v_expires_at,
    'storageModel', 'version_pinned',
    'scoringAlgorithmVersion', c_scoring_version,
    'engineAlgorithmVersion', c_engine_version,
    'contentBuildVersion', v_content_build
  );

  update public.idempotency_keys
  set response_status = 201, response_body = v_response
  where actor_id = v_student and endpoint = c_endpoint and key = p_idempotency_key;

  return v_response;
end;
$$;

comment on function public.create_assessment_session(jsonb, text) is
  'Version-pinned session create (spec §12.3-§12.5, §17.2, §18; ADR-006/007). Gated on session_storage_model_for() (20260812160000) rather than the bare cutover flag, so the cohort predicate applies to every caller. Resolves the subject filter and the (examStyle, yearLevel, subject) offering boundary through public.programme_offerings/public.subjects, the canonical offering authority (Gate A item A16, 20260822090000) that retires A11''s (20260821090000) inline mirror of REGISTRY_SUBJECT_BY_FILTER/EXAM_STYLE_YEAR_LEVELS. See 20260812120000 for the allocation/idempotency mechanics.';
