# ADR-005: Legacy `exam_*`/`essay_marks` cutover, backfill, rollback and retirement

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §12.7, §21 Phase 2
- **Phase:** 2

## Placeholder

`exam_sessions`, `exam_responses`, `exam_attempts` and `essay_marks` are live,
carry real learner data, and were hardened in August 2026 by migrations
`20260811090000`–`20260811093000` (SECURITY DEFINER write RPCs
`create_exam_session` / `record_exam_attempt`, revoked direct INSERT, autosave
locked after submission, residual TRUNCATE/UPDATE/DELETE revoked). Their full
reader/writer surface is frozen in
[`phase0-legacy-session-inventory.md`](phase0-legacy-session-inventory.md),
which is this ADR's input contract. The decision to record is the cohort-gated
expand–backfill–cutover–contract sequence of spec §12.7: which server-side
feature flag chooses a new session's storage model, why a session never changes
model once created, how terminal data is backfilled idempotently under a unique
legacy-source-ID constraint, which legacy rows are classifiable as version-pinned
versus `legacy_unversioned`, what the shadow-verification report must compare
before cutover is permitted, the order in which dependent workflows (results and
history, assignment linkage, teacher marking, exports, erasure, analytics) move,
and the precise conditions for closing legacy writes and later retiring the
tables. It must also record the rollback contract: rollback before step 9 routes
*new* sessions back to the legacy model, and never copies a live session between
models. Destructive retirement requires this ADR to be accepted and to
explicitly authorize it.
