-- Dedicated least-privilege role for the content-platform's ONE write path to
-- item_answer_versions (spec §9.3.1; ADR-006 Amendment A).
--
-- WHAT THIS FIXES. src/features/content-platform/operator-service.ts was
-- inserting the raw answer key, grading rules, rubric and private explanation
-- into item_answer_versions directly over its own broad SUPABASE_DB_URL /
-- DATABASE_URL connection — the same connection it uses for every other
-- authoring table. That connection is not scoped to this table at all, so
-- §9.3.1's "referenced by exactly one module" guarantee held for the read
-- side (mindmosaic_scoring, 20260812110000) and not for the write side.
-- src/tests/unit/scoring-module-boundary.test.ts now asserts both directions.
--
-- WHY A SEPARATE ROLE FROM mindmosaic_scoring. That role's grant set is
-- SELECT-only on this table (20260812110000: "Reads. Five tables..."), and it
-- has no INSERT here by design — widening it to also write would mean the one
-- module trusted to read every learner's session could also mint answer
-- rows. A second least-privilege role, held by a second one-file module
-- (src/server/scoring/answer-version-writer.ts), keeps read and write as two
-- independently auditable capabilities rather than one role doing both.
--
-- WHY NOT THE OPERATOR'S EXISTING CREDENTIAL. Same reasoning as
-- 20260812110000's "WHY NOT service_role": SUPABASE_DB_URL / DATABASE_URL is
-- already used for every other authoring table, so scoping *this* table's
-- writes to it would mean the answer table is reachable by whatever holds
-- that broad credential — which is more code than one file, and grows over
-- time rather than being fixed by construction.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mindmosaic_content_answer_writer') then
    create role mindmosaic_content_answer_writer
      with login
           nosuperuser
           nocreatedb
           nocreaterole
           noinherit
           nobypassrls
           noreplication;
  else
    alter role mindmosaic_content_answer_writer
      with login nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication;
  end if;
end;
$$;

comment on role mindmosaic_content_answer_writer is
  'Spec §9.3.1 dedicated content-authoring answer-writer role. Held by src/server/scoring/answer-version-writer.ts and nothing else. Its entire purpose is to insert the answer key, grading rules, rubric and private explanation for a newly published item version; it holds no other privilege on any object, and no SELECT on item_answer_versions itself. NOT service_role, NOT mindmosaic_scoring: no RLS bypass, no read access, no broad authoring access. Credential set out of band, never in a migration.';

-- ---------------------------------------------------------------------------
-- Exactly the privilege it needs: INSERT only, on one table.
-- ---------------------------------------------------------------------------
grant usage on schema public to mindmosaic_content_answer_writer;

-- No SELECT grant: the writer never needs to read back what it wrote, and a
-- role that can both write and read the answer table is one credential leak
-- away from the exact enumeration risk §9.3 exists to prevent. No UPDATE
-- grant either: item_answer_versions_immutable (20260812090000) already
-- rejects every update regardless of role, so an UPDATE grant here would be a
-- privilege the table itself can never honour.
grant insert on public.item_answer_versions to mindmosaic_content_answer_writer;

create policy "item_answer_versions: content answer writer inserts" on public.item_answer_versions
  for insert to mindmosaic_content_answer_writer with check (true);

-- ---------------------------------------------------------------------------
-- Learner posture, re-asserted rather than inherited
-- ---------------------------------------------------------------------------
revoke all on public.item_answer_versions from anon, authenticated;
revoke all (answer_key, grading_rules, rubric, private_explanation)
  on public.item_answer_versions from anon, authenticated;

comment on table public.item_answer_versions is
  'Private answers (spec §9.3). No anon/authenticated privileges and no policy naming them, by design. Exactly one runtime reader: mindmosaic_scoring (spec §9.3.1, ADR-006 Amendment A), held by src/server/scoring/answer-access.ts. Exactly one runtime writer: mindmosaic_content_answer_writer, held by src/server/scoring/answer-version-writer.ts. The raw answer must never leave either module — not to a caller, not into a DTO, not into a log. No general answer-read RPC or view may ever be granted to authenticated.';
