# Vercel resource consumption audit (2026-11-28)

Read-only. No code, billing, deployment, secret or production change was made. DEV project `mfglzabnayacssgertat`; Vercel project `mindmosaic-exam-engine` (Next 16.4.6, Fluid compute, functions in `iad1`, Node 24, team plan `hobby`).

## 0. How much of this is measured

| Evidence | Status |
|---|---|
| Soft block `FAIR_USE_LIMITS_EXCEEDED`, overage type `fluidCpuDuration` (Active CPU), set 2026-11-28 12:13:05Z, auto-lift 2026-12-28 12:13:05Z | **Measured** (Vercel team API) |
| Per-route CPU, invocation counts, middleware time, request counts | **Not available.** `vercel metrics` and the observability API return `payment_required`: Hobby has no Observability Plus, and the billing-charges API returns `costs_not_found`. |
| Everything below about *which* routes are expensive | **Static analysis of the code at `dev` `2104c0c7`**, not telemetry. |
| Hosted-automation contribution and the cost table | **Estimates** with the assumptions shown. They have not been measured. |

So the ranking below says where the code does repeated work; it does not give per-route milliseconds. After an upgrade to Pro plus Observability Plus, the queries in section 9 turn each estimate into a measurement.

## 1. Most likely cause of the block (hypothesis, not proof)

Hobby includes roughly 4 Active-CPU hours a month. One full hosted regression (about 60 tests, real browsers, 21 minutes) drives on the order of tens of thousands of proxied requests, and every one of them runs `src/proxy.ts` on a function (section 3). At an assumed 25-40 ms of CPU per request that is a few tenths of a CPU-hour per full run. About ten full or partial hosted runs, auth-audit repeats and manual testing this month fit inside the 4-hour limit being crossed. The product's own load for the beta (section 8) is two orders of magnitude smaller. **The block is a Hobby-plan ceiling hit by test automation, not evidence that the app is expensive to run.**

Hobby is also non-commercial under Vercel's terms, so the beta cannot run on it regardless.

## 2. Highest-CPU routes and functions (by code, not by telemetry)

| Rank | Where | Why it is expensive |
|---|---|---|
| 1 | `src/proxy.ts` (runs for every non-asset request, including API calls and router prefetches) | Per request: UUID, CSP string build, Supabase client construction, then `await supabase.auth.getUser()` (a network round trip to Supabase Auth whenever an auth cookie is present). It runs even for pages that are otherwise static, so those pages still cost a function invocation. |
| 2 | Dynamic role areas: `/parent`, `/student`, `/teacher`, `/admin`, `/billing` (each `layout.tsx` is `force-dynamic`) | Every navigation = proxy `getUser` + layout `requireRole` (`getUser`, `profiles` select, `user_roles` grants) + `requireActiveSubscription` RPC + the page's own `getUser` and data queries (about 15 parent pages call `getUser` again). At least six sequential Supabase round trips before page data. |
| 3 | `POST /api/exam/session/[id]/responses` (autosave, debounce 2 s after each answer change) | Proxy `getUser`, route `getUser`, `resolveSittingSource`, `exam_sessions` select, `exam_attempts` select, `exam_responses` upsert: five to six round trips per saved answer. The highest-volume student route. |
| 4 | `/api/exam/session`, `/submit`, `/session/active`, `/api/practice/check` | Scoring and bank selection: the question banks (about 1.7 MB of TypeScript content under `src/content`, one file 390 KB) are imported by shared server modules, and `outputFileTracingIncludes` `/*` adds the published manifests and approvals to every function. Cold starts parse them. |
| 5 | `/api/stripe/*` and the webhook | Low volume; webhook does ledger writes and signature verification. Not a CPU concern. |
| 6 | `/api/uat/*` (DEV only, NVIDIA model call) | External call duration, not Vercel CPU; DEV-flag gated. |

## 3. Excessive middleware execution

