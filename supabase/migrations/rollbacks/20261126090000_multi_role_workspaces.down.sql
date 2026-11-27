-- Rollback for 20261126090000_multi_role_workspaces.sql (DEV first; never on production without owner approval).
-- Restores the original profiles.role = 'admin' policies, is_admin() and content-factory approval functions.
--
-- What is PRESERVED
--   * public.role_audit_events (append-only, MM107) is KEPT, with its immutability triggers. Before user_roles is dropped,
--     a 'rollback' snapshot row is written for every entitlement, so the final state (granted / revoked) survives.
--   * Admin review decision/approval history, parent_children, subscriptions and every profiles row are untouched.
-- What CHANGES (by design, all audited)
--   * Dual-role users (profiles.role <> 'admin' with an active grant) lose admin: the old model cannot express them.
--   * A REVOKED admin whose profile still says role = 'admin' would regain admin under the old policies. To keep the
--     revocation effective, such profiles are demoted to 'parent' and a 'rollback' audit row records it.
-- Re-applying the migration afterwards is supported (it adopts the kept audit table).
begin;

-- Stop the sync trigger first so the demotions below do not fire it.
drop trigger if exists profiles_sync_admin_entitlement on public.profiles;

-- 1. Snapshot the final entitlement state into the permanent audit trail.
insert into public.role_audit_events (user_id, role, action, actor, reason)
select ur.user_id, ur.role, 'rollback', 'rollback:20261126090000',
       case when ur.revoked_at is null then 'snapshot at rollback: entitlement was ACTIVE (granted_at ' || ur.granted_at || ')'
            else 'snapshot at rollback: entitlement was REVOKED (revoked_at ' || ur.revoked_at || ')' end
from public.user_roles ur;

-- 2. Keep revocations effective: a revoked admin with an admin-valued profile would be resurrected by the old policies.
with demoted as (
  update public.profiles p set role = 'parent'
  from public.user_roles ur
  where ur.user_id = p.id and ur.role = 'admin' and ur.revoked_at is not null and p.role = 'admin'
  returning p.id
)
insert into public.role_audit_events (user_id, role, action, actor, reason)
select id, 'admin', 'rollback', 'rollback:20261126090000', 'profile role admin demoted to parent so a revoked admin is not resurrected' from demoted;

-- 3. Restore the original policies and functions.
drop policy if exists admin_draft_review_decisions_read on public.admin_draft_review_decisions;
create policy admin_draft_review_decisions_read on public.admin_draft_review_decisions
for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null)
);

drop policy if exists admin_draft_review_decisions_insert on public.admin_draft_review_decisions;
create policy admin_draft_review_decisions_insert on public.admin_draft_review_decisions
for insert to authenticated with check (
  reviewer_id = auth.uid()
  and lower(trim(reviewer_email)) = lower(trim(coalesce(public.authenticated_admin_email(), '')))
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null
      and lower(regexp_replace(trim(coalesce(p.display_name, '')), '\s+', ' ', 'g'))
        = lower(regexp_replace(trim(reviewer_name), '\s+', ' ', 'g'))
  )
);

drop policy if exists admin_draft_review_read on public.admin_draft_review_approvals;
create policy admin_draft_review_read on public.admin_draft_review_approvals
for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null)
);

drop policy if exists admin_draft_review_insert on public.admin_draft_review_approvals;
create policy admin_draft_review_insert on public.admin_draft_review_approvals
for insert to authenticated with check (
  approved_by = auth.uid() and
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null)
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
$$;

-- Restore the original content-factory owner-approval functions (profiles.role = 'admin').
create or replace function public.enforce_owner_approval_actor() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare v_role text;
begin
  if auth.uid() is null or new.approved_by<>auth.uid() then raise exception 'authenticated owner identity required' using errcode='42501'; end if;
  select role into v_role from public.profiles where id=auth.uid();
  if v_role is distinct from 'admin' then raise exception 'owner approval required' using errcode='42501'; end if;
  return new;
end $$;

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

drop function if exists public.grant_admin_role(uuid, text, text);
drop function if exists public.revoke_admin_role(uuid, text, text);
drop function if exists public.sync_admin_entitlement_from_profile();
drop function if exists public.has_active_admin_role();
drop function if exists public.admin_mfa_satisfied();
drop function if exists public.admin_mfa_required();
drop table if exists public.security_settings;
drop table if exists public.user_roles;
-- public.role_audit_events and public.deny_role_audit_mutation() are intentionally KEPT (audit history).

commit;
