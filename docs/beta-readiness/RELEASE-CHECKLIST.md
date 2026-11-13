# Release checklist: supervised family beta on hosted DEV

Each row is either checked with the evidence that checks it, or open with who it waits on. Nothing is ticked from a
local fixture when the row is about hosted DEV.

## A. Integration branch (`integration/beta-consolidation`, PR #123)

| # | Item | State | Evidence / waiting on |
|---|------|-------|-----------------------|
| A1 | CI green on the head commit, skip count read | Done for `b859a41c` | core, e2e, e2e-auth (92 passed, 0 skipped), rls, scholarship-drafts |
| A2 | CI green after the D-013/D-015/D-018 commit | Open | Local unit suite and a production build pass; the push is held because it redeploys the Preview (see C3) |
| A3 | No open P0/P1 product defect on the branch | Open | D-016 (content approval) and D-017 (DEV writer setup) are owner items |
| A4 | Merge into `dev` | Open, owner | Only after C1-C4 pass; branch protection and review apply |

## B. Hosted DEV database (`mfglzabnayacssgertat`)

| # | Item | State | Evidence / waiting on |
|---|------|-------|-----------------------|
| B1 | `20261031090000` applied | Done | Ledger and catalog read 2026-11-13 (DATABASE-READINESS.md) |
| B2 | Writer role attributes correct | Done | Same read |
| B3 | Writer password set (SCRAM verifier only) | Open | Supabase CLI must be signed in to the MindMosaic account; script ready |
| B4 | Writer can connect and cannot read protected tables | Open | Runs inside the setup script, before Vercel is touched |
| B5 | `20261031090100` applied | Open, separate owner approval | Only after C4 passes |
| B6 | Legacy RPCs return `42501` to a signed-in student | Open | After B5; `FORGE-RPC` check in the acceptance script |

## C. Preview deployment

| # | Item | State | Evidence / waiting on |
|---|------|-------|-----------------------|
| C1 | `EXAM_WRITE_DB_URL` exists, Preview only, sensitive | Open | Setup script step 6 |
| C2 | Preview client bundle targets DEV only | Done for `b859a41c` | Only `mfglzabnayacssgertat` in all 13 `/sign-in` bundles |
| C3 | Redeploy of the branch with the variable | Open, owner approval | Pushing the branch triggers it |
| C4 | Hosted exam journey passes (start, autosave, resume, submit, scoring, history, isolation, RLS) | Open | `run-preview-acceptance.cjs <host>` |

## D. Family-facing content and copy

| # | Item | State | Evidence / waiting on |
|---|------|-------|-----------------------|
| D1 | Every item a beta family can sit has a human `approvedBy` | Open, owner | D-016; no agent may sign |
| D2 | No sample-family values on real pages | Done | D-002, D-003, D-004 fixed with tests |
| D3 | No payment copy for free-beta families | Done | D-015 |
| D4 | Billing enforcement off, no live checkout | Done | Enforcement needs `BILLING_ENFORCEMENT_ENABLED === "true"` (`src/features/billing/config.ts`) and Stripe needs `STRIPE_SECRET_KEY`; neither variable exists in any Vercel environment (env list, 2026-11-13) |

## E. Production

Out of scope. Nothing in this checklist touches `uermhsptduikehuyceiz`.
