import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import {
  answerPositionDistribution,
  assertAnswerPositionQuality,
  assertNoMojibake,
  discoverDraftFiles,
  hasLongRepeatingAnswerCycle,
} from "../../../scripts/validate-roadmap-drafts.mjs";

function questionsFor(positions: string[]): CandidateQuestion[] {
  return positions.map((position, index) => ({
    id: `position-test-${index}`,
    type: "multiple_choice",
    options: ["a", "b", "c", "d"].map(id => ({ id, text: id.toUpperCase() })),
    answerKey: { kind: "single_option", optionId: position },
  })) as unknown as CandidateQuestion[];
}

describe("roadmap draft answer positions", () => {
  it("reports displayed answer positions", () => {
    expect(answerPositionDistribution(questionsFor(["a", "b", "b", "d"]))).toEqual({ a: 1, b: 2, d: 1 });
  });

  it("accepts a balanced non-cyclic sequence", () => {
    const positions = ["a", "c", "b", "d", "b", "a", "d", "c", "a", "d", "c", "b"];
    expect(assertAnswerPositionQuality("balanced.json", questionsFor(positions))).toEqual({ a: 3, c: 3, b: 3, d: 3 });
  });

  it("rejects a position used more than 35 percent of the time", () => {
    const positions = ["a", "a", "a", "a", "b", "c", "d", "b", "c", "d"];
    expect(() => assertAnswerPositionQuality("skewed.json", questionsFor(positions))).toThrow(/exceeds 35%/);
  });

  it("rejects a file whose answers are all in one position", () => {
    expect(() => assertAnswerPositionQuality("all-a.json", questionsFor(Array(20).fill("a")))).toThrow(/exceeds 35%/);
  });

  it("rejects a long repeating cycle", () => {
    expect(hasLongRepeatingAnswerCycle(["a", "b", "a", "b", "a", "b", "a", "b"])).toBe(true);
    expect(() => assertAnswerPositionQuality(
      "cyclic.json",
      questionsFor(["a", "b", "a", "b", "a", "b", "a", "b", "c", "d", "c", "d"]),
    )).toThrow(/repeating cycle/);
  });

  it.each(["\u00C3", "\u00C2", "\uFFFD"])("rejects encoding marker %s in nested strings and property names", marker => {
    expect(() => assertNoMojibake({ questions: [{ prompt: marker }] }, "broken.json")).toThrow(/mojibake/);
    expect(() => assertNoMojibake({ [marker]: "value" }, "broken.json")).toThrow(/mojibake/);
  });

  it("accepts the intended mathematical and accented characters", () => {
    expect(() => assertNoMojibake({ prompt: "90° × 2 ÷ 3; café" }, "clean.json")).not.toThrow();
  });

  it("discovers an unfamiliar draft filename and rejects its all-one-letter reading answers", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mindmosaic-draft-validation-"));
    try {
      const questions = questionsFor(Array(20).fill("a")).map(question => ({ ...question, type: "reading_comprehension" }));
      await writeFile(path.join(root, "new-programme-draft.json"), JSON.stringify({ questions }), "utf8");
      const files = await discoverDraftFiles(root);
      expect(files).toEqual(["new-programme-draft.json"]);
      const packet = JSON.parse(await readFile(path.join(root, files[0]), "utf8"));
      expect(() => assertAnswerPositionQuality(files[0], packet.questions)).toThrow(/exceeds 35%/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("checks encoding and answer positions in every discovered draft packet", async () => {
    for (const file of await discoverDraftFiles()) {
      const bytes = await readFile(path.join("content/roadmap-drafts", file));
      expect(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), file).toBe(false);
      const packet = JSON.parse(bytes.toString("utf8"));
      expect(() => assertNoMojibake(packet, file)).not.toThrow();
      if (packet.questions.some((question: CandidateQuestion) => question.type === "multiple_choice" || question.type === "reading_comprehension")) {
        expect(() => assertAnswerPositionQuality(file, packet.questions)).not.toThrow();
      }
    }
  });
});
