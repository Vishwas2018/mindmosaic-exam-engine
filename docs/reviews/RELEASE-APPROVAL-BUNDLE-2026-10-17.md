# AMC + Year 6 scholarship: release bundle (updated 18 Oct 2026)

Nothing here is approved, merged or deployed. No signature has been made for Vish.

## 0. Decisions Vish must make
1. **AMC y3-005**: approve the final candidate (distractor 8 -> 1, "smallest" stem) in `AMC-FINAL-ITEMS-FOR-APPROVAL.md`.
2. **AMC y3-016**: label **easy** (new approval; recommended) or **medium** (the existing approval becomes valid again, no new signature). Marks stay 4.
3. **Legacy NAPLAN/ICAS items**: no approval record exists anywhere for them (see section 4). The incremental AMC release leaves them exactly as production serves them today. Confirm that is acceptable for now, or start approving them.
4. **Scholarship difficulty policy**: activate the advisory estimator for scholarship NR/maths (proposal branch), or relabel/revise the items. Independent assessment is in section 3.
5. **Scholarship numerical reasoning/maths (45 staged items)**: approve using the review sheets and coverage table in `docs/reviews/scholarship-2026-10-17/`.
6. **Verbal reasoning/reading (80)**: run the different-provider review (`external-review/README.md`), then approve.

## 1. What is ready
Branches (pushed, no PRs opened):
- `release/amc-incremental` (AMC only; deployable candidate; no DB migration).
- `release/incremental` (AMC + scholarship drafts/staging + local review preview; for localhost only).
- `release/integrated` (same plus the 543-manifest quarantine; NOT deployable, 40 failing tests that are the regression evidence).
- `proposal/scholarship-difficulty-advisory` (policy proposal, inactive).

## 2. AMC (55 served, 2 awaiting you)
Served: Year 3 27, Year 5 28, built by strict scoped assembly (`questions:assemble-bank -- --subject amc_mathematics`): every item has exactly one external approval matching its embedded record and exact content hash or the assembly refuses. 543 other-subject manifests are left untouched. `content:verify-publication`: eligible 55, problems 0. Final y3-005 / y3-016 text, options, explanations, marks and all three blind reviews are in `AMC-FINAL-ITEMS-FOR-APPROVAL.md`.

## 3. Scholarship
Staged through the real ingest -> pipeline -> stage chain with stable draft ids: **45** (NR 26, maths 19). Their exact review coverage: `scholarship-2026-10-17/staged-45-review-coverage.md` (25 blind first pass, 12 blind packet, 8 fresh round-2). All reviews are Claude Opus 5.5 (AI, advisory). First-party answer recompute matches the key for all 45.

**Blocked at the difficulty gate: 35 (maths 21, NR 14).** Export: `scholarship-2026-10-17/blocked-35-difficulty-export.csv` (current label, estimator label/deviation/signals, independent assessor label and reason, first-pass blind label). Independent label-blind assessment (fresh Opus 5.5): agrees with the **current label on 22/35** and with the **estimator on 13/35**. Disagreements with the current label: 12 labelled medium that the assessor calls easy, 1 labelled challenging that it calls medium (low-confidence boundary calls: nr-004, nr-012, maths-025, maths-026, maths-039). So the estimator is the less reliable instrument here, and 13 labels are open questions for you. I have not relabelled anything to satisfy the estimator.

**Proposed policy (inactive, `proposal/scholarship-difficulty-advisory`)**: `isDifficultyAdvisory()` returns true for AMC and for `scholarship_style` + `numerical_reasoning`/`numeracy` only. A deviation or low confidence then records a fingerprinted `review_required` warning instead of blocking. Verbal reasoning, reading, NAPLAN and ICAS stay blocking. Structural, correctness (first-party recompute), semantic, originality, provenance and human-approval gates are untouched. Tests cover scope and the unchanged non-AMC blocking behaviour.

**80 verbal reasoning / reading**: not run through the pipeline. They need a different-provider review (policy). Packet: `C:\tmp\handoff\vr-rc-blind-packet.txt` (also `docs/reviews/external-review/`), format in `external-review/README.md`. Existing Claude reviews are kept as evidence and do not satisfy this.

**Not yet built for scholarship**: a scoped strict assembly for scholarship (AMC has one). It is needed before any scholarship item can be served; it is blocked behind approvals anyway.

## 4. Existing programmes: capacity before and after, quarantine impact
Evidence: dev and main hold **zero** approval records for any non-AMC item (main predates the gate entirely; dev has only a README). Every NAPLAN/ICAS item has therefore only ever been served in report mode, unapproved. There is no genuinely approved content from which capacity could be restored.

