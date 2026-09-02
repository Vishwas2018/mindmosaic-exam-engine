# 16. Consolidated Gap Matrix

**Audit Date:** 26 August 2026  
**Auditor:** Antigravity  
**Priority Legend:**  
- **`P0`**: Blocks safe/reliable launch or violates core security architecture.  
- **`P1`**: Major product-value gap required for initial launch.  
- **`P2`**: Important premium improvement for retention/differentiation.  
- **`P3`**: Expansion, polish, or secondary programme.  
- **`DEFER`**: Intentionally deferred to future phases.

---

## Consolidated Capability Matrix

| Capability | Current Status | Evidence (Files / Routes) | Quality | Missing Elements | Priority | End-State Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Header & Navigation** | `COMPLETE` | `src/features/landing/components/SiteNav.tsx` | Excellent | None | **P3** | Maintain current single-row layout and brand colors. |
| **Public Landing Page** | `COMPLETE` | `src/app/page.tsx`, `src/features/landing/` | Excellent | None | **P3** | Keep existing high-trust educational messaging. |
| **Stripe Billing & Plans** | `PARTIAL` | `src/lib/billing/prices.ts`, `src/app/api/stripe/` | Implemented | `FAMILY_PLAN_AVAILABILITY` is `"roadmap"`, placeholder pricing, draft legal agreements | **P2** | Keep checkout plumbing ready; switch to purchasable once commercial terms and legal reviews are complete. |
| **Auth & Child Provisioning** | `COMPLETE` | `src/features/auth/`, `provision-child.ts` | High | Student first-run onboarding tour | **P1** | Add 3-step student warmup onboarding modal upon first login. |
| **Question Renderers (14 Types)**| `COMPLETE` | `src/features/exam-engine/question-renderers/` | Exemplary | Audio spelling player | **P2** | Retain all 14 existing renderers; add audio player in Wave 3. |
| **Visual Renderers (10 Types)** | `COMPLETE` | `src/features/exam-engine/visual-renderers/` | Exemplary | None | **P3** | Retain existing deterministic SVG rendering suite. |
| **Scratchpad Canvas** | `COMPLETE` | `src/features/exam-engine/scratchpad/` | High | None | **P3** | Retain existing transparent drawing overlay. |
| **Practice Mode Runner** | `COMPLETE` | `src/features/exam-engine/practice-mode/` | High | None | **P2** | Retain untimed instant-feedback practice engine. |
| **Exam Simulation Runner** | `COMPLETE` | `src/features/exam-engine/state/exam-store.ts` | High | None | **P1** | Retain timed simulation with candidate answer key stripping. |
| **Offline / Unsaved State** | `PARTIAL` | `src/features/exam-engine/state/autosave.ts` | Basic | Answers in in-memory store only; no localStorage answer cache or durable offline sync queue | **P2** | Implement durable local transaction journal for network drop recovery. |
| **Results & Review Screen** | `COMPLETE` | `src/app/results/page.tsx`, `PractiseMissedSkills.tsx` | Exemplary | None | **P3** | Retain results review with 1-click missed-skills targeted practice drill. |
| **Student Dashboard** | `PARTIAL` | `src/app/student/page.tsx` | Good | Sub-strand breakdown & 1-click drill | **P1** | Add sub-strand mastery bars and 1-click recommended drill. |
| **Parent Dashboard** | `PARTIAL` | `src/app/parent/page.tsx` | Good | Multi-month trend charts & PDF export | **P2** | Add downloadable diagnostic PDF reports for parent interviews. |
| **Personalised Recommendations**| `PARTIAL` | `recommend-skills.ts`, `build-drill.ts`, `attempt-summary.ts` | Good | Multi-sitting historical cross-attempt skill aggregation | **P1** | Post-assessment 5-question drill complete; add multi-sitting historical mastery tracking. |
| **Content Bank Depth (Y3 & Y5)**| `PARTIAL` | `src/content/`, `getExamBank('published')` | High Quality / Thin | 1,700+ questions across Y3 & Y5 cells | **P1** | Ingest 1,700 questions to reach 3,000 total items (50+ per cell). |
| **Content Governance Audit Trail**| `PARTIAL` | `src/features/question-factory/` | Solid Code | Human `approvedBy` review signatures | **P0** | Enforce recorded human reviewer IDs in publication manifests. |
| **Security Module Boundary** | `COMPLETE` | `operator-service.ts`, `scoring-module-boundary.test.ts` | High | None (Remediated with server-only guard & SQL access classifier) | **P0** | Preserve strict separation between publication writes and runtime scoring. |
| **Teacher Portal Integration** | `MOCKED_OR_STATIC`| `src/features/teacher/mock-catalogue.ts` | Prototyped | Real DB-backed teacher assignments | **DEFER** | Defer broad school workflows; focus on direct-to-parent V1 launch. |
| **Writing & Essay Evaluation** | `PARTIAL` | `src/features/exam-engine/question-renderers/EssayRenderer.tsx` | Prototyped | Automated AI rubric marking | **DEFER** | Defer writing automation to Phase 2; focus on auto-marked subjects. |
| **Selective Schools & AMC** | `MISSING` | Catalogue declared coming-soon | Not started | Question blueprints & bank | **P3** | Schedule for Wave 4 expansion after Core V1 launch. |
| **Adaptive MST Engine** | `PRESENT_BUT_UNUSED`| `src/features/adaptive-prototype/` | Experimental | Psychometric calibration data | **DEFER** | Defer adaptive routing until 50,000+ student responses are logged. |
