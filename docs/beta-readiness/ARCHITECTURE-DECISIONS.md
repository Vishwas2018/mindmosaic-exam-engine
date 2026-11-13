# Architecture decisions taken during beta consolidation

Each entry: the decision, why, and what would change it. Branch: `integration/beta-consolidation` (PR #123).

## AD-001: Merge #119 onto `dev`, do not rebase or cherry-pick

`rc/workspace-design-dev-clean` is 3 commits and 368 files; `dev` had moved 3 commits (#120–#122). A merge kept both
histories and produced ten conflicts, each resolved by hand. Cherry-picking 368 files by area would have taken longer
and lost the redesign's own test changes.

Rule applied to every conflict: where #120–#122 made a statement more honest or a check stricter, that side wins;
where #119 added a capability, it is kept and made to obey that rule.

## AD-002: The Content-Security-Policy stays report-only

#119 switched the header to enforcing. The policy is nonce-based with `'strict-dynamic'`. A nonce reaches only pages
rendered per request; `/`, `/exam`, `/practice/*`, `/results` and about 25 other routes are prerendered, so their
scripts carry no nonce and an enforcing browser blocks all of them. The pages render and never hydrate. CI showed it:
the public E2E suite went from about 70 failures to 3 when the header returned to report-only (`d7914c21`).

#119 had also added `localhost` and `127.0.0.1` to `connect-src` so local runs survived enforcement. Removed: the
policy a browser receives should not allow-list loopback.

To enforce later: render those routes dynamically (costs static caching) or move to hash-based `script-src` for
static pages, then prove it with both E2E suites. Pinned by `src/tests/unit/proxy-csp-report-only.test.ts`.

## AD-003: Emailed-link failures are reason codes, not provider text

`confirmEmail`, `verifyEmailToken`, `verifyRecoveryToken` and `adoptSessionTokens` return `message` as one of
`expired`, `invalid`, `other_device`. Screens map the code to their own copy. #119 passed the provider's message
through to the screen; #120 had forbidden that. `other_device` is the PKCE "code verifier not found" case.

## AD-004: The reset form opens only for a recovery session (kept from #119)

A session is not proof of recovery. The form opens when the server accepts the token **and** a recovery link created
the session (authentication method `recovery`, or this tab's recovery marker for `token_hash` links). #120's copy and
its server-confirmed "other devices signed out" claim sit on top of that gate.

## AD-005: One student help path

`/student-sign-in/help` (#120) is the only "I can't sign in" destination. #119's in-panel helper screen and its
`/student-help` route were removed: three copies of the same advice, and a "Can't sign in?" button made
`getByRole("button", { name: "Sign in" })` match two elements.

## AD-006: Screens show plan, seat, device and date figures only when a real value exists

Applied to `/parent/children`, `/parent/account`, `/parent/account/billing`. Prices come from
`src/lib/billing/prices.ts` only. A family with no paid plan is "Free family beta". Components no longer carry
sample-family defaults; a missing value means the row is not rendered.

## AD-007: Design-review aids render only in preview

`?state=loading|error|offline` on `/parent`, the admin "Artboards" strip and the admin state-board gallery are for
reviewing designs against synthetic data. They are honoured only when the preview adapter is the data source.

## AD-008: Server-only exam writes fail closed (kept from #119 / #91)

Session creation and attempt recording go through `mindmosaic_exam_writer` via `EXAM_WRITE_DB_URL`
(`src/server/exam-write/legacy-exam-writes.ts`). With the variable unset the routes return `503 not_configured`.
There is no fallback to the student's own client, because that fallback is the hole being closed. Consequence: after
this merges, hosted DEV cannot start or submit an authenticated exam until phase 4 of MASTER-PLAN.md is done.
