# 14. Documentation and Technical Debt Audit

**Audit Date:** 26 August 2026  
**Auditor:** Antigravity  
**Classification:** `COMPLETE` / `ACTIONABLE`

---

## 1. Documentation Inventory & ADR Status

The `docs/` directory contains 95 markdown files and 15 Architecture Decision Records (ADRs):

| ADR | Title | Repository Code Alignment | Status |
| :--- | :--- | :--- | :--- |
| **ADR-001** | Canonical Years, Families, Programmes, Offerings | Matches `src/features/taxonomy/` | `ALIGNED` |
| **ADR-002** | Git Authoring Source vs Supabase Runtime Projection | Matches `src/features/content-projection/` | `ALIGNED` |
| **ADR-003** | Immutable Item, Answer, Stimulus Versioning | Enforced in SQL migrations | `ALIGNED` |
| **ADR-004** | Framework Blueprint Profile Form Versioning | Implemented in `src/features/question-factory/` | `ALIGNED` |
| **ADR-005** | Legacy Exam Table Cutover & Resolution View | Dual-model view `resolved_sittings` active | `ALIGNED` |
| **ADR-006** | Normalized Session Item & Response Model | Matches `assessment_sessions` tables | `ALIGNED` |
| **ADR-007** | Fixed-Path vs Adaptive MST Delivery | Adaptive testlet prototype in place | `ALIGNED` |
| **ADR-008** | Adaptive Stage Transition & Concurrency | Draft state / prototype | `ALIGNED` |
| **ADR-009** | Exposure, Enemy Sets & Reuse Policy | Selection algorithms in `exam-patterns/` | `ALIGNED` |
| **ADR-010** | Capacity Gate & Accessibility Sufficiency | Enforced via `capacity-report.mts` | `ALIGNED` |
| **ADR-011** | Adaptive Reporting & Calibration Claims | Grounded in psychometric claims | `ALIGNED` |
| **ADR-012** | Child Data Retention, Erasure & Legal Hold | Backed by `erase_student_both_models()` | `ALIGNED` |
| **ADR-013** | Organization Membership & RLS Model | RLS migrations active | `ALIGNED` |
| **ADR-014** | Programme Offering Authority | Implemented in `programme-offering-authority.sql` | `ALIGNED` |
| **ADR-015** | Database Authoring Control Plane | Content factory control plane | `ALIGNED` |

---

## 2. Stale Claims & Documentation Contradictions

1. **Active Bank Size:** Several older planning notes refer to *"6,550 planned items"*. The measured reality is **1,293 active published questions**. All roadmap projections must use 1,293 as the verified baseline.
2. **Brand Colours Reference:** Older handoff docs mention `#FF555A` (older coral) or dark orange. The canonical brand color is now explicitly updated across the codebase to **`#FF5055`** (`--mm-coral`).

---

## 3. Technical Debt Inventory

1. **Teacher Portal In-Memory Mocks:**
   - `src/features/teacher/mock-catalogue.ts`: Hardcoded mock skills and blueprints for assignment creation.
   - `src/features/teacher/mock-notes.ts`: Hardcoded in-memory map for teacher student notes and intervention flags.
2. **Admin Operations In-Memory Mocks:**
   - `src/features/admin-analytics/mock-operations-data.ts`: Static mock array simulating background jobs (PDF export, email digests, dead letters).
3. **Stray Authoring Conflicts:**
   - `content/manual-questions/_conflicts/`: Contains 120 authored question drafts stuck in conflict files outside the active publication pipeline.
4. **Git Inbox Drift:**
   - `scripts/audit-bank.mts` reports 2 untracked JSON files in `content/manual-questions/inbox/`.

---

## 4. Documentation Recommendations

* **Retain & Keep Active:** `docs/ARCHITECTURE.md`, `docs/ASSESSMENT_SECURITY_MODEL.md`, `docs/CONTENT_RULES.md`, `docs/DATA_MODEL_AND_ROLES.md`, all ADRs (`docs/adr/001-015`).
* **Update:** `docs/QUESTION_BANK_SUMMARY.md` (Update active count to 1,293 and note 217 capacity gaps).
* **Archive / Supersede:** Move preliminary forensic notes from early August (`docs/audits/2026-08-10-deep-forensic-audit/`) to an archive subfolder, superseded by this comprehensive audit pack.
