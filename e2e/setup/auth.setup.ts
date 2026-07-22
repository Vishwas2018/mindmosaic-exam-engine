/**
 * Playwright globalSetup for the authenticated e2e suite (wired up in
 * playwright.auth.config.ts). Runs once before any spec: guards the
 * environment, seeds every fixture identity (../fixtures/seed.ts), then
 * signs each one in via GoTrue's password grant directly — no browser
 * navigation, no UI form — and writes a storageState file per identity
 * under e2e/.auth/ for role-access.smoke.spec.ts's contextAs fixture to load.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

import { assertLocalSupabaseEnvironment } from "../fixtures/environment-guard";
import { e2eEnv } from "../fixtures/env";
import { ADMIN, PARENTS, STUDENTS, TEACHERS, type Identity } from "../fixtures/identities";
import { seed } from "../fixtures/seed";
import { buildAuthCookies, signInWithPassword } from "../fixtures/session-cookie";
import { AUTH_DIR, storageStatePath } from "../fixtures/auth.fixture";
import { AUTH_APP_ORIGIN } from "../../playwright.auth.config";

export default async function globalSetup(): Promise<void> {
  assertLocalSupabaseEnvironment();
  await seed();

  mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();

  async function saveStorageState(
    key: Identity["key"],
    email: string,
    password: string,
  ): Promise<void> {
    const session = await signInWithPassword(email, password);
    const cookies = buildAuthCookies(AUTH_APP_ORIGIN, e2eEnv.supabaseUrl, session);
    const context = await browser.newContext();
    await context.addCookies(cookies);
    await context.storageState({ path: storageStatePath(key) });
    await context.close();
  }

  for (const parent of PARENTS) {
    await saveStorageState(parent.key, parent.email, e2eEnv.fixturePassword);
  }
  for (const teacher of TEACHERS) {
    await saveStorageState(teacher.key, teacher.email, e2eEnv.fixturePassword);
  }
  await saveStorageState(ADMIN.key, ADMIN.email, e2eEnv.fixturePassword);
  for (const student of STUDENTS) {
    await saveStorageState(student.key, student.email, e2eEnv.fixturePin);
  }

  // The "unauthenticated visitor" state is just: no cookies at all.
  const emptyContext = await browser.newContext();
  await emptyContext.storageState({ path: storageStatePath("unauthenticated") });
  await emptyContext.close();

  await browser.close();
}
