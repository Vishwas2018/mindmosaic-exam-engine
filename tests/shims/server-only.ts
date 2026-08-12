/**
 * Stands in for the `server-only` package inside both vitest harnesses.
 *
 * That package works by resolving to a module that throws unless the bundler
 * sets the `react-server` export condition — which is exactly the guard we want
 * on `src/server/scoring/answer-access.ts`, and exactly what makes it
 * unimportable from a test process. Neither harness is a browser bundle, so the
 * condition the guard exists to detect cannot arise in either.
 *
 * Stubbing it rather than deleting the import from the modules under test is
 * the point: the real guard stays in the real code path, where a `"use client"`
 * file importing the scoring module still fails at build time. The static
 * checks in src/tests/unit/scoring-module-boundary.test.ts assert that the
 * import is still present in the source, so this shim cannot quietly become the
 * reason a missing guard goes unnoticed.
 */
export {};
