# Scholarship Year 6: release plan

**Not authorised.** Nothing here deploys, merges, changes production data or records an approval. Production stays as it is until Vish (1) approves the final content and (2) separately authorises the rollout. The owner merges the production `dev` to `main` PR.

## 1. What this release contains

| Area | Content |
|---|---|
| Platform | Scholarship exam-style, Year 6, subjects Verbal Reasoning and Numerical Reasoning, the four whole-paper patterns (Verbal 45 q / 30 min, Numerical 40 / 30, Reading 35 / 30, Mathematics 40 / 30), taxonomy, first-party answer attestation, Confidence Mode scaffolding. This is all of PR #51 plus the remediation round. |
| Governed delivery (this work) | Strict scoped assembly (`questions:assemble-scholarship`); a separate scholarship pool; serve-time approval enforcement for every scholarship programme; no partial papers; signed-in-only delivery; custom and mixed scholarship draws refused; catalogue and landing availability tied to whole-paper readiness. |
| Content | 160 private drafts in `content/scholarship-drafts/` (never importable by runtime code, pinned by a test). **The served scholarship pool is empty. No approval record and no scholarship manifest exists.** |
| Database | `supabase/migrations/20261014090000_scholarship_programme_offerings.sql` (section 4). |
| Not included | Singapore Maths. The AMC release. The written-expression paper (stays deferred; no prompt is approved). Any change to NAPLAN or ICAS selection, scoring or publication behaviour (the existing suites pass unchanged). |

## 2. Source and dependencies

Branch `release/scholarship-prod`, from fresh `origin/dev` at `3b85a102`. Provenance is kept by merging, not cherry-picking:

- `16d23d1c` merges `release/scholarship-complete` (`4fec6c0a`), 13 commits that already sit on current `dev`: the Phase 1b platform (`9ed5f3b4`), NR and mathematics attestation, the remediation round, the Opus review records and the governed ingest path.
- Then the commits listed by `git log origin/dev..release/scholarship-prod` for this work.

**PR #51** (`feat/scholarship-track-core`, draft, mergeable) has head `aa3da4c1`: two commits on current `dev` (the Phase 1b platform, `9ed5f3b4`, and a one-line re-export). Both are ancestors of this branch and the migration file in #51 is identical to this branch's. This branch adds the remediation, attestation and ingest commits and the delivery work on top. #51 stays open until the replacement PR exists and the two have been compared; merging #51 first and this PR second needs no conflict resolution. (An earlier draft of this plan described #51 as 9 commits ahead and 10 behind; that was a stale local branch of the same name, not the PR.)

**Overlap with the AMC release** (`release/amc-incremental`, which this work does not touch): both change the assembly and bank wiring. This work uses separate options (`onlyExamStyle`/`excludeExamStyle`) and a separate pool file, so the logic composes, but whichever merges second will conflict textually in `assemble-published-bank.ts`, `scripts/questions-assemble-bank.mts`, `src/content/questions/practice-bank.ts` and `factory-pools.ts`, `src/server/publication-evidence.ts` and the three bank-reading scripts. Resolution is mechanical (keep both pools in `allFactoryPublishedQuestions`, keep both options). Neither depends on the other.

## 3. What can actually go live, and when

Gate results re-run on the current content (`difficulty/README.md`):

| Section | Approvable by Vish today (all machine gates pass) | Needed for the whole paper | What closes the gap |
|---|---|---|---|
| Numerical Reasoning | 26 | 40 | 14 blocked at the difficulty gate: relabel (3 recommended) or approve the advisory policy |
| Mathematics | 19 | 40 | 21 blocked at the difficulty gate: relabel (1 recommended) or approve the advisory policy |
| Verbal Reasoning | 0 | 45 | Different-provider review of all 45; then 27 more are estimator-blocked on difficulty |
| Reading | 0 | 35 | Different-provider review of all 35; then 16 more are estimator-blocked on difficulty |

**No scholarship paper can be completed today, and none will go live from this release as it stands.** That is the correct behaviour: the delivery code refuses a partial paper rather than offering one. Shorter practice modules are **not** offered; if Vish wants them, that is a separate, explicit decision about accurate wording and time, and would need a new `practiceModule` setting per paper.

Proposed production scope once decisions and approvals are made: Numerical Reasoning and Mathematics first (80 items, all first-party attested), then Verbal Reasoning and Reading (80 items) after the external review. Each section goes live independently, only when its whole paper is approved.

## 4. Database

`20261014090000_scholarship_programme_offerings.sql`:

- seeds the `scholarship_entry` family, the `edutest_scholarship_prep` programme, the `verbal_reasoning` and `numerical_reasoning` subjects and five Year 6 offerings;
- sets seven scholarship `publication_gate_settings` rows to enforced;
- backfills the Phase 2 config rows (blueprint, cell, profile) the live invariants require;
- adds `exam_sessions.mode` (`standard` or `confidence`, default `standard`) and replaces `create_exam_session` with a version that records it (same four-argument signature, `authenticated` only).

Verified on 18 Oct against an **isolated** local database (own project id and ports, none of the other running stacks touched):

