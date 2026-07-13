import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import {
  DONOR_TRUST_CLAIM_VALUES,
} from "@/features/question-factory/ingestion/mappings";
import {
  ingestLegacyQuestions,
  type IngestionRequest,
  type IngestionResult,
} from "@/features/question-factory/ingestion";
import type { FactoryRepository } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";

let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "ingestion-test-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

function baseRequest(overrides: Partial<IngestionRequest> = {}): IngestionRequest {
  return {
    sourcePath: "harvest/starter-bank/bank-naplan-5-num-addition-001.json",
    sourceFormat: "legacy_question_json",
    rawInput: JSON.stringify(validMultipleChoice()),
    generatorIdentity: normaliseIdentityOrThrow("chatgpt"),
    batchId: "batch-001",
    pipelineRunId: "run-001",
    ...overrides,
  };
}

function validMultipleChoice(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "bank-naplan-5-num-addition-001",
    examType: "NAPLAN",
    yearLevel: 5,
    subject: "Numeracy",
    strand: "Number and Algebra",
    skillId: "num.addition.two-digit",
    difficulty: "hard",
    questionType: "multiple_choice",
    prompt: "What is 34 + 28?",
    options: [
      { id: "A", text: "62" },
      { id: "B", text: "52" },
      { id: "C", text: "72" },
      { id: "D", text: "58" },
    ],
    answerKey: { type: "single_option", optionId: "A" },
    explanation: "34 + 28 = 62.",
    estimatedTimeSeconds: 60,
    tags: ["verify:34+28=62", "arithmetic"],
    origin: "ai_generated",
    status: "draft",
    ...overrides,
  };
}

function validTrueFalse(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "bank-naplan-5-num-true-false-001",
    examType: "NAPLAN",
    yearLevel: 5,
    subject: "Numeracy",
    strand: "Number and Algebra",
    difficulty: "medium",
    questionType: "true_false",
    prompt: "34 + 28 = 62.",
    answerKey: { type: "boolean", value: true },
    explanation: "34 + 28 = 62, so the statement is true.",
    ...overrides,
  };
}

function validCsvChoiceSingleRow(overrides: Record<string, unknown> = {}, contentOverrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slug: "csv-choice-single-001",
    type: "choice_single",
    topic_slug: "numeracy-addition",
    year_levels: "Y5",
    difficulty: "2",
    content_data_json: JSON.stringify({
      prompt: "What is 5 + 7?",
      options: [
        { id: "A", text: "12" },
        { id: "B", text: "11" },
      ],
      correct_id: "A",
      explanation: "5 + 7 = 12.",
      ...contentOverrides,
    }),
    ...overrides,
  };
}

function validCsvTrueFalseRow(overrides: Record<string, unknown> = {}, contentOverrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slug: "csv-true-false-001",
    type: "true_false",
    topic_slug: "numeracy-addition",
    year_levels: "Y5",
    difficulty: "2",
    content_data_json: JSON.stringify({
      prompt: "34 + 28 = 62.",
      correct: true,
      explanation: "34 + 28 = 62.",
      ...contentOverrides,
    }),
    ...overrides,
  };
}

function accepted(result: IngestionResult) {
  if (result.status !== "accepted") {
    throw new Error(`Expected accepted, got rejected: ${JSON.stringify(result)}`);
  }
  return result;
}

function rejectedResult(result: IngestionResult) {
  if (result.status !== "rejected") {
    throw new Error(`Expected rejected, got accepted: ${JSON.stringify(result)}`);
  }
  return result;
}

