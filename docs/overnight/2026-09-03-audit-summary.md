# Overnight audit summary — 2026-09-03

Base verified after `git fetch`: `origin/main` = `ff7152ff6d8b424c9209637b7505a1ebf5a23e55`.
No branch was pushed or merged, and no content was published or approved. The original
dirty checkout on `feat/assessment-capability-complete` was not modified; isolated
worktrees were used for all requested branches.

## Part 1 — Stream 3 live flows and accessibility

- branch: `audit/flows-2026-09-02`
- commit: `74729bd` (fixtures, findings, JSON log, screenshots), followed by the local
  documentation commit containing this summary and consolidation draft
- work completed: added test-only identities for `student-year-3`, `student-year-5`,
  and `parent-year-levels` through the existing `e2e/fixtures` identity/seed harness;
  audited authenticated student/parent flows at 375×667, 768×1024, 1024×768, and
  1440×900; captured console notes; checked keyboard navigation, accessible names,
  axe rules, colour contrast, and responsive overflow
- gate: `npm run typecheck` — PASS on the committed fixtures
- findings: `docs/audit/2026-09-02/findings-flows.md`
- raw evidence: `docs/audit/2026-09-02/flow-audit-log.json` (72 visit entries)
- screenshots: `docs/audit/2026-09-02/screenshots/` (38 retained PNGs)
- critical result: a zero-coverage Grade 3 lesson still exposes a drill CTA and falls
  back to unrelated mixed-subject/mixed-year questions
- evidence limitation: the first audit commit retained 30 of 60 visit screenshots
  plus 8 supplementary captures; 30 logged 768/1024 visit screenshot paths are absent.
  Axe covered 10 representative page/account/viewport combinations rather than every
  logged visit. A later attempt to regenerate missing evidence found no available
  in-app or connected browser session, so no substitute browser was used. Morning
  verification is required for those gaps.

## Part 2 — Coverage-count honesty fix

- branch: `fix/coverage-count-honesty`
- commit: `13519e2`
- change: lesson pathway `questionCount` now comes from
  `resolveQuestionsForCurriculumNode(code).length`, the same published-bank filter
  used for served questions; resolver and bank are unchanged
- regression coverage: every Year 3/5 pathway node's displayed count is asserted equal
  to its resolved count; `VC2E5LY09` is explicitly asserted as 11
- targeted test: 15/15 passed
- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run test:ci`: KNOWN-OK RED only — 5,158/5,158 tests passed; the sole failed
  suite was `stripe-webhook-route.test.ts` because the isolated worktree intentionally
  has no `.env.local`
- `npx next build --webpack`: first attempt blocked on the host's untrusted Google-font
  certificate; retrying the same command with Node's `--use-system-ca` used the Windows
  trust store and PASSed (53/53 static pages)

Previously overstated nodes (old displayed → new displayed / served):

| Node | Before | After |
|---|---:|---:|
| `VC2M5N01` | 24 | 20 |
| `VC2M5N03` | 21 | 20 |
| `VC2M5N06` | 7 | 6 |
| `VC2M5N07` | 10 | 9 |
| `VC2M5N08` | 22 | 20 |
| `VC2M5N10` | 10 | 9 |
| `VC2M5ST01` | 25 | 24 |
| `VC2E5LA05` | 22 | 21 |
| `VC2E5LA06` | 7 | 6 |
| `VC2E5LA08` | 25 | 23 |
| `VC2E5LA09` | 13 | 12 |
| `VC2E5LY04` | 7 | 5 |
| `VC2E5LY05` | 5 | 4 |
| `VC2E5LY09` | 25 | 11 |

## Part 3 — Grade 3 reader mojibake fix

- branch: `fix/g3-reader-mojibake`
- commit: `211cd6f`
- change: replaced only the exact garbled `â€”` sequence with the intended em dash;
  no question wording, answers, metadata, or other punctuation changed
- `icas-english.ts`: 30 sequences fixed across 28 changed lines
- `naplan-reading.ts`: 23 sequences fixed across 22 changed lines
- equivalence check: PASS — replacing the exact bad sequence in the base file produces
  byte-for-byte the committed result, with zero bad sequences remaining
- `npm run validate:questions`: PASS (1,005 production questions, 15 showcase fixtures)
- `npm run check:answers`: PASS (1,005 structurally checked, 91 fully computable,
  910 editorial-review, 977 informational warnings, 0 failures)
- `npm run typecheck`: PASS

The earlier content audit described 28 and 22 “instances”; those were affected-line
counts. The exact sequence counts fixed are 30 and 23 because three lines contained
two corrupt sequences.

## Part 4 — Consolidated draft

- branch: `audit/flows-2026-09-02` (no separate branch was specified; kept with the
  documentation-only audit work)
- output: `docs/audit/2026-09-02/findings-ranked-DRAFT.md`
- inputs: Stream 1 from `audit/content-2026-09-02`, Stream 2 from
  `audit/security-2026-09-02`, and Stream 3 from `audit/flows-2026-09-02`
- ranking: worst-first by child harm/wrong content, data/cross-access, billing bypass,
  broken flows, accessibility, then polish/test infrastructure
- status marking: the count mismatch and mojibake findings are marked fixed tonight on
  their unmerged branches; all other actionable findings remain open

## Local branch tips for morning review

| Branch | Tip |
|---|---|
| `audit/flows-2026-09-02` | see current local tip (includes `74729bd`) |
| `fix/coverage-count-honesty` | `13519e2` |
| `fix/g3-reader-mojibake` | `211cd6f` |

STOP condition reached: all reversible in-scope work is committed locally; nothing was
pushed, merged, force-updated, published, or approved.
