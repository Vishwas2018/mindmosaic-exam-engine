# Ranked audit findings — DRAFT

Scope: `origin/main` at `ff7152f`, combining Stream 1 content, Stream 2
security, and Stream 3 live-flow/accessibility findings from 2026-09-02.
This is a morning-verification draft, not an approval or publication decision.

Source documents:

- Stream 1: `audit/content-2026-09-02` — `docs/audit/2026-09-02/findings-content.md`
- Stream 2: `audit/security-2026-09-02` — `docs/audit/2026-09-02/findings-security.md`
- Stream 3: `audit/flows-2026-09-02` — `docs/audit/2026-09-02/findings-flows.md`

Ranking follows the requested harm anchor: a child receiving wrong or unsafe
content; cross-user/data leakage; billing bypass; broken flows and trust;
accessibility; then polish and test infrastructure. Severity labels remain those
assigned by the source audits. Duplicate observations are consolidated and cite
both source streams.

## Ranked actionable findings

### 1. [CRITICAL] Zero-coverage lesson drill serves unrelated mixed-year content

- dimension: flows
- status: **open**
- evidence: Stream 3 reproduced `VC2M3A01` at all four viewports. Its lesson says
  `0 Practice Questions Available` but still renders `Start Practice Drill`.
  `/practice/session?curriculumCode=VC2M3A01&count=5` falls back from an empty
  mapping to the unfiltered mixed bank and served an unrelated reading question.
  Screenshots:
  `screenshots/student-year-3_1440x900_05-zero-coverage-VC2M3A01.png` and
  `screenshots/student-year-3_1440x900_06-CRITICAL-drill-from-zero-VC2M3A01.png`.
  The same authored check section exists on 14 zero-coverage Grade 3 nodes.
- failure scenario: a Year 3 child selects practice for a named skill and silently
  receives an unrelated subject and potentially Year 5 content, presented as if it
  were intentional same-skill practice.
- confidence: confirmed

### 2. [HIGH] Subscription enforcement is off and direct API calls bypass the layout gate

- dimension: billing/security
- status: **open**
- evidence: Stream 2 found `BILLING_ENFORCEMENT_ENABLED` default-off and
  `requireActiveSubscription()` called only in parent/student layouts. Exam APIs
  and content-table RLS policies do not enforce entitlement. A signed-in student
  can call `POST /api/exam/session` directly and receive real questions without an
  active linked-parent subscription.
- failure scenario: an expired or never-subscribed household bypasses the UI paywall
  and consumes paid practice content through the API.
- confidence: confirmed

### 3. [HIGH] Lesson-list counts overstate the questions the published resolver serves

- dimension: coverage/flows
- status: **fixed-tonight on `fix/coverage-count-honesty`** (`13519e2`), unmerged
- evidence: Streams 1 and 3 independently confirmed the mismatch. Fourteen nodes
  counted raw static IDs that are absent from the published bank. Worst case:
  `VC2E5LY09` displayed 25 but could serve 11. Live flow `VC2E5LY05` displayed 5
  and opened a four-question session. The fix makes pathway `questionCount` use
  `resolveQuestionsForCurriculumNode(...).length` and tests equality across all
  pathway nodes, with an explicit `VC2E5LY09 === 11` regression assertion.
- failure scenario: student and parent surfaces contradict the session, overstating
  coverage and crossing the 5-question readiness threshold for `VC2E5LY05`.
- confidence: confirmed

### 4. [MEDIUM] Cross-year prerequisite links are unlabelled and lesson URLs are not year-scoped

- dimension: flows
- status: **open**
- evidence: Stream 3 found legitimate Level 3 prerequisites in Level 5 lessons, but
  `LessonPathwayList` renders only the curriculum code and the lesson route accepts
  any published code without checking or labelling the student's year level.
- failure scenario: a Year 5 student follows a prerequisite into a full Year 3 lesson
  with no visible indication that they changed year level.
- confidence: confirmed for the route/label behaviour; impact is a product decision

### 5. [MEDIUM] Two coverage systems can still drift

