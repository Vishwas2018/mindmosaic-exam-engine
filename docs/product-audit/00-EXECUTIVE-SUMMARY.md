# MindMosaic Deep Repository Audit: Executive Summary

**Date:** 26 August 2026  
**Auditor:** Antigravity (Advanced Agentic Systems)  
**Repository:** `mindmosaic-exam-engine`  
**Current Commit Baseline:** Local working tree  
**Classification Standard:** `COMPLETE` | `PARTIAL` | `PRESENT_BUT_UNUSED` | `MOCKED_OR_STATIC` | `MISSING` | `OBSOLETE` | `BLOCKED`

---

## 1. High-Level Findings & Capability Scorecard

| Dimension | Classification | Verified State & Key Evidence |
| :--- | :--- | :--- |
| **Core Practice & Exam Engine** | `COMPLETE` | 14 question renderers, 10 deterministic structured visual renderers, scratchpad canvas, autosave, server-authoritative scoring, and candidate answer key isolation are robust and verified. |
| **Public Landing & Marketing** | `COMPLETE` | Clear educational value proposition, single-row navigation header, responsive drawer, and WCAG AA contrast. |
| **Authentication & Role Shells** | `COMPLETE` | Supabase Auth, parent-governed child provisioning (`provisionChild.ts`), student alias logins (`/student-sign-in`), role-aware routing for Student, Parent, Teacher, Admin. |
| **Results & Scoring Analytics** | `COMPLETE` | Results screen with score ring, mistake/flag filters, earned badges, and subject/topic accuracy aggregation. |
| **Personalisation & Next Practice** | `PARTIAL` | Immediate post-assessment "Practise Missed Skills" loop is `COMPLETE` (`recommendSkills` + 5-question `buildDrill` with opaque handoff); multi-sitting cross-attempt historical skill aggregation remains planned for future pipeline. |
| **Dashboards (Student & Parent)** | `PARTIAL` | Database-backed attempt history, streak tracking, and performance bands. Parent narrative insights are rule-based and subscription-gated. |
| **Content Coverage & Bank Depth** | `PARTIAL` | 1,293 active published questions across Year 3 (881) and Year 5 (412) NAPLAN & ICAS. 217 of 219 capacity cells are below target (9,690 item deficit across planned matrix). Zero content for Years 2, 4, 6–12, AMC, Olympiads, Selective Schools, or Singapore Maths. |
| **Content Pipeline & Governance** | `PARTIAL` | Content Factory v2 architecture (blueprints, AI generation, verification, projection) is implemented, but 100% of the 1,293 active questions lack verifiable `approvedBy` human review signatures. |
| **Teacher & School Workflows** | `MOCKED_OR_STATIC` | Essay marking UI exists, but teacher assignment catalogue and notes rely on in-memory mock files (`mock-catalogue.ts`, `mock-notes.ts`). |
| **Writing & Evaluation** | `PARTIAL` | Essay renderer and schema exist (4 prompts total); automated AI rubric marking and student draft persistence are not implemented. |

---

## 2. What Is Already Good Enough (DO NOT Rebuild)

1. **Assessment & Question Rendering Engine (`src/features/exam-engine/`)**:
   - Supports 14 distinct question types with full keyboard navigation and accessible semantic HTML.
   - 10 deterministic structured visual renderers (charts, number lines, coordinate grids, geometry, fraction models) with zero arbitrary unsanitised SVG.
   - Built-in `ScratchpadCanvas` with drawing, highlighting, and undo tools.
   - Clean state separation: Untimed instant-feedback practice (`PracticeSession`) vs timed high-security exam simulation (`useExamStore` + `/exam`).

2. **Security & Answer Key Isolation (`src/server/scoring/` & `src/features/exam-engine/`)**:
   - `CandidateQuestion` data model strictly withholds answer keys, grading rules, and worked explanations from client payloads before submission.
   - Server-authoritative scoring endpoint (`POST /api/exam/session/[id]/submit`) executes isolated database scoring via Postgres RPC.
   - Runtime scoring reads answers using its dedicated least-privilege role/credential (`mindmosaic_scoring`), while publication/administration services project content via separate audited credentials (`INSERT`).

