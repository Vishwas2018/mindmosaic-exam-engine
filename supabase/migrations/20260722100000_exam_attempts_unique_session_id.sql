-- Fixes MM-SEC-02 (duplicate exam submission): the submit route
-- (src/app/api/exam/session/[id]/submit/route.ts) previously relied on a
-- maybeSingle() existence check before inserting exam_attempts, which is a
-- TOCTOU race — two concurrent submits for the same session can both pass
-- the pre-check and both insert, producing two stored attempts for one
-- session. This migration makes "at most one attempt per session"
-- impossible to violate at the database level, independent of any
-- application-level race: the unique constraint below is the real
-- guarantee, and the route's pre-check becomes only a fast path.
--
-- The route was updated in the same change to catch the resulting Postgres
-- unique-violation (error code 23505) on insert and return the same
-- already-submitted response the pre-check returns, rather than a generic
-- 500 — so the loser of a race gets an idempotent 409, never an error.
--
-- IMPORTANT — this migration is not applied to the real Supabase database
-- as part of this change. Before running this project's guarded migration-
-- apply process against that database, first check
-- public.exam_attempts for any pre-existing rows sharing a session_id
-- (e.g. `select session_id, count(*) from public.exam_attempts group by
-- session_id having count(*) > 1;`) — if any exist, they must be resolved
-- (the extra row(s) reconciled or removed) before this constraint can be
-- added, or the ALTER TABLE below will fail.
--
-- No RLS changes: exam_attempts' existing policies (see the Phase 0
-- migration) already fully govern who may select/insert rows; a uniqueness
-- constraint on a column changes nothing about which rows a policy allows,
-- so none of them need to change.

-- The plain (non-unique) index created in the Phase 0 migration
-- (`exam_attempts_session_id_idx`) becomes redundant once the unique
-- constraint below exists — a unique constraint is backed by its own
-- unique btree index, which serves every lookup the old index did. Dropped
-- here rather than left in place, to avoid two indexes on the same column.
drop index if exists public.exam_attempts_session_id_idx;

alter table public.exam_attempts
  add constraint exam_attempts_session_id_key unique (session_id);
