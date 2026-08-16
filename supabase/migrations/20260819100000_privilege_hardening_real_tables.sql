-- Gate A item A13 (docs/phase2-cutover-readiness-checklist.md; external review
-- #1, original audit #3; docs/adr/phase0-legacy-session-inventory.md §7):
-- `authenticated` holds TRUNCATE — which RLS cannot cover at all, because
-- there is no per-row filtering to apply to it — on every pre-existing real
-- public table, plus unused DELETE/REFERENCES/TRIGGER on several of them.
-- `20260811093000` closed the three exam tables; this closes the rest of the
-- *non-legacy-marking* tables the same way: nothing revoked here, this
-- migration only removes privileges no live policy or code path uses.
--
-- SCOPE, DELIBERATELY NARROWER THAN "every real table". Two groups are
-- excluded on purpose, not by oversight:
--
--   1. `essay_marks`. The inventory (§7) and this checklist's own Downstream
--      section already assign its TRUNCATE + DELETE closure to Gate B item
--      B3 — "step 9, the point of no easy return" — paired the same way
--      `20260811093000` paired them for `exam_responses`. Touching it here
--      would pre-empt that decision and blur which migration is responsible
--      for the legacy marking table's privilege posture. Left untouched:
--      still `select, insert, update, delete, truncate` for `authenticated`.
--   2. `exam_sessions`, `exam_attempts`, `exam_responses`. These are the
--      legacy write path this pass was explicitly told not to touch. They
--      already hold no TRUNCATE (`20260811093000`); their residual
--      REFERENCES/TRIGGER grants are equally unused, but revoking them is
--      Gate B's job alongside `essay_marks`, not this one's.
--
-- EVERY OTHER GRANT BELOW WAS VERIFIED AGAINST LIVE USAGE, not assumed from
-- the table name. Each table's target privilege set is exactly the privileges
-- an existing RLS policy backs (a policy is the durable record of "this
-- table's rows can be written by a signed-in caller under this predicate";
-- see e.g. `classes: teacher creates own`) or that a repository-wide grep of
-- `src/**` shows the session-scoped Supabase client (not the service-role
-- admin client) actually calling. Where a route uses the admin client instead
-- — `profiles` UPDATE and `parent_children` INSERT/DELETE in
-- `src/features/auth/provision-child.ts` and
-- `src/app/api/parent/children/[childId]/route.ts`, both by explicit design
-- because the caller (a parent) has no RLS policy reaching a child's own row —
-- the matching `authenticated` grant is revoked: the service role bypasses
-- grants entirely, so `authenticated` never needed it.
--
--   classes             select, insert, update, delete   (all four policy-backed)
--   class_students       select, insert, delete            (no update policy exists)
--   assignments          select, insert, update, delete   (all four policy-backed)
--   assignment_students  select, insert, delete            ("...: teacher updates own"
--                                                            is a policy with no matching
--                                                            grant — see the note below)
--   parent_children      select                            (only a read policy exists;
--                                                            the two writes above are
--                                                            service-role only)
--   profiles              select                            ("profiles: update own row"
--                                                            is a pre-existing policy with
--                                                            no matching grant — see the
--                                                            note below — so there is
--                                                            nothing to widen, only INSERT/
--                                                            DELETE to remove)
--   subscriptions         select, update                    (update is `stripe_customer_id`
--                                                            linkage in
--                                                            src/app/api/stripe/checkout/
--                                                            route.ts; creation is via the
--                                                            SECURITY DEFINER
--                                                            create_parent_trial_subscription,
--                                                            which needs no direct grant)
--
-- `profiles` and `assignment_students` are each left with no UPDATE grant
-- either before or after this migration. `"profiles: update own row"` and
-- `"assignment_students: teacher updates own"` are live RLS policies with
-- nothing authorizing them to fire today — profile writes go through the
-- service-role admin client instead (both routes' own comments say so), and
-- nothing in the app yet advances an assignment's status past its initial
-- INSERT (docs/phase2-cutover-readiness-checklist.md's Downstream note on
-- exactly that). Both are pre-existing gaps this migration does not close:
-- A13 is a revoke pass, and granting UPDATE here would be widening a
-- privilege boundary, not hardening one.

revoke truncate, references, trigger on public.classes             from anon, authenticated;
revoke update, truncate, references, trigger on public.class_students        from anon, authenticated;
revoke truncate, references, trigger on public.assignments          from anon, authenticated;
revoke truncate, references, trigger on public.assignment_students  from anon, authenticated;

revoke insert, update, delete, truncate, references, trigger
  on public.parent_children from anon, authenticated;

revoke insert, delete, truncate, references, trigger
  on public.profiles from anon, authenticated;

revoke insert, delete, truncate, references, trigger
  on public.subscriptions from anon, authenticated;

comment on table public.essay_marks is
  'authenticated still holds select, insert, update, delete, truncate here (Gate A item A13 deliberately excludes this table). TRUNCATE and DELETE close at Gate B item B3, ADR-005 §8''s step-9 migration, paired the same way 20260811093000 paired them for exam_responses.';
