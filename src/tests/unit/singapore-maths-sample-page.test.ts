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
 * available. That branch is still reached on a Vercel production deployment
 * and under the explicit opt-out, so both are asserted here.
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

const originalFlag = process.env.SINGAPORE_MATHS_SAMPLE_ENABLED;
const originalVercelEnv = process.env.VERCEL_ENV;

afterEach(() => {
  process.env.SINGAPORE_MATHS_SAMPLE_ENABLED = originalFlag;
  process.env.VERCEL_ENV = originalVercelEnv;
});

describe("Singapore Maths sample page — server/client boundary", () => {
  it("passes no function-valued props under the explicit opt-out (coming-soon branch)", async () => {
    process.env.SINGAPORE_MATHS_SAMPLE_ENABLED = "0";
    process.env.VERCEL_ENV = "preview";

    const tree = await SingaporeMathsSamplePage({
      searchParams: Promise.resolve({year: "3"}),
    });

    expect(functionValuedProps(tree)).toEqual([]);
  });

  it("passes no function-valued props on a real Vercel production deployment", async () => {
    process.env.SINGAPORE_MATHS_SAMPLE_ENABLED = "1";
    process.env.VERCEL_ENV = "production";

    const tree = await SingaporeMathsSamplePage({
      searchParams: Promise.resolve({year: "5"}),
    });

    expect(functionValuedProps(tree)).toEqual([]);
  });

  it("passes no function-valued props when the sample is available, for both year levels", async () => {
    delete process.env.SINGAPORE_MATHS_SAMPLE_ENABLED;
    process.env.VERCEL_ENV = "preview";

    for (const year of ["3", "5"] as const) {
      const tree = await SingaporeMathsSamplePage({
        searchParams: Promise.resolve({year}),
      });
      expect(functionValuedProps(tree), `year ${year}`).toEqual([]);
    }
  });

  it("passes no function-valued props on the year-selection screen", async () => {
    delete process.env.SINGAPORE_MATHS_SAMPLE_ENABLED;
    process.env.VERCEL_ENV = "preview";

    const tree = await SingaporeMathsSamplePage({
      searchParams: Promise.resolve({}),
    });

    expect(functionValuedProps(tree)).toEqual([]);
  });
});
