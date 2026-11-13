-- m10.sql: READ-ONLY checks after migration 10. Every row must say PASS. Final line: FAILURES = 0.
-- psql "$SUPABASE_DB_URL" -X -At -f docs/plans/checks/m10.sql
set default_transaction_read_only = on;
with fn(sig) as (values
 ('public.start_writing_attempt(text,text,integer)'),
 ('public.save_writing_draft(uuid,text)'),
 ('public.submit_writing_attempt(uuid,text,text)'),
 ('public.record_paper_writing_attempt(uuid,text,text,integer)'),
 ('public.mark_writing_attempt(uuid,text,integer,jsonb,jsonb,text)'),
 ('public.record_marked_paper_attempt(uuid,text,text,integer,text,integer,jsonb,jsonb,text)')),
c(name, ok) as (
 select 'table ' || t || ' exists with RLS', coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.' || t)), false)
   from unnest(array['writing_rubrics','writing_attempts','writing_marks','writing_mark_criteria']) t
 union all select 'seeded rubric scholarship-written-expression v1', exists (select 1 from public.writing_rubrics where id = 'scholarship-written-expression' and version = 1)
 union all select 'writing_attempts empty', (select count(*) from public.writing_attempts) = 0
 union all select 'authenticated may execute ' || sig, has_function_privilege('authenticated', sig::regprocedure, 'execute') from fn
 union all select 'anon may NOT execute ' || sig, not has_function_privilege('anon', sig::regprocedure, 'execute') from fn
 union all select 'erase_student(uuid,text) still exists and covers writing_attempts', position('writing_attempts' in pg_get_functiondef('public.erase_student(uuid,text)'::regprocedure)) > 0
 union all select 'all writing_* constraints validated', not exists (select 1 from pg_constraint where conrelid::regclass::text like 'public.writing\_%' and not convalidated)
 union all select 'ledger has 20261013090000', exists (select 1 from supabase_migrations.schema_migrations where version = '20261013090000'))
select case when ok then 'PASS' else 'FAIL' end || ' | ' || name from c
union all select 'FAILURES = ' || count(*) filter (where not ok) from c;