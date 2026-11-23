# MindMosaic Authentication Manual UAT Checklist (2026-11-23 — Final)

This checklist is designed for rapid (~15-minute), high-confidence owner sign-off after our automated E2E audit and independent security review.

---

## Pre-UAT Gate (Required Before Testing Feature-Branch Previews)

- [ ] **Resolve `DEF-AUTH-005` in DEV Supabase (`mfglzabnayacssgertat`):**
  - Open **Authentication -> URL Configuration -> Redirect URLs**.
  - Add `https://mindmosaic-exam-engine-*-vishwas2018s-projects.vercel.app/**` and click **Save**.
  - *(Verify live: trigger one sign-up or forgot-password request on PR #160's Preview URL `https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app` and inspect the emailed link's `redirect_to` parameter — it MUST stay on `git-audit-a-f35ca9`, NOT `git-dev`.)*
- [ ] **CSP Enforcement Flag (Optional Pre-Beta Check):** Confirm whether `MM_DEV_AUTH_CSP_ENFORCE=1` should be enabled on Preview/Production.
- [ ] **Confirm Environment:** Target DEV Preview only (never production `uermhsptduikehuyceiz`).

---

## Focused Manual UAT Scenarios (~15 minutes)

### 1. Parent Registration & Real Email Confirmation (Desktop)
- [ ] Open `/sign-up`, enter test email (`techprovish+uat1@gmail.com`), strong password, tick Terms/Privacy, click **Create account**.
- [ ] Confirm you land on **Check your email** and receive the confirmation email in Gmail within ~15 seconds from custom Gmail SMTP (check Inbox and Spam).
- [ ] Open the confirmation link in the **same browser** -> confirm redirect stays on the same Preview origin and lands signed in on `/parent` (or `/parent/setup`).
- [ ] Open DevTools -> Application -> Cookies -> confirm `sb-mfglzabnayacssgertat-auth-token` has **Secure = ✓** and **SameSite = Lax**.

### 2. Cross-Device Confirmation (Desktop -> Mobile Phone)
- [ ] Register a second test address (`techprovish+uat2@gmail.com`) on desktop, then tap the confirmation link on your **phone**.
- [ ] Confirm clean same-device guidance ("your email may already be confirmed, so try signing in first"), no 500 error, and that signing in with email + password succeeds on the phone.

### 3. Child Provisioning, Student PIN Login & Pause/Restore
- [ ] From `/parent/setup` or `/parent/children`, add a test child (Year 5) and note the 8-character login code + 6-digit PIN.
- [ ] Open a Private/Incognito window, go to `/student-sign-in`, enter code + PIN -> confirm landing on `/student`.
- [ ] In the parent window, **Pause/Archive** the child -> refresh the student window and confirm the student is signed out immediately and cannot sign back in (generic error message, no code enumeration).
- [ ] **Restore** the child -> confirm student sign-in works again.

### 4. Password Recovery & Cross-Device Session Invalidation
- [ ] Keep Parent signed in on **Browser A**.
- [ ] On **Browser B** (Incognito), open `/sign-in?mode=forgot` (and optionally spot-check `/auth/forgot`), request a reset link for `techprovish+uat1@gmail.com`.
- [ ] Open the reset link from Gmail in Browser B -> confirm redirect lands on `/auth/reset` on the same Preview origin -> save a new strong password.
- [ ] Refresh **Browser A** on `/parent` -> confirm Browser A is signed out and redirected to `/session-expired`.
- [ ] Verify old password fails and new password succeeds on Browser B.

### 5. Logout & Back-Button Verification
- [ ] Click the parent avatar menu -> **Sign out** -> confirm landing on `/signed-out`.
- [ ] Press browser **Back** and navigate to `/parent` -> confirm redirect to `/sign-in`.

### 6. Post-Integration Spot Check (After PR #159 Stripe Billing Is Combined)
- [ ] With Stripe Preview env vars active, confirm a newly registered parent still lands on `/parent` (trial access) and a student on the Free plan can sign in and practise the 5-question sample without being redirected to `/billing`.

### 7. Cleanup
- [ ] Delete manual `techprovish+uat*@gmail.com` test accounts from DEV Supabase Auth after sign-off.
