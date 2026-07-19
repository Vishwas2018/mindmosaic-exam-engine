import { defineConfig } from "vitest/config";

// Separate from vitest.config.ts because these tests hit a real Postgres
// over TCP and must not run under jsdom or load the component-test setup
// file. Requires `supabase start` (see supabase/config.toml and
// docs/RLS_TEST_PLAN.md) before running.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/rls/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
