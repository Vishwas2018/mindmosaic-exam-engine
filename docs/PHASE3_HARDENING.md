# Phase 3 Hardening

Record of the comprehensive hardening pass performed on top of Phase 3 (commit `08acd25`), addressing an independent audit's P1/P2/P3 findings on exam integrity, accessibility, and client-side security posture.

Branch: `claude/phase3-comprehensive-hardening`. Seventeen commits, each independently verified (typecheck, lint, unit/component tests, `validate:questions`, `check:answers`, and — for UI-affecting changes — the Playwright suite) before the next began.

## How to read this document

Each finding is classified:

- **Fixed** — implemented and covered by tests at the appropriate level (unit, component, and/or Playwright).
- **Mitigated with documented reason** — the underlying risk is reduced but not eliminated, and the residual risk is explained.
- **Intentionally deferred** — not implemented in this pass, with the reason and what would be required.

## P1 findings

### Authoritative deadline enforcement — Fixed

**Problem:** timed exams relied on UI timer ticks; a missed or delayed tick could let a late response or a late `user_submitted` request through.

**Fix:** `state/deadline.ts` adds a `deadlineAt` (epoch ms) to session state, computed once at `startExam`. `setResponse` and `submitExam` check `deadlineAt` against the current clock directly — not against `remainingSeconds`, which only the timer tick updates. The timer tick still runs, but only to refresh the *display*; it is no longer the sole authority.

**Boundary convention (documented, not just implicit):** a deadline is **exclusive** of the instant it names. `now < deadlineAt` succeeds; `now >= deadlineAt` — including exactly on the deadline — is expired. This makes "one millisecond before" and "exactly at" unambiguous and matches `remainingSeconds` reaching exactly zero.

**Additional guarantees:**
- A late `user_submitted` request is recorded as `timer_expired` (`getEffectiveSubmissionReason`).
- The submission timestamp is clamped to `deadlineAt` when the request arrives late (`getEffectiveSubmittedAt`), so a 900-second exam finalised 1,200 seconds after start still records exactly 900 seconds — never more than the configured duration.
- Duplicate finalisation is structurally impossible: `submitExam`'s status guard (`in_progress` only) combined with Zustand's synchronous `set()` means the first caller to run wins; every other path's `get()` sees the new status.
- Untimed exams are unaffected — `deadlineAt` is `null`, every check short-circuits.

**Tests:** `state/deadline.ts` pure-function tests (unit) plus a dedicated `exam-store.test.ts` describe block covering: accept at deadline-1ms, reject at exact deadline, reject with no tick call at all, preserve a response accepted just before expiry, override a late `user_submitted`, cap time-taken on delayed finalisation, and untimed-mode non-interference.

### Results back-navigation trap — Fixed

**Problem:** the exam page repeatedly `push`ed `/results` on an unbounded `setInterval`; a submitted `/exam` stayed in browser history, so Back could re-trigger the redirect indefinitely.

**Fix:** submission now uses `router.replace("/results")`, not `push` — `/exam` never stays in history, so Back from `/results` goes to whatever preceded `/exam` (the setup/home route) rather than back into a redirect loop. Combined with the bounded-navigation fix below, the retry is capped rather than an unbounded interval, and the exam page explicitly renders a "this exam has already been submitted" state (with a manual "View results" link) if a submitted session is ever revisited directly.

**Tests:** component test (`navigation-lifecycle.test.tsx`) asserting exactly one `replace` call on immediate success, no `push` calls, and no further calls once the retry budget is exhausted or the component unmounts; Playwright test (`results back navigation does not loop back into the exam`) driving the real flow — submit, arrive at results, browser Back, land on `/`, no further redirect after a 1-second wait.

### Ordering questions showing a correct default without a response — Fixed

**Problem:** `OrderingRenderer` defaulted to `interaction.items`' authored order. Four of the six ordering questions in the production bank (and one showcase fixture) are authored with items already in the correct sequence — an untouched question displayed as already correct, with no response recorded.

