-- MindMosaic Content Platform v2, Phase 1 authoring control plane.
-- Candidate data is isolated from learner-readable runtime projections.

create type public.content_origin as enum ('manual_owner','ai_codex','ai_claude','structured_import','legacy_import','future_external_import');
create type public.content_lifecycle_state as enum ('draft','generated','validated','reviewed','approved','published','retired');
create type public.content_risk_level as enum ('low','elevated','high');

alter table public.items drop constraint items_provenance_class_known;
alter table public.items add constraint items_provenance_class_known check (provenance_class in ('factory_manifest','curated_git_authored','database_authoring'));
alter table public.item_versions drop constraint item_versions_provenance_class_known;
alter table public.item_versions drop constraint item_versions_manifest_matches_provenance;
alter table public.item_versions add constraint item_versions_provenance_class_known check (provenance_class in ('factory_manifest','curated_git_authored','database_authoring'));
alter table public.item_versions add constraint item_versions_manifest_matches_provenance check (
  (provenance_class='factory_manifest' and publication_manifest_id is not null) or
  (provenance_class in ('curated_git_authored','database_authoring') and publication_manifest_id is null)
);
alter table public.item_versions add column learner_explanation text;
alter table public.item_versions add column asset_refs jsonb not null default '[]'::jsonb;

create table public.content_batches (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  origin public.content_origin not null,
  state public.content_lifecycle_state not null default 'draft',
  generator_adapter text,
  generation_model text,
  prompt_contract_version text,
  blueprint_assignment jsonb not null default '{}'::jsonb,
  source_archive jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(blueprint_assignment) = 'object')
);

create table public.authoring_questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.authoring_question_revisions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.authoring_questions(id),
  revision integer not null check (revision > 0),
  batch_id uuid not null references public.content_batches(id),
  origin public.content_origin not null,
  state public.content_lifecycle_state not null,
  schema_version integer not null,
  canonical_content jsonb not null,
  private_evidence jsonb not null default '{}'::jsonb,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  supersedes_revision_id uuid references public.authoring_question_revisions(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(question_id, revision), unique(content_hash),
  check (jsonb_typeof(canonical_content) = 'object'),
  check (jsonb_typeof(private_evidence) = 'object')
);

create table public.content_validation_runs (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.authoring_question_revisions(id),
  revision_content_hash text not null check (revision_content_hash ~ '^[a-f0-9]{64}$'),
  validator_contract_version text not null,
  passed boolean not null,
  hard_failures jsonb not null default '[]'::jsonb,
  risk_signals jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.authoring_question_revisions(id),
  revision_content_hash text not null check (revision_content_hash ~ '^[a-f0-9]{64}$'),
  reviewer_kind text not null check (reviewer_kind in ('ai_codex','ai_claude','human_owner','future_human_reviewer')),
  reviewer_id text not null,
  generator_origin public.content_origin not null,
  review_contract_version text not null,
  review_stage text not null default 'comparison' check (review_stage in ('blind_solve','comparison')),
  blind_solve_hash text check (blind_solve_hash is null or blind_solve_hash ~ '^[a-f0-9]{64}$'),
  decision text not null check (decision in ('pass','revise','reject','escalate')),
  supplied_answer_agreement boolean not null,
  structured_evidence jsonb not null,
  created_at timestamptz not null default now(),
  check (not (generator_origin = 'ai_codex' and reviewer_kind = 'ai_codex')),
  check (not (generator_origin = 'ai_claude' and reviewer_kind = 'ai_claude')),
  check ((review_stage='blind_solve' and blind_solve_hash is null) or (review_stage='comparison' and blind_solve_hash is not null)),
  check (jsonb_typeof(structured_evidence)='object')
);

create table public.content_risk_assessments (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.authoring_question_revisions(id),
  revision_content_hash text not null check (revision_content_hash ~ '^[a-f0-9]{64}$'),
  level public.content_risk_level not null,
  signals jsonb not null default '[]'::jsonb,
  requires_individual_owner_review boolean not null,
  created_at timestamptz not null default now()
);

create table public.content_fingerprints (
  revision_id uuid not null references public.authoring_question_revisions(id),
  fingerprint_kind text not null check (fingerprint_kind in ('complete','normalised_stem','scenario_template','answer_structure','reading_stimulus','semantic_embedding','distractor_pattern','learner_explanation','visual_structure')),
  fingerprint text not null,
  created_at timestamptz not null default now(),
  primary key(revision_id, fingerprint_kind)
);
create index content_fingerprints_lookup_idx on public.content_fingerprints(fingerprint_kind,fingerprint);

