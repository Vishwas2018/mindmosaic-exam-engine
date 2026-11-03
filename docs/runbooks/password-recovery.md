# Runbook: password recovery (family-beta WP1)

How a forgotten password is reset, what the application protects, what it does **not**, and what must be configured and
verified on a hosted environment. Nothing here has been applied to a hosted environment.

## What the application protects, and what it cannot

**Protected (by this application):** the application's own reset screen and endpoint
(`POST /api/auth/recovery/password`). A new password is accepted there only with a *recovery grant*, which the server
issues only after verifying a recovery token with the Auth service itself. A parent or child who is merely signed in on
a shared device cannot use the application to change the password.

**Not covered by this application (Supabase Auth's own policy):** an ordinary authenticated session changing *its own*
password is normal account management, not by itself a vulnerability, and it happens in Supabase Auth, not in this application.
`PUT /auth/v1/user` with the project's public anon key and the session's bearer token changes the password. The application is not
in that request path, does not block it, and **must not be described as blocking it**. The recovery grant is *application recovery
protection*; reauthentication for direct changes is *provider-level password-change policy*. They are separate controls.

*Intended policy (proposed, owner decision, nothing changed on any hosted project):* a signed-in parent may change their own password
through Supabase Auth; the recovery grant exists so that the application's own **reset** screen cannot be driven by a merely
signed-in session (an unlocked shared device). Children sign in with a PIN, not a password they can change here.

*Measured on the local Auth service (GoTrue, this stack, 2026-11-03; `secure_password_change` is a project setting, default off):*

| `secure_password_change` | Fresh session (just signed in) | Session 3 days old |
|---|---|---|
| `false` (repo default) | direct update **succeeds** | direct update **succeeds** |
| `true` | direct update **succeeds** | **refused**: HTTP 400 `reauthentication_needed` ("Password update requires reauthentication") |

So enabling it narrows the exposure to *stale* sessions (an old session left on a device) and still allows a fresh sign-in to change the
password; a nonce from `auth.reauthenticate()` (an email code) would be required for the stale case. Whether additional
reauthentication is *required* is an owner policy choice, recommended **on** for the family beta, **not enabled anywhere and not
verified on the hosted project**. Pair it with short session lifetimes (`[auth.sessions]`, also unset locally). The hosted value must be
read from the dashboard (checklist item A4); this document does not know it. The e2e test "KNOWN LIMITATION" fails if the local
behaviour changes.

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

- **Single use is enforced server-side, in the database** (migration `20261102090000_recovery_grant_claims.sql`,
  `src/server/auth/recovery-claim.ts`). The grant's `jti` is recorded in `public.recovery_grant_claims` through three SECURITY
  DEFINER functions (`claim_recovery_grant`, `settle_recovery_grant`, `resolve_recovery_claim`) that act only on the caller's own rows (`auth.uid()`). Clearing the browser cookie is hygiene, **not** invalidation.
  The password endpoint's order is: validate (origin, live session, grant signature/expiry/binding, CSRF, password policy) → **claim**
  (atomic; exactly one of any number of concurrent requests gets `claimed`, the rest get `busy` → 409) → change the password →
  **settle `spent`** (the grant is dead; replay gets 403 `spent`, from any session) → global sign-out → clear cookie.
  - *Concurrent submits:* one wins; the other is 409/403/401. Tested in SQL with 12 real committed connections and over HTTP against
    the real Auth service.
  - *Replay after success, global sign-out failure:* refused as `spent` even from the same still-valid session (the grant is spent
    *before* the sign-out is attempted). A failed sign-out is still reported (`otherSessionsRevoked: false`) as an incident signal for
    the *session*, which stays alive until sign-out succeeds or the access token expires.
  - *Fencing and ground truth.* Each claim carries a fresh **fencing token**, and records a **digest of the user's password hash**
    (`sha256(auth.users.encrypted_password)`; unreadable by every client role) taken at claim time. The database can therefore answer
    "did the password change since this claim?" without trusting any client's report. Consequences:
    - *Release only on a definitive refusal.* The route releases (deletes) a claim only when Auth answered with a genuine HTTP 4xx
      (weak or same password, rate limit, validation): nothing changed. It needs the caller's **own** token, so an old claimant whose
      lease lapsed can never release a **newer** claimant's claim, and it is refused (grant marked spent) if the hash has changed.
    - *Ambiguous answers (network failure, abort, 5xx, 408) are never released on a guess.* The route asks the database
      (`resolve_recovery_claim`): hash changed -> the change happened, the grant is spent, and the request completes as a success
      (sessions revoked); hash unchanged -> the claim is **left in place** (the Auth call might still be in flight) and the user gets
      503 `update_uncertain`, which the page turns into "request a new reset link". **Fail closed (migration
      `20261103090000_recovery_claim_fail_closed.sql`):** when the 2-minute lease lapses with the password still unchanged the claim
      becomes `abandoned`, which is terminal. A claim is **never taken over**, so the same grant can never cause a second
      password-change request. The user's recovery path is a fresh recovery link (a new grant), which is free to request.
    - *A lapsed or abandoned claim whose password changed becomes `spent`.* That is what makes "password changed but we could not
      record `spent`" safe: even if the settle call failed *and* the global sign-out failed, the next claim attempt sees the changed
      hash and refuses (`spent`). A slow Auth request that commits after abandonment is therefore recorded as spent the next time the
      grant is touched, and a late success report marks it spent directly. Inside the lease it is `busy`; abandoned is `lapsed`
      (403 `recovery_required`, reason `lapsed`; the page shows the same "request a new link" dead end).
    - *Late reports.* An old claimant that finally learns its change succeeded may still mark the grant `spent` (the safe direction,
      no token needed). It can never un-claim, release or complete a newer claimant's attempt as a failure.
  - *No lock-out, by a different route:* a definitive refusal releases the claim (same grant can retry at once). An uncertain
    outcome, or a crash between claim and outcome, retires that grant after the 2-minute lease and the user requests a fresh link.
    A user is never stranded, but an uncertain attempt now costs one new email instead of a wait.
  - *Fail closed:* if the claim cannot be made (migration not applied, database error) the endpoint answers 503
    `recovery_unavailable` and changes nothing; nothing was consumed, so the user can retry.
  - *What is and is not guaranteed.* **Demonstrated** (SQL tests on a real database with 12 committed concurrent connections, and
    route tests with a deterministic Auth stand-in): for one grant, at most one password-change request is dispatched to Auth, except
    after a definitive 4xx refusal (Auth changed nothing), when one more attempt may follow; a delayed Auth success after the lease
    cannot be followed by a second change from the same grant; a late success is recorded as `spent`; a late refusal cannot release
    an abandoned claim; a failed global sign-out cannot make the grant replayable. **Not claimed:** (1) that Auth itself applies
    a password change at most once. A request already in flight at Auth cannot be cancelled, and a session holder can call Supabase
    Auth's update-user API directly, bypassing this application's route entirely. (2) The hash digest detects "the password
    changed", not "who changed it": a change made some other way during the lease also marks the grant spent, which fails closed.
    (3) An authenticated user can call the three functions directly for **their own** grants only (capped at 10 live rows per user).
  - *Database access and exposure (reviewed).* `public.recovery_grant_claims` has RLS on, no policy, and no privilege for `anon`,
    `authenticated` or (since `20261103090000`) `service_role`; only the three SECURITY DEFINER functions (`search_path` pinned to
    `public, pg_temp`, executable by `authenticated` only) read it. The functions return only an outcome word and the fencing token
    (a random uuid, useless against Auth) to the application server; the browser receives neither the token nor the digest
    (`{ok, otherSessionsRevoked, grantSpent}` or an error word). The digest is `sha256` of the bcrypt hash, stored per claim, and the
    stored `auth.users` row is readable by `service_role` regardless, so the table adds no new class of exposure. No recovery code
    path logs a token, cookie, password, grant or digest (searched: no `console`/logger call in `src/server/auth`,
    `src/app/api/auth/recovery`, or the recovery client).
  - *Already-issued access token after sign-out:* the application refuses it (`resolveLiveSession` asks the Auth service);
    Supabase's own stateless endpoints (PostgREST) accept the JWT until its `exp`. That is Supabase behaviour, not changed.
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
| migration `20261103090000` | **Apply together with `20261102090000`, in order, before the application version that serves password resets.** Makes lapsed claims fail closed (terminal `abandoned`), revokes table and function access from `service_role`. The application treats an unknown claim outcome as unavailable (503), so a mismatch fails closed. Not applied to any hosted project. |
| migration `20261102090000` | **Required before the new application version serves password resets.** Without it the endpoint fails closed with 503. Forward-only; the previous application ignores the table. Not applied to any hosted project. Verified by `npm run migrations:status` (registry entry added). |
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
6. Decide whether to enable *secure password change* on the project (see above; recommended on, with a stated session lifetime).
7. Apply `20261102090000` then `20261103090000` to DEV (owner-authorised) **before** the application version that calls it; then repeat the concurrent-submit and replay checks against the hosted Auth + database.
