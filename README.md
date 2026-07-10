# MindMosaic Exam Engine

MindMosaic is a premium educational practice portal for Grade 3 and Grade 5 learners. This repository provides the technical foundation for original NAPLAN-style and ICAS-style assessments: typed question data, schema validation, renderer registries, client-side exam state, scoring boundaries, and accessible React/SVG presentation.

This scaffold contains three sample questions only. The full question bank, authentication, payments, AI integrations, backend persistence, and Supabase are intentionally outside the current phase.

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
| `npm run validate:questions` | Validate the question bank against its schemas |

## Routes

- `/` — product introduction and sample-exam entry point
- `/exam` — sample assessment shell and question navigation
- `/results` — sample results summary
- `/showcase` — renderer examples and supported-type catalogue

## Project structure

```text
mindmosaic-exam-engine/
├── docs/                         Product and technical documentation
├── e2e/                          Playwright smoke tests
├── public/visuals/               Public visual assets
├── scripts/                      Content-validation utilities
├── src/app/                      App Router pages and global styles
├── src/components/               Shared branding and UI components
├── src/content/                  Sample questions and question-bank assembly
├── src/features/exam-engine/
│   ├── components/               Exam-specific composition
│   ├── question-renderers/       Question renderer registry and implementations
│   ├── scoring/                  Pure scoring functions
│   ├── state/                    Client-side exam state
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
```

Verify the production output and browser flow before release:

```bash
npm run build
npm run test:e2e
```

Playwright requires a compatible browser installation. If one is not already available, install it with `npx playwright install` before running the end-to-end suite.

## Current renderer support

The scaffold includes functional renderers for:

- `multiple_choice`
- `number_entry`
- `bar_chart` as deterministic SVG

All other declared question and visual types resolve through their registries to accessible next-phase placeholders. Unknown types use an accessible unsupported-type fallback.

## Next implementation phase

The next phase should implement the remaining declared question and visual renderers, deepen automated coverage, and expand the original sample content into a reviewed question bank. Backend services can later be introduced behind the validated domain boundary for persistence, accounts, and delivery without coupling those concerns to page or renderer components.

## Originality and copyright

All MindMosaic practice questions, passages, explanations, datasets, and visuals must be original. Never copy or closely paraphrase official NAPLAN or ICAS material, textbooks, websites, commercial question banks, or other protected sources. The terms “NAPLAN-style” and “ICAS-style” describe practice modes only; they do not imply ownership of or affiliation with those assessment providers. See [Content rules](docs/CONTENT_RULES.md).
