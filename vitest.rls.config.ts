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
  },
});
