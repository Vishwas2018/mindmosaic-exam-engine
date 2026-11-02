# Runbook: password recovery (family-beta WP1)

How a forgotten password is reset, what the application protects, what it does **not**, and what must be configured and
verified on a hosted environment. Nothing here has been applied to a hosted environment.

## What the application protects, and what it cannot

**Protected (by this application):** the application's own reset screen and endpoint
(`POST /api/auth/recovery/password`). A new password is accepted there only with a *recovery grant*, which the server
issues only after verifying a recovery token with the Auth service itself. A parent or child who is merely signed in on
a shared device cannot use the application to change the password.

**Not protected (Supabase Auth's own behaviour):** any holder of a valid session can call Supabase Auth's
`PUT /auth/v1/user` directly, with the project's public anon key and the session's bearer token, and the Auth service
will change the password. The application is not in that request path and cannot block it. This is recorded by a test
(`e2e/auth/password-recovery-security.spec.ts`, "KNOWN LIMITATION") that fails if Supabase's behaviour changes. What
reduces the exposure is Supabase project configuration, which is an owner decision and has not been changed:

- *Secure password change* (`auth.email.secure_password_change`) asks for a recent sign-in or a re-authentication code;
  it does not stop a freshly signed-in session.
- Short session lifetimes and keeping the parent session off shared devices.

Do not describe the grant as "preventing password changes without recovery". It prevents them *through the application*.

## The flow

1. Parent requests a link (`/sign-in?mode=forgot`). The email contains a one-time `token_hash`.
2. The link opens `/auth/reset`. The default template puts the token in the URL **fragment**
   (`/auth/reset#token_hash=…&type=recovery`): a fragment is never sent to a server, so it is in no request log, and a mail
   scanner that fetches the link cannot spend it. A token in the query string is still accepted (links already sent).
   The page removes the token from the address bar before anything else.
3. The page POSTs the token in a request body to `POST /api/auth/recovery/verify`. **The server** verifies it
   (`verifyOtp`, type `recovery`), reads the resulting session back from the Auth service, and sets the grant cookie.
   This works in any browser or device: no PKCE verifier is involved.
4. The page shows the form. The new password goes to `POST /api/auth/recovery/password` with the grant cookie and the
   grant's CSRF token. The server checks, in order: same-origin `Origin`, JSON content type, a live session the Auth
   service accepts, the grant (signature, expiry, bound user and session), the CSRF token, the password policy.
5. On success the server changes the password and signs the user out **globally** (this session and every other), then
   clears the grant. The user signs in again with the new password.

Two other link shapes are supported, where the Auth service itself makes a session (`/auth/v1/verify` → `?code=` PKCE,
or an implicit fragment). The app does not exchange the code a second time: the Supabase client does it once, and the page
then asks `POST /api/auth/recovery/session`, which issues a grant only if the server-accepted session carries a *recent
`recovery`* authentication method (GoTrue records it only when it consumed a recovery token; a password, signup or
`verifyOtp` session never has it). A PKCE link opened in a different browser than requested cannot complete (no
verifier) and shows an explanation; a `token_hash` link can.

## The grant

`src/server/auth/recovery-grant.ts`. HMAC-SHA256 signed cookie `mm-recovery-grant`: `HttpOnly`, `SameSite=Strict`,
`Secure` on https, `Path=/api/auth/recovery`, 15 minutes. Bound to the user id and the Auth `session_id`.

- **Single use** comes from ending the session it is bound to (step 5). There is no server-side store. Binding to the
  user's `updated_at` was rejected: the Auth service changes it on every token refresh. If the global sign-out fails
  (reported to the user as "other devices could not be signed out") the grant remains usable by that same session until it
  expires; the server retries the sign-out once.
- **Logout** clears it (`DELETE /api/auth/recovery/session`, called by `signOut`), and sign-out also ends the session.
- **CSRF**: `SameSite=Strict` cookie, same-origin `Origin` check, JSON-only body, and a per-grant token in
  `x-mm-recovery-csrf` that is available only to a same-origin read that itself needs the cookie.
- **Logs and analytics**: the token is in no URL the server sees (fragment), in no log line (no recovery code logs; a test
  fails if one does), in no storage and in no `Referer` (`Referrer-Policy: no-referrer` on `/auth/*` and the endpoints).
  The application loads no analytics library; if one is added it must exclude `/auth/reset`.
- **Fail closed**: without `RECOVERY_GRANT_SECRET` nothing is issued or accepted (`503`), and the verify route refuses
  *before* spending the one-time token.

## Configuration

| Variable | Notes |
|---|---|
| `RECOVERY_GRANT_SECRET` | server-only, 32+ random characters (`openssl rand -base64 48`). Required wherever password reset must work. Rotating it invalidates grants in flight (15 minutes). Named in `recovery-grant.ts` only. |
| email template `recovery` | Local file `supabase/templates/recovery.html` uses the fragment form. **Hosted templates are edited in the Supabase dashboard**, not deployed from this repo; until the owner updates the hosted template, links keep the form already configured there and the page accepts both. |

Local stack note: the Auth container serves templates from its start-up configuration. A stack started before the
template change keeps sending `?token_hash=` links until it is restarted; the e2e suite rewrites the link to the fragment
form so both are exercised.

## Verified locally (against the real local Auth service)

Real emails (Mailpit), a production build, Chromium: `e2e/auth/password-recovery-security.spec.ts`. Cross-browser recovery;
same-browser recovery; PKCE same-browser (one exchange only) and cross-browser (explained, no form); malformed,
truncated, wrong-type and reused links; an ordinary session refused (no grant, forged grant); CSRF refusals (foreign
origin, no origin, no/wrong token, form-encoded body) with the genuine request still working afterwards; a grant carried to
another account's session or browser; opening a recovery link while signed in as someone else recovers the link's
account only; other-session revocation (the other device's token stops validating and cannot refresh); old password dead,
new password works; the token absent from URLs, Referer, console and storage; the grant cookie attributes; the direct
Auth API limitation.

Measured on the local Auth service while designing this: a recovery session created by a `/verify` redirect carries
`amr: recovery`; one created by `verifyOtp` carries `otp` (so the server-side token verification is the proof for that
path); `updated_at` changes on token refresh; the Auth service ended the user's *other* sessions as soon as the password
was updated, before any sign-out. The explicit global sign-out does not rely on that.

## Hosted verification still required (nothing below has been done)

1. `RECOVERY_GRANT_SECRET` set on the DEV/Preview deployment; redeploy.
2. Dashboard recovery template switched to the fragment form; confirm a real DEV email carries it.
3. Real-email recovery on DEV: same device and a different device (phone), including the "other device signed out" claim.
4. Confirm on the hosted Auth service the same things measured locally: `amr` for `/verify` sessions, session revocation on
   password change, a reused or expired token rejected, a spent session's token refused.
5. Supabase Auth rate limits for `/recover` and `/verify` (unverified), the email sender and delivery time.
6. Decide whether to enable *secure password change* on the project (see above).
