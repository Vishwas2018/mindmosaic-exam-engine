-- Phase 1 of docs/spec/scalable-assessment-platform-spec-v1.md: the immutable
-- runtime content projection (§9, §17.1, §21 Phase 1). Schema only — this
-- migration creates tables and locks them down; the rows arrive from
-- scripts/project-runtime-content.mts, and nothing in the application reads
-- these tables yet.
--
-- WHAT THIS IS FOR. Today a session records bare question-id strings
-- (exam_sessions.selected_question_ids) which are resolved at scoring time
-- against whichever compiled bank the deployment happens to have. Edit a
-- question and every historical attempt silently re-means. These tables are the
-- version-pinned target that fixes it in Phase 2; Phase 1 only builds and
-- verifies them alongside the compiled bank, which stays authoritative for
-- delivery (ADR-002 §7, and spec §19.2's expand–migrate–contract).
--
-- PROVENANCE (ADR-002 Amendment A). Only the 288 factory questions have
-- publication manifests. The ~1,005 curated questions are hand-authored in Git
-- and governed by scripts/validate-question-bank.mts — a real chain, just not a
-- manifest-shaped one. So publication_manifest_id is NULLABLE and every version
-- carries a provenance_class discriminator, tied together by a check constraint
-- so "no manifest" can never be confused with "manifest not imported yet". The
-- exit gate is "every published item matches a governed SOURCE", not "a
-- manifest".
--
-- SCOPES AND SKILLS ARE NOT HERE (ADR-002 Amendment B). item_scopes needs
-- programme_offerings and item_skills needs taxonomy_nodes; neither table
-- exists, and stubbing either would create a second independently-maintained
-- answer to a question ADR-001 §7 already assigns to year-registry.ts and
-- subject-registry.ts. No foreign keys to absent tables. The source scope facts
-- ride along as source_* scalar columns — the unresolved INPUT to Phase 1b, not
-- the scope model — and Phase 1b drops them when it normalises them.
--
-- SECURITY POSTURE. Every table below is created with RLS enabled and
-- **no policies at all**, and every privilege is revoked from anon and
-- authenticated. Spec §17.1 is explicit that learners must not receive a
-- queryable copy of the published bank; the sanctioned learner path is a
-- narrowly scoped SECURITY DEFINER reader that arrives in Phase 2, so building
-- any learner read path now would be building the wrong thing early.
--
-- The `revoke all` statements are not decoration. This project's legacy
-- api.auto_expose_new_tables default grants the full privilege set on every new
-- public table — that is precisely how `authenticated` ended up holding
-- TRUNCATE on all 17 existing public tables, which 20260811093000 fixed for
-- three of them and recorded as outstanding for the rest
-- (docs/adr/phase0-legacy-session-inventory.md §7). RLS does not apply to
-- TRUNCATE at all, so for these six tables the grant is the only control, and
-- it is removed here at creation rather than left for a later cleanup.

-- ---------------------------------------------------------------------------
-- publication_manifests — the factory half's provenance
-- ---------------------------------------------------------------------------
-- A verbatim import of content/question-factory/published-manifests/*.json, so
-- a runtime row can be traced to the exact manifest that produced it without
-- re-reading the repository (ADR-002 §3).
--
-- review_evidence_kind states what the evidence is WORTH, which matters because
-- all 288 manifests are currently schemaVersion 1: they carry `recoveredEvidence`
-- (each entry self-declaring `verifiability: "none"`) rather than a
-- `reviewRecords` chain that verifyReviewChain could check. Recording that
-- honestly is the point — a column that said only "has evidence" would imply a
-- guarantee that does not exist for any row in the table today.
create table public.publication_manifests (
  id                        text primary key,
  question_id               text        not null,
  content_hash              text        not null,
  revision                  integer     not null,
  blueprint_id              text,
  batch_id                  text,
  generator_adapter         jsonb,
  originality_fingerprint   text,
  difficulty_fingerprint    text,
  manifest_fingerprint      text,
  manifest_schema_version   integer     not null,
  review_evidence           jsonb       not null default '[]'::jsonb,
  review_evidence_kind      text        not null,
  published_at              timestamptz not null,
  imported_at               timestamptz not null default now(),
  constraint publication_manifests_content_hash_format
    check (content_hash ~ '^[0-9a-f]{64}$'),
  constraint publication_manifests_review_evidence_kind_known
    check (review_evidence_kind in ('verified_chain', 'recovered_unverifiable', 'none'))
);

create index publication_manifests_question_id_idx
  on public.publication_manifests (question_id);

-- ---------------------------------------------------------------------------
-- items — stable identity only (§9.1)
-- ---------------------------------------------------------------------------
-- Deliberately holds nothing that is a historical content snapshot, which is
-- why it is not itself versioned: there is nothing here that can meaningfully
-- change. item_code is the existing stable question id ('g3-nap-num-data-001',
-- 'man-00ca549c…'), kept because every other system in this repository already
-- refers to questions by it.
create table public.items (
  id               uuid primary key default gen_random_uuid(),
  item_code        text        not null unique,
  origin           text        not null,
  provenance_class text        not null,
  created_at       timestamptz not null default now(),
  retired_at       timestamptz,
  constraint items_provenance_class_known
    check (provenance_class in ('factory_manifest', 'curated_git_authored'))
);

-- ---------------------------------------------------------------------------
-- stimuli / stimulus_versions — shared passages and data (§9.4)
-- ---------------------------------------------------------------------------
-- The current content embeds a stimulus per question: 237 questions carry one,
-- but only 85 are distinct — 54 are shared, one by 15 questions. Storing a
-- passage once and pinning the version it is used at is what stops a typo fix
-- from being fifteen edits that can drift apart.
create table public.stimuli (
  id            uuid primary key default gen_random_uuid(),
  stimulus_code text        not null unique,
  created_at    timestamptz not null default now()
);

create table public.stimulus_versions (
  id           uuid primary key default gen_random_uuid(),
  stimulus_id  uuid        not null references public.stimuli (id) on delete restrict,
  revision     integer     not null,
  content      jsonb       not null,
  content_hash text        not null,
  created_at   timestamptz not null default now(),
  constraint stimulus_versions_revision_positive check (revision >= 1),
  constraint stimulus_versions_content_hash_format
    check (content_hash ~ '^[0-9a-f]{64}$'),
  -- One row per distinct passage. This IS the dedupe guarantee, not an
  -- optimisation: without it the projection could re-insert the same passage
  -- under a second stimulus and quietly undo §9.4.
  constraint stimulus_versions_content_hash_key unique (content_hash),
  constraint stimulus_versions_revision_key unique (stimulus_id, revision)
);

-- ---------------------------------------------------------------------------
-- item_versions — immutable learner-visible content (§9.2)
-- ---------------------------------------------------------------------------
-- NO answer key, NO rubric, NO private explanation. Those live in
-- item_answer_versions below, in a table with no privileges, because a
-- column-level split inside one row is one `select *` away from a leak (§9.3).
--
-- Content must also satisfy src/schemas/platform/runtime-content-version.schema.ts
-- before it is inserted; the projection script parses every row through it, and
-- that schema is `.strict()`, so an answer field smuggled into candidate_content
-- is a parse error rather than a silent leak.
create table public.item_versions (
  id                      uuid primary key default gen_random_uuid(),
  item_id                 uuid        not null references public.items (id) on delete restrict,
  revision                integer     not null,

  -- Learner-visible content.
  question_type           text        not null,
  prompt                  text        not null,
  candidate_content       jsonb       not null,
  visuals                 jsonb       not null default '[]'::jsonb,
  accessibility           jsonb       not null,
  estimated_time_seconds  integer     not null,
  authored_difficulty     text        not null,
  marks_available         integer     not null,
  stimulus_version_id     uuid        references public.stimulus_versions (id) on delete restrict,

  -- Identity and provenance.
  locale                  text        not null default 'en-AU',
  content_schema_version  integer     not null,
  content_hash            text        not null,
  provenance_class        text        not null,
  publication_manifest_id text        references public.publication_manifests (id) on delete restrict,
  published_at            timestamptz not null,
  projected_at            timestamptz not null default now(),

  -- Unresolved source scope — Phase 1b input, NOT the scope model.
  -- ADR-002 Amendment B; dropped when item_scopes/item_skills land.
  source_year_level       smallint    not null,
  source_exam_style       text        not null,
  source_subject          text        not null,
  source_skill            text,

  constraint item_versions_revision_positive check (revision >= 1),
  constraint item_versions_revision_key unique (item_id, revision),
  constraint item_versions_content_hash_format
    check (content_hash ~ '^[0-9a-f]{64}$'),
  -- Global, not per-item: two items with identical content are the same
  -- content, and the projection must not create both (ADR-003 §8).
  constraint item_versions_content_hash_key unique (content_hash),
  constraint item_versions_difficulty_known
    check (authored_difficulty in ('easy', 'medium', 'challenging')),
  constraint item_versions_marks_positive check (marks_available > 0),
  constraint item_versions_estimated_time_positive check (estimated_time_seconds > 0),
  -- Spec §6.1: year level is a smallint between 1 and 12, never a UUID lookup.
  constraint item_versions_source_year_level_range
    check (source_year_level between 1 and 12),
  constraint item_versions_provenance_class_known
    check (provenance_class in ('factory_manifest', 'curated_git_authored')),
  -- The pair that makes "no manifest" unambiguous in both directions
  -- (ADR-002 Amendment A2).
  constraint item_versions_manifest_matches_provenance check (
    (provenance_class = 'factory_manifest'      and publication_manifest_id is not null) or
    (provenance_class = 'curated_git_authored'  and publication_manifest_id is null)
  )
);

create index item_versions_item_id_idx on public.item_versions (item_id);
create index item_versions_manifest_idx on public.item_versions (publication_manifest_id);
create index item_versions_stimulus_idx on public.item_versions (stimulus_version_id);
-- The lookup Phase 1b and the readiness/capacity work will both need.
create index item_versions_source_scope_idx
  on public.item_versions (source_year_level, source_exam_style, source_subject);

-- ---------------------------------------------------------------------------
-- item_answer_versions — private answers (§9.3)
-- ---------------------------------------------------------------------------
-- Separate table, zero privileges for anon and authenticated, RLS on, no
-- policies. Spec §9.3 permits exactly one runtime reader — a narrowly scoped
-- SECURITY DEFINER scoring function with a fixed search_path, which authorises
-- the caller and returns scored outcomes rather than answer rows. That function
-- is Phase 2 work and is deliberately NOT created here: shipping it now would
-- mean shipping a learner-reachable path to answer data before there is a
-- session model to authorise it against.
--
-- One row per item_version (not per item): the answer belongs to the exact
-- content it grades, so a new revision gets its own answer row.
create table public.item_answer_versions (
  id                     uuid primary key default gen_random_uuid(),
  item_version_id        uuid        not null unique
                                     references public.item_versions (id) on delete restrict,
  answer_key             jsonb       not null,
  grading_rules          jsonb       not null default '{}'::jsonb,
  rubric                 jsonb,
  private_explanation    text,
  grading_schema_version integer     not null default 1,
  created_at             timestamptz not null default now(),
  constraint item_answer_versions_grading_schema_version_positive
    check (grading_schema_version >= 1)
);

-- ---------------------------------------------------------------------------
-- Immutability (§9.2, ADR-003 A5)
-- ---------------------------------------------------------------------------
-- Revoking learner privileges is not sufficient here, because the projection
-- job itself connects as a privileged role and could otherwise UPDATE content
-- in place — which is exactly the failure mode immutable versioning exists to
-- prevent. This trigger makes an in-place content edit impossible for every
-- role, including the table owner.
--
-- projected_at is deliberately excluded from the frozen set: re-running the
-- projection may legitimately re-stamp when a row was last confirmed, and that
-- is not learner-visible content. retired_at on items is likewise mutable —
-- retirement is an operational fact, not content (ADR-002 §5).
create or replace function public.reject_content_version_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_table_name = 'item_versions' then
    if new.item_id                is distinct from old.item_id
    or new.revision               is distinct from old.revision
    or new.question_type          is distinct from old.question_type
    or new.prompt                 is distinct from old.prompt
    or new.candidate_content      is distinct from old.candidate_content
    or new.visuals                is distinct from old.visuals
    or new.accessibility          is distinct from old.accessibility
    or new.estimated_time_seconds is distinct from old.estimated_time_seconds
    or new.authored_difficulty    is distinct from old.authored_difficulty
    or new.marks_available        is distinct from old.marks_available
    or new.stimulus_version_id    is distinct from old.stimulus_version_id
    or new.locale                 is distinct from old.locale
    or new.content_hash           is distinct from old.content_hash
    or new.provenance_class       is distinct from old.provenance_class
    or new.publication_manifest_id is distinct from old.publication_manifest_id
    then
      raise exception 'item_versions is immutable; publish a new revision instead'
        using errcode = 'MM101';
    end if;
    return new;
  end if;

  -- stimulus_versions and item_answer_versions are immutable in full.
  raise exception '% is immutable; write a new version instead', tg_table_name
    using errcode = 'MM101';
end;
$$;

create trigger item_versions_immutable
  before update on public.item_versions
  for each row execute function public.reject_content_version_update();

create trigger stimulus_versions_immutable
  before update on public.stimulus_versions
  for each row execute function public.reject_content_version_update();

create trigger item_answer_versions_immutable
  before update on public.item_answer_versions
  for each row execute function public.reject_content_version_update();

-- ---------------------------------------------------------------------------
-- RLS and privileges (§17.1)
-- ---------------------------------------------------------------------------
-- RLS enabled with NO policies on all six tables. Postgres RLS is default-deny,
-- so a table with RLS on and no policy is readable by nobody except roles that
-- bypass RLS (the table owner and service_role) — which is exactly the Phase 1
-- posture: the projection job writes, and nothing else touches these tables.
alter table public.publication_manifests  enable row level security;
alter table public.items                  enable row level security;
alter table public.stimuli                enable row level security;
alter table public.stimulus_versions      enable row level security;
alter table public.item_versions          enable row level security;
alter table public.item_answer_versions   enable row level security;

-- `revoke all` covers SELECT/INSERT/UPDATE/DELETE **and TRUNCATE**, the one RLS
-- cannot reach. See the header note on auto_expose_new_tables.
revoke all on public.publication_manifests from anon, authenticated;
revoke all on public.items                 from anon, authenticated;
revoke all on public.stimuli               from anon, authenticated;
revoke all on public.stimulus_versions     from anon, authenticated;
revoke all on public.item_versions         from anon, authenticated;
revoke all on public.item_answer_versions  from anon, authenticated;

-- Belt and braces for the answer table specifically: if a future migration or
-- an auto-expose default re-grants a column-level privilege, this makes the
-- intent unmistakable in pg_attribute as well as pg_class.
revoke all (answer_key, grading_rules, rubric, private_explanation)
  on public.item_answer_versions from anon, authenticated;

comment on table public.item_answer_versions is
  'Private answers (spec §9.3). No anon/authenticated privileges and no RLS policy, by design. The only sanctioned runtime reader is a narrowly scoped SECURITY DEFINER scoring function arriving in Phase 2; no general answer-read RPC or view may ever be granted to authenticated.';

comment on column public.item_versions.publication_manifest_id is
  'Nullable: curated Git-authored items have no manifest (ADR-002 Amendment A). Paired with provenance_class by item_versions_manifest_matches_provenance.';

comment on column public.item_versions.source_year_level is
  'Unresolved source scope, Phase 1b input only — NOT the scope model (ADR-002 Amendment B). Dropped when item_scopes lands.';
