import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import { practiceExamBank, practiceQuestions, publishedExamBank } from "@/content/questions/practice-bank";

/**
 * Runtime-quarantine finalisation (2026-08-31, on top of commit bbfcfd12).
 *
 * The 195 Grade 5 seeds bbfcfd12 introduced were never deleted — 191 are
 * preserved verbatim in g5-retired-seed-archive.json (non-runtime; nothing
 * imports it into a served bank) and all 195 are tracked with their
 * disposition in g5-runtime-quarantine-inventory.json. This suite proves
 * none of the 195 ORIGINAL ids are learner-reachable any more, that the 4
 * migrated questions are reachable exactly once each under their NEW
 * man-* id, and that unrelated pre-existing seeds were left untouched.
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
  it("the inventory itself accounts for exactly 195 entries: 4 migrated, 190 quarantined, 1 rejected", () => {
    expect(allEntries).toHaveLength(195);
    expect(migrated).toHaveLength(4);
    expect(quarantined).toHaveLength(190);
    expect(rejected).toHaveLength(1);
    // non-vacuous: fail loudly if the file were ever emptied by mistake
    expect(new Set(allEntries.map((e) => e.id)).size).toBe(195);
  });

  it("all 195 original Grade 5 seed ids are absent from practiceQuestions", () => {
    const ids = new Set(practiceQuestions.map((q) => q.id));
    const leaked = allEntries.filter((e) => ids.has(e.id));
    expect(leaked).toEqual([]);
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

  it("the 4 migrated factory ids are present in factoryPublishedQuestions", () => {
    const ids = new Set(factoryPublishedQuestions.map((q) => q.id));
    for (const entry of migrated) {
      expect(entry.newId, entry.id).toBeDefined();
      expect(ids.has(entry.newId as string), `${entry.id} -> ${entry.newId}`).toBe(true);
    }
  });

  it("the 4 migrated factory ids are present in publishedExamBank", () => {
    const ids = new Set(publishedExamBank.map((q) => q.id));
    for (const entry of migrated) {
      expect(ids.has(entry.newId as string), `${entry.id} -> ${entry.newId}`).toBe(true);
    }
  });

  it("the 4 migrated factory ids are present EXACTLY ONCE each in practiceExamBank (no duplicate migrated content)", () => {
    for (const entry of migrated) {
      const count = practiceExamBank.filter((q) => q.id === entry.newId).length;
      expect(count, `${entry.id} -> ${entry.newId}`).toBe(1);
    }
  });

  it("the 190 quarantined original ids are learner-served zero times, across every bank", () => {
    for (const entry of quarantined) {
      const inPractice = practiceQuestions.some((q) => q.id === entry.id);
      const inPracticeExam = practiceExamBank.some((q) => q.id === entry.id);
      const inPublished = publishedExamBank.some((q) => q.id === entry.id);
      expect(inPractice || inPracticeExam || inPublished, entry.id).toBe(false);
    }
  });

  it("the 1 rejected original id is learner-served zero times, across every bank", () => {
    for (const entry of rejected) {
      const inPractice = practiceQuestions.some((q) => q.id === entry.id);
      const inPracticeExam = practiceExamBank.some((q) => q.id === entry.id);
      const inPublished = publishedExamBank.some((q) => q.id === entry.id);
      expect(inPractice || inPracticeExam || inPublished, entry.id).toBe(false);
    }
  });

  it("no old->new migrated pair is reachable under BOTH ids at once (no duplicate runtime content)", () => {
    for (const entry of migrated) {
      const oldReachable =
        practiceQuestions.some((q) => q.id === entry.id) ||
        practiceExamBank.some((q) => q.id === entry.id) ||
        publishedExamBank.some((q) => q.id === entry.id);
      const newReachable = practiceExamBank.some((q) => q.id === entry.newId);
      expect(oldReachable, `old id ${entry.id} must not be reachable`).toBe(false);
      expect(newReachable, `new id ${entry.newId} must be reachable`).toBe(true);
    }
  });

  it("the retired seed archive preserves all 191 non-migrated questions verbatim, and none of them are runtime-imported", () => {
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
    const expectedIds = new Set([...quarantined, ...rejected].map((e) => e.id));
    expect(archivedIds).toEqual(expectedIds);
    // Content integrity, not just id presence: every archived row still has its stem and key.
    for (const q of archive.questions) {
      expect(q.prompt, q.id).toBeTruthy();
      expect(q.answerKey, q.id).toBeTruthy();
    }
  });

  it("an unrelated, pre-existing (non-Grade-5-seed) practice question remains available exactly as before", () => {
    // gen-num-add-00001 is a Grade 3 seed from the original 1298-item generator run,
    // untouched by this correction — must still be reachable and unique.
    const id = "gen-num-add-00001";
    expect(practiceQuestions.filter((q) => q.id === id)).toHaveLength(1);
    expect(practiceExamBank.filter((q) => q.id === id)).toHaveLength(1);
  });

  it("practiceQuestions shrank by exactly 195 from the pre-correction 1298-item pool, and every other bank composition arithmetic still holds", () => {
    expect(practiceQuestions.length).toBe(1298 - 195);
    // practiceExamBank = questionBank(1005 curated) + practiceQuestions + factoryPublishedQuestions
    expect(practiceExamBank.length).toBe(1005 + practiceQuestions.length + factoryPublishedQuestions.length);
    // publishedExamBank = questionBank(1005 curated) + factoryPublishedQuestions — never included the seed pool
    expect(publishedExamBank.length).toBe(1005 + factoryPublishedQuestions.length);
  });
});
