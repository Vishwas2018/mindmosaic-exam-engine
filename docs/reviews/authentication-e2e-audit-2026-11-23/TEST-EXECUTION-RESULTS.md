# MindMosaic Authentication Test Execution Results (2026-11-23 — Updated Follow-Up)

- **Audit Branch:** `audit/auth-e2e-20261123` (Draft PR #160 -> `integration/beta-readiness-claude-20261120`)
- **Final Code SHA:** `db65f78c62d96ee7a9c7774a31d5b2accd47a12e` (docs-only follow-up `f835691f`, `dpl_F652QyS4L38d6nUeV7xFNrwetiC2`)
- **Hosted DEV Preview Alias:** `https://mindmosaic-exam-engine-git-audit-a-f35ca9-vishwas2018s-projects.vercel.app`
- **Baseline PR #156 Preview Alias (Rounds 1–4):** `https://mindmosaic-exam-engine-git-integra-6b98ba-vishwas2018s-projects.vercel.app` (`3253ab1e`, `dpl_CH7zqNPMji2Hfvmb7FMMBM1joH83`)
- **Supabase Project:** DEV `mfglzabnayacssgertat`

---

## 1. Execution Summary Across All Rounds

| Suite / Layer | Executed | Passed | Failed | Blocked (Infra) | Not Tested | Notes |
|---|---:|---:|---:|---:|---:|---|
| **Local Auth & Hardening Unit Tests** (`vitest`) | 61 | 61 | 0 | 0 | 0 | `singapore-maths-sample-routes` (19), `provision-child` (32), `auth-audit-hardening` (10) |
| **CI Full Verification Suite** (PR #160, `db65f78c`) | 7 jobs | 7 | 0 | 0 | 0 | `core` (8m02s), `e2e` (12m44s), `e2e-auth` (7m12s), `rls` (1m55s), `scholarship-drafts` (28s), `Vercel` |
| **Hosted Audit Cycle 1 (Round 6)** on `db65f78c` | 14 | 11 | 0 (app) | 3 (`DEF-AUTH-005`) | 0 | All 11 non-allowlist-blocked tests passed (`REG-01`, `REG-03`, `AUTH-01`, `AUTH-02`, `RBAC-01`, `SEC-01`, `XBR-01` ×5) |
| **Hosted Audit Cycle 2 (Round 7)** on `db65f78c` | 12 | 11 | 0 (app) | 1 (`DEF-AUTH-005`) | 2 (`REG-02`, `REG-04` already blocked by `DEF-AUTH-005`) | 100% pass on all 11 executable tests (`REG-01`, `REG-03`, `AUTH-01`, `AUTH-02`, `RBAC-01`, `SEC-01`, `XBR-01` ×5) |
| **Follow-Up Real-Email Re-Check (18:16–18:19 AEDT)** on `f835691f` (`rmwsxnemo`, `rmwsxqd66`) | 5 | 2 (`REG-01`, `REG-03`) | 0 (app) | 3 (`REG-02`, `REG-04`, `REC-01` — `DEF-AUTH-005`) | 0 | Confirmed `DEF-AUTH-005` is **still open** in DEV Supabase (`redirect_to` still rewrites to `git-dev`); Gmail SMTP delivery 100% first-attempt |
| **Baseline Real-Email Recovery** (PR #156 allowlisted alias `rmwsuwdnl`) | 7 | 4 | 0 (app) | 0 | 0 | `REC-01` (full recovery + cross-device session invalidation) & `REG-03` passed on allowlisted alias |

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

**Key Email Finding:** **15 / 15 first-attempt email deliveries succeeded (0 missing emails, 0 retry-assisted recoveries)** across the entire audit and follow-up re-check, all arriving in 0–20 seconds via custom Gmail SMTP. The sole remaining blocker on PR #160's Preview alias is `DEF-AUTH-005` (DEV Supabase `uri_allow_list` redirecting `redirect_to` to `git-dev`).

---

## 3. Pre-Remediation vs Post-Remediation Defect Verification

| Defect | Pre-Fix Run & Result | Post-Fix Run & Result (SHA `288fafcd` / `db65f78c`) |
|---|---|---|
| `DEF-AUTH-004` (Cookie `Secure` flag) | `rmwsv4lml`: **FAIL** (`secure: false`) | `rmwsvvayc`, `rmwswgel9`, `rmwsx4d6n`: **PASS** (`secure: true`) |
| `DEF-AUTH-001` (Student onboarding role gate) | `rmwsudgko`: **FAIL** (Parent got `200`) | `rmwsvvayc`, `rmwswsc1h`, `rmwsx4d6n`: **PASS** (Parent/Teacher/Admin got `403`, Student `200`) |
| `DEF-AUTH-002` (Singapore Maths sample CSRF) | Static audit: missing `checkOrigin` | `singapore-maths-sample-routes.test.ts` (19/19) + CI `e2e-auth` (PASS) |
| `DEF-AUTH-003` (`POST /api/parent/children` status) | `rmwsudgko`: **FAIL** (Anon/Guest/Student got `400`) | `rmwsvvayc`, `rmwswsc1h`, `rmwsx4d6n`: **PASS** (Anon/Guest `401`, Student/Teacher/Admin `403`) |
| `DEF-AUTH-005` (DEV Supabase `uri_allow_list`) | `rmwsvvayc`, `rmwswgel9`: **BLOCKED** | `rmwsxnemo`, `rmwsxqd66` (18:19 AEDT): **STILL BLOCKED** — owner Dashboard action pending |
