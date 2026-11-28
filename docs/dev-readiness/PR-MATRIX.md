# Open PR Integration Matrix — DEV Manual Testing Release 1

**Snapshot Date:** 11 November 2026  
**Integration Branch:** `integration/dev-manual-testing-20261111`  
**Base:** `origin/dev` (`17d8be2f`)  
**Target Environments:**
- DEV Supabase: `mfglzabnayacssgertat`
- PROD Supabase: `uermhsptduikehuyceiz` (STRICTLY OFF-LIMITS)

---

## 1. Targeted Feature Workstreams & Integration Status

| PR | Branch / Head SHA | Target | Status | Integration Decision | Resolution & Rationale |
|---|---|---|---|---|---|
| **#91** | `fix/exam-legacy-write-rpc-server-only`<br>`ed52ef99` | `dev` | Merged (Clean FF) | **INTEGRATED** | Security critical: removes client-writable exam submission RPCs and enforces least-privilege server writer. Requires DEV migrations `20261031090000` & `20261031090100` on `mfglzabnayacssgertat`. |
| **#93** | `fix/auth-device-independent-links`<br>`75549435` | `dev` | Merged (Clean) | **INTEGRATED** | Auth foundation: token hashing, device-independent confirmation and recovery links. |
| **#94** | `fix/auth-recovery-verified`<br>`46592735` | `fix/auth-device-independent-links` | Merged (Clean) | **INTEGRATED** | Auth security: server-validated recovery sessions, cold reset refusal, single-use token consumption. |
| **Auth Phase 2** | `feat/auth-journey-phase2`<br>`6fea19e2` | `dev` | Merged (Clean) | **INTEGRATED** | Completes authentication lifecycle: `/auth/forgot`, `/auth/reset`, `/auth/signed-out`, `/auth/session-expired`, and `/student-help`. |
| **#99** | `feat/practice-studio-availability-logic`<br>`23d5d212` | `dev` | Merged (Via #104) | **INTEGRATED** | Student foundation: Practice Studio drill availability rules and curriculum constraints. |
| **#100** | `feat/student-nav-shell`<br>`e4b8834d` | `dev` | Merged (Via #104) | **INTEGRATED** | Student foundation: Student navigation shell, breadcrumbs, responsive topbar and sidebar. |
| **#101** | `feat/my-space`<br>`128268dc` | `dev` | Merged (Via #104) | **INTEGRATED** | Student portal: My Space dashboard with real child session data and goal tracking. |
| **#102** | `feat/practice-studio`<br>`92a0a172` | `dev` | Merged (Via #104) | **INTEGRATED** | Student portal: Practice Studio catalogue and practice mode configuration. |
| **#103** | `feat/learning-hub`<br>`322d3f7e` | `dev` | Merged (Via #104) | **INTEGRATED** | Student portal: Learning Hub with Victorian curriculum pathways, English and Mathematics lessons. |
| **#104** | `feat/practice-runner`<br>`2b3b5f69` | `dev` | Merged (Clean) | **INTEGRATED** | Student practice runner: live question rendering, client-side answer state, pure scoring dispatch. Verified functional tip. |
| **#106** | `feat/parent-nav-shell-primitives`<br>`dd00db1a` | `dev` | Merged (Via #117) | **INTEGRATED** | Parent foundation: Shell primitives, navigation tokens, responsive layout boundaries. |
| **#107** | `feat/parent-family-overview`<br>`bb067237` | `dev` | Merged (Via #117) | **INTEGRATED** | Parent portal: Family overview, multi-child cards, active practice summaries. |
| **#113** | `feat/parent-child-profiles`<br>`4a472d65` | `dev` *(formerly main)* | Retargeted & Merged | **INTEGRATED** | **Blocker Resolved:** Incorrectly targeted `main`; retargeted to `dev` via `gh pr edit 113 --base dev`. Merged cleanly. |
| **#114** | `feat/parent-child-progress`<br>`5e798381` | `dev` | Merged (Via #117) | **INTEGRATED** | Parent portal: Detailed child progress analytics, domain breakdown, question-level review. |
| **#115** | `feat/parent-account-billing`<br>`c164a38e` | `dev` | Merged (Via #117) | **INTEGRATED** | Parent portal: Account settings, subscription status, invoice history. |
| **#116** | `feat/parent-writing-assessment`<br>`a27b889d` | `dev` | Merged (Via #117) | **INTEGRATED** | Parent portal: Writing assessment review, rubric feedback display. |
| **#117** | `feat/parent-help-journey-completion`<br>`eb221f76` | `dev` | Merged (Clean) | **INTEGRATED** | Parent portal: Comprehensive Help Centre, FAQ search, and contact escalation. Tip of Parent stack. |
| **#111** | `feat/admin-workspace-preview`<br>`27bdeed1` | `dev` | Merged (Clean) | **INTEGRATED** | Admin: Preserves authenticated administrative tools while isolating new workspace artboards. |
| **#109** | `feat/student-workspace-preview`<br>`65d62eb9` | `dev` | **EXCLUDED** | **BLOCKED (OWNER TASK ASSIGNED)** | Replaced authenticated routes (`/student`, `/student/learn`, `/student/practice`, `/student/results`) with static `<StudentCanvasScreen>` mockups. Functional tip `2b3b5f69` (#104) integrated instead. |
| **#108** | `feat/parent-workspace-ui`<br>`ff560a7b` | `dev` | **EXCLUDED** | **SUPERSEDED** | Divergent visual preview branch. Superseded by the functional Parent stack (#106–#117). |
| **#110** | `feat/auth-workspace-preview`<br>`40a705a7` | `dev` | **EXCLUDED** | **DEFERRED** | Visual artboards only; does not deliver real authentication runtime logic. |
| **#112** | `feat/billing-workspace-preview`<br>`d895d150` | `dev` | **EXCLUDED** | **DEFERRED** | Optional billing UI preview; outside minimum integration journey. |