**Fix:** `deriveInitialOrder` (`question-renderers/ordering-utils.ts`) rotates the authored order by one position — a pure function with no access to the answer key, since none is available client-side (see [Assessment security model](ASSESSMENT_SECURITY_MODEL.md)). Rotation by one is guaranteed to differ from the authored order for two or more items (item ids are unique per the schema). Verified against the actual production bank: rotate-by-one produces a non-matching order for all six ordering questions, so no content needed to change.

Scoring is unaffected: the renderer does not persist the rotated display as a response, so an untouched question is still `unanswered`. A content-validation test (`ordering-initial-order.test.ts`) asserts `deriveInitialOrder(...) !== answerKey.optionIds` for every ordering question in the production bank and showcase fixtures — a future authoring mistake that produces a coincidental match would fail this test.

**Tests:** unit tests for `deriveInitialOrder` (fixed vectors, purity, no mutation), the content-validation guard above, and component tests (initial order deterministic and non-canonical, stable across re-render, keyboard reordering, scores unanswered until touched, restores and scores correctly once set).

### Blank essay semantics — Fixed

**Problem:** a blank essay was scored `manual_review` — "pending manual review" — rather than `unanswered`, inflating pending-marks counts for something nobody had written.

**Fix:** `ScoredResponse` now distinguishes `requiresManualMarking` (question-level: this type is never auto-marked, attempted or not) from `manualReviewRequired` (true only once a non-blank response exists). `scoreEssay` returns the shared `unanswered()` result for a blank/whitespace-only response — `status: "unanswered"`, `requiresManualMarking: true`, `manualReviewRequired: false` — and the `manual_review` outcome only for a non-blank one. `requiresManualMarking` flows through `QuestionScore` and `QuestionResultDetail` so `exam-report.ts`'s aggregation (objective marks, pending marks, breakdown rows) and the results page all agree: a blank essay is excluded from both the objective denominator and pending manual marks, but still identifiable as a manual-marking question type via `requiresManualMarking` (or, independently, `answerKind === "manual"` on the candidate DTO).

**Tests:** parametrised unit tests for missing/null/empty/whitespace-only vs. non-blank responses at both the scorer level and `buildExamResult` level, including a mixed-state multi-essay case and a check that the objective denominator is identical whether or not an essay in the same exam was attempted.

### Client-side answer keys and authoritative scoring — Mitigated with documented reason

See [Assessment security model](ASSESSMENT_SECURITY_MODEL.md) for the full boundary. Summary: `CandidateQuestion`/`AuthoringQuestion`/`ReviewQuestion` DTOs, a `toCandidateQuestion` sanitiser, an `AssessmentScoringService` interface with a `LocalPracticeScoringService` implementation, and a `reviewQuestions` field that stays `null` until submission — all real, tested boundaries that keep answer keys out of reactive app state. This is explicitly **not** claimed as tamper-resistant: the bank is still present in the JS bundle, because the product constraint for this phase excludes a server. Full mitigation requires the Phase 4 server-authoritative path documented in the security model.

### Accessible submission dialog — Fixed

**Problem:** the confirmation "dialog" was a styled `<div>` with `role="dialog"`/`aria-modal="true"` and hand-rolled Escape handling — no real focus trap, background remained interactive.

**Fix:** `SubmitConfirmationDialog` uses a native `<dialog>` opened with `showModal()`. Focus trapping, background inertness, and top-layer stacking come from the browser. React manages open/close in response to state, restores focus to the opener on close, and explicitly focuses the non-destructive "Keep working" action on open (not "Submit now") — necessary because the dialog's content stays mounted whether or not it's open, so React's own `autoFocus` prop would only fire once at mount rather than on every open.

A genuine implementation bug surfaced and was fixed during this work: splitting the open/close effect and the `close`-event listener into two separate `useEffect`s (keyed on different dependencies) let React tear down and rebuild the listener in a different commit pass than the `close()` call that was supposed to trigger it — the synchronously dispatched event could fire while nothing was listening. Both concerns now live in one effect.

