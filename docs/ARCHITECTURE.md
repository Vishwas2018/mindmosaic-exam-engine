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
| `/` | Present the MindMosaic product, grade choices, practice modes, and entry links |
| `/exam` | Compose the sample exam shell, navigation, progress, response controls, and selected question renderer |
| `/results` | Present the score summary and result breakdown shell |
| `/showcase` | Exercise working renderers and catalogue all declared question and visual types |

Route components coordinate layout and feature components. They should not contain type-specific renderer switches, scoring algorithms, or exam-specific rules that belong to the domain layer.

## Structured question data

Questions and visual assets are authored as structured TypeScript/JSON-compatible data. Zod schemas validate the boundary before data reaches an exam session. The schema foundation covers:

- question type and metadata;
- Grade 3 and Grade 5 year levels;
- NAPLAN and ICAS practice modes;
- draft and published status;
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

The current functional question renderers are `multiple_choice` and `number_entry`. The current functional visual renderer is `bar_chart`. Remaining declared types are extension points for the next phase.

## Deterministic React and SVG visuals

Visuals are data, not executable markup. A visual renderer receives schema-validated structured properties and creates a predictable React or SVG tree. Identical valid input must produce the same geometry, labels, reading order, and accessible description.

The visual boundary does not accept arbitrary unsanitised SVG. Renderers own the allowed primitives and attributes, while the schema owns the allowed data. This makes output reviewable, testable, and safe to render. Each meaningful visual requires accessible alternative text; SVG implementations should also expose appropriate titles, descriptions, or semantic labelling.

## Scoring separation

Scoring functions live outside React components and do not depend on page state or the DOM. A scorer receives a validated answer key and response, then returns a result suitable for aggregation, such as correct, incorrect, unanswered, or requiring manual review.

This boundary keeps scoring deterministic and unit-testable. Renderers collect responses; they do not decide marks. Extended responses such as essays can be recorded for manual review without weakening automated scoring contracts for objective question types.

## State management

Zustand provides client-side exam-attempt state. The store is responsible for attempt concerns such as the current question, recorded responses, navigation, flagged-for-review state, progress, and submission state. Timer data may be added at this boundary as the placeholder timer becomes functional.

Components consume focused selectors and actions rather than mutating shared data directly. Durable content definitions and answer keys are not component state, and pure scoring remains separate from the store.

## Future backend boundary

The scaffold uses local structured content and client-side attempt state. Supabase, authentication, payments, AI API calls, and backend persistence are intentionally absent.

When backend capabilities are introduced, they should sit behind service or repository adapters that return data conforming to the existing schemas. Server-only code should own credentials, authorisation, persistence, and privileged scoring or answer-key access. No API keys or secrets belong in browser code.

This boundary lets future services provide published question sets, attempt persistence, user accounts, reporting, and content workflows while the App Router pages and renderer contracts continue to consume the same validated domain models.
