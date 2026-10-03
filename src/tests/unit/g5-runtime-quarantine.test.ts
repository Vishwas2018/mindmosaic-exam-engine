import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import { practiceExamBank, publishedExamBank } from "@/content/questions/practice-bank";

/**
 * Runtime-quarantine finalisation (2026-08-31, on top of commit bbfcfd12).
 *
 * The 195 Grade 5 seeds bbfcfd12 introduced were never deleted — 191 are
 * preserved verbatim in g5-retired-seed-archive.json (non-runtime; nothing
 * imports it into a served bank) and all 195 are tracked with their
 * disposition in g5-runtime-quarantine-inventory.json. This suite proves
 * none of the 195 ORIGINAL ids are learner-reachable any more, that the 4
 * migrated questions are reachable exactly once each under their NEW
 * man-* id, and that bank composition arithmetic holds now that unreviewed
 * practice seeds have been deleted.
 */

interface InventoryEntry {
  readonly id: string;
  readonly status: "factory_published_migrated" | "quarantined_pending_review" | "rejected";
  readonly newId?: string;
}

const inventoryPath = path.join(
  process.cwd(),
  "content/curriculum-imports/g5-runtime-quarantine-inventory.json",
);
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8")) as {
  entries: readonly InventoryEntry[];
};

const allEntries = inventory.entries;
const migrated = allEntries.filter((e) => e.status === "factory_published_migrated");
const quarantined = allEntries.filter((e) => e.status === "quarantined_pending_review");
const rejected = allEntries.filter((e) => e.status === "rejected");

describe("g5 runtime quarantine finalisation", () => {
  it("the inventory itself accounts for exactly 195 entries: 194 migrated, 0 quarantined, 1 rejected", () => {
    expect(allEntries).toHaveLength(195);
    expect(migrated).toHaveLength(194);
    expect(quarantined).toHaveLength(0);
    expect(rejected).toHaveLength(1);
    // non-vacuous: fail loudly if the file were ever emptied by mistake
    expect(new Set(allEntries.map((e) => e.id)).size).toBe(195);
  });

  it("the ungated seed bank file no longer exists on disk", () => {
    const seedFile = path.resolve(process.cwd(), "src/content/questions/generated/generated-questions.ts");
    expect(fs.existsSync(seedFile)).toBe(false);
  });

  it("all 195 original Grade 5 seed ids are absent from practiceExamBank", () => {
    const ids = new Set(practiceExamBank.map((q) => q.id));
    const leaked = allEntries.filter((e) => ids.has(e.id));
    expect(leaked).toEqual([]);
  });

  it("all 195 original Grade 5 seed ids are absent from publishedExamBank", () => {
    const ids = new Set(publishedExamBank.map((q) => q.id));
    const leaked = allEntries.filter((e) => ids.has(e.id));
    expect(leaked).toEqual([]);
  });

  it("the 194 migrated factory ids are present in factoryPublishedQuestions", () => {
    const ids = new Set(factoryPublishedQuestions.map((q) => q.id));
    for (const entry of migrated) {
      expect(entry.newId, entry.id).toBeDefined();
      expect(ids.has(entry.newId as string), `${entry.id} -> ${entry.newId}`).toBe(true);
    }
  });

  it("the 194 migrated factory ids are present in publishedExamBank", () => {
    const ids = new Set(publishedExamBank.map((q) => q.id));
    for (const entry of migrated) {
      expect(ids.has(entry.newId as string), `${entry.id} -> ${entry.newId}`).toBe(true);
    }
  });

  it("the 194 migrated factory ids are present EXACTLY ONCE each in practiceExamBank (no duplicate migrated content)", () => {
    for (const entry of migrated) {
      const count = practiceExamBank.filter((q) => q.id === entry.newId).length;
      expect(count, `${entry.id} -> ${entry.newId}`).toBe(1);
    }
  });

  it("the 0 quarantined original ids are learner-served zero times, across every bank", () => {
    for (const entry of quarantined) {
      const inPracticeExam = practiceExamBank.some((q) => q.id === entry.id);
      const inPublished = publishedExamBank.some((q) => q.id === entry.id);
      expect(inPracticeExam || inPublished, entry.id).toBe(false);
    }
  });

  it("the 1 rejected original id is learner-served zero times, across every bank", () => {
    for (const entry of rejected) {
      const inPracticeExam = practiceExamBank.some((q) => q.id === entry.id);
      const inPublished = publishedExamBank.some((q) => q.id === entry.id);
      expect(inPracticeExam || inPublished, entry.id).toBe(false);
    }
  });

  it("no old->new migrated pair is reachable under BOTH ids at once (no duplicate runtime content)", () => {
    for (const entry of migrated) {
      const oldReachable =
        practiceExamBank.some((q) => q.id === entry.id) ||
        publishedExamBank.some((q) => q.id === entry.id);
      const newReachable = practiceExamBank.some((q) => q.id === entry.newId);
      expect(oldReachable, `old id ${entry.id} must not be reachable`).toBe(false);
      expect(newReachable, `new id ${entry.newId} must be reachable`).toBe(true);
    }
  });

  it("the retired seed archive preserves all 191 retired questions verbatim, and none of them are runtime-imported", () => {
    const archivePath = path.join(
      process.cwd(),
      "content/curriculum-imports/g5-retired-seed-archive.json",
    );
    const archive = JSON.parse(fs.readFileSync(archivePath, "utf8")) as {
      count: number;
      questions: readonly { id: string; prompt?: string; answerKey?: unknown }[];
    };
    expect(archive.count).toBe(191);
    expect(archive.questions).toHaveLength(191);
    const archivedIds = new Set(archive.questions.map((q) => q.id));
    expect(archivedIds.size).toBe(191);
    // Content integrity, not just id presence: every archived row still has its stem and key.
    for (const q of archive.questions) {
      expect(q.prompt, q.id).toBeTruthy();
      expect(q.answerKey, q.id).toBeTruthy();
    }
  });

  it("unreviewed practice seeds (including gen-num-add-00001) are no longer served in any bank", () => {
    const id = "gen-num-add-00001";
    expect(practiceExamBank.some((q) => q.id === id)).toBe(false);
    expect(publishedExamBank.some((q) => q.id === id)).toBe(false);
  });

  it("bank composition arithmetic holds with seeds deleted", () => {
    // publishedExamBank = questionBank(1005 curated) + factoryPublishedQuestions — never included the seed pool
    expect(publishedExamBank.length).toBe(1005 + factoryPublishedQuestions.length);
    // practiceExamBank aliases publishedExamBank (seeds deleted)
    expect(practiceExamBank.length).toBe(publishedExamBank.length);
  });
});
