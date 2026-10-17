import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import legacyQuarantinedIds from "@/content/questions/legacy-quarantined-ids.json";
import { practiceExamBank, publishedExamBank } from "@/content/questions/practice-bank";

const root = path.join(process.cwd(), "content/quarantine/legacy-unapproved");
const ledger = JSON.parse(fs.readFileSync(path.join(root, "ledger.json"), "utf8")) as {
  count: number;
  entries: { candidateId: string; questionId: string; originalPath: string; preservedPath: string; sha256: string; reason: string }[];
};
const activeDir = path.join(process.cwd(), "content/question-factory/published-manifests");

describe("legacy unapproved quarantine", () => {
  it("records every entry once with a reason, and the count matches", () => {
    expect(ledger.entries).toHaveLength(ledger.count);
    expect(ledger.count).toBe(543);
    expect(new Set(ledger.entries.map((e) => e.candidateId)).size).toBe(ledger.count);
    for (const entry of ledger.entries) expect(entry.reason).toBe("no_human_approval_pre_governance");
  });

  it("preserves every manifest byte-for-byte and none remains active", () => {
    for (const entry of ledger.entries) {
      const bytes = fs.readFileSync(path.join(process.cwd(), entry.preservedPath));
      expect(createHash("sha256").update(bytes).digest("hex"), entry.candidateId).toBe(entry.sha256);
      expect(fs.existsSync(path.join(process.cwd(), entry.originalPath)), entry.candidateId).toBe(false);
    }
  });

  it("never quarantines an item that holds a human approval", () => {
    const approvals = new Set(fs.readdirSync(path.join(process.cwd(), "content/publication-approvals")).map((f) => f.replace(/\.json$/, "")));
    for (const entry of ledger.entries) {
      expect(approvals.has(entry.questionId), entry.questionId).toBe(false);
      const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), entry.preservedPath), "utf8"));
      expect(manifest.humanApproval).toBeUndefined();
      expect(manifest.approvedBy).toBeUndefined();
    }
  });

  it("keeps the runtime id list in step with the ledger", () => {
    expect([...legacyQuarantinedIds].sort()).toEqual(ledger.entries.map((e) => e.questionId).sort());
  });

  it("cannot leak through assembly or any learner-facing pool", () => {
    const quarantined = new Set(ledger.entries.map((e) => e.questionId));
    expect(factoryPublishedQuestions.filter((q) => quarantined.has(q.id))).toEqual([]);
    expect(publishedExamBank.filter((q) => quarantined.has(q.id))).toEqual([]);
    expect(practiceExamBank.filter((q) => quarantined.has(q.id))).toEqual([]);
    const active = new Set(fs.readdirSync(activeDir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")));
    for (const entry of ledger.entries) expect(active.has(entry.candidateId)).toBe(false);
  });

  it("assembles exactly the active manifests: every one approved, none skipped", () => {
    const active = fs.readdirSync(activeDir).filter((f) => f.endsWith(".json"));
    expect(factoryPublishedQuestions).toHaveLength(active.length);
    expect(factoryPublishedQuestions.length).toBeGreaterThan(0);
  });
});
