# MindMosaic — DEV Manual Testing Journey & Smoke-Test Runbook

**Document Version:** 1.0.0  
**Target Environment:** DEV Supabase (`mfglzabnayacssgertat`)  
**Base URL:** Verified DEV deployment URL or local DEV runtime (`http://localhost:3000`)  
**Production Prohibition:** PROD Supabase (`uermhsptduikehuyceiz`) is STRICTLY OFF-LIMITS.  
**Precondition:** DEV database migrations `20261031090000` and `20261031090100` applied to Supabase DEV.

---

## Pre-Flight Verification Checklist

Before starting manual verification, verify the runtime environment:
- [ ] Ensure `.env.local` points to DEV Supabase: `NEXT_PUBLIC_SUPABASE_URL=https://mfglzabnayacssgertat.supabase.co`.
- [ ] Confirm `PROD` reference `uermhsptduikehuyceiz` is nowhere in the active runtime configuration.
- [ ] All visual preview flags are disabled in authenticated testing (`NEXT_PUBLIC_STUDENT_PREVIEW=0`, `SHOWCASE_ENABLED=0`).
- [ ] Test accounts: Prepare two distinct parent email accounts:
  - **Parent A:** `test-parent-alpha@mindmosaic.dev` (Primary test family: 2 children)
  - **Parent B:** `test-parent-beta@mindmosaic.dev` (Isolation check family: 1 child)
  - **Admin:** Existing authorized DEV administrator identity.

---

## Journey 1: Parent Registration, Login & Password Recovery

### 1.1 Parent Registration
1. Navigate to `/sign-up`.
2. Enter email `test-parent-alpha@mindmosaic.dev` and password `TestPassword123!`.
3. Submit the registration form.
4. **Expected Results:**
   - Client validates password complexity.
   - Confirmation prompt displays informing the user to check email.
   - Registration creates an auth user in DEV Supabase `mfglzabnayacssgertat`.
   - No sensitive data or tokens leak in browser console or URL query params.

### 1.2 Email Confirmation & First Login
1. Follow the confirmation link received from DEV Supabase.
2. Navigate to `/sign-in`.
3. Enter valid credentials and log in.
4. **Expected Results:**
   - Successfully authenticated and redirected to `/parent`.
   - Onboarding / empty family state renders cleanly without error.

### 1.3 Password Recovery
1. Navigate to `/auth/forgot`.
2. Request a password reset for `test-parent-alpha@mindmosaic.dev`.
3. Follow the password reset link to `/auth/reset`.
4. Enter new password `TestPassword456!` and confirm.
5. Attempt logging in with the old password (must be rejected).
6. Log in with the new password (must succeed).
7. Direct navigation to `/auth/reset` without a valid recovery token must redirect to `/auth/session-expired`.

---

## Journey 2: Parent Dashboard & Family Setup

### 2.1 Family Dashboard
1. Log in as Parent A.
2. Land on `/parent`.
3. **Expected Results:**
   - Clean Parent Portal layout with navigation bar: Overview, Children, Curriculum, Help, Account.
   - Initial empty state gracefully prompts to add a child profile.
   - No mock or synthetic family data is displayed.

---

## Journey 3: Child Creation, Login Code & PIN

### 3.1 Adding Children
1. Click **Add Child** on `/parent`.
2. Add first child:
   - **Name:** "Maya"
   - **School Year:** Year 3
   - **Target Exam:** NAPLAN Year 3
3. Save child profile.
4. Add second child:
   - **Name:** "Leo"
   - **School Year:** Year 5
   - **Target Exam:** ICAS Mathematics
5. **Expected Results:**
   - Both children are persisted in `parent_children` table under Parent A's user ID.
   - A unique 8-character Student Access Code and 4-digit PIN are generated and displayed securely.
   - Option to print or securely copy credentials is functioning.
   - Credentials are not echoed in URL query strings or browser history.

### 3.2 Data Isolation Check (Parent B)
1. Open an incognito/private browser session.
2. Log in as Parent B.
3. Attempt to access Maya's profile by guessing or deep-linking `/parent/children/[maya-child-id]`.
4. **Expected Result:**
   - Immediate HTTP 404 (Not Found) returned.
   - No data from Parent A is visible to Parent B.

---

## Journey 4: Student Login & Redesigned Dashboard

### 4.1 Student Authentication
1. Navigate to `/student-sign-in`.
2. Enter Maya's Student Access Code and 4-digit PIN.
3. Test invalid PIN: verify error message displays and rate limits/retry protection trigger safely.
4. Enter correct PIN and submit.
5. **Expected Results:**
   - Authenticated student session established.
   - Redirected to `/student` (My Space).

### 4.2 My Space Dashboard
1. Verify student greeting matches "Maya" (Year 3).
2. Confirm curriculum badges reflect Year 3 NAPLAN.
3. Verify that real student state (0 sessions completed) is displayed honestly.
4. Confirm navigation bar links are functional: **Dashboard**, **Learning Hub**, **Practice Studio**, **Results**.

