# MindMosaic AI UAT Assistant — Security, CSP, Accessibility & UI/UX Audit Report

**Date:** 26 November 2026  
**Branch:** `feat/ai-uat-assistant` (off `origin/dev`)  
**Scope:** `src/features/uat-assistant/**`, `src/app/api/uat/**`, `src/app/dev/uat/page.tsx`, `src/app/layout.tsx`, `next.config.ts`

---

## 1. Executive Summary

The **MindMosaic AI UAT Assistant** was reviewed against MindMosaic's standing architectural rules (`AGENTS.md`), canonical design specification (`docs/design.md` v2.2), enforced Admin Content-Security-Policy (`src/proxy.ts` / `src/lib/security/csp.ts`), client bundle budgets (`scripts/check-bundle.mts`), and WCAG 2.2 AA accessibility standards.

- **Production Isolation:** Verified fail-closed (`VERCEL_ENV=production`, `VERCEL_TARGET_ENV=production`, and `PRODUCTION_SUPABASE_PROJECT_REF` bindings are unconditionally refused across both UI and API routes).
- **Access Control (revised, see §5):** Restricted to accounts with an **active admin entitlement** (multi-role model of PR #165, Admin MFA honoured) and explicitly allowlisted tester accounts, with a 4-hour `HttpOnly`, `SameSite=Lax`, HMAC-SHA256 signed session cookie (`mm_uat_tester`) enabling cross-portal manual testing across Admin, Parent, and Student accounts in the same browser. The cookie's minting subject is **re-validated on every request**, and the tester can **End UAT session** at any time.
- **Enforced Admin CSP:** Verified zero CSP violations across `/admin/*` (`script-src 'self' 'nonce-...' 'strict-dynamic'`, `img-src 'self' data: blob:`).
- **Zero Side-Effect Capture:** Full-viewport shield + capture-phase event interception verified on active `/exam` sessions without triggering answers, dialogs, or submissions.

---

## 2. Security & Privacy Review

| Control Area | Implementation | Verification Evidence |
|---|---|---|
| **Production Hard-Block** | `uatAssistantAvailability()` checks `VERCEL_ENV === "production"`, `VERCEL_TARGET_ENV === "production"`, and `PRODUCTION_SUPABASE_PROJECT_REF` before evaluating any feature flag. `RootLayout` also omits `<UatAssistantBootstrap />` on production targets. | Unit tests (`uat-assistant-core.test.ts`) + Playwright production server spawn (`e2e/uat-assistant.spec.ts` → `404` on `/dev/uat` and `POST /api/uat/improve`, `{ enabled: false }` on `/api/uat/session`). |
| **Feature Flag / Kill Switch** | `MM_UAT_ASSISTANT_ENABLED=0` (or `false`) disables all UAT endpoints and UI immediately in every environment. | Unit tests (`uat-assistant-core.test.ts`). |
| **Admin / Tester Gate** | `verifyUatTesterAccess()` verifies Supabase `auth.getUser()` + an **active admin entitlement** (`user_roles`, with the legacy `profiles.role` rule only while that table does not exist) + Admin MFA (aal2) when `require_admin_mfa` is on + `!access_revoked_at`, or `MM_UAT_TESTER_USER_IDS` / `MM_UAT_TESTER_EMAILS`, or a valid HMAC-SHA256 `mm_uat_tester` cookie bound to the configured Supabase host **whose subject is re-validated on every request** (§5). | Unit token tamper/expiry/binding tests (`uat-assistant-routes.test.ts`) + Playwright auth role E2E (`e2e/auth/uat-assistant-auth.spec.ts`). |
| **CSRF & Rate Limiting** | Every mutating route (`DELETE` / `POST /api/uat/session`, `POST /api/uat/improve`, `POST /api/uat/github`) enforces `checkOrigin(request)` (MM-SEC-03) and `consumeRateLimit()`. | Route implementation & unit tests. |
| **Server-Only Credentials** | Reuses `QF_AI_PROVIDER` (`anthropic`, `openai`, `gemini`) and `MM_UAT_GITHUB_TOKEN` exclusively inside `import "server-only"` modules. Zero `NEXT_PUBLIC_` secrets introduced. | `npm run build` + `npm run check:bundle` + TypeScript server-only boundary. |
| **Credential, Token & Answer Secrecy** | Never intercepts `fetch`/`XHR`, cookies, or `localStorage`. Never reads `.value` on `<input>`/`<textarea>`. Redacts `<input type="password">`, PIN fields, `[data-correct]` / `.worked-solution`, unpublished `/admin/review` prose, URL query/hash tokens (`token_hash`, `code`, `access_token`), JWTs, and API keys (`sk_*`, `sbp_*`, `ghp_*`). | Unit redaction & DOM locator tests (`uat-assistant-core.test.ts`, `uat-assistant-routes.test.ts`). |
| **Explicit GitHub Confirmation** | `GitHubConfirmModal` previews repo, title, and redacted Markdown and requires ticking an explicit confirmation checkbox (`confirmed: true` validated by `zod` on the server) before `POST /api/uat/github` can execute. | Component integration test (`uat-assistant-ui.test.tsx`). |
| **Enforced Admin CSP & Permissions-Policy** | Uses native `<canvas>` 2D and same-origin dynamic chunk imports (`'strict-dynamic'`), avoiding `eval` or `foreignObject` SVG tainting. `Permissions-Policy` remains `microphone=()` in production and unflagged builds, allowing `microphone=(self)` only when the DEV UAT gate is active. | `e2e/auth/admin-csp-enforced.spec.ts` + `e2e/auth/uat-assistant-auth.spec.ts` + `security-headers.test.ts`. |

---

## 3. UI/UX, Design System & Accessibility Review (`docs/design.md` v2.2)

| Dimension | Assessment | Status |
|---|---|---|
| **Typography (§3)** | Uses self-hosted **Geist** (`var(--font-geist)`) for UI controls, body copy, metadata, and tables, and **Instrument Sans** (`var(--font-instrument-sans)`, weight `600`, `-0.028em` tracking) for dialog and dashboard headings. Tabular numerals (`tabular-nums`) applied to counts, dimensions, and IDs. | Pass |
| **Colour & Surface Hierarchy (§4–§5)** | Uses MindMosaic brand purple `#5925A8` (`--mm-brand`), warm neutral `#FCFBF8` (`--mm-page`), crisp `#FFFFFF` (`--mm-surface`), subtle `#F7F3FC` (`--mm-tint-soft`), and `#E9E4ED` (`--mm-line`) 1px borders. Zero generic SaaS/AI gradients, glows, or sparkle icons. | Pass |
| **Never Colour Alone (§20)** | Status badges (`Open`, `Fixed`, `Retest`, `Closed`) and voice dictation states pair semantic colour tokens with distinct Lucide icons and explicit text labels (`aria-pressed`). | Pass |
| **Native Top-Layer Dialogs & Focus** | Built on native `<dialog>` with `showModal()`, `overscroll-behavior: contain`, `h1` modal titles, logical keyboard Tab order, `Esc` dismissal, and solid `2px` high-contrast (`#5925A8`, ~9.3:1) `:focus-visible` outlines. | Pass |
| **Touch Targets & Mobile Reflow (§7)** | All buttons, filter pills, status selectors, and launcher controls enforce `min-h-11` (≥44px). Dashboard uses `@container` responsive table-to-card transformation; verified `0px` horizontal overflow at `375×812`. | Pass |
| **Bundle Weight (`check:bundle`)** | `UatAssistantBootstrap` adds `< 1.5 KB` to non-production layouts and lazy-loads `UatAssistantShell` only after `/api/uat/session` authorizes the tester, preserving static prerendering and cold-load budgets on `/`, `/exam`, `/results`, and `/showcase`. | Pass |
| **Automated Accessibility (`axe-core`)** | Scanned both `ReportIssueModal` and full-page `/dev/uat` Defect Dashboard with `@axe-core/playwright` — zero serious or critical WCAG violations. | Pass |

---

## 4. Residual Considerations

1. **Local-Only Defect Storage by Design:** Defects and (already redacted) base64 screenshots are persisted in browser IndexedDB (`mindmosaic_uat_assistant_v1`) per requirement 8. Switching physical devices requires using **Export JSON** / **Import JSON** (or **Create GitHub issue…**).
2. **Optional Server Secrets on Vercel Preview:** On Vercel Preview, the assistant works immediately for `admin` accounts. Enabling server-backed AI rewriting (`QF_AI_PROVIDER` + matching key) or direct GitHub issue creation (`MM_UAT_GITHUB_TOKEN`) on hosted Preview is optional and requires owner approval before adding Preview environment variables; both features have built-in local fallbacks (**Structure locally** and **Copy Markdown**) when unconfigured.

---

## 5. Follow-up Review — PR #166 Security & Acceptance Findings (2026-11-26)

### 5.1 Findings and fixes

| # | Finding | Severity | Root cause | Fix | Regression evidence |
|---|---|---|---|---|---|
| F1 | **Redaction was cosmetic.** `Redact mask` drew a black box over the image but the **untouched source frame (`rawDataUrl`)** was stored beside it in the draft, IndexedDB and the JSON export, and re-imported. Anyone with the file could decode the hidden pixels. | High (data exposure) | `UatScreenshotCapture` carried `rawDataUrl` + `annotatedDataUrl`; masks were vector metadata composited at render time. | Redactions are **burned into the pixels** when drawn (opaque, +2px bleed, re-encoded PNG) and the previous frame is discarded. The schema no longer has a raw field; the only retained image is the flattened, redacted one. An in-memory working copy (component ref, never persisted) supports undo of non-redaction marks only. Legacy records/exports/imports are scrubbed (`utils/screenshot-sanitize.ts`): `rawDataUrl` dropped; if a redaction was requested but never rendered into the image, the whole screenshot is discarded. IndexedDB records are rewritten clean on first read. | Unit: `uat-assistant-session-security.test.ts` (schema strips raw, sanitizer, export, import). Playwright: **pixel test** (blue block redacted → centre pixel black, 0 blue pixels, exactly one `data:image` in the draft, IndexedDB and JSON export, no `rawDataUrl`) and **legacy-scrub test**. |
| F2 | **No way to end a UAT session**; tester cookie lived 12 h and survived sign-out/role changes. | High | Only an unused `DELETE` handler existed. | **End** control (confirm dialog) → `DELETE /api/uat/session` clears the tester + hint cookies and sets an httpOnly `mm_uat_ended` marker so the assistant stays off — even for a signed-in admin — until an explicit **Start new UAT session** (`POST`, full re-validation) on `/dev/uat`. Cookie TTL cut to 4 h, per-mint `sid`, and `MM_UAT_SESSION_EPOCH` rotation invalidates every outstanding cookie. Local defects are never deleted by End. | Playwright (public build + auth): End → cookies gone, `{enabled:false,ended:true}`, API 403, stays off after reload, defects retained, restart works. Unit: TTL, sid, epoch. |
| F3 | **Revocation not honoured.** A revoked administrator's cookie kept working in Parent/Student sessions until expiry. | High | The cookie path trusted the signature alone. | Every cookie use re-checks the minting subject with the service role (`revalidateTesterSubject`): access-revoked, admin entitlement revoked, or allowlist removal ⇒ refused and credential cleared; unexpected errors ⇒ refused (fail closed); no service role ⇒ refused. | Unit: revoked grant with profile still `admin`, access-revoked, vanished profile, lookup errors, legacy table-missing, allowlist by id/email. Auth Playwright: revoke admin while on a Student session → launcher gone, cookie cleared, `/api/uat/improve` 403 (restored afterwards). |
| F4 | **UAT permissions diverged from the multi-role model (PR #165).** `profiles.role = 'admin'` was sufficient; Admin MFA was never consulted. | High | Gate predates PR #165. | `uat-entitlement.ts` mirrors #165 semantics without importing it, so the PRs can land in either order: admin = **active `user_roles` grant** (revoked grant ⇒ not admin even if the profile says admin); table missing (`42P01`/`PGRST205`) ⇒ legacy rule, no MFA switch yet; any other error ⇒ **fail closed**; `admin_mfa_required` + aal2 enforced — an admin below aal2 is refused outright, **even if allowlisted or holding a cookie**, and its cookie is dropped. | Unit: standing matrix, MFA matrix (switch off/on, aal1/aal2, rpc error/throw, aal throw). |

### 5.2 Residual risk & decisions

- **Redaction is destructive by design.** Undoing a redaction is impossible; the UI says so. Testers who need the original can re-capture.
- **Screenshots are only as good as the mask.** The assistant cannot detect what is sensitive on a captured tab/upload; testers must still draw masks. The layout snapshot redacts sensitive DOM text itself.
- **Cookie revalidation costs 1–2 service-role reads per UAT request** (DEV-only tool; negligible). When `SUPABASE_SERVICE_ROLE_KEY` is absent the cookie path is refused, so cross-portal switching needs that server variable on the Preview (already present on DEV Previews).
- **Follow-up after PR #165 merges:** swap `uat-entitlement.ts` for the shared `loadAdminGrants`/`resolveEntitledRoles` helpers (semantics identical; covered by the same cases).
- Clearing the browser's IndexedDB remains the only way to remove saved defects; End deliberately does not.

### 5.3 Defects found while verifying (all fixed)

| Defect | Found by | Fix |
|---|---|---|
| Edits to a screenshot (marks, undo, redaction) each rendered from a stale render closure, so a slow mark render could in principle overwrite a later redaction with an image that still held the unredacted pixels. | Code review of the redaction path while diagnosing the first hosted failure. | All edits now run through one serial queue over a single in-memory work record (`ScreenshotAnnotator`). Regression: Playwright draws a highlight and immediately a redaction, then asserts the stored and exported pixels are black. |
| `/dev/uat` linked to `/staff/mfa`, a route that only exists once PR #165 lands (dead link; failed the navigation-graph test in CI `core`). | CI `core` on `2d3ae466`. | Replaced with a plain "Admin MFA required" notice. |
| Hosted/local tests drew on a canvas below the fold and seeded IndexedDB before the app created it. | Hosted run 1, local run 5. | Tests scroll the canvas into view and wait for the app-created database. (Test-only; no product change.) |

### 5.4 Execution evidence (head `63a8ee49`)

| Check | Result |
|---|---|
| Typecheck, ESLint (changed areas), `check:bundle` | clean; all routes within budget |
| Unit: new `uat-assistant-session-security.test.ts` | 26/26 |
| Unit: UAT core/routes/UI + security-headers + app-header + navigation-graph | all pass |
| CI `core` (full vitest suite), `rls`, `scholarship-drafts`, `e2e-auth` (incl. revocation + End-session specs), Vercel | pass on `63a8ee49` |
| CI `e2e` | first attempt failed in 20 s at `npx playwright install` (runner infrastructure, before any test ran); re-run recorded in the PR |
| Local Playwright `e2e/uat-assistant.spec.ts` (6 tests: production hard-block, full workflow with axe + 375 px overflow, **pixel-level redaction**, legacy scrub, End session) | pass (one earlier run flaked on the IndexedDB seeding race, fixed) |
| Hosted DEV Preview `mindmosaic-exam-engine-8r93up6d3-…vercel.app` (`e2e/hosted/uat-assistant-hosted.spec.ts`, 4 tests) | 4/4 pass: admin access + enforced Admin CSP with zero app violations; element selection, voice dictation (stubbed engine), screenshot + permanent redaction (stored and exported pixels black, 0 recoverable blue pixels), annotation, reload persistence, Markdown/JSON export, GitHub confirmation gate (no issue created), cross-portal cookie, **revocation clears the cookie on the next load**, **End session off until explicit restart (API 403)**, axe on report dialog, dashboard and end dialog |
| Real AI rewriting on the Preview | **BLOCKED.** The Vercel project has no `QF_AI_PROVIDER` or provider key; `/api/uat/session` reports `aiConfigured:false`. The route is verified with mocked provider responses (unit) and the documented local fallback was exercised on the Preview, but a real provider round trip has not been observed. Needs owner approval to add Preview-scoped variables. |
| GitHub issue creation | Not exercised against GitHub (no `MM_UAT_GITHUB_TOKEN` on the Preview, and creating issues was out of scope). The confirmation gate and Markdown fallback were verified. |
| Vercel Preview toolbar | One `frame-src https://vercel.live` CSP report per admin page on Preview deployments only; injected by Vercel, not by the app. Excluded from the zero-violation assertion and counted in the evidence. |

### 5.5 Test accounts left on DEV (nothing deleted)

The hosted runs created 2 fixture accounts per run (an admin and a parent, `mm-accept-<run>-uat-admin|parent@example.com`), five runs in total. No record was deleted; the fixture admins were demoted to the parent role and any temporary access revocation was lifted. They belong in the existing synthetic-account cleanup plan.

---

## 6. NVIDIA Nemotron provider (PR #166 addition)

### 6.1 What was added

`nvidia` is a fourth selectable server-side provider (`QF_AI_PROVIDER=nvidia` or `MM_UAT_AI_PROVIDER=nvidia`). It calls NVIDIA's documented OpenAI-compatible NIM endpoint (`POST {base}/chat/completions`, bearer auth, default base `https://integrate.api.nvidia.com/v1`). Anthropic, OpenAI, Gemini and the deterministic local fallback are unchanged in behaviour.

| Variable | Scope | Notes |
|---|---|---|
| `NVIDIA_API_KEY` | server-only, **Sensitive** | Never sent to the browser, never in responses or logs |
| `QF_AI_NVIDIA_MODEL` | server-only | Required; no hard-coded default because the catalogue changes |
| `NVIDIA_API_BASE_URL` | server-only, optional | Must be `https` on an `nvidia.com` host |

### 6.2 Security properties

- **Key cannot be redirected.** The endpoint is validated (https only, `nvidia.com`/`*.nvidia.com` host, no userinfo, query or fragment; look-alike suffixes such as `nvidia.com.evil.example` are rejected). An invalid value makes the provider "not configured" and **no request is made**.
- **Redaction and verbatim notes unchanged.** The same prompt builder redacts secrets/URLs before the call and the same output pass re-redacts model output. The tester's original notes are never mutated or overwritten by a rewrite.
- **No invented evidence.** Same strict non-hallucination prompt and zod schema; anything off-schema becomes `malformed_output`.
- **Failure handling.** 401/403 → credential message (status only, never the key); 429 → rate-limit message; other non-2xx → status; network error → unreachable; empty/null content → `provider_failed`; unreadable or off-schema content → `malformed_output` ("Your original notes are safe"). Nemotron `<think>…</think>` reasoning blocks are stripped before JSON parsing.
- **Timeouts (all providers).** Every provider call now carries a 30 s `AbortSignal.timeout`. Previously none had a ceiling, so a stalled upstream could hold a route open. This is a behaviour change for Anthropic/OpenAI/Gemini (strictly safer) and is covered by tests.
- **Reporting.** The response draft carries `providerId: "nvidia"`, the configured `modelId` and `mode: "ai"`.

### 6.3 Evidence

- `src/tests/unit/uat-assistant-nvidia-provider.test.ts` (35 tests, mocked HTTP; **no live NVIDIA call was made**): configuration matrix, unsafe-endpoint refusal, real-rewrite request shape (URL, bearer header, model, redaction, original input unmutated), echoed-secret re-redaction, `<think>`/fence stripping, 401/403/429/503, timeout (both a TimeoutError and the armed 30 s signal), network error, prose/truncated/off-schema/missing-field output, null/empty/no-choice content, non-JSON body, and unchanged behaviour of the other three providers.
- Typecheck and ESLint clean; related UAT unit and component suites pass (88/88).

### 6.4 Not verified (honest gaps)

- **No live NVIDIA call.** There is no NVIDIA key in any environment I can use, and I will not request one. Real rewriting quality, the exact current model id and NVIDIA-side latency remain unverified until the owner sets the Preview variables below and the hosted spec is rerun.
- The Nemotron reasoning-block handling is based on documented model behaviour and tested with synthetic output, not captured live output.

## 7. Live Nemotron acceptance (2026-11-27)

**Verdict: NO-GO — live AI call reaches NVIDIA but is rejected with HTTP 410. Not yet accepted.**

| Step | Result |
|------|--------|
| 1. NVIDIA env vars on Preview | **PASS** (after owner edit). `NVIDIA_API_KEY`, `MM_UAT_AI_PROVIDER`, `QF_AI_NVIDIA_MODEL` now target production + preview + development (all Sensitive, values not readable). Production scope should be confirmed intentional. |
| 2. Redeploy head | **PASS.** `dpl_9TMkAHbBeA8gKtSRhJpedShkMrpW`, commit `d2353ee8`, READY, alias `...-git-feat-ai-9d0675-...`. |
| 3. Hosted UAT-H2 against real API | **FAIL.** `/api/uat/session` reports `aiConfigured: true`. `POST /api/uat/improve` → **502** `{"ok":false,"code":"provider_failed","message":"NVIDIA API returned 410."}`. |
| 4. providerId=nvidia, mode=ai, model ID, JSON, notes preserved | **Not verifiable** — no draft returned. |
| 5. Timing / error handling | Failure returned in **1.3 s** (limit 30 s). The error path behaves as designed: generic message, no key, original notes untouched, 502 not 500. |
| 6. Credentials / unpublished questions | **PASS (request side).** Browser request keys are only `originalNotes, route, pageUrl, portal, browser, viewport, element`; spec asserts no key/bearer/answer-key strings. The NVIDIA request body was not observable. |
| 7. PR #165 compatibility (Admin MFA, revocation, cross-portal) | Hosted H1/H3/H4 passed on `63a8ee49` (see §5.4); not re-run on `d2353ee8` because the AI path blocks acceptance. PR #165 head `941855ce`. |

**Cause (inferred, not proven):** the code has no default model; the ID comes only from `QF_AI_NVIDIA_MODEL`. HTTP 410 from NVIDIA's API means the model or endpoint is retired. NVIDIA's public model list (`/v1/models`, unauthenticated) currently includes: `nvidia/nemotron-3-ultra-550b-a55b`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, `nvidia/nemotron-3.5-super-vl-120b-a12b`. The configured value could not be read (Sensitive), so it was not compared.

**Owner action:** set `QF_AI_NVIDIA_MODEL` on Preview to a model ID present in that list, redeploy, rerun UAT-H2.
