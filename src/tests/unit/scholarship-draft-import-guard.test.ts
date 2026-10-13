import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

describe("Scholarship draft import guard", () => {
  function findDraftImports(dir: string): Array<{ file: string; line: number }> {
    const results: Array<{ file: string; line: number }> = [];
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          entry === "node_modules" ||
          entry === ".git" ||
          entry === ".next" ||
          entry === "tests"
        ) {
          continue;
        }
        results.push(...findDraftImports(fullPath));
      } else if (stat.isFile() && (entry.endsWith(".ts") || entry.endsWith(".tsx"))) {
        const content = readFileSync(fullPath, "utf8");
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          if (/from\s+["'].*scholarship-drafts.*["']/.test(line) || /import\s*\(\s*["'].*scholarship-drafts.*["']\s*\)/.test(line)) {
            results.push({ file: fullPath, line: idx + 1 });
          }
        });
      }
    }

    return results;
  }

  it("ensures zero runtime code in src/ imports content/scholarship-drafts", () => {
    const srcDir = resolve(process.cwd(), "src");
    const offendingImports = findDraftImports(srcDir);
    expect(offendingImports).toEqual([]);
  });
});