---

## Journey 5: Learning Hub & Practice Selection

### 5.1 Learning Hub Navigation
1. Navigate to `/student/learn`.
2. Inspect Victorian curriculum learning pathways for Year 3.
3. Select **Mathematics**:
   - Check modules: Number & Algebra, Measurement & Geometry, Statistics & Probability.
4. Select **English**:
   - Check reading comprehension and language conventions modules.
5. Verify lesson previews open cleanly without console errors.

### 5.2 Practice Studio Configuration
1. Navigate to `/student/practice`.
2. Inspect available practice sets.
3. Filter by subject (e.g. Mathematics) and exam pattern (NAPLAN Year 3).
4. Verify unavailable or locked sets display honest "Coming Soon" or prerequisite messaging.

---

## Journey 6: Exam Attempts, Answering & Submission

### 6.1 Starting a Practice Session
1. Select an available published Year 3 Mathematics practice set.
2. Click **Start Practice**.
3. **Expected Results:**
   - Assessment runner initializes with verified published items from manifest.
   - Timer counts down correctly.
   - Question palette shows all questions in pending state.

### 6.2 Answering Questions
1. Step through questions:
   - **Multiple Choice:** Click options; verify radio selection updates.
   - **Fill in the Blank / Number Entry:** Type answers; verify persistence.
   - **Dropdown:** Select values; verify change handler triggers.
2. Flag question #3 for review. Verify flag icon highlights in palette.
3. Jump between questions using the question palette.
4. Verify response state persists across client navigation.

### 6.3 Submission
1. Click **Submit Exam**.
2. Confirmation modal appears detailing answered vs unanswered questions.
3. Confirm submission.
4. **Expected Results:**
   - Session marked as completed.
   - Pure scoring engine computes score on server.
   - Client is prevented from submitting duplicate responses.

---

## Journey 7: Results, Explanations & Parent Progress

### 7.1 Student Results Review
1. Following submission, student lands on `/student/results` or session review screen.
2. Verify total score, percentage, and time taken are accurate.
3. Click into question review:
   - Correct answers are revealed only in review mode.
   - Detailed step-by-step explanations render cleanly.
   - No answers were leaked prior to submission.

### 7.2 Parent Progress Visibility
1. Switch back to Parent A's session on `/parent`.
2. Refresh `/parent` or navigate to `/parent/children/[maya-id]/progress`.
3. **Expected Results:**
   - Maya's newly completed practice attempt appears in real-time.
   - Score, date, time spent, and subject breakdown match the student's submission.
   - Switch to Leo's profile: verify Leo has 0 attempts and no cross-contamination occurs.

---

## Journey 8: Parent Account, Billing & Help Centre

### 8.1 Account & Settings
1. Navigate to `/parent/account`.
2. Update display preferences or email notification toggles.
3. Verify settings save cleanly.

### 8.2 Billing Status
1. Navigate to `/parent/account/billing`.
2. Verify subscription tier displays accurately (e.g. Free Beta / Early Access).
3. If Stripe portal is linked in DEV, verify link navigates to Stripe DEV test environment.

### 8.3 Help Centre
1. Navigate to `/parent/help`.
2. Search FAQs (e.g. "PIN", "NAPLAN", "scoring").
3. Verify search filtering works dynamically.
4. Verify help article detail views open without breaking shell layout.

---

## Journey 9: Admin Login, Navigation & Role Isolation

### 9.1 Admin Authentication & Access
1. In a separate browser context, log in with DEV Admin credentials.
2. Navigate to `/admin`.
3. **Expected Results:**
   - Access granted to Administrative Tool Hub.
   - Admin navigation available: Analytics, Operations, Review Console.

### 9.2 Role Isolation & Security Gate
1. While logged in as Parent A, attempt to navigate to `/admin`.
2. **Expected Result:**
   - Forbidden / Access Denied. Redirected to `/parent` or `/sign-in`.
3. While logged in as Student Maya, attempt to navigate to `/admin` and `/parent`.
4. **Expected Result:**
   - Immediate access denial. Redirected to `/student`.

---

## Journey 10: Logout, Session Expiry & Responsive Behaviour

### 10.1 Logout
1. Click **Log Out** from the user profile menu.
2. Verify redirected to `/auth/signed-out` or `/sign-in`.
3. Click browser **Back** button:
   - Protected routes must NOT serve cached data; must redirect to `/sign-in`.

### 10.2 Responsive Mobile Layout
1. Open Chrome DevTools and toggle device emulation:
   - **iPhone 14 / Mobile Viewport (390 x 844)**
   - **iPad / Tablet Viewport (820 x 1180)**
2. Verify:
   - Hamburger / mobile bottom nav works seamlessly across Parent and Student portals.
   - Touch targets are >= 44x44px.
   - No horizontal page scrollbars appear.
   - Exam runner question options and action buttons stack cleanly on small viewports.
