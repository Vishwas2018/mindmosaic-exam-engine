import { afterAll, beforeAll } from "vitest";

import { assertSingleLocalTarget, restoreEnv, snapshotEnv, type EnvSnapshot } from "./db-target";

/**
 * Runs for every RLS test file (vitest `setupFiles`), before the file's own hooks and tests.
 *
 *  - beforeAll: refuse to continue unless every database URL names one local database. No query has run yet.
 *  - afterAll: put the database variables back exactly as they were when the file started, so a file that changed or
 *    deleted one (or failed before it could tidy up) cannot redirect the next file to a different database.
 */
let snapshot: EnvSnapshot | undefined;

beforeAll(() => {
  assertSingleLocalTarget();
  snapshot = snapshotEnv();
});

afterAll(() => {
  if (snapshot !== undefined) restoreEnv(snapshot);
  snapshot = undefined;
});
