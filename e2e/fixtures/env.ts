/**
 * Loads e2e-only environment configuration from `.env.e2e.local` (gitignored,
 * see `.env.e2e.local.example`). Deliberately separate from `.env.local` —
 * that file is the developer's own Supabase project (see
 * docs/testing/playwright-auth-test-data-guide.md for why), and this suite
 * must never read it. `loadEnvFile` silently no-ops if the file is already
 * loaded or missing; the missing case is caught below so a clear error
 * surfaces instead of every var reading undefined.
 */
import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ENV_FILE = join(__dirname, "..", "..", ".env.e2e.local");

if (existsSync(ENV_FILE)) {
  try {
    loadEnvFile(ENV_FILE);
  } catch {
    // Already loaded (re-import in the same process) — fine to ignore.
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `e2e env: ${name} is not set. Copy .env.e2e.local.example to .env.e2e.local ` +
        `and fill it in (see docs/testing/playwright-auth-test-data-guide.md).`,
    );
  }
  return value;
}

export const e2eEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get fixturePassword() {
    return required("E2E_FIXTURE_PASSWORD");
  },
  get fixturePin() {
    return required("E2E_FIXTURE_STUDENT_PIN");
  },
  get envFilePath() {
    return ENV_FILE;
  },
};