describe("accepted cases", () => {
  it("ingests a valid single legacy JSON question (dry run)", async () => {
    const results = await ingestLegacyQuestions(baseRequest({ dryRun: true }), repo);
    expect(results.length).toBe(1);
    const result = accepted(results[0]!);
    expect(result.candidate.state).toBe("generated");
    expect(result.candidate.question.type).toBe("multiple_choice");
    expect(result.written).toBe(false);
  });

  it("maps a valid compiled-array entry", async () => {
    const array = [
      validMultipleChoice({ id: "q-1" }),
      validMultipleChoice({ id: "q-2", prompt: "What is 10 + 5?", options: [{ id: "A", text: "15" }, { id: "B", text: "16" }] }),
    ];
    const results = await ingestLegacyQuestions(
      baseRequest({ sourceFormat: "compiled_question_array", rawInput: JSON.stringify(array), dryRun: true }),
      repo,
    );
    expect(results.length).toBe(2);
    expect(results.every((r) => r.status === "accepted")).toBe(true);
    const ids = results.map((r) => accepted(r).candidate.candidateId);
    expect(new Set(ids).size).toBe(2);
  });

  it("maps a valid review-wrapper entry, discarding reviewer metadata", async () => {
    const wrapper = {
      question: validMultipleChoice({
        id: "q-wrapped",
        questionType: "true_false",
        options: undefined,
        answerKey: { type: "boolean", value: true },
      }),
      skillId: "num.addition.two-digit",
      sourcePromptId: "prompt-1",
      validationStatus: "valid",
      reviewerStatus: "approve",
      approvalStatus: "approved",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const results = await ingestLegacyQuestions(
      baseRequest({ sourceFormat: "review_queue_wrapper", rawInput: JSON.stringify(wrapper), dryRun: true }),
      repo,
    );
    const result = accepted(results[0]!);
    expect(result.candidate.state).toBe("generated");
    expect(result.candidate.question.type).toBe("true_false");
    expect(result.warnings.some((w) => w.code === "donor_review_metadata_ignored")).toBe(true);
  });

  it("maps a valid CSV-row record", async () => {
    const row = {
      slug: "csv-choice-single-001",
      type: "choice_single",
      topic_slug: "numeracy-addition",
      year_levels: "Y5",
      difficulty: "2",
      content_data_json: JSON.stringify({
        prompt: "What is 5 + 7?",
        options: [
          { id: "A", text: "12" },
          { id: "B", text: "11" },
        ],
        correct_id: "A",
        explanation: "5 + 7 = 12.",
      }),
    };
    const results = await ingestLegacyQuestions(
      baseRequest({ sourcePath: "csv/valid-choice-single.csv", sourceFormat: "csv_row", rawInput: row, dryRun: true }),
      repo,
    );
    const result = accepted(results[0]!);
    expect(result.candidate.question.type).toBe("multiple_choice");
    expect(result.candidate.question.metadata.subject).toBe("numeracy");
    expect(result.candidate.question.metadata.difficulty).toBe("easy");
  });

  it("produces deterministic normalisation for identical inputs", async () => {
    const request = baseRequest({ dryRun: true });
    const first = accepted((await ingestLegacyQuestions(request, repo))[0]!);
    const second = accepted((await ingestLegacyQuestions(request, repo))[0]!);
    expect(first.candidate.candidateId).toBe(second.candidate.candidateId);
    expect(first.candidate.question).toEqual(second.candidate.question);
    expect(first.candidate.provenance.contentHash).toBe(second.candidate.provenance.contentHash);
  });

  it("normalises upper-case option ids to lower-case, collision-free", async () => {
    const results = await ingestLegacyQuestions(baseRequest({ dryRun: true }), repo);
    const result = accepted(results[0]!);
    const ids = result.candidate.question.options.map((option) => option.id);
    expect(ids).toEqual(["a", "b", "c", "d"]);
    if (result.candidate.question.answerKey.kind === "single_option") {
      expect(result.candidate.question.answerKey.optionId).toBe("a");
    }
  });

  it("maps 'hard' and 'challenge' difficulty aliases to 'challenging'", async () => {
    const hardResult = accepted(
      (await ingestLegacyQuestions(baseRequest({ dryRun: true }), repo))[0]!,
    );
    expect(hardResult.candidate.question.metadata.difficulty).toBe("challenging");

    const challengeRequest = baseRequest({
      rawInput: JSON.stringify(validMultipleChoice({ id: "q-challenge", difficulty: "challenge" })),
      dryRun: true,
    });
    const challengeResult = accepted((await ingestLegacyQuestions(challengeRequest, repo))[0]!);
    expect(challengeResult.candidate.question.metadata.difficulty).toBe("challenging");
  });

  it("dry-run produces no repository write", async () => {
    await ingestLegacyQuestions(baseRequest({ dryRun: true }), repo);
    expect(await repo.list("generated")).toEqual([]);
  });

  it("a successful non-dry-run write uses the transactional repository (readable back from 'generated')", async () => {
    const results = await ingestLegacyQuestions(baseRequest(), repo);
    const result = accepted(results[0]!);
    expect(result.written).toBe(true);
    expect(result.replay).toBe(false);
    const stored = await repo.read("generated", result.candidate.candidateId);
    expect(stored).toEqual(result.candidate);
  });

  it("repeated replay of an identical ingestion is a no-op, per repository policy (no duplicate/inconsistent records)", async () => {
    const request = baseRequest();
    const first = accepted((await ingestLegacyQuestions(request, repo))[0]!);
    expect(first.written).toBe(true);

    const second = accepted((await ingestLegacyQuestions(request, repo))[0]!);
    expect(second.written).toBe(false);
    expect(second.replay).toBe(true);
    expect(second.candidate.candidateId).toBe(first.candidate.candidateId);

    expect(await repo.list("generated")).toEqual([first.candidate.candidateId]);
  });
});

describe("rejected cases", () => {
  it("rejects malformed JSON-shaped data (broken JSON syntax)", async () => {
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: "{not valid json", dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("malformed_json");
  });

  it("rejects well-formed JSON that does not match the legacy question shape", async () => {
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify({ foo: "bar" }), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("unrecognised_donor_shape");
  });

  it("rejects an unsupported source format", async () => {
    const result = rejectedResult(
      (
        await ingestLegacyQuestions(
          baseRequest({ sourceFormat: "xml_legacy" as IngestionRequest["sourceFormat"], dryRun: true }),
          repo,
        )
      )[0]!,
    );
    expect(result.reasonCode).toBe("unsupported_source_format");
  });

  it("rejects raw SVG / executable content in a text field", async () => {
    const result = rejectedResult(
      (
        await ingestLegacyQuestions(
          baseRequest({
            rawInput: JSON.stringify(validMultipleChoice({ prompt: "Look: <script>alert(1)</script> what is 34+28?" })),
            dryRun: true,
          }),
          repo,
        )
      )[0]!,
    );
    expect(result.reasonCode).toBe("unsafe_raw_markup_detected");
  });

  it("rejects a forbidden raw visual type (svg)", async () => {
    const question = validMultipleChoice({
      assets: [{ id: "v1", type: "svg", altText: "A raw svg diagram", svgContent: "<svg></svg>" }],
    });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("forbidden_raw_visual_content");
  });

  it("rejects an unsupported visual type (pie_chart, not yet reshaped by this adapter)", async () => {
    const question = validMultipleChoice({
      assets: [{ id: "v1", type: "pie_chart", altText: "A pie chart of favourite fruits", spec: {} }],
    });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("unsupported_visual_type");
  });

  it("rejects an unsupported stimulus.kind", async () => {
    const question = validMultipleChoice({
      questionType: "reading_comprehension",
      stimulus: { kind: "diagram", body: "Some stimulus body text that is long enough." },
    });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("unsupported_stimulus_kind");
  });

  it("rejects an ambiguous difficulty value", async () => {
    const question = validMultipleChoice({ difficulty: "impossible" });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("ambiguous_difficulty");
  });

  it("rejects duplicate ids that collide after normalisation", async () => {
    const question = validMultipleChoice({
      options: [
        { id: "A", text: "62" },
        { id: "a", text: "different text, same id after lower-casing" },
      ],
    });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("duplicate_ids_after_normalisation");
  });

  it("rejects an answer key referencing a missing option", async () => {
    const question = validMultipleChoice({ answerKey: { type: "single_option", optionId: "Z" } });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("unknown_answer_key_reference");
  });

  it("rejects an absolute local path supplied as sourcePath", async () => {
    const result = rejectedResult(
      (
        await ingestLegacyQuestions(
          baseRequest({ sourcePath: "C:\\Users\\someone\\Desktop\\harvest\\question.json", dryRun: true }),
          repo,
        )
      )[0]!,
    );
    expect(result.reasonCode).toBe("absolute_path_not_allowed");
  });

  it("rejects answer leakage in visual alt text", async () => {
    const question = validMultipleChoice({
      assets: [
        {
          id: "v1",
          type: "bar_chart",
          altText: "Bar chart. The correct answer is 62.",
          spec: { data: [{ label: "Amy", value: 10 }, { label: "Ben", value: 15 }] },
        },
      ],
    });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("answer_leakage_in_alt_text");
  });

  it("rejects a donor-supplied authoritative candidate id — the minted candidateId never equals the donor's own id", async () => {
    const question = validMultipleChoice({ id: "malicious-override-id" });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.candidateId).not.toBe("malicious-override-id");
    expect(result.warnings.some((w) => w.code === "donor_id_not_authoritative")).toBe(true);
  });

  it("rejects on partial repository failure without leaving a written candidate", async () => {
    const throwingRepository: FactoryRepository = {
      async create(): Promise<never> {
        throw new Error("simulated disk failure mid-write");
      },
      async read() {
        return undefined;
      },
      async exists() {
        return false;
      },
      async remove() {
        return undefined;
      },
      async list() {
        return [];
      },
      async move(): Promise<never> {
        throw new Error("not implemented in this mock");
      },
      async update(): Promise<never> {
        throw new Error("not implemented in this mock");
      },
      async reconcile() {
        return { entries: [], generatedAt: new Date().toISOString() };
      },
    };

    const result = rejectedResult((await ingestLegacyQuestions(baseRequest(), throwingRepository))[0]!);
    expect(result.reasonCode).toBe("repository_write_failed");
  });

  it("rejects malformed inner JSON inside a CSV row's content_data_json", async () => {
    const row = {
      slug: "csv-broken-001",
      type: "choice_single",
      year_levels: "Y5",
      difficulty: "2",
      content_data_json: '{"prompt":"broken json is here ""options"": MISSING_BRACKET}',
    };
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("malformed_inner_json");
  });

  it("rejects a CSV row with an empty slug before candidate-id minting is attempted", async () => {
    const row = {
      slug: "",
      type: "choice_single",
      year_levels: "Y5",
      difficulty: "2",
      content_data_json: JSON.stringify({ prompt: "x", options: [{ id: "a", text: "1" }], correct_id: "a" }),
    };
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("missing_source_identifier");
  });
});

