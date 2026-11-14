# Handoff: restart checkpoint

Last updated 2026-11-14 (evening). No background process is running; nothing continues by itself.

## Where things are

- `dev` = `100287e7` (PR #123). DEV Supabase `mfglzabnayacssgertat`: 53/53 migrations, legacy write RPCs revoked.
- **PR #124** (draft) `integration/dev-beta-completion` → `dev`, worktree `C:/tmp/wt-dev-beta`. Head = release
  candidate. It contains every fix from hosted acceptance (DEFECT-REGISTER D-019..D-034) and the hosted test suite.
- Evidence: TEST-RESULTS.md. Content: CONTENT-GOVERNANCE.md. Security: SECURITY-REVIEW.md.
- The main checkout (`C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine`, on `dev`) holds someone's **uncommitted
  billing rewrite**. Untouched. PR #124 changes `src/app/billing/page.tsx` (free-beta message, no plan for children),
  so expect a conflict there; keep #124's two rules when reconciling.

## How to re-run acceptance

```
node scripts/hosted-acceptance/run.mjs <preview-url> --env <path to .env.local bound to DEV> -- <specs>
node scripts/hosted-acceptance/cleanup.mjs --env <same>            # dry run; add --apply to delete
```
`run.mjs` reads the Vercel automation-bypass secret from the project API (logged-in `vercel` CLI) into memory.
Real sign-up (A1–A2) needs `HOSTED_MAIL_BASE=<inbox you can read>` and is limited by D-025;
`HOSTED_CONFIRM=admin` confirms that same account with a service-role link when the inbox cannot be read.
On Git Bash set `MSYS_NO_PATHCONV=1` and pass Windows paths; do not put `|` in a `-g` filter (cmd eats it).

## Waiting on the owner

1. **D-025: custom SMTP for DEV Supabase Auth.** The project refuses the second confirmation email within about an
   hour, so families signing up close together are blocked. This is the remaining hard blocker for inviting families.
2. **Content (CONTENT-GOVERNANCE.md):** confirm the attestation behind the 77 NAPLAN numeracy approvals; approve or
   keep excluding Y5 Q20. Nothing else is servable until a human reviews it.
3. **Review and merge PR #124 into `dev`.** After the merge the `dev` Preview must be re-run with the suite (it is the
   deployment families will use).
4. Delete the stale development-target `EXAM_WRITE_DB_URL` in Vercel (carried over).
5. Optional: error monitoring (none configured); re-authorise the Gmail connector so A2 can use the real email.

## Decisions taken in this session

- Deployed builds serve approved content only; local and CI keep report mode (`MM_PUBLICATION_GATE` overrides).
- No feature is shown to families that does nothing: fake support receipt, dead email toggles, illustrative exam
  battery and canvas notes removed rather than "finished".
- Billing stays off for the beta; `/billing` says so.
- Synthetic data: suite-created families removed with `cleanup.mjs`; `mm-dev-*` fixtures (used by the API
  acceptance script) and every account not created by the suite kept.
