# Unfinished Donor Repo Reuse Audit

**Active repo (source of truth):** `mindmosaic-exam-engine` — Next.js App Router, React 19, TypeScript strict, Tailwind v4, Zod, Zustand. Complete local exam engine: 14 question renderers, 10 visual renderers, deterministic seeded selection, authoritative deadline, pure scoring, results/review. No auth, no Supabase, no persistence (by design, current phase).
**Donor repo (reference only):** `C:\Users\vishw\Projects\AssessmentPortals\mindmosaic` — stalled Turborepo/pnpm monorepo (last activity ~10 April 2026).
**Audit date:** 2026-07-11
**Method:** Full donor structure inventory (excluding `.env`, `.git`, `.turbo`, `node_modules`, logs, lockfiles, build outputs, screenshots); deep reads of `packages/types`, all `supabase/functions/_shared` modules, key edge functions, all 11 migrations, `apps/web` routing/guards/stores/auth/exam/dashboard code, UI primitives, and test suites; compared against the active repo's actual `src/`, `docs/`, and scripts.

---

## ⚠️ Corrections to prior assumptions (read first)

1. **The donor is not Next.js.** Despite the folder lineage, the donor's web app (`apps/web`) is **Vite + React 19 + react-router 7 + TanStack Query** inside a Turborepo/pnpm monorepo. Ironically, the *active* repo is the Next.js one. Consequence: donor frontend patterns (route guards, stores) port conceptually but need App-Router adaptation; nothing about the donor argues for or against your current architecture. No Turborepo migration is warranted.
2. **Several expected donor assets do not exist.** There is no `packages/ui` (no AppShell, QuestionMap, ReadinessRing, SkillBar, StatTile, Table, Toast, ErrorBoundary, LoadingState, TopBar, Sidebar), no `packages/engines` (no adaptive.ts / linear.ts / skill.ts / diagnostic.ts / contracts.ts), no `packages/types/src/{content,session,shared,identity}.ts` (single 314-line `index.ts`), no Next `middleware.ts`, no offline/saved indicators, and no `scripts/` at all (no validate-content, import-fable-content, test-scoring, migration-roundtrip, seed-e2e). Sections below mark these "absent".
3. **A stale audit exists elsewhere.** The Vite repo (`MindMosaic-NAPLAN-ICAS`) contains a `docs/UNFINISHED_NEXT_REPO_REUSE_AUDIT.md` referencing `@mm/ui`, `@mm/engines`, 28 migrations, and billing services — none of which exist in this donor. Treat that document as unreliable; this audit supersedes it.
4. **Repo inventory for clarity.** Four MindMosaic repos exist: this active repo; the donor monorepo (this audit); `MindMosaic-NAPLAN-ICAS` (Vite, question factory + 300-question pipeline — a separate, *valuable* sibling, not covered here); and `mindmosaic-platform` (oldest Vite attempt, audited previously as `OLD_REPO_REUSE_AUDIT.md` in the NAPLAN-ICAS repo).

## 1. Executive summary

The donor is a stalled, more ambitious MindMosaic v1: multi-tenant SaaS (family/school/tutor_centre), six roles, a 38-table Postgres schema, a server-authoritative assessment engine as 8 Deno edge functions, weekly learning-plan orchestration, and a teacher assignment engine. Its frontend exam player is far weaker than yours (3 response types, no visuals, an MCQ-renderer UX bug). Its content layer is empty.

What the donor does exceptionally well is exactly what your repo has deliberately deferred: **Supabase auth and safe persistence.** The transferable gold, in priority order:

1. **Answer security pattern** — server strips `correct`/`tolerance`/`correct_order`/`correct_pairs` before items reach clients (`_shared/item-utils.ts`), backed by RLS that denies students direct reads of answer-bearing tables (migration `003_item_security.sql`) and an RLS test proving it. Your question bank currently lives client-side with answer keys in the bundle — acceptable now, a must-fix pattern the day questions or results move to Supabase.
2. **Persistence hardening** — idempotency-key table with replay/in-flight/mismatch semantics, `lock_token` + optimistic `version` concurrency on session updates, canonical score recomputation from response rows at submit (never trusting counters), and client-side conflict→resume handling. This is the blueprint for persisting your `ExamState` sessions safely.
3. **Skill-mastery algorithm** — EWMA with attempts-based dynamic learning rate, confidence tiers, trend detection, streaks, capped history (`_shared/skill-mastery.ts`, pure logic). Your engine already computes per-skill breakdowns per exam; this adds the longitudinal layer the parent dashboard needs.
4. **Auth frontend flow** — Zustand auth store bootstrapped from `getSession()` + `onAuthStateChange` with a `loading` flag; guard components with `?next=` redirect; complete sign-in/sign-up/password-reset/OAuth-callback UX; `callFunction` wrapper with JWT attach and exponential-backoff retry.
5. **RLS test harness** — run SQL as a specific authenticated user and assert visibility (`tests/helpers/local-supabase.ts`), the missing test capability for your Supabase phase.

