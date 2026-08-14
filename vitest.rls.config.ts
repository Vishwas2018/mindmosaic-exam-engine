import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

// Separate from vitest.config.ts because these tests hit a real Postgres
// over TCP and must not run under jsdom or load the component-test setup
// file. Requires `supabase start` (see supabase/config.toml and
// docs/RLS_TEST_PLAN.md) before running.
export default defineConfig({
  /* The `@` alias, needed since these suites started exercising real server
     modules rather than only SQL: tests/rls/assessment-scoring.test.ts drives
     src/server/scoring/answer-access.ts against this database, because the
     property under test — that scoring works with the least-privilege
     credential and nothing more — is not observable from either side alone. */
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      /* See tests/shims/server-only.ts — the guard stays in the module under
         test; only its resolution changes inside this harness. */
      "server-only": fileURLToPath(new URL("./tests/shims/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/rls/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    /**
     * These suites are no longer independent of one another, so they no longer
     * run at the same time.
     *
     * Every file here used to wrap its work in a transaction and roll back,
     * which made file parallelism free: concurrent suites could not see each
     * other's rows. `assessment-scoring.test.ts` breaks that, and cannot avoid
     * breaking it — the module it tests opens its *own* connection as
     * `mindmosaic_scoring`, and a second connection cannot see uncommitted
     * fixtures. So that suite commits, and its committed inserts and deletes
     * are visible to whatever else is running.
     *
     * Run in parallel, the effect was not a clean failure but a **worker
     * process exiting mid-run**, which vitest reports as `Test Files 11 passed
     * (12)` — a missing file rather than a failing one, alongside a separate
     * "unhandled error" block that is easy to read past. Nine tests silently
     * did not run. Serially the same 196 tests pass every time.
     *
     * The cost is roughly 26s instead of 6s for the whole suite. That is a
     * price worth paying for a gate whose failure mode was "quietly tests
     * less", and these suites all contend on a single Postgres anyway, so the
     * parallelism was buying less than the wall-clock suggested.
     */
    fileParallelism: false,
    pool: "forks",
    /**
     * ONE child process for the whole run, which is what actually stops the
     * missing-file failure above.
     *
     * `fileParallelism: false` serialises the files but does not change how
     * many processes the run creates. With `isolate` at its default of true the
     * forks pool tears down the child after each file and spawns a fresh one
     * for the next, so a 14-file run is 14 spawn/exit cycles — and the crash
     * tracks the cycle, not any test. The fork dies *early* in whichever file
     * it had just started (15 of 15 tests left pending, then 45 of 50, then 9
     * of 13), the file is a different one every run, and the set includes
     * suites that predate every table this phase added. Measured on this host
     * at 11 incomplete runs in 17 under the default.
     *
     * Turning isolation off makes the run a single long-lived process that
     * loads each file in turn, so there are no spawn/exit cycles left to lose.
     * What isolation actually buys — a fresh module registry per file — these
     * suites do not use: they are `environment: "node"` with no setup file, no
     * global mocks and no module-level state beyond a `pg` client each one
     * opens and closes itself. What they DO share is a single Postgres, and
     * that sharing is already handled by `fileParallelism: false` above.
     *
     * NOTE FOR ANYONE EDITING THIS: in Vitest 4 these are top-level options.
     * The same settings nested under `poolOptions.forks` are silently ignored
     * with only a deprecation line in the output — which is how the first
     * attempt at this fix measured as "no change".
     */
    isolate: false,
    /**
     * Belt and suspenders with `scripts/verify-test-run.mts`, which stays.
     * The guard exists because this failure mode reports a crashed file as
     * *missing* rather than as failing, and a run that quietly tests less is
     * exactly what a green tick must not be allowed to mean. A pool setting
     * makes the crash rare; only the guard makes it loud.
     */
  },
});
