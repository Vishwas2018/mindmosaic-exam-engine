import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { questionBank } from "@/content/questions/question-bank";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";

const repository = process.cwd();
const runner = path.join(repository, "node_modules/tsx/dist/cli.mjs");
const header = "questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes";
const row = (index = 0, changes: Record<string, string> = {}) => {
  const question = questionBank[index];
  const values = {
    questionId: question.id, contentHash: canonicalQuestionHash(question), revision: "1",
    sourceManifestHash: "", correctness: "", originality: "", ageAppropriateness: "",
    decision: "approve", notes: "", ...changes,
  };
  return Object.values(values).join(",");
};

describe("approval CLI boundaries without recording approvals", () => {
  it.each([
    { name: "blank checks", rows: [row()], reviewer: true, message: "all three checks" },
    { name: "stale hash", rows: [row(0, { contentHash: "0".repeat(64), correctness: "yes", originality: "yes", ageAppropriateness: "yes" })], reviewer: true, message: "content hash" },
    { name: "duplicate target", rows: [row(0, { decision: "reject" }), row(0, { revision: "2", decision: "revise" })], reviewer: true, message: "Duplicate approval target" },
    { name: "missing reviewer", rows: [row()], reviewer: false, message: "Reviewer full name" },
    { name: "reject and revise", rows: [row(0, { decision: "reject" }), row(1, { decision: "revise" })], reviewer: true, message: "New approvals recorded:       0" },
  ])("$name writes no approval files", async testCase => {
    const root = await mkdtemp(path.join(tmpdir(), "mm-approval-cli-"));
    try {
      // An isolated empty source directory suffices for these curated items.
      // Even a broken writer could never touch repository approval evidence.
      await mkdir(path.join(root, "content/question-factory/published-manifests"), { recursive: true });
      const sheet = path.join(root, "review.csv");
      await writeFile(sheet, [header, ...testCase.rows].join("\n"), "utf8");
      const result = spawnSync(process.execPath, [runner, "--tsconfig", path.join(repository, "tsconfig.json"),
        path.join(repository, "scripts/content-approvals.mts"), "record-batch", "--sheet", sheet,
        ...(testCase.reviewer ? ["--reviewer", "Test-only reviewer"] : []),
      ], { cwd: root, encoding: "utf8", timeout: 20_000 });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(testCase.name === "reject and revise" ? 0 : 1);
      expect(result.stdout + result.stderr).toContain(testCase.message);
      const files = await readdir(path.join(root, "content/publication-approvals")).catch(error => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
      expect(files).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 25_000);

  it("renders a real 25-question programme batch with all reviewer cells blank", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mm-review-sheet-"));
    try {
      const result = spawnSync(process.execPath, [runner, path.join(repository, "scripts/review-sheet.mts"),
        "--programme", "naplan-y3-numeracy", "--limit", "25", "--out-dir", root,
      ], { cwd: repository, encoding: "utf8", timeout: 20_000 });
      expect(result.error).toBeUndefined();
      expect(result.status, result.stdout + result.stderr).toBe(0);
      const files = await readdir(root);
      const csv = await readFile(path.join(root, files.find(file => file.endsWith(".csv"))!), "utf8");
      const html = await readFile(path.join(root, files.find(file => file.endsWith(".html"))!), "utf8");
      const rows = csv.trimEnd().split(/\r?\n/);
      expect(rows).toHaveLength(26);
      expect(rows[0]).toBe(header);
      for (const line of rows.slice(1)) expect(line.split(",").slice(4)).toEqual(["", "", "", "", ""]);
      expect((html.match(/<article class="question-card"/g) ?? [])).toHaveLength(25);
      expect(html).toContain("NAPLAN Year 3 Numeracy");
      expect(html).toContain("Worked Solution");
      expect(html).toContain("content:record-approvals");
      expect(html).toMatch(/\.grid\s*\{\s*display:\s*grid/);
      expect(html).toContain("--mm-brand:");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 25_000);
});