Everything else — multi-tenancy, teacher/assignments, intelligence/orchestration layers, the donor's thin item DTOs and exam UI — is reference-only or out of scope.

## 2. What this unfinished repo appears to be

Per its bundled specs (`mindmosaic-spec-v4.3.md`, `mindmosaic-backend-arch-v1.2.md`, April 2026), a "Learning Intelligence Operating System" for K-12 APAC: nine-layer intelligence stack, multi-framework, multi-tenant SaaS. Roughly nine build-days landed: 11 migrations (schema + RLS + assignment engine + observability), 8 edge functions (auth-register, auth-ensure-profile, create-session, respond, submit, log-event, orchestration-plan-current, intelligence-learner-profile) sharing a hardened `_shared` library, and a React web app (landing suite, auth flows, onboarding, student dashboard, 3-type exam player, results, teacher assignment workspace). Development stopped ~10 April 2026. No content pipeline, no visual system, no question bank.

## 3. Current active repo strengths (keep as-is)

Complete, tested, local-first exam engine: 14 question renderers and 10 deterministic visual renderers behind type-keyed registries; Zod-validated structured content with lifecycle (`draft/reviewed/published/rejected`) and required alt text; a validated 100-question production bank; deterministic seeded selection; authoritative absolute-deadline timing with injected clock; pure scoring with manual-review handling; full results with type/subject/skill/difficulty breakdowns and question-by-question review; navigation, flagging, submit confirmation; clean UI kit (Badge, Button, Card, EmptyState, ErrorState, Input, ProgressBar, Select); vitest + Playwright coverage; content validation scripts (`validate:questions`, `check:answers`). Architecture doc discipline (`docs/ARCHITECTURE.md` et al.) is strong. Nothing in the donor should displace any of this.

## 4. Unfinished repo strengths (worth harvesting)

- Edge-function hygiene: typed error envelope with `trace_id` and error catalog (`_shared/response.ts`), Zod request validation, structured observability logging, correct CORS/preflight handling.
- Idempotency subsystem (`api_idempotency_key` table + `checkIdempotency`/`completeIdempotency`/`failIdempotency`; client sends `Idempotency-Key: crypto.randomUUID()` per mutation; failed keys are released on every early-return path).
- Concurrency: per-session `lock_token` + optimistic `version` checked on every update; explicit `VERSION_CONFLICT` and `ACTIVE_SESSION_EXISTS` contracts the client handles by rehydrating.
- Answer security: `stripCorrectAnswers()` + student-excluding RLS + a test that proves students read zero rows from item tables.
- Skill mastery: EWMA + confidence + trend + streaks + bounded history, batched to 2 DB round trips.
- Auth: server-side registration function, self-healing `auth-ensure-profile`, JWT-metadata fallback functions (migration 012), and a polished client auth flow including password reset and OAuth callback.
- Tests: real RLS tests via a run-SQL-as-user harness; integration tests against local Supabase; Playwright journey specs.

## 5. Major architecture differences

| Dimension | Active repo | Donor |
|---|---|---|
| Framework | Next.js App Router (4 routes), React 19 | Turborepo monorepo; Vite + react-router 7 SPA, React 19 |
| Engine location | Client-side, pure functions, deterministic | Server-authoritative edge functions; thin client state machine |
| Question model | Rich Zod schema: 14 types, 10 visual types, lifecycle, alt text | Thin `ItemDTO`: 3 response types, no visuals, no lifecycle |
| Content | 100-question validated local bank + scripts | None (46-line SQL seed) |
| Timing | Absolute deadline, injected clock, tested | `time_limit_ms` passthrough; no authoritative client deadline |
| Auth/persistence | None (deferred by design) | Supabase auth + 38-table schema + RLS + 8 edge functions |
| Tenancy | Single family (future) | Multi-tenant, 6 roles, teacher/assignment/intelligence layers |
| Secrets | Clean | **`.env` at repo root; keys may also appear in committed logs** |