**Tests:** component tests (open/closed state, initial focus, backdrop click vs. content click, focus restoration, confirm-once); a jsdom `showModal()`/`close()` polyfill (`vitest.setup.ts`, since jsdom doesn't implement the modal methods) with the reasoning documented inline; Playwright test covering real-browser keyboard open, Tab/Shift+Tab containment (see note below), Escape, focus restoration, and background-inert click rejection.

**Note on Tab containment in the Playwright test:** Chromium's native modal focus trap briefly parks focus on `<body>` between the dialog's last control and wrapping back to the first, rather than jumping directly between the two dialog buttons. The test asserts the guarantee that actually matters — focus is never on an interactive control *outside* the dialog, and repeated Tabs do eventually return to a dialog control — rather than a specific two-element ping-pong that doesn't match real browser behaviour.

## P2 findings

### Full exam duration — Fixed

A "full" exam always received a flat 90 minutes regardless of how many questions matched the filters. `durationSecondsFor` (`selection/selection-config.ts`) now sums the selected questions' authored `estimatedTimeSeconds`, applies a 1.5× buffer, rounds up to the next minute, and clamps to [10, 180] minutes for `"full"`; fixed counts (10/20/30) are unchanged (15/30/45 min table lookup). The setup-screen preview uses the eligible set — the same set `"full"` selects — so the displayed estimate always matches what `startExam` computes.

### Bounded navigation and pending UI — Fixed

`useBoundedNavigation` (`components/use-bounded-navigation.ts`) replaces two separate unbounded `setInterval` retry loops (exam start, results redirect) with a capped number of attempts (default 6, 400ms apart) that stop on unmount, on the triggering condition clearing, or once the budget is exhausted — never indefinitely. `ExamConfigurator` gets an `isStarting` state that disables the Start button from the moment a session is created until navigation commits, so a double-click or repeated Enter cannot create a second session behind the first. Exhausting the retry budget surfaces a recoverable error with a manual retry action in both callers.

### Cleared fill-blanks remaining answered — Fixed

**Problem:** `isUnanswered` checked only `Object.keys(answer).length === 0` — a fill-blank response left as `{ triangle: "" }` after being typed into and cleared still counted as "answered," and scored `incorrect` rather than `unanswered`.

**Fix:** shared helpers in `types/response-utils.ts` — `isBlankString`, `isBlankRecord`, `isUnansweredResponse`, `normaliseRecordResponse` — make "answered" mean "has a value," not "has a key." `isUnanswered` (used by scoring, the answered-question count, and the navigation map) now delegates to `isUnansweredResponse`, so a record counts as unanswered when every value is blank, matching how matching/dropdown/drag-drop/label-diagram renderers already behaved (they delete the key on clear). `FillBlankRenderer` was the one renderer that didn't — it now deletes a blank's key on clear too, for consistency and so the "your answer" review display never shows a stray empty entry.

**Tests:** unit tests for every helper (including the empty-record and all-blank-values cases); component tests for type→answered, clear→unanswered (key removed, not left empty), whitespace-only→unanswered, partial multi-blank retains the other blank's value, and persistence across re-render; Playwright test typing into a fill-blank, clearing it, navigating away and back, and confirming it remains unanswered (`aria-label` on the nav map, not just visual state).

### Duplicate stimulus and visual rendering — Fixed

`ExamQuestion` (the shell) rendered every question's stimulus and visuals generically, while `ReadingComprehensionRenderer` also rendered its own stimulus (with an `aria-describedby` link the shell's copy lacks) and `LabelDiagramRenderer`/`HotspotRenderer` rendered their single visual as part of the interaction — reading passages and label/hotspot diagrams were shown twice. `TYPES_OWNING_STIMULUS`/`TYPES_OWNING_VISUALS` in `ExamQuestion.tsx` name the exception explicitly; the shell skips exactly the piece each of those three types owns and continues to own both for every other type, including the one case (`reading_comprehension` with a supplementary chart) where a type owns one but not the other.

