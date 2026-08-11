# Database, Supabase and Persistence Audit

## Coverage and method

All nine Supabase files were read in chronological order to reconstruct the effective schema: profile/role/session/attempt/assignment baseline, response autosave, essay marking, unique-attempt constraint, subscriptions, aggregate views and the later student-role gate. Application queries and generated/domain parsers were cross-checked against tables and policies. No production database was accessed; the local Docker/Supabase RLS suite was not run in this pass.

## Effective entity/integrity model

- Primary ownership: profiles/auth user, session/student, attempt/session+student, class/teacher, assignment/class, subscription/parent.
- Unique protections: profile ID, parent-child/class-student pairs, one response and one final attempt per session, one essay mark per attempt/question, one subscription per parent/customer references.
- RLS is enabled on exposed tables and anon access is revoked. Aggregate views use bounded pre-aggregation.
- Important missing relational facts are represented only in JSON or application logic: session-selected IDs/config validity, attempt.student matching session.student, assignment attempt matching assigned student/config and manual mark matching the immutable question rubric.

## Verified strengths

- The unique session-attempt constraint is the correct concurrency backstop for duplicate final rows.
- Mutable autosave and immutable final attempt are separated.
- Parent and teacher read helpers centralise relationship logic.
- Foreign keys and cascades cover most direct ownership edges; deletion of an attempt sets assignment linkage null and cascades essay marks.
- Security-definer helpers set a safe search path.

## Findings

### P1 High

- `MM-AUD-SEC-001`: RLS authorises rows, not trusted columns. Authenticated clients can directly write session authority, final result JSON, manual-mark maxima and assignment attempt linkage.
- `MM-AUD-SEC-002`: class authority is circular: a row with `teacher_id=auth.uid()` makes the user a teacher for policy purposes without checking `profiles.role` or controlled enrolment.
- `MM-AUD-FUNC-001`: final insert is concurrency-safe but not idempotent at the API contract; the database row is not returned on retry.

### P2 Medium

- `MM-AUD-DATA-001`: `provisionChild` creates the auth identity before profile/year/link steps and deliberately leaves an orphan on later failure (`provision-child.ts:304-310`).
- `MM-AUD-DATA-002`: teacher assignment creation inserts the parent row and recipients separately; rollback is best effort (`api/teacher/assignments/route.ts:79-101`).
- `MM-AUD-DATA-003`: cross-entity constraints are incomplete. Nothing enforces `exam_attempts.student_id = exam_sessions.student_id`, that `assignment_students.attempt_id` belongs to its student, or that an essay mark's `max_marks` equals the authored question. Service-role mistakes or direct authorised writes can create internally valid but semantically impossible rows.
- `MM-AUD-FUNC-004`: the active-session query cannot express “newest unexpired session without an attempt” atomically and implements it in the wrong order.

### P3 Low / future constraint

- `MM-AUD-ARCH-001`: TypeScript/taxonomy supports Years 1–12 while `profiles_year_level_check` and provisioning allow only 3/5. This is correctly user-gated today but requires an owner migration before roadmap expansion.

## Atomicity, retention and time

Timer finalisation and attempt insert occur in one request but not in a database transaction with autosave cleanup or assignment-state transition. Timestamps are ISO/UTC-backed and mostly consistent; exact deadline comparison varies (`>` versus pure helpers' `>=`) and pattern duration is duplicated. No automated account/data deletion or retention job exists. Backup/restore and production migration drift were not externally verified.

## Gaps and blocked verification

The local RLS suite, migration round-trip, query plans, backup/restore and deployed-schema drift were not executed against a running Supabase stack. Static policy proof is sufficient for `SEC-001/002`, but row-count/index performance and live grant drift remain unverified.

## Priorities

Make trusted mutations database functions/transactions with explicit column ownership; role-bind classes and enrolment; add composite/cross-table invariants where feasible; make child/assignment provisioning transactional/compensating; add the adversarial RLS cases listed in report 08.
