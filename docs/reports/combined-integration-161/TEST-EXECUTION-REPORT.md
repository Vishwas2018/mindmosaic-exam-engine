# Combined integration test execution report: PR #161 (#156 + #159 + #160)

Date 2026-11-24. DEV Supabase (`mfglzabnayacssgertat`) and Stripe sandbox (`acct_1StznKDtPH5dvWkm`) only. Nothing merged; no production resource touched.

## 1. What was tested

| Item | Value |
|------|-------|
| Candidate branch | `integration/combined-156-159-160-candidate` (draft PR #161, "DO NOT MERGE") |
| Tested SHA | **`a1759a6b`** = #156 `3253ab1e` + #159 `1003f3dc` + #160 `d603bb74` + harness-only commit `a1759a6b` |
| PR heads verified live (not from notes) | #156 `3253ab1e`, #159 `1003f3dc`, #160 `d603bb74` (checked with `gh pr view` at start) |
| Deployment | `dpl_DARumhyTQMi5cmm7sCyX5iAsqZwD`, alias `mindmosaic-exam-engine-git-integra-30b23f-vishwas2018s-projects.vercel.app`; alias SHA re-checked before each cycle |
| CI at `a1759a6b` | 7/7 green: Vercel, Vercel Preview Comments, core (typecheck, lint, vitest, build, question/answer/ledger gates), e2e, e2e-auth, rls, scholarship-drafts |

### Integration integrity

- All 30 files changed by #160 and all 87 files changed by #159 are byte-identical in the candidate, except `src/features/auth/provision-child.ts`, the only file both PRs touch. Git merged it cleanly; it is the union of #160's typed error codes (401/403/503) and #159's plan child cap.
- `46c81390` (the refreshed candidate) and `a1759a6b` have identical application code; the `a1759a6b` commit changes three hosted test files only.

## 2. Environment verification

| Check | Method | Result |
|-------|--------|--------|
| Preview uses DEV Supabase only | Scanned the HTML and all `/_next/static` JS chunks served for `/`, `/sign-in`, `/pricing`, `/billing` (21 chunks) | Only `mfglzabnayacssgertat`; production ref `uermhsptduikehuyceiz` absent. Re-checked on the final deployment |
| Stripe is sandbox only | Server key verified by `/v1/account` = `acct_1StznKDtPH5dvWkm` and `livemode=false` before any write; every billing spec calls `assertSandbox()` | Pass. No publishable key is shipped in the bundle (Checkout is server-redirected) |
| Stripe Preview variables | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, four `STRIPE_PRICE_*` (resolved by lookup key), `BILLING_ENFORCEMENT_ENABLED=true`, `MM_DEV_AUTH_CSP_ENFORCE=1` | Set as **Preview, branch `integration/combined-156-159-160-candidate` only**. Not Production, not other branches |
| Webhook endpoint | Sandbox endpoint `we_1Uf5prDtPH5dvWkmHQ8nMMF9` (metadata `mindmosaic_branch` = candidate) for the candidate alias, six events | Created for this run. URL carries the Vercel automation-bypass token (same practice as #159) |
| Auth redirect URLs | `auth.admin.generateLink` probe for `magiclink` (`/auth/confirm`) and `recovery` (`/auth/reset`), plus a negative control (`https://evil.example.com`) | Initially **MISMATCH** (fell back to `git-dev`): the candidate alias was not allowlisted. Owner added it; re-probe **MATCH** for both, negative control still falls back. Live REG-02/03/04, REC-01 and A0 confirm the same-origin paths |

## 3. Method

- Hosted Playwright suites under `e2e/hosted/` against the Preview, launched by `scripts/billing-readiness/run.mjs` (DEV-guarded; bypass secret read into memory only, never written).
- Memory-safe foreground batch runner (`C:/tmp/combined-161/batch.mjs`, kept outside the repo): one browser engine and one Playwright worker at a time; start only with ≥ 8 GB free RAM; stop its own process tree below 4 GB; 540 s cap per batch; Playwright-installed browser processes created by a batch and still alive after it are killed (none were). Each cycle = 17 batches:
  - Chromium: C1 auth/RBAC/security, C2 family chain (A → B/C → D), C3 responsive (1440/834/390), C4 public/guest, C5 real-email onboarding + negative auth, C6 real-email auth audit, C7 billing lifecycle (test clocks) + extended, C8 billing security/webhooks/RLS/entitlement, C9 billing UI with Stripe Checkout.
  - Firefox and WebKit (desktop 1440): auth/RBAC/security, family chain, responsive + public/guest, billing UI with Stripe Checkout.
- Real email: throwaway mail.tm inboxes; every link opened came from a delivered message.
- Stripe Checkout connectivity was probed (`checkout.stripe.com`, `js.stripe.com`, `m.stripe.network`, 3 TLS attempts each) before every Checkout batch.

## 4. Results

### Formal cycles (same SHA `a1759a6b`, same deployment)

| Cycle | Window (UTC) | Batches | Tests passed | Failed | Skipped | Flaky / retried | Orphan processes | Min free RAM |
|-------|--------------|---------|--------------|--------|---------|-----------------|------------------|--------------|
| 1 | 05:46–06:57 | 17/17 PASS | 118 | 0 | 7 | 0 | 0 | 5.4 GB |
| 2 | 06:57–08:02 | 17/17 PASS (all first attempt) | 118 | 0 | 7 | 0 | 0 | 5.0 GB |

Per engine, each cycle: Chromium 66 passed / 3 skipped; Firefox 26 / 2; WebKit 26 / 2.

**Cycle 1 batch re-runs (disclosed):** C3 (responsive) and C4 (public/guest) first failed at fixture load with `ENOENT family-a.json`, because the runner split specs E/H/V away from spec A, whose family they reuse. No application code ran. The runner was fixed to pass `FAMILY_FILE` from the same cycle's family-chain batch, and both batches passed on re-run (12/12 and 10/10). Cycle 2 needed no re-runs.

**The 7 skips per cycle** (none hide a failure):
- REC-01 skips in the non-email auth batches (C1, F1, W1) by design and runs in C6 (Chromium, real email): passed both cycles. Not executed on Firefox/WebKit (coverage exception X3).
- A1–A2 skips in C2, C5, F2, W2: it needs an operator-read inbox (`HOSTED_MAIL_BASE`) and a manual link drop. Its behaviour is covered by A0 and REG-02/03/04 with real email (coverage exception X2).

### Email delivery (item 7)

| Run | Messages measured | First-attempt | Latency |
|-----|-------------------|---------------|---------|
| Cycle 0 dry run | 13 scenarios | 12 (REG-02 initial confirmation missed within 95 s) | 0–3 s for the rest |
| Cycle 1 | A0 2 confirmations + 2 recoveries; REG-02, REG-03, REG-04 ×2 | 8/8 | 0–2 s (A0 recovery recorded as −1 s: arrived within the same second as the timestamp) |
| Cycle 2 | same | 8/8 | 1–2 s |

REG-02's miss was investigated: re-run alone it passed in 30 s; a probe that double-clicks "Create account" with the signup call intercepted proved exactly one signup request is sent (the double-submit guard works), so the app did not suppress or duplicate the email. Classified as intermittent delivery (E-02), not an app defect. Mail is sent through the custom Gmail SMTP configured on DEV, as in #160.

### Stripe Checkout connectivity (item 7)

| When | `checkout.stripe.com` | `js.stripe.com` | `m.stripe.network` | Checkout tests |
|------|-----------------------|-----------------|--------------------|----------------|
| Cycle 0 (curl, 6 attempts) | 2/6 | 2/6 | 1/6 (`schannel: failed to receive handshake`) | U3/U4 failed `net::ERR_CONNECTION_RESET` / `SSL connect error` |
| Same host, ~20 min later | 6/6 | 6/6 | 6/6 | – |
| Cycle 1 C9 | 3/3 | 1/3 | 1/3 | U3/U4 passed first attempt |
| All other probes (cycle 1 F4/W4, cycle 2 ×3) | 3/3 | 3/3 | 3/3 | passed first attempt |

`api.stripe.com` was 6/6 throughout, so server-side billing was never affected. Classified as host-network TLS instability (E-01). No Checkout test needed a retry in cycles 1 and 2 (the spec allows one retry; it was not used: 0 flaky).

## 5. Pre-cycle investigation (cycle 0 and attempts)

| Run | SHA | Outcome | Disposition |
|-----|-----|---------|-------------|
| Probe before Stripe vars | `46c81390` | 29 pass, 1 worker crash (0xC0000409, host), 11 mail-gated skips | Host crash, not reproduced |
| Cycle 0 dry run | `46c81390` | Chromium core 30/30, billing 17/17, mail 12/13, Checkout U3/U4 fail, Firefox 24/26, WebKit 17/25 (+1 flaky) | Led to harness fixes H-01..H-04 and E-01/E-02 |
| Cycle 1 (background) | `a1759a6b` | Reaped by Claude Code at 3.2 GB free | Invalid; evidence kept; E-04 |
| Cycle 1 attempt 1 (batched) | `a1759a6b` | C1 RBAC-01 Chromium `page.goto` 45 s timeout; retry alone failed again | E-03 investigation, below |

**RBAC-01 Chromium timeouts (E-03).** Both failures left all four signed-in role contexts stuck on the same route at the same moment (`/teacher`, then `/parent/account`) while anonymous and guest finished it. A latency probe found no server stall: direct requests 0.9–1.6 s, browser loads 1.2–7.4 s, four parallel signed-in contexts 42 s for 12 routes each. Three traced runs (in-flight `route.fetch` count every 10 s, peak 50, none held > 10 s) passed, and RBAC-01 then passed in both formal cycles on all three engines (Firefox 3/3 and WebKit before that). Root cause not isolated; it coincided with the period of heavy host-memory fluctuation (free RAM 4.6–7.4 GB). Tracked as a low-severity environmental item.

## 6. Harness changes (commit `a1759a6b`, test code only, no assertion removed)

1. `e2e/hosted/fixtures.ts`: on WebKit, use the Vercel bypass cookie instead of `route.fulfill` (Playwright's Windows WebKit hangs a navigation on any fulfilled 3xx, which every protected-route redirect is); re-seed the cookie after `clearCookies()`.
2. `e2e/hosted/fixtures.ts`: `gotoSettled()` tolerates the app's own redirect winning a navigation race (`NS_BINDING_ABORTED`, "interrupted by another navigation"); every caller still asserts the final URL.
3. `auth-audit/02`: wait for `/signed-out` after sign-out (as `04` already does); `gotoSettled` where `/parent` is still redirecting to `/parent/setup` (#159 sends a parent with no child there, so this race only exists in the combined build).
4. `auth-audit/03`: `gotoSettled` in the open-redirect loop; the SameSite assertion runs on Chromium and Firefox only (coverage exception X1). `Secure` is still asserted on every engine.

## 7. Evidence

Kept locally, not committed (repository rule: no generated output or screenshots):

- `C:/tmp/combined-161/evidence/cycle1/`, `cycle2/`: batch JSON (`cycle<N>.jsonl`, one record per batch with run id, SHA, deployment, per-test status and duration, RAM minimum, browser process peak, orphans, Stripe probe), full list logs, and each run's `test-results/hosted/<runId>/` folder (screenshots, `deployment.json`, `audit-0x-evidence.json`, `real-email-evidence.json`, `report.json`).
- `C:/tmp/combined-161/evidence/diagnostics/`: latency probe spec, route-trace patch, and the RBAC-01 failure and trace runs.
- `C:/tmp/combined-161/evidence/cycle1-aborted/`: the memory-reaped run with measurements.
- `C:/tmp/combined-161/logs/`: cycle 0, triage runs, attempt 1.