**Tests:** DOM-count assertions (`exam-question-ownership.test.tsx`) for reading stimulus, labelled visual, hotspot visual, and an ordinary visual each rendering exactly once.

### Visual range and main-thread safety — Fixed (with one documented gap)

A schema-valid number-line or coordinate-grid configuration (finite, `step > 0`, `min < max`) could still combine a tiny step with a huge span and generate an effectively unbounded tick/gridline array via the previous open-ended float loops. `visual.schema.ts` now rejects any configuration whose tick/gridline count would exceed 200 per axis, via the shared `calculateBoundedStepCount` (`schemas/visual-safety.ts`); `NumberLineRenderer`/`CoordinateGridRenderer` generate ticks by index up to that same bounded count as a render-time backstop.

**Documented gap:** the spec also asked for visual points (`geometry_shape` vertices, `coordinate_grid` points) to be validated as lying within their declared ranges "where required." This was not implemented — it is a data-quality concern (an out-of-range point renders off-canvas or clipped, which is visibly wrong but not a main-thread freeze risk), not the safety-critical issue the bounded-count work addresses, and doing it well requires per-shape range semantics that weren't specified precisely enough to implement confidently in this pass without risking overly strict false positives on legitimate content.

**Tests:** `calculateBoundedStepCount` unit tests (zero/negative step, `Infinity`/`NaN`, huge-span-tiny-step clamping, exact boundary, one-beyond-boundary, floating-point step precision); schema-level equivalents for both visual types against the real production limits; component tests constructing a hostile configuration directly (bypassing schema, as content that somehow slipped through would) and asserting the renderer's actual DOM output is capped.

### Client bundle size — Fixed (partial) + documented budget

**Problem:** `/exam`, `/results`, and `/showcase` all imported `ExamQuestion` through the `exam-engine/components` barrel (`export * from "./ExamConfigurator"` among others), or `describeConfig` directly from `ExamConfigurator.tsx` — pulling the full setup component, including its production question-bank import, into three routes that never render it.

**Fix:** `describeConfig` (and its label maps) moved to its own side-effect-free module (`components/describe-config.ts`); all three routes now import `ExamQuestion` directly from its own file instead of the barrel.

**Measured effect** (see "Bundle sizes" below): real, verified reduction on all three affected routes; home page is unaffected (it legitimately renders `ExamConfigurator`).

