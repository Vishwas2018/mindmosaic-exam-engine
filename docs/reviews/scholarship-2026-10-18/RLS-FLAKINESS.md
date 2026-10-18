# The RLS suite's two failure modes (diagnosed 19 Oct 2026)

There were two unrelated problems that looked like one. Both occur on plain `origin/dev`; neither comes from the scholarship work. The first is fixed in this branch; the second is a native crash of the test worker on this Windows host, reproduced, characterised and now made impossible to miss, but not fixed.

## 1. Eleven tests fail with `No assessment session` (fixed)

Affected: `pending-manual-marks-consistency` (3), `target-http-lifecycle` (3), `target-sitting-end-to-end` (5).

**Cause.** `vitest.rls.config.ts` runs the whole suite in one long-lived process (`isolate: false`), so `process.env` is shared by every file. Those three files set `SCORING_DB_URL = scoringDbUrl()` in `beforeAll`, and `scoringDbUrl()` is `process.env.SCORING_DB_URL ?? <built-in default on port 56322>`. `assessment-scoring.test.ts` ended with an unconditional `delete process.env.SCORING_DB_URL`. If it ran before one of the three, the variable was gone, the default applied, and the scoring module (which opens its own connection from that variable) queried a different database from the one the test had just written to. In CI the default port *is* the database under test, so the delete was harmless there. Vitest orders files by its result cache, so whether the bug bit depended on cache state, which looked random.

**Reproduction.** Two pinned-order configs (kept in the handoff folder, `vitest.diag.forward.mts` and `.reverse.mts`; they extend the real config with a custom sequencer):

| Order | Original code | With the fix |
|---|---|---|
| `assessment-scoring` first | 11 failed, 32 passed (twice) | 43 of 43 pass (twice, re-checked on the committed fix) |
| `assessment-scoring` last | 43 of 43 pass (twice) | not needed |

**Fix (committed).** `tests/rls/support/scoped-env.ts` (`scopeEnvToFile`) sets a variable for one file and restores it afterwards in `afterAll`, which runs when a test fails and when `beforeAll` throws; all four files that touch `SCORING_DB_URL` use it. A per-file safety net (`support/setup-guard.ts`) snapshots the database variables before each file and puts them back after it, regardless of what the file did. `tests/rls/db-target-guard.test.ts` includes a deliberately failing test inside a scope (`it.fails`) and then asserts the variable is gone or original again in the next block, for both an unset and a pre-set variable.

**Database-target guard (committed).** See `CROSS-STACK-ACCESS.md`. Before any connection, `globalSetup` and a per-file setup, and every `connect*()` helper, check that all database variables are local addresses naming the same host and port as `RLS_TEST_DB_URL`; the dedicated roles' defaults are derived from that primary; `RLS_EXPECTED_DB_PORT` pins the port. Demonstrated: a split configuration and a hosted URL both stop the run with exit 1 before anything connects; the correct configuration runs 566 of 566.

## 2. The worker fork exits silently (reproduced, mitigated, not fixed)

**Symptom.** `Error: [vitest-pool]: Worker forks emitted error. Caused by: Error: Worker exited unexpectedly`, tests left pending, a file or the whole run short. The repository already documents this (see the long comment in `vitest.rls.config.ts`) and guards it with `scripts/verify-test-run.mts`.

**What the exit actually is.** vitest throws the exit code away. A preload hook that wraps `child_process.fork` in the vitest parent (`fork-exit-hook.cjs`, handoff folder) recorded it: **exit code 3221226505 = 0xC0000409, `STATUS_STACK_BUFFER_OVERRUN`, signal null**, on Node v24.15.0, Windows. That is a native fast-fail abort. Healthy workers end with `SIGTERM` from the parent.

**What it is not.** In the dying worker: no `exit`, `beforeExit`, `uncaughtException`, `unhandledRejection` or `process.exit()` event reached a JavaScript handler (a probe installed with synchronous writes logged none); no stdout or stderr text; and no Node diagnostic report even with `--report-on-fatalerror --report-uncaught-exception`. So it is not an assertion in the tests, not a thrown error, and not a V8 fatal error.

**Frequency, measured on the isolated database:**

| Workload | Crashes |
|---|---|
| Whole suite (35 files, about 70 s) | about 1 run in 3 in the first diagnostic loops; 3 of 14 in the later instrumented loops |
| `assessment-session-model.test.ts` alone (50 tests of database work) | 4 of 30 |
| the same file, split by describe block (smaller slices) | 2 of 180 |
| `resolution-rule.test.ts` alone | 1 of 30 |
| `classes.test.ts` alone | 0 of 30 |
| a test file that does nothing (no database) | 0 of 40 |
| raw Node plus `pg`, 400 connect/begin/failing-statement/rollback/end cycles per process, no vitest | 0 of 38 |

The rate rises with the amount of database socket traffic inside a vitest worker and is zero without it. The crash can land at any point, including the first seconds of the first file, which is why the "missing file" varies. It reproduces on unmodified `origin/dev`. The GitHub Actions workflow (Linux) succeeded on the 8 most recent runs of `dev`, and that workflow includes the `rls` job.

**Best current reading** (unproven): a fault inside Node 24.15.0 or libuv on Windows triggered by `pg` socket teardown under vitest's fork IPC. To confirm or remove it someone would need to repeat the loop on another Node release (24.x patch or 22 LTS) or capture a Windows Error Reporting dump (`HKLM\SOFTWARE\Microsoft\Windows\Windows Error Reporting\LocalDumps`). I did not change the Node version or the machine's settings.

**What the repository does about it now (committed).** `scripts/verify-test-run.mts` already refused a run whose files were missing or tests left pending; it now also:

- streams vitest's output live **and keeps it**, and records vitest's real exit code and signal;
- decodes native exit codes (`exit code 3221226505 (0xC0000409, STATUS_STACK_BUFFER_OVERRUN (native fast-fail abort))`);
- fails on crash text in the output (`Worker exited unexpectedly`, `Worker forks emitted error`, `Vitest caught N unhandled error`, an `Errors N error` summary) **even if vitest exited 0 and the report looks complete**, the worst case its header describes;
- fails if vitest was killed by a signal or could not be started;
- when `TEST_RUN_RECORD_DIR` is set, writes the full log, a copy of the JSON report and a `record.json` (exit code, signal, decoded status, problems, counts, Node version, platform) per run, and writes the record even when it refuses.

`src/tests/unit/test-run-guard.test.ts` covers each of those, including the crash-with-exit-0 shape. The evidence kept with this branch is in `evidence/`.

**What remains.** A crash still fails the run (correctly: it is an incomplete run) and a rerun is needed. I deliberately did **not** add an automatic retry: it would turn an unexplained native crash into a green tick. If one is wanted for this Windows host, it should be opt-in, bounded, restricted to this exact exit code, and report the retry loudly.
