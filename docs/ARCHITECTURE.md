# Architecture

## Overview

MindMosaic is organised around validated structured data and small, replaceable boundaries. App Router pages compose the experience; registries select renderers; renderers present questions and visuals; client state records an attempt; and pure functions calculate score outcomes.

```text
Structured content → Zod validation → renderer registries → React/SVG UI
                                      ↓
                              client attempt state
                                      ↓
                              pure scoring functions
```

## App Router pages

The application uses the Next.js App Router under `src/app`:

| Route | Responsibility |
| --- | --- |
| `/` | Present the MindMosaic product and the exam setup panel (year level, exam style, subject, question count, timing) |
| `/exam` | Compose the exam session: timer, progress, navigation map, flagging, response controls, renderers, and submit confirmation |
| `/results` | Present the complete result: summary, breakdowns by type/subject/skill/difficulty (plus year and style when mixed), and question-by-question review |
| `/showcase` | Exercise working renderers and catalogue all declared question and visual types |

Route components coordinate layout and feature components. They should not contain type-specific renderer switches, scoring algorithms, or exam-specific rules that belong to the domain layer.

## Structured question data

Questions and visual assets are authored as structured TypeScript/JSON-compatible data. Zod schemas validate the boundary before data reaches an exam session. The schema foundation covers:

- question type and metadata (subject, strand, skill, difficulty, marks, estimated time);
- Grade 3 and Grade 5 year levels;
- NAPLAN-style and ICAS-style practice (`examStyle: "naplan_style" | "icas_style"`);
- the content lifecycle (`draft`, `reviewed`, `published`, `rejected`) and `origin: "original_seed"`;
- options and answer keys;
- explanations;
- structured visual assets and required alternative text.

A type-keyed, extensible shape validates shared metadata and the compatibility between each question type and its discriminated answer key. Type-specific branches can be tightened as their renderers are implemented. Content assembly remains separate from UI code so a future content source can replace local modules without rewriting renderers.

## Renderer registries

`questionRendererRegistry` maps a supported question-type discriminator to a question renderer. `visualRendererRegistry` performs the equivalent lookup for visual types.

The registries:

- keep large switch statements out of page components;
- give each renderer a narrow, testable contract;
- make new renderer registration local and predictable;
- provide accessible next-phase placeholders for declared but unimplemented types;
- provide an accessible fallback when an unsupported type reaches the boundary.

All 14 declared question types and all 10 declared visual types have functional registered renderers.

## Deterministic exam selection

`src/features/exam-engine/selection` filters the production bank by year level, exam style and subject, then samples with a seeded Fisher–Yates shuffle (FNV-1a hash feeding mulberry32). The same bank, configuration and seed always produce the same questions in the same order; `Math.random` is never used. Selection runs exactly once when a session starts and the result is stored in session state, so navigation and rerenders can never reshuffle a live exam. An explicit `?seed=` query parameter on the home page makes sessions reproducible for tests. When a configuration cannot supply the requested count, the service reports `insufficient_questions` rather than guessing.

## Deterministic React and SVG visuals

Visuals are data, not executable markup. A visual renderer receives schema-validated structured properties and creates a predictable React or SVG tree. Identical valid input must produce the same geometry, labels, reading order, and accessible description.

The visual boundary does not accept arbitrary unsanitised SVG. Renderers own the allowed primitives and attributes, while the schema owns the allowed data. This makes output reviewable, testable, and safe to render. Each meaningful visual requires accessible alternative text; SVG implementations should also expose appropriate titles, descriptions, or semantic labelling.

## Scoring separation

Scoring functions live outside React components and do not depend on page state or the DOM. A scorer receives a validated answer key and response, then returns a result suitable for aggregation, such as correct, incorrect, unanswered, or requiring manual review.

This boundary keeps scoring deterministic and unit-testable. Renderers collect responses; they do not decide marks. Extended responses such as essays can be recorded for manual review without weakening automated scoring contracts for objective question types.

`buildExamResult` in `scoring/exam-report.ts` aggregates per-question outcomes from the scoring dispatcher into a complete exam result: attempted/auto-marked/manual counts, objective marks earned and available, a whole-number objective percentage (0 when no objective marks exist), time taken, submission reason, and breakdowns by question type, subject, skill, difficulty, year level and exam style. Manual-review marks are excluded from every objective figure.

Every question-level result distinguishes **`requiresManualMarking`** (a question-level fact: this type is never auto-marked, attempted or not) from **`manualReviewRequired`**/`pendingManualReview` (true only once a non-blank response exists). A blank essay is `unanswered` — excluded from both the objective denominator and pending manual marks — while a non-blank essay is `manual_review`, excluded from the objective percentage but included in pending marks. See [Assessment security model](ASSESSMENT_SECURITY_MODEL.md) for the full rationale.