create table public.content_owner_approvals (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid references public.authoring_question_revisions(id),
  batch_id uuid references public.content_batches(id),
  approved_by uuid not null references auth.users(id),
  approval_mode text not null check (approval_mode in ('individual','batch_sampled')),
  qa_evidence jsonb not null,
  approved_at timestamptz not null default now(),
  check ((revision_id is null) <> (batch_id is null))
);

create or replace function public.enforce_owner_approval_actor() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare v_role text;
begin
  if auth.uid() is null or new.approved_by<>auth.uid() then raise exception 'authenticated owner identity required' using errcode='42501'; end if;
  select role into v_role from public.profiles where id=auth.uid();
  if v_role is distinct from 'admin' then raise exception 'owner approval required' using errcode='42501'; end if;
  return new;
end $$;
create trigger content_owner_approval_actor before insert on public.content_owner_approvals for each row execute function public.enforce_owner_approval_actor();

create table public.content_publications (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null unique references public.authoring_question_revisions(id),
  approval_id uuid not null references public.content_owner_approvals(id),
  runtime_item_version_id uuid not null unique references public.item_versions(id),
  revision_content_hash text not null check (revision_content_hash ~ '^[a-f0-9]{64}$'),
  evidence_bundle_hash text not null check (evidence_bundle_hash ~ '^[a-f0-9]{64}$'),
  published_at timestamptz not null default now()
);

create table public.content_audit_events (
  id bigint generated always as identity primary key,
  batch_id uuid references public.content_batches(id),
  revision_id uuid references public.authoring_question_revisions(id),
  actor_id uuid references auth.users(id),
  actor_kind text not null check (actor_kind in ('owner','ai_codex','ai_claude','service','importer')),
  event_type text not null,
  evidence_hash text check (evidence_hash is null or evidence_hash ~ '^[a-f0-9]{64}$'),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.content_assets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.content_asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.content_assets(id),
  revision integer not null check (revision > 0),
  storage_bucket text not null default 'content-assets-private',
  storage_path text not null,
  media_type text not null,
  asset_type text not null check (asset_type in ('image','audio','transcript','document','other')),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  byte_size bigint not null check (byte_size > 0),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  accessibility jsonb not null default '{}'::jsonb,
  origin text not null check (origin in ('owner_created','ai_generated','structured_import','legacy_import','licensed')),
  provenance jsonb not null default '{}'::jsonb,
  licence_declaration text not null,
  status text not null default 'candidate' check (status in ('candidate','approved','published','retired')),
  derivative_of uuid references public.content_asset_versions(id),
  created_at timestamptz not null default now(),
  unique(asset_id, revision), unique(content_hash)
);
create table public.authoring_revision_assets (
  revision_id uuid not null references public.authoring_question_revisions(id),
  asset_version_id uuid not null references public.content_asset_versions(id),
  role text not null check (role in ('stimulus_image','question_image','audio','transcript','other')),
  primary key(revision_id, asset_version_id, role)
);

do $$ begin
  if to_regclass('storage.buckets') is not null then
    execute $bucket$
      insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
      values('content-assets-private','content-assets-private',false,10485760,array['image/png','image/jpeg','image/webp','image/avif','audio/mpeg','audio/ogg','audio/wav','text/plain','application/pdf'])
      on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types
    $bucket$;
  end if;
end $$;

create table public.assessment_forms (
  id uuid primary key default gen_random_uuid(),
  stable_key text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.assessment_form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.assessment_forms(id),
  revision integer not null check (revision > 0),
  blueprint_version_id uuid references public.blueprint_versions(id),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  state text not null check (state in ('draft','ready','published','retired')),
  created_at timestamptz not null default now(),
  unique(form_id, revision), unique(content_hash)
);
create table public.assessment_form_items (
  form_version_id uuid not null references public.assessment_form_versions(id),
  position integer not null check (position > 0),
  item_version_id uuid not null references public.item_versions(id),
  stimulus_version_id uuid references public.stimulus_versions(id),
  asset_version_ids uuid[] not null default '{}',
  primary key(form_version_id, position), unique(form_version_id, item_version_id)
);