3. **Public Experience & Design System (`src/features/landing/`, `src/components/shell/`)**:
   - Cohesive education branding using verified tokens: `#5925A8` (Primary Purple), `#FF5055` (Coral Accent), `#FCFBF8` (Warm Canvas), and `#CC2429` (High-Contrast Text Coral).
   - Single-row responsive header with loading-state protection and accessible mobile drawer.

4. **Database & Multi-Model Session Architecture (`supabase/migrations/`)**:
   - 40 structured migrations with RLS policies covering student isolation, parent-child linking, and resolution-aware sitting views (`resolved_sittings`).

---

## 3. Top 5 Product & Functional Gaps

1. **Content Breadth & Form Depth**: Only 1,293 questions exist (881 in Year 3, 412 in Year 5). 217 of 219 capacity cells are below the minimum target of 50 items. Zero content for AMC, Selective Schools, Singapore Maths, or Secondary Years.
2. **Multi-Sitting Historical Skill Mastery Tracking**: Immediate post-assessment 5-question drills are complete (`recommendSkills` + `buildDrill`), but long-term student and parent dashboards still aggregate trends at the subject level rather than tracking cross-sitting sub-strand skill mastery over weeks of history.
3. **Student First-Time Onboarding Experience**: After registration or child alias creation, students land directly on an empty dashboard without a guided orientation or initial baseline diagnostic.
4. **Writing Evaluation & Rubrics**: The platform contains only 4 static writing prompts; there is no automated rubric evaluation, parent feedback review, or draft autosave.
5. **Teacher & School Mock Decoupling**: Teacher assignments, classroom skill catalogues, and student notes currently depend on in-memory mocks (`mock-catalogue.ts`, `mock-notes.ts`) rather than real tables.

---

## 4. Top 5 Technical & Reliability Gaps

1. **Missing Human Sign-off Audit Chain**: 100% of the 1,293 active published questions lack a verifiable `approvedBy` human review record.
2. **Offline & Unsaved State Resilience**: Exam answers are held in the client in-memory Zustand store and autosaved to the server. If a network disconnect occurs, answers remain in memory while the tab is open, but a durable offline queue (or local storage buffer) does not currently exist.
3. **Environment-Dependent Test Execution**: Database RLS test suites depend on a live Supabase instance and time out locally when external DB connections are unavailable.
4. **Commercial Billing Enablement**: Stripe checkout plumbing exists, but `FAMILY_PLAN_AVAILABILITY` remains `"roadmap"`, pricing is placeholder, and legal agreements are drafts.
5. **Media Optimization Pipeline**: Uploaded stimulus images lack an automated WebP/AVIF transformation pipeline and responsive `srcset` generation.

---

## 5. The Core Learning Loop Status

```text
[1. Discover]   ──> [2. Choose]   ──> [3. Configure] ──> [4. Practise] ──> [5. Understand]
      ▲                                                                          │
      │                                                                          ▼
[10. Track]     <── [9. Recommend] <── [8. Gaps/Strengths] <── [7. Review] <── [6. Submit]
```

* **Steps 1 to 7 (Discover → Choose → Configure → Practise → Understand → Submit → Review):** **FUNCTIONAL & ROBUST.**
* **Steps 8 to 9 (Gaps/Strengths → Recommend → Targeted 5-Question Drill):** **COMPLETE (Post-Assessment Loop).** The Results screen directly extracts missed objective skills (`recommendSkills`) and launches a targeted 5-question drill (`buildDrill`) with opaque handoff and previous item exclusion.
* **Step 10 (Multi-Attempt Cross-Sitting Mastery Aggregation):** **PARTIAL.** Operates at subject level; cross-attempt skill tracking across weeks of history is planned for future pipeline.

---

