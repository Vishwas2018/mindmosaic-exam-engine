select 'ledger_count', count(*)::text from supabase_migrations.schema_migrations
union all select 'ledger_md5', md5(string_agg(version||name, ',' order by version)) from supabase_migrations.schema_migrations
union all select 'tables', count(*)::text from pg_tables where schemaname='public'
union all select 'policies', count(*)::text from pg_policies where schemaname='public'
union all select 'columns_md5', md5(string_agg(c.table_name||'.'||c.column_name||':'||c.data_type||':'||coalesce(c.column_default,'')||c.is_nullable, ',' order by c.table_name,c.column_name)) from information_schema.columns c where c.table_schema='public'
union all select 'functions', count(*)::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
union all select 'functions_md5', md5(string_agg(p.oid::regprocedure::text||md5(pg_get_functiondef(p.oid)), ',' order by p.oid::regprocedure::text)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'
union all select 'triggers', count(*)::text from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal
union all select 'offerings', count(*)::text from public.programme_offerings
union all select 'users', count(*)::text from auth.users
union all select 'profiles_md5', md5(string_agg(p::text, ',' order by p.id)) from public.profiles p
order by 1;
