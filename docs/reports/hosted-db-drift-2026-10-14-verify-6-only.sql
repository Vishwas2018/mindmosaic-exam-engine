select check_name, ok from (values
 ('profiles has the 4 onboarding columns',
   (select count(*) = 4 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name in ('onboarding_completed_at', 'diagnostic_completed_at', 'interests', 'weekly_goal_minutes'))),
 ('authenticated can UPDATE exactly the 6 intended profile columns',
   (select count(*) = 6 and bool_and(column_name in ('display_name', 'year_level', 'onboarding_completed_at', 'diagnostic_completed_at', 'interests', 'weekly_goal_minutes')) from information_schema.column_privileges where grantee = 'authenticated' and privilege_type = 'UPDATE' and table_schema = 'public' and table_name = 'profiles')),
 ('ledger holds 40 rows (39 + migration 6)',
   (select count(*) = 40 from supabase_migrations.schema_migrations)),
 ('migration 6 is the newest ledger row',
   (select max(version) = '20260922100000' from supabase_migrations.schema_migrations)),
 ('profiles unchanged: 6 rows, 4 students, 2 in Year 3, 2 in Year 5',
   (select count(*) = 6 and count(*) filter (where role = 'student') = 4 and count(*) filter (where role = 'student' and year_level = 3) = 2 and count(*) filter (where role = 'student' and year_level = 5) = 2 from public.profiles)),
 ('no student marked onboarded by the migration',
   (select count(*) = 0 from public.profiles p where to_jsonb(p)->>'onboarding_completed_at' is not null or to_jsonb(p)->>'diagnostic_completed_at' is not null))
) as t(check_name, ok);