-- Authoring data is owner-only. Runtime tables retain their existing policies.
alter table public.content_batches enable row level security;
alter table public.authoring_questions enable row level security;
alter table public.authoring_question_revisions enable row level security;
alter table public.content_validation_runs enable row level security;
alter table public.content_reviews enable row level security;
alter table public.content_risk_assessments enable row level security;
alter table public.content_fingerprints enable row level security;
alter table public.content_owner_approvals enable row level security;
alter table public.content_publications enable row level security;
alter table public.content_audit_events enable row level security;
alter table public.content_assets enable row level security;
alter table public.content_asset_versions enable row level security;
alter table public.authoring_revision_assets enable row level security;
alter table public.assessment_forms enable row level security;
alter table public.assessment_form_versions enable row level security;
alter table public.assessment_form_items enable row level security;

do $$ declare t text; begin
  foreach t in array array['content_batches','authoring_questions','authoring_question_revisions','content_validation_runs','content_reviews','content_risk_assessments','content_fingerprints','content_owner_approvals','content_publications','content_audit_events','content_assets','content_asset_versions','authoring_revision_assets','assessment_forms','assessment_form_versions','assessment_form_items']
  loop execute format('revoke all on public.%I from anon, authenticated', t); end loop;
end $$;

create or replace function public.reject_authoring_revision_mutation() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if tg_table_name='authoring_question_revisions' and tg_op='UPDATE'
     and (to_jsonb(new)-'state')=(to_jsonb(old)-'state') then return new; end if;
  raise exception '% revisions are immutable; create a new revision', tg_table_name using errcode='MM101';
end $$;
create trigger authoring_question_revisions_immutable before update or delete on public.authoring_question_revisions for each row execute function public.reject_authoring_revision_mutation();
create trigger content_asset_versions_immutable before update or delete on public.content_asset_versions for each row execute function public.reject_authoring_revision_mutation();
create trigger assessment_form_items_immutable before update or delete on public.assessment_form_items for each row execute function public.reject_authoring_revision_mutation();
create trigger content_validation_runs_immutable before update or delete on public.content_validation_runs for each row execute function public.reject_authoring_revision_mutation();
create trigger content_reviews_immutable before update or delete on public.content_reviews for each row execute function public.reject_authoring_revision_mutation();
create trigger content_risk_assessments_immutable before update or delete on public.content_risk_assessments for each row execute function public.reject_authoring_revision_mutation();
create trigger content_owner_approvals_immutable before update or delete on public.content_owner_approvals for each row execute function public.reject_authoring_revision_mutation();
create trigger content_publications_immutable before update or delete on public.content_publications for each row execute function public.reject_authoring_revision_mutation();
create trigger content_audit_events_immutable before update or delete on public.content_audit_events for each row execute function public.reject_authoring_revision_mutation();

create or replace function public.enforce_content_lifecycle() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
  if new.state=old.state then return new; end if;
  if not ((old.state='draft' and new.state in ('generated','validated')) or
          (old.state='generated' and new.state='validated') or
          (old.state='validated' and new.state='reviewed') or
          (old.state='reviewed' and new.state in ('approved','draft')) or
          (old.state='approved' and new.state in ('published','draft')) or
          (old.state='published' and new.state='retired')) then
    raise exception 'illegal content lifecycle transition: % -> %',old.state,new.state using errcode='MM103';
  end if;
  return new;
end $$;
create trigger authoring_question_revisions_lifecycle before update of state on public.authoring_question_revisions for each row execute function public.enforce_content_lifecycle();