Scoring is called through `AssessmentScoringService` (`scoring/assessment-scoring-service.ts`), not `buildExamResult` directly, from the one call site that finalises a session (`exam-store.ts`'s `submitExam`). The current implementation, `LocalPracticeScoringService`, is a thin pass-through to `buildExamResult`; the interface exists so a future server-authoritative implementation is a drop-in replacement rather than a rewrite of the store or UI. See [Assessment security model](ASSESSMENT_SECURITY_MODEL.md).

## State management

Zustand provides client-side exam-session state: attempt ID (`crypto.randomUUID()`, independent of the selection seed — two sessions started with the same seed select the same questions but never share an attempt ID), selection seed and configuration, the fixed question order, the current index, responses, flags, timestamps, timer state, submission reason and the computed result. Exam status moves through `not_started → in_progress → submitting → submitted`; a submitted exam is immutable and duplicate submission is impossible from any path.

**The `questions` field in the store never carries an answer key.** `startExam` strips each selected question down to a `CandidateQuestion` (`types/candidate-question.ts`, `toCandidateQuestion`) before it ever reaches `set()` — the exam UI, including every question renderer, only ever sees candidate-safe data. The bank passed to `startExam` is kept in a module-level variable outside the Zustand store; because selection is a pure function of `(bank, config, seed)`, `submitExam` can deterministically recompute the same full authoring questions to score against without the reactive state tree ever holding one. The recomputed authoring questions are then stored in a separate `reviewQuestions` field, populated only at submission — this is what the results/review screen reads for correct answers and explanations, and it is `null` for the entire duration of the attempt. See [Assessment security model](ASSESSMENT_SECURITY_MODEL.md) for the full boundary and its limitations.

**Timed sessions carry an authoritative `deadlineAt`** (`startedAt + durationSeconds * 1000`, epoch milliseconds), not just a countdown display. Every response mutation (`setResponse`) and every submission (`submitExam`) checks `deadlineAt` against the current clock directly — a missed or delayed UI timer tick can never let a late answer through, because the deadline check does not depend on the tick having already run. The boundary convention is exclusive: `now >= deadlineAt` is expired (one millisecond before is accepted, exactly on the deadline is not). A late `user_submitted` request is recorded as `timer_expired`, and the submission timestamp is clamped to `deadlineAt`, so recorded time-taken can never exceed the configured duration even if finalisation is processed long after expiry. Pure helpers for this live in `state/deadline.ts` and take an explicit `now` rather than reading `Date.now()` themselves, so tests inject a controllable clock. `durationSecondsFor` (`selection/selection-config.ts`) derives a "full" exam's duration from the actual selected questions' `estimatedTimeSeconds` (× 1.5 buffer, clamped to 10–180 minutes) rather than a flat value — a fixed count (10/20/30) still uses the table lookup (15/30/45 min).

Components consume focused selectors and actions rather than mutating shared data directly. Durable content definitions and answer keys are not component state, and pure scoring remains separate from the store. Session state is in-memory only in this phase; a browser refresh ends the attempt.

## Navigation lifecycle

Client-side navigation between routes (`ExamConfigurator` → `/exam`, and the exam page → `/results` on submission) uses `useBoundedNavigation` (`components/use-bounded-navigation.ts`): a small number of retried `push`/`replace` attempts (default 6, spaced 400ms) to work around an App Router quirk on Windows where a navigation can be dropped while racing a concurrent route fetch. Retries stop on unmount (the navigation committed), once the attempt budget is exhausted, or immediately if the triggering condition clears — never indefinitely. Exhausting the budget while still mounted surfaces a recoverable error with a manual retry action rather than retrying forever.

Submission uses `router.replace("/results")`, not `push` — this is what stops browser Back from ever landing on a submitted exam page: `/exam` never stays in history, so Back from `/results` goes to whatever preceded it (the setup/home route), not into a redirect loop. The exam page also explicitly renders a "this exam has already been submitted" state rather than falling through to the interactive question view if a submitted session is ever revisited.

## Question navigation focus and the submission dialog

The current question's "Question X of N" label is a heading (`<h2 tabIndex={-1}>`) that receives focus whenever the question index changes (Next, Previous, or the navigation map) — not on initial page load, and not when a response changes (the effect depends only on the index). A companion `aria-live="polite"` region announces the question number independently of focus for assistive technology that does not reliably speak a newly focused heading.

The submission confirmation is a native `<dialog>` opened with `showModal()` (`components/SubmitConfirmationDialog.tsx`), not a styled `<div>` — focus trapping, background inertness, and top-layer stacking come from the browser rather than hand-rolled logic. React manages opening/closing in response to state, restores focus to whatever opened it on close, and sets initial focus onto the non-destructive "Keep working" action (not "Submit now").

## Rendering ownership

`ExamQuestion` (the shell) owns stimulus and visual rendering for every question type by default. Three renderer types are the documented exception, each declared in `TYPES_OWNING_STIMULUS`/`TYPES_OWNING_VISUALS`: `reading_comprehension` owns its own stimulus (it links the passage to its control via `aria-describedby`, which the shell's generic rendering does not do), and `label_diagram`/`hotspot` own their single visual as part of the interaction itself (a static copy plus an interactive one would show every diagram twice). The shell still renders visuals generically for `reading_comprehension` questions that also carry a supplementary chart, since that type only opts out of stimulus ownership.

## Future backend boundary

The scaffold uses local structured content and client-side attempt state. Supabase, authentication, payments, AI API calls, and backend persistence are intentionally absent.

When backend capabilities are introduced, they should sit behind service or repository adapters that return data conforming to the existing schemas. Server-only code should own credentials, authorisation, persistence, and privileged scoring or answer-key access. No API keys or secrets belong in browser code.

This boundary lets future services provide published question sets, attempt persistence, user accounts, reporting, and content workflows while the App Router pages and renderer contracts continue to consume the same validated domain models. `AssessmentScoringService` is the specific seam a server-authoritative scoring implementation will occupy — see [Assessment security model](ASSESSMENT_SECURITY_MODEL.md).

## Client bundle budget

`npm run check:bundle` builds the app and sums the real emitted chunk sizes referenced by each route's prerendered HTML, failing if any route exceeds a documented budget. Route components should import feature code directly from its file (`@/features/exam-engine/components/ExamQuestion`), not through a barrel `index.ts` — a barrel's `export *` can pull an entire unrelated component (and its imports, including the production question bank) into a route that never renders it. See [Phase 3 hardening](PHASE3_HARDENING.md) for the specific regression this guards against and the measured before/after sizes.