**Deferred:** converting the 14 question renderers and 10 visual renderers to `next/dynamic` per-type code-splitting (explicitly suggested in the audit) was assessed and **not implemented** in this pass. Reasoning: a typical exam session touches many different question types within seconds of each other (see flow 2's mixed-type coverage), so lazy-loading each renderer individually would mostly move network requests around in time rather than meaningfully reduce total bytes transferred for a full session, while adding real risk — Suspense boundaries, loading-state flicker, and potential SSR/hydration interaction with Next's static prerendering of `/showcase` (which renders all 24 renderers unconditionally at build time) — disproportionate to the likely gain. The barrel-import fix delivered a measured, low-risk reduction; further per-renderer splitting is a legitimate follow-up if a future profiling pass shows it's worth the added complexity, not a gap in this hardening pass's completeness.

`npm run check:bundle` (`scripts/check-bundle.mts`) builds the app and sums the real emitted chunk sizes referenced by each route's prerendered HTML — what a browser actually downloads on a cold load — failing if any route exceeds a documented budget.

#### Bundle sizes

| Route | Baseline (before) | After barrel-import fix | Budget |
| --- | ---: | ---: | ---: |
| `/` | 1,081 KB | 1,082 KB (unaffected, expected) | 1,150 KB |
| `/exam` | 1,145 KB | 1,023 KB | 1,100 KB |
| `/results` | 1,120 KB | 999 KB | 1,100 KB |
| `/showcase` | 1,155 KB | 1,015 KB | 1,100 KB |

Budgets carry headroom above the measured post-fix size for normal content growth (more questions, more renderers), not headroom for reintroducing avoidable imports — `bundle-boundaries.test.ts` statically guards the exact import patterns that caused the original bloat (no direct production-bank import, no barrel import, in `/exam`, `/results`, `/showcase`).

**Known limitation:** ~1MB of first-load JS is still large for the actual amount of interactive UI in this app; the bulk is React 19 + Next.js 16 + Turbopack's production runtime, which this measurement methodology (summing every referenced chunk, including shared framework chunks) doesn't separate from route-specific code. Turbopack's current production build output doesn't print a per-route "First Load JS" breakdown the way the older webpack build did, so this script's own chunk-reference-counting is the project's replacement signal, not a perfectly apples-to-apples comparison with a typical Next.js bundle-size report.

### Question change focus and announcements — Fixed

The "Question X of N" label is now a heading (`<h2 tabIndex={-1}>`) that receives focus on Next/Previous/navigation-map clicks — not on initial page load (a ref guard skips the first mount, so loading the page doesn't fight the browser's own route-change focus handling), and not when a response changes (the effect depends only on the question index). A companion `aria-live="polite"` region announces the question number independently of focus, for assistive technology that doesn't reliably speak a newly focused heading's accessible name.

**Tests:** Playwright test covering Next/Previous/nav-map focus movement and confirming answering a question (typing into a number-entry field) does not steal focus away.

### Drag/drop external text validation — Fixed

**Problem:** `DragDropRenderer` trusted whatever `text/plain` a drop event carried, falling back to it directly as an item id — arbitrary text dragged from elsewhere on the page, another application, or (since `/showcase` renders every question type on one page) a same-named item from a different drag-drop question could all be accepted.

**Fix:** drags carry a custom MIME type (`application/x-mindmosaic-item-id`) whose payload embeds the question id alongside the item id (NUL-separated — safe, since both ids are constrained by `identifierSchema` to lower-case letters/digits/hyphens/underscores only). A drop is applied only when the payload decodes, names this exact question, and names an item that exists in it; `dragover` only signals "drop allowed" for the same MIME type, so an external drag shows a rejection cursor. The keyboard/select placement fallback is unaffected.

**Tests:** component tests using a minimal `DataTransfer` stand-in (jsdom's is incomplete) for: valid drag, external plain-text rejection, unknown item id, item from a different question, malformed payload, move-without-duplicate (via the keyboard fallback, since placed items aren't re-draggable by design), and the keyboard fallback continuing to work.

## P3 findings

### Unique attempt IDs — Fixed

`sessionId` was derived directly from the selection seed (`exam-${seed}`) — two sessions started with the same seed (reproducible sessions for tests or sharing) collided on attempt id. `sessionId` is now generated independently via `crypto.randomUUID()` (with a same-shape fallback for runtimes without it); the seed continues to drive deterministic question selection alone. Verified: same seed still selects the same questions in the same order, but each attempt gets its own id, including two fresh sessions started with no explicit seed at all.

### Fixed determinism vectors — Fixed

`determinism-golden-vectors.test.ts` hard-codes expected values for `hashSeed`, the seeded PRNG sequence, `seededShuffle`, and `selectExamQuestions` against a known seed/filter/bank shape — each captured once from a real run, not derived by re-running the implementation inside the test. A bank "version guard" (an id-list hash) fails first and clearly if production content changes shape, since the selection golden vector is only meaningful against the exact bank it was captured against.

### Results definition-list DOM order — Fixed

The results-page summary cards rendered `<dd>` before `<dt>` in source order. Fixed to `dt` then `dd` everywhere on the page; `flex-col-reverse` keeps the value shown above the label visually, matching the original design, while source order is now semantically correct. Fixing this also surfaced a second, more serious defect: the summary cards' `<dl>` directly contained a `<div>` mixing a decorative icon with the dt/dd pair, which violates `<dl>`'s content model (a `<dl>` may only directly contain dt/dd groups, each optionally wrapped in its own single-pair `<div>`, plus script-supporting elements) — caught by the axe-core scan as `definition-list`/`dlitem` violations, not by manual review. Each card now owns its own single-pair `<dl>` scoped to just its label/value, with the icon outside it.

### Route metadata — Fixed

`/exam`, `/results`, and `/showcase` are client components and can't export `metadata` directly (only Server Components can); each gets a small sibling server-component `layout.tsx` carrying a distinct title (`Exam in progress` / `Your results` / `Renderer showcase`, suffixed via the root layout's `%s | MindMosaic` template). None reveal question content, session state, or a score. The home page keeps the root layout's default title.

