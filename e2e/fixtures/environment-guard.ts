/**
 * Refuses to run the authenticated e2e suite against anything but a local
 * Supabase instance. This repo's own `.env.local` points at a hosted project
 * (`*.supabase.co`) for normal app development — see
 * docs/testing/playwright-auth-test-data-guide.md — so without this guard a
 * misconfigured `.env.e2e.local` (or a stray real env var) would let seed and
 * cleanup run destructive writes against a real project. Every entry point
 * (playwright.auth.config.ts, the setup project, and the seed/cleanup CLIs)
 * calls this before touching the network.
 */
import { e2eEnv } from "./env";

const ALLOWED_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1"]);

export function assertLocalSupabaseEnvironment(): void {
  const url = e2eEnv.supabaseUrl;
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error(`Environment guard: NEXT_PUBLIC_SUPABASE_URL ("${url}") is not a valid URL.`);
  }

  if (!ALLOWED_HOSTNAMES.has(hostname)) {
    throw new Error(
      `Environment guard: refusing to run against Supabase host "${hostname}". ` +
        `The authenticated e2e suite only ever targets a local Supabase instance ` +
        `(127.0.0.1/localhost) started via \`supabase start\`. Check .env.e2e.local — ` +
        `it must not point at a hosted (*.supabase.co) or any other remote project.`,
    );
  }

  // Belt-and-braces: this suite never touches Stripe, but a real key
  // (sk_live_/pk_live_) anywhere in this process's env is itself a sign that
  // production configuration has leaked into a test run.
  for (const key of ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]) {
    const value = process.env[key];
    if (value && /_live_/.test(value)) {
      throw new Error(
        `Environment guard: ${key} looks like a live Stripe key. Refusing to run — ` +
          `this suite must never execute with production billing credentials present.`,
      );
    }
  }
}
