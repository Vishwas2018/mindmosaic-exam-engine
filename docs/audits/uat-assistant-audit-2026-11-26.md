# MindMosaic AI UAT Assistant — Security, CSP, Accessibility & UI/UX Audit Report

**Date:** 26 November 2026  
**Branch:** `feat/ai-uat-assistant` (off `origin/dev`)  
**Scope:** `src/features/uat-assistant/**`, `src/app/api/uat/**`, `src/app/dev/uat/page.tsx`, `src/app/layout.tsx`, `next.config.ts`

---

## 1. Executive Summary

The **MindMosaic AI UAT Assistant** was reviewed against MindMosaic's standing architectural rules (`AGENTS.md`), canonical design specification (`docs/design.md` v2.2), enforced Admin Content-Security-Policy (`src/proxy.ts` / `src/lib/security/csp.ts`), client bundle budgets (`scripts/check-bundle.mts`), and WCAG 2.2 AA accessibility standards.

- **Production Isolation:** Verified fail-closed (`VERCEL_ENV=production`, `VERCEL_TARGET_ENV=production`, and `PRODUCTION_SUPABASE_PROJECT_REF` bindings are unconditionally refused across both UI and API routes).
- **Access Control:** Restricted to verified `admin` users and explicitly allowlisted tester accounts, with a 12-hour `HttpOnly`, `SameSite=Lax`, HMAC-SHA256 signed session cookie (`mm_uat_tester`) enabling seamless cross-portal manual testing across Admin, Parent, and Student accounts in the same browser.
- **Enforced Admin CSP:** Verified zero CSP violations across `/admin/*` (`script-src 'self' 'nonce-...' 'strict-dynamic'`, `img-src 'self' data: blob:`).
- **Zero Side-Effect Capture:** Full-viewport shield + capture-phase event interception verified on active `/exam` sessions without triggering answers, dialogs, or submissions.

---

## 2. Security & Privacy Review

| Control Area | Implementation | Verification Evidence |
|---|---|---|
| **Production Hard-Block** | `uatAssistantAvailability()` checks `VERCEL_ENV === "production"`, `VERCEL_TARGET_ENV === "production"`, and `PRODUCTION_SUPABASE_PROJECT_REF` before evaluating any feature flag. `RootLayout` also omits `<UatAssistantBootstrap />` on production targets. | Unit tests (`uat-assistant-core.test.ts`) + Playwright production server spawn (`e2e/uat-assistant.spec.ts` → `404` on `/dev/uat` and `/api/uat/session`). |
| **Feature Flag / Kill Switch** | `MM_UAT_ASSISTANT_ENABLED=0` (or `false`) disables all UAT endpoints and UI immediately in every environment. | Unit tests (`uat-assistant-core.test.ts`). |
| **Admin / Tester Gate** | `verifyUatTesterAccess()` verifies Supabase `auth.getUser()` + `profiles.role === "admin"` (and `!access_revoked_at`), or `MM_UAT_TESTER_USER_IDS` / `MM_UAT_TESTER_EMAILS`, or a valid HMAC-SHA256 `mm_uat_tester` cookie bound to the configured Supabase host. | Unit token tamper/expiry/binding tests (`uat-assistant-routes.test.ts`) + Playwright auth role E2E (`e2e/auth/uat-assistant-auth.spec.ts`). |
| **CSRF & Rate Limiting** | Every mutating route (`DELETE /api/uat/session`, `POST /api/uat/improve`, `POST /api/uat/github`) enforces `checkOrigin(request)` (MM-SEC-03) and `consumeRateLimit()`. | Route implementation & unit tests. |
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

1. **Local-Only Defect Storage by Design:** Defects and base64 screenshots are persisted in browser IndexedDB (`mindmosaic_uat_assistant_v1`) per requirement 8. Switching physical devices requires using **Export JSON** / **Import JSON** (or **Create GitHub issue…**).
2. **Optional Server Secrets on Vercel Preview:** On Vercel Preview, the assistant works immediately for `admin` accounts. Enabling server-backed AI rewriting (`QF_AI_PROVIDER` + matching key) or direct GitHub issue creation (`MM_UAT_GITHUB_TOKEN`) on hosted Preview is optional and requires owner approval before adding Preview environment variables; both features have built-in local fallbacks (**Structure locally** and **Copy Markdown**) when unconfigured.
