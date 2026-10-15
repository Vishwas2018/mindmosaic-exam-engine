-- snapshot.sql: READ-ONLY before/after snapshot. Run before step 2 and after each migration; diff the output.
-- psql "$SUPABASE_DB_URL" -X -At -f docs/plans/checks/snapshot.sql
set default_transaction_read_only = on;
select 'ledger_count|' || count(*) || '|newest ' || max(version) from supabase_migrations.schema_migrations;
select 'auth.users|' || count(*) || '|md5 ' || md5(string_agg(u::text, ',' order by u.id)) from auth.users u;
select 'profiles|' || count(*) || '|md5 ' || md5(string_agg(p::text, ',' order by p.id)) from public.profiles p;
select 'parent_children|' || count(*) from public.parent_children;
select 'exam_sessions|' || count(*) from public.exam_sessions;
select 'exam_attempts|' || count(*) from public.exam_attempts;
select 'assessment_sessions|' || count(*) from public.assessment_sessions;
select 'programme_offerings|' || count(*) || '|active ' || count(*) filter (where active) from public.programme_offerings;
select 'assessment_profile_versions|' || count(*) from public.assessment_profile_versions;
select 'blueprint_versions|' || count(*) from public.blueprint_versions;
select 'publication_gate_settings_exists|' || (to_regclass('public.publication_gate_settings') is not null);
select 'item_publication_approvals_exists|' || (to_regclass('public.item_publication_approvals') is not null);