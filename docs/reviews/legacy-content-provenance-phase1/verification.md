# Verification â€” 22 October 2026

Environment: dedicated Windows worktree on `feat/legacy-content-provenance`, based on `82987b74e427cb367ebfcf7b880e1116fe3e178b`. Dependencies are shared through a local `node_modules` junction. No production environment or database was configured or changed.

Local build uses webpack to accommodate the shared dependency junction. CI retains the repository's unchanged default build command and independently installed dependencies.

| Check | Actual result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| Factory, approval and publication regression suites | Initial run: 101/103 files passed; 2,720/2,729 tests passed. Nine failures exposed empty create-lock directory residue. Component fixed without changing assertions; affected binding, storage and legacy suites subsequently PASS: 4 files, 125 tests. Full factory rerun remains a CI requirement |
| Remaining unit suites | PASS, exit 0; 332 files, 5,731 tests |
| `npm run build -- --webpack` | PASS, exit 0; compilation, TypeScript, static page generation and traces completed |
| `npm run validate:questions` | PASS; 1,005 runtime questions |
| `npm run content:validate-scholarship-drafts` | PASS; 160 drafts, 99 solver-backed, 61 human-semantic flags retained |
| `npm run questions:validate-ledger` | PASS; all in-scope rows/files reconcile |
| `npm run check:answers -- --include-published` | PASS; 1,601 structurally checked, 175 fully computable, 0 failures; editorial-review classification and warnings retained |
| Real 12-candidate command `questions:import-legacy â€¦ --dry-run` | PASS; exact source/register/blueprint/review-packet hashes, no factory writes, no import transaction directory |
| `npm run test:rls` | FAILED locally: 37 files failed; 495 failed, 10 passed, 2 expected failures, 80 skipped. Database connection refused at `127.0.0.1:56322`; subsequent teardown errors follow failed connection setup. Docker daemon unavailable. This is not a successful RLS verification. |
| `npm run test:e2e:auth` | BLOCKED, exit 1 before execution: required local `NEXT_PUBLIC_SUPABASE_URL` absent. No test credentials fabricated or production services substituted. |
| `npm run test:e2e` | In progress at initial implementation commit; 243 tests selected, initial browser checks passing. Final result will be recorded after completion |
| `git diff --check` | PASS |

The new 27-test legacy suite exercises real Git binding reads and the real filesystem repository in disposable synthetic repositories/workspaces. Tests cover all twelve source candidates, exact raw/source/candidate/publication hashes, explicit sidecars, source identity forgery, altered source bytes, stale blueprint/packet bindings, duplicate IDs and records, no-write CLI operation, raw manifest pinning, idempotence, concurrent imports, occupied locks, interruption/resume, missing metadata refusal, unknown identity independence, forged generation events, review evidence isolation, deterministic correctness and staging/publication refusal. Existing assertion logic was not weakened. Two existing test helpers now use the narrower known-generation input type; their assertions are unchanged.

The real preflight report is not an assertion that the twelve questions clear correctness, independent-review or publication gates. It verifies import bindings only. Original generation remains unverified for all twelve; operator identity remains unestablished. Advisory reviews and owner approvals were neither created nor promoted. No actual candidate ingestion, staging, publication, release pin change, merge or deployment was executed. PR #73 and its branch were verified unchanged at the reference commit.

CI results must be read for the exact pushed implementation revision. Local infrastructure failures do not justify disabling checks or changing governance assertions. Full CI green remains mandatory before any owner-authorised merge.
