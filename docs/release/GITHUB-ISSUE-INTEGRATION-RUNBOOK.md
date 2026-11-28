# UAT Assistant → GitHub issues: least-privilege configuration (DEV)

Status 2026-11-28: **prepared, not configured.** No token exists in any environment, no issue has been created.
The Markdown fallback (Copy Markdown in the confirm dialog) is the active path and is unaffected.

## How the code behaves today (`src/features/uat-assistant/server/github-issues.ts`)

* Unset `MM_UAT_GITHUB_TOKEN` → `github_not_configured`; the dialog shows the redacted Markdown to paste by hand.
* A tester must confirm a dialog showing repo, title and the full redacted body before any request is made; title and body
  are re-redacted server side (`redactSensitiveText`) and capped (200 / 60 000 chars).
* One endpoint only: `POST /repos/{owner}/{repo}/issues`. Repo comes from `MM_UAT_GITHUB_REPO`, validated to `owner/name`.
* Labels are best-effort; a 422 retries once without labels. Any failure leaves the local defect saved.
* The assistant is DEV-only and tester-gated (admin entitlement / allow-list); 404 elsewhere.

## Recommended configuration (owner steps)

1. **Dedicated target.** Prefer a separate private repo (for example `mindmosaic-uat-issues`) so a leaked token can never touch
   source, PRs, Actions or secrets. If the main repo must be used, keep everything below.
2. **Fine-grained personal access token** (not classic): resource owner = the account; *Only select repositories* → the single
   target repo; repository permissions → **Issues: Read and write** and nothing else (Metadata: read is implicit); no account
   permissions; **expiry 30 days**; description "MindMosaic UAT Assistant (DEV)".
3. **Better, when available:** a GitHub App installed on the one repo with only Issues write, token minted per call.
   (Needs a small code change; not required for beta.)
4. **Store as a Vercel Preview-only, Sensitive variable** `MM_UAT_GITHUB_TOKEN` scoped to the `dev` branch (never Production,
   never `NEXT_PUBLIC_*`, never in `.env*` committed files). Set `MM_UAT_GITHUB_REPO` to the target.
5. Redeploy DEV; confirm `/api/uat/session` reports GitHub configured (githubConfigured) and the repo shown in the dialog is the intended one.
6. **First live test (owner-approved only):** file one clearly labelled test defect, confirm the issue, then close it by hand.
   Verify the issue body contains no emails, tokens, student names or screenshots of children.
7. **Rotation / kill switch:** unset the variable (instantly returns to Markdown fallback) and revoke the token in GitHub.

## What not to do

* Do not grant Contents, Pull requests, Actions, Administration or Workflows.
* Do not reuse a developer's all-repo token or the CI token.
* Do not enable in Production; the UAT surface is DEV-gated by design.

## Verification checklist (after the owner configures it)

- [ ] Token resource owner/repo scope shows exactly one repository
- [ ] Permissions list shows only Issues: read/write
- [ ] Variable is Preview + `dev` branch only and marked Sensitive
- [ ] Unset variable → fallback still shows Markdown (re-tested)
- [ ] One test issue created, redacted, closed
