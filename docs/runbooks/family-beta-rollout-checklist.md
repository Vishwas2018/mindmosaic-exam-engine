# Family-beta rollout checklist (WP1 candidate)

**Status: NO-GO.** Nothing below has been done on any hosted environment. A box is ticked only with evidence recorded next to it.
Local verification is in the PR/evidence notes; this file lists what must additionally be true on DEV (`mfglzabnayacssgertat`).
Production (`uermhsptduikehuyceiz`) needs a separate owner decision and is out of scope.

**Outstanding input:** the "Revision 2" rollout plan referred to in the brief was not available. This checklist is built from the
audit and the current runbooks (`legacy-exam-write-lockdown.md`, `password-recovery.md`, `docs/MIGRATIONS.md`). It is not blocked on
that plan; reconcile the two when it is supplied.

## Sequence (order matters)

1. **W: writer connection** (before any deployment of this version)
   - [ ] W1 `EXAM_WRITE_DB_URL` is the `mindmosaic_exam_writer` URL for the DEV project (direct `db.<ref>.supabase.co` or pooler with
     the `.<ref>` username suffix), with **no** `sslmode` other than `verify-full`.
   - [ ] W2 `EXAM_WRITE_EXPECTED_PROJECT_REF=mfglzabnayacssgertat`; `NEXT_PUBLIC_SUPABASE_URL` names the same project;
     `EXAM_WRITE_ALLOW_LOOPBACK` unset; `NODE_TLS_REJECT_UNAUTHORIZED` unset.
   - [ ] W3 `EXAM_WRITE_DB_CA` set to the CA downloaded from the DEV project's Database settings (fingerprint checked against the
     dashboard). **Verify the real chain**: from the deployed environment, one create-session call succeeds with verified TLS; then the
     same with a deliberately wrong CA is refused (`503 not_configured`, reason `tls_ca_invalid`/connection refused), so the control is
     proven to bite on the hosted endpoint, not only locally.
   - [ ] W4 The writer role exists on DEV with its password set out of band; attributes read back clean (the module refuses otherwise).
2. **A: Auth configuration**
   - [ ] A1 `RECOVERY_GRANT_SECRET` (32+ random chars) set for the DEV deployment; redeploy.
   - [ ] A2 The **actual hosted** recovery email template is the fragment form (`/auth/reset#token_hash={{ .TokenHash }}&type=recovery`).
     Hosted templates are edited in the dashboard, not deployed from the repo: read the live template and record it.
   - [ ] A3 Redirect URL allow-list contains the DEV origin's `/auth/reset` and `/auth/confirm` (read, not assumed).
   - [ ] A4 Read and record the hosted values of `secure_password_change` and session lifetime/inactivity settings. Owner decision
     (recommended: secure password change **on**; see `password-recovery.md` for the measured behaviour). Do not claim the application
     blocks direct Auth password changes.
   - [ ] A5 Rate limits and email sender/deliverability for `/recover` and `/verify` recorded.
3. **M: migrations** (owner-authorised, DEV only, with a backup/snapshot first; `npm run migrations:status` before and after)
   - [ ] M1 `20261031090000` (writer role + `_for` functions) applied. *(No effect on the running app.)*
   - [ ] M2 `20261102090000` (`recovery_grant_claims`) applied **before** the new application version serves password resets.
     Dependency: without it the reset endpoint returns 503 `recovery_unavailable` and changes nothing (safe, but resets are down).
   - [ ] M3 `20261031090100` (revoke legacy RPCs from clients) applied **last**, only after D1 and N1. It breaks the previous application.
4. **D: compatible deployment before the legacy RPC lockdown**
   - [ ] D1 Deploy this version (it calls the `_for` functions as the writer). Confirm create-session and submit work end to end
     with the **legacy RPCs still executable** (so a rollback of M3 is not needed to recover).
   - [ ] D2 Only then apply M3. Re-run N1.
5. **N: hosted negative security tests** (each must be recorded as a refusal, with the status code)
   - [ ] N1 A signed-in student calling `create_exam_session` / `record_exam_attempt` / `*_for` over PostgREST: `permission denied`.
   - [ ] N2 Writer URL pointed at the wrong project (ref mismatch) and at a non-verifying configuration: refused before connecting.
   - [ ] N3 Recovery: forged, expired, other-user, other-session grant refused; **two concurrent submits with one grant → exactly one
     password change**; replay after success → 403 `spent`; ordinary signed-in session with no grant → 403.
   - [ ] N4 With the claim function made unavailable on a test project (or by a deliberate wrong target), the reset endpoint is 503 and
     the password is unchanged. (Do not do this on a project with real users.)
6. **F: families and exam journeys**
   - [ ] F1 Two synthetic families on DEV: neither parent can see the other's children, results or sessions (read and write).
   - [ ] F2 Complete exam journeys per child: start, answer, pause/reload, submit, result, parent view; an interrupted submit is
     retried safely (idempotent 409 path).
   - [ ] F3 Only items in the approved manifest are served (record the count; the audit found 53 approved vs 1,601 served in a prior
     baseline: confirm the beta uses the approved set only).
7. **E: real-email recovery**
   - [ ] E1 Real email on DEV, same device; E2 a different device (phone) opening the same link; E3 "other devices signed out" claim
     checked by trying a previously signed-in second device; E4 link reuse and expiry refused.
8. **R: suspension and rollback** (decide and rehearse before inviting families)
   - [ ] R1 Security-preserving suspension: how to stop exams without re-opening the hole. Do **not** re-grant EXECUTE on the legacy
     RPCs to `authenticated`. Options: take the app offline or return the maintenance page; unset `EXAM_WRITE_DB_URL` (writes fail
     closed with 503).
   - [ ] R2 Application rollback: previous deployment still works only while M3 is **not** applied. After M3, roll forward, not back.
   - [ ] R3 `20261102090000` is additive; the previous application ignores it. No rollback needed for it.
   - [ ] R4 Credential rotation path for the writer password and `RECOVERY_GRANT_SECRET` (rotating the latter invalidates grants in flight).

## Known open items (not fixed by this candidate)

- Direct Supabase Auth password changes by an ordinary session: provider policy, owner decision (A4).
- Operator CLI `scripts/migrations/verify.ts` still uses `rejectUnauthorized: false` for non-local ledger checks (not a request path).
- Local authenticated-e2e instability on this host (see the verification record): pre-existing on `origin/dev`, not caused by this branch.
