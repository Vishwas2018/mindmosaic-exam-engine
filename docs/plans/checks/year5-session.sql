-- year5-session.sql: the live-path check. Creates a session through the SAME function the API route calls
-- (create_exam_session) as a Year 5 student, then ROLLS BACK. Zero residue; it proves "nothing regressed", not the new gate.
-- Pass the Year 5 test child's profile id and five real Year 5 ids (defaults are real ids from the bank):
--   psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -v child_id=<uuid> -f docs/plans/checks/year5-session.sql
-- Expected: one uuid, then "before = after" with t.
begin;
select count(*) as sessions_before from public.exam_sessions \gset
select set_config('request.jwt.claims', json_build_object('sub', :'child_id', 'role', 'authenticated')::text, true);
set local role authenticated;
select public.create_exam_session(
  '{"bankId":"curated","timing":"timed","subject":"reading","examStyle":"naplan_style","yearLevel":5,"questionCount":10}'::jsonb,
  'release-check-seed',
  array['g5-nap-read-literal-001','g5-nap-read-vocab-002','g5-nap-read-table-001','g5-nap-read-fact-002','g5-nap-read-literal-003'],
  now() + interval '1 hour') as created_session_id;
reset role;
select 'created inside txn: ' || (count(*) - :sessions_before) as inside from public.exam_sessions;
rollback;
select 'after rollback: ' || (count(*) = :sessions_before) as zero_residue from public.exam_sessions;