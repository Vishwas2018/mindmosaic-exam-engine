# Functional Route and State Audit

## Coverage and method

All build-emitted routes were mapped, entry points/navigation constants traced, and assessment/auth/parent/teacher/admin handlers inspected. Focused unit/component tests exercised session create/active/autosave/submit, deadline handling, scoring, Stripe, child provisioning, teacher assignment/marking and navigation. A fresh interactive browser pass was blocked because the in-app browser reported no available instance; Playwright did not complete within bounded audit windows.

## Route/state matrix

| Area | Routes/states covered | Result |
| --- | --- | --- |
| Public | All marketing, legal, catalogue, programme and exam-pattern routes; invalid dynamic params | Build verified; not-found logic exists; runtime interaction blocked |
| Auth | Parent/student sign-in, sign-up, callback, confirm/reset, role redirect | Static/component coverage; unsafe `next` remains |
| Guest exam | setup, all renderers, navigation/flagging, submit/results/review | Strong component/E2E specifications; live browser rerun blocked |
| Signed-in exam | create, resume, autosave, deadline, submit, duplicate/concurrent submit | Targeted tests pass; four state defects found |
| Student | dashboard, assignments, progress/engagement, learn/exam prep | Route/data traced; assignments are display-only |
| Parent | dashboard, children CRUD, billing | Route/data traced; child provisioning may orphan auth users |
| Teacher | overview, analytics, assignments, roster, marking | Creation/marking APIs tested; lifecycle not closed |
| Admin | hub, analytics, intelligence, operations | Real aggregates except explicitly mock operations |
| Error/degraded | not configured, unauthenticated, forbidden/not-found, malformed config/IDs | Explicit branches broadly present; live browser validation blocked |

## Verified strengths

- Candidate questions exclude answer keys before submission; review questions return only after attempt insert.
- The Zustand/session layer distinguishes answered, unanswered and manual-review responses and implements clear/change/flag/navigation states.
- Submit confirmation uses a native modal with focus entry, Escape/cancel and opener restoration tests.
- Unique `exam_attempts.session_id` blocks two persisted final attempts.
- Guest mode remains usable without an account and signed-in routes have role-aware server gates.
- Dynamic programme/pattern routes fail closed for unknown or unavailable configurations.

## Findings

### P1 High

- `MM-AUD-TIME-001`: session create/resume call `sessionDurationSeconds`, but submit calls `durationSecondsFor` (`src/app/api/exam/session/[id]/submit/route.ts:107`). Full governed papers can therefore be finalised against a different deadline.
- `MM-AUD-FUNC-001`: both the pre-check and uniqueness race return `409 already_submitted` without the committed result (`submit/route.ts:70-75, 139-140`). A response lost after commit cannot be recovered.
- `MM-AUD-FUNC-002`: `AssignmentsView` states there is no Start action (`src/features/student/assignments/components/AssignmentsView.tsx:20-25`), and no production code writes assignment status/attempt linkage.
- `MM-AUD-FUNC-003`: `essay_marks` is read only by teacher marking code. Results and parent summaries continue to derive pending status solely from immutable attempt JSON.

### P2 Medium

- `MM-AUD-FUNC-004`: active-session lookup selects the newest unexpired session and only then checks for an attempt (`active/route.ts:39-61`). A submitted newest session hides an older open session.
- `MM-AUD-NAV-001`: current navigation intentionally differs from the supplied governance map, but the superseding decision is fragmented across code/comments rather than a single approved route contract.
- `MM-AUD-DATA-001`: child provisioning accepts an orphaned auth user when the profile update or parent link fails.
- `MM-AUD-DATA-002`: assignment creation is a two-write operation with only best-effort rollback.
- `MM-AUD-AUTH-001`: repository deployment guidance indicates email delivery is not launch-ready; production behaviour was not accessed and is strongly indicated only.

## Ruled-out/fixed concerns

- Manual-review versus unanswered is distinct in `question-scorers.ts`: blank manual content is unanswered; nonblank content is `manual_review`.
- Shared seed does not imply shared session IDs; database UUIDs are separate from deterministic question selection.
- Interval cleanup and question focus movement have direct component/E2E assertions; no current regression was proven.
- The development route index calls `notFound()` in production.

## Gaps and blocked verification

Back/forward navigation, offline recovery, multi-tab lost-response reproduction, 320/375 px interaction and authenticated seeded journeys were not freshly executed. The available code/tests do not cover retry-after-commit, assignment-to-exam linkage or result recalculation after manual marking.

## Priorities

Unify deadline calculation; make submission response recovery idempotent; design one transactional assignment-to-session state machine; make manual marks a first-class result state; then add multi-tab/network-failure E2E coverage.