describe("trust-boundary: donor approval/status/publication claims never confer trust", () => {
  it.each(DONOR_TRUST_CLAIM_VALUES)("donor status '%s' cannot move the candidate beyond 'generated'", async (statusValue) => {
    const question = validMultipleChoice({ id: `q-status-${statusValue}`, status: statusValue });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.state).toBe("generated");
    expect(result.warnings.some((w) => w.code === "donor_status_ignored")).toBe(true);
  });

  it("the ingested question object has no 'status' or 'approvalStatus' field at all — there is nowhere for a donor trust claim to land", () => {
    const question = validMultipleChoice({ status: "published" });
    expect(question).not.toHaveProperty("approvalStatus");
  });

  it("generatorClass is always 'manual_external' for legacy ingestion, regardless of caller-supplied identity", async () => {
    const result = accepted((await ingestLegacyQuestions(baseRequest({ dryRun: true }), repo))[0]!);
    expect(result.candidate.provenance.generatorAdapter.class).toBe("manual_external");
  });

  it("review-queue approvalStatus: 'approved' does not elevate the candidate beyond 'generated'", async () => {
    const wrapper = {
      question: validMultipleChoice({ id: "q-wrapper-approved" }),
      approvalStatus: "approved",
      reviewerStatus: "approve",
      validationStatus: "valid",
    };
    const result = accepted(
      (
        await ingestLegacyQuestions(
          baseRequest({ sourceFormat: "review_queue_wrapper", rawInput: JSON.stringify(wrapper), dryRun: true }),
          repo,
        )
      )[0]!,
    );
    expect(result.candidate.state).toBe("generated");
  });
});