- applies cleanly on top of all 49 earlier migrations (fresh start);
- `migrations:record` and `migrations:status`: 50 of 50 applied, verified against live objects, no drift;
- `programmes:check-gates`: the database and the TypeScript gate modes agree for all 7 scholarship programmes;
- `tests/rls/scholarship-sessions.test.ts`: re-running the file changes nothing; the function grants stay `authenticated` only; isolation, role gating, duplicate submission and immutability hold.

**Not verified: production's migration state.** I did not connect to production and cannot say which of `20261005090000`, `20261013090000` and `20261014090000` are applied there. `main` carries migrations only to `20260923100000`. Before any rollout Vish (or whoever holds the credential) should run, read-only: `npm run migrations:status` with `SUPABASE_DB_URL` set to the production connection string, or `supabase migration list --linked`. Do not use `supabase db push --include-all` blind: apply the three in order, and expect `20261005090000` and `20261013090000` to belong to other merged work.

Compatibility: the migration is additive and works with old and new code. New code against an old database: the old `create_exam_session` ignores `config.mode`, so sessions are recorded as before. Old code against a migrated database: the function defaults to `standard`. The legacy session path does not need the offerings or config rows; they matter for the DB-side gate parity check and for the target session model, which is off. So the migration can be applied before or after the code deploy.

## 5. Availability changes

Today every scholarship program is "coming soon" and the landing page lists scholarship as a planned pathway; both are correct because nothing is approved.

Changes are deliberately **not** pre-applied, because they would be false until content exists. They are tied to content so they cannot drift:

- Catalogue: a scholarship section turns "live" only when its whole paper can be drawn from approved content (`coverage.ts`, replacing the 30-item count threshold for scholarship cells). `src/tests/unit/scholarship-availability.test.ts` fails if a program is live while its paper is not startable, or the reverse.
- When the first section goes live, edit by hand in the same PR: the `scholarship-prep` entry in `catalogue.ts` (status) and `programme-catalog.ts`; the "planned" wording in `landing/content.ts` (around lines 583 and 1689), `PLANNED_PATHWAYS` in `landing/programme-status.ts`, the Chapter 2 note in `landing/chapter2-scenes.ts` and `SelectivePreview.tsx`. Claim only the sections that are live, and do not say the papers match any real test (the sets skew easy, and the length and time are ours; both are disclosed on the paper page).
- Consequence to be aware of: once any scholarship section is live, Year 6 becomes selectable wherever the app lists years with gated coverage (the sign-up year grid and the practice configurator). That is expected for a Year 6 launch, but is a product decision.

## 6. Test results

See `TEST-RESULTS.md` (written after the final full run on the final commit).

## 7. Deployment, monitoring and rollback (for the later, separately authorised rollout)

Before: Vish has approved content; approvals are recorded through the governed workflow (`content:record-approvals` or the sheet-driven `questions:publish`); `questions:assemble-scholarship` has run and refused nothing; `content:verify-publication` shows every scholarship item eligible with 0 problems; `migrations:status` against production is clean or the three migrations are applied in order; the owner merges `dev` to `main`.

Publishing sequence for each approved item (after Vish signs the sheet; none of this has been run for real):

1. `npx tsx scripts/ingest-scholarship-drafts.mts` (governed ingest, stable draft ids), then `questions:pipeline` and `questions:stage` for the candidates that pass.
2. For Verbal and Reading: `questions:requeue-for-review`, `questions:review-prompt`, the different-provider review, `questions:review-ingest`, then the pipeline again.
3. `questions:publish --candidate-ids <ids> --sheet <signed sheet> --reviewer "<Vish's full name>"`. The signed row must name the sheet's `contentHash` and revision `0`; the tool refuses anything stale.
4. `npm run questions:assemble-scholarship`; it refuses on any missing, stale, duplicate, mismatched or non-human approval, and on a scholarship manifest with a bad id or a key that fails the independent recompute.
5. Commit the manifests, approval records and `batch-scholarship-published.json`; full CI green; PR to `dev`; owner merges.

Deploy hygiene: a session scores against the bank the server holds at submit time, so avoid deploying a content change while students are mid-paper (the longest open window is the paper time plus a five-minute grace; untimed sittings last up to 24 hours). A revised question keeps its id and gets a new content hash, so a revision is a fresh approval.

Monitor after rollout: `/exams` shows the scholarship papers at 45 / 40 / 35 / 40 questions only for approved sections; the guest bank (`/api/exam/guest-bank`) contains no `scholarship-` id; a signed-in student can start and submit a paper; `POST /api/exam/session` for a scholarship paper never returns `explanation` or `answerKey` before submit; 4xx and 5xx rates on `/api/exam/session` and its `submit` route; `insufficient_questions` 422s on scholarship papers (should be zero once live).

Rollback: (1) promote the previous Vercel deployment, or revert the release merge on `dev`; scholarship routes then return to coming soon and no learner data is touched. (2) Withdrawing one question: remove its manifest and approval and re-run the assembly; the paper becomes unavailable, never shortened. (3) Database: leave the migration in place; it is additive and the old code ignores it. If it ever had to be removed, the rows it seeds can be deleted by id and `exam_sessions.mode` left as is (dropping it loses the Confidence Mode record). Historical attempts and their results are never modified by any of this.