Verdict: architectures are complementary, not competing. Keep the local-first engine authoritative for now; adopt the donor's persistence/security patterns when you build the Supabase phase. Do not adopt Turborepo — a single Next.js app doesn't need it.

## 6. Reuse now (P0)

The active repo's current phase needs nothing structural from the donor. P0 items are small, pure, and preparatory:

1. **`checkCorrectness` edge-case guard** (`_shared/item-utils.ts`) — the rule "a string answer against a multi-answer key is always wrong; MCQ match requires a single-element key" is a nice hardening idea to cross-check against your `question-scorers.ts` multiple-choice/multiple-select handling. Pure comparison logic; verify yours covers the same edge, adopt if not.
2. **`callWithRetry` + `FunctionError`** (`apps/web/src/lib/supabase.ts`) — dependency-free exponential-backoff retry for transient errors (429/5xx/network). Park it in `src/lib/` now; it's the first brick of the Supabase phase and useful for any future fetch.
3. **Skeleton primitive** (`apps/web/src/components/ui/Skeleton.tsx`, 52 lines) — the one UI primitive your kit lacks (you have EmptyState/ErrorState already, and better). Tailwind-only; both repos are Tailwind v4, so it ports cleanly.
4. **Auth validation module** (`features/auth/lib/validation.ts`) — Zod schemas for email/password/reset forms; framework-agnostic, ready for your future auth pages.

Absent-from-donor note: QuestionMap, Timer, LoadingState, ErrorBoundary, saved/offline indicators do not exist in this donor — and your engine already has a superior timer and navigation. No UI porting beyond Skeleton is justified.

## 7. Adapt soon (P1)

These assume you're starting the Supabase phase (goals 2–3: parent visibility, safe auth + persistence):

1. **Supabase Auth foundation** — donor's `authStore` bootstrap pattern (getSession → onAuthStateChange, `loading` flag, resilient failure path), sign-in/sign-up/reset/callback pages, and `?next=`-preserving guard logic. Adaptation: implement guards as a client `RequireAuth` wrapper in App Router layouts (donor's react-router `<Navigate>` becomes `useRouter().replace`), or Next middleware for coarse route protection. This is the recommended next step (§20).
2. **Profile schema + anti-escalation RLS** — do *not* use the donor's multi-tenant `user_profile`; use the pattern from the **NAPLAN-ICAS sibling repo's** migration `20260101000001_auth_profiles.sql` (SECURITY DEFINER `handle_new_user()` trigger creating a `parent` profile; policies preventing role self-escalation), which is single-family-sized and already battle-reviewed. Donor's contribution: the `auth-ensure-profile` self-healing recovery concept and migration 012's claim-fallback defensiveness.
3. **Session persistence design** — map your `ExamState` (`sessionId`, `seed`, `config`, `responses`, `flaggedQuestionIds`, `deadlineAt`, `result`) onto a donor-style pair: `exam_sessions` (status, seed, config, version, started/submitted timestamps) + `exam_responses` (per-question rows). Adopt: optimistic `version` column, client `Idempotency-Key` per write, recompute the persisted summary from response rows at submit (your `buildExamResult` already is that pure function — persist its inputs, re-derive its outputs).
4. **Skill-mastery algorithm** (`_shared/skill-mastery.ts`) — port `computeLearningRate` (EWMA), `computeConfidence`, `computeTrend`, streaks, capped 25-entry history as pure TS into a new `src/features/mastery/` module with unit tests, fed by your existing per-skill exam breakdowns. Recalibrate thresholds for a 2-child, low-volume setting (confidence tiers assume more attempts).
5. **RLS test harness** (`tests/helpers/local-supabase.ts` + `tests/security/rls.test.ts`) — adapt to your table names the moment your first migration lands; make "student/parent can only see own rows" a tested invariant from day one.
6. **Idempotency module** (`_shared/idempotency.ts` + `api_idempotency_key` table) — simplified single-family version (drop `tenant_id`); pairs with P1.3.

## 8. Adapt later (P2)

