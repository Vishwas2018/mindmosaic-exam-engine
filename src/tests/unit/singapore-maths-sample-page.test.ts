import type {ReactElement} from "react";
import {afterEach, describe, expect, it} from "vitest";

import SingaporeMathsSamplePage from "@/app/practice/singapore-maths/sample/page";

/*
 * The sample route is a Server Component that renders Client Components in
 * both of its branches. Every prop it hands across that boundary must be
 * serialisable: React throws "Functions cannot be passed directly to Client
 * Components" at render time otherwise, and on /practice that lands in the
 * segment error boundary as "We couldn't load the practice catalogue."
 *
 * The Coming Soon branch regressed exactly this way — it passed the resolved
 * catalogue entry, whose `icon` is a React component — and no suite caught it,
 * because the authenticated Playwright suite only ever ran with the sample
 * available. Every route through the gate that reaches that branch is
 * asserted here.
 */

function isElement(value: unknown): value is ReactElement {
  return (
    typeof value === "object" &&
    value !== null &&
    "props" in value &&
    "type" in value
  );
}

/** Every prop value handed to a child element, with the path that reached it. */
function functionValuedProps(node: unknown, path = "root"): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((child, i) => functionValuedProps(child, `${path}[${i}]`));
  }
  if (!isElement(node)) return [];

  const found: string[] = [];
  const props = (node.props ?? {}) as Record<string, unknown>;
  for (const [name, value] of Object.entries(props)) {
    if (name === "children") continue;
    if (typeof value === "function") {
      found.push(`${path}.${name}`);
      continue;
    }
    if (value && typeof value === "object") {
      for (const [innerName, innerValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (typeof innerValue === "function") found.push(`${path}.${name}.${innerName}`);
      }
    }
  }
  return [...found, ...functionValuedProps(props.children, `${path}.children`)];
}

const SAVED_KEYS = [
  "SINGAPORE_MATHS_SAMPLE_ENABLED",
  "SINGAPORE_MATHS_SAMPLE_SUPABASE_REF",
  "PRODUCTION_SUPABASE_PROJECT_REF",
  "NEXT_PUBLIC_SUPABASE_URL",
  "VERCEL_ENV",
] as const;

const saved = new Map(SAVED_KEYS.map((key) => [key, process.env[key]]));

/** Replaces the gate's whole input, so no ambient variable leaks in. */
function setEnvironment(values: Partial<Record<(typeof SAVED_KEYS)[number], string>>): void {
  for (const key of SAVED_KEYS) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  for (const [key, value] of saved) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const PREVIEW_PROJECT = "qawbnonprodproject";

/** A Preview deployment the gate allows: opted in, bound, production declared. */
const AVAILABLE = {
  VERCEL_ENV: "preview",
  NEXT_PUBLIC_SUPABASE_URL: `https://${PREVIEW_PROJECT}.supabase.co`,
  SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
  SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PREVIEW_PROJECT,
  PRODUCTION_SUPABASE_PROJECT_REF: "liveprodproject",
} as const;

describe("Singapore Maths sample page — server/client boundary", () => {
  /*
   * Each of these reaches the Coming Soon branch by a different route through
   * the gate. That branch is the one that crashed, so every way of arriving at
   * it is checked, not just the one that was reported.
   */
  for (const [label, environment] of [
    ["the explicit opt-out", {...AVAILABLE, SINGAPORE_MATHS_SAMPLE_ENABLED: "0"}],
    ["a real Vercel production deployment", {...AVAILABLE, VERCEL_ENV: "production"}],
    ["a Preview with no opt-in", {...AVAILABLE, SINGAPORE_MATHS_SAMPLE_ENABLED: undefined}],
    ["a Preview bound to the wrong project", {...AVAILABLE, SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: "otherproject"}],
    ["a Preview with no project binding", {...AVAILABLE, SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: undefined}],
    ["an unknown deployment context", {...AVAILABLE, VERCEL_ENV: "staging"}],
    ["an unidentifiable Supabase target", {...AVAILABLE, NEXT_PUBLIC_SUPABASE_URL: undefined}],
    ["a local app pointed at a remote project", {NEXT_PUBLIC_SUPABASE_URL: "https://somehostedproject.supabase.co"}],
  ] as const) {
    it(`passes no function-valued props with ${label} (coming-soon branch)`, async () => {
      setEnvironment(environment);

      const tree = await SingaporeMathsSamplePage({
        searchParams: Promise.resolve({year: "3"}),
      });

      expect(functionValuedProps(tree)).toEqual([]);
    });
  }

  it("passes no function-valued props when the sample is available, for both year levels", async () => {
    setEnvironment(AVAILABLE);

    for (const year of ["3", "5"] as const) {
      const tree = await SingaporeMathsSamplePage({
        searchParams: Promise.resolve({year}),
      });
      expect(functionValuedProps(tree), `year ${year}`).toEqual([]);
    }
  });

  it("passes no function-valued props when available against an isolated local backend", async () => {
    setEnvironment({NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321"});

    const tree = await SingaporeMathsSamplePage({
      searchParams: Promise.resolve({year: "5"}),
    });

    expect(functionValuedProps(tree)).toEqual([]);
  });

  it("passes no function-valued props on the year-selection screen", async () => {
    setEnvironment(AVAILABLE);

    const tree = await SingaporeMathsSamplePage({
      searchParams: Promise.resolve({}),
    });

    expect(functionValuedProps(tree)).toEqual([]);
  });
});
