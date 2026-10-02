# MindMosaic Repository Cleanup Inventory (October 2026)

> **Audit Date:** October 2, 2026  
> **Target Branch:** `chore/declutter` off fresh `origin/dev` (commit `6dcab9f`)  
> **Status:** PHASE 1 — READ-ONLY INVENTORY (No deletions performed pending typed APPROVE)  

## Executive Summary & Category Totals

| Category | Total Items | Proposed KEEP | Proposed DELETE / PURGE | Size Reclaimed |
| :--- | :--- | :--- | :--- | :--- |
| **1. Markdown & Documentation** | 184 files (2.43 MB) | 50 files (651.5 KB) | 133 delete, 1 merge | ~1.76 MB (1,763,722 bytes) |
| **2. Dead Code & Orphan Components** | 17 files | 0 | 17 files | ~175.1 KB (code: 29.5 KB, hub images: 145.6 KB) |
| **3. Prototype Routes & Stitch Mocks** | 21 files (routes + stitch) | 0 | 21 files | ~519.5 KB (519,534 bytes) |
| **4. Committed Screenshots under `docs/`** | 41 files | 0 | 41 files | ~7.01 MB (7,006,691 bytes) |
| **5. Stray Scripts & Editor Dotfolders** | 6 scripts + dotfolders | 0 | 6 scripts purged, .gitignore updated | ~31.8 KB |
| **6. Report-Only Items (Needs Decision)** | 2 items (seeds & quarantine) | 2 items | 0 (Retained in Phase 1 & 2) | N/A (1,103 seeds = 1.05 MB; _conflicts = 932.1 KB) |
| **TOTAL CANDIDATES FOR DELETION** | **218 files** | **52 files** | **218 files** | **~9.50 MB (9,496,825 bytes)** |

---

## Category 1: Markdown & Documentation (*.md, *.mdx)

Every markdown file outside `node_modules` and `.git` was audited for active imports, CI references, scripts, and tests.

### Summary
- **Total Files:** 184 files (2,428,228 bytes / 2.43 MB)
- **Proposed KEEP:** 50 files (651,476 bytes / 651.5 KB)
- **Proposed MERGE-INTO docs/design.md:** 1 file (13,030 bytes)
- **Proposed DELETE:** 133 files (1,763,722 bytes / 1.76 MB)

