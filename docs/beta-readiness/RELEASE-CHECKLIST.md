# Release checklist: supervised family beta on hosted DEV

Each row is either checked with the evidence that checks it, or open with who it waits on. Nothing is ticked from a
local fixture when the row is about hosted DEV.

## 2026-11-14: PR #124 release candidate (`5c69c65f`)

| # | Item | State | Evidence / waiting on |
|---|------|-------|-----------------------|
| R1 | All DEV migrations applied; legacy RPC lockdown in force | Done | 53/53; scenario D: 403 `42501` on both legacy RPCs |
| R2 | Browser scenarios A–E on a deployed Preview | Done, except A1–A2 on the RC | TEST-RESULTS.md: 14/14 run, A1–A2 passed on `3fc807b4`, skipped on the RC by D-025 |
| R3 | Independent scoring oracle on the Preview | Done | 21/21 (`8f68b771`) |
| R4 | CI green with skip counts read | Done for `4be46f87`; RC run in the PR | e2e-auth 0 skipped; 1 flaky landing test (D-034) |
| R5 | Only approved content served | Done | Scenario G; CONTENT-GOVERNANCE.md |
| R6 | No fabricated progress, fake receipts, dead controls or internal notes on family screens | Done for screens covered by A–E | D-020..D-024, D-035, D-036 |
| R7 | Test data controlled | Done | `cleanup.mjs` removed 27 suite parents + 24 children; DEV back to 15 users; `mm-dev-*` fixtures kept |
| R8 | **Custom SMTP for DEV Auth (D-025)** | **Open, owner** | Blocks families registering close together |
| R9 | **Content attestation for the 77; Y5 Q20 decision** | **Open, owner** | CONTENT-GOVERNANCE.md |
| R10 | **Merge PR #124 into `dev`, then re-run the suite on the `dev` Preview** | **Open, owner** | Branch protection applies |
| R11 | Error monitoring | Open, owner decision | None configured; Vercel runtime logs only |

## Earlier record (PR #123)

## A. Integration branch (`integration/beta-consolidation`, PR #123)

| # | Item | State | Evidence / waiting on |
|---|------|-------|-----------------------|
| A1 | CI green on the head commit, skip count read | Done for `b859a41c` | core, e2e, e2e-auth (92 passed, 0 skipped), rls, scholarship-drafts |
| A2 | CI green after the D-013/D-015/D-018 commit | Open (running) | Pushed as `ff775d2d` by the owner; read `gh pr checks 123` |
| A3 | No open P0/P1 product defect on the branch | Open | D-016 (content approval) and D-017 (DEV writer setup) are owner items |
| A4 | Merge into `dev` | Open, owner | Only after C1-C4 pass; branch protection and review apply |

## B. Hosted DEV database (`mfglzabnayacssgertat`)

| # | Item | State | Evidence / waiting on |
|---|------|-------|-----------------------|
| B1 | `20261031090000` applied | Done | Ledger and catalog read 2026-11-13 (DATABASE-READINESS.md) |
| B2 | Writer role attributes correct | Done | Same read |
| B3 | Writer password set (SCRAM verifier only) | Done | `exam-writer-setup.cjs`, 2026-11-13; plaintext never printed or stored |
| B4 | Writer can connect and cannot read protected tables | Done | Executes only the `_for` functions; 42501 on SELECT of `exam_sessions`, `exam_attempts`, `profiles`, `auth.users` and INSERT on `exam_sessions` |
| B5 | `20261031090100` applied | Open, separate owner approval requested | C4 passed. Breaks exam writes on Previews of branches without the new path, `dev` included |
| B6 | Legacy RPCs return `42501` to a signed-in student | Open | After B5; `FORGE-RPC` check in the acceptance script |

## C. Preview deployment

| # | Item | State | Evidence / waiting on |
|---|------|-------|-----------------------|
| C1 | `EXAM_WRITE_DB_URL` exists, Preview only, sensitive | Done | Preview target, sensitive. A stale development-target copy remains for the owner to delete |
| C2 | Preview client bundle targets DEV only | Done for `ff775d2d` | 42 files from `/sign-in`, `/student`, `/parent`: only `mfglzabnayacssgertat`. Server writes proven on DEV by C4 read-backs |
| C3 | Redeploy of the branch with the variable | Done | `mindmosaic-exam-engine-rg3yjc7he-…` READY, `ff775d2d` |
| C4 | Hosted exam journey passes (start, autosave, resume, submit, scoring, history, isolation, RLS) | Done (pre-lockdown) | 65/66; only `FORGE-RPC` fails, the expected pre-`090100` finding |

## D. Family-facing content and copy

| # | Item | State | Evidence / waiting on |
|---|------|-------|-----------------------|
| D1 | Every item a beta family can sit has a human `approvedBy` | 77/78 | Owner approval recorded (`ff775d2d`); corrected Y5 Q20 awaits the owner |
| D2 | No sample-family values on real pages | Done | D-002, D-003, D-004 fixed with tests |
| D3 | No payment copy for free-beta families | Done | D-015 |
| D4 | Billing enforcement off, no live checkout | Done | Enforcement needs `BILLING_ENFORCEMENT_ENABLED === "true"` (`src/features/billing/config.ts`) and Stripe needs `STRIPE_SECRET_KEY`; neither variable exists in any Vercel environment (env list, 2026-11-13) |

## E. Production

Out of scope. Nothing in this checklist touches `uermhsptduikehuyceiz`.
