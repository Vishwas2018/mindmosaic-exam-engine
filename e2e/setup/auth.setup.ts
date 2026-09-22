/**
 * Playwright globalSetup for the authenticated e2e suite (wired up in
 * playwright.auth.config.ts). Runs once before any spec: guards the
 * environment, then seeds every fixture identity (../fixtures/seed.ts).
 *
 * Used to also sign in each identity once here and write a storageState
 * file per identity for contextAs() to load — replaced by contextAs()
 * signing in fresh on every call (see fixtures/auth.fixture.ts's doc
 * comment) after that shared-per-run session caused CI-only auth failures
 * (2026-09-21): the first test to legitimately refresh a shared identity's
 * session rotated its refresh_token, invalidating every other test's frozen
 * copy of the same token for the rest of the run.
 */
import { assertLocalSupabaseEnvironment } from "../fixtures/environment-guard";
import { seed } from "../fixtures/seed";

export default async function globalSetup(): Promise<void> {
  assertLocalSupabaseEnvironment();
  await seed();
}
