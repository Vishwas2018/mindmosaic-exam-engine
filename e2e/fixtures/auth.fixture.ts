/**
 * Role-specific Playwright fixtures. `contextAs("teacher-with-students")`
 * hands back a browser context already signed in as that fixture identity —
 * no UI login, no per-test seeding — by loading the storageState that
 * setup/auth.setup.ts generated once. A single spec file in this suite
 * exercises many different identities (see role-access.smoke.spec.ts), so
 * this is a factory fixture rather than Playwright's more common
 * one-project-per-storageState pattern.
 */
import { test as base, type BrowserContext } from "@playwright/test";
import path from "node:path";

import type { Identity } from "./identities";

export const AUTH_DIR = path.join(__dirname, "..", ".auth");

export function storageStatePath(key: Identity["key"] | "unauthenticated"): string {
  return path.join(AUTH_DIR, `${key}.json`);
}

type ContextKey = Identity["key"] | "unauthenticated";

interface AuthFixtures {
  contextAs: (key: ContextKey) => Promise<BrowserContext>;
}

export const test = base.extend<AuthFixtures>({
  contextAs: async ({ browser }, use) => {
    const opened: BrowserContext[] = [];
    await use(async (key) => {
      const context = await browser.newContext({ storageState: storageStatePath(key) });
      opened.push(context);
      return context;
    });
    for (const context of opened) {
      await context.close();
    }
  },
});

export { expect } from "@playwright/test";
