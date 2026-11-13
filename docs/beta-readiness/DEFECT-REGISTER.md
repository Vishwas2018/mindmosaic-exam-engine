# Defect register

Found during consolidation of #119 onto `dev`. Severity: P0 blocks everyone, P1 blocks the beta journey or misleads a
family, P2 should be fixed before a wider beta, P3 cosmetic.

| ID | Sev | Defect | State | Fix commit / next step |
|----|-----|--------|-------|------------------------|
| D-001 | P0 | Enforced nonce CSP stopped every prerendered page hydrating (landing, `/exam`, `/practice/*`, `/results`) | FIXED, CI-confirmed | `d7914c21`. Public E2E: ~70 failures → 3 |
| D-002 | P1 | `/parent/children` showed "2 of 3 used on your Family plan" from hard-coded defaults and `Math.max(3, …)` seats | FIXED, unit-tested | `11bb13e4` |
| D-003 | P1 | Printable sign-in card fell back to a `CODE-SET` / `—` placeholder login code | FIXED | `11bb13e4` |
| D-004 | P1 | `/parent/account` and `/billing` showed A$19.90 / A$199 (price list: A$14.99 / A$149), a fixed "3 December 2026" next payment, "1 device", "2 of 3 used", and `updated_at` as "password last changed" | FIXED, unit-tested | `d4b63623` |
| D-005 | P1 | Parent overview replaced the "login is archived, restore here" message with a bare "Paused" badge | FIXED | `488998ad`; CI pending |
| D-006 | P2 | Learning Hub controls 32–38px tall (139 targets under 44px) | FIXED | `488998ad`; CI pending |
| D-007 | P2 | `/auth/confirm` with no credential no longer served the resend form without JavaScript | FIXED | `488998ad`; CI pending |
| D-008 | P2 | Three duplicate student "can't sign in" helpers; "Sign in" matched two buttons | FIXED | `488998ad` |
| D-009 | P1? | **NO LONGER REPRODUCES** (passed on `30de4328` after D-008 removed the duplicate helper; cause never isolated). In CI only, `/student-sign-in` holds two inputs labelled "Your PIN, number 1 of 6" with the same id, so `student-exam-session.spec.ts:40` fails on every retry. Not reproduced in 6 local runs against a production build. Same shape as the older "two `start-exam` buttons" report on `/practice/[program]` | UNEXPLAINED | Both E2E jobs now upload `test-results/` on failure. Read `error-context.md` from the next red run before changing code |
| D-010 | P3 | Results review filter tabs measured 3.9:1 mid colour-transition (flaky axe failure) | FIXED | `488998ad` |
| D-011 | P2 | Real admin workspace showed the "Artboards" strip and state-board gallery | FIXED | `4491b920` |
| D-012 | P2 | `/parent?state=error` forced a fake error screen on a real family's page | FIXED | `488998ad` |
| D-013 | P2 | `src/server/admin-workspace-data.ts` fills approval rows with assumed values (`yearLevel: 6`, `subject: "Reasoning"`, `pedagogicalCheck: true`, `standingRuleCompliance: true`) | OPEN | Read these from the approval row and the question, or drop the columns |
| D-014 | P2 | `/parent/account` "Download my data" produces a file with name and email only | OPEN (copy corrected, capability unchanged) | Either build the real export or relabel the button |
| D-015 | P2 | `/parent/account` copy mentions failed-payment emails and card management to families with no paid plan | OPEN | Hide billing-only copy when there is no paid plan |
| D-016 | P1 | All 78 pinned family-beta items are `published` with no `approvedBy` (carried from the WP1 audit, not re-verified this session) | BLOCKED on a human | Owner review; no agent may sign |
| D-017 | P1 | Hosted DEV has neither the exam-writer migrations nor `EXAM_WRITE_DB_URL` (carried from WP1 audit; `SUPABASE_ACCESS_TOKEN` returned 401 then, not re-tested) | BLOCKED on owner | DATABASE-READINESS.md |

## D-018 (P1, OPEN): two `start-exam` buttons on `/practice/[program]` for a signed-in student

Seen on `cdfede1c` in `e2e-auth`: `getByTestId('start-exam')` resolved to two buttons, one enabled and one disabled
(the pre-hydration state). The test passed on retry, so the job was green with 1 flaky. This is the defect first
reported on PR #95 and it predates this branch. It is not masked. `ExamConfigurator` declares the test id once, so
two copies of the component are live at that moment. Artifacts upload only when the job fails; to capture this one,
run the spec with retries off (`--retries=0`) so the first occurrence fails the job and uploads `error-context.md`.
A child tapping the disabled copy would see a button that does nothing, which is why it stays P1.

## Notes on D-009

What is known: the element appears twice with identical attributes; "Login code" on the same page resolved to one
element a moment earlier; the test passes on `dev` at `84981ea0`; it fails on all three attempts in CI.
What was ruled out locally: the merged `SignInPanel` renders `PinInput` once; a production build with a dummy
Supabase URL never produced two.
What was not tried: a run against the real local Supabase stack (not available on the Windows host).
Do not mask it with `.first()`.
