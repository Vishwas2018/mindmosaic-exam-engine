import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Static guards for the Stripe server plumbing, modelled closely on
 * src/tests/unit/provision-child-server-only.test.ts and
 * src/tests/unit/bundle-boundaries.test.ts. STRIPE_SECRET_KEY,
 * STRIPE_WEBHOOK_SECRET and SUPABASE_SERVICE_ROLE_KEY must never reach a
 * client bundle (docs/PRIVACY_AND_BILLING_GUARDRAILS.md: "Payment-provider
 * secret keys and webhook signing secrets live only in server-side
 * environment variables ... never in a client bundle"). These are static
 * guards on top of the `import "server-only"` runtime guard already in
 * every src/lib/stripe/** module: even if a future edit accidentally
 * dropped that import, these tests still catch a client component
 * importing the module (or the module reading a secret without the guard).
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");
const STRIPE_LIB_DIR = "src/lib/stripe";
const STRIPE_LIB_SPECIFIER_PREFIX = "@/lib/stripe";
const STRIPE_ROUTE_DIR = "src/app/api/stripe";

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function listSourceFiles(relativeDir: string): string[] {
  const absoluteDir = join(ROOT, relativeDir);
  const entries: string[] = [];
  for (const entry of readdirSync(absoluteDir)) {
    const absolutePath = join(absoluteDir, entry);
    if (statSync(absolutePath).isDirectory()) {
      entries.push(...listSourceFiles(relative(ROOT, absolutePath)));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      entries.push(relative(ROOT, absolutePath).split("\\").join("/"));
    }
  }
  return entries;
}

const stripeLibFiles = listSourceFiles(STRIPE_LIB_DIR);
const stripeRouteFiles = listSourceFiles(STRIPE_ROUTE_DIR);
const allSourceFiles = listSourceFiles("src");

/*
 * Files that can never end up in a client bundle by construction, so the
 * "must carry the server-only import" guard below doesn't apply to them:
 * - src/app/api/** Route Handlers are framework-guaranteed server-only by
 *   Next.js's app router (a client component cannot import route.ts and
 *   have it run client-side) — the guard belongs on *importable* modules.
 * - src/tests/** never ships; a mock string like
 *   process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key" in a test file is
 *   not a leak risk.
 */
const secretReferenceScopeFiles = allSourceFiles.filter(
  (path) => !path.startsWith("src/app/api/") && !path.startsWith("src/tests/"),
);

describe("src/lib/stripe/** is server-only", () => {
  it("every module under src/lib/stripe declares the server-only import guard", () => {
    expect(stripeLibFiles.length).toBeGreaterThan(0);
    for (const path of stripeLibFiles) {
      const source = readSource(path);
      expect(source, `${path} is missing import "server-only";`).toMatch(
        /import\s+["']server-only["'];/,
      );
    }
  });

  it("no 'use client' file anywhere in src imports from @/lib/stripe/**", () => {
    const offenders = allSourceFiles.filter((path) => {
      if (stripeLibFiles.includes(path)) return false;
      const source = readSource(path);
      if (!/^"use client";/.test(source)) return false;
      return source.includes(STRIPE_LIB_SPECIFIER_PREFIX);
    });

    expect(offenders).toEqual([]);
  });

  it("no 'use client' file anywhere in src imports the checkout/portal/webhook route handlers", () => {
    const routeSpecifiers = [
      "@/app/api/stripe/checkout/route",
      "@/app/api/stripe/portal/route",
      "@/app/api/stripe/webhook/route",
    ];
    const offenders = allSourceFiles.filter((path) => {
      if (stripeRouteFiles.includes(path)) return false;
      const source = readSource(path);
      if (!/^"use client";/.test(source)) return false;
      return routeSpecifiers.some((specifier) => source.includes(specifier));
    });

    expect(offenders).toEqual([]);
  });

  it("STRIPE_SECRET_KEY is only referenced inside server-only-guarded, client-unreachable files", () => {
    const offenders = secretReferenceScopeFiles.filter((path) => {
      const source = readSource(path);
      if (!source.includes("STRIPE_SECRET_KEY")) return false;
      return !/import\s+["']server-only["'];/.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it("STRIPE_WEBHOOK_SECRET is only referenced inside server-only-guarded, client-unreachable files", () => {
    const offenders = secretReferenceScopeFiles.filter((path) => {
      const source = readSource(path);
      if (!source.includes("STRIPE_WEBHOOK_SECRET")) return false;
      return !/import\s+["']server-only["'];/.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it("SUPABASE_SERVICE_ROLE_KEY is only referenced inside server-only-guarded, client-unreachable files (across all of src, not just stripe)", () => {
    const offenders = secretReferenceScopeFiles.filter((path) => {
      const source = readSource(path);
      if (!source.includes("SUPABASE_SERVICE_ROLE_KEY")) return false;
      return !/import\s+["']server-only["'];/.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it("the three stripe route handlers exist and are not re-exported from any client-imported barrel", () => {
    for (const routeFile of [
      "src/app/api/stripe/checkout/route.ts",
      "src/app/api/stripe/portal/route.ts",
      "src/app/api/stripe/webhook/route.ts",
    ]) {
      expect(stripeRouteFiles).toContain(routeFile);
    }
  });
});
