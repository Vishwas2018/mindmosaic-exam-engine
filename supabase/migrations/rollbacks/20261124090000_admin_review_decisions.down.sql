-- Rollback for 20261124090000_admin_review_decisions.sql
-- Safe, idempotent, and non-destructive to all existing tables, including public.admin_draft_review_approvals.
-- Run ONLY with explicit owner approval if reverting the extended admin review decisions table.

begin;

-- Dropping the table first automatically removes its attached triggers, RLS policies,
-- constraints and indexes, keeping rollback safely idempotent even if executed twice.
drop table if exists public.admin_draft_review_decisions;
drop function if exists public.deny_admin_review_decision_mutation();
drop function if exists public.authenticated_admin_email();

commit;
