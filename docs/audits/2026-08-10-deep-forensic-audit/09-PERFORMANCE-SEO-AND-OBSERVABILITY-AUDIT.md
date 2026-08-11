# Performance, SEO and Observability Audit

## Coverage and method

The production build, repository bundle checker, public response size/headers, metadata exports, sitemap/robots, image/font configuration, bank projections, server queries and logging/analytics code were inspected. No Lighthouse, Web Vitals or production telemetry values are claimed.

## Measured/local facts

- Production build completed in 52.8 seconds on the first audit run; the bundle-gate rebuild compiled in 9.4 seconds plus 54 seconds TypeScript.
- Guest bank: HTTP 200, 5,326,950 raw bytes (5.08 MiB), `s-maxage=31536000`, no observed content encoding on the local request.
- Bundle gate: `/` 1,052/1,350 KB; `/exam` 1,411/1,420 KB; `/results` 1,388/1,350 KB; `/showcase` 1,359/1,350 KB.
- Server-only sentinel scan found no bank content in client JS, prerendered HTML or RSC payloads.

## Verified strengths

- Most public and role pages export titles; key public pages include descriptions; dynamic programme/exam routes generate metadata.
- Root metadata supplies social-image defaults and a metadata base.
- Robots blocks API, role, exam/results and development route prefixes; the dev route also opts out of indexing and 404s in production.
- Sitemap includes only live programme/pattern routes rather than coming-soon dynamic pages.
- Local font loading and structured visual rendering avoid a third-party UI runtime.
- Aggregate analytics queries are server-side and pre-aggregated rather than shipping raw child answers to admin dashboards.

## Findings

### P2 Medium

- `MM-AUD-PERF-001`: `/api/exam/guest-bank` returns three overlapping complete banks, including keys/explanations, instead of a selected/session-scoped payload. At 5.08 MiB raw it creates parse/memory/mobile cost and simplifies wholesale scraping.
- `MM-AUD-PERF-002`: `/results` and `/showcase` exceed enforced local budgets. The gate is not in CI.
- `MM-AUD-SEO-001`: sitemap lists `/billing`, a dynamic authenticated/role-dependent surface, while robots does not disallow it. Search engines should receive public pricing, not an account/billing console.
- `MM-AUD-OBS-001`: failures are logged mainly with unstructured `console.error`; there are no correlation IDs, health/readiness endpoint, privacy-safe error service or explicit alert paths for failed submissions, timer expiry, scoring, auth or publication gates. Admin operations is mock data.

## Static risks, not measurements

Several role pages compose multiple sequential Supabase queries (context, roster, attempts, marks), creating potential waterfalls. No production query plans or N+1 latency were available, so no database-performance finding was raised. Cache behaviour for user-specific pages is explicitly dynamic, reducing cross-user static leakage risk.

## SEO/product truth

Route-specific titles are materially better than the earlier “missing metadata” regression target, which is ruled out. Canonicals are not explicitly set per route, but no concrete duplicate-indexing failure was proven. The material SEO issue is factual: root/landing metadata describes a broader current platform than the live programme set (`MM-AUD-PROD-001`).

## Gaps and blocked verification

Lighthouse/Core Web Vitals, compressed CDN transfer, production cache headers, search indexing, source-map exposure, database query plans and alert delivery were not measured. The reported bundle/payload figures are local production-build measurements only.

## Priorities

Make guest-bank delivery session/config scoped and compressed; split result/showcase client bundles; move billing console out of the sitemap; define structured request/error events and release-critical alerts before production traffic.