1. **Server-authoritative engine** (`create-session`/`respond`/`submit`, ~965 lines) — full blueprint for moving scoring server-side if anti-cheating or multi-device resume ever matters. Your deterministic seed model actually makes this easier later (server stores seed + config; client replays selection). Not needed while the kids use one device at home.
2. **Answer-hiding RLS** (migration `003` pattern) — becomes real work only when questions move from bundled TS modules to Supabase rows: split answer keys/explanations into a restricted table or serve via sanitising view + `stripCorrectAnswers`-style edge function. Design for it in the content-table schema when you get there.
3. **Observability** (`_shared/observability.ts` + migration 010) — trace-id structured logging to an events table once edge functions exist.
4. **Weekly plan concept** (`orchestration-plan-current` + `RecommendationItemDTO`: skill, priority, rationale_text, daily minutes, completed) — excellent shape for a parent-dashboard "this week's focus" card. Rebuild client-side from your mastery data; skip the plan/revision/recommendation tables.
5. **Parent dashboard widgets** (`MasteryRow`, `StatsBar`, `PlanProgressCard`, `PriorityBadge`, `SessionRow`) — good layouts, wrong DTOs; rebuild against your types when the dashboard is built.
6. **`auth-register` edge function** — programmatic creation of the kids' accounts with server-assigned roles, when you tire of manual setup.

## 9. Reference only (P3)

1. `docs/mindmosaic-backend-arch-v1.2.md` — the best document in the donor: FK discipline, full RLS catalog, idempotency contract, DTO appendix, retention rules. Read before writing your first migration; don't import its scale.
2. `docs/mindmosaic-spec-v4.3.md` — long-horizon vision (intelligence stack, readiness prediction); a scope-creep hazard for an MVP serving two children.
3. `packages/types/src/index.ts` — DTO naming conventions (`TerminationDTO`, `Navigation` capability flags `can_go_back/can_skip/can_flag`) worth echoing in your future session DTOs; the item model itself is beneath your schema.
4. Playwright journey specs + `tests/e2e/helpers.ts` — auth-session fixture handling for e2e once you have auth.
5. Frontend guard tests (`tests/frontend/app-auth-guards.test.tsx`) — template for testing your future route protection.
6. Donor `CLAUDE.md` — monorepo agent-operating conventions; skim only.
7. `sessionStore.ts` phase machine + conflict-resume — your `exam-store.ts` is already the stronger store; borrow only the `ACTIVE_SESSION_EXISTS → rehydrate` idea when sessions become server-backed.

## 10. Do not reuse

1. **Secrets/artefacts:** `.env` (repo root), `err.txt`, `out.txt`, `*.log` (several contain full function traces), `inspect*.json`, `audit-*.png`, `bun.lock`, `pnpm-lock.yaml`, `.turbo/`, `.pnpm-store/`, `test-results/`, `day9` bundles. If the donor's Supabase project is still live, rotate its keys — this folder has been copied around.
2. **Multi-tenant schema** — `tenant`, `subscription`, `class_group`, `feature_flag`, `auth_tenant_id()` machinery, 38 tables. Wrong scale by an order of magnitude.
3. **Teacher/assignment engine** (migration 011, `features/teacher/*`, Assignment DTO family) and **intelligence/orchestration layers** (learner profile, learning_velocity, behaviour_profile, misconception/repair tables) — out of MVP scope per your guardrails.
4. **Donor `ItemDTO` + `ItemRenderer`** — 3 response types, no visuals, MCQ rendered as multi-select-by-default (UX bug). Must not influence your question schema or renderers.
5. **Turborepo/pnpm structure** — no near-term benefit for one Next.js app.
6. **Landing-page suite** (16 components) — marketing pages for a SaaS; your app is a private family portal.
7. **Donor UI kit beyond Skeleton** — yours is equivalent or better and already App-Router-native.

## 11. File-by-file reuse table

