# Current State and Scope Map

## Repository snapshot

| Item | Audited value |
| --- | --- |
| Root | `C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine` |
| Branch | `feat/promote-grade5-icas-dt-and-spelling` |
| HEAD | `abc9c29c8d1d1abf58645ae738ebc1683df7ab69` |
| Default branch | `origin/main` |
| Runtime | Node `v24.15.0`, npm `11.12.1`, Git `2.52.0.windows.1` |
| Framework | Next.js App Router `16.2.10`, React, strict TypeScript, Tailwind, Zod, Zustand, Supabase, Stripe |
| Starting worktree | Dirty before audit; modified/untracked content-status, manual-question and scratchpad work was preserved |
| Inventory | 904 `src` files, 743 `content` files, 68 docs, 31 E2E specs, 25 scripts, 9 Supabase files, 243 Vitest files |

Environment files `.env.local` and `.env.e2e.local` exist and are ignored. Values were not opened or printed. Identified variable types include public Supabase URL/anon key, server-only Supabase service-role key, Stripe secret/webhook/public/price settings, billing/showcase flags and test ports.

## Source-of-truth precedence

| Precedence | Source | Use in this audit |
| ---: | --- | --- |
| 1 | Effective code, migrations, imported banks and deterministic runtime/build output | Implementation truth |
| 2 | Current tests and CI workflows | Enforced behaviour, subject to test-quality review |
| 3 | Current product/architecture/security/content documents | Intended current scope; claims require verification |
| 4 | README and route/status summaries | Orientation only; materially stale in this checkout |
| 5 | Historical reports, mock-ups and donor-repository audits | Legacy/reference; not proof of current behaviour |
| 6 | Long-term K–12/APAC north star supplied for this audit | Future direction; not a current-delivery requirement |

## Architecture and trust boundaries

The app uses App Router server components for role dashboards, client components for the assessment runner and interactive views, Zustand for in-browser exam state, Zod at most route/domain boundaries, pure scoring functions outside React, and deterministic HTML/SVG visual renderers. Supabase Auth and PostgREST form the identity/data boundary; Stripe handles payment orchestration; OAuth providers are Google, Apple, Microsoft/Azure and Facebook.

The intended assessment lifecycle is:

`auth/guest setup → bank resolution → deterministic selection → candidate-question projection → response capture/autosave → server submit → pure scoring → attempt persistence → result/review → learner/parent/admin aggregates → optional teacher manual mark`

The critical mismatch is that authenticated PostgREST access can write several tables directly. Route-handler checks therefore are not the only enforcement point, despite documentation treating them as authoritative.

## Roles and authorised surfaces

| Role/state | Principal surfaces | Intended data scope |
| --- | --- | --- |
| Guest | marketing, catalogue, exam picker, `/exam`, `/results` | Browser-only session; public static bank |
| Student | `/student*`, signed-in exam APIs | Own sessions, responses, attempts and assignments |
| Parent | `/parent*`, `/billing`, child provisioning | Own profile/subscription and linked children read/manage scope |
| Teacher | `/teacher*`, assignment/marking APIs | Own classes, roster, assigned work and class-student attempts |
| Admin | `/admin*` | Aggregate platform/content analytics; operations is mock-only |

## Authoritative route map

The build emitted 53 static pages plus dynamic role/API routes. Public groups:

- Marketing/legal: `/`, `/about`, `/accessibility`, `/assessment-disclaimer`, `/assessments`, `/contact`, `/exam-preparation`, `/help`, `/learn`, `/methodology`, `/parent-guide`, `/pricing`, `/privacy`, `/resources`, `/student-tips`, `/terms`.
- Auth: `/sign-in`, `/sign-up`, `/student-sign-in`, `/auth/callback`, `/auth/confirm`, `/auth/reset`.
- Assessment: `/practice`, `/practice/[program]`, `/practice/session`, `/exams`, `/exams/[patternId]`, `/exam`, `/results`.
- Role trees: `/student` plus assignments/engagement/exam-preparation/learn; `/parent` plus children; `/teacher` plus analytics/assignments/marking/students; `/admin` plus analytics/intelligence/operations.
- Other: `/billing`, `/showcase`, development-only `/dev/routes` (returns not-found in production), icons/manifest/robots/sitemap/social images.
- APIs: guest bank; session create/active/autosave/submit; parent children; teacher assignments/marking; Stripe checkout/status/customer portal/invoices/payment method/cancel/resume/webhook.

## Data ownership map

`auth.users 1—1 profiles`; `parent_children` links parent to child; `classes` belongs to a teacher; `class_students` links students; `exam_sessions` belongs to a student; `exam_responses` is the mutable in-progress row; `exam_attempts` is intended immutable final evidence; `assignments` belongs to a class; `assignment_students` links work/status/attempt; `essay_marks` links teacher feedback to an attempt/question; `subscriptions` belongs to a parent. Aggregate views power admin/teacher/parent reporting.

## Question-system map

- Declared question types: `multiple_choice`, `multiple_select`, `number_entry`, `fill_blank`, `dropdown`, `true_false`, `matching`, `ordering`, `short_answer`, `reading_comprehension`, `essay`, `label_diagram`, `hotspot`, `drag_drop`.
- Declared visuals: `bar_chart`, `line_graph`, `pie_chart`, `table`, `number_line`, `geometry_shape`, `coordinate_grid`, `fraction_model`, `labelled_svg`, `hotspot_svg`.
- Current validated `questionBank`: 965 questions, 164 visuals, 4 manual-review; Years 3/5; NAPLAN-style and ICAS-style; seven subject buckets including Digital Technologies, science, spelling and writing.
- Published aggregate examined by the extended correctness command: 1,253 questions. The guest `practice` bank additionally combines curated/published/factory sources and repeats content across response fields.

## Current versus future scope

| Capability | Classification | Evidence |
| --- | --- | --- |
| Years 3/5 NAPLAN-style and ICAS-style practice | Implemented and verified | Banks, patterns, routes, tests and build |
| Fixed-path full-length practice | Implemented and verified | Pattern registry and explicit adaptation flags |
| True NAPLAN adaptive simulation | Future scope — not a current defect | Official NAPLAN is tailored; repository explicitly calls its path fixed |
| Audio-dictation spelling | Future scope — not a current defect | Explicit `text_only_spelling` disclosure/backlog |
| Student autosave/resume | Implemented but defective or incomplete | Implemented; active-session edge case and persistence-boundary issues |
| Teacher assignment workflow | Implemented but defective or incomplete | Creation/read screens exist; no student start/completion path |
| Teacher essay marking | Implemented but defective or incomplete | Mark storage exists; results never consume it |
| Parent progress insights | Implemented and verified with bounded caveat | Real attempt-derived summaries; manual marks remain disconnected |
| Billing | Contradictory or ambiguous scope | Stripe code exists, but availability is roadmap and legal/prices are placeholders |
| Australian Curriculum, AMC, Singapore Maths, selective entry, K–12 | Future scope — not current defects | Catalogue marks these in development; hero/metadata overstate present breadth |
| Admin operations queue | Rejected, legacy or superseded | Explicit mock-data console without a backend |

## Deployment differences

The build uses `.env.local` when present; CI uses fake Stripe test values and no real Supabase secret for the core job. RLS tests start local Supabase separately; E2E installs Chromium separately. Billing availability is a client-safe maintained literal rather than derived from deployment configuration. Production CDN compression, headers, SMTP, branch protection and required-check configuration were not externally verified.
