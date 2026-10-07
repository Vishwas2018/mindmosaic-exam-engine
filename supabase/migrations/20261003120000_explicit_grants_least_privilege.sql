-- 20261003120000_explicit_grants_least_privilege.sql
--
-- Supabase explicit-grants readiness migration (30 Oct 2026 deadline).
--
-- On 2026-10-30, Supabase disables automatic API exposure of new entities
-- (`auto_expose_new_tables`). Tables and views created without explicit GRANTs
-- will reject Data API callers with SQLSTATE 42501 (permission denied).
--
-- This migration establishes explicit least-privilege GRANTs matching TODAY's
-- live application access and RLS policy boundaries exactly. No privilege is
-- widened; no access is granted to anon.
--
-- Gaps noted (not widened here, matching existing posture):
--   - `profiles`: only SELECT granted here. (UPDATE on display_name, year_level
--     was granted in Phase 0; profile creation/admin updates go through service_role).
--   - `assignment_students`: UPDATE is not granted (no live code advances status).
--   - `essay_marks`: TRUNCATE was deliberately left for Gate B item B3 / Step 9;
--     here authenticated receives only SELECT, INSERT, UPDATE, DELETE.
--   - `resolved_*` views remain ungranted to authenticated/anon (internal only).
--   - `item_answer_versions` remains ungranted to authenticated/anon (scoring & writer roles only).

-- ---------------------------------------------------------------------------
-- 1. Client-used tables: explicit authenticated grants
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on table public.classes to authenticated;
grant select, insert, delete on table public.class_students to authenticated;
grant select, insert, update, delete on table public.assignments to authenticated;
grant select, insert, delete on table public.assignment_students to authenticated;
grant select on table public.parent_children to authenticated;
grant select on table public.profiles to authenticated;
grant select, update on table public.subscriptions to authenticated;
grant select on table public.exam_sessions to authenticated;
grant select on table public.exam_attempts to authenticated;
grant select, insert, update on table public.exam_responses to authenticated;
grant select, insert, update, delete on table public.essay_marks to authenticated;

-- Phase 2 target session tables (idempotent; confirms explicit reads)
grant select on table public.assessment_sessions to authenticated;
grant select on table public.assessment_results to authenticated;
grant select on table public.manual_marks to authenticated;
grant select on table public.erasure_requests to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Client-used views: explicit authenticated SELECT grants
-- ---------------------------------------------------------------------------

grant select on table public.admin_platform_totals to authenticated;
grant select on table public.admin_weekly_activity to authenticated;
grant select on table public.admin_score_distribution to authenticated;
grant select on table public.admin_subject_performance to authenticated;
grant select on table public.admin_skill_performance to authenticated;
grant select on table public.admin_question_stats to authenticated;

grant select on table public.visible_sittings to authenticated;
grant select on table public.visible_sitting_questions to authenticated;
grant select on table public.visible_manual_marks to authenticated;

-- ---------------------------------------------------------------------------
-- 3. service_role grants on all public tables, views, sequences, and routines
-- ---------------------------------------------------------------------------

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;

alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
alter default privileges in schema public grant all privileges on routines to service_role;

-- ---------------------------------------------------------------------------
-- 4. Audit comments on key security boundaries
-- ---------------------------------------------------------------------------

comment on table public.item_answer_versions is
  'Answer keys: ungranted to anon and authenticated. Only mindmosaic_scoring (SELECT) and mindmosaic_content_answer_writer (INSERT) hold explicit access.';

comment on table public.profiles is
  'User profiles: authenticated holds SELECT and column-level UPDATE on display_name and year_level. Profile provisioning is service_role only.';
