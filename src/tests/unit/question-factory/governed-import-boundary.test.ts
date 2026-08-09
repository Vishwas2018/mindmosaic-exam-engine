import { readdir, readFile } from "node:fs/promises";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Mission 3D governed-authority hardening (starting SHA `adce3f7`).
 *
 * Independent, ESLint-agnostic verification of the same importer
 * boundary `eslint.config.mjs`'s `no-restricted-imports` rules enforce:
 * `storage/governed-write-capability` may only be imported (within
 * `src/features/question-factory/`) by storage's own internals plus the
 * two governed writers, and each governed writer may only be imported by
 * its sibling orchestrator. This test scans the real source tree and
 * asserts the exact importer set for each restricted module — so the
 * boundary is proven even if the ESLint config is ever misconfigured,
 * disabled, or not run in some environment.
 */

const QUESTION_FACTORY_ROOT = path.join(process.cwd(), "src", "features", "question-factory");

async function listTypeScriptFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

/** Relative-import module specifiers this file references (`from "..."` and `import("...")`), basename only (extension-less), for matching against a restricted module's own basename. */
function importedBasenames(source: string): Set<string> {
  const basenames = new Set<string>();
  const patterns = [/from\s+["']([^"']+)["']/g, /import\(\s*["']([^"']+)["']\s*\)/g];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier.startsWith(".")) {
        basenames.add(path.posix.basename(specifier));
      }
    }
  }
  return basenames;
}

async function findImportersOf(moduleBasename: string): Promise<Set<string>> {
  const files = await listTypeScriptFiles(QUESTION_FACTORY_ROOT);
  const importers = new Set<string>();
  for (const file of files) {
    if (path.basename(file, ".ts") === moduleBasename) continue; // a module never "imports itself"
    const source = await readFile(file, "utf8");
    if (importedBasenames(source).has(moduleBasename)) {
      importers.add(path.relative(process.cwd(), file).split(path.sep).join("/"));
    }
  }
  return importers;
}

describe("governed import boundary — exact importer sets (ESLint-independent source scan)", () => {
  it("storage/governed-write-capability is imported only by storage internals and the two governed writers", async () => {
    const importers = await findImportersOf("governed-write-capability");
    expect(importers).toEqual(
      new Set([
        "src/features/question-factory/storage/factory-repository.ts",
        "src/features/question-factory/storage/fs-factory-repository.ts",
        "src/features/question-factory/storage/trusted-reports.ts",
        "src/features/question-factory/correctness/governed-attestation-writer.ts",
        "src/features/question-factory/review/governed-semantic-evidence-writer.ts",
      ]),
    );
  });

  it("correctness/governed-attestation-writer is imported only by orchestrate-correctness-verification.ts", async () => {
    const importers = await findImportersOf("governed-attestation-writer");
    expect(importers).toEqual(
      new Set(["src/features/question-factory/correctness/orchestrate-correctness-verification.ts"]),
    );
  });

  it("review/governed-semantic-evidence-writer is imported only by orchestrate-semantic-review.ts", async () => {
    const importers = await findImportersOf("governed-semantic-evidence-writer");
    expect(importers).toEqual(
      new Set(["src/features/question-factory/review/orchestrate-semantic-review.ts"]),
    );
  });
});
