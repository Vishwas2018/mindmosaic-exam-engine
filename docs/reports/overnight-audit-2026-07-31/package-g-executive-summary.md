# Package G — consolidated executive audit

Ties together Packages A–F (this run) plus the live-deployment state
established earlier in this same engagement (env vars, auth, signup gate,
git-identity/deploy fix) — all directly relevant to "is this ready for the
family to trust," not separable from it.

## Current true state, in one paragraph

The database is clean (Package A: 8/8 migrations, no drift) and its access
boundaries hold under direct behavioral testing (Package C: every RLS
boundary passed, including a fresh, non-inherited re-confirmation of the
one previously-known weakness). Every code gate is green from a from-scratch
run (Package E: typecheck, lint, 3098 unit tests, e2e, bundle budget, build
— zero failures). Billing's core mechanism (webhook idempotency) is
correct and live-proven, though never yet exercised by a real Stripe event,
and is currently switched off entirely (Package D). Two real, if narrow,
data-integrity gaps exist in the exam-attempt lifecycle (Package B): no
optimistic concurrency on autosave, and a client that hits the submission
race gets stuck retrying forever instead of recovering its own result.
Eighteen stale branches clutter the remote, sixteen of which are pure
cleanup (Package F). None of that is the headline. **The headline is that
132 of the 288 published questions — every reading-comprehension and
language-conventions item, across both children's grade levels — have never
received the independent review their own correctness gate demands, and
this repo's own prior audit ordered a retroactive review that has not yet
happened (Package E): zero of 132 packs ingested.** Those questions are
live and being scored against right now.

## Risk register, ranked

| # | Risk | Severity | Likelihood | Evidence |
|---|---|---|---|---|
| 1 | **132/288 published questions (reading + language, both grade levels) have never passed independent semantic review; retroactive review was ordered 2026-07-30 and has not started.** A wrong "correct" answer or flawed distractor could be actively mismarking a real child's work today, with no verification layer between the content and the score it produces. | **High** | **Certain — already live** | `package-e-gate-suite-content-state.md`; 0/288 manifests contain `retroactive_post_publication` |
| 2 | Password reset and email confirmation are non-functional for any real domain: `site_url` is still `http://localhost:3000`, `uri_allow_list` is empty, and there is no SMTP configured (Supabase's built-in sender is org-members-only, 2/hour, unsupported for production). | **High** for anyone but the current owner; **currently Low** because only one parent account exists | If a second parent is ever added, certain | Established earlier this engagement; not re-verified this run but nothing in A–F touched it |
| 3 | An account-scoped Supabase Personal Access Token has sat in `.env.local` for the entire engagement, recommended for revocation repeatedly, never revoked. It administers every project on the account, strictly broader than the service-role key beside it. | **Medium-High** (blast radius), **Low** likelihood of misuse absent a leak | Standing exposure, not decaying on its own | Checked directly this run: `SUPABASE_ACCESS_TOKEN=` line still non-empty |
| 4 | No optimistic concurrency on exam autosave — two open tabs (plausible on a shared family device) can silently overwrite each other's in-progress answers, last-write-wins, undetected. | **Medium** | **Medium** — plausible on shared devices, not yet observed | `package-b-durable-attempts.md` |
| 5 | A client that hits the submit race (double-click under slow network, or a race the unique constraint correctly resolves) gets an error with no path to recover its own already-recorded result and retries forever. | **Medium** | **Medium** — an ordinary double-click under bad network reaches this | `package-b-durable-attempts.md`, `src/tests/unit/exam-submit-route.test.ts:133` |
| 6 | Stripe webhook path is correct by construction and by direct RPC test, but has **zero production mileage** — no real Stripe event has ever reached this project. | **Low today** (billing enforcement is off; nothing depends on it yet) | N/A until billing is turned on | `package-d-billing-entitlement.md` |
| 7 | 18 stale remote branches, including two with real unmerged work (one superseded, one a legitimate stalled feature needing a rebase). | **Low** | N/A — hygiene | `package-f-branch-reconciliation.md` |
| 8 | `admin_platform_totals` reveals its own existence/shape (zeroed aggregates) to a non-admin caller rather than a clean permission denial. | **Very low** | N/A — no real data disclosed | `package-c-rls-empirical.md` |

## Prioritized backlog — what to do next, and why

1. **Resolve the 132-question review gap.** Either complete the retroactive
   independent review the 2026-07-30 audit ordered (the 132 prompt packs
   already exist at `content/question-factory/reports/retro-review-packs-
   2026-07-30/`, ready for the operator round-trip), or make a conscious,
   documented decision about acceptable interim risk given the two real
   children currently being scored against this content. This is the one
   item on this list with a direct line to a real child's actual results.
2. **Configure a production SMTP provider and set `site_url`/
   `uri_allow_list` to the real domain**, before adding any second family
   member or relying on password reset working for anyone. Low effort,
   removes a real single point of failure.
3. **Revoke the standing Supabase Personal Access Token** and confirm
   `SUPABASE_ACCESS_TOKEN` is removed from `.env.local`. Its job (closing
   public sign-up) is done and verified closed; it has had no reason to
   exist since. Costs one dashboard click.
4. Fix the two durable-attempts gaps together, since they share the same
   root cause (no version/sequence discipline on the session/response
   tables): add a version or `updated_at`-compare guard to the autosave
   upsert, and give the submit path a way to return an already-recorded
   result on replay instead of an error the client cannot recover from.
5. Decide whether `BILLING_ENFORCEMENT_ENABLED` should flip now that
   `/billing` exists as a real page, or stay off until a deliberate later
   date — currently unenforced by default, which may well be the right
   choice for a single-family pilot, but should be a decision, not a
   default nobody revisited.
6. Branch cleanup: delete the 16 fully-merged branches (list in Package F),
   keep `backup/pre-audit-main-f65a512` per its own retention note, and
   make an explicit call on `feature/pb2-blueprint-binding` (rebase and
   land, or formally shelve) and `claude/mission3d-third-remediation` (park
   or delete — superseded).

## GO / NO-GO for family go-live

**Conditional GO for continued day-to-day use by the existing household;
NO-GO for expanding trust or adding a second family member until items 1–2
above are addressed.**

The two children already using this app are not at new risk from anything
found tonight — the data-isolation, submission-integrity, and migration
layers all held under direct, adversarial-style testing, and nothing here
changes what's already been scored. But two specific things should stop
anyone from treating the current state as "done":

- **Blocker 1 — content correctness.** 132 questions spanning exactly the
  subjects and grade levels this household's children are being assessed
  in have an open, self-identified correctness question mark, and the
  review ordered to resolve it hasn't started. This is not hypothetical
  risk; it is the actual content currently being served.
- **Blocker 2 — account recovery.** Password reset does not work for
  anyone but the current single parent account, and would silently *look*
  like it worked (the app always reports success) even when it can't
  deliver. This blocks adding a second parent with any confidence.

Everything else on the risk register is real but bounded: narrow edge
cases (dual-tab autosave, a resubmit race), a standing-but-unexploited
credential, and housekeeping. None of them are reasons to stop using the
app for what it's already being used for; all of them are reasons not to
call the project finished.

## Three actions to approve first

1. **Decide the 132-question path**: complete the retroactive review now
   (packs are ready), or make and document an explicit interim-risk call.
2. **Configure real SMTP + the production `site_url`/`uri_allow_list`**,
   closing the account-recovery gap before anyone else is added.
3. **Revoke the standing `SUPABASE_ACCESS_TOKEN`** — the one item on this
   list that costs a single click and has been outstanding the longest.
