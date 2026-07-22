import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The AI provider adapter (src/features/question-factory/ai) reads
 * ANTHROPIC_API_KEY/OPENAI_API_KEY — those must never reach a client
 * bundle. It deliberately does **not** carry the `server-only` package's
 * own runtime guard the way `provision-child.ts` does: this module is
 * loaded directly by the `questions:generate-ai`/`questions:review-ai` tsx
 * CLI scripts (a plain Node process with none of the bundler
 * "react-server" export condition that package's no-throw path depends
 * on) — `import "server-only"` here would make every CLI invocation
 * crash unconditionally (verified empirically; see `ai/provider.ts`'s doc
 * comment). The guard actually enforced here is the same one
 * `provision-child.ts` also actually relies on day to day: never
 * re-exported from a client-imported barrel, and never imported by a
 * `"use client"` file — both asserted statically below.
 */

const ROOT = join(import.meta.dirname, "..", "..", "..");
const AI_DIR = "src/features/question-factory/ai";
const FEATURE_BARREL_PATH = "src/features/question-factory/index.ts";
const AI_SPECIFIER_FRAGMENT = "features/question-factory/ai";
const NEXT_PUBLIC_PREFIX = "NEXT_PUBLIC_";

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

describe("the AI provider adapter never reaches a client bundle", () => {
  it("is not re-exported from the question-factory feature's client-imported barrel", () => {
    const barrel = readSource(FEATURE_BARREL_PATH);
    expect(barrel).not.toMatch(/export\s*\*\s*from\s*["']\.\/ai["']/);
  });

  it("no 'use client' component imports it directly", () => {
    const candidates = listSourceFiles("src").filter((path) => !path.startsWith(`${AI_DIR}/`));

    const offenders = candidates.filter((path) => {
      const source = readSource(path);
      if (!/^"use client";/.test(source)) return false;
      return source.includes(AI_SPECIFIER_FRAGMENT);
    });

    expect(offenders).toEqual([]);
  });

  it("never reads a NEXT_PUBLIC_-prefixed environment variable for a provider key", () => {
    const aiFiles = listSourceFiles(AI_DIR);
    expect(aiFiles.length).toBeGreaterThan(0);

    // Matches actual property/bracket access (`env.NEXT_PUBLIC_...`,
    // `env["NEXT_PUBLIC_..."]`) — not a doc comment merely discussing the
    // convention, which several of these files legitimately do.
    const accessPattern = new RegExp(`\\.${NEXT_PUBLIC_PREFIX}|["']${NEXT_PUBLIC_PREFIX}`);
    const offenders = aiFiles.filter((path) => accessPattern.test(readSource(path)));
    expect(offenders).toEqual([]);
  });
});
