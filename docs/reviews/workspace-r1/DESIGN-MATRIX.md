# MindMosaic Design-to-Implementation Matrix (Round 1)

**Date**: 2026-11-11  
**Baseline**: 9d89671e  
**Total Artboards Audited**: 96  

Classifications:
- **COMPLETE**: Functional and visually aligned with approved artboard.
- **PARTIAL**: Functional but missing design elements or tokens.
- **LEGACY**: Functional but uses older layout / styling.
- **PREVIEW ONLY**: Prototype design exists without live application integration.
- **MISSING**: Intended route or state does not exist in application.
- **REFERENCE**: Informational map, inventory, decision or dependency artboard.

---


## Student-Question-Review (1 artboards)

| # | Artboard Title | Intended Route | Implementation File | Status | Priority | Notes |
|---|---|---|---|---|---|---|
| 01 | Review every question | `/results/review` | `src/app/results/page.tsx` | **PARTIAL** | P1 | Standalone question review with working solution |

## Plan-Billing (7 artboards)

| # | Artboard Title | Intended Route | Implementation File | Status | Priority | Notes |
|---|---|---|---|---|---|---|
| 01 | Plan & billing — Family active | `/billing` | `src/app/billing/page.tsx` | **COMPLETE** | P3 | Active Family plan dashboard desktop |
| 02 | Plan & billing — mobile, Family active | `/billing` | `src/app/billing/page.tsx` | **COMPLETE** | P3 | Active Family plan mobile |
| 03 | Plan & billing — payment failed | `/billing` | `src/app/billing/page.tsx` | **COMPLETE** | P3 | Payment failed banner & card update |
| 04 | Plan & billing — cancellation scheduled | `/billing` | `src/app/billing/page.tsx` | **COMPLETE** | P3 | Cancellation scheduled notice & keep plan CTA |
| 05 | Plan & billing — free account | `/billing` | `src/app/billing/page.tsx` | **COMPLETE** | P3 | Free account plan comparison table |
| 06 | Plan & billing — loading, empty and error states | `/billing` | `src/app/billing/page.tsx` | **COMPLETE** | P3 | Loading skeleton and error retry |
| 07 | Plan & billing — mobile failed and cancelling | `/billing` | `src/app/billing/page.tsx` | **COMPLETE** | P3 | Mobile failed payment & cancellation |

## Authentication (26 artboards)

| # | Artboard Title | Intended Route | Implementation File | Status | Priority | Notes |
|---|---|---|---|---|---|---|
| 01 | Welcome — who is signing in? | `/sign-in` | `src/app/sign-in/page.tsx` | **PARTIAL** | P1 | Welcome chooser (Parent vs Student) |
| 02 | Welcome — tablet | `/sign-in` | `src/app/sign-in/page.tsx` | **PARTIAL** | P1 | Welcome tablet reflow |
| 03 | Welcome — mobile | `/sign-in` | `src/app/sign-in/page.tsx` | **PARTIAL** | P1 | Welcome mobile reflow |
| 04 | Parent sign-in | `/sign-in` | `src/features/auth/components/SignInPanel.tsx` | **COMPLETE** | P3 | Parent sign-in desktop form |
| 05 | Create a family account | `/sign-up` | `src/features/auth/components/SignUpWizard.tsx` | **PARTIAL** | P1 | Create family account flow |
| 06 | Sign-in & signup — states | `/sign-in` | `src/features/auth/components/SignInPanel.tsx` | **COMPLETE** | P3 | Loading, error, cooldown states |
| 07 | Parent sign-in — tablet | `/sign-in` | `src/app/sign-in/page.tsx` | **COMPLETE** | P3 | Parent sign-in tablet |
| 08 | Parent sign-in — mobile | `/sign-in` | `src/app/sign-in/page.tsx` | **COMPLETE** | P3 | Parent sign-in mobile |
| 09 | Create a family account — mobile | `/sign-up` | `src/app/sign-up/page.tsx` | **PARTIAL** | P1 | Create family account mobile |
| 10 | Check your inbox | `/auth/confirm` | `src/features/auth/components/EmailConfirmationPending.tsx` | **COMPLETE** | P3 | Check your inbox pending screen |
| 11 | Email verification — states | `/auth/confirm` | `src/features/auth/components/EmailVerificationScreen.tsx` | **COMPLETE** | P3 | Email verification token states |
| 12 | Reset your password | `/auth/forgot` | `src/app/auth/forgot/page.tsx` | **COMPLETE** | P3 | Reset password request |
| 13 | Set a new password | `/auth/reset` | `src/app/auth/reset/page.tsx` | **COMPLETE** | P3 | Set new password with tokens |
| 14 | Forgot password — states | `/auth/forgot` | `src/app/auth/forgot/page.tsx` | **COMPLETE** | P3 | Forgot password feedback & cooldown |
| 15 | Student sign-in | `/student-sign-in` | `src/app/student-sign-in/page.tsx` | **COMPLETE** | P3 | Student 8-char code + 6-PIN desktop |
| 16 | Student sign-in — states | `/student-sign-in` | `src/features/auth/components/SignInPanel.tsx` | **COMPLETE** | P3 | Student sign-in validation & error states |
| 17 | Student sign-in — mobile | `/student-sign-in` | `src/app/student-sign-in/page.tsx` | **COMPLETE** | P3 | Student sign-in mobile |
| 18 | Can’t sign in? | `/student-sign-in/help` | `src/app/student-sign-in/page.tsx` | **PARTIAL** | P1 | Can’t sign in modal / helper |
| 19 | Session expired | `/auth/session-expired` | `src/app/auth/session-expired/page.tsx` | **COMPLETE** | P3 | Session expiration guard |
| 20 | Account paused or unavailable | `/auth/account-paused` | `src/app/auth/session-expired/page.tsx` | **PARTIAL** | P1 | Account paused / unavailable |
| 21 | Who’s signing in? | `/auth/choose-profile` | `src/app/sign-in/page.tsx` | **PARTIAL** | P1 | Fast family profile chooser |
| 22 | Signed out | `/auth/signed-out` | `src/app/auth/signed-out/page.tsx` | **COMPLETE** | P3 | Signed out confirmation |
| 23 | Authentication — map | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Architecture map |
| 24 | Authentication — inventory | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Screen inventory |
| 25 | Authentication — decisions | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Design decisions |
| 26 | Authentication — dependencies | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Backend dependencies |

