-- MM-AUD-SEC-001, step 2 of 2: take the direct INSERT away from
-- authenticated, now that 20260811090000 has given both writes a definer
-- path that does not need it.
--
-- Until this migration, "the server decides which questions you sit and
-- what you scored" was a property of the route handlers only. The tables
-- themselves were writable by any authenticated student over PostgREST,
-- and the insert policies could not tell a row the server produced from a
-- row the student typed:
--
--   exam_sessions.selected_question_ids — a student inserting their own
--     session row chooses their own paper, then sits it through the normal
--     resume/submit flow.
--   exam_attempts.result — unconstrained by any policy, and it is the
--     score. A self-authored attempt row with full marks is indistinguishable
--     downstream from one buildExamResult() produced, and every parent,
--     teacher and admin surface reads it as genuine.
--
-- The route handlers were never the boundary they were being treated as;
-- they were one of two doors into the same tables. This closes the other.
--
-- Both DROP POLICY statements below remove policies that are already dead
-- once the grant is gone (with no INSERT privilege the policy is never
-- reached), but they are dropped rather than left in place because a
-- policy that reads as if it authorises student inserts is exactly the
-- thing that would justify re-granting the privilege later. The comments
-- record where the checks went instead.
--
-- Deliberately NOT revoked: SELECT on either table, and INSERT/UPDATE on
-- public.exam_responses. Reads are how the session/resume/review/report
-- surfaces work and are properly constrained by the existing read policies
-- (a student sees their own rows, a parent their linked children's, a
-- teacher their own class's). Autosave genuinely is student-authored data
-- — it holds no question, no answer key and no score — so it stays a
-- direct write, tightened separately by 20260811092000.
--
-- ORDER OF DEPLOYMENT MATTERS. This migration must not reach a database
-- before the application code that calls the two functions from
-- 20260811090000 is serving traffic: between the revoke and that deploy,
-- exam creation and submission both fail with a permission error. Applying
-- 20260811090000 early is harmless (it only adds functions nothing calls
-- yet); applying this one early is an outage.

-- ---------------------------------------------------------------------------
-- exam_sessions
-- ---------------------------------------------------------------------------

-- The role = 'student' condition this policy carried (MM-AUTH-01,
-- 20260724090000) now lives in public.create_exam_session, which raises
-- SQLSTATE MM002 for a non-student caller.
drop policy if exists "exam_sessions: student creates own" on public.exam_sessions;

revoke insert on public.exam_sessions from authenticated;

-- ---------------------------------------------------------------------------
-- exam_attempts
-- ---------------------------------------------------------------------------

-- The "session must be the caller's own" condition this policy carried
-- (tests/rls/exam-attempts.test.ts R4) now lives in
-- public.record_exam_attempt, which raises SQLSTATE MM003 when the session
-- is absent or belongs to someone else.
drop policy if exists "exam_attempts: student submits own" on public.exam_attempts;

revoke insert on public.exam_attempts from authenticated;