Per-cell served counts (`capacity-table.md`; "before" = dev today): the incremental AMC release leaves every NAPLAN/ICAS cell unchanged and adds AMC Y3 27 / Y5 28. The quarantine branch cuts, for example, ICAS Y5 reading 51 -> 1, ICAS Y5 language 37 -> 5, ICAS Y5 numeracy 112 -> 48, NAPLAN Y5 numeracy 164 -> 16, NAPLAN Y5 reading 106 -> 11, NAPLAN Y5 language 82 -> 10, NAPLAN Y3 numeracy 128 -> 78.
Lesson impact of quarantine: 439 approved-mapped question ids in the Level 3/5 alignments no longer resolve, Level 5 curriculum coverage falls from 47 covered nodes to 8, and g5-depth node VC2E5LY05 resolves 0 of 8 required items.

**Specific blocker**: a release that quarantines the 543 unapproved items while preserving existing programmes is impossible without approved replacements. The incremental release preserves programmes AND keeps the check strict for every active AMC item by scoping assembly to AMC; the cost is that the legacy items stay served in report mode as they are today. That is a policy position, not a technical fix, so it is decision 3. I did not mark any programme coming-soon.

## 5. Checks (actual results)
`release/amc-incremental` and `release/incremental` (CI placeholder env for Stripe):
- typecheck clean; lint clean.
- Unit suite: `release/incremental` 6348/6348 pass (356 files); `release/amc-incremental` 6005/6005 pass (348 files). The earlier 40 failures: 39 were consequences of the quarantine (not present when legacy is left untouched; `release/integrated` keeps them as evidence) and `stripe-webhook-route` passes with CI's own placeholder env. Other fixes were genuine: AMC items now included in the answer checker, projection, publication-integrity and reachability pools; taxonomy/planner/binding tests updated for AMC entries.
- `release/amc-incremental`: build passes, `content:verify-publication` eligible 55 / problems 0.
- `validate:questions` pass; `check:answers -- --include-published` 1603 checked, 0 failures (now includes the 55 AMC items; before this change AMC was silently not checked); `questions:validate-ledger` pass; `audit:bank` clean.
- `npm run build` passes. Playwright guest e2e (`release/incremental`, own port): 236 passed, 1 failed (`landing.spec.ts` Chapter 2 off-screen tab focus). It passes in isolation on both this branch and origin/dev, so it is load-sensitive, but that is not a proof of unrelated.
- Not run: `test:rls`, `test:e2e:auth` (need a local Supabase; the only running containers belong to another harness and I did not touch them).
- Preview cannot enter production: unit test pins `NODE_ENV=production`/`VERCEL`/`VERCEL_ENV` to off; a real production build started with the flag set showed no banner, 0 scholarship preview items, scholarship "Coming soon", AMC 27.

## 6. Localhost (running now; isolated, dummy Supabase URL, no real keys)
Start: from `C:\tmp\rel-inc`: `MINDMOSAIC_LOCAL_REVIEW_PREVIEW=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:1 NEXT_PUBLIC_SUPABASE_ANON_KEY=x npx next dev -p 3100`
- AMC Y3 (27 of 30): http://localhost:3100/exams/amc-y3-middle-primary-module
- AMC Y5 (28 of 30): http://localhost:3100/exams/amc-y5-upper-primary-module
- Scholarship NR (26 of 40, REVIEW PREVIEW, partial): http://localhost:3100/exams/scholarship-y6-numerical-reasoning-full
- Scholarship maths (19 of 40, REVIEW PREVIEW, partial): http://localhost:3100/exams/scholarship-y6-mathematics-full
A red banner on every page says scholarship papers are partial review previews. All four journeys were driven end to end: start, answer, flag/navigate, submit, score, explanations, retry returns to the same paper. Results: AMC Y3 15/124, AMC Y5 24/124, NR 3/26, maths 3/19 (first-option answers, so low scores are expected).

## 7. Release and rollback plan (existing programmes preserved)
1. After your decisions, I record approvals through `content:record-approvals` (never invented), then ingest, pipeline, stage, publish for y3-005/y3-016 and re-run strict scoped assembly (AMC then serves 57).
2. Open PR `release/amc-incremental` -> `dev`; full CI green; you merge. AMC is additive: separate batch file and loader; legacy bank files unchanged byte-for-byte; no DB migration; scholarship platform not included.
3. `dev` -> `main` PR merged by you; deploy; verify on production: `/exams` shows AMC Y3/Y5 papers at the expected lengths, a full AMC sitting works, and NAPLAN/ICAS programme counts equal the "before" column. Only then update the landing page AMC availability (not done now).
4. Rollback: revert the merge commit (removes only the AMC files and wiring) or promote the previous Vercel deployment. Existing programmes are untouched either way. The 543 legacy manifests are untouched by this release; `release/integrated` holds a ready quarantine for when approvals exist.
5. Scholarship follows separately: needs approvals, the external review for 80 items, a scoped scholarship assembly, and the migration `20261014090000_scholarship_programme_offerings.sql` from PR #51 applied first.
