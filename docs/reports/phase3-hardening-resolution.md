# Phase 3 Hardening — Resolution Matrix

Derived from `docs/PHASE3_HARDENING.md` (the completed hardening record, merged at `bea1b88`) and `docs/ASSESSMENT_SECURITY_MODEL.md`, cross-checked against the repository implementation and test suite. This matrix satisfies the Mission 0 audit-resolution gate: it records, per finding, the status, evidence, tests, and justification. No implementation work was redone.

Statuses: **fixed** · **mitigated** (risk reduced, residual documented) · **deferred** (not implemented, justified).

## P0 findings

None were reported in the Phase 3 audit. **No unresolved P0 findings exist.**

## P1 findings

| # | Finding | Status | Evidence | Tests | Justification / residual |
| --- | --- | --- | --- | --- | --- |
| P1-1 | Timed exams relied on UI timer ticks; late responses/submissions could slip through | fixed | `src/features/exam-engine/state/deadline.ts` (`deadlineAt` epoch-ms authority; exclusive-boundary convention); `setResponse`/`submitExam` check the clock directly; late `user_submitted` recorded as `timer_expired`; submission timestamp clamped to deadline; duplicate finalisation structurally impossible via status guard + synchronous `set()` | `deadline.ts` unit tests; `exam-store.test.ts` describe block (accept at deadline−1ms, reject at exact deadline, reject with no tick, late-submit override, time-taken cap, untimed non-interference) | — |
| P1-2 | Submitted `/exam` stayed in history; Back re-triggered an unbounded redirect loop | fixed | `router.replace("/results")` instead of `push`; bounded retry via `useBoundedNavigation`; explicit already-submitted state with manual results link | `navigation-lifecycle.test.tsx` (exactly one `replace`, no `push`, capped retries); Playwright `results back navigation does not loop back into the exam` | — |
| P1-3 | Ordering questions displayed the authored (often correct) order with no response recorded | fixed | `question-renderers/ordering-utils.ts` `deriveInitialOrder` rotate-by-one (pure, no answer-key access); verified non-matching for all 6 production ordering questions | Unit tests (fixed vectors, purity); content guard `ordering-initial-order.test.ts` (fails on future coincidental match); component tests (deterministic non-canonical initial order, unanswered until touched) | — |
| P1-4 | Blank essay scored `manual_review`, inflating pending-marks counts | fixed | `ScoredResponse` distinguishes `requiresManualMarking` (type-level) from `manualReviewRequired` (response-level); blank essay → `unanswered` | Parametrised unit tests at scorer and `buildExamResult` level incl. mixed multi-essay case and denominator invariance | — |
| P1-5 | Answer keys ship client-side; client scores authoritatively | mitigated | Candidate-safe DTO boundary: `CandidateQuestion`/`AuthoringQuestion`/`ReviewQuestion`, `toCandidateQuestion` sanitiser, `AssessmentScoringService` interface + `LocalPracticeScoringService`, `reviewQuestions` null until submission (see `docs/ASSESSMENT_SECURITY_MODEL.md`) | DTO/sanitiser/scoring-service tests referenced in the security model | Residual: bank remains in the JS bundle — explicitly documented, not claimed tamper-resistant. Product constraint for this phase excludes a server. Full mitigation is Phase 4 server-authoritative scoring, which the DTO boundary was built to make cheap. Acceptable for a local-first practice tool used by the developer's family. |
| P1-6 | Submission "dialog" was a styled div — no focus trap, background interactive | fixed | Native `<dialog>` + `showModal()`; focus restoration; non-destructive default focus; single-effect listener fix for the synchronous-close bug found during the work | Component tests (open/close, initial focus, backdrop vs content click, focus restoration, confirm-once) + jsdom polyfill; Playwright keyboard/Tab-containment/Escape/background-inert coverage | — |

**No unresolved P1 findings.** P1-5 is a documented mitigation with an explicit Phase 4 path, permitted by the gate's `mitigated` status.

## P2 findings

