import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const SCRIPTS_DIR = join(ROOT, "scripts");
const TSX_CLI = join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function listScriptFiles(dir: string): string[] {
  const entries: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (entry !== "node_modules" && entry !== "lib") {
        entries.push(...listScriptFiles(fullPath));
      }
    } else if (/\.(mts|ts)$/.test(entry)) {
      entries.push(relative(ROOT, fullPath).split("\\").join("/"));
    }
  }
  return entries;
}

describe("standalone scripts importing server-only modules load shim first", () => {
  it("every standalone script that imports operator-service loads allow-server-only as first import", () => {
    const scripts = listScriptFiles(SCRIPTS_DIR);
    const scriptsImportingOperator = scripts.filter((path) => {
      const source = readSource(path);
      return source.includes("operator-service");
    });

    expect(scriptsImportingOperator.length).toBeGreaterThan(0);

    for (const scriptPath of scriptsImportingOperator) {
      const source = readSource(scriptPath);
      const lines = source
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("//") && !l.startsWith("/*") && !l.startsWith("*"));

      const firstCodeLine = lines[0] ?? "";
      expect(
        firstCodeLine,
        `${scriptPath} must import allow-server-only as its first active import before operator-service`,
      ).toMatch(/import\s+["'].*allow-server-only(\.mts)?["'];/);
    }
  });

  it("mm-content --help executes successfully without server-only runtime error", () => {
    const scriptPath = join(ROOT, "scripts", "mm-content.mts");
    const result = spawnSync(process.execPath, [TSX_CLI, scriptPath, "--help"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("MindMosaic Content Platform v2");
    expect(result.stdout).toContain("mm-content inventory");
    expect(result.stderr).not.toContain("This module cannot be imported from a Client Component module");
  });
});
