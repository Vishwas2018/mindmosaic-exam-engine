# MindMosaic Authentication Manual UAT Checklist (2026-11-23)

This checklist is designed for rapid, high-confidence owner sign-off after our automated E2E audit. All automated functional, RBAC, security, and cross-browser gates are already verified; the steps below focus on real-world user perception, Gmail inbox delivery to your personal device, and environment configuration.

---

## Pre-UAT Environment Check (Owner Action)

- [ ] **Supabase DEV Redirect URLs (`DEF-AUTH-005`):** In Supabase DEV (`mfglzabnayacssgertat`) -> Authentication -> URL Configuration -> Redirect URLs, confirm `https://mindmosaic-exam-engine-*-vishwas2018s-projects.vercel.app/**` is added so any Preview branch can complete email confirmation and password recovery without falling back to `git-dev`.
- [ ] **CSP Enforcement Flag:** Confirm whether `MM_DEV_AUTH_CSP_ENFORCE=1` should be enabled across Preview deployments.
- [ ] **Confirm Target URL:** Test against the DEV Preview URL (never production `uermhsptduikehuyceiz`).

---

## Focused Manual UAT Scenarios (~15 minutes)

### 1. Parent Registration & Real Email Confirmation (Desktop + Mobile)
- [ ] Open `/sign-up` on desktop, enter your test email (`techprovish+uat1@gmail.com`), strong password, tick Terms/Privacy, click **Create account**.
- [ ] Confirm you land on **Check your email** and receive the confirmation email in Gmail within ~15 seconds from the configured custom SMTP sender (check Inbox and Spam).
- [ ] Open the confirmation link in the **same browser** -> confirm automatic redirect to `/parent` (or `/parent/setup`).
- [ ] Refresh `/parent` -> confirm session persists.

### 2. Cross-Device Confirmation (Desktop -> Phone)
- [ ] Register a second test address (`techprovish+uat2@gmail.com`) on desktop, then tap the confirmation link on your **phone**.
- [ ] Confirm the screen displays clear same-device guidance ("your email may already be confirmed, so try signing in first") without a 500 error, and that signing in with email + password succeeds on the phone.

### 3. Child Provisioning, Student PIN Login & Pause/Restore
- [ ] From `/parent/setup` or `/parent/children`, add a test child (e.g., Year 5) and note the 8-character login code + 6-digit PIN.
- [ ] Open a Private/Incognito window, go to `/student-sign-in`, enter the code and PIN -> confirm landing on `/student`.
- [ ] In the parent window, **Pause/Archive** the child -> refresh the student window and confirm the student is signed out immediately and cannot sign back in.
- [ ] **Restore** the child in the parent window -> confirm the student can sign in again.

### 4. Password Recovery & Cross-Device Session Invalidation
- [ ] Keep Parent signed in on **Browser A** (e.g., desktop).
- [ ] On **Browser B** (or Incognito), open `/sign-in?mode=forgot`, enter the parent email, click **Send reset link**.
- [ ] Open the reset link from Gmail in Browser B, set a new strong password, click **Save new password**.
- [ ] Refresh **Browser A** on `/parent` -> confirm Browser A was signed out and redirected to `/session-expired`.
- [ ] Sign in on Browser B with the **old** password (must fail) and then the **new** password (must succeed).

### 5. Logout & Back-Button Check
- [ ] Click the parent avatar menu -> **Sign out** -> confirm redirect to `/signed-out`.
- [ ] Press browser **Back** and navigate to `/parent` -> confirm redirect to `/sign-in`.

### 6. Cleanup
- [ ] Delete any manual `techprovish+uat*@gmail.com` test accounts from DEV Supabase Auth after sign-off.
