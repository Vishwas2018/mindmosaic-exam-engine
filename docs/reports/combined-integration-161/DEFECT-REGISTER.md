# Combined integration defect register: PR #161 (#156 + #159 + #160)

Date 2026-11-24. Tested SHA `a1759a6b`. Classes: **APP** application defect, **HAR** test harness, **ENV** infrastructure/environment, **CFG** configuration.

## Application defects

**None found.** No application code was changed during integration testing. Every failure observed was traced to the harness, the test host, or configuration, and each is listed below with its evidence.

## Register

| ID | Class | Severity | Title | Evidence | Status |
|----|-------|----------|-------|----------|--------|
| H-01 | HAR | Medium (blocked WebKit coverage) | Playwright Windows WebKit hangs `page.goto` when the bypass `route.fulfill` returns a 3xx | Cycle 0 WebKit: 5 × `page.goto: Timeout 45000ms` (A3, AUTH-02, RBAC-01, B1, V), all on protected-route redirects; also recorded in #160 CROSS-BROWSER-RESULTS | **Fixed** `a1759a6b` (WebKit uses the bypass cookie). Verified: all five pass, 2/2 cycles |
| H-02 | HAR | Medium | WebKit sign-out via `clearCookies()` also removed the bypass cookie → next page was Vercel SSO | B3–B8 click timeout after the H-01 change (caught before commit) | **Fixed** `a1759a6b` (cookie re-seeded after `clearCookies`) |
| H-03 | HAR | Medium | Firefox/WebKit navigation races: `NS_BINDING_ABORTED` / "interrupted by another navigation" when the test navigates while the app is still redirecting | Cycle 0 Firefox AUTH-02, SEC-01; triage AUTH-02 line 283 (`/parent` → `/parent/setup` for a parent with no child, a #159 behaviour that only appears in the combined build) | **Fixed** `a1759a6b` (`gotoSettled`, wait for `/signed-out`); final-URL assertions kept. Firefox AUTH-02 3/3, SEC-01 2/2, then 2/2 cycles |
| H-04 | HAR | Low | Playwright Windows WebKit reports `sameSite: "None"` for every cookie | Probe: a cookie set `SameSite=Lax` / `Strict` on `example.com` reads `Lax`/`Strict` in Chromium and Firefox, `None` in WebKit | **Coverage exception X1** (assert skipped on WebKit only; not counted as a pass) |
| H-05 | HAR (runner) | Low | Batch runner split specs E/H/V from spec A, whose `family-a.json` they read | Cycle 1 first C3/C4 attempts: `ENOENT family-a.json`, no app code reached | **Fixed** in the runner (`FAMILY_FILE` from the same cycle's family-chain batch). Re-runs passed; cycle 2 clean first time |
| E-01 | ENV | Medium (intermittent) | Test host's TLS handshakes to Stripe's front-end hosts fail intermittently | Cycle 0: `checkout.stripe.com` 2/6, `js.stripe.com` 2/6, `m.stripe.network` 1/6 (`schannel: failed to receive handshake`); U3/U4 `ERR_CONNECTION_RESET`/`SSL connect error`. `api.stripe.com` 6/6 | **Environmental.** Probe before every Checkout batch; 5 of 6 later probes 3/3, one degraded; Checkout passed first attempt in all 6 formal batches |
| E-02 | ENV | Low (intermittent) | One real confirmation email not delivered within 95 s | Cycle 0 REG-02 (1 of 13 scenarios). Isolated re-run passed (mail in seconds); double-click probe proved a single signup request | **Environmental.** Cycles 1–2: 16/16 measured messages first attempt, 0–2 s |
| E-03 | ENV | Low | RBAC-01 on Chromium timed out twice (45 s `page.goto`) with all four signed-in contexts stalled at once | Attempt 1 runs `rmwu81ubg`, `rmwu8c4vp`. Latency probe: no server stall (direct 0.9–1.6 s; 4 parallel contexts fine). 3 traced runs: no `route.fetch` held > 10 s | **Not reproduced.** Passed 3/3 diagnostics + 2/2 cycles on Chromium, Firefox and WebKit. Root cause not isolated; coincided with host memory swings. Watch in post-merge runs |
| E-04 | ENV | High (for local testing only) | Host memory exhaustion: background test runs reaped by Claude Code; later a game process took ~6 GB | Reaped at 3.2 GB free (14:31); free RAM 0.16–4.9 GB at 15:04 | **Mitigated** by the foreground batch runner (≥ 8 GB start, < 4 GB stop, own-process cleanup). No orphans in 34 formal batches |
| E-05 | ENV | Low | Windows host worker crash `0xC0000409` on one run | Probe run before Stripe vars | Not reproduced |
| C-01 | CFG | High (blocked real-email tests) | Candidate Preview alias not in DEV Supabase redirect allowlist; links fell back to `git-dev` | `generateLink` probe MISMATCH ×2 | **Resolved by owner** (alias added). Re-probe MATCH; negative control still rejected |
| C-02 | CFG | Info | Candidate had no Stripe Preview variables (previous sandbox key destroyed in #159 cleanup) | Configuration listing | **Resolved**: owner issued a new sandbox key; candidate-branch-only variables and webhook created |

## Carried forward (not integration defects; production blockers from #159/#160)

| ID | Source | Item |
|----|--------|------|
| O-02 | #159 | Pricing is provisional |
| O-04 | #159 | `/terms` self-describes as a draft pending legal review; `/terms` and `/privacy` do not cover subscriptions, billing, cancellation, refunds, GST or Stripe |
| O-06 | #159 | `past_due` grace policy and per-environment `BILLING_ENFORCEMENT_ENABLED` undecided |
| Live Stripe | #159 | Live account verification, GST settings, live products/prices with the lookup keys, live webhook, live portal, live keys in Production only |
| CSP | #160 | `MM_DEV_AUTH_CSP_ENFORCE=1` was enabled for the candidate only; decide for `dev` Preview and Production |