| Path | Size (bytes) | Last Commit | Referenced By | Proposed Action | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `brand/assets/photography/LICENSES.md` | 4,311 | 2026-07-24 (2 months ago) | *(none)* | **KEEP** | Active commercial stock photo licensing register for public/photos/ |
| `brand/BRAND.md` | 9,767 | 2026-07-29 (9 weeks ago) | *(none)* | **DELETE** | Stale brand document, completely superseded by canonical docs/design.md |
| `brand/imagery-guidelines.md` | 13,030 | 2026-07-24 (2 months ago) | *(none)* | **MERGE-INTO docs/design.md** | Marketing imagery guidelines; merge core rules into docs/design.md |
| `content/manual-questions/_ready/QUEUE.md` | 1,986 | 2026-08-22 (6 weeks ago) | *(none)* | **DELETE** | Dated staging queue notes, unreferenced |
| `content/manual-questions/BATCH-LOG.md` | 30,111 | 2026-09-22 (10 days ago) | *(none)* | **KEEP** | Live question-factory batch ledger actively parsed and appended by scripts |
| `content/manual-questions/GENERATION-SPEC.md` | 48,536 | 2026-08-22 (6 weeks ago) | *(none)* | **KEEP** | Authoring specification referenced by scripts/lib/programme-quotas.ts |
| `content/manual-questions/PROMPT-audit.md` | 3,595 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | One-off prompt template, unreferenced |
| `content/manual-questions/PROMPT-generate.md` | 3,836 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | One-off prompt template, unreferenced |
| `content/manual-questions/README.md` | 2,214 | 2026-08-09 (8 weeks ago) | *(none)* | **KEEP** | Staging tree overview for manual question authors |
| `content/manual-questions/REVIEW-PIPELINE.md` | 15,191 | 2026-08-22 (6 weeks ago) | *(none)* | **KEEP** | Active question-factory review pipeline policy referenced by CI and scripts |
| `docs/adr/000-template.md` | 1,229 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/001-canonical-years-families-programmes-offerings.md` | 11,493 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/002-git-authoring-source-vs-supabase-runtime-projection.md` | 18,342 | 2026-08-21 (6 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/003-immutable-item-answer-stimulus-versioning.md` | 14,714 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/004-framework-blueprint-profile-form-versioning.md` | 7,748 | 2026-08-22 (6 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/005-legacy-exam-table-cutover.md` | 29,610 | 2026-08-15 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/006-normalized-session-item-and-response-model.md` | 40,442 | 2026-08-15 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/007-fixed-path-vs-adaptive-mst-delivery.md` | 18,209 | 2026-08-21 (6 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/008-adaptive-stage-transition-and-concurrency.md` | 1,485 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/009-exposure-enemy-sets-and-reuse-policy.md` | 2,107 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/010-capacity-gate-and-accessibility-sufficiency.md` | 2,041 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/011-adaptive-reporting-and-calibration-claims.md` | 1,315 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/012-child-data-retention-erasure-and-legal-hold.md` | 16,152 | 2026-08-15 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/013-organization-membership-and-rls-model.md` | 1,564 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/014-media-options-groups-and-structured-responses.md` | 2,630 | 2026-09-04 (4 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/014-programme-offering-authority.md` | 9,998 | 2026-08-20 (6 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/015-database-authoring-control-plane.md` | 1,602 | 2026-09-02 (4 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/016-versioned-australian-curriculum-platform.md` | 5,093 | 2026-08-28 (5 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/phase0-legacy-session-inventory.md` | 20,600 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record (referenced across platform schemas, scoring, and tests) |
| `docs/adr/README.md` | 4,992 | 2026-08-21 (6 weeks ago) | *(none)* | **KEEP** | Architecture Decision Record index |
| `docs/audits/2026-08-10-deep-forensic-audit/00-EXECUTIVE-SUMMARY.md` | 6,302 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/01-CURRENT-STATE-AND-SCOPE-MAP.md` | 7,982 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/02-GOAL-TO-IMPLEMENTATION-DEVIATIONS.md` | 6,974 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/03-FUNCTIONAL-ROUTE-AND-STATE-AUDIT.md` | 5,203 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/04-QUESTION-ENGINE-CONTENT-AND-EXAM-FIDELITY-AUDIT.md` | 5,310 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/05-UI-UX-RESPONSIVE-AND-ACCESSIBILITY-AUDIT.md` | 3,593 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/06-AUTH-DATA-SECURITY-AND-PRIVACY-AUDIT.md` | 5,587 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/07-DATABASE-SUPABASE-AND-PERSISTENCE-AUDIT.md` | 4,518 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/08-TEST-QUALITY-CI-AND-RELEASE-GATES-AUDIT.md` | 5,187 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/09-PERFORMANCE-SEO-AND-OBSERVABILITY-AUDIT.md` | 3,717 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/10-ARCHITECTURE-DEPENDENCIES-AND-MAINTAINABILITY-AUDIT.md` | 3,944 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/11-DOCUMENTATION-CLAIMS-LICENSING-AND-GOVERNANCE-AUDIT.md` | 4,587 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/12-CONSOLIDATED-FINDINGS-REGISTER.md` | 41,113 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/13-PRIORITISED-REMEDIATION-ROADMAP.md` | 6,200 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/2026-08-10-deep-forensic-audit/14-AUDIT-EVIDENCE-AND-COMMAND-LOG.md` | 25,374 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded forensic audit from August 2026; keep latest in docs/audits/ |
| `docs/audits/programme-readiness-2026-09.md` | 45,262 | 2026-10-01 (25 hours ago) | *(none)* | **KEEP** | Latest programme readiness audit (September 2026) |
| `docs/content-platform-v2/01-content-platform-specification.md` | 2,269 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/02-agent-authoring-contract.md` | 936 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/03-manual-authoring-import.md` | 847 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/04-visual-media-assets.md` | 1,047 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/05-content-lifecycle.md` | 708 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/06-blueprint-model.md` | 657 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/07-validation-risk.md` | 934 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/08-review-approval.md` | 870 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/09-migration-cutover.md` | 830 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/10-operator-runbook.md` | 858 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/11-quality-safety-layer.md` | 1,980 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-platform-v2/pilot-results.md` | 2,008 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated content platform v2 specification and pilot notes (2026-09-02); unreferenced |
| `docs/content-status/amc-family-spec.md` | 30,356 | 2026-10-01 (25 hours ago) | *(none)* | **KEEP** | Active AMC family enablement specification (current work) |
| `docs/content-status/exam-content-status.md` | 4,746 | 2026-08-09 (8 weeks ago) | *(none)* | **DELETE** | Superseded content backlog/status note (August 2026); unreferenced |
| `docs/content-status/exam-fidelity-backlog.md` | 7,639 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded content backlog/status note (August 2026); unreferenced |
| `docs/content-status/exam-frameworks-reference.md` | 6,836 | 2026-08-09 (8 weeks ago) | *(none)* | **DELETE** | Superseded content backlog/status note (August 2026); unreferenced |
| `docs/content-status/exam-patterns.md` | 10,046 | 2026-08-11 (7 weeks ago) | *(none)* | **DELETE** | Superseded content backlog/status note (August 2026); unreferenced |
| `docs/curriculum/crosswalk/corrections-applied.md` | 7,918 | 2026-08-29 (5 weeks ago) | *(none)* | **DELETE** | Historical curriculum crosswalk analysis; unreferenced |
| `docs/curriculum/crosswalk/crosswalk-analysis-report.md` | 12,904 | 2026-08-29 (5 weeks ago) | *(none)* | **DELETE** | Historical curriculum crosswalk analysis; unreferenced |
| `docs/curriculum/crosswalk/projected-coverage.md` | 28,293 | 2026-08-29 (5 weeks ago) | *(none)* | **DELETE** | Historical curriculum crosswalk analysis; unreferenced |
| `docs/curriculum/research/01-jurisdiction-version-matrix.md` | 13,215 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical curriculum research and handoff notes; unreferenced |
| `docs/curriculum/research/02-source-and-licence-register.md` | 8,583 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical curriculum research and handoff notes; unreferenced |
| `docs/curriculum/research/03-parent-content-model.md` | 6,428 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical curriculum research and handoff notes; unreferenced |
| `docs/curriculum/research/04-victoria-y3-y5-ux-spec.md` | 5,581 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical curriculum research and handoff notes; unreferenced |
| `docs/curriculum/research/05-expansion-sequence-f10.md` | 3,673 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical curriculum research and handoff notes; unreferenced |
| `docs/curriculum/research/06-codex-platform-interface-recommendations.md` | 5,350 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical curriculum research and handoff notes; unreferenced |
| `docs/curriculum/research/07-claude-code-handoff-note.md` | 8,730 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical curriculum research and handoff notes; unreferenced |
| `docs/curriculum/research/README.md` | 737 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical curriculum research and handoff notes; unreferenced |
| `docs/curriculum/2026-08-28-curriculum-adapter-import-report.md` | 10,070 | 2026-08-28 (5 weeks ago) | *(none)* | **DELETE** | Dated curriculum import/integration report; unreferenced |
| `docs/curriculum/2026-08-28-curriculum-platform-foundation-report.md` | 6,687 | 2026-08-28 (5 weeks ago) | *(none)* | **DELETE** | Dated curriculum import/integration report; unreferenced |
| `docs/curriculum/2026-08-28-vic-l3-l5-manifest-report.md` | 14,716 | 2026-08-28 (5 weeks ago) | *(none)* | **DELETE** | Dated curriculum import/integration report; unreferenced |
| `docs/curriculum/2026-08-29-integration-report.md` | 10,072 | 2026-08-29 (5 weeks ago) | *(none)* | **DELETE** | Dated curriculum import/integration report; unreferenced |
| `docs/curriculum/2026-08-29-parent-explorer-report.md` | 9,896 | 2026-08-28 (5 weeks ago) | *(none)* | **DELETE** | Dated curriculum import/integration report; unreferenced |
| `docs/curriculum/2026-08-29-student-lessons-l3-number-report.md` | 10,953 | 2026-08-29 (5 weeks ago) | *(none)* | **DELETE** | Dated curriculum import/integration report; unreferenced |
| `docs/curriculum/2026-08-30-l3-complete-report.md` | 20,266 | 2026-08-30 (5 weeks ago) | *(none)* | **DELETE** | Dated curriculum import/integration report; unreferenced |
| `docs/overnight/reviews/STATUS-check1.md` | 2,558 | 2026-07-19 (3 months ago) | *(none)* | **DELETE** | Dated overnight run report / log; unreferenced |
| `docs/overnight/reviews/STATUS-check2.md` | 4,205 | 2026-07-19 (3 months ago) | *(none)* | **DELETE** | Dated overnight run report / log; unreferenced |
| `docs/overnight/reviews/STATUS-check3.md` | 3,287 | 2026-07-19 (3 months ago) | *(none)* | **DELETE** | Dated overnight run report / log; unreferenced |
| `docs/overnight/2026-09-03-summary.md` | 10,938 | 2026-09-04 (4 weeks ago) | *(none)* | **DELETE** | Dated overnight run report / log; unreferenced |
| `docs/overnight/2026-09-22-gemini-adapter.md` | 2,865 | 2026-09-23 (9 days ago) | *(none)* | **DELETE** | Dated overnight run report / log; unreferenced |
| `docs/overnight/2026-09-22-onboarding.md` | 3,943 | 2026-09-23 (9 days ago) | *(none)* | **DELETE** | Dated overnight run report / log; unreferenced |
| `docs/product-audit/00-EXECUTIVE-SUMMARY.md` | 10,612 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/01-REPOSITORY-AND-ARCHITECTURE.md` | 8,614 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/02-PUBLIC-EXPERIENCE.md` | 6,356 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/03-AUTH-AND-ONBOARDING.md` | 4,136 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/04-ASSESSMENT-DISCOVERY-AND-CONFIGURATION.md` | 4,640 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/05-QUESTION-ENGINE-AND-ASSESSMENT-UX.md` | 6,701 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/06-RESULTS-AND-EXPLANATIONS.md` | 5,370 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/07-STUDENT-DASHBOARD.md` | 3,757 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/08-PARENT-DASHBOARD.md` | 4,186 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/09-PERSONALISATION-AND-ANALYTICS.md` | 4,166 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/10-CONTENT-PLATFORM-AND-COVERAGE.md` | 4,357 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/11-WRITING-AND-MEDIA.md` | 3,229 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/12-ACCESSIBILITY-RESPONSIVE-PERFORMANCE.md` | 3,505 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/13-SECURITY-RELIABILITY-AND-TESTS.md` | 4,967 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/14-DOCUMENTATION-AND-TECHNICAL-DEBT.md` | 3,804 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/15-END-PRODUCT-DEFINITION.md` | 4,013 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/16-GAP-MATRIX.md` | 5,105 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/product-audit/17-RECOMMENDED-ROADMAP.md` | 5,635 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Superseded 18-part product audit from 2026-09-02; findings resolved or tracked |
| `docs/reports/content-platform-v2/00-audit-and-plan-2026-08-28.md` | 9,489 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/curriculum/01-phase0-stabilisation-report.md` | 19,870 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission2-fixture-prep/01-harvest-inventory.md` | 15,601 | 2026-07-12 (3 months ago) | `src/tests/unit/question-factory/mission2-fixture-integrity.test.ts` | **KEEP** | Referenced by active unit test verifying calibration fixture integrity |
| `docs/reports/mission2-fixture-prep/02-parser-analysis.md` | 19,283 | 2026-07-12 (3 months ago) | `src/tests/unit/question-factory/mission2-fixture-integrity.test.ts` | **KEEP** | Referenced by active unit test verifying calibration fixture integrity |
| `docs/reports/mission2-fixture-prep/03-legacy-ingestion-requirements.md` | 17,725 | 2026-07-12 (3 months ago) | `src/tests/unit/question-factory/mission2-fixture-integrity.test.ts` | **KEEP** | Referenced by active unit test verifying calibration fixture integrity |
| `docs/reports/mission2-fixture-prep/04-unsafe-content-report.md` | 9,467 | 2026-07-12 (3 months ago) | `src/tests/unit/question-factory/mission2-fixture-integrity.test.ts` | **KEEP** | Referenced by active unit test verifying calibration fixture integrity |
| `docs/reports/mission2-fixture-prep/05-review-chain-followup.md` | 9,437 | 2026-07-12 (3 months ago) | `src/tests/unit/question-factory/mission2-fixture-integrity.test.ts` | **KEEP** | Referenced by active unit test verifying calibration fixture integrity |
| `docs/reports/mission2-production/01-legacy-ingestion-adapter.md` | 22,497 | 2026-07-12 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission2-production/02-structural-validation.md` | 32,297 | 2026-07-12 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission2-production/03-correctness-verification.md` | 56,263 | 2026-07-14 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/01-mission3-implementation-contract.md` | 136,642 | 2026-07-14 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/02-prerequisite-decisions.md` | 53,540 | 2026-07-14 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/03-mission3a-generation-ingestion.md` | 60,411 | 2026-07-15 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/04-mission3b-semantic-review.md` | 45,607 | 2026-07-15 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/05-mission3c-revision-pipeline.md` | 86,004 | 2026-07-16 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/06-pb1-taxonomy-remediation.md` | 5,402 | 2026-07-15 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/07-mission3c-revision-pipeline-delivery.md` | 41,573 | 2026-07-16 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/08-mission3b-blueprint-remediation.md` | 7,249 | 2026-07-16 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/09-mission3d-plan.md` | 51,913 | 2026-07-16 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/10-mission3d-delivery.md` | 20,058 | 2026-07-16 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/11-mission3d-audit-remediation.md` | 14,096 | 2026-07-17 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/12-mission3d-second-audit-remediation.md` | 12,023 | 2026-07-17 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/13-mission3d-third-audit-remediation.md` | 19,086 | 2026-07-17 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/14-mission3d-governed-authority-remediation.md` | 19,446 | 2026-07-17 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/mission3-production/15-mission3d-governed-authority-hardening.md` | 23,600 | 2026-07-17 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/overnight-audit-2026-07-31/package-a-migration-drift.md` | 5,625 | 2026-07-31 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/overnight-audit-2026-07-31/package-b-durable-attempts.md` | 8,772 | 2026-07-31 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/overnight-audit-2026-07-31/package-c-rls-empirical.md` | 7,667 | 2026-07-31 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/overnight-audit-2026-07-31/package-d-billing-entitlement.md` | 7,314 | 2026-07-31 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/overnight-audit-2026-07-31/package-e-gate-suite-content-state.md` | 5,979 | 2026-07-31 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/overnight-audit-2026-07-31/package-f-branch-reconciliation.md` | 7,345 | 2026-07-31 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/overnight-audit-2026-07-31/package-g-executive-summary.md` | 8,770 | 2026-07-31 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/overnight-audit-2026-07-31/STATUS.md` | 5,174 | 2026-07-31 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/pb2-production/01-pb2-blueprint-binding-hardening.md` | 18,094 | 2026-07-17 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/branch-inventory-2026-07-30.md` | 7,490 | 2026-07-30 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/correctness-multistep-design.md` | 35,824 | 2026-07-22 (2 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/duplicate-child-consolidation-phase-a-2026-07-30.md` | 12,017 | 2026-07-30 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/factory-baseline.md` | 8,520 | 2026-07-11 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/migration-drift-audit-2026-07-30.md` | 10,310 | 2026-07-30 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/phase3-hardening-resolution.md` | 9,042 | 2026-07-11 (3 months ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/reports/publication-288-posthoc-audit.md` | 13,494 | 2026-07-30 (9 weeks ago) | *(none)* | **DELETE** | Historical mission delivery report / overnight audit log; unreferenced |
| `docs/spec/scalable-assessment-platform-spec-v1.md` | 61,560 | 2026-08-21 (6 weeks ago) | *(none)* | **KEEP** | Platform architecture specification referenced by schema types and year authority tests |
| `docs/testing/e2e-auth-baseline-2026-09.md` | 5,854 | 2026-09-22 (10 days ago) | *(none)* | **DELETE** | Dated test baseline report; unreferenced |
| `docs/testing/playwright-audit.md` | 4,934 | 2026-09-22 (10 days ago) | *(none)* | **DELETE** | Dated test audit from July 2026; unreferenced |
| `docs/testing/playwright-auth-test-data-guide.md` | 12,173 | 2026-07-22 (2 months ago) | *(none)* | **KEEP** | Active test infrastructure guide referenced by CI workflow and auth e2e fixtures |
| `docs/adaptive-testlet-strategy.md` | 12,058 | 2026-08-12 (7 weeks ago) | *(none)* | **KEEP** | Algorithm specification for adaptive testlet routing (spike basis) |
| `docs/ARCHITECTURE.md` | 15,148 | 2026-07-19 (3 months ago) | *(none)* | **KEEP** | Canonical system architecture document (streamlined) |
| `docs/assessment-capability-rebase-report.md` | 8,562 | 2026-09-04 (4 weeks ago) | *(none)* | **DELETE** | Dated branch rebase report (September 2026); unreferenced |
| `docs/ASSESSMENT_SECURITY_MODEL.md` | 13,690 | 2026-07-19 (3 months ago) | *(none)* | **KEEP** | Core security policy actively referenced by ESLint, check-bundle, and server routes |
| `docs/consolidate-decomposition-plan-2026-08-29.md` | 11,112 | 2026-09-02 (4 weeks ago) | *(none)* | **DELETE** | Dated consolidation plan; unreferenced |
| `docs/content-track-handoff.md` | 11,816 | 2026-08-22 (6 weeks ago) | *(none)* | **DELETE** | Dated developer handoff note (August 2026); unreferenced |
| `docs/CONTENT_RULES.md` | 5,225 | 2026-07-11 (3 months ago) | *(none)* | **KEEP** | Core content authoring and originality rules |
| `docs/CONTENT_STANDARDS_SCIENCE.md` | 3,984 | 2026-07-23 (2 months ago) | *(none)* | **KEEP** | Subject content standards for Science |
| `docs/DATA_MODEL_AND_ROLES.md` | 6,719 | 2026-07-20 (2 months ago) | *(none)* | **KEEP** | Active data model documentation referenced by auth and teacher routes |
| `docs/DEPLOYMENT.md` | 10,589 | 2026-08-05 (8 weeks ago) | *(none)* | **KEEP** | Active deployment runbook referenced by scripts and showcase |
| `docs/design.md` | 56,443 | 2026-10-01 (25 hours ago) | *(none)* | **KEEP** | Canonical v2.2 design specification |
| `docs/landing-page.md` | 7,249 | 2026-07-23 (2 months ago) | *(none)* | **DELETE** | Old landing page design notes (July 2026); superseded by shipped landing redesign |
| `docs/MIGRATIONS.md` | 6,800 | 2026-08-21 (6 weeks ago) | *(none)* | **KEEP** | Active database migrations guidance referenced by scripts/migrations |
| `docs/NAPLAN_INTERACTION_FORMATS.md` | 2,962 | 2026-09-04 (4 weeks ago) | *(none)* | **KEEP** | Interaction format specification for NAPLAN questions |
| `docs/phase2-cutover-readiness-checklist.md` | 44,060 | 2026-08-22 (6 weeks ago) | *(none)* | **DELETE** | Dated cutover checklist (August 2026); cutover complete |
| `docs/PHASE3_HARDENING.md` | 26,838 | 2026-07-11 (3 months ago) | *(none)* | **DELETE** | Dated hardening notes from July 2026; unreferenced |
| `docs/platform-foundation-parked.md` | 4,872 | 2026-08-22 (6 weeks ago) | *(none)* | **DELETE** | Parked work notes; unreferenced |
| `docs/PRIVACY_AND_BILLING_GUARDRAILS.md` | 3,686 | 2026-07-18 (3 months ago) | *(none)* | **KEEP** | Active billing and privacy guardrails referenced by admin routes and billing code |
| `docs/PRODUCT_CONTEXT.md` | 2,652 | 2026-07-19 (3 months ago) | *(none)* | **KEEP** | High-level product background context |
| `docs/QUESTION_BANK_SUMMARY.md` | 12,106 | 2026-07-30 (9 weeks ago) | *(none)* | **DELETE** | Dated summary of initial 100 questions (July 2026); bank is now >1,200 questions |
| `docs/QUESTION_SCHEMA.md` | 6,919 | 2026-09-04 (4 weeks ago) | *(none)* | **KEEP** | Core question schema specification |
| `docs/REVIEW_INDEPENDENCE_POLICY.md` | 3,412 | 2026-07-30 (9 weeks ago) | *(none)* | **KEEP** | Active editorial policy on independent cross-model review |
| `docs/RLS_TEST_PLAN.md` | 10,743 | 2026-07-24 (2 months ago) | *(none)* | **KEEP** | Active security test documentation referenced by CI and RLS tests |
| `docs/TAXONOMY.md` | 5,000 | 2026-07-22 (2 months ago) | *(none)* | **KEEP** | Canonical taxonomy specification |
| `docs/two-stream-reconciliation.md` | 32,979 | 2026-09-04 (4 weeks ago) | *(none)* | **DELETE** | Dated branch reconciliation report; unreferenced |
| `docs/UNFINISHED_NEXT_REPO_REUSE_AUDIT.md` | 31,229 | 2026-07-11 (3 months ago) | *(none)* | **DELETE** | Dated repo audit from July 2026; unreferenced |
| `docs/VISUAL_SCHEMA.md` | 5,279 | 2026-07-11 (3 months ago) | *(none)* | **KEEP** | Structured visual schema specification |
| `public/practice/subject/README.md` | 1,738 | 2026-08-09 (8 weeks ago) | *(none)* | **KEEP** | Asset directory README documenting subject art assets |
| `public/prototype/stitch/design-system.md` | 45,897 | 2026-09-22 (10 days ago) | *(none)* | **DELETE** | Stitch prototype design system export; superseded by live code |
| `src/features/adaptive-prototype/README.md` | 5,636 | 2026-08-21 (6 weeks ago) | *(none)* | **KEEP** | Technical README for the adaptive MST prototype spike |
| `AGENTS.md` | 1,813 | 2026-09-22 (10 days ago) | *(none)* | **KEEP** | Canonical agent instructions (updated with complete standing rules) |
| `OVERNIGHT-RUN-REPORT-2026-09-20.md` | 5,907 | 2026-09-22 (10 days ago) | *(none)* | **DELETE** | Dated overnight run report / log; unreferenced |
| `OVERNIGHT-RUN-REPORT.md` | 27,284 | 2026-08-20 (6 weeks ago) | *(none)* | **DELETE** | Dated overnight run report / log; unreferenced |
| `README.md` | 9,900 | 2026-07-19 (3 months ago) | *(none)* | **KEEP** | Canonical project README |

---

## Category 2: Dead Code & Orphan Components

Identified via Knip dead-code analysis and manual AST verification against student/parent/teacher/admin portals.

| Path | Size (bytes) | Type | Referenced By | Proposed Action | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/features/landing/_archive/Evidence.tsx` | 1,940 | React Component | *(none)* | **DELETE** | Archived old landing section, superseded by shipped redesign |
| `src/features/landing/_archive/Faq.tsx` | 3,008 | React Component | *(none)* | **DELETE** | Archived old landing FAQ section, superseded by shipped redesign |
| `src/features/landing/components/HelpIndex.tsx` | 5,182 | React Component | *(none - only comments)* | **DELETE** | Old composite Help index, superseded by canonical `/help` route |
| `src/features/landing/components/hub-presentation.ts` | 1,674 | TypeScript Util | HubGuideCard, HubMedia | **DELETE** | Supporting presentation code for unrendered old Hub library |
| `src/features/landing/components/HubGuideCard.tsx` | 1,902 | React Component | HubLibrary | **DELETE** | Guide card for unrendered old Hub library |
| `src/features/landing/components/HubHeroVisual.tsx` | 3,391 | React Component | HubLibrary | **DELETE** | Hero visual for unrendered old Hub library |
| `src/features/landing/components/HubLibrary.tsx` | 4,402 | React Component | *(none)* | **DELETE** | Old browsable Hub library; left unrendered in Step 4 redesign |
| `src/features/landing/components/HubMedia.tsx` | 3,101 | React Component | HubGuideCard, HubLibrary | **DELETE** | Media renderer for unrendered old Hub library |
| `public/hub/exam-timing.webp` | 30,508 | WebP Image | content.ts `hub` constant | **DELETE** | Unused image asset for old Hub library |
| `public/hub/multiple-choice.webp` | 30,448 | WebP Image | content.ts `hub` constant | **DELETE** | Unused image asset for old Hub library |
| `public/hub/skill-report.webp` | 84,600 | WebP Image | content.ts `hub` constant | **DELETE** | Unused image asset for old Hub library |
| `src/features/landing/content.ts` (`hub` object, lines 1292-1466) | ~4,200 | TypeScript Export | *(none)* | **DELETE BLOCK** | 175 lines of unused copy for old unrendered Hub library |
| `src/features/auth/components/RolePlaceholder.tsx` | 1,842 | React Component | *(none)* | **DELETE** | Unused placeholder component from early auth scaffold |
| `src/features/catalogue/components/CatalogueSkeleton.tsx` | 1,061 | React Component | *(none)* | **DELETE** | Unused skeleton component from early catalogue prototype |
| `e2e/fixtures/student-session.fixture.ts` | 2,735 | Test Fixture | *(none)* | **DELETE** | Unused legacy e2e fixture |
| `src/tests/unit/question-factory/g3-bank-reading-conventions-advance.ts` | 1,921 | TypeScript Script | *(none)* | **DELETE** | Ad-hoc CLI runner placed in unit test folder, not a test |
| `src/features/student/components/AssignmentsSummaryCard.tsx` | 4,484 | React Component | *(none)* | **DELETE** | Old student dashboard card replaced by Stitch dashboard port |
| `src/features/student/components/DashboardStatRail.tsx` | 6,303 | React Component | *(none)* | **DELETE** | Old student stat rail replaced by Stitch dashboard port |
| `src/features/student/components/LearnSidebar.tsx` | 4,185 | React Component | *(none)* | **DELETE** | Old sidebar replaced by StudentPortalShell |
| `src/features/student/components/MasterySnapshot.tsx` | 3,803 | React Component | *(none)* | **DELETE** | Old mastery snapshot replaced by Stitch dashboard port |
| `src/features/student/components/RecentAttemptsCard.tsx` | 5,165 | React Component | *(none - only comments)* | **DELETE** | Old attempts card replaced by RecentActivityCard |
| `src/features/student/components/SessionModeCards.tsx` | 4,528 | React Component | *(none)* | **DELETE** | Old session cards replaced by QuickActionsSection |

---

## Category 3: Next.js Routes Inventory

All 93 Next.js App Router routes were audited for sitemap inclusion, internal references, and public accessibility.

### Route Audit Summary
- **Total Routes:** 93 (66 Pages, 27 API/Auth Routes)
- **Clean & Documented (OK):** 55 routes
- **Authenticated / Internal Pages (Not in Sitemap by design):** 29 routes (Portal pages for Student/Parent/Teacher/Admin, Auth confirmation/reset, Results)
- **Dev / Internal Tools:** 2 routes (`/dev/routes`, `/showcase` — both protected by robots noindex)
- **Prototype Routes (Slated for Deletion):** 7 routes (`/prototype/*`)
- **Redirect Required:** Delete `/prototype/*` and add fallback redirect to `/` in `next.config.ts`.
- **Sitemap Hygiene:** In `src/app/sitemap.ts`, replace obsolete `/methodology` with canonical `/how-it-works`, and add live `/programs` and `/programs/[slug]`.

| Route | File Path | Type | In Sitemap? | Linked Internally? | Classification | Proposed Action | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/about` | `src/app/about/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/accessibility` | `src/app/accessibility/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/admin/intelligence` | `src/app/admin/intelligence/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/admin/operations` | `src/app/admin/operations/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/admin` | `src/app/admin/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/api/exam/guest-bank` | `src/app/api/exam/guest-bank/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/exam/session/active` | `src/app/api/exam/session/active/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/exam/session` | `src/app/api/exam/session/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/exam/session/[id]/responses` | `src/app/api/exam/session/[id]/responses/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/exam/session/[id]` | `src/app/api/exam/session/[id]/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/exam/session/[id]/submit` | `src/app/api/exam/session/[id]/submit/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/parent/children` | `src/app/api/parent/children/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/parent/children/[childId]` | `src/app/api/parent/children/[childId]/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/stripe/cancel` | `src/app/api/stripe/cancel/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/stripe/checkout` | `src/app/api/stripe/checkout/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/stripe/invoices` | `src/app/api/stripe/invoices/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/stripe/payment-method` | `src/app/api/stripe/payment-method/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/stripe/portal` | `src/app/api/stripe/portal/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/stripe/resume` | `src/app/api/stripe/resume/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/stripe/status` | `src/app/api/stripe/status/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/stripe/webhook` | `src/app/api/stripe/webhook/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/student/onboarding/complete` | `src/app/api/student/onboarding/complete/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/student/onboarding/preferences` | `src/app/api/student/onboarding/preferences/route.ts` | API | No | No | OK | **KEEP** |  |
| `/api/student/onboarding/questions` | `src/app/api/student/onboarding/questions/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/teacher/assignments` | `src/app/api/teacher/assignments/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/api/teacher/marking` | `src/app/api/teacher/marking/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/assessment-disclaimer` | `src/app/assessment-disclaimer/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/assessments` | `src/app/assessments/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/auth/callback` | `src/app/auth/callback/route.ts` | API | No | Yes | OK | **KEEP** |  |
| `/auth/confirm` | `src/app/auth/confirm/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/auth/reset` | `src/app/auth/reset/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/billing` | `src/app/billing/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/dev/routes` | `src/app/dev/routes/page.tsx` | PAGE | No | Yes | DEV_TOOL | **KEEP** | Internal developer route index (robots noindex) |
| `/exam` | `src/app/exam/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/exam-preparation` | `src/app/exam-preparation/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/exams` | `src/app/exams/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/exams/[patternId]` | `src/app/exams/[patternId]/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/help` | `src/app/help/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/how-it-works` | `src/app/how-it-works/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/learn` | `src/app/learn/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/` | `src/app/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/parent/children` | `src/app/parent/children/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/parent/curriculum-explorer` | `src/app/parent/curriculum-explorer/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/parent` | `src/app/parent/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/parent-guide` | `src/app/parent-guide/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/practice/australian-maths-competition` | `src/app/practice/australian-maths-competition/page.tsx` | PAGE | Yes | No | OK | **KEEP** |  |
| `/practice/icas` | `src/app/practice/icas/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/practice/maths-olympiad` | `src/app/practice/maths-olympiad/page.tsx` | PAGE | Yes | No | OK | **KEEP** |  |
| `/practice/naplan` | `src/app/practice/naplan/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/practice` | `src/app/practice/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/practice/scholarship-prep` | `src/app/practice/scholarship-prep/page.tsx` | PAGE | Yes | No | OK | **KEEP** |  |
| `/practice/selective-entry` | `src/app/practice/selective-entry/page.tsx` | PAGE | Yes | No | OK | **KEEP** |  |
| `/practice/session` | `src/app/practice/session/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/practice/singapore-maths` | `src/app/practice/singapore-maths/page.tsx` | PAGE | Yes | No | OK | **KEEP** |  |
| `/practice/[program]` | `src/app/practice/[program]/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/pricing` | `src/app/pricing/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/privacy` | `src/app/privacy/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/programs` | `src/app/programs/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/programs/[slug]` | `src/app/programs/[slug]/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/prototype/dashboard` | `src/app/prototype/dashboard/page.tsx` | PAGE | No | Yes | PROTOTYPE | **DELETE** | Internal mock prototype route (public/prototype/stitch/*) |
| `/prototype/exam-centre` | `src/app/prototype/exam-centre/page.tsx` | PAGE | No | Yes | PROTOTYPE | **DELETE** | Internal mock prototype route (public/prototype/stitch/*) |
| `/prototype/learning-hub` | `src/app/prototype/learning-hub/page.tsx` | PAGE | No | Yes | PROTOTYPE | **DELETE** | Internal mock prototype route (public/prototype/stitch/*) |
| `/prototype/lesson` | `src/app/prototype/lesson/page.tsx` | PAGE | No | Yes | PROTOTYPE | **DELETE** | Internal mock prototype route (public/prototype/stitch/*) |
| `/prototype` | `src/app/prototype/page.tsx` | PAGE | No | Yes | PROTOTYPE | **DELETE** | Internal mock prototype route (public/prototype/stitch/*) |
| `/prototype/practice-studio` | `src/app/prototype/practice-studio/page.tsx` | PAGE | No | Yes | PROTOTYPE | **DELETE** | Internal mock prototype route (public/prototype/stitch/*) |
| `/prototype/progress` | `src/app/prototype/progress/page.tsx` | PAGE | No | Yes | PROTOTYPE | **DELETE** | Internal mock prototype route (public/prototype/stitch/*) |
| `/resources` | `src/app/resources/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/resources/[slug]` | `src/app/resources/[slug]/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/results` | `src/app/results/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/showcase` | `src/app/showcase/page.tsx` | PAGE | No | Yes | DEV_TOOL | **KEEP** | Visual renderer component showcase |
| `/sign-in` | `src/app/sign-in/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/sign-up` | `src/app/sign-up/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/student/assignments` | `src/app/student/assignments/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/student/engagement` | `src/app/student/engagement/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/student/exam-preparation` | `src/app/student/exam-preparation/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/student/learn/english` | `src/app/student/learn/english/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/student/learn/lessons/[code]` | `src/app/student/learn/lessons/[code]/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/student/learn/mathematics` | `src/app/student/learn/mathematics/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/student/learn` | `src/app/student/learn/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/student` | `src/app/student/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/student/practice` | `src/app/student/practice/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/student-sign-in` | `src/app/student-sign-in/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/student-tips` | `src/app/student-tips/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |
| `/teacher/analytics` | `src/app/teacher/analytics/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/teacher/assignments/new` | `src/app/teacher/assignments/new/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/teacher/assignments` | `src/app/teacher/assignments/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/teacher/marking` | `src/app/teacher/marking/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/teacher/marking/[sessionId]/[questionId]` | `src/app/teacher/marking/[sessionId]/[questionId]/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/teacher` | `src/app/teacher/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/teacher/students` | `src/app/teacher/students/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/teacher/students/[id]` | `src/app/teacher/students/[id]/page.tsx` | PAGE | No | Yes | NOT_IN_SITEMAP | **KEEP** | Linked internally but not present in sitemap.ts |
| `/terms` | `src/app/terms/page.tsx` | PAGE | Yes | Yes | OK | **KEEP** |  |

### Prototype Files Slated for Deletion (21 Files, 519.5 KB)

| File Path | Size (bytes) | Proposed Action | Rationale |
| :--- | :--- | :--- | :--- |
| `src/app/prototype/page.tsx` | 2,813 | **DELETE** | Static Stitch prototype index |
| `src/app/prototype/StitchFrame.tsx` | 472 | **DELETE** | Iframe container for Stitch mock HTML |
| `src/app/prototype/dashboard/page.tsx` | 339 | **DELETE** | Prototype dashboard view |
| `src/app/prototype/exam-centre/page.tsx` | 360 | **DELETE** | Prototype exam centre view |
| `src/app/prototype/learning-hub/page.tsx` | 355 | **DELETE** | Prototype learning hub view |
| `src/app/prototype/lesson/page.tsx` | 346 | **DELETE** | Prototype lesson view |
| `src/app/prototype/practice-studio/page.tsx` | 373 | **DELETE** | Prototype practice studio view |
| `src/app/prototype/progress/page.tsx` | 340 | **DELETE** | Prototype progress view |
| `public/prototype/stitch/dashboard.html` | 21,316 | **DELETE** | Static HTML mock from Stitch |
| `public/prototype/stitch/dashboard.png` | 53,458 | **DELETE** | Static PNG thumbnail from Stitch |
| `public/prototype/stitch/design-system.md` | 45,897 | **DELETE** | Stitch prototype design system notes |
| `public/prototype/stitch/exam-centre.html` | 36,420 | **DELETE** | Static HTML mock from Stitch |
| `public/prototype/stitch/exam-centre.png` | 52,056 | **DELETE** | Static PNG thumbnail from Stitch |
| `public/prototype/stitch/learning-hub.html` | 36,215 | **DELETE** | Static HTML mock from Stitch |
| `public/prototype/stitch/learning-hub.png` | 50,086 | **DELETE** | Static PNG thumbnail from Stitch |
| `public/prototype/stitch/lesson.html` | 24,986 | **DELETE** | Static HTML mock from Stitch |
| `public/prototype/stitch/lesson.png` | 42,945 | **DELETE** | Static PNG thumbnail from Stitch |
| `public/prototype/stitch/practice-studio.html` | 25,948 | **DELETE** | Static HTML mock from Stitch |
| `public/prototype/stitch/practice-studio.png` | 43,268 | **DELETE** | Static PNG thumbnail from Stitch |
| `public/prototype/stitch/progress.html` | 29,244 | **DELETE** | Static HTML mock from Stitch |
| `public/prototype/stitch/progress.png` | 52,656 | **DELETE** | Static PNG thumbnail from Stitch |

---

## Category 4: Repo Junk, Stray Scripts & Committed Screenshots

### Committed Screenshots under `docs/` (41 Files, 7.01 MB)

| Path | Size (bytes) | Status / References | Proposed Action | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `docs/screenshots/amc/*.png` (11 files) | 2,541,749 | Unreferenced | **DELETE** | Unreferenced screenshots of AMC exploration cards |
| `docs/overnight/screenshots/assessment-capabilities/*.png` (16 files) | 2,217,992 | Generated by e2e tests | **DELETE & GITIGNORE** | Ephemeral test output; e2e auto-creates directory on demand |
| `docs/curriculum/screenshots/lessons/*.png` (5 files) | 921,758 | Referenced only by deleted reports | **DELETE** | Ephemeral report attachments from August 2026 |
| `docs/curriculum/screenshots/lessons-l3/*.png` (4 files) | 701,661 | Referenced only by deleted reports | **DELETE** | Ephemeral report attachments from August 2026 |
| `docs/curriculum/screenshots/*.png` (5 files) | 623,532 | Referenced only by deleted reports | **DELETE** | Ephemeral report attachments from August 2026 |

### Stray / One-Off Scripts

| Script Path | Size (bytes) | Referenced By | Proposed Action | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `.claude/worktrees/build-dev/cleanup-worktrees-2026-09-23.sh` | 7,660 | *(none)* | **DELETE / PURGE** | One-off bash cleanup script left in old worktree |
| `scripts/capture-l3-complete-screenshots.mts` | 5,744 | *(none)* | **DELETE** | One-off screenshot capture script; unreferenced |
| `scripts/capture-lesson-screenshots.mts` | 6,125 | *(none)* | **DELETE** | One-off screenshot capture script; unreferenced |
| `scripts/capture-parent-explorer-screenshots.mts` | 4,779 | *(none)* | **DELETE** | One-off screenshot capture script; unreferenced |
| `scripts/audit-g5-detailed-matrix.mts` | 2,519 | *(none)* | **DELETE** | One-off audit calculation script; unreferenced |
| `scripts/check-w2-batch.mts` | 4,792 | *(none)* | **DELETE** | One-off batch verification script; unreferenced |

### Editor & AI-Tool Dotfolders (.gitignore update)

The following assistant/editor folders were discovered untracked in local developer checkouts and will be added to `.gitignore` to prevent accidental check-in:
- `.cursor/`
- `.windsurf/`
- `.codebuddy/`
- `.codex/`
- `.continue/`
- `.freebuff/`
- `.gemini/`
- `.kiro/`
- `.opencode/`
- `.playwright-cli/`
- `.playwright-mcp/`
- `.qoder/`
- `.roo/`
- `.roorules`
- `.trae/`
- `docs/overnight/screenshots/`

---

## Category 5: Agent-Instruction Files & Proposed Canonical AGENTS.md

### Current Agent Files Discovered
- `AGENTS.md` (1,813 bytes) — Tracked in git root.
- `.roorules` (1,457 bytes) — Tracked in git root.
- `CLAUDE.md` (781 bytes) — Untracked/gitignored in main checkout (local graphify configuration).
- `.cursor/`, `.windsurf/` — Untracked skill and tool cache in local checkout.

### Proposed Action
1. **DELETE** `.roorules` from git tracking and add to `.gitignore`.
2. **KEEP & UPDATE** `AGENTS.md` as the **SINGLE CANONICAL** instruction file holding all standing engineering rules.
3. **UPDATE** `CLAUDE.md` to be a simple one-line pointer to `AGENTS.md` (if Claude Code requires it).

### Proposed Canonical AGENTS.md Specification
```markdown
# MindMosaic Repository Instructions & Standing Rules

## Core Rules & Git Workflow

1. **Own Worktree Off Fresh `origin/dev`:** Always create and work inside a dedicated worktree branched from fresh `origin/dev`.
2. **Short-Lived Branches:** Branch names must be descriptive (e.g. `feat/...`, `fix/...`, `chore/...`). Open PRs directly into `dev`. Branches are deleted immediately upon merge.
3. **Never Commit in Main Checkout:** The primary repository checkout is read-only. All changes must be developed and committed in worktrees.
4. **Never Push to `main`:** The `main` branch is production. Releases are exclusively `dev` → `main` pull requests merged by the repository owner.
5. **Full CI Green Before Merge:** All pull requests must pass the full CI suite before merging.
6. **Fix Components, Not Tests:** Never weaken, disable, or delete assertion logic in tests to force a pass. Fix the underlying component or logic.
7. **Published-Only + Fail-Closed:** Only items with valid, published, tamper-evident manifest entries may be served to students. Any integrity mismatch must fail closed.
8. **Human Gate (`approvedBy`):** Content publication requires human sign-off (`approvedBy`). AI models may draft or audit, but human approval is mandatory.
9. **Zero Fabrication:** Never fabricate progress, fake test results, or claim features work without verified evidence.
10. **Design Specification is Mandatory:** `docs/design.md` (v2.2) is the single canonical source of truth for all visual styling, tokens, typography, and component specs.

## Product & Content Integrity

- **Product Scope:** MindMosaic is a Grade 3 and Grade 5 NAPLAN-style and ICAS-style practice portal.
- **Originality Guarantee:** All practice questions must be strictly original. Never copy official NAPLAN, ICAS, textbook, website, or commercial questions.
- **Visuals:** Structured visual JSON rendered deterministically as HTML or SVG. No arbitrary unsanitised SVG.

## Pre-Commit Verification Gate

Before submitting a PR, verify:
```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run validate:questions
npm run check:answers -- --include-published
npm run questions:validate-ledger
npm run test:rls
npm run test:e2e
npm run test:e2e:auth
```
```

---

## Category 6: Report-Only Items (Needs Owner Decision — NOT Deleted in this PR)

Per project instructions, the following two content items are reported with full sizing and context, and will **NOT** be touched or deleted in this PR pending owner instruction:

### 1. `practiceQuestionSeeds` (1,103 Questions, Unserved)
- **File Path:** `src/content/questions/generated/generated-questions.ts`
- **File Size:** 1,045,119 bytes (1.05 MB), 10,500+ lines of TypeScript
- **Current State:** Retired from learner-servable banks on 2026-08-31 (`aaf06e9`). Zero seeds leak into runtime pools or guest banks. Guarded by 5 active unit tests (`stop-serving-ungated-seeds.test.ts`, `published-bank-reachability.test.ts`, `extended-bank-opt-in.test.ts`, `answer-position-bias.test.ts`, `lessons/validate-lessons-trust-boundary.test.ts`).
- **Decision Options for Owner:**
  - **Option A (Delete):** Permanently remove `src/content/questions/generated/generated-questions.ts` and refactor the 5 guard tests to assert against historical JSON fixtures.
  - **Option B (Keep as Factory Input):** Move the seeds out of `src/` into an unserved authoring compartment (e.g. `content/seeds/`) to keep runtime bundle clean while preserving raw material for future question-factory re-ingestion.

### 2. `content/manual-questions/_conflicts` Quarantine
- **Directory:** `content/manual-questions/_conflicts/`
- **Total Files:** 30 files (15 question batch JSON files + 15 audit ledger files)
- **Total Size:** 954,468 bytes (932.1 KB)
- **Content:** Quarantined manual batches (including the ~200 Year 5 Science items) held for independent cross-model review or schema adjustments.
- **Disposition:** **Leave as-is.** It is tracked authoring content protected by repository policy.

---

## Verification & Next Steps (Phase 2)

Once the owner types **"APPROVE"** (with any specific inclusions or exclusions), Phase 2 will execute:
1. **Commit 1 (Documentation):** Delete the 133 approved markdown files; merge imagery guidelines into `docs/design.md`.
2. **Commit 2 (Dead Code & Hub Components):** Delete `src/features/landing/_archive/`, the 6 orphan hub components, unused images in `public/hub/`, and unrendered student components.
3. **Commit 3 (Prototype Routes & Mocks):** Delete `/prototype` routes and `public/prototype/stitch/*`; add fallback redirect in `next.config.ts`; update `src/app/sitemap.ts`.
4. **Commit 4 (Repo Junk & Dotfolders):** Delete stray scripts and committed screenshots; update `.gitignore`.
5. **Commit 5 (Agent Instructions):** Consolidate into canonical `AGENTS.md`, delete `.roorules`.
6. **Full Validation Gate:** Run typecheck, lint, vitest, build, question gates, RLS suite, e2e suites, and knip.
7. **PR & Merge:** Open PR into `dev` and report final commit SHA.