- `src/proxy.ts` matcher excludes only `_next/static`, `_next/image`, `favicon.ico` and image extensions. API routes, every page, every `Link` prefetch and every RSC request go through it. The repository has about 429 `<Link>` elements; default viewport prefetching of dynamic routes sends one proxied request per link per page view.
- It refreshes the session for guests too: with no auth cookie `getUser` returns locally, so the cost is mostly the UUID, CSP and client setup, but it is still an invocation per request.
- `getClaims()` exists in the installed `@supabase/auth-js` but is unused in `src`; the proxy uses the networked `getUser()`.

## 4. Unnecessary requests and polling

- No server polling and no `setInterval` that calls the network. The intervals found (exam timer 1 s, condition bar 5 s, resend cooldown 1 s) are client-only. `CheckoutStatusToast` does a single `router.refresh()` after 2.5 s.
- Per-page-load fetches that duplicate server data: `ActiveSessionBanner` calls `GET /api/exam/session/active` on `/exams`, `/practice` and My Space; `SubscriptionOverviewCard` calls `/api/stripe/status` although billing pages already load the subscription server-side.
- No scheduled work: no `vercel.json`, no crons, no `schedule:` in `.github/workflows/ci.yml`, no Vercel workflows. CI runs against local servers, not Vercel.

## 5. Inefficient queries and repeated authentication

- Auth identity is resolved up to three times per request (proxy, layout, page) and each is a network call. `React.cache` is not used for it (`src/features/auth`, `src/lib/supabase`).
- `requireRole` + `requireActiveSubscription` make three separate queries (`profiles`, admin grants, `current_parent_has_access`) that could be one.
- Functions run in `iad1`; `mfglzabnayacssgertat` is reachable through a Melbourne edge, so the database is probably in the Asia-Pacific region (unconfirmed). If so, each of those round trips crosses the Pacific, which inflates function wall time (memory GB-hours) and every response's latency.
- RLS policies call the helper functions hardened in #169; their added identity checks are cheap and run in the database, not on Vercel.

## 6. Hosted automation's contribution

