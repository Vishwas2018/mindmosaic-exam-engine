# MindMosaic Exam Engine

MindMosaic is a premium educational practice portal for Grade 3 and Grade 5 learners. This repository provides a complete assessment engine for original NAPLAN-style and ICAS-style practice: a validated 100-question production bank, all 14 question renderers, all 10 deterministic visual renderers, deterministic seeded exam selection, timed and untimed sessions, navigation and flagging, objective scoring with manual-review handling, full results with breakdowns, and question-by-question review.

The engine now sits behind a working Supabase backend. Sign-in, sign-up, password reset, and OAuth (Google, Apple, Microsoft, Facebook) are implemented (`src/features/auth`), backed by a role/RLS schema for four roles — student, parent, teacher, admin (`supabase/migrations`, [Data model and roles](docs/DATA_MODEL_AND_ROLES.md)). Signed-in students get server-authoritative exam sessions: question selection, scoring, and attempt persistence all happen server-side (`src/app/api/exam`), never trusting the client with an answer key before submission. See [Question bank summary](docs/QUESTION_BANK_SUMMARY.md) for the full content inventory.

Guest practice (no account) remains **local and low-stakes**: scoring runs entirely in the browser against a question bank fetched at session start, which a determined user could inspect. Signed-in practice is server-authoritative: the client never receives an answer key before the server records the attempt. See [Assessment security model](docs/ASSESSMENT_SECURITY_MODEL.md) for the exact boundary, its guest-mode residual, and its addendum recording the move to server-authoritative scoring; and [Phase 3 hardening](docs/PHASE3_HARDENING.md) for the audit-and-fix record behind the exam-integrity and accessibility guarantees that predate that move. For the reasoning behind specific architectural choices along the way, see the decision record in that same addendum and in [Data model and roles](docs/DATA_MODEL_AND_ROLES.md#status); for what's still ahead, see "Recommended Phase 4 scope" in [Phase 3 hardening](docs/PHASE3_HARDENING.md#recommended-phase-4-scope).

## Technology stack

- Next.js latest stable release with the App Router
- React
- TypeScript in strict mode
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`) for auth, Postgres, and Row Level Security
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
| `npm run check:bundle` | Build, then fail if any route's first-load JS exceeds its documented budget |

## Routes

- `/` — product introduction and the exam setup panel (year level, exam style, subject, question count, timing)
- `/exam` — the exam session: timer, progress, navigation map, flagging, renderers, and submit confirmation
- `/results` — full results: summary, breakdowns, and question-by-question review
- `/showcase` — renderer examples and supported-type catalogue
- `/sign-in` — sign in, sign up, and OAuth entry point (`src/features/auth`)
- `/auth/reset`, `/auth/callback` — password reset and OAuth/email-confirmation callback handling
- `/student`, `/student/assignments`, `/student/engagement`, `/student/learn` — the student dashboard
- `/parent` — read-only dashboard over linked children
- `/teacher`, `/teacher/assignments`, `/teacher/assignments/new`, `/teacher/students/[id]` — the teacher dashboard and assignment tools
- `/admin`, `/admin/analytics`, `/admin/intelligence` — platform and content dashboards

Passing `?seed=<value>` on the home page makes question selection reproducible; the four Playwright exam flows rely on this.

## Project structure

```text
mindmosaic-exam-engine/
├── docs/                         Product and technical documentation
├── e2e/                          Playwright smoke tests
├── public/visuals/               Public visual assets
├── scripts/                      Content-validation utilities
├── supabase/migrations/          Postgres schema, RLS policies, roles, exam/assignment tables
├── src/app/                      App Router pages and global styles
│   ├── api/exam/                 Server-authoritative exam session, submit, and guest-bank routes
│   ├── api/teacher/              Teacher-write endpoints (e.g. assignments)
│   ├── sign-in/, auth/           Sign-in/up, password reset, OAuth callback
│   └── student/, parent/, teacher/, admin/  Role dashboards
├── src/components/               Shared branding and UI components
├── src/content/questions/        Production bank (grade-3/, grade-5/), helpers, summary
├── src/features/auth/            Supabase auth provider, roles, password/social UI
├── src/features/exam-engine/
│   ├── components/               Exam composition, configurator, timer, answer formatting
│   ├── question-renderers/       Question renderer registry and implementations
│   ├── scoring/                  Pure scoring functions and exam-level result builder
│   ├── selection/                Deterministic seeded exam selection
│   ├── state/                    Client-side exam session state
│   ├── types/                    Exam domain types
│   ├── validation/                Exam validation helpers
│   └── visual-renderers/         Visual renderer registry and implementations
├── src/lib/supabase/             Supabase client/server helpers and config
├── src/lib/                      General utilities
├── src/schemas/                  Zod question and visual schemas
├── src/server/exam-bank.ts       Server-only question bank (never imported by client code)
└── src/tests/                    Unit, component, and fixture tests
```

Question rendering, visual rendering, scoring, and page composition are separate concerns. For more detail, see [Architecture](docs/ARCHITECTURE.md), [Data model and roles](docs/DATA_MODEL_AND_ROLES.md), [Question schema](docs/QUESTION_SCHEMA.md), and [Visual schema](docs/VISUAL_SCHEMA.md).

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
npm run check:bundle
npm run build
npm run test:e2e
```

Playwright requires a compatible browser installation. If one is not already available, install it with `npx playwright install` before running the end-to-end suite. The Playwright suite includes an automated accessibility scan (`e2e/accessibility.spec.ts`, axe-core via `@axe-core/playwright`) on the setup, in-progress exam, open submission dialog, and results/review screens.

## Current renderer support

All 14 declared question types and all 10 declared visual types have functional, accessible renderers registered through the renderer registries. Unknown types use an accessible unsupported-type fallback.

## Question bank

The production bank holds exactly 100 original, published questions (47 Grade 3, 53 Grade 5; 72 NAPLAN-style, 28 ICAS-style; 48 with deterministic visuals; 4 writing tasks marked by manual review). `npm run validate:questions` enforces the full contract and `npm run check:answers` independently verifies answer keys against question data. See [Question bank summary](docs/QUESTION_BANK_SUMMARY.md).

## Backend status and what's still ahead

Accounts, roles, server-authoritative scoring, and attempt persistence are implemented, not future work — see the technology stack and routes above, [Data model and roles](docs/DATA_MODEL_AND_ROLES.md), and [Assessment security model](docs/ASSESSMENT_SECURITY_MODEL.md). For a signed-in student, the exam session (selected questions, seed) and the final result are persisted server-side the moment they're created; a browser refresh does not lose them. What is **not** yet persisted is progress *within* an in-progress attempt — answers picked before submission live only in client state, so a refresh mid-attempt still loses unsaved responses. Autosaving in-progress answers is planned; see [Data model and roles](docs/DATA_MODEL_AND_ROLES.md) and "Recommended Phase 4 scope" in [Phase 3 hardening](docs/PHASE3_HARDENING.md#recommended-phase-4-scope) for what's next, including assignment workflows and reporting still to build behind the same domain boundary.

## Originality and copyright

All MindMosaic practice questions, passages, explanations, datasets, and visuals must be original. Never copy or closely paraphrase official NAPLAN or ICAS material, textbooks, websites, commercial question banks, or other protected sources. The terms “NAPLAN-style” and “ICAS-style” describe practice modes only; they do not imply ownership of or affiliation with those assessment providers. See [Content rules](docs/CONTENT_RULES.md).
