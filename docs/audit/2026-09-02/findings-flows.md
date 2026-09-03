# Live-Flow Audit — origin/main @ ff7152f (2026-09-02)

Walked as authenticated sessions (`student-year-3`, `student-year-5`, `parent-year-levels`
— new test-only e2e fixtures, see "Fixtures added" below) against a `next build && next start`
of this exact commit, pointed at a local Supabase instance seeded via this repo's own
`e2e/fixtures/` harness. Viewports: 375×667, 768×1024, 1024×768, 1440×900. `npm ci` was
run first. Raw machine-readable log: `docs/audit/2026-09-02/flow-audit-log.json` (72
page-visit entries: page/account/viewport, console messages, and pass/fail notes).
Screenshots: `docs/audit/2026-09-02/screenshots/` (pruned to the 375px and 1440px
extremes plus the two flagship 768/1024 counterexamples already reflected in notes —
every screenshot referenced below exists at that path).

> **Morning evidence note (2026-09-03):** the JSON log covers all 72 requested
> page/account/viewport visits, but the branch retains 30 of the 60 visit screenshots
> (the 375px and 1440px extremes) plus 8 supplementary keyboard/layout captures.
> Thirty 768px/1024px visit screenshots named in the raw log were pruned before the
> first commit and are not present. Axe was run on 10 representative
> page/account/viewport combinations, not on all 72 visits. A later attempt to fill
> these evidence gaps could not connect to an available browser session. Product
> findings below have retained screenshots, but the missing mid-breakpoint captures
> and per-visit axe runs remain for morning verification.

No CRITICAL finding involves the specific scenario named in the brief ("a Year-5 student
seeing Grade-3 content") — that exact check passed. One different CRITICAL was found:
a core flow silently substitutes unrelated content from the full mixed pool (any subject,
any year level) when a lesson's real question count is zero.

---

### [CRITICAL] "Start Practice Drill" on a zero-coverage lesson silently serves random, unrelated content from the entire mixed pool — including any year level
- dimension: flows
- evidence: Live-reproduced as `student-year-3`, all 4 viewports. Lesson `VC2M3A01`
  ("Inverse Operations: Connecting Addition and Subtraction", Year 3 Algebra) shows a
  "Start Practice Drill" button (screenshot:
  `screenshots/student-year-3_1440x900_05-zero-coverage-VC2M3A01.png`) despite its own
  "0 Practice Questions Available" badge. Clicking it lands on
  `/practice/session?curriculumCode=VC2M3A01&count=5`, which renders a *Reading
  Comprehension* question about bees pollinating flowers — labelled "Mixed subjects" —
  with the sidebar claiming "Practice mixes types so a student meets the same skill in
  more than one format" (screenshot:
  `screenshots/student-year-3_1440x900_06-CRITICAL-drill-from-zero-VC2M3A01.png`, full
  text sample captured in `flow-audit-log.json`).
  Root cause, traced in source: `src/features/curriculum/lessons/components/LessonCheckSection.tsx`
  renders its "Start Practice Drill" link unconditionally (no check against
  `availableQuestionsCount`), using a per-lesson hardcoded `practiceCount` (here `5`,
  from `level-3-algebra.ts`) for the URL's `count=` param — not the live mapped count.
  `src/app/practice/session/page.tsx:346-354` then calls
  `getMappedQuestionIdsForNode("VC2M3A01")`, which returns `[]`; because that array is
  empty, the code takes the `else` branch and instead calls `filterEligibleQuestions`
  with whatever `subject`/`year`/`style` the URL supplies — all three default to
  `"mixed"` (`practice-params.schema.ts:12-34`) when omitted, and the drill link never
  supplies them. `filterEligibleQuestions` treats `"mixed"` as "no filter"
  (`select-questions.ts:44-49`), so the resulting pool is the *entire* published bank
  across every subject and both Year 3 and Year 5.
  Confirmed this is not a one-off: all 14 of Grade 3's zero-coverage, non-classroom-only
  nodes (`VC2M3A01`, `VC2M3A02`, `VC2M3M02`, `VC2M3ST03`, `VC2M3P01`, `VC2M3P02`,
  `VC2E3LA02`, `VC2E3LA04`, `VC2E3LA09`, `VC2E3LA10`, `VC2E3LE01`, `VC2E3LY03`,
  `VC2E3LY07`, `VC2E3LY08`) have `hasCheckSection=true, practiceCount=5` in their
  authored content, so every one of them exposes this same live button.