| Donor repo file | Current repo target | Recommendation | Reason | Risk | Priority |
|---|---|---|---|---|---|
| `supabase/functions/_shared/item-utils.ts` (`checkCorrectness` guard) | `src/features/exam-engine/scoring/question-scorers.ts` (cross-check) | Adapt idea | Single-vs-multi answer-key edge case | Low | P0 |
| `apps/web/src/lib/supabase.ts` (`callWithRetry`, `FunctionError`) | `src/lib/retry.ts` (new) | Adapt | Backoff for all future remote calls | Low | P0 |
| `apps/web/src/components/ui/Skeleton.tsx` | `src/components/ui/Skeleton.tsx` | Reuse | Missing primitive; both Tailwind v4 | Low | P0 |
| `apps/web/src/features/auth/lib/validation.ts` | `src/features/auth/validation.ts` (new) | Reuse | Zod form schemas, framework-free | Low | P0 |
| `apps/web/src/store/authStore.ts` | `src/features/auth/auth-store.ts` (new) | Adapt | Bootstrap + loading-flag pattern | Low | P1 |
| `apps/web/src/App.tsx` (RequireAuth/RequireProfile, `?next=`) | client guard in App Router layout / `middleware.ts` | Adapt | Route protection pattern | Med (router paradigm shift) | P1 |
| `apps/web/src/features/auth/{pages,components}` (sign-in/up, reset, callback) | `src/app/(auth)/*` pages | Adapt | Complete auth UX | Med (react-router → App Router) | P1 |
| NAPLAN-ICAS repo: `supabase/migrations/20260101000001_auth_profiles.sql` | first auth migration | Adapt | Right-sized trigger + anti-escalation RLS | Low | P1 |
| `supabase/functions/_shared/skill-mastery.ts` | `src/features/mastery/compute-mastery.ts` (new, pure) | Adapt | EWMA/confidence/trend/streaks | Low-Med (recalibrate) | P1 |
| `supabase/functions/_shared/idempotency.ts` + `api_idempotency_key` DDL | persistence phase module + migration | Adapt (drop tenant) | Safe retryable writes | Med | P1 |
| `supabase/functions/_shared/scoring.ts` | submit-time summary recompute | Adapt concept | Canonical recompute from rows (your `buildExamResult` already fits) | Low | P1 |
| `tests/helpers/local-supabase.ts` + `tests/security/rls.test.ts` | `src/tests/security/` | Adapt | Prove RLS invariants | Low | P1 |
| `supabase/functions/{create-session,respond,submit}` | future server engine | Reference → adapt later | Server-authoritative blueprint | High | P2 |
| `supabase/migrations/003_item_security.sql` | future content-table migration | Adapt pattern | Answer hiding once content is remote | Med | P2 |
| `supabase/functions/_shared/{response,observability}.ts` | future edge functions | Adapt later | Error envelope + tracing | Low | P2 |
| `supabase/functions/auth-register/index.ts`, `auth-ensure-profile/index.ts` | account provisioning | Adapt later | Kid-account creation, self-healing bootstrap | Med | P2 |
| `orchestration-plan-current` + `_shared/learning-plan.ts` | parent dashboard "focus" card | Reference (rebuild) | Weekly recommendation shape | Med | P2 |
| `apps/web/src/features/dashboard/components/*` | future parent dashboard | Rebuild | Layouts good, DTOs wrong | Low | P2 |
| `packages/types/src/index.ts` | future session DTO naming | Reference only | Termination/Navigation conventions | — | P3 |
| `docs/mindmosaic-backend-arch-v1.2.md`, `docs/mindmosaic-spec-v4.3.md` | pre-migration reading | Reference only | Design discipline; scope hazard | — | P3 |
| `tests/e2e/*.spec.ts`, `tests/frontend/app-auth-guards.test.tsx` | future e2e/guard tests | Reference only | Test structure | — | P3 |
| `supabase/migrations/012_auth_bootstrap_recovery.sql` | — | Reference only | Claim-fallback defensiveness | — | P3 |
| `.env`, logs, lockfiles, `.turbo`, screenshots, `test-results/` | — | **Do not reuse** | Secrets/artefacts | — | — |
| Migration 001 (multi-tenant), 011 (assignments), teacher/intelligence features, landing suite, `ItemRenderer.tsx`, donor `ItemDTO` | — | **Do not reuse** | Wrong scale/scope; weaker than yours | — | — |

## 12. Supabase / auth reuse notes