Estimate: a full hosted regression is on the order of 40-60k proxied requests (about 60 tests, 20+ page loads each, 25-60 requests per load including RSC, API and prefetch). At 25-40 ms CPU each, 0.3-0.7 CPU-hours per run. Auth-audit (RBAC-01 alone is 2.7 minutes) and the multi-role specs are the heaviest. Every branch push also builds a Preview deployment (build minutes, not Active CPU). Docs-only PRs (#170, #171) still trigger builds.

## 7. Recommended optimisations (none applied; each preserves behaviour and the security model)

| # | Change | Effect | Security check |
|---|---|---|---|
| 1 | In `proxy.ts`, call `getClaims()` instead of `getUser()` for the cookie-refresh step (needs asymmetric JWT signing keys on the Supabase project; otherwise it falls back to `getUser`) | removes one network round trip from every authenticated request | The proxy never blocks. Authorisation stays in `requireRole` and the route handlers, which keep `getUser()` (revocation-aware). |
| 2 | Skip the Supabase client entirely in the proxy when no `sb-*-auth-token` cookie is present | cuts guest and public-page cost | No auth to refresh without a cookie; CSP and nonce unchanged. |
| 3 | Wrap `getUser` + role resolution in `React.cache()` so layout, shell and page share one resolution per request | removes 2 of 3 `getUser` calls per navigation | Same call, same result, per request only. |
| 4 | One `SECURITY DEFINER` RPC returning profile, entitled roles and access flag (a migration; needs approval) | 3 queries become 1 | New function must follow the #169 rule: caller-bound, no anon EXECUTE. |
| 5 | Pin `functionDefaultRegions` to the Supabase region once confirmed (a Vercel setting; needs approval) | largest latency and duration win | None. |
| 6 | Collapse the autosave route's selects into one query or RPC; keep the upsert and submit-lock checks | 5-6 round trips to 2-3 on the highest-volume route | Ownership and submit-lock predicates must stay in the same statement. |
| 7 | `prefetch={false}` on links into `/parent`, `/student`, `/teacher`, `/admin` and on long result lists | removes prefetch invocations | None. |
| 8 | Load question banks per programme on demand instead of importing all content in shared modules; trim `outputFileTracingIncludes["/*"]` to the routes that read manifests | lower cold-start CPU and bundle size | Answer keys stay server-only; keep the existing `server-only` guard. |
| 9 | Replace `ActiveSessionBanner` / `SubscriptionOverviewCard` fetches with server-provided props or a short client cache | fewer API calls | None. |
| 10 | Images: sources are already WebP; list `image/webp` only (drop AVIF) or serve them unoptimised | halves image-transformation work | None. |
| 11 | Hosted automation: run the full hosted suite only for release candidates; docs-only PRs use an ignored-build step; run auth-audit and billing suites on demand; tag test traffic with a header so telemetry can split it | cuts the dominant cost on the current plan | Test coverage unchanged for release gates. |
| 12 | Upgrade the team to Pro, add Observability Plus, then re-run section 9 | converts every estimate here into data | Billing change: owner only. |

## 8. Estimated monthly cost (USD, estimates)

Assumptions, all unmeasured: a student does about 12 sessions a month; one session is about 10 navigation requests, 30 autosaves and 8 submit/result calls; one parent makes about 4 visits of 15 requests per child. That is about 1,000 function invocations per active student per month (including proxy), about 40 ms CPU and 0.8 s wall time per invocation at 1.7 GB, about 0.5 MB per page view. Prices as I know them for Pro (verify on vercel.com/pricing before relying on them): $20 per seat including $20 of usage credit; Active CPU about $0.13 per hour; provisioned memory about $0.011 per GB-hour; extra invocations $0.60 per million beyond 1 M; transfer included up to 1 TB.

| Active students | Invocations / month | Active CPU h | Memory GB-h | Usage cost | Vercel total (1 seat) |
|---|---|---|---|---|---|
| 10 | 10 k | 0.1 | 4 | under $0.1 | $20 |
| 50 | 50 k | 0.6 | 19 | about $0.3 | $20 |
| 100 | 100 k | 1.1 | 38 | about $0.5 | $20 |
| 500 | 500 k | 5.5 | 190 | about $3 | $20 |
| 1,000 | 1 M | 11 | 380 | about $6 | $20-26 |

Usage stays inside the included credit up to about 1,000 students even at three times these figures. The Vercel bill is the seat price (add $20 per extra seat) plus Observability Plus if wanted.

Other hosting costs the beta will actually carry (not Vercel):

| Active students | Supabase | Email | Indicative total |
|---|---|---|---|
| 10-100 | Pro $25 | free tier | about $45 |
| 500 | Pro $25 plus Small compute about $5 net | free tier | about $50 |
| 1,000 | Pro $25 plus Small compute about $5 net | Resend Pro $20 if over about 3,000 mails | about $50-70 |

Stripe fees are per transaction and excluded. Scholarship, billing and writing-marking volumes would change these; none was modelled.

## 9. After an upgrade: queries that replace the estimates

```
vercel metrics vercel.function_invocation.function_cpu_time_ms --scope <team> -p mindmosaic-exam-engine --since 7d --group-by route -n 15
vercel metrics vercel.middleware_invocation.count --scope <team> -p mindmosaic-exam-engine --since 7d --granularity 1d
vercel metrics vercel.request.count --scope <team> -p mindmosaic-exam-engine --since 7d --group-by route -n 15
vercel metrics vercel.function_invocation.function_duration_gbhr --scope <team> -p mindmosaic-exam-engine --since 7d --group-by route
```

## 10. Status

Service is still returning `402 DEPLOYMENT_DISABLED` on the DEV alias (rechecked after this audit). Outstanding beta acceptance tests (W1-W4 `s2`/`s4`, the remaining billing specs, real-mail and password-recovery specs) resume when it returns, by owner upgrade or on 2026-12-28.
