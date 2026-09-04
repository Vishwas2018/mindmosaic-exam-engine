# Student Learn UX Review & Redesign Proposal

Scope: `/student/learn` and `/student/learn/lessons/[code]`, presentation layer only.
No data function, prop shape, gating logic, or route changes. See constraints at the
bottom before implementing.

## 1. What the screen does today

`page.tsx` renders (top to bottom): sidebar, sticky header, a "continue/diagnostic"
hero card + pathway-progress + worth-revisiting pair, then **`CurriculumPathwaysPanel`**,
then three next-step cards.

`CurriculumPathwaysPanel` → for each learning area (Mathematics, English) → for each
strand pathway (`number`, `algebra`, `measurement`, `space`, `statistics`,
`probability`, `language`, `literature`, `literacy`) → renders a full banner **and a
fully-expanded `<ol>` of every lesson node in that strand**, via `LessonPathwayList`.

For a Year 5 student that's 9 pathways and **50 lesson cards** (10+2+4+3+3+2+9+5+12),
all expanded, all the same visual weight, in one continuous column. Year 3 is a
second, similarly-sized tree. There is no lesson-level completion field in the data
model (`LessonPathwayNode.status` is an authoring/publish status, not a per-student
progress flag) — the only real per-student signals available on this screen are
pathway-level (`sortOrder` within a strand) and subject-level (`overview.mastery`,
already surfaced above the pathway panel).

## 2. Heuristic review of the current screen

| Heuristic | Finding | Severity |
|---|---|---|
| **Recognition over recall** | All 9 strands and 50 lessons are dumped at once — nothing tells the student "you were here last time." No anchor before scrolling into the tree. | High |
| **Visibility of system status** | Every card looks identical regardless of position in the sequence. The only status distinction is CTA copy ("Start Lesson" vs "Practise drill" vs "Practice coming soon"), not a glanceable badge. | High |
| **Progressive disclosure** | Zero. Every pathway and every node is expanded on load — for a Grade 3–5 reader this is an unscannable wall of nearly-identical purple-bordered cards. | Critical |
| **Wayfinding / minimal memory load** | No in-page nav, no breadcrumb between strands, no way to jump to "Number" without scrolling past everything above it. | High |
| **Aesthetic & minimalist design** | Each card repeats a 6-field metadata row + full learning-intention paragraph + prerequisite chips, at equal weight to lesson #1 and lesson #10. Visual noise scales linearly with content, not usefulness. | Medium |
| **Match to real-world child mental model** | Nothing marks "this is where you'd naturally start" or "these are done in class, don't worry about a button." A 8–11-year-old has no scent of what to click first among 50 identical buttons. | High |
| **Consistency** | Each lesson card is a `<li>` inside a strand `<ol>` inside a learning-area `<div>` — three levels of near-identical bordered-white-rounded-card nesting (pathway banner, node card, and inner metadata chip all reuse the same visual vocabulary), which flattens the hierarchy instead of expressing it. | Medium |
| **Error prevention / honesty** | Actually good — `hasDigitalPractice` gating, "Practised in class" vs "Practice coming soon" copy, and the null/empty states in `CurriculumPathwaysPanel` are honest and should be preserved exactly. | — |
| **Accessibility structure** | Headings are reasonable (`h2` region → `h3` per area → `h3` per pathway... — note: pathway banner `h3` sits at the same level as the learning-area `h3`, which is a heading-hierarchy skip once nested. `LessonView` sections all use `h2`, flattening the lesson's internal structure for screen-reader nav). | Medium |
| **Touch targets** | Buttons meet the 44px/38px minimums already (`min-h-[42px]`, `min-h-[38px]`) — keep these sizes. | — |

## 3. Redesign direction

### 3.1 Information architecture

Two-level navigation replaces the flat dump:

```
Learning area (tabs, top-level)  →  Mathematics | English
      ↓
Strand (accordion / rail, one open at a time by default)
      ↓
Lesson cards for the OPEN strand only (5-12 items instead of 50)
```

- **Learning-area tabs** at the top of the Lessons & Pathways section — exactly the
  two values `groupPathwaysByLearningArea` already returns, so this is a pure
  presentation split of data that's already grouped. Selected tab persists in the
  URL hash (`#area=Mathematics`) for shareable/back-button-safe deep links, per the
  existing "deep linking" and "active state" navigation guidelines.
- **Strand accordion** underneath: each `LessonPathway` (Number, Algebra, …) becomes
  a collapsible section, closed by default **except**:
  - the first strand in the active learning area (so there's always something to
    look at on load), or
  - a strand whose `pathway.title`/strand matches the page's existing
    `overview.recommendedFocus` label, if any (best-effort string match; falls back
    to "first strand" — never invents a match).
- **Sticky sub-nav rail**: a slim sticky strip beneath the main sticky header,
  listing strand short names as scroll-spy chips (Number · Algebra · Measurement …).
  Clicking jumps to (and expands) that strand. This is the "how it scales to 50
  nodes" answer — the tree is still fully present and crawlable, just not force-fed.

This keeps every byte of real data (`node.title`, `.learningIntention`,
`.prerequisites`, `.questionCount`, `.isClassroomOnly`, `.estimatedMinutes`) — it's
purely how much of it is open/visible at once.

### 3.2 "Start here" anchor (never "Continue")

**Revised per review feedback: there is no per-lesson completion state in the data
model, so this new chip must never imply resumed/tracked progress.** It is
deliberately named and worded "Start here," not "Continue," and carries no
percentage or "X of Y" copy — that would fabricate state the system doesn't have.
(This is separate from the existing hero card's "Continue practising" copy on
`page.tsx`, which is untouched — that one is legitimately driven by real session
history via `hasHistory`/`overview.attempts`, not by lesson completion.)

- If a strand's pathway can be matched to `overview.recommendedFocus.label` (string
  containment against `pathway.title`), the chip reads **"Start here: {strand
  title} — {first node's title}"** and jumps to + expands that strand.
- If no match or no `recommendedFocus`, it falls back to the first strand in the
  active learning area's first pathway, same wording — deterministic from
  `sortOrder`, not invented.
- No fabricated "3 of 10 complete" counters, no resume language, no implied
  memory of what the student has or hasn't opened.

### 3.3 Card design (lesson node)

Collapse the current always-expanded metadata block into a lighter, three-tier card:

1. **Row 1 (always visible, scannable):** sequence badge, title, one status badge
   (`Practise · N questions` / `Practised in class` / `Coming soon`), estimated
   minutes.
2. **Row 2 (always visible, truncated):** learning intention, `line-clamp-2`.
3. **Disclosed on hover/focus or via a "Details" affordance:** prerequisites list —
   these matter for wayfinding but not for every glance.

Actions collapse to a single primary "Start lesson" button; the practice-drill
link/label logic (`hasDigitalPractice` ternary) is untouched, just restyled smaller
and secondary.

### 3.4 Status badges (visual hierarchy, no new data)

Same three states as today, given actual color coding instead of only copy
differences, using existing tokens only:
- Practice available → `--mm-brand`/emerald accent (as now).
- Classroom-only → neutral `--mm-tint` chip with `School` icon (as now, just
  consistent sizing).
- Coming soon → quiet `--mm-muted-2` text, no border emphasis (de-prioritised, since
  there's nothing to click).

### 3.5 Empty / coming-soon states

`CurriculumPathwaysPanel`'s two empty states (`yearLevel === null`,
`learningAreas.length === 0`) are preserved verbatim — only wrapped in the new tab
shell. A third, new *presentational-only* case is added: a learning-area tab with
zero pathways for the student's year is simply not rendered as a tab (this already
happens implicitly since `groupPathwaysByLearningArea` omits empty groups — no logic
change needed).

