# Verification â€” 22 October 2026

Environment: dedicated Windows worktree on `feat/legacy-content-provenance`, based on `82987b74e427cb367ebfcf7b880e1116fe3e178b`. Dependencies are shared through a local `node_modules` junction. No production environment or database was configured or changed.

Local build uses webpack to accommodate the shared dependency junction. CI retains the repository's unchanged default build command and independently installed dependencies.

| Check | Actual result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| Factory, approval and publication regression suites | Initial run: 101/103 files passed; 2,720/2,729 tests passed. Nine failures exposed empty create-lock directory residue. Component fixed without changing assertions; affected binding, storage and legacy suites subsequently PASS: 4 files, 125 tests. Full factory rerun was later completed; see the final evidence section below |
| Remaining unit suites | PASS, exit 0; 332 files, 5,731 tests |
| `npm run build -- --webpack` | PASS, exit 0; compilation, TypeScript, static page generation and traces completed |
| `npm run validate:questions` | PASS; 1,005 runtime questions |
| `npm run content:validate-scholarship-drafts` | PASS; 160 drafts, 99 solver-backed, 61 human-semantic flags retained |
| `npm run questions:validate-ledger` | PASS; all in-scope rows/files reconcile |
| `npm run check:answers -- --include-published` | PASS; 1,601 structurally checked, 175 fully computable, 0 failures; editorial-review classification and warnings retained |
| Real 12-candidate command `questions:import-legacy â€¦ --dry-run` | PASS; exact source/register/blueprint/review-packet hashes, no factory writes, no import transaction directory |
| `npm run test:rls` | FAILED locally: 37 files failed; 495 failed, 10 passed, 2 expected failures, 80 skipped. Database connection refused at `127.0.0.1:56322`; subsequent teardown errors follow failed connection setup. Docker daemon unavailable. This is not a successful RLS verification. |
| `npm run test:e2e:auth` | BLOCKED, exit 1 before execution: required local `NEXT_PUBLIC_SUPABASE_URL` absent. No test credentials fabricated or production services substituted. |
| `npm run test:e2e` | Local run was in progress when the implementation commit was written and no local completion was recorded. The CI `e2e` job for the pushed revision succeeded; see the final evidence section below |
| `git diff --check` | PASS |

The new 27-test legacy suite exercises real Git binding reads and the real filesystem repository in disposable synthetic repositories/workspaces. Tests cover all twelve source candidates, exact raw/source/candidate/publication hashes, explicit sidecars, source identity forgery, altered source bytes, stale blueprint/packet bindings, duplicate IDs and records, no-write CLI operation, raw manifest pinning, idempotence, concurrent imports, occupied locks, interruption/resume, missing metadata refusal, unknown identity independence, forged generation events, review evidence isolation, deterministic correctness and staging/publication refusal. Existing assertion logic was not weakened. Two existing test helpers now use the narrower known-generation input type; their assertions are unchanged.

The real preflight report is not an assertion that the twelve questions clear correctness, independent-review or publication gates. It verifies import bindings only. Original generation remains unverified for all twelve; operator identity remains unestablished. Advisory reviews and owner approvals were neither created nor promoted. No actual candidate ingestion, staging, publication, release pin change, merge or deployment was executed. PR #73 and its branch were verified unchanged at the reference commit.

CI results must be read for the exact pushed implementation revision. Local infrastructure failures do not justify disabling checks or changing governance assertions. Full CI green remains mandatory before any owner-authorised merge.

---

# Final verification evidence — hardening review of `ed7c9376`

Recorded 22 October 2026 by an independent reviewer session. Locally executed and CI-executed results are kept separate, and nothing below is claimed unless the evidence was observed. Evidence was gathered on the implementation commit `ed7c9376732cfbcdd567adab923077fcb20167ca`; the hardening change described in `manifest-tamper-review.md` is a separate, later commit.

## CI-executed (GitHub Actions, commit `ed7c9376`)

CI ran twice for this exact SHA, once per trigger. Every job concluded `success` in both runs.

| Run | Trigger | `core` | `scholarship-drafts` | `rls` | `e2e` | `e2e-auth` |
| --- | --- | --- | --- | --- | --- | --- |
| 39730210454 | push | success | success | success | success | success |
| 39730233023 | pull_request | success | success | success | success | success |

The PR also reports the Vercel deployment and Vercel Preview Comments checks as passing. The `core` job log for the pull_request run shows 371 of 371 vitest files passing. Only that summary line was inspected; per-step results for build, lint and the content validators were not individually read from the logs, so they are not itemised here beyond the job conclusion. The `rls`, `e2e` and `e2e-auth` jobs are the only evidence for those three suites: they could not run on the author's machine (no Docker daemon, no Supabase environment).

## Locally executed (worktree `feat/legacy-content-provenance`)

On `ed7c9376`, before the hardening change:

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npx vitest run src/tests/unit/question-factory` (factory, provenance, review, staging, publication) | PASS: 101 files, 2,702 tests |
| `npm test` (full unit suite) | 6,493 tests passed; 1 file failed to load: `src/tests/unit/stripe-webhook-route.test.ts` |
| `npm run validate:questions`, `npm run questions:validate-ledger`, `npm run check:answers -- --include-published` | PASS (0 answer-check failures) |

After the hardening change (adds `legacy-manifest-tamper.test.ts`, 19 tests):

| Check | Result |
| --- | --- |
| `npm run typecheck`, `eslint` on the changed files | PASS |
| `npx vitest run src/tests/unit/question-factory src/tests/unit/publication-integrity.test.ts src/tests/unit/amc-draft-review-sources.test.ts` | PASS: 104 files, 2,745 tests |
| `npm test` (full unit suite) | 6,512 tests passed; same single file failed to load |
| `npm run validate:questions`, `questions:validate-ledger`, `check:answers -- --include-published` | PASS |

## Local limitation: missing environment file

`src/tests/unit/stripe-webhook-route.test.ts` fails at load with `ENOENT: no such file or directory, open '...\.env.local'`. The worktree has no `.env.local` (it is intentionally untracked and no secrets were created or substituted). No test in that file executed locally, so it is neither passed nor failed here; it is unrelated to this change, and the CI `core` job, which provides its own environment, passed all 371 files. `test:rls`, `test:e2e` and `test:e2e:auth` were not run locally for the same infrastructure reasons recorded above and rest on CI alone.

## No-write preflight, 12 of 12

Re-executed by the reviewer with `npm run questions:import-legacy -- --manifest docs/reviews/legacy-content-provenance-phase1/sample-import-manifest.json --expected-manifest-sha256 13bdb8a4756cc123f18017555fef266c62ad523d3ca841cca655f5989e161dd6 --dry-run`:

- `status: preflight_passed`, `writesPerformed: false`, 12 items, every `replay: false`.
- `independentReviewEligible: false`, `stagingEligible: false`, `publicationEligible: false`.
- Manifest SHA-256 and canonical manifest hash equal the values pinned in `preflight-12.json`; all 12 factory-candidate hashes and all 12 publication-content hashes equal the committed report.
- `git status` was identical before and after the command: no factory, lock, journal or report file was created.

This is an import-binding check only. It does not assert correctness, independent-review, staging or publication clearance.

## What was not run

No real legacy ingestion, staging, publication, human approval, merge or deployment was performed. PR #73 and its branch were not modified.