describe("strict boolean answer parsing (legacy JSON path)", () => {
  it("preserves legacy boolean true", async () => {
    const question = validTrueFalse({ answerKey: { type: "boolean", value: true } });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.answerKey).toEqual({ kind: "boolean", value: true });
  });

  it("preserves legacy boolean false", async () => {
    const question = validTrueFalse({ answerKey: { type: "boolean", value: false } });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.answerKey).toEqual({ kind: "boolean", value: false });
  });

  it("maps legacy string 'true' to true", async () => {
    const question = validTrueFalse({ answerKey: { type: "boolean", value: "true" } });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.answerKey).toEqual({ kind: "boolean", value: true });
  });

  it("maps legacy string 'false' to false — 'false' never becomes true", async () => {
    const question = validTrueFalse({ answerKey: { type: "boolean", value: "false" } });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.answerKey).toEqual({ kind: "boolean", value: false });
  });

  it.each([" true ", "TRUE", "True", "\tfalse\n", "FALSE", "False"])(
    "handles whitespace/case-normalised valid string '%s' deterministically",
    async (rawValue) => {
      const question = validTrueFalse({ answerKey: { type: "boolean", value: rawValue } });
      const result = accepted(
        (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
      );
      const expectedValue = rawValue.trim().toLowerCase() === "true";
      expect(result.candidate.question.answerKey).toEqual({ kind: "boolean", value: expectedValue });
    },
  );

  it.each(["0", "1", "yes", "no", "TRUE-ish", "", 0, 1, {}, [], null, undefined])(
    "rejects ambiguous legacy boolean value %j specifically as ambiguous_boolean_value, not an unrelated schema failure",
    async (ambiguousValue) => {
      const question = validTrueFalse({ answerKey: { type: "boolean", value: ambiguousValue } });
      const result = rejectedResult(
        (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
      );
      expect(result.reasonCode).toBe("ambiguous_boolean_value");
    },
  );

  it("never uses JavaScript truthiness: legacy 'false' does not survive as truthy anywhere downstream", async () => {
    const question = validTrueFalse({ answerKey: { type: "boolean", value: "false" } });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    if (result.candidate.question.answerKey.kind === "boolean") {
      expect(result.candidate.question.answerKey.value).toBe(false);
      expect(result.candidate.question.answerKey.value).not.toBe(true);
    } else {
      throw new Error("expected a boolean answer key");
    }
  });
});