## Admin (27 artboards)

| # | Artboard Title | Intended Route | Implementation File | Status | Priority | Notes |
|---|---|---|---|---|---|---|
| 01 | Admin — Overview | `/admin` | `src/app/admin/page.tsx` | **COMPLETE** | P3 | Admin overview dashboard |
| 02 | Admin — Overview, tablet | `/admin` | `src/app/admin/page.tsx` | **COMPLETE** | P3 | Admin overview tablet |
| 03 | Admin — Question library | `/admin/review` | `src/app/admin/review/page.tsx` | **COMPLETE** | P3 | Question library with filters |
| 04 | Admin — Question library, tablet | `/admin/review` | `src/app/admin/review/page.tsx` | **COMPLETE** | P3 | Question library tablet |
| 05 | Overview & library — states | `/admin/review` | `src/app/admin/review/page.tsx` | **COMPLETE** | P3 | Loading, empty and error states |
| 06 | Admin — Question review | `/admin/review` | `src/app/admin/review/page.tsx` | **COMPLETE** | P3 | 3-column question review experience |
| 07 | Question review — mobile | `/admin/review` | `src/app/admin/review/page.tsx` | **COMPLETE** | P3 | Question review mobile |
| 08 | Question review — states | `/admin/review` | `src/app/admin/review/page.tsx` | **COMPLETE** | P3 | Flagged, stale and editing states |
| 09 | Admin — Human approval | `/admin/operations` | `src/app/admin/operations/page.tsx` | **COMPLETE** | P3 | Human approval queue & controls |
| 10 | Human approval — mobile | `/admin/operations` | `src/app/admin/operations/page.tsx` | **COMPLETE** | P3 | Human approval mobile |
| 11 | Approval — states | `/admin/operations` | `src/app/admin/operations/page.tsx` | **COMPLETE** | P3 | Approval states |
| 12 | Admin — Paper review | `/admin/operations` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Paper review structure & question order |
| 13 | Paper review — states | `/admin/operations` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Paper review states |
| 14 | Admin — Publication | `/admin/operations` | `src/app/admin/operations/page.tsx` | **COMPLETE** | P3 | Publication ledger & readiness |
| 15 | Publication — states | `/admin/operations` | `src/app/admin/operations/page.tsx` | **COMPLETE** | P3 | Publication blocked & unpublish states |
| 16 | Admin — Writing review | `/admin/writing` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Writing review rubric & queue |
| 17 | Writing review — mobile | `/admin/writing` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Writing review mobile |
| 18 | Writing review — states | `/admin/writing` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Writing review states |
| 19 | Admin — Support | `/admin/operations` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Support cases queue |
| 20 | Support — mobile | `/admin/operations` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Support mobile |
| 21 | Support — states | `/admin/operations` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Support states |
| 22 | Admin — Activity history | `/admin/operations` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Activity audit history |
| 23 | Activity — states | `/admin/operations` | `src/app/admin/operations/page.tsx` | **PARTIAL** | P1 | Activity states |
| 24 | Admin — map | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Admin path map |
| 25 | Admin — inventory | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Admin inventory |
| 26 | Admin — decisions | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Admin decisions |
| 27 | Admin — dependencies | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Admin dependencies |

## Parent (35 artboards)