- failure scenario: A Year 3 child studies "Inverse Operations", clicks the prominent
  purple "Start Practice Drill" button their lesson explicitly offers them, and — with
  no error, warning, or "coming soon" message anywhere — is served content from a
  random unrelated subject, with nothing preventing that random draw from including
  Year 5-level material (the year filter is `"mixed"`, i.e. off). The UI actively
  tells them this is intentional ("meets the same skill in more than one format"),
  which is false.
- confidence: confirmed

### [HIGH] Practice drills silently under-deliver against their own advertised count (live confirmation of the content-audit's coverage-honesty finding)
- dimension: flows
- evidence: `student-year-5`, lesson `VC2E5LY05` ("Morphological Shifts: Suffixation and
  Irregular Plurals") shows "5 Practice Questions Available"
  (`screenshots/student-year-5_1440x900_05-partial-VC2E5LY05.png`). Clicking "Start
  Practice Drill" lands on a session titled "Question 1 of **4**" — one fewer than
  promised (`screenshots/student-year-5_1440x900_06-drill-from-partial-VC2E5LY05.png`).
  Confirmed at both 375 and 1440. This corroborates, with a live screenshot, finding
  #1 ("Student-facing lesson list overstates practice-question counts") from
  `docs/audit/2026-09-02/findings-content.md` — the same root cause
  (`content/index.ts:116` counting unpublished `gen-` seed IDs) reaches this specific
  lesson's live drill, not just its badge text.
- failure scenario: A parent or student notices the session runs one question short of
  what the lesson promised — a minor but repeatable trust-eroding inconsistency, most
  visible on `VC2E5LY09` from the content audit (25 promised, only 11 real) which was
  not separately re-walked live here but shares the identical code path.
- confidence: confirmed

### [MEDIUM] Icon-only header nav links lose their entire accessible name below their Tailwind breakpoint
- dimension: a11y
- evidence: axe-core (`@axe-core/playwright`, WCAG 2.0/2.1 A+AA rules) flagged
  `link-name` ("Links must have discernible text", impact **serious**) at the 375×667
  viewport on `/student/learn` for **both** `student-year-3` and `student-year-5`, and
  on the practice-session page for `student-year-5`. Two distinct source locations,
  same pattern:
  - `src/app/student/learn/page.tsx:169-175` — the "Dashboard" link wraps an
    `aria-hidden` Home icon plus `<span className="hidden sm:inline">Dashboard</span>`,
    so below Tailwind's `sm` breakpoint (640px) the link has icon-only content and zero
    accessible text. Axe's failure summary: "Element is in tab order and does not have
    accessible text."
  - `src/features/exam-engine/practice-mode/PracticeSession.tsx:429-435` — the same
    pattern, `<span className="hidden lg:inline">Home</span>`, so the gap extends up to
    the `lg` breakpoint (1024px), covering both the 375 and 768 viewports tested.
  Visual confirmation: `screenshots/_layout-check-375x667-top.png` shows the bare,
  unlabelled square icon button in the `/student/learn` header at 375px.
- failure scenario: A screen-reader user on a phone (or a tablet in portrait, for the
  practice-session instance) tabs to this control and hears only "link" or "button"
  with no name — they cannot tell it goes to the dashboard/home without activating it
  blind.
- confidence: confirmed

### [MEDIUM] Cross-year "Prerequisites" links have no visual year indicator and the lesson route has no year-level access control
- dimension: flows
- evidence: every Level 5 lesson's authored `prerequisites` list legitimately includes
  Level 3 codes (e.g. `VC2M5N03`'s prerequisite is `VC2M3N05`) — this is correct
  curriculum sequencing, not a data bug, and confirmed the `/student/learn` pathway-
  grouping view itself never mixes levels (see "Confirmed clean" below). However:
  `src/features/curriculum/lessons/components/LessonPathwayList.tsx:139-146` renders
  each prerequisite as a plain link to `/student/learn/lessons/${prereq}` with no
  "Year 3" / "Level 3" badge distinguishing it from same-level lessons, and
  `src/app/student/learn/lessons/[code]/page.tsx` (`getLessonByCode(code, {
  publishedOnly: true })`) applies no check against the signed-in student's own
  `yearLevel` — any authenticated student can open any published lesson of either level
  by URL or via these prerequisite links.
- failure scenario: A Year 5 student clicks a "Prerequisites: VC2M3N05" link expecting
  a quick refresher and lands on a full Year 3 lesson page with no indication it's a
  different year level than the one their account is enrolled in — not dangerous, but
  inconsistent with the product's stated per-year framing, and worth an explicit design
  decision (label it, or gate it) rather than silence.
- confidence: confirmed (the missing badge and missing route guard); the practical
  impact is a judgement call, not a clear defect

### [LOW] Placeholder "Screenshot — ..." text ships as visible page content
- dimension: flows
- evidence: `/student/learn` renders three cards whose body is the literal string
  `slot: "Screenshot — Learning Hub article"` / `"Screenshot — practice set summary"` /
  `"Screenshot — exam simulation start screen"` (`src/app/student/learn/page.tsx:128,
  139, 146`) inside a plain lavender box, visible to every visitor at every viewport
  (visible in `screenshots/_layout-check-375x667-top.png`, bottom of frame).
- failure scenario: A parent or student sees literal unfinished placeholder text
  instead of an illustration, reading as broken/unshipped work.
- confidence: confirmed

### [LOW] Local e2e harness cannot exercise the Parent Curriculum Explorer end-to-end (test-infrastructure gap, not a demonstrated production bug)
- dimension: flows
- evidence: `/parent/curriculum-explorer` rendered cleanly at all 4 viewports for
  `parent-year-levels` with no console errors and a coherent, honest empty state
  ("SHOWING 0 SKILLS IN MATHEMATICS (LEVEL 3)" / "No matching skills found" —
  `screenshots/parent-year-levels_1440x900_explorer.png`), but genuinely showed 0
  skills for every jurisdiction/year/subject, even though the equivalent student
  surface shows 24 real Level 3 Mathematics lessons for the same household's Year 3
  child. Traced to: this page reads exclusively from Postgres
  (`src/server/curriculum/postgres-catalogue.ts` → `curriculum_nodes` /
  `curriculum_taxonomy_alignments`), a data source entirely separate from the static
  TypeScript lesson content that powers `/student/learn`. Confirmed both tables have
  **0 rows** on a freshly-`supabase start`ed local instance; `supabase/config.toml` has
  `[db.seed] enabled = false` and no seed file references either table — this repo's
  e2e harness has never had a way to populate them locally.
- failure scenario: Task item 4 ("parent explorer renders; badges match what the
  student surface shows") could not be verified against real data through this
  harness — this is being reported as a coverage gap in the test infrastructure itself,
  not a claim that the production parent explorer is broken (it may well be fully
  populated in the real hosted Supabase project this repo's `.env.local` points at,
  which this audit was explicitly barred from touching). Recommend adding a
  `curriculum_nodes`/`curriculum_taxonomy_alignments` fixture (mirroring
  `content/curriculum-imports/vic-f10-v2-l3-l5.json`) to `e2e/fixtures/seed.ts` so a
  future authenticated audit or CI suite can actually cross-check parent-badge vs.
  student-CTA agreement, which is exactly the recurring bug class both audits this week
  were asked to watch for.
- confidence: confirmed (the empty tables and the resulting untestability); the
  production state is explicitly unverified

---

## Confirmed clean (checked, no defect found)

- **Item 1 — grade separation on `/student/learn`**: `student-year-3` sees only Level 3
  pathways grouped by learning area (Mathematics, English) and `student-year-5` sees
  only Level 5 pathways — verified at all 4 viewports for both accounts by reading the
  full rendered page text. No Level 5 pathway section ever appears for the Year 3
  account and vice versa. (An automated substring check flagged Level 3 codes appearing
  on the Year 5 page; manual inspection showed these are legitimate cross-level
  "Prerequisites:" references, not pathway leakage — see the MEDIUM finding above for
  the residual concern.)
- **Check → practice loop**: both `VC2M3N01` (Year 3) and `VC2M5N02` (Year 5) — real,
  gated, published content — render worked examples and a working "Check for
  Understanding" section whose "Start Practice Drill" button launches a session with a
  real, answerable question. Verified at all 4 viewports for both accounts.
- **Item 2 — classroom-only nodes**: `VC2E3LY01` and `VC2E5LY01` both render "Practised
  in class" with no practice CTA anywhere on the page, at all 4 viewports, for both
  accounts. (Content-audit spot check separately confirmed all 6 classroom-only nodes
  author zero mapped questions and omit the "check" section entirely — the CTA is
  structurally absent, not just hidden.)
- **Item 3 — next-lesson never crosses grades**: the last Level 3 lesson (`VC2E3LY13`)
  and the last Level 5 lesson (`VC2E5LY12`) each render footer navigation with **no**
  "Next Lesson" link at all — confirmed at all 4 viewports, both accounts. Matches the
  deliberate `sameLevelLessons` scoping in
  `src/app/student/learn/lessons/[code]/page.tsx:57-67`.
- **Keyboard-only navigation**: a full Tab-order walk through `VC2M3N01` (worked-example
  stepper, "Jump to step N" buttons, check section, footer nav) and its resulting
  practice-question page (answer inputs, "Question N, not answered" navigator buttons,
  "Flag for review", "End session") found no dead ends and no unreachable interactive
  element; every control had a meaningful accessible name except the two icon-only nav
  links already reported above. Full 45-step focus trace in `flow-audit-log.json`.
- **Colour contrast**: axe's WCAG2AA `color-contrast` rule reported zero violations
  across all 10 scanned page/account/viewport combinations (student-learn ×2 grades ×2
  viewports, a lesson page ×2 viewports, the practice-session question page ×2
  viewports, parent explorer ×2 viewports).
- **Console errors/warnings**: zero, across all 72 logged page visits and interactions
  spanning both students, the parent account, and all 4 viewports.
- **Small-viewport layout**: no horizontal overflow at 375px or 768px on
  `/student/learn` or a lesson detail page (`document.documentElement.scrollWidth`
  never exceeded `clientWidth`); visual inspection of the 375px and 768px screenshots
  found no overlapping or clipped elements.

## Fixtures added (test-only, kept on this branch)

`e2e/fixtures/identities.ts` and `e2e/fixtures/seed.ts` gained one new parent
(`parent-year-levels`) and two new students (`student-year-3` → `year_level=3`,
`student-year-5` → `year_level=5`), following the existing pattern exactly (fixed
email/login-code, `e2e:cleanup`'s regex already covers them, `e2e:seed` is idempotent).
No existing identity's semantics were changed. These are what let this and future
authenticated audits actually exercise both year levels — none of the pre-existing
fixture students had a `year_level` set at all.

Note on how this branch was produced: the shared main worktree
(`C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine`) was mid-rebase on an unrelated
branch (`feat/assessment-capability-complete`) from a concurrent process partway
through this audit, which silently discarded this audit's first attempt at the fixture
edits before they were committed (no data loss beyond re-typing two source edits — the
seeded Supabase rows were unaffected, being a separate service). The rest of this audit
was carried out from an isolated `git worktree` (`mindmosaic-audit-flows`) checked out
to this branch to avoid further collision, matching the pattern already used by the
concurrent `audit/security-2026-09-02` work (`mindmosaic-audit-security` worktree).
