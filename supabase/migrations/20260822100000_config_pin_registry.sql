-- Gate A item A15 (docs/phase2-cutover-readiness-checklist.md), closed the
-- ADR-006 §1-compliant way -- option (b) from OVERNIGHT-RUN-REPORT.md's
-- "Task 2" write-up (2026-08-20): content-address the placeholder pin TEXT
-- VALUES create_assessment_session and the legacy backfill already write,
-- rather than option (a), the deferred framework_versions/blueprint_versions/
-- assessment_profile_versions tables. ADR-006 §1 (accepted) explicitly
-- defers those to Phase 3, and for a reason a text-value registry does not
-- reopen: Phase 3's real tables have to model what a blueprint/profile
-- MEANS (per-cell subjectId, itemCount/proportion, a single programme
-- offering), and Phase 2's actual create path is `fixed_scope_seeded.v1` --
-- an explicitly unblueprinted dynamic pool allocation with no blueprint
-- shape on the record anywhere. A canonical row satisfying that schema now
-- would fabricate product semantics and pin every session to that fiction
-- permanently, which is exactly what OVERNIGHT-RUN-REPORT.md's Task 2 stood
-- down rather than guess at.
--
-- WHAT THIS MIGRATION DOES. It does not model config SEMANTICS at all -- no
-- cells, no subjects, no item counts, nothing Phase 3's real tables will
-- hold. It proves the six placeholder pin strings the session model already
-- writes (assessment_profile_version, framework_version, blueprint_version,
-- taxonomy_version, engine_algorithm_version, scoring_algorithm_version --
-- spec §12.3) are a closed, known, immutable set rather than free text a
-- typo or a future edit could silently drift, and it makes that a database
-- constraint (spec §5.5) rather than a convention: `assessment_sessions` can
-- only pin a (kind, value) pair this registry already knows.
--
-- CONTENT-ADDRESSING. `config_pin_registry.content_hash` is not an assigned
-- key -- it is a sha256 of the row's own (pin_kind, pin_value, payload),
-- recomputed and checked by a CHECK constraint on every write. A row whose
-- hash does not match its own content cannot exist, so "resolve to the same
-- immutable row" and "cannot be forged" are the same property. Native
-- `sha256()`/`convert_to()` (built into Postgres 14+, confirmed against this
-- project's Postgres 17) -- no `pgcrypto` dependency.
--
-- content_build_version is deliberately OUT OF SCOPE. Unlike the six pins
-- above, it is not a fixed identifier -- create_assessment_session computes
-- it fresh per session as `md5(string_agg(item_versions.content_hash))` over
-- whatever is currently published (20260822090000's own header), so a
-- "known value" registry would reject every legitimate new value the moment
-- the content bank changes. It is already content-addressed in the sense
-- that matters -- it IS a hash of real data, self-verifying by
-- recomputation -- and is not a free-text label standing in for an absent
-- table the way the other six are.
--
-- HOW SESSIONS REFERENCE IT. Postgres has no cross-table CHECK, so a plain
-- CHECK cannot verify `assessment_sessions.framework_version` against
-- another table. The FK-native way to pin a column to one of several
-- disjoint known-value sets is a composite foreign key: each of the six pin
-- columns gets a paired STORED GENERATED "kind" column holding its own name
-- as a constant, and a composite FK ties (kind, value) to
-- `config_pin_registry`'s (pin_kind, pin_value) unique key. The six existing
-- text columns are UNCHANGED in name, type and value -- every reader of
-- `assessment_sessions` (get_assessment_session, the RLS suites, the
-- checklist's own closing-evidence query) keeps working untouched; what
-- changes is that an unregistered value can no longer be inserted at all.
--
-- create_assessment_session (20260822090000) and
-- backfill_legacy_terminal_sessions/legacy_backfill_pin (20260812120000,
-- 20260812140000) are NOT modified by this migration -- they already write
-- exactly the values seeded below, so the FK is satisfied by construction
-- and neither function's behaviour changes.

-- ---------------------------------------------------------------------------
-- config_pin_registry
-- ---------------------------------------------------------------------------
create table public.config_pin_registry (
  content_hash text primary key,
  pin_kind     text not null,
  pin_value    text not null,
  -- Opaque. This migration asserts identity, not meaning -- a payload column
  -- exists for whatever a future migration wants to attach to a pin (e.g. a
  -- human label) without asserting that Phase 2's placeholders mean anything
  -- today. Every row seeded below carries '{}'.
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),

  constraint config_pin_registry_kind_known check (pin_kind in (
    'assessment_profile_version', 'framework_version', 'blueprint_version',
    'taxonomy_version', 'engine_algorithm_version', 'scoring_algorithm_version'
  )),
  constraint config_pin_registry_content_hash_format
    check (content_hash ~ '^[0-9a-f]{64}$'),
  -- The content-addressing itself: a row's primary key is required to equal
  -- the hash of its own content. See the migration header.
  constraint config_pin_registry_content_hash_matches check (
    content_hash = encode(
      sha256(convert_to(pin_kind || ':' || pin_value || ':' || payload::text, 'UTF8')),
      'hex'
    )
  ),
  -- One immutable row per distinct identity. The FK below is what makes
  -- "known" mean "present in this table"; this is what makes each (kind,
  -- value) resolve to exactly one row.
  constraint config_pin_registry_kind_value_key unique (pin_kind, pin_value)
);

comment on table public.config_pin_registry is
  'Immutable, content-addressed registry of the known config-pin identities assessment_sessions may reference (Gate A item A15, ADR-006 S1-compliant per OVERNIGHT-RUN-REPORT.md Task 2 option (b)). One row per distinct (pin_kind, pin_value) the session model has ever written; content_hash is a sha256 of the row''s own identity, not an assigned key. Holds NO config semantics -- see the migration header for what this deliberately does not build.';

-- Append-only, for every role including the owner -- same posture as the
-- other immutable content tables (20260812090000's item_versions trigger,
-- 20260812100000's ledger trigger): a pin identity that could be edited in
-- place after a session referenced it would silently re-mean every session
-- that pinned it. DELETE is left ungoverned beyond the privilege revocation
-- below, matching the append-only tables' own precedent (mutation is what
-- must be structurally impossible; deletion has no legitimate path here
-- either, since nothing but a migration writes this table).
create or replace function public.reject_config_pin_registry_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'config_pin_registry is immutable; insert a new pin identity instead'
    using errcode = 'MM230';
end;
$$;

create trigger config_pin_registry_immutable
  before update on public.config_pin_registry
  for each row execute function public.reject_config_pin_registry_mutation();

alter table public.config_pin_registry enable row level security;
-- No application reader needs this table. A session's pin is already on
-- `assessment_sessions` itself, unchanged; the registry exists to constrain
-- which values are legal to write, not to be read by a client. Same posture
-- as the Phase 1/2 tables with no policy at all (20260812090000,
-- 20260812100000's header): RLS on, zero anon/authenticated privilege,
-- reached by nothing but the FK/CHECK machinery.
revoke all on public.config_pin_registry from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed: every (pin_kind, pin_value) pair the session model writes today
-- ---------------------------------------------------------------------------
-- Two write paths, both already live and both unmodified by this migration:
--   * create_assessment_session's six c_* constants (20260822090000, and
--     20260812120000/20260821090000 before it).
--   * legacy_backfill_pin('profile'|'framework'|'blueprint'|'taxonomy'|
--     'engine') -> 'legacy:unpinned' and legacy_backfill_pin('scoring') ->
--     'legacy:exam-engine' (20260812140000), written by
--     backfill_legacy_terminal_sessions (20260812150000).
-- Every pair reachable from either path is seeded; nothing else is -- an
-- unseeded pair is exactly what the FK below is meant to refuse.
insert into public.config_pin_registry (content_hash, pin_kind, pin_value, payload)
select encode(sha256(convert_to(pin_kind || ':' || pin_value || ':' || payload::text, 'UTF8')), 'hex'),
       pin_kind, pin_value, payload
from (values
  ('assessment_profile_version', 'phase2-fixed-profile.v1', '{}'::jsonb),
  ('assessment_profile_version', 'legacy:unpinned',          '{}'::jsonb),
  ('framework_version',          'phase2-fixed-framework.v1','{}'::jsonb),
  ('framework_version',          'legacy:unpinned',          '{}'::jsonb),
  ('blueprint_version',          'phase2-unblueprinted.v1',  '{}'::jsonb),
  ('blueprint_version',          'legacy:unpinned',          '{}'::jsonb),
  ('taxonomy_version',           'phase2-untaxonomised.v1',  '{}'::jsonb),
  ('taxonomy_version',           'legacy:unpinned',          '{}'::jsonb),
  ('engine_algorithm_version',   'fixed_scope_seeded.v1',    '{}'::jsonb),
  ('engine_algorithm_version',   'legacy:unpinned',          '{}'::jsonb),
  ('scoring_algorithm_version',  'question-scorers.v1',      '{}'::jsonb),
  ('scoring_algorithm_version',  'legacy:exam-engine',       '{}'::jsonb)
) as seed(pin_kind, pin_value, payload);

-- ---------------------------------------------------------------------------
-- assessment_sessions: pin columns become FK-constrained, not free text
-- ---------------------------------------------------------------------------
-- Each pin column gets a paired STORED GENERATED column holding its own kind
-- as a literal, so a composite FK can tie (kind, value) to the registry's
-- (pin_kind, pin_value) unique key -- the FK-native way to constrain a
-- column to one of several disjoint known-value sets when a plain CHECK
-- cannot see another table (spec §5.5). The six original columns are
-- untouched: same name, same type, same values a session already writes.
alter table public.assessment_sessions
  add column assessment_profile_version_kind text
    generated always as ('assessment_profile_version') stored,
  add column framework_version_kind text
    generated always as ('framework_version') stored,
  add column blueprint_version_kind text
    generated always as ('blueprint_version') stored,
  add column taxonomy_version_kind text
    generated always as ('taxonomy_version') stored,
  add column engine_algorithm_version_kind text
    generated always as ('engine_algorithm_version') stored,
  add column scoring_algorithm_version_kind text
    generated always as ('scoring_algorithm_version') stored;

alter table public.assessment_sessions
  add constraint assessment_sessions_profile_version_registered
    foreign key (assessment_profile_version_kind, assessment_profile_version)
    references public.config_pin_registry (pin_kind, pin_value),
  add constraint assessment_sessions_framework_version_registered
    foreign key (framework_version_kind, framework_version)
    references public.config_pin_registry (pin_kind, pin_value),
  add constraint assessment_sessions_blueprint_version_registered
    foreign key (blueprint_version_kind, blueprint_version)
    references public.config_pin_registry (pin_kind, pin_value),
  add constraint assessment_sessions_taxonomy_version_registered
    foreign key (taxonomy_version_kind, taxonomy_version)
    references public.config_pin_registry (pin_kind, pin_value),
  add constraint assessment_sessions_engine_version_registered
    foreign key (engine_algorithm_version_kind, engine_algorithm_version)
    references public.config_pin_registry (pin_kind, pin_value),
  add constraint assessment_sessions_scoring_version_registered
    foreign key (scoring_algorithm_version_kind, scoring_algorithm_version)
    references public.config_pin_registry (pin_kind, pin_value);

comment on column public.assessment_sessions.assessment_profile_version is
  'Spec §12.3 pin. FK-constrained (via assessment_profile_version_kind) to config_pin_registry -- a session can only pin a KNOWN, immutable config identity (Gate A item A15). Still text, not a foreign key to a Phase 3 blueprint/profile table -- ADR-006 §1 defers that; this migration content-addresses the placeholder identifier itself, not what it means.';
