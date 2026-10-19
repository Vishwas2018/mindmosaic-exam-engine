-- Review decisions are separate from publication authority and student attempts.
-- Append-only; no approvals are inferred or backfilled.
create table public.admin_draft_review_approvals (
  id uuid primary key default gen_random_uuid(),
  question_id text not null,
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  -- Audit identity, enforced as the current active admin by RLS. Do not add
  -- a live profile FK: this table contains no student data and must not
  -- become a dependency of student erasure.
  approved_by uuid not null,
  approved_at timestamptz not null default now(),
  checks jsonb not null check (checks = '{"correctness":true,"originality":true,"ageAppropriateness":true}'::jsonb),
  unique (question_id, content_hash, approved_by)
);
alter table public.admin_draft_review_approvals enable row level security;
revoke all on public.admin_draft_review_approvals from public, anon, authenticated;
grant select, insert on public.admin_draft_review_approvals to authenticated;
create policy admin_draft_review_read on public.admin_draft_review_approvals
for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null)
);
create policy admin_draft_review_insert on public.admin_draft_review_approvals
for insert to authenticated with check (
  approved_by = auth.uid() and
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null)
);
comment on table public.admin_draft_review_approvals is
  'Explicit human draft review decisions bound to SHA-256 of the complete source question, including embedded shared stimulus and visuals. Never publication evidence or student progress.';
