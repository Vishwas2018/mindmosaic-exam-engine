# MindMosaic Defect Log (Round 1)

**Date**: 2026-11-11  
**Baseline**: `9d89671e`  
**Current HEAD**: `707821dc`  
**Branch**: `feat/workspace-design-completion-r1`

---

## Defects Identified & Addressed

| ID | Workspace | Description | Severity | Status | Resolution |
|---|---|---|---|---|---|
| DEF-001 | Auth | `/sign-in` lacked the dedicated "Who is signing in?" entry chooser cards (Parent vs Student) matching artboards 01-03 | Medium | **CLOSED** | Implemented segmented role choice and entry cards on `/sign-in` with switching support |
| DEF-002 | Student | Standalone question review layout (`01_standalone_review.html`) needed integration into `/results` review view with filter buttons and working solution cards | High | **CLOSED** | Integrated full 5-way filter bar (All, Wrong, Not answered, Flagged, Not yet marked) and explanation banners |
| DEF-003 | Billing | Billing states (payment failed, cancellation scheduled, free comparison) required matching alert banners and CTA controls | Medium | **CLOSED** | Enhanced `SubscriptionOverviewCard` with payment failed and cancellation scheduled banners and actions |
| DEF-004 | Admin | Operations and review queues needed tabbed alignment with Paper review, Support, and Activity history artboards | Medium | **CLOSED** | Reconciled Admin Workspace views with all 27 artboards; dev safety guards active |
| DEF-005 | Parent | Onboarding first child provisioning cards and print sign-in card layout needed direct matching with artboards 01-05 | Medium | **CLOSED** | Added "Print a sign-in card" button and credential copy controls to `AddChildCard` |
| DEF-006 | CI | ESLint scanned uncompiled canvas templates in `docs/` | Low | **CLOSED** | Added extracted canvas specs to `globalIgnores` in `eslint.config.mjs` |
