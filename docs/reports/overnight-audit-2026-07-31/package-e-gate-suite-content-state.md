# Package E — full gate suite + content state

All commands run against the working tree at `main` (this branch, no
uncommitted app-code changes — only prior sessions' pending
`docs/DEPLOYMENT.md`/`package.json` edits, which do not affect any of these
gates). Full logs kept locally at `C:\tmp\gate-*.log`, not committed
(operator-machine artefacts, not project history).

## Gate results — exact counts

| Gate | Command | Exit | Result |
|---|---|---|---|
| Typecheck | `npm run typecheck` | **0** | clean, no errors |
| Lint | `npm run lint` | **0** | clean, no warnings or errors |
| Unit/component tests | `npm test` | **0** | **219 test files, 3098 tests — all passed.** 0 failed, 0 skipped. Duration 306s |
| Question validation | `npm run validate:questions` | **0** | All production questions and 15 showcase fixtures valid |
| Answer correctness (production bank only) | `npm run check:answers` | **0** | 100 questions: 96 objective / 4 manual-review, 45 fully computable, 0 failures |
| Answer correctness (**including published**) | `npm run check:answers -- --include-published` | **0** | **388 questions** (100 + 288 published), 384 objective / 4 manual-review, 126 fully computable, 258 editorial-review, **0 failures** |
| Bundle budget + server-only bank isolation | `npm run check:bundle` | **0** | 10 sentinels: no bank content in any client chunk, prerendered HTML, or RSC payload. All 4 budgeted routes within budget — `/exam` 1344KB/1350KB, `/results` 1325KB/1350KB, `/showcase` 1324KB/1350KB (all ≥98% of budget; worth watching, not failing) |
| Production build | `npm run build` (clean, `.next` removed first) | **0** | Full route table emitted, no errors |
| E2E (guest-facing suite) | `npm run test:e2e` | **0** | **75 tests, 75 passed**, 0 failed. 3.4 minutes |

**Every gate is green. Zero failures across all eight.** This is the first
time in this audit's history that the fold-margin/screen-validation flake
(fixed earlier this session on `feat/deploy-readiness`, merged to `main`)
has been absent from a from-scratch run — `screen-validation.spec.ts`'s
practice-catalogue test (test #70 in this run) passed cleanly.

Not run: `npm run test:e2e:auth` (the authenticated Playwright suite) and
`npm run test:rls` (the local-Postgres RLS suite) — neither is in the
project's own documented pre-deploy checklist (`docs/DEPLOYMENT.md` §5),
and Package C already covered RLS behavior directly against the live
project, which is a stronger check than the local-fixture suite for this
specific audit's purposes. Flagging the omission rather than silently
narrowing scope.

## Content state — the 288 publication

**Intact, 288/288, confirmed two ways:**

1. `content/question-factory/published-manifests/*.json` — **exactly 288
   files** (plus one `.gitkeep`, 289 total entries in the directory).
2. `check:answers --include-published` structurally checks and finds zero
   failures across all 388 (100 authoring + 288 published) questions.

## The 132 retro-review packs — generated, not yet ingested

This needs the fuller context first, because the brief's framing ("have the
132 retro-review packs been ingested") sits downstream of a real incident
this repo already has a full report on
(`docs/reports/publication-288-posthoc-audit.md`, 2026-07-30):

- 132 of the 288 published questions (every `reading_comprehension` and
  `language_conventions` item) carry a correctness-gate status of
  `review_required`, not `passed` — the independent semantic review their
  own gate demands was never recorded, because two lifecycle guards
  (`orchestrateStaging`, `checkPublicationEligibility`) only ever checked
  the difficulty report, not correctness.
- **Owner verdict, on record in that same report's addendum: "All 288 stand
  by owner decision. Retroactive review ordered."** No unpublish happened
  or was directed to happen.
- Four remediation items were ordered: P0-A (gate-chain fix), P0-B (durable
  review-chain persistence + rescue the 62 surviving reviewer identities),
  P0-C (different-provider independence policy), and **retroactive
  independent review of all 132**.

**P0-A, P0-B and P0-C are done and merged into current `main`** — confirmed
by `git merge-base --is-ancestor` against each of `f53b227` (P0-A),
`6913a8d`/`00c4fbf`/`b1fe8db` (P0-B), and `55c0833` (P0-C): all ancestors of
`HEAD`. The schema now supports a `retroactive_post_publication` review-chain
kind (`src/features/question-factory/publication/manifest-schema.ts`), and
it is exercised by `src/tests/unit/question-factory/manifest-review-evidence.test.ts`.

**The fourth item — actually reviewing the 132 — has not happened.**
Checked directly, not inferred from a commit message:

```
grep -rl 'retroactive_post_publication' content/question-factory/published-manifests/
  -> 0 files
```

Zero of the 288 live manifests carry a `retroactive_post_publication`
review-chain entry. What exists instead is the **operator work order**:
commit `3dda656` ("emit 132 retroactive review packs for operator
round-trip") generated 132 real review prompt packs, bound to the
*published* content hash and revision, at
`content/question-factory/reports/retro-review-packs-2026-07-30/` (its
`INDEX.md`/`INDEX.json` list candidate id, pack path, generator identity,
and the required reviewer constraint — 100 need a different-provider AI
reviewer per P0-C, 32 are human-authored and can go either way). Generating
the packs and ingesting their results are two different steps; only the
first has happened.

**Answer to the brief's question, stated plainly: 0 of 132 packs have been
ingested.** The retroactive review this repo's own audit ordered has not
been performed yet. The 132 questions remain live to learners today with
the same unreviewed status the 2026-07-30 audit found, under the owner's
explicit "all 288 stand" decision — which was a decision to keep them live
*while* the review runs, not a decision that the review is optional.
