-- Rollback for 20261124090000_admin_review_decisions.sql
-- Safe and non-destructive to all existing tables, including public.admin_draft_review_approvals.
-- Run ONLY with explicit owner approval if reverting the extended admin review decisions table.

begin;

drop trigger if exists admin_draft_review_decisions_immutable on public.admin_draft_review_decisions;
drop function if exists public.deny_admin_review_decision_mutation();
drop policy if exists admin_draft_review_decisions_read on public.admin_draft_review_decisions;
drop policy if exists admin_draft_review_decisions_insert on public.admin_draft_review_decisions;
drop function if exists public.authenticated_admin_email();
drop index if exists public.admin_draft_review_decisions_unique_approval_idx;
drop index if exists public.admin_draft_review_decisions_question_idx;
drop index if exists public.admin_draft_review_decisions_batch_idx;
drop table if exists public.admin_draft_review_decisions;

commit;
