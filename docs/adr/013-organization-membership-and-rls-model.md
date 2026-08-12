# ADR-013: Organization membership and RLS model before institutional launch

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §16, §17.3, §21 Phase 6
- **Phase:** 6

## Placeholder

Authorization today is role-based and relationship-scoped, with no tenancy: a
teacher reaches a student through `classes` / `class_students` and the
`is_teacher_of_student` / `teaches_class` SECURITY DEFINER helpers, a parent
through `parent_children` / `is_parent_of`, and `20260811094000` added the
`caller_is_teacher()` role gate so class and roster creation requires an actual
teacher. Institutional expansion adds organizations above all of that, and this
ADR must decide the membership model before any table carries an
`organization_id`: whether membership is per-user or per-role, how a user
belonging to two organizations is scoped, what happens to a class or a student
profile when a membership ends, and whether existing consumer accounts acquire
an implicit personal organization or stay outside tenancy entirely. It must
decide the RLS construction rule — spec §17.3 — including whether organization
scoping composes with the existing relationship helpers or replaces them, and
how a policy avoids the trap those helpers exist to solve (a subquery evaluated
under the caller's own RLS makes a guard depend on the caller's read policies
rather than on the fact being asked about). Retrofitting tenancy after
institutional data exists is materially harder than deciding it first, which is
why spec §21 places this before Phase 6 rather than inside it.
