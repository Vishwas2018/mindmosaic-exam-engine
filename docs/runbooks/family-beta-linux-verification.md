# Family-beta WP1: Linux/CI verification (the run of record)

The Windows-host E2E runs of this branch are **invalid** and must not be quoted: the Next server's main thread blocked for exact
10 s steps inside native socket calls, with no cause established (records under `C:\tmp\wp1-audit` on the author's machine:
`full-auth*`, `diag1-4`, `full-public1` invalid because of leftover servers; `diag5-9` valid servers but corrupted by the stall).
Linux CI is the authoritative environment.

## What runs

`.github/workflows/family-beta-verify.yml` (new). Triggers: a push to `chore/family-beta-wp1-candidate-20261102`, or manual
dispatch. One job on `ubuntu-latest`, so the suites are strictly sequential:

1. Refuse any non-local target (env values must be the local stack; no hosted or `prod` strings). The checked-out SHA must equal
   `GITHUB_SHA`.
2. `npm ci`, Playwright Chromium, Supabase CLI 2.108.0 (same pins as `ci.yml`), `supabase start` (isolated stack on the runner),
   `exam-writer:bootstrap`, `e2e:seed`, `migrations:record` + `migrations:status` (must report no drift).
3. **Authenticated suite** (`playwright.auth.config.ts`, 1 worker, retries 2 as in the repo config). The config's webServer builds
   once (`next build --webpack`) then runs `next start`; build id and manifest hash recorded after.
4. **Keyboard walkthrough x5 with retries off** (`-g "keyboard walkthrough" --repeat-each=5 --retries=0`): the check that failed once
   (`received -1`) on a Windows run that was already corrupted. This decides real defect or one-off.
5. **Public suite** (`playwright.config.ts`), every backend variable removed, after the authenticated one.
6. `scripts/ci/summarise-playwright.mjs` writes SHA, tests, passed, failed, **flaky** (passed only on retry), skipped, tests with
   more than one attempt, duration, and each failure's first error line, to the job summary and an uploaded artifact
   (`family-beta-verify-<sha>`, 14 days; tokens and JWTs redacted from text files; traces contain only fixture accounts on the
   throwaway local stack).
7. The job fails if either full suite failed, or a required spec did not run. Flaky results are reported, never hidden; a
   retry-pass is not a clean pass.

`ci.yml` also runs on that push (core, rls, e2e, e2e-auth, scholarship-drafts), which gives the repository's own required checks
on the same SHA at no extra step.

## Guards against hosted targets

No `secrets.` reference anywhere in the workflow; `permissions: contents: read`; local demo keys only (identical to `ci.yml`);
step 1 above; `e2e/fixtures/environment-guard.ts` refuses a non-local Supabase host inside Playwright; `src/server/exam-write/target.ts`
refuses a loopback writer unless `EXAM_WRITE_ALLOW_LOOPBACK=1`. The workflow never deploys, never runs a hosted migration, never
reads Vercel.

## Side effect of pushing: a Vercel Preview

This repository's pull requests show a Vercel deployment check, so Git integration is active. **A push of this branch can
create a Vercel Preview deployment automatically**, built from the branch with the **Preview** environment variables. Before pushing,
the owner should confirm in Vercel: which Supabase project the Preview variables point at (it must not be production), that
`RECOVERY_GRANT_SECRET` / `EXAM_WRITE_DB_URL` are absent or intended for Preview, and whether to skip the preview build for this branch
(Project Settings > Git > Ignored Build Step, or push as a draft PR only after deciding). On such a Preview, with the new
migrations **not** applied to the hosted DEV database, password reset answers 503 and exam writes fail closed (by design); it does not migrate anything.
The workflow in this repository cannot suppress Vercel's own build.

## Steps for approval (nothing has been pushed)

1. Owner confirms the Vercel Preview point above.
2. `git push -u origin chore/family-beta-wp1-candidate-20261102` (never `main`/`dev`). Optionally open a **draft** PR into `dev`.
3. Read the run `family-beta-verify` for the pushed SHA; download the artifact. Acceptance: authenticated and public suites each
   `failed: 0`, `flaky: 0` (or every flaky test explained), skipped listed and justified, the x5 keyboard run `failed: 0`,
   `migrations:status` no drift, and the SHA in the summary equals the local candidate SHA.
4. Any failure: read its evidence (first error, trace, server log) before changing code; do not weaken assertions; do not rerun until
   the cause is known.