| # | Artboard Title | Intended Route | Implementation File | Status | Priority | Notes |
|---|---|---|---|---|---|---|
| 01 | Welcome — add your first child | `/parent/onboarding` | `src/features/parent-dashboard/components/AddChildCard.tsx` | **PARTIAL** | P1 | Welcome add first child modal/page |
| 02 | Aisha is ready | `/parent/onboarding/ready` | `src/features/parent-dashboard/components/AddChildCard.tsx` | **PARTIAL** | P1 | Child ready credentials print/card |
| 03 | Setup — states | `/parent/onboarding` | `src/features/parent-dashboard/components/AddChildCard.tsx` | **PARTIAL** | P1 | Setup error & validation states |
| 04 | Welcome — tablet | `/parent/onboarding` | `src/features/parent-dashboard/components/AddChildCard.tsx` | **PARTIAL** | P1 | Welcome onboarding tablet |
| 05 | Welcome — mobile | `/parent/onboarding` | `src/features/parent-dashboard/components/AddChildCard.tsx` | **PARTIAL** | P1 | Welcome onboarding mobile |
| 06 | Family Overview | `/parent` | `src/app/parent/page.tsx` | **COMPLETE** | P3 | Family Overview dashboard |
| 07 | Family Overview — first visit | `/parent` | `src/app/parent/page.tsx` | **COMPLETE** | P3 | First visit state (empty dashboard) |
| 08 | Family Overview — states | `/parent` | `src/app/parent/page.tsx` | **COMPLETE** | P3 | Loading, empty, insufficient evidence states |
| 09 | Family Overview — tablet | `/parent` | `src/app/parent/page.tsx` | **COMPLETE** | P3 | Family Overview tablet |
| 10 | Family Overview — mobile | `/parent` | `src/app/parent/page.tsx` | **COMPLETE** | P3 | Family Overview mobile |
| 11 | Children | `/parent/children` | `src/app/parent/children/page.tsx` | **COMPLETE** | P3 | Children directory & login codes |
| 12 | Aisha — profile | `/parent/children/[childId]` | `src/app/parent/children/[childId]/page.tsx` | **COMPLETE** | P3 | Child profile, PIN reset, year level |
| 13 | Children — states | `/parent/children/[childId]` | `src/app/parent/children/[childId]/page.tsx` | **COMPLETE** | P3 | Archive, pause, plan limit states |
| 14 | Children — tablet | `/parent/children` | `src/app/parent/children/page.tsx` | **COMPLETE** | P3 | Children directory tablet |
| 15 | Children — mobile | `/parent/children` | `src/app/parent/children/page.tsx` | **COMPLETE** | P3 | Children directory mobile |
| 16 | Aisha — progress | `/parent/children/[childId]/progress` | `src/app/parent/children/[childId]/progress/page.tsx` | **COMPLETE** | P3 | Child progress & strand charts |
| 17 | Result — NAPLAN-style Reading | `/parent/results/[id]` | `src/app/parent/results/[id]/page.tsx` | **COMPLETE** | P3 | Assessment result detail |
| 18 | Answer review | `/parent/results/[id]/review` | `src/app/parent/results/[id]/review/page.tsx` | **COMPLETE** | P3 | Answer review & explanations |
| 19 | Child Progress — states | `/parent/children/[childId]/progress` | `src/app/parent/children/[childId]/progress/page.tsx` | **COMPLETE** | P3 | Progress states & low evidence |
| 20 | Aisha — progress, mobile | `/parent/children/[childId]/progress` | `src/app/parent/children/[childId]/progress/page.tsx` | **COMPLETE** | P3 | Progress dashboard mobile |
| 21 | Learning for Aisha | `/parent/children/[childId]/learning` | `src/app/parent/children/[childId]/learning/page.tsx` | **COMPLETE** | P3 | Child-specific learning hub |
| 22 | Preview — Year 3 Numeracy | `/parent/children/[childId]/learning/preview` | `src/app/parent/children/[childId]/learning/preview/page.tsx` | **COMPLETE** | P3 | Curriculum preview Year 3/5 |
| 23 | Learning — mobile | `/parent/children/[childId]/learning` | `src/app/parent/children/[childId]/learning/page.tsx` | **COMPLETE** | P3 | Learning hub mobile |
| 24 | Account | `/parent/account` | `src/app/parent/account/page.tsx` | **COMPLETE** | P3 | Parent account settings & security |
| 25 | Account — states | `/parent/account` | `src/app/parent/account/page.tsx` | **COMPLETE** | P3 | Account states, sessions, data export |
| 26 | Plan & billing — handoff | `/parent/account/billing` | `src/app/parent/account/billing/page.tsx` | **COMPLETE** | P3 | Billing handoff from account |
| 27 | Account — mobile | `/parent/account` | `src/app/parent/account/page.tsx` | **COMPLETE** | P3 | Account settings mobile |
| 28 | Help Centre | `/parent/help` | `src/app/parent/help/page.tsx` | **COMPLETE** | P3 | Parent Help Centre & search |
| 29 | Help — article and contact | `/parent/help` | `src/app/parent/help/page.tsx` | **COMPLETE** | P3 | Help article & support form |
| 30 | Help Centre — mobile | `/parent/help` | `src/app/parent/help/page.tsx` | **COMPLETE** | P3 | Help Centre mobile |
| 31 | Parent journey — map | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Parent journey map |
| 32 | Parent journey — inventory | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Screen inventory |
| 33 | Parent journey — components | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Component inventory |
| 34 | Parent journey — decisions | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Design decisions |
| 35 | Parent journey — dependencies | `N/A` | `docs/architecture` | **REFERENCE** | P4 | Dependencies |
