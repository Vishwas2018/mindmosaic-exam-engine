-- m9.sql: READ-ONLY checks after migration 9. Every row must say PASS. Final line: FAILURES = 0.
-- psql "$SUPABASE_DB_URL" -X -At -f docs/plans/checks/m9.sql
set default_transaction_read_only = on;
with c(name, ok) as (values
 ('table item_publication_approvals exists', to_regclass('public.item_publication_approvals') is not null),
 ('table publication_gate_settings exists', to_regclass('public.publication_gate_settings') is not null),
 ('RLS on item_publication_approvals', coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.item_publication_approvals')), false)),
 ('RLS on publication_gate_settings', coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.publication_gate_settings')), false)),
 ('anon cannot select approvals', not has_table_privilege('anon', 'public.item_publication_approvals', 'select')),
 ('authenticated cannot select approvals', not has_table_privilege('authenticated', 'public.item_publication_approvals', 'select')),
 ('anon cannot select gate settings', not has_table_privilege('anon', 'public.publication_gate_settings', 'select')),
 ('authenticated cannot select gate settings', not has_table_privilege('authenticated', 'public.publication_gate_settings', 'select')),
 ('trigger approved_session_item present', exists (select 1 from pg_trigger where tgname = 'approved_session_item' and not tgisinternal)),
 ('trigger immutable_publication_approval present', exists (select 1 from pg_trigger where tgname = 'immutable_publication_approval' and not tgisinternal)),
 ('create_assessment_session carries the gate logic', position('publication_gate_settings' in pg_get_functiondef('public.create_assessment_session(jsonb,text)'::regprocedure)) > 0),
 ('NOTHING ENFORCED: publication_gate_settings empty', (select count(*) from public.publication_gate_settings) = 0),
 ('NOTHING APPROVED: item_publication_approvals empty', (select count(*) from public.item_publication_approvals) = 0),
 ('ledger has 20261005090000', exists (select 1 from supabase_migrations.schema_migrations where version = '20261005090000'))
) select case when ok then 'PASS' else 'FAIL' end || ' | ' || name from c
union all select 'FAILURES = ' || count(*) filter (where not ok) from c;