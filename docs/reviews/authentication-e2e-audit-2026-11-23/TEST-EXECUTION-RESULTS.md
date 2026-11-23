# MindMosaic Authentication Test Execution Results (2026-11-24 — Final Closure)

- **Audit Branch:** `audit/auth-e2e-20261123` (Draft PR #160 -> `integration/beta-readiness-claude-20261120`)
- **Final Verified Code SHA:** `500fe9bef737b735cfaec55a2574162ec466c0a8` (`dpl_438WSkkrpNcrF54rNMLQjuD8SLuh`)
- **Hosted DEV Preview Alias:** `https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app`
- **Baseline PR #156 Preview Alias (Rounds 1–4):** `https://mindmosaic-exam-engine-git-integra-6b98ba-vishwas2018s-projects.vercel.app` (`3253ab1e`, `dpl_CH7zqNPMji2Hfvmb7FMMBM1joH83`)
- **Supabase Project:** DEV `mfglzabnayacssgertat`

---

## 1. Execution Summary Across All Rounds

| Suite / Layer | Executed | Passed | Failed | Blocked (Infra) | Not Tested | Notes |
|---|---:|---:|---:|---:|---:|---|
| **Local Auth & Hardening Unit Tests** (`vitest`) | 64 | 64 | 0 | 0 | 0 | `singapore-maths-sample-routes` (19), `provision-child` (32), `auth-audit-hardening` (10), `forgot-password-page` (3); also `sign-in-panel` (15/15) |
| **CI Full Verification Suite** (PR #160, `500fe9be`, Run `45160150872`) | 7 jobs | 7 | 0 | 0 | 0 | `core` (5m12s), `e2e` (13m19s), `e2e-auth` (6m38s), `rls` (2m24s), `scholarship-drafts` (24s), `Vercel`, `Vercel Preview Comments` |
| **Final Closure Verification (2026-11-24, 06:18–06:32 AEDT)** on `500fe9be` (`rmwtniozh`, `rmwtnqfj1`, `rmwtnrbae`) + `generateLink` probe | 12 E2E + 7 probe checks | **12 E2E** + 4/4 PR #160 probe matches | 0 | **0** | 0 | **100% PASS, 0 blocked:** `REG-01`, `REG-02`, `REG-03`, `REG-04`, `AUTH-01`, `AUTH-02`, `REC-01`, `RBAC-01`, `SEC-01`, `XBR-01` (`1440`/`834`/`390`) |
| **Hosted Audit Cycle 1 & 2 (Rounds 6 & 7)** on `db65f78c` | 22 (non-blocked) | 22 | 0 | 0 (non-email) | 0 | Full cross-browser matrix incl. Firefox & WebKit (`10 / 10` across 2 consecutive cycles) |
| **Historical Follow-Up Re-Checks #1 & #2 (2026-11-23)** (`rmwsxnemo`, `rmwsxqd66`, `rmwt539ke`..`55y2y`) | 8 | 2 | 0 (app) | 6 (`DEF-AUTH-005` prior to fix) | 0 | Historical pre-fix evidence confirming `DEF-AUTH-005` before DEV Supabase Redirect URLs were saved; all real emails delivered first-attempt |
| **Baseline Real-Email Recovery** (PR #156 allowlisted alias `rmwsuwdnl`) | 4 | 4 | 0 | 0 | 0 | `REC-01` & `REG-03` passed on allowlisted PR #156 alias |

---

## 2. Real Email Delivery Telemetry (Gmail SMTP via `mail.tm`)

Every real-email test recorded first-attempt delivery, latency, misses, resends, and retry-assisted recovery separately:

| Run ID | Preview Origin | Scenario | Email Type | First-Attempt Delivery | Delivery Latency | Resend Attempts | Retry-Assisted Recovery | Sender Observed |
|---|---|---|---|---|---|---:|---|---|
| `rmwsuwdnl` | `git-integra-6b98ba` (PR #156) | `REG-03` | Confirmation | **YES** | **6s** | 0 | No | `vishwas.joshi01@gmail.com` |
| `rmwsuwdnl` | `git-integra-6b98ba` (PR #156) | `REC-01` | Password Reset | **YES** | **0s** (<1s) | 0 | No | `vishwas.joshi01@gmail.com` |
| `rmwsvvayc` | `2t4b79a4w` (`288fafcd`) | `REG-02`, `REG-03`, `REC-01` | Confirmation & Reset | **YES (3/3)** | **<15s** | 0 | No | Custom Gmail SMTP |
| `rmwswgel9` | `git-audit-a-f35ca9` (`db65f78c`) | `REG-02`, `REG-03`, `REC-01` | Confirmation & Reset | **YES (3/3)** | **<20s** | 0 | No | Custom Gmail SMTP |
| `rmwswzb4b` | `git-audit-a-f35ca9` (`db65f78c`) | `REG-03` | Confirmation | **YES** | **<15s** | 0 | No | Custom Gmail SMTP |
| `rmwsx0oq1` | `git-audit-a-f35ca9` (`db65f78c`) | `REC-01` | Password Reset | **YES** | **<15s** | 0 | No | Custom Gmail SMTP |
| `rmwsxnemo` | `git-audit-a-f35ca9` (`f835691f`) | `REG-02`, `REG-03`, `REG-04` (×2) | Confirmation (4 emails) | **YES (4/4)** | **<15s** | 0 | No | Custom Gmail SMTP |
| `rmwsxqd66` | `git-audit-a-f35ca9` (`f835691f`) | `REC-01` | Password Reset | **YES** | **<15s** | 0 | No | Custom Gmail SMTP |
| `rmwt539ke`, `rmwt546p5`, `rmwt55y2y` | `git-audit-a-f35ca9` (`2cafbab3`) | `REG-02`, `REG-04` (×2), `REC-01` | Confirmation (3) & Reset (1) | **YES (4/4)** | **<15s** | 0 | No | Custom Gmail SMTP |
| `rmwtniozh` | `git-audit-a-f35ca9` (`500fe9be`) | `REG-03` | Confirmation | **YES** | **3s** | 0 | No | `vishwas.joshi01@gmail.com` |
| `rmwtniozh` | `git-audit-a-f35ca9` (`500fe9be`) | `REG-04` (simA & simB) | Confirmation (2) | **YES (2/2)** | **2s / 2s** | 0 | No | `vishwas.joshi01@gmail.com` |
| `rmwtniozh` | `git-audit-a-f35ca9` (`500fe9be`) | `REC-01` | Password Reset | **YES** | **1s** | 0 | No | `vishwas.joshi01@gmail.com` |
| `rmwtnqfj1` | `git-audit-a-f35ca9` (`500fe9be`) | `REG-02` | Confirmation | **YES** | **0s** (<1s) | 0 | No | `vishwas.joshi01@gmail.com` |

**Key Email Finding:** **24 / 24 (100%) first-attempt email deliveries succeeded (0 missing emails, 0 retry-assisted recoveries)** across the entire audit and closure verification. All 5 closure emails on `500fe9be` arrived in **0–3 seconds** from `vishwas.joshi01@gmail.com` with verified same-origin `/auth/confirm` and `/auth/reset` callback paths (`DEF-AUTH-005` resolved).

---

## 3. Pre-Remediation vs Post-Remediation Defect Verification

| Defect | Pre-Fix Run & Result | Post-Fix Run & Result (`288fafcd` / `db65f78c` / `500fe9be`) |
|---|---|---|
| `DEF-AUTH-004` (Cookie `Secure` flag) | `rmwsv4lml`: **FAIL** (`secure: false`) | `rmwsvvayc`, `rmwswgel9`, `rmwsx4d6n`, `rmwtnrbae`: **PASS** (`secure: true`) |
| `DEF-AUTH-001` (Student onboarding role gate) | `rmwsudgko`: **FAIL** (Parent got `200`) | `rmwsvvayc`, `rmwswsc1h`, `rmwsx4d6n`, `rmwtnrbae`: **PASS** (Parent/Teacher/Admin got `403`, Student `200`) |
| `DEF-AUTH-002` (Singapore Maths sample CSRF) | Static audit: missing `checkOrigin` | `singapore-maths-sample-routes.test.ts` (19/19) + CI `e2e-auth` (PASS) |
| `DEF-AUTH-003` (`POST /api/parent/children` status) | `rmwsudgko`: **FAIL** (Anon/Guest/Student got `400`) | `rmwsvvayc`, `rmwswsc1h`, `rmwsx4d6n`, `rmwtnrbae`: **PASS** (Anon/Guest `401`, Student/Teacher/Admin `403`) |
| `DEF-AUTH-005` (DEV Supabase `uri_allow_list`) | `rmwsvvayc`, `rmwswgel9`, `rmwt539ke`..`55y2y`: **BLOCKED** | 2026-11-24 `generateLink` probe (4/4 `MATCH`) + `rmwtniozh` (`REG-03`, `REG-04`, `REC-01`) + `rmwtnqfj1` (`REG-02`): **PASS** |
| `DEF-AUTH-006` (`/auth/forgot` parity & 30s cooldown) | Static audit: missing validation/cooldown | `forgot-password-page.test.tsx` (3/3) + live `REC-01` (`rmwtniozh`): **PASS** |
