# MindMosaic Authentication Regression Evidence (Rounds 6 & 7)

Both consecutive regression cycles executed against the exact same final deployed code SHA:

- **Branch:** `audit/auth-e2e-20261123` (PR #160)
- **Final Code SHA:** `db65f78c62d96ee7a9c7774a31d5b2accd47a12e`
- **Vercel Deployment ID:** `dpl_CyLHacwwUYPfjdT63F523W3iL4Jp`
- **Preview Alias URL:** `https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app`
- **Supabase Target:** DEV `mfglzabnayacssgertat`

---

## 1. Consecutive Hosted Regression Cycles (Rounds 6 & 7)

| Test ID | Description | Round 6 (Cycle 1) Run ID | Cycle 1 Status | Round 7 (Cycle 2) Run ID | Cycle 2 Status |
|---|---|---|---|---|---|
| `REG-01` | Sign-up validation, password boundaries, draft restore (no password stored), invalid email | `rmwswgel9` | **PASS** (16.1s) | `rmwswydmo` | **PASS** (13.1s) |
| `REG-03` | Real-email cross-device verification while logged in as another user | `rmwswgel9` | **PASS** (39.3s) | `rmwswzb4b` | **PASS** (25.7s) |
| `AUTH-01` | Empty inputs, malformed email, enumeration parity, 5-attempt lockout | `rmwswgel9` | **PASS** (16.4s) | `rmwsx0oq1` | **PASS** (14.0s) |
| `AUTH-02` | Parent/Student/Teacher/Admin routing, logout+Back, multi-tab, archive/restore, ephemeral session, revoked account | `rmwswgel9` | **PASS** (1.7m) | `rmwsx0oq1` | **PASS** (1.5m) |
| `RBAC-01` | 6-role × 19-route matrix (114 cells) + 6-role × 10-API matrix (60 cells) + cross-family isolation | `rmwswsc1h` | **PASS** (3.9m) | `rmwsx4d6n` | **PASS** (3.3m) |
| `SEC-01` | `Secure` cookies, CSP, 4 open redirects, 8 CSRF origin checks, tampered JWT, DB/signup privilege escalation, leak scan | `rmwswgel9` | **PASS** (1.2m) | `rmwsx4d6n` | **PASS** (46.6s) |
| `XBR-01` (Chromium `1440×900`) | Cross-browser parent/student sign-in, offline recovery, refresh, logout | `rmwswgmo4` | **PASS** (37.6s) | `rmwswo3kt` | **PASS** (28.7s) |
| `XBR-01` (Chromium `834×1112`) | Tablet touch viewport | `rmwswgmo4` | **PASS** (27.9s) | `rmwswo3kt` | **PASS** (23.2s) |
| `XBR-01` (Chromium `390×844`) | Mobile touch viewport (3x DPR) | `rmwswgmo4` | **PASS** (25.5s) | `rmwswo3kt` | **PASS** (25.9s) |
| `XBR-01` (Firefox `1440×900`) | Gecko engine | `rmwswjor2` | **PASS** (43.8s) | `rmwswr5i6` | **PASS** (49.1s) |
| `XBR-01` (WebKit `1440×900`) | WebKit/Safari engine | `rmwswlf2l` | **PASS** (29.1s) | `rmwswszu0` | **PASS** (27.9s) |
| `REG-02` / `REG-04` / `REC-01` | Same-origin preview email link redirect check | `rmwswgel9` | **BLOCKED (`DEF-AUTH-005`)** | `rmwsx0oq1` | **BLOCKED (`DEF-AUTH-005`)** |

*Note on `REG-02` & `REC-01`: Both passed end-to-end (including email delivery and cross-device session invalidation) on the allowlisted PR #156 alias (`rmwsuwdnl`). On the new `audit/auth-e2e-20261123` alias, email delivery succeeded 100% on the first attempt, but Supabase DEV redirected `redirect_to` to `git-dev` because the new branch alias is not yet in Supabase DEV's `uri_allow_list` (`DEF-AUTH-005`).*

---

## 2. GitHub Actions CI & Vercel Verification (PR #160, SHA `db65f78c`)

| Check | Result | Duration | Run / Job Reference |
|---|---|---|---|
| `core` (typecheck, lint, vitest, build, content gates) | **PASS** | 8m02s | `actions/runs/45125832249/job/137529830237` |
| `e2e` (public & guest Playwright suite) | **PASS** | 12m44s | `actions/runs/45125832249/job/137529830274` |
| `e2e-auth` (local Supabase auth E2E suite) | **PASS** | 7m12s | `actions/runs/45125832249/job/137529830206` |
| `rls` (Postgres RLS & privilege-hardening suite) | **PASS** | 1m55s | `actions/runs/45125832249/job/137529829831` |
| `scholarship-drafts` | **PASS** | 28s | `actions/runs/45125832249/job/137529830307` |
| `Vercel` Preview Deployment | **PASS** | Ready | `dpl_CyLHacwwUYPfjdT63F523W3iL4Jp` |