create or replace function public.content_review_quality_passes(p_evidence jsonb)
returns boolean language sql immutable strict set search_path=public,pg_temp as $$
  select p_evidence #>> '{blind,ambiguityStatus}' = 'clear'
     and coalesce((p_evidence #>> '{blind,uniquelyDefensible}')::boolean,false)
     and coalesce((p_evidence #>> '{blind,sufficientInformation}')::boolean,false)
     and p_evidence #>> '{blind,visualStatus}' = 'supported'
     and p_evidence #>> '{blind,assessmentFit}' = 'appropriate'
     and jsonb_array_length(coalesce(p_evidence #> '{blind,australianEnglishIssues}','[]'::jsonb)) = 0
     and coalesce((p_evidence #>> '{comparison,declaredAnswerAgreement}')::boolean,false)
     and p_evidence #>> '{comparison,explanationQuality}' = 'good'
     and p_evidence #>> '{comparison,outcome}' = 'pass'
$$;

-- Approval cannot be generated by service clients. This RPC derives owner identity
-- from auth.uid(); a future multi-reviewer role can extend the same boundary.
create or replace function public.owner_approve_content(p_revision_id uuid, p_qa_evidence jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_role text;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if v_role is distinct from 'admin' then raise exception 'owner approval required' using errcode='42501'; end if;
  if not exists (
    select 1 from public.authoring_question_revisions q
    where q.id=p_revision_id and q.state='reviewed'
      and (select v.passed and v.revision_content_hash=q.content_hash from public.content_validation_runs v where v.revision_id=q.id order by v.created_at desc,v.id desc limit 1) is true
      and (select r.review_stage='comparison' and r.decision='pass' and r.supplied_answer_agreement and r.revision_content_hash=q.content_hash and public.content_review_quality_passes(r.structured_evidence) from public.content_reviews r where r.revision_id=q.id order by r.created_at desc,r.id desc limit 1) is true
      and (select a.revision_content_hash=q.content_hash from public.content_risk_assessments a where a.revision_id=q.id order by a.created_at desc,a.id desc limit 1) is true
  ) then raise exception 'revision is not eligible for approval' using errcode='MM102'; end if;
  insert into public.content_owner_approvals(revision_id,approved_by,approval_mode,qa_evidence)
  values(p_revision_id,auth.uid(),'individual',p_qa_evidence) returning id into v_id;
  update public.authoring_question_revisions set state='approved' where id=p_revision_id;
  return v_id;
end $$;
revoke all on function public.owner_approve_content(uuid,jsonb) from public, anon;
grant execute on function public.owner_approve_content(uuid,jsonb) to authenticated;

create or replace function public.owner_approve_batch(p_batch_id uuid, p_qa_evidence jsonb)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_role text; v_total integer; v_sampled integer; v_approved integer;
begin
  select role into v_role from public.profiles where id=auth.uid();
  if v_role is distinct from 'admin' then raise exception 'owner approval required' using errcode='42501'; end if;
  select count(*) into v_total from public.authoring_question_revisions where batch_id=p_batch_id and state='reviewed';
  v_sampled := coalesce((p_qa_evidence->>'sampledCount')::integer,0);
  if v_total=0 or v_sampled < least(v_total,greatest(5,ceil(v_total*0.10)::integer))
     or coalesce((p_qa_evidence->>'sampleFailureCount')::integer,0) <> 0 then
    raise exception 'batch QA sample is insufficient or failed' using errcode='MM104';
  end if;
  if exists (
    select 1 from public.authoring_question_revisions q
    where q.batch_id=p_batch_id and q.state='reviewed' and (
      (select v.passed and v.revision_content_hash=q.content_hash from public.content_validation_runs v where v.revision_id=q.id order by v.created_at desc,v.id desc limit 1) is distinct from true or
      (select r.review_stage='comparison' and r.decision='pass' and r.supplied_answer_agreement and r.revision_content_hash=q.content_hash and public.content_review_quality_passes(r.structured_evidence) from public.content_reviews r where r.revision_id=q.id order by r.created_at desc,r.id desc limit 1) is distinct from true or
      (select a.requires_individual_owner_review or a.level<>'low' or a.revision_content_hash<>q.content_hash from public.content_risk_assessments a where a.revision_id=q.id order by a.created_at desc,a.id desc limit 1) is distinct from false
    )
  ) then raise exception 'batch contains ineligible or elevated-risk revisions' using errcode='MM102'; end if;
  insert into public.content_owner_approvals(batch_id,approved_by,approval_mode,qa_evidence)
  values(p_batch_id,auth.uid(),'batch_sampled',p_qa_evidence);
  update public.authoring_question_revisions set state='approved' where batch_id=p_batch_id and state='reviewed';
  get diagnostics v_approved=row_count; return v_approved;
end $$;
revoke all on function public.owner_approve_batch(uuid,jsonb) from public,anon;
grant execute on function public.owner_approve_batch(uuid,jsonb) to authenticated;

create or replace function public.enforce_content_publication() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare q public.authoring_question_revisions; a public.content_owner_approvals;
begin
  select * into q from public.authoring_question_revisions where id=new.revision_id;
  select * into a from public.content_owner_approvals where id=new.approval_id;
  if q.state<>'approved' or new.revision_content_hash<>q.content_hash then
    raise exception 'publication content or state is stale' using errcode='MM105'; end if;
  if not (a.revision_id=q.id or a.batch_id=q.batch_id) then
    raise exception 'approval does not cover this revision' using errcode='MM105'; end if;
  update public.authoring_question_revisions set state='published' where id=q.id;
  return new;
end $$;
create trigger content_publication_guard before insert on public.content_publications for each row execute function public.enforce_content_publication();
