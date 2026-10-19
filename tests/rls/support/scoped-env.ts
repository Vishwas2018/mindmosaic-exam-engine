import { afterAll, beforeAll } from "vitest";

/**
 * Sets an environment variable for one test file and puts it back afterwards, whether the tests passed, failed or
 * threw. The RLS suite is one long-lived process (vitest.rls.config.ts, `isolate: false`), so a variable left
 * changed or deleted by one file is seen by every file after it.
 *
 * `afterAll` runs when a test fails and when `beforeAll` throws, so the restoration cannot be skipped by a failing
 * test. The per-file safety net in setup-guard.ts restores the database variables again regardless.
 */
export function scopeEnvToFile(name: string, value: () => string): void {
  let existed = false;
  let before: string | undefined;

  beforeAll(() => {
    existed = Object.hasOwn(process.env, name);
    before = process.env[name];
    process.env[name] = value();
  });

  afterAll(() => {
    if (existed && before !== undefined) process.env[name] = before;
    else delete process.env[name];
  });
}
