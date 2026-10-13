import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function getSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "tests" || entry.name === "node_modules" || entry.name === ".next") {
        continue;
      }
      files.push(...getSourceFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Production import guards (Section 12)", () => {
  it("ensures no production code under src/ imports from test helpers or test directories", () => {
    const srcDir = path.resolve(process.cwd(), "src");
    const productionFiles = getSourceFiles(srcDir);
    expect(productionFiles.length).toBeGreaterThan(50);

    const violations: { file: string; line: number; importStatement: string }[] = [];

    // Test import patterns: importing from tests, src/tests, helpers/publication-approvals, etc.
    const bannedImportRegex =
      /from\s+["'](@\/tests\/|@\/src\/tests\/|\.\.?\/.*tests\/|.*helpers\/publication-approvals)["']/g;

    for (const file of productionFiles) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (bannedImportRegex.test(line)) {
          violations.push({
            file: path.relative(process.cwd(), file),
            line: i + 1,
            importStatement: line.trim(),
          });
        }
      }
    }

    expect(
      violations,
      `Found test helper imports in production source code:\n${violations
        .map((v) => `  ${v.file}:${v.line} -> ${v.importStatement}`)
        .join("\n")}`,
    ).toEqual([]);
  });
});
