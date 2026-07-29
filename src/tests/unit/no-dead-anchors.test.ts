import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression guard for the /#exam-setup dead-anchor bug: nine authenticated
 * student-shell links pointed at "/#exam-setup", a fragment with no matching
 * `id` anywhere in src/ (it only ever resolved by accident to the top of the
 * public marketing homepage). A bare "/#fragment" link is legitimate when
 * the fragment resolves on the homepage — see About's "/#subjects" (resolves
 * to Subjects.tsx's `id="subjects"`) and Contact/Help's "/#faq" (resolves to
 * Faq.tsx's `id="faq"`) — so this checks fragment resolution, not the
 * pattern itself. Modelled on src/tests/unit/stripe-server-only.test.ts's
 * static-scan pattern: catches this bug class reappearing without a running
 * server or browser.
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");

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

// src/tests/** never renders — fixture strings there aren't real links.
const allSourceFiles = listSourceFiles("src").filter((path) => !path.startsWith("src/tests/"));

const HREF_ROOT_FRAGMENT_PATTERN = /href=\{?["']\/#([\w-]+)["']\}?/g;
const STATIC_ID_PATTERN = /\bid=["']([\w-]+)["']/g;

const knownIds = new Set<string>();
for (const path of allSourceFiles) {
  const source = readSource(path);
  for (const match of source.matchAll(STATIC_ID_PATTERN)) {
    knownIds.add(match[1]);
  }
}

describe("no in-app link targets a bare '/#fragment' with no matching id anywhere in src/", () => {
  it("every href=\"/#fragment\" resolves to a real id somewhere in src/", () => {
    const offenders: Array<{ path: string; href: string }> = [];
    for (const path of allSourceFiles) {
      const source = readSource(path);
      for (const match of source.matchAll(HREF_ROOT_FRAGMENT_PATTERN)) {
        const fragment = match[1];
        if (!knownIds.has(fragment)) {
          offenders.push({ path, href: match[0] });
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