### 3.6 Lesson detail page (`LessonView` + sections)

Lower-severity but same family of issues:
- Add a **sticky mini progress rail** (visual only, computed client-side from
  section order + `currentStepIndex` inside `WorkedExampleStepper` — no new data):
  Concept → Worked example → Misconception → Check, as anchor links, so a long
  lesson doesn't strand the student.
  - Since `LessonView` doesn't currently know which sections exist until it maps
    them, this rail is built from `lesson.sections` (already a prop) client-side —
    no new fetch.
- Fix heading hierarchy: section components use `h2` for every section under the
  page's `h1`; keep `h2` but ensure the breadcrumb/status bar doesn't insert
  competing landmarks — no functional change, verified via axe.
- Everything else (worked-example stepper mechanics, misconception card content,
  check-section gating and copy) is unchanged.

### 3.7 Responsive behaviour

- **375px:** tabs become a horizontally-scrollable pill row (native scroll, snap);
  sticky strand rail collapses to a `<select>`-styled jump menu to avoid a second
  sticky bar eating vertical space on a phone.
- **768px:** tabs + horizontally scrollable strand chip rail.
- **1024/1440px:** tabs + full sticky strand rail, unchanged sidebar.

## 4. Low-fi wireframes

### `/student/learn` — Lessons & Pathways section (desktop)