---

## 2. Ancestry & Merge Sequence

```text
origin/dev (17d8be2f)
  │
  ├── [Merge 1] origin/fix/exam-legacy-write-rpc-server-only (ed52ef99) [PR #91]
  │
  ├── [Merge 2] origin/feat/auth-journey-phase2 (6fea19e2) [Contains #93, #94]
  │
  ├── [Merge 3] origin/feat/practice-runner (2b3b5f69) [Contains #99, #100, #101, #102, #103, #104]
  │
  ├── [Merge 4] origin/feat/parent-help-journey-completion (eb221f76) [Contains #106, #107, #113, #114, #115, #116, #117]
  │     └─ Conflict Resolution: src/features/auth/AuthProvider.tsx (64702d1c)
  │
  ├── [Merge 5] origin/feat/admin-workspace-preview (27bdeed1) [PR #111]
  │
  └── [Post-Merge Hardening]
        ├─ 0dbffad2: Remove src/app/parent/loading.tsx (fixes Next.js notFound streaming boundary)
        └─ 0ee1f828: Route navigation graph & spy cleanup (aligns /parent/settings & auth tests)
```

---

## 3. Conflict Resolution Audit

### Conflict: `src/features/auth/AuthProvider.tsx`
- **Causes:** PR #94 and `feat/auth-journey-phase2` added session recovery methods (`verifyEmailToken`, `verifyRecoveryToken`, `verifyRecoverySession`, `clearRecoverySession`), while the Parent stack (#106–#117) introduced `export { AuthContext }` for consumer hooks.
- **Resolution (`64702d1c`):** Preserved all authentication safeguards, session validation, and recovery lifecycle methods while properly exporting `AuthContext`.
- **Verification:** `src/tests/components/reset-password-expired.test.tsx` (25/25 passed) and `vitest` full suite passed.

### Loading Boundary Violation: `src/app/parent/loading.tsx`
- **Cause:** Dynamic child routes (`/parent/children/[childId]`, `/parent/results/[id]`) throw `notFound()` on unauthorized access. Wrapping `/parent` in `loading.tsx` causes Next.js App Router Suspense to stream HTTP 200 headers before the 404 response can be sent.
- **Resolution (`0dbffad2`):** Removed root `src/app/parent/loading.tsx`, aligning `/parent` with `/practice` and `/teacher`.
- **Verification:** `src/tests/unit/route-loading-boundaries.test.ts` (10/10 passed) and `src/tests/components/route-boundaries.test.tsx` (41/41 passed).

### Navigation Graph Completeness: `/parent/settings`
- **Cause:** `src/tests/unit/navigation-graph.test.ts` requires all parent settings screens to provide clear back-navigation to the parent account hub.
- **Resolution (`0ee1f828`):** Added `<Link href="/parent/account">` back-link in `src/app/parent/settings/page.tsx`.
- **Verification:** `src/tests/unit/navigation-graph.test.ts` (3/3 passed).

---

## 4. Workstream Coordination Tasks

### Task Assigned to Student Workstream Owner (`feat/student-workspace-preview` / #109):
- **Finding:** PR #109 (`65d62eb9`) replaces authenticated student pages (`/student`, `/student/learn`, `/student/practice`, `/student/results`) with static `<StudentCanvasScreen>` mockups.
- **Action Required:**
  1. Mount design canvas screens under isolated preview routes (e.g. `/dev/student-preview` or behind `NEXT_PUBLIC_STUDENT_PREVIEW=1`).
  2. Restore authenticated student pages to consume live database records from `feat/practice-runner` (`2b3b5f69`).
  3. Ensure query parameters like `state=first-visit` are disabled in authenticated routes.
