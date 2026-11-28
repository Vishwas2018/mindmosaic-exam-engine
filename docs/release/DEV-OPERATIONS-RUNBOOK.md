# DEV operations runbook: fixtures, Stripe webhook, manual family

DEV only (`mfglzabnayacssgertat`). No secret value appears in this file or may be pasted into chat, issues or PRs.

## 1. Admin fixture lifecycle (D-FIX-1)

**Cause.** A hosted spec grants a synthetic Admin entitlement and revokes it in `afterAll`. If the Playwright worker
dies (Windows native crash `0xC0000409`, kill, reboot) `afterAll` never runs and the entitlement survives.

**Fix, three layers (all revoke through the audited `revoke_admin_role` RPC; accounts are never deleted):**
1. `grantFixtureAdmin` tags every grant with the run (`actor e2e:hosted:<runId>`, reason `fixture:<runId>: …`).
2. `playwright.hosted.config.ts` → `globalTeardown` (`e2e/hosted/global-teardown.ts`) runs in the runner process, which
   survives a worker crash, and revokes every still-active entitlement of *this* run's synthetic fixtures.
3. Backstop for a killed runner: `scripts/hosted-acceptance/reconcile-fixtures.mts`.

**Selection rule (shared by 2 and 3, `e2e/hosted/fixture-admin-reconcile.ts`).** Only an active Admin entitlement whose auth
email matches `mm-accept-<runId>-<label>@example.com`; the retained Admins are also in a protected list. Role alone never
selects anyone.

**Orphan reconciliation procedure**
```
npx tsx scripts/hosted-acceptance/reconcile-fixtures.mts --env <path to .env.local>            # dry run, default
npx tsx scripts/hosted-acceptance/reconcile-fixtures.mts --env <path> --run r<id>              # scope to one run
npx tsx scripts/hosted-acceptance/reconcile-fixtures.mts --env <path> --apply                  # revoke
```
`--older-than <min>` defaults to 120 so a run in progress is never touched. Output is counts and run ids only. After
any hosted run, expect `active Admin entitlements now: 3`.

**Proof (2026-11-28, DEV).** A simulated crash orphan (granted, never retired) was: invisible at the default 120 min
threshold; found by dry run (`--older-than 0`); not found for a different `--run`; revoked by `--apply` (count 4→3);
and a second orphan was revoked by `globalTeardown` alone (count 4→3). The three retained Admins were never selected.

## 2. Stripe sandbox webhook (W1–W4)

| Item | Value |
|---|---|
| Stripe account | sandbox `acct_1StznKDtPH5dvWkm` (test mode) |
| DEV endpoint | `we_1UfGSWDtPH5dvWkmfOn2qOh8`, enabled, created 2026-11-24 |
| Endpoint URL | `https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app/api/stripe/webhook` (the Stripe-side URL also carries a Vercel protection-bypass query parameter; see the security note) |
| Events | `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`, `invoice.paid` |
| Deployed variable | `STRIPE_WEBHOOK_SECRET` (Sensitive, Preview, branch `dev`, set 2026-11-24). Sibling `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*` same scope. Read by `src/lib/stripe/config.ts`. |
| Local test variable | `BILLING_WEBHOOK_SECRET`, loaded by `scripts/billing-readiness/run.mjs` from the `STRIPE_WEBHOOK_SECRET=` line of `C:/tmp/stripe-readiness/webhook-secret.env` |

**Why W1–W4 fail.** The local `whsec_…` is not the one this endpoint signs with, so a test-signed event gets
`invalid_signature` (400). Real Stripe deliveries (L1…) pass, so the deployment is correct and the local copy is stale.
Sensitive Vercel variables cannot be read back, and Stripe shows an endpoint's signing secret only in the Dashboard.

**Owner setup (secure; nothing is printed or pasted)**
1. Stripe Dashboard → switch to the **sandbox** → Developers → Webhooks → endpoint `we_1UfGSWDtPH5dvWkmfOn2qOh8` → *Signing secret → Reveal*.
2. Open `C:/tmp/stripe-readiness/webhook-secret.env` in an editor and set the single line `STRIPE_WEBHOOK_SECRET=<value>`. Save. Do not paste it anywhere else.
3. Confirm it is the deployed one by rerunning only the signature test:
   `node scripts/billing-readiness/run.mjs https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app <path to .env.local> -- e2e/hosted/s2-billing-security.spec.ts e2e/hosted/s4-billing-extended.spec.ts`
   W1's last assertion (a correctly signed event returns 200) passing proves the match; W2–W4 then run.
4. If the Dashboard value was ever lost or exposed, rotate: Dashboard → endpoint → *Roll secret*, then update the Vercel variable `STRIPE_WEBHOOK_SECRET` (Preview, branch `dev`, Sensitive) with the new value, redeploy `dev`, and update the local file in step 2.
5. Delete the stale `STRIPE_WEBHOOK_SECRET` line in the repo's `.env.local` if it is not the endpoint's value (it is not used by the billing runner).

**Security note (action for the owner).** The endpoint URLs registered in Stripe include the Vercel *automation bypass*
secret as a query parameter. Anyone with Stripe Dashboard access can read it, and it bypasses Deployment Protection for
the project. Prefer rotating it (Vercel → Project → Deployment Protection → Protection Bypass) after the beta window or
moving to a header-based bypass if Stripe supports it for the endpoint. It was printed once in this session's terminal
output; treat it as exposed to the session only, and rotate at the owner's discretion.

## 3. Manual family testing (dedicated synthetic Parent)

The old `mm-manual-parent@example.com` (created 2026-11-15) is left untouched. New dedicated identity:
`mm-manual-beta-parent@example.com`, never the owner's personal login.

1. Generate credentials locally (random, outside the repo, current-user-only ACL, values not printed):
   `node scripts/hosted-acceptance/prepare-manual-credentials.mjs`
   → `C:/tmp/manual-family/manual-family.env` (`MANUAL_PARENT_EMAIL`, `MANUAL_PARENT_PASSWORD`, `MANUAL_PIN_1/2`). Open it yourself to read them.
2. Seed (creates the confirmed parent through the service role, children through the app's own form; idempotent):
   `HOSTED_SEED_MANUAL=1 node --env-file=C:/tmp/manual-family/manual-family.env scripts/hosted-acceptance/run.mjs https://mindmosaic-exam-engine-git-dev-vishwas2018s-projects.vercel.app -- e2e/hosted/m-manual-test-family.spec.ts`
   The login codes issued by the app are written to `test-results/hosted/<run>/manual-family.json` (gitignored; DEV only).
3. The spec refuses a non-`mm-manual-*@example.com` email and never changes an existing account's password unless `MANUAL_ALLOW_PASSWORD_RESET=1` is set deliberately (rotation = `--rotate` on step 1, then step 2 with that flag).

Status 2026-11-28: credentials generated locally; **seed not yet run** (awaiting owner go-ahead).
