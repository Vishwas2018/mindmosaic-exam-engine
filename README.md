# MindMosaic Exam Engine

MindMosaic is a premium educational practice portal for Grade 3 and Grade 5 learners. This repository provides a complete local assessment engine for original NAPLAN-style and ICAS-style practice: a validated 100-question production bank, all 14 question renderers, all 10 deterministic visual renderers, deterministic seeded exam selection, timed and untimed sessions, navigation and flagging, objective scoring with manual-review handling, full results with breakdowns, and question-by-question review.

Authentication, payments, AI integrations, backend persistence, and Supabase are intentionally outside the current phase. See [Question bank summary](docs/QUESTION_BANK_SUMMARY.md) for the full content inventory.

## Technology stack

- Next.js latest stable release with the App Router
- React
- TypeScript in strict mode
- Tailwind CSS
- ESLint
- npm
- Vitest and React Testing Library
- Playwright
- Zod
- Zustand
- `clsx` and `tailwind-merge`
- `lucide-react`

Node.js 20.9 or newer is required.

## Installation

From the project directory, install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run the Playwright end-to-end suite |
| `npm run validate:questions` | Enforce the production bank contract (exact distribution, visual coverage, metadata, uniqueness) |
| `npm run check:answers` | Independently re-derive answers from question data without the scoring engine |

## Routes

- `/` — product introduction and the exam setup panel (year level, exam style, subject, question count, timing)
- `/exam` — the exam session: timer, progress, navigation map, flagging, renderers, and submit confirmation
- `/results` — full results: summary, breakdowns, and question-by-question review
- `/showcase` — renderer examples and supported-type catalogue

Passing `?seed=<value>` on the home page makes question selection reproducible; the four Playwright exam flows rely on this.

## Project structure

```text
mindmosaic-exam-engine/
├── docs/                         Product and technical documentation
├── e2e/                          Playwright smoke tests
├── public/visuals/               Public visual assets
├── scripts/                      Content-validation utilities
├── src/app/                      App Router pages and global styles
├── src/components/               Shared branding and UI components
├── src/content/questions/        Production bank (grade-3/, grade-5/), helpers, summary
├── src/features/exam-engine/
│   ├── components/               Exam composition, configurator, timer, answer formatting
│   ├── question-renderers/       Question renderer registry and implementations
│   ├── scoring/                  Pure scoring functions and exam-level result builder
│   ├── selection/                Deterministic seeded exam selection
│   ├── state/                    Client-side exam session state
│   ├── types/                    Exam domain types
│   ├── validation/               Exam validation helpers
│   └── visual-renderers/         Visual renderer registry and implementations
├── src/lib/                      General utilities
├── src/schemas/                  Zod question and visual schemas
└── src/tests/                    Unit, component, and fixture tests
```

Question rendering, visual rendering, scoring, and page composition are separate concerns. For more detail, see [Architecture](docs/ARCHITECTURE.md), [Question schema](docs/QUESTION_SCHEMA.md), and [Visual schema](docs/VISUAL_SCHEMA.md).

## Testing

Run the fast checks during development:

```bash
npm run typecheck
npm run lint
npm test
npm run validate:questions
npm run check:answers
```

Verify the production output and browser flow before release:

```bash
npm run build
npm run test:e2e
```

Playwright requires a compatible browser installation. If one is not already available, install it with `npx playwright install` before running the end-to-end suite.

## Current renderer support

All 14 declared question types and all 10 declared visual types have functional, accessible renderers registered through the renderer registries. Unknown types use an accessible unsupported-type fallback.

## Question bank

The production bank holds exactly 100 original, published questions (47 Grade 3, 53 Grade 5; 72 NAPLAN-style, 28 ICAS-style; 48 with deterministic visuals; 4 writing tasks marked by manual review). `npm run validate:questions` enforces the full contract and `npm run check:answers` independently verifies answer keys against question data. See [Question bank summary](docs/QUESTION_BANK_SUMMARY.md).

## Next implementation phase

The next phase can introduce backend services behind the validated domain boundary — attempt persistence, accounts, reporting, and content workflows — without coupling those concerns to page or renderer components. Session state is currently in-memory only, so a browser refresh ends the attempt; durable attempt persistence is the natural first backend feature.

## Originality and copyright

All MindMosaic practice questions, passages, explanations, datasets, and visuals must be original. Never copy or closely paraphrase official NAPLAN or ICAS material, textbooks, websites, commercial question banks, or other protected sources. The terms “NAPLAN-style” and “ICAS-style” describe practice modes only; they do not imply ownership of or affiliation with those assessment providers. See [Content rules](docs/CONTENT_RULES.md).