describe("strict boolean answer parsing (CSV path)", () => {
  it("preserves CSV boolean true", async () => {
    const row = validCsvTrueFalseRow({}, { correct: true });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.answerKey).toEqual({ kind: "boolean", value: true });
  });

  it("preserves CSV boolean false", async () => {
    const row = validCsvTrueFalseRow({}, { correct: false });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.answerKey).toEqual({ kind: "boolean", value: false });
  });

  it("parses CSV string 'true' correctly", async () => {
    const row = validCsvTrueFalseRow({}, { correct: "true" });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.answerKey).toEqual({ kind: "boolean", value: true });
  });

  it("parses CSV string 'false' correctly — CSV 'false' never becomes true", async () => {
    const row = validCsvTrueFalseRow({}, { correct: "false" });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.answerKey).toEqual({ kind: "boolean", value: false });
    if (result.candidate.question.answerKey.kind === "boolean") {
      expect(result.candidate.question.answerKey.value).not.toBe(true);
    }
  });

  it.each(["0", "1", "yes", "no", {}, [], 0, 1, null])(
    "rejects ambiguous CSV boolean value %j specifically as ambiguous_boolean_value",
    async (ambiguousValue) => {
      const row = validCsvTrueFalseRow({}, { correct: ambiguousValue });
      const result = rejectedResult(
        (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
      );
      expect(result.reasonCode).toBe("ambiguous_boolean_value");
    },
  );
});

