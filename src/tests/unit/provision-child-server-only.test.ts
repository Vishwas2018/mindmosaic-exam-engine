import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * D1 requires the provisioning action to be unreachable from client code
 * (the service-role key it uses must never ship to a browser). These are
 * static guards on top of the `import "server-only"` runtime guard already
 * in provision-child.ts: even if a future edit accidentally dropped that
 * import, these tests still catch a client component importing the module.
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");
const PROVISION_CHILD_PATH = "src/features/auth/provision-child.ts";
const PROVISION_CHILD_SPECIFIER = "@/features/auth/provision-child";

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

describe("provisionChild is server-only", () => {
  it("declares both the 'use server' action directive and the server-only import guard", () => {
    const source = readSource(PROVISION_CHILD_PATH);
    expect(source).toMatch(/^"use server";/);
    expect(source).toMatch(/import\s+["']server-only["'];/);
  });

  it("is not re-exported from the auth feature's client-imported barrel", () => {
    const barrel = readSource("src/features/auth/index.ts");
    expect(barrel).not.toMatch(/export\s*\{[^}]*provisionChild[^}]*\}/);
  });

  it("no 'use client' component imports it directly", () => {
    const candidates = listSourceFiles("src").filter((path) => path !== PROVISION_CHILD_PATH);

    const offenders = candidates.filter((path) => {
      const source = readSource(path);
      if (!/^"use client";/.test(source)) return false;
      return source.includes(PROVISION_CHILD_SPECIFIER);
    });

    expect(offenders).toEqual([]);
  });
});