## 6. Repository Test Inventory

Programmatic scan of test files across the repository:

* **`src/tests/`:** **262 test files**
  - `components/`: 68 files (UI components, modals, shells, landing sections)
  - `pages/`: 7 files (page-level route integrations)
  - `unit/`: 187 files (renderers, scoring pure functions, stores, boundary checks, schemas)
* **`tests/rls/`:** **29 test files** (database privilege hardening, session lifecycle, RLS policies)
* **`e2e/`:** **19 Playwright spec files** (accessibility, auth flows, exam simulation, smoke tests)
* **Total Test Files Across Repository:** **310 files**

---

## 7. Recommended Wave-Based Roadmap

* **Wave 0 (Blockers & Security Hardening):** Add `import "server-only";` to `operator-service.ts`, correct scoring boundary checks to allow authorized publication writes while forbidding reads, and enforce `approvedBy` provenance in Content Factory.
* **Wave 1 (Complete the Core Learning Loop):** Post-assessment "Practise Missed Skills" loop is `COMPLETE` (`recommendSkills` + 5-question `buildDrill` with opaque sessionStorage handoff). Remaining work: multi-sitting historical mastery aggregation and student first-run onboarding modal.
* **Wave 2 (Premium Parent & Student Polish):** Add progress comparison charts, printable PDF diagnostic reports, and weekly parent email summary triggers.
* **Wave 3 (Content Depth Expansion):** Scale Year 3 & 5 question pools to 3,000+ items to unlock multiple full-length mock exams and adaptive testlets.
* **Wave 4 (Programme Expansion):** Launch Selective School Entry, AMC, and Year 7 transition modules.

---

## 8. Audit Deliverables Index

* [`01-REPOSITORY-AND-ARCHITECTURE.md`](./01-REPOSITORY-AND-ARCHITECTURE.md)
* [`02-PUBLIC-EXPERIENCE.md`](./02-PUBLIC-EXPERIENCE.md)
* [`03-AUTH-AND-ONBOARDING.md`](./03-AUTH-AND-ONBOARDING.md)
* [`04-ASSESSMENT-DISCOVERY-AND-CONFIGURATION.md`](./04-ASSESSMENT-DISCOVERY-AND-CONFIGURATION.md)
* [`05-QUESTION-ENGINE-AND-ASSESSMENT-UX.md`](./05-QUESTION-ENGINE-AND-ASSESSMENT-UX.md)
* [`06-RESULTS-AND-EXPLANATIONS.md`](./06-RESULTS-AND-EXPLANATIONS.md)
* [`07-STUDENT-DASHBOARD.md`](./07-STUDENT-DASHBOARD.md)
* [`08-PARENT-DASHBOARD.md`](./08-PARENT-DASHBOARD.md)
* [`09-PERSONALISATION-AND-ANALYTICS.md`](./09-PERSONALISATION-AND-ANALYTICS.md)
* [`10-CONTENT-PLATFORM-AND-COVERAGE.md`](./10-CONTENT-PLATFORM-AND-COVERAGE.md)
* [`11-WRITING-AND-MEDIA.md`](./11-WRITING-AND-MEDIA.md)
* [`12-ACCESSIBILITY-RESPONSIVE-PERFORMANCE.md`](./12-ACCESSIBILITY-RESPONSIVE-PERFORMANCE.md)
* [`13-SECURITY-RELIABILITY-AND-TESTS.md`](./13-SECURITY-RELIABILITY-AND-TESTS.md)
* [`14-DOCUMENTATION-AND-TECHNICAL-DEBT.md`](./14-DOCUMENTATION-AND-TECHNICAL-DEBT.md)
* [`15-END-PRODUCT-DEFINITION.md`](./15-END-PRODUCT-DEFINITION.md)
* [`16-GAP-MATRIX.md`](./16-GAP-MATRIX.md)
* [`17-RECOMMENDED-ROADMAP.md`](./17-RECOMMENDED-ROADMAP.md)