- dimension: coverage
- status: **open** (tonight's count fix closes raw-vs-published overstatement only)
- evidence: Stream 1 found the student catalogue driven by static TypeScript
  alignments while the parent explorer uses Postgres taxonomy alignments plus
  review/publication filtering. No cross-surface regression test asserts the two
  sources agree. The count fix shares the published-bank filter with the lesson
  resolver but does not remove the static-vs-Postgres split.
- failure scenario: a taxonomy or review-state change produces different badges and
  CTAs on parent and student surfaces without a failing test.
- confidence: confirmed architecture; future divergence is plausible

### 6. [MEDIUM] RLS runner can die mid-suite and plain `test:rls` can obscure missing suites

- dimension: security test infrastructure
- status: **open**
- evidence: Stream 2 reproduced a moving `Worker exited unexpectedly` failure in the
  single-process RLS run. Small batches passed all 32 files. `test:rls:ci` correctly
  reports an incomplete run, but the documented plain `test:rls` command is easier
  to misread as a normal set of test failures.
- failure scenario: a policy regression lives in a suite that never ran and a developer
  treats the truncated output as complete.
- confidence: confirmed

### 7. [MEDIUM] Responsive icon-only links lose their accessible names

- dimension: a11y
- status: **open**
- evidence: Stream 3 axe scans reported serious `link-name` violations on the
  student learning header below 640px and practice-session home link below 1024px.
  In both cases the icon is `aria-hidden` and the only text is CSS-hidden.
  Screenshot: `screenshots/_layout-check-375x667-top.png`.
- failure scenario: a screen-reader user tabs to an unnamed link and cannot know that
  it navigates home/dashboard without activating it.
- confidence: confirmed

### 8. [LOW] Parent explorer cannot be cross-checked against real local curriculum data

- dimension: flows/test infrastructure
- status: **open**
- evidence: Stream 3's parent explorer rendered at all four viewports but showed zero
  skills because the local harness does not seed `curriculum_nodes` or
  `curriculum_taxonomy_alignments`. The same household's student static catalogue
  had real lessons, so parent/student badge agreement could not be exercised.
  Screenshot: `screenshots/parent-year-levels_1440x900_explorer.png`.
- failure scenario: badge drift survives because authenticated local e2e has no
  representative parent-explorer rows.
- confidence: confirmed local harness gap; production state unverified

### 9. [LOW] Grade 3 readers contain mojibake punctuation

- dimension: content/polish
- status: **fixed-tonight on `fix/g3-reader-mojibake`** (`211cd6f`), unmerged
- evidence: Stream 1 reported corrupted `â€”` sequences in two served reader files.
  The fix replaces only that exact corruption with an em dash: 30 sequences across
  28 lines in `icas-english.ts`, and 23 sequences across 22 lines in
  `naplan-reading.ts`. Mechanical equivalence checks prove no other content changed.
- failure scenario: a Grade 3 reader encounters garbled punctuation inside a passage,
  prompt, or explanation.
- confidence: confirmed

### 10. [LOW] Unfinished screenshot placeholder copy is visible on the learning page

- dimension: flows/polish
- status: **open**
- evidence: Stream 3 found three cards on `/student/learn` rendering literal
  `Screenshot — ...` placeholder copy at every viewport. Screenshot:
  `screenshots/_layout-check-375x667-top.png`.
- failure scenario: families see internal placeholder text in the shipped surface.
- confidence: confirmed

### 11. [LOW] Content-answer-writer bootstrap is missing from clean-seed instructions

- dimension: security test infrastructure
- status: **open**
- evidence: Stream 2 found a clean `supabase db reset` plus the documented scoring
  bootstrap leaves `content-answer-writer-role.test.ts` failing authentication.
  The existing `content:answer-writer:bootstrap` command fixes it but is absent from
  `db:reset` and `RLS_TEST_PLAN.md`.
- failure scenario: expected setup red erodes trust in the security suite and can be
  mistaken for or used to dismiss a real failure.
- confidence: confirmed

### 12. [LOW] Mild implied parental swearing needs an editorial decision

- dimension: content/safety
- status: **open — editorial judgement required**
- evidence: Stream 1 flagged `icas-y3-read-narrative-007`: “Dad said a word he
  tells us not to say, then laughed.” No swear word appears and the surrounding story
  is otherwise wholesome.
- failure scenario: some parents may object to implied adult swearing in content for
  eight- to nine-year-olds.
- confidence: plausible; not a clear safety violation

## Verified clean / informational results

- No answer-key or rubric leak was found. Candidate-facing routes omit answer fields,
  the scoring tables are separately role-protected, and regression guards passed.
- No cross-student or cross-role authorization hole was found in the audited routes.
- The old `fix/close-exam-write-trust-boundary` work is already fully contained in
  `main`; no promotion is needed.
- All five suspected stale-harness RLS files passed on a clean, fully bootstrapped
  database when run in bounded batches.
- Stream 1 independently re-solved 48 numeracy items with zero answer-key mismatch and
  found no explicit age-inappropriate served passage.
- Stream 3 confirmed year-level separation on the student pathway page, worked-example
  rendering, real-question drill launch, classroom-only badges/no CTA, same-level
  next-lesson termination, keyboard reachability, no horizontal overflow at 375/768,
  zero axe colour-contrast violations in the representative scans, and no console
  errors across 72 logged visits.

## Morning verification notes

- Re-run the zero-coverage drill first; it is the only CRITICAL item and remains open.
- Review both unmerged fix branches and their gate notes before any merge decision.
- Stream 3's log covers all requested viewports, but 30 mid-breakpoint screenshots
  referenced by the log were pruned and axe was representative rather than per-visit.
  Those evidence gaps remain; see `findings-flows.md`.