## Additional finding: real accessibility violations (not in the original audit list)

Adding automated axe-core scanning (below) surfaced two defects neither the original audit nor manual review had caught:

1. **A cascade-layer bug broke `text-white` on the primary button variant.** `globals.css` declared base resets (`a { color: inherit }`, `body` colour, etc.) as unlayered CSS; under Tailwind v4's cascade-layer system, unlayered styles always win over *any* layered style regardless of selector specificity. This silently overrode the primary button's intended white text with the page's default ink colour — a 1.41:1 contrast ratio where ~8:1 was intended. Fixed by moving those resets into `@layer base`, matching Tailwind's own reset layer.
2. **Three colour tokens and one hard-coded shade were each one step too light.** `--secondary-text`, `--success`, `--warning` (design tokens) and a hard-coded `text-slate-500` in the pie-chart legend measured 4.33–4.39:1 against their actual backgrounds in real page contexts — narrowly under WCAG's 4.5:1 minimum for normal text. Each darkened by one step, verified against the real backgrounds in use (5.6–7:1 after).

Both are documented here rather than filed as new "findings" because they were discovered and fixed within this hardening pass, not carried forward as residual risk.

## Accessibility scanning

`@axe-core/playwright` (a maintained, official integration) scans four states for serious/critical violations: setup/home, an in-progress exam, the open submission dialog, and results/question-review (`e2e/accessibility.spec.ts`, helper in `e2e/accessibility.ts`). The gate is "serious"/"critical" impact only — "minor"/"moderate" findings aren't asserted, deliberately: an over-strict gate on ongoing visual-design decisions isn't the goal, "this page is unusable with assistive technology" is.

## Commits

1. Enforce authoritative exam deadlines
2. Correct manual review and unanswered scoring
3. Initialise deterministic ordering responses
4. Fix exam navigation and history behaviour
5. Add accessible submission confirmation dialog
6. Introduce candidate-safe assessment DTOs
7. Derive full-exam duration from selected questions
8. Normalise empty structured responses
9. Remove duplicated stimulus and visual rendering
10. Bound deterministic visual generation
11. Validate drag-and-drop item identifiers
12. Improve question navigation focus management
13. Separate attempt identity from selection seed
14. Add determinism golden-vector regression tests
15. Fix results dl semantic order and add distinct route titles
16. Reduce client bundle and add route budgets
17. Add automated accessibility scanning and fix real violations it found

## Recommended Phase 4 scope

1. Server-authoritative scoring (`AssessmentScoringService` server implementation) and server-side candidate DTO generation — the concrete next step the DTO boundary in this pass was built to make cheap.
2. Authentication and attempt persistence (session state is in-memory only today; a refresh ends the attempt).
3. Server-side session/seed issuance, so a client cannot pre-read a selection outcome before "starting" it.
4. Revisit per-renderer code-splitting with real usage profiling once there's production traffic to measure against, rather than the desk-based assessment in this pass.
5. Point-in-range validation for `geometry_shape`/`coordinate_grid` visual data (the one documented gap in the visual-safety work).
