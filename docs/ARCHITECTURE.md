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

## State management

Zustand provides client-side exam-session state: session ID, selection seed and configuration, the fixed question order, the current index, responses, flags, timestamps, timer state, submission reason and the computed result. Exam status moves through `not_started → in_progress → submitting → submitted`; a submitted exam is immutable and duplicate submission is impossible from any path.

The timer is store-driven: a `tick` action recomputes remaining seconds from the session start time and the configured duration (10 questions → 15 min, 20 → 30 min, 30 → 45 min, full set → 90 min), clamps at zero, and auto-submits once with reason `timer_expired`. Because remaining time derives from timestamps rather than accumulated intervals, it never drifts negative and is directly testable with fake timers (Vitest) and the Playwright clock API — production durations are never shortened for tests.

Components consume focused selectors and actions rather than mutating shared data directly. Durable content definitions and answer keys are not component state, and pure scoring remains separate from the store. Session state is in-memory only in this phase; a browser refresh ends the attempt.

## Future backend boundary

The scaffold uses local structured content and client-side attempt state. Supabase, authentication, payments, AI API calls, and backend persistence are intentionally absent.

When backend capabilities are introduced, they should sit behind service or repository adapters that return data conforming to the existing schemas. Server-only code should own credentials, authorisation, persistence, and privileged scoring or answer-key access. No API keys or secrets belong in browser code.

This boundary lets future services provide published question sets, attempt persistence, user accounts, reporting, and content workflows while the App Router pages and renderer contracts continue to consume the same validated domain models.