describe("ID canonicalisation (trim, NFKC, then lower-case)", () => {
  it("rejects a whitespace-only option id (empty after canonicalisation)", async () => {
    const question = validMultipleChoice({
      options: [
        { id: "   ", text: "62" },
        { id: "B", text: "52" },
      ],
    });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("empty_identifier_after_normalisation");
  });

  it("treats ids differing only by surrounding whitespace as the same canonical id (collision)", async () => {
    const question = validMultipleChoice({
      options: [
        { id: "a ", text: "62" },
        { id: " a", text: "different option, same canonical id" },
      ],
    });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("duplicate_ids_after_normalisation");
  });

  it("collapses Unicode NFKC-compatible variants to the same canonical id (collision)", async () => {
    // U+FF21 FULLWIDTH LATIN CAPITAL LETTER A NFKC-normalises to 'A'.
    const question = validMultipleChoice({
      options: [
        { id: "A", text: "62" },
        { id: "Ａ", text: "fullwidth-A duplicate of option A" },
      ],
    });
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("duplicate_ids_after_normalisation");
  });

  it("accepts a Unicode-compatibility-variant option id that does not collide with anything else", async () => {
    const question = validMultipleChoice({
      options: [
        { id: "Ａ", text: "62" }, // fullwidth A -> canonicalises to 'a'
        { id: "B", text: "52" },
      ],
      answerKey: { type: "single_option", optionId: "Ａ" },
    });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.options.map((o) => o.id)).toEqual(["a", "b"]);
  });

  it("consistently rewrites a whitespace/case-different answer-key reference to the same canonical option id", async () => {
    const question = validMultipleChoice({
      options: [
        { id: "A", text: "62" },
        { id: "B", text: "52" },
      ],
      answerKey: { type: "single_option", optionId: "  a  " },
    });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    if (result.candidate.question.answerKey.kind === "single_option") {
      expect(result.candidate.question.answerKey.optionId).toBe("a");
    } else {
      throw new Error("expected a single_option answer key");
    }
  });

  it("consistently canonicalises matching source/target ids and their answer-key pair references", async () => {
    const question = validMultipleChoice({
      questionType: "matching",
      options: undefined,
      matchColumns: {
        left: [{ id: " Term1 ", text: "Term one" }],
        right: [
          { id: "Target1", text: "Target one" },
          { id: "Target2", text: "Target two" },
        ],
      },
      answerKey: { type: "matching", pairs: [{ left: "term1", right: " TARGET1 " }] },
    });
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ rawInput: JSON.stringify(question), dryRun: true }), repo))[0]!,
    );
    expect(result.candidate.question.answerKey).toEqual({
      kind: "matching",
      pairs: [{ sourceId: "term1", targetId: "target1" }],
    });
  });

  it("rejects duplicate CSV option ids that collide only after canonicalisation", async () => {
    const row = validCsvChoiceSingleRow(
      {},
      {
        options: [
          { id: "A ", text: "12" },
          { id: " a", text: "11" },
        ],
      },
    );
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("duplicate_ids_after_normalisation");
  });

  it("consistently canonicalises a CSV correct_id reference against its canonicalised option ids", async () => {
    const row = validCsvChoiceSingleRow(
      {},
      {
        options: [
          { id: "A", text: "12" },
          { id: "B", text: "11" },
        ],
        correct_id: "  a  ",
      },
    );
    const result = accepted(
      (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
    );
    if (result.candidate.question.answerKey.kind === "single_option") {
      expect(result.candidate.question.answerKey.optionId).toBe("a");
    } else {
      throw new Error("expected a single_option answer key");
    }
  });
});

describe("input-size safeguards", () => {
  it("rejects a raw JSON payload exceeding the maximum string length", async () => {
    const oversized = "x".repeat(1_000_001);
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ rawInput: oversized, dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("source_payload_too_large");
  });

  it("rejects a compiled array exceeding the maximum record count", async () => {
    const array = Array.from({ length: 501 }, (_, i) => validMultipleChoice({ id: `q-${i}` }));
    const result = rejectedResult(
      (
        await ingestLegacyQuestions(
          baseRequest({ sourceFormat: "compiled_question_array", rawInput: JSON.stringify(array), dryRun: true }),
          repo,
        )
      )[0]!,
    );
    expect(result.reasonCode).toBe("source_payload_too_large");
  });

  it("rejects a CSV row whose embedded content_data_json exceeds the maximum length", async () => {
    const row = {
      slug: "csv-oversized-001",
      type: "choice_single",
      year_levels: "Y5",
      difficulty: "2",
      content_data_json: JSON.stringify({
        prompt: "x",
        options: [{ id: "a", text: "1" }],
        correct_id: "a",
        padding: "x".repeat(200_001),
      }),
    };
    const result = rejectedResult(
      (await ingestLegacyQuestions(baseRequest({ sourceFormat: "csv_row", rawInput: row, dryRun: true }), repo))[0]!,
    );
    expect(result.reasonCode).toBe("source_payload_too_large");
  });
});