```
┌─────────────────────────────────────────────────────────────┐
│ Lessons & Pathways                    50 sequenced lessons   │
│ [ Start here: Number → Factor trees ]     (chip, no % claim) │
├─────────────────────────────────────────────────────────────┤
│  Mathematics ●  |  English                    ← tabs         │
├─────────────────────────────────────────────────────────────┤
│ Number ▾ Algebra  Measurement  Space  Statistics  Probability│ ← sticky rail
├─────────────────────────────────────────────────────────────┤
│ ▾ Number — Victorian Curriculum Level 5           10 lessons │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ ① N5.1  ·  12 min  ·  [Practise · 6 questions]         │ │
│   │ Factor trees and prime factorisation                   │ │
│   │ Break composite numbers into prime factors...          │ │
│   │                                    [ Start lesson → ]  │ │
│   └───────────────────────────────────────────────────────┘ │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ ② N5.2  ·  15 min  ·  [Coming soon]                    │ │
│   │ Square and prime numbers                                │ │
│   │                                    [ Start lesson → ]  │ │
│   └───────────────────────────────────────────────────────┘ │
│   … (8 more, same strand, all visible — this IS the scroll) │
│                                                                │
│ ▸ Algebra — Victorian Curriculum Level 5           2 lessons │ ← collapsed
│ ▸ Measurement                                       4 lessons │ ← collapsed
│ ▸ Space                                             3 lessons │ ← collapsed
│ ▸ Statistics                                        3 lessons │ ← collapsed
│ ▸ Probability                                       2 lessons │ ← collapsed
└─────────────────────────────────────────────────────────────┘
```

Only the open strand's cards render expanded — worst case (Number, 10 lessons) is a
normal scroll length, not 50 cards.

### Mobile (375px)

```
┌──────────────────────────┐
│ Lessons & Pathways        │
│ [Start here: Number →]    │
│┌────────┬────────┐        │
││Math ●  │English │  ← scrollable pill tabs
│└────────┴────────┘        │
│ [ Jump to strand ▾ ]      │ ← select-styled, replaces sticky rail
│ ▾ Number          10      │
│  ┌──────────────────────┐ │
│  │ ① N5.1 · 12 min       │ │
│  │ [Practise · 6 Qs]     │ │
│  │ Factor trees...       │ │
│  │      [Start lesson →]│ │
│  └──────────────────────┘ │
└──────────────────────────┘
```

## 5. Constraints re-confirmed (must hold through implementation)

- No change to `getCurriculumPathwaysForYearLevel`, `groupPathwaysByLearningArea`,
  `resolveQuestionsForCurriculumNode`, `getMappedQuestionIdsForNode`, or any
  server/scoring/question-factory/curriculum/lesson-definition code.
- `hasDigitalPractice = !isClassroomOnly && questionCount > 0` gating stays exactly
  as-is; no drill button on classroom-only or zero-coverage nodes; no fabricated
  counts.
- Year-awareness preserved — the components only ever render what
  `getCurriculumPathwaysForYearLevel(student.yearLevel)` returns.
- Existing Tailwind tokens (`mm-brand`, `mm-ink`, `mm-muted`, …) only — no new
  palette.
- Accordion/tabs/scroll-spy state is client-side UI state only (`useState`), no new
  server calls, no prop-shape changes to any lesson/curriculum component.
- Keyboard operable (tabs = `role="tablist"`/`tab`/`tabpanel` pattern, accordion
  triggers are real `<button aria-expanded>`), visible focus rings kept, axe-verified
  after implementation.

### 5.1 Nav accessibility (revised per review feedback)

- Learning-area tabs use the full WAI-ARIA tabs pattern: `role="tablist"` on the
  container, `role="tab"` + `aria-selected` + `aria-controls` on each trigger,
  `role="tabpanel"` + `aria-labelledby` on the panel, roving `tabindex`
  (`tabIndex={0}` on the selected tab, `-1` on the rest) with Left/Right/Home/End
  arrow-key handling, matching the APG tabs pattern.
- Strand accordions are real `<button aria-expanded aria-controls>` headers; the
  panel underneath is a sibling with a matching `id`.
- **Collapsed content stays mounted.** Both the non-active tabpanel and a closed
  accordion panel are hidden with the `hidden` attribute (or `hidden` + CSS), never
  conditionally unmounted — so every lesson card stays in the DOM, reachable by
  Ctrl-F, a screen reader's virtual cursor, and deep links, even while visually
  collapsed.
- Deep links / scroll-spy targets (`#area=Mathematics`, a strand anchor, or a lesson
  anchor) force both the owning tab *and* the owning accordion open on load/navigate
  — a lesson is never stranded behind a collapsed section it can't be reached
  through.
- `axe-core` run against the reworked screens must report 0 serious/critical
  violations, same bar as today.