| # | Finding | Status | Evidence / tests | Justification / residual |
| --- | --- | --- | --- | --- |
| P2-1 | Full exam always 90 min regardless of question count | fixed | `selection-config.ts` `durationSecondsFor` sums authored `estimatedTimeSeconds` × 1.5, minute-rounded, clamped [10,180]; setup preview uses the same eligible set | — |
| P2-2 | Two unbounded `setInterval` retry loops; Start button double-fire | fixed | `use-bounded-navigation.ts` (capped attempts, stop on unmount/condition/budget); `isStarting` guard; recoverable error + manual retry | — |
| P2-3 | Cleared fill-blank still counted as answered | fixed | `types/response-utils.ts` blank-value helpers; `isUnanswered` delegates; `FillBlankRenderer` deletes cleared keys; unit + component + Playwright coverage | — |
| P2-4 | Reading passages and label/hotspot diagrams rendered twice | fixed | `TYPES_OWNING_STIMULUS`/`TYPES_OWNING_VISUALS` explicit ownership in `ExamQuestion.tsx`; DOM-count tests (`exam-question-ownership.test.tsx`) | — |
| P2-5 | Schema-valid visual configs could generate unbounded ticks/gridlines | fixed (one sub-item deferred) | `schemas/visual-safety.ts` `calculateBoundedStepCount` (≤200/axis) enforced in schema + render-time backstop; hostile-config component tests | Deferred sub-item: point-in-range validation for `geometry_shape`/`coordinate_grid` — data-quality (clipped render), not a freeze risk; per-shape semantics under-specified; listed as Phase 4 scope item 5 |
| P2-6 | Route bundles pulled the full configurator + question bank via barrel imports | fixed (partial) | `describe-config.ts` extraction; direct imports in 3 routes; measured −120–140 KB per route; `check:bundle` budgets + `bundle-boundaries.test.ts` static import guards | Deferred sub-item: per-renderer `next/dynamic` splitting — assessed and rejected for this pass with a documented cost/benefit rationale (mixed-type sessions load most renderers anyway; Suspense/SSR risk); revisit with real profiling (Phase 4 scope item 4). Residual: ~1MB framework baseline documented as a known limitation |
| P2-7 | Question change moved neither focus nor announcements | fixed | Focusable `<h2 tabIndex={-1}>` heading (mount-guarded), `aria-live` companion region; Playwright coverage incl. no focus theft on answer | — |
| P2-8 | Drag/drop accepted arbitrary external `text/plain` | fixed | Custom MIME `application/x-mindmosaic-item-id` with question-id-bound NUL-separated payload; decode + ownership + existence checks; rejection cursor; component tests incl. cross-question and malformed payloads | — |

**No unresolved P2 findings.** Both deferred sub-items carry documented technical justifications and are explicitly scheduled in the Phase 4 recommendations.

## P3 findings

| # | Finding | Status | Evidence |
| --- | --- | --- | --- |
| P3-1 | `sessionId` derived from seed — reproducible sessions collided | fixed | `crypto.randomUUID()` attempt ids; seed drives selection only; same-seed same-selection verified |
| P3-2 | No fixed determinism vectors | fixed | `determinism-golden-vectors.test.ts` (hashSeed, PRNG sequence, shuffle, selection) with bank version guard |
| P3-3 | Results `<dd>` before `<dt>`; invalid `<dl>` content model | fixed | Per-card single-pair `<dl>`, icon outside; caught + verified via axe (`definition-list`/`dlitem`) |
| P3-4 | Client routes lacked distinct titles | fixed | Sibling server `layout.tsx` per route with metadata template; no content/score leakage |

## Additional findings fixed within the pass (not in the original audit)

| Finding | Status | Evidence |
| --- | --- | --- |
| Cascade-layer bug: unlayered resets overrode `text-white` on primary buttons (1.41:1 contrast) | fixed | Resets moved into `@layer base`; verified by axe scan |
| Four colours narrowly under WCAG 4.5:1 (tokens + pie-legend shade) | fixed | Darkened one step; 5.6–7:1 verified against real backgrounds |

Ongoing guard: `@axe-core/playwright` scans four app states for serious/critical violations (`e2e/accessibility.spec.ts`).

## Gate decision

- P0: none reported → clear.
- P1: 5 fixed, 1 mitigated with documented residual risk and a concrete Phase 4 path → clear.
- P2: 8 fixed (2 sub-items deferred with strong documented technical justification) → clear.
- P3: 4 fixed → clear.
- Evidence basis: implementation and tests present in the tree at `bea1b88`; per `docs/PHASE3_HARDENING.md`, each of the 17 hardening commits was independently verified (typecheck, lint, unit/component tests, `validate:questions`, `check:answers`, Playwright for UI changes) before the next began. This matrix compared the documented findings against the actual implementation files and test names listed above; it did not rely on passing tests alone.

**The hardening merge gate is satisfied.** (The merge to `main` had already been performed before this matrix was written; this document records the retrospective verification required by Mission 0 step 5.)