- **User modelling for your MVP:** one `profiles` row per auth user (you + your wife = `parent`; optionally kid logins = `student`), plus `student_profiles` (children as data rows owned by a parent — the NAPLAN-ICAS sibling's model). This avoids the donor's `parent_student_link`/tenant complexity entirely while matching goal 2 (parent sees history). Decide early whether kids get real auth accounts or select a profile after a parent unlocks the app; the schema above supports both.
- **Trigger-based profile creation** (sibling repo's `handle_new_user()`, SECURITY DEFINER, server-assigned role) is safer than donor's client-initiated bootstrap; keep donor's `auth-ensure-profile` idea as a recovery path only.
- **RLS invariants to enforce and test from day one:** parents read/write only their own profile and their own children's rows; students read/write only their own sessions/responses; no client can set or change `role`. Donor's `USING (true)` mistake in migration 001 (fixed by 003) is the cautionary tale.
- **Do not copy donor migrations** — every table carries `tenant_id` and custom claim helpers. Pattern-port only.
- **JWT claims:** donor stores role/tenant in `app_metadata`. You won't need custom claims if RLS joins through `profiles` — simpler and adequate at family scale.

## 13. UI / component reuse notes

Your UI kit already covers Badge, Button, Card, EmptyState, ErrorState, Input, ProgressBar, Select — donor equivalents add nothing. Port `Skeleton` (only gap), and skim donor's `system.ts` token-file idea (typography/layout class constants) if you want to centralise your Tailwind patterns. Donor has no ErrorBoundary/Toast/Table/QuestionMap/AppShell — if you ever want an ErrorBoundary or QuestionMap donor, the `mindmosaic-platform` repo (per the older audit) has both. Both repos are Tailwind v4, so class-level compatibility is good; donor's custom `shadow-saas-*` tokens would need theme definitions brought along or substituted.

## 14. Assessment engine reuse notes

No engine package exists in the donor; its "engine" is the create-session/respond/submit function trio (fixed/diagnostic-seed selection, linear progression, termination reasons). Your client engine is superior in every dimension that matters to you (types, visuals, determinism, timing, review). Worth echoing in your types when sessions become remote: the `TerminationDTO` reason enum (`completed | time_up | abandoned | mastery_reached | max_items` — yours currently models submission reasons; the donor's broader enum anticipates adaptive modes) and `Navigation` capability flags as per-mode config (`can_go_back/can_skip/can_flag` — you hardcode these behaviours today). The donor's adaptive/diagnostic machinery is schema-only vapour; nothing to port.

## 15. Session / results persistence reuse notes

Donor write path per answer: idempotency check → session fetch + `lock_token` validation → insert response row → `version`-checked optimistic update → telemetry insert → idempotency complete. At submit: recompute score from all rows → batch-upsert skill mastery → mark submitted. Recommended phasing for your repo: (1) persist completed-exam results only (one write of `seed`+`config`+`responses`+`result` per exam — simple, idempotent, enough for parent history); (2) add per-response incremental saves with `version` + idempotency for crash-resume; (3) add mastery upserts at submit. Your deterministic seed is an asset here: storing `seed`+`config` lets you re-derive the full question list on any device without persisting question payloads. Donor telemetry (time-to-answer, answer changes) is a P2 nicety with real parent-insight value.

## 16. Content validation / import reuse notes

Nothing to harvest — the donor has no scripts, no content pipeline, no bank. Your `validate:questions`/`check:answers` scripts and the NAPLAN-ICAS sibling's question factory (generate → validate → answer-check → review-queue → approve → compile) are the assets in this area; a future audit of that sibling for content-pipeline reuse into this repo would be higher-yield than anything here. One donor idea to remember for remote content: the `item`/`item_version` split for post-publication versioning.

## 17. Test reuse notes

Adopt-when-relevant: the local-Supabase SQL-as-user harness and RLS assertions (the one capability you lack, needed at first migration); donor's guard tests as a template for route-protection tests; Playwright auth-session fixtures for e2e once auth exists. Your existing unit/component/e2e discipline (renderer tests, deadline tests, store tests, exam-flow specs) is already stronger than the donor's frontend suite — keep your patterns for all pure logic.

## 18. Security / privacy risks

1. **Donor `.env` sits unignored at its root, and committed logs (`err.txt`, `supabase-functions.err.log`, ~2 MB of web-audit logs) may embed keys/URLs.** Never copy these files; rotate the donor project's Supabase keys if it still exists.
2. **Answer keys in the client bundle** — fine for the current local phase; before any remote content or a deployed URL your kids share with friends, adopt the §8.2 answer-hiding pattern.
3. **Role escalation** — enforce role server-side (trigger) and forbid client role writes via RLS, as in the sibling repo's migration 002; test it with the ported harness.
4. **Children's privacy** — keep `student_profiles` to display names + year level; no emails for kids unless they truly need logins. If you later adopt telemetry, keep it keyed to internal IDs only.
5. **Guard-redirect hygiene** — when porting the `?next=` pattern, validate the target is a same-origin relative path (donor does not validate this).

## 19. Recommended implementation order

1. **Supabase Auth foundation** (P1.1 + P1.2 + P0.2/P0.4) — project setup, envs, auth store, sign-in/up/reset pages, `profiles` + `student_profiles` migration with trigger + RLS. ← *next step, prompt below*
2. Route protection in App Router + guard tests (rest of P1.1, §18.5).
3. RLS test harness ported and green against migration 1 (P1.5).
4. Exam-result persistence, phase 1: one idempotent write per completed exam; parent can list history (P1.3 simplified, P1.6).
5. Skill-mastery module + parent dashboard v1 (P1.4, P2.5, P2.4 card).
6. Later: incremental response persistence + resume, telemetry, remote content with answer-hiding, server-authoritative evaluation (P2).

## 20. Recommended next Claude Code prompt

One coherent step: **Supabase Auth foundation**. It unblocks every persistence goal, touches no engine code, and is where the donor's patterns pay off immediately.

```text
You are working in the mindmosaic-exam-engine repo (Next.js App Router, React 19, TypeScript strict, Tailwind v4, Zod, Zustand, vitest + Playwright). The repo is the source of truth: do not modify the exam engine (src/features/exam-engine), question schemas, content, scoring, or renderers. Do not add teacher/admin/billing/multi-tenant scope.

Task: implement the Supabase Auth foundation, guided by docs/UNFINISHED_NEXT_REPO_REUSE_AUDIT.md §7 and §12. Adapt donor patterns; do not copy donor code wholesale, and never copy anything from any .env or log file.

Scope:
1. Add @supabase/supabase-js. Create src/lib/supabase/client.ts reading NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, throwing a clear error if missing. Add .env.example (placeholders only) and ensure .env* stays gitignored.
2. Create supabase/migrations/0001_auth_profiles.sql: `profiles` (id references auth.users, display_name, role text check in ('parent','student') default 'parent', created_at/updated_at) and `student_profiles` (id, parent_id references profiles, display_name, year_level int check in (3,5), created_at). SECURITY DEFINER handle_new_user() trigger creates a 'parent' profile on signup with role set server-side. RLS: parents select/update own profile only; role changes from the client are impossible (insert/update policies pin role='parent'); parents CRUD only their own student_profiles; students (future) read only their own profile. Enable RLS on both tables.
3. Create src/features/auth/: auth-store.ts (Zustand: session, user, loading; initialise from supabase.auth.getSession(), subscribe once to onAuthStateChange, set loading=false even on getSession() rejection; signOut with local scope) and validation.ts (Zod schemas for email/password/reset — adapt from donor features/auth/lib/validation.ts).
4. App Router pages under src/app/(auth)/: /login (sign-in + sign-up toggle), /reset-password (request + update modes). Client components using the existing UI kit (Button, Input, Card, ErrorState); show inline Zod errors and Supabase error messages; loading states on submit.
5. Route protection: a client <RequireAuth> wrapper used by a new (protected) layout group wrapping /exam and /results. While loading, render a centred Skeleton/loading card; if unauthenticated, redirect to /login?next=<encoded pathname+search>; after successful sign-in, honour next only if it is a same-origin relative path starting with '/' (reject absolute URLs and '//'). The home page (/) and /showcase stay public; / shows a Sign in link when signed out and the user's display name + sign-out when signed in.
6. Tests (vitest, matching existing patterns in src/tests/): auth-store bootstrap (loading resolves on success and on getSession failure); validation schemas; RequireAuth redirects unauthenticated users with the correct next param and renders children when authenticated; malicious next values (https://evil.com, //evil.com) are rejected. Mock @supabase/supabase-js — no live network in tests.
7. Run typecheck, lint, and the full test suite; fix regressions. Do not run migrations against any live project; the SQL file is the deliverable.

Report: list changed files, test results, and any decisions needing my review (especially RLS policy wording).
```

---

*End of audit. No code changes were made to any repo. Companion documents: `OLD_REPO_REUSE_AUDIT.md` (mindmosaic-platform donor) and the question-factory pipeline in the MindMosaic-NAPLAN-ICAS repo, which merits its own reuse audit for the content phase.*
