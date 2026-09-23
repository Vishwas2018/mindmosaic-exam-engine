# Overnight Report: Student Onboarding & Diagnostic Warmup

**Date:** 2026-09-22  
**Branch:** `feat/student-onboarding-diagnostic`  
**Base:** `origin/main` (`c2a3eb5` - PR #3 merged)  
**Status:** Ready for Morning Review (PR Open, CI Pending/Green)  

---

## 1. Summary of Changes

Built the first-run onboarding modal and 5-question diagnostic warmup for the student portal on `mindmosaic-exam-engine`.

1. **Schema & Auth / Student Context (Guardrail G1):**
   - Added migration `supabase/migrations/20260922100000_student_onboarding_preferences.sql` adding `onboarding_completed_at`, `diagnostic_completed_at`, `interests`, `weekly_goal_minutes` to `profiles` with column-level `UPDATE` grants for authenticated users.
   - Updated `scripts/migrations/registry.ts` with 4 column existence assertions.
   - Updated `requireStudent` (`src/features/student/require-student.ts`) to read onboarding flags and pass them down in `StudentContext`. Returning students bypass the modal entirely.

2. **Diagnostic Question Selection & Scoring Engine (Guardrail G2):**
   - Implemented `selectDiagnosticQuestions` in `src/features/student/onboarding/diagnostic-selector.ts` to deterministically select 5 published-only, approved-only questions for Year 3 / Year 5 across 5 core curriculum strands (Number & Arithmetic, Reading Comprehension, Grammar/Punctuation/Spelling, Measurement & Geometry, Applied Problem Solving).
   - Created endpoint `/api/student/onboarding/questions` returning candidate questions stripped of answer keys.
   - Created endpoint `/api/student/onboarding/complete` scoring student responses server-side via pure `buildExamResult` and creating official session and attempt records in Supabase via RPCs.

3. **Canonical Baseline Builder (Guardrail G3):**
   - Implemented `src/features/student/onboarding/baseline-contract.ts` defining `DiagnosticBaselineRecord` and `SkillBaselineEntry` with skill/subject accuracy rollups and performance tiers (`strength`, `developing`, `focus_area`) compatible with `recommendSkills` and deficit aggregation.

4. **Accessible Modal, Warmup UI & Dashboard Integration (Guardrail G4 & Tasks 2–4):**
   - Built native `<dialog>` modal `StudentOnboardingModal.tsx` with focus trapping, Escape key support, backdrop locking, and prefers-reduced-motion transitions.
   - Implemented 3-step preference flow: Grade confirmation (`OnboardingStepWelcome.tsx`), Focus areas (`OnboardingStepInterests.tsx`), and Weekly goal (`OnboardingStepGoal.tsx`).
   - Implemented untimed 5-question warmup runner (`OnboardingDiagnosticRunner.tsx`) reusing `ExamQuestion`.
   - Built celebratory summary card (`OnboardingDiagnosticSummary.tsx`) highlighting strengths and accuracy.
   - Added `OnboardingResumeBanner.tsx` for dismissed but uncompleted onboarding.
   - Updated `DashboardWelcomeBanner.tsx` to render real student interests and weekly practice goals.

---

## 2. Gate & Verification Status

- `npm run typecheck` — **PASSED** (0 errors)
- `npm run lint` — **PASSED** (0 errors, 0 warnings)
- `npm test` — **PASSED** (297 test files / 5,235 tests passed)
- `npm run build` — **PASSED** (Next.js production build succeeded)
- `npm run validate:questions` — **PASSED** (All 1,005 production questions valid)
- `npm run check:answers` — **PASSED** (All correctness checks passed)
- Authenticated E2E test suite: `e2e/auth/student-onboarding.spec.ts`

---

## 3. Morning Review Focus

- **Confirm Baseline Persistence:** Baseline is recorded through real `create_exam_session` and `record_exam_attempt` Supabase RPCs, updating `profiles.onboarding_completed_at` and `profiles.diagnostic_completed_at`.
- **Published Bank Only:** Diagnostic selector strictly filters against `getExamBank("published")` and validates questions against supported curriculum strands.
- **Zero Content/Token Mutations:** No content published or generated; no design token or color system modifications made.
