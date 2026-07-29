import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..", "..");
const PAGE_PATH = "src/app/dev/routes/page.tsx";
const source = readFileSync(join(ROOT, PAGE_PATH), "utf8");

const PATH_PATTERN = /path:\s*"([^"]+)"/g;
const paths = [...source.matchAll(PATH_PATTERN)].map((match) => match[1]);

describe("/dev/routes route index", () => {
  it("lists at least one route", () => {
    expect(paths.length).toBeGreaterThan(0);
  });

  it("every entry.path starts with '/'", () => {
    const offenders = paths.filter((path) => !path.startsWith("/"));
    expect(offenders).toEqual([]);
  });

  it("no two entries share a path", () => {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const path of paths) {
      if (seen.has(path)) duplicates.add(path);
      seen.add(path);
    }
    expect([...duplicates]).toEqual([]);
  });
});
