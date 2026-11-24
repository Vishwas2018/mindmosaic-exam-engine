-- Backward-compatible extension for MindMosaic Admin Portal draft review decisions.
-- Preserves public.admin_draft_review_approvals and all historical approval rows untouched.
-- Append-only, revision-bound, human-only decisions with multi-domain hash binding (D1/D2/D3),
-- reviewer identity snapshot, full question snapshot, and tamper-evident evidence fingerprint.
-- Never grants automatic publication; publication remains gated by the governed pipeline.

create table public.admin_draft_review_decisions (
  id uuid primary key default gen_random_uuid(),
  bank_id text not null check (bank_id in ('scholarship-y6-core', 'vihaan-scholarship-500')),
  batch_id text not null check (length(trim(batch_id)) > 0 and length(batch_id) <= 100),
  question_id text not null check (length(trim(question_id)) > 0 and length(question_id) <= 100),
  item_kind text not null check (item_kind in ('question', 'writing_prompt')),
  pool text not null check (pool in ('practice', 'unseen_mock', 'exposed_mock_practice_only')),
  source_revision text not null check (length(trim(source_revision)) > 0 and length(source_revision) <= 128),
  revision_number integer not null default 0 check (revision_number >= 0),
  -- D1: SHA-256 of canonical raw draft question (incl. embedded stimulus and visuals).
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  -- D2: SHA-256 of factory candidate representation (null for writing prompts).
  candidate_hash text check (candidate_hash is null or candidate_hash ~ '^[a-f0-9]{64}$'),
  -- D3: SHA-256 of published Question or WritingTask (what governed approval records bind to).
  published_content_hash text not null check (published_content_hash ~ '^[a-f0-9]{64}$'),
  decision text not null check (decision in ('approve', 'revise', 'reject')),
  checks jsonb not null,
  blind_solved boolean not null default false,
  notes text not null default '' check (length(notes) <= 4000),
  -- Audit identity enforced as the active non-revoked admin caller via RLS.
  -- Deliberately no live FK to profiles so this table never couples to student erasure.
  reviewer_id uuid not null,
  reviewer_name text not null check (
    length(trim(reviewer_name)) between 3 and 120
    and array_length(regexp_split_to_array(trim(reviewer_name), '\s+'), 1) >= 2
    and reviewer_name ~ '^[[:alpha:]][[:alpha:]'' .-]+$'
    and reviewer_name !~* '(^|\s)[[:alpha:]](\s|$)'
    and reviewer_name !~* '\y(claude|anthropic|opus|sonnet|haiku|gpt|chatgpt|openai|gemini|copilot|codex|qwen|llama|mistral|deepseek|grok|llm|bot|automated?|ai|antigravity|agent|script|cron|system|service)\y'
    and reviewer_name !~* '(claude|anthropic|openai|chatgpt|copilot|codex|antigravity|automated|bot)'
  ),
  reviewer_email text not null check (
    length(trim(reviewer_email)) between 5 and 254
    and reviewer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  question_snapshot jsonb not null check (jsonb_typeof(question_snapshot) = 'object'),
  evidence_fingerprint text not null check (evidence_fingerprint ~ '^[a-f0-9]{64}$'),
  decided_at timestamptz not null default now(),
  constraint admin_draft_review_decisions_checks_valid check (
    jsonb_typeof(checks) = 'object'
    and (
      decision <> 'approve'
      or checks @> '{"correctness":true,"originality":true,"ageAppropriateness":true,"editorialInterpretation":true,"difficultyCalibrated":true}'::jsonb
    )
  ),
  constraint admin_draft_review_decisions_notes_required check (
    decision = 'approve' or length(trim(notes)) >= 10
  ),
  -- Known defective draft revisions cannot be approved at their defective hash;
  -- reviewers may still record 'revise' or 'reject', and a corrected revision
  -- (with a new content_hash) becomes eligible for fresh human review.
  constraint admin_draft_review_decisions_known_defect_blocked check (
    not (
      question_id = 'vihaan-e500-m069'
      and content_hash = 'd23176dea41737d3b0ed8833b67f8edb2532fe046c609b7538d9227d0c28fb05'
      and decision = 'approve'
    )
  )
);

-- One approval per reviewer for the exact same (bank, question, content revision).
-- Revise/reject entries remain append-only so sequential re-review history is preserved.
create unique index admin_draft_review_decisions_unique_approval_idx
  on public.admin_draft_review_decisions (bank_id, question_id, content_hash, reviewer_id)
  where (decision = 'approve');

create index admin_draft_review_decisions_question_idx
  on public.admin_draft_review_decisions (bank_id, question_id, decided_at desc);

create index admin_draft_review_decisions_batch_idx
  on public.admin_draft_review_decisions (bank_id, batch_id, decision);

create or replace function public.deny_admin_review_decision_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Admin review decisions are append-only and immutable; record a new decision instead.'
    using errcode = 'MM106';
end;
$$;

revoke all on function public.deny_admin_review_decision_mutation() from public, anon, authenticated;

create trigger admin_draft_review_decisions_immutable
  before update or delete on public.admin_draft_review_decisions
  for each row execute function public.deny_admin_review_decision_mutation();

create trigger admin_draft_review_decisions_no_truncate
  before truncate on public.admin_draft_review_decisions
  for each statement execute function public.deny_admin_review_decision_mutation();

alter table public.admin_draft_review_decisions enable row level security;

revoke all on public.admin_draft_review_decisions from public, anon, authenticated;
grant select, insert on public.admin_draft_review_decisions to authenticated;

create policy admin_draft_review_decisions_read on public.admin_draft_review_decisions
for select to authenticated using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.access_revoked_at is null
  )
);

create or replace function public.authenticated_admin_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email
  from auth.users u
  where u.id = auth.uid()
$$;

revoke all on function public.authenticated_admin_email() from public, anon, authenticated;
grant execute on function public.authenticated_admin_email() to authenticated;

create policy admin_draft_review_decisions_insert on public.admin_draft_review_decisions
for insert to authenticated with check (
  reviewer_id = auth.uid()
  and lower(trim(reviewer_email)) = lower(trim(coalesce(public.authenticated_admin_email(), '')))
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.access_revoked_at is null
      and lower(regexp_replace(trim(coalesce(p.display_name, '')), '\s+', ' ', 'g'))
        = lower(regexp_replace(trim(reviewer_name), '\s+', ' ', 'g'))
  )
);

comment on table public.admin_draft_review_decisions is
  'Append-only, revision-bound human draft review decisions (approve/revise/reject) with D1/D2/D3 hashes, human reviewer identity snapshot, question snapshot and evidence fingerprint. Preserves legacy admin_draft_review_approvals; never auto-publishes content.';
