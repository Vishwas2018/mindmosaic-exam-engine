import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { writingDraftPacketSchema } from "@/features/writing/draft";
import { WRITING_FORMS } from "@/features/writing/task";

const ROOT = process.cwd();
const DRAFTS = path.join(ROOT, "content", "writing-drafts", "year6-written-expression-draft.json");
/* A path to the drafts inside a string literal (an import, a readFile). Prose in comments does not count. */
const QUOTED_REFERENCE = new RegExp("[\"'`][^\"'`\\n]*writing-drafts[^\"'`\\n]*[\"'`]");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mts)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("Year 6 writing prompt drafts", () => {
  const packet = writingDraftPacketSchema.parse(JSON.parse(fs.readFileSync(DRAFTS, "utf8")));

  it("are ten prompts, two of each form, each sized for 15 minutes", () => {
    expect(packet.prompts).toHaveLength(10);
    for (const form of WRITING_FORMS) {
      expect(packet.prompts.filter((prompt) => prompt.form === form), form).toHaveLength(2);
    }
    expect(new Set(packet.prompts.map((prompt) => prompt.timeLimitMinutes))).toEqual(new Set([15]));
    expect(new Set(packet.prompts.map((prompt) => prompt.id)).size).toBe(10);
  });

  it("are unsigned: no review, no approval, flagged as drafts", () => {
    expect(packet.draftOnly).toBe(true);
    for (const prompt of packet.prompts) {
      expect(prompt.review).toBeNull();
      expect(prompt.approvedBy).toBeNull();
    }
  });

  it("carry no answer or marking guidance, only the task", () => {
    const raw = fs.readFileSync(DRAFTS, "utf8").toLowerCase();
    expect(raw).not.toMatch(/model answer|sample answer|exemplar|answerkey|mark scheme/);
  });

  it("use Australian spelling", () => {
    const prose = packet.prompts.map((prompt) => `${prompt.title} ${prompt.prompt}`).join(" ");
    expect(prose).not.toMatch(/\b(color|neighbor|favorite|organize|center|realize)\w*\b/i);
  });

  it("are not reachable: nothing under src imports content/writing-drafts and no task is published", () => {
    const offenders = walk(path.join(ROOT, "src"))
      .filter((file) => !file.includes(`${path.sep}tests${path.sep}`))
      .filter((file) => QUOTED_REFERENCE.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file));
    expect(offenders).toEqual([]);
  });
});

describe("no AI marks or comments on children's writing (docs/design.md section 29)", () => {
  it("the writing feature depends on no AI provider and sends nothing to one", () => {
    const files = [
      ...walk(path.join(ROOT, "src", "features", "writing")),
      ...walk(path.join(ROOT, "src", "server", "writing")),
      ...walk(path.join(ROOT, "src", "app", "api", "writing")),
    ];
    expect(files.length).toBeGreaterThan(5);
    const providers = /@anthropic-ai|anthropic\.com|openai|@ai-sdk|generativelanguage|claude-(opus|sonnet|haiku|fable)|gpt-\d|gemini/i;
    const offenders = files.filter((file) => providers.test(fs.readFileSync(file, "utf8"))).map((file) => path.relative(ROOT, file));
    expect(offenders).toEqual([]);
  });
});

describe("writing stays out of the numeracy and reading results", () => {
  it("no results, parent-dashboard, student or scoring module reads the writing tables", () => {
    const roots = [
      path.join(ROOT, "src", "app", "results"),
      path.join(ROOT, "src", "features", "parent-dashboard"),
      path.join(ROOT, "src", "features", "student"),
      path.join(ROOT, "src", "features", "exam-engine", "scoring"),
      path.join(ROOT, "src", "server", "assessment"),
    ];
    const offenders = roots
      .filter((dir) => fs.existsSync(dir))
      .flatMap((dir) => walk(dir))
      .filter((file) => /writing_(attempts|marks|mark_criteria)/.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(ROOT, file));
    expect(offenders).toEqual([]);
  });
});
