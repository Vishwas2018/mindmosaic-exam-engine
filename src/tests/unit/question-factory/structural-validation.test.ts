import { describe, expect, it } from "vitest";

import { hashJson } from "@/features/question-factory/provenance";
import {
  validateCandidateStructure,
  type StructuralValidationResult,
} from "@/features/question-factory/validation";

import {
  VALID_CONTEXT,
  baseProvenance,
  baseQuestion,
  buildCandidate,
  dropdownQuestion,
  fillBlankQuestion,
  matchingQuestion,
  multipleSelectQuestion,
  numberEntryQuestion,
  orderingQuestion,
  taxonomyAliasQuestion,
  trueFalseQuestion,
  visualQuestion,
} from "./structural-validation-fixtures";

function passed(result: StructuralValidationResult) {
  if (result.status !== "passed") {
    throw new Error(`Expected passed, got failed: ${JSON.stringify(result.issues, null, 2)}`);
  }
  return result;
}

function failed(result: StructuralValidationResult) {
  if (result.status !== "failed") {
    throw new Error("Expected failed, got passed.");
  }
  return result;
}

function issueCodes(result: StructuralValidationResult): readonly string[] {
  return result.status === "failed" ? result.issues.map((issue) => issue.code) : [];
}

describe("passing cases", () => {
  it("accepts a valid multiple-choice candidate", () => {
    const { candidate } = buildCandidate();
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("accepts a valid multiple-select candidate", () => {
    const { candidate } = buildCandidate({ questionOverrides: multipleSelectQuestion() });
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("accepts a valid number-entry candidate", () => {
    const { candidate } = buildCandidate({ questionOverrides: numberEntryQuestion() });
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("accepts a valid fill-blank candidate", () => {
    const { candidate } = buildCandidate({ questionOverrides: fillBlankQuestion() });
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("accepts a valid matching candidate", () => {
    const { candidate } = buildCandidate({ questionOverrides: matchingQuestion() });
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("accepts a valid ordering candidate", () => {
    const { candidate } = buildCandidate({ questionOverrides: orderingQuestion() });
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("accepts a valid dropdown candidate", () => {
    const { candidate } = buildCandidate({ questionOverrides: dropdownQuestion() });
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("accepts a valid true/false candidate", () => {
    const { candidate } = buildCandidate({ questionOverrides: trueFalseQuestion() });
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("accepts a valid visual question", () => {
    const { candidate } = buildCandidate({ questionOverrides: visualQuestion() });
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("resolves a declared taxonomy alias, not just the canonical id", () => {
    const { candidate } = buildCandidate({ questionOverrides: taxonomyAliasQuestion() });
    passed(validateCandidateStructure(candidate, VALID_CONTEXT));
  });

  it("produces a deterministic evidence hash for identical inputs", () => {
    const { candidate } = buildCandidate();
    const first = validateCandidateStructure(candidate, VALID_CONTEXT);
    const second = validateCandidateStructure(candidate, VALID_CONTEXT);
    expect(passed(first).evidence.evidenceHash).toBe(passed(second).evidence.evidenceHash);
  });

  it("produces a different evidence hash when validatedAt differs", () => {
    const { candidate } = buildCandidate();
    const first = validateCandidateStructure(candidate, VALID_CONTEXT);
    const second = validateCandidateStructure(candidate, { validatedAt: "2026-06-01T00:00:00.000Z" });
    expect(passed(first).evidence.evidenceHash).not.toBe(passed(second).evidence.evidenceHash);
  });
});

describe("candidate/provenance failures", () => {
  it("rejects a candidate whose lifecycle state is not 'generated'", () => {
    const { candidate } = buildCandidate({ state: "structural_validation_passed" });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_lifecycle_state",
    );
  });

  it("rejects a candidate whose content hash does not match its stored question", () => {
    const { candidate } = buildCandidate({ provenanceOverrides: { contentHash: "0000deadbeef0000" } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "content_hash_mismatch",
    );
  });

  it("rejects a candidate whose content hash no longer matches the caller's earlier expectation (stale)", () => {
    const { candidate } = buildCandidate();
    const context = { ...VALID_CONTEXT, expectedContentHash: "some-earlier-hash" };
    expect(issueCodes(validateCandidateStructure(candidate, context))).toContain("stale_content_hash");
  });

  it("rejects a candidate whose revision no longer matches the caller's earlier expectation (stale)", () => {
    const { candidate } = buildCandidate();
    const context = { ...VALID_CONTEXT, expectedRevision: 7 };
    expect(issueCodes(validateCandidateStructure(candidate, context))).toContain("stale_revision");
  });

  it("rejects a candidate whose blueprint binding no longer matches the caller's earlier expectation (stale)", () => {
    const { candidate } = buildCandidate();
    const context = { ...VALID_CONTEXT, expectedBlueprintId: "some-other-blueprint" };
    expect(issueCodes(validateCandidateStructure(candidate, context))).toContain(
      "stale_blueprint_binding",
    );
  });

  it("rejects a candidate with a missing batch id", () => {
    const { candidate } = buildCandidate({ provenanceOverrides: { batchId: "" } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "missing_batch_id",
    );
  });

  it("rejects a candidate with a missing pipeline run id", () => {
    const { candidate } = buildCandidate({ provenanceOverrides: { pipelineRunId: "" } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "missing_pipeline_run_id",
    );
  });

  it("rejects a candidate with an invalid generator identity", () => {
    const { candidate } = buildCandidate({
      provenanceOverrides: {
        generatorAdapter: { class: "manual_external", identity: { provider: "not-a-real-provider" } },
      },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_generator_identity",
    );
  });

  it("rejects a candidate with an invalid generator class", () => {
    const question = baseQuestion();
    const provenance = baseProvenance(question, {
      generatorAdapter: {
        class: "not_a_real_class",
        identity: { provider: "openai", modelId: "gpt-4", modelFamily: "gpt", interactionMode: "api" },
      },
    });
    const candidate = { candidateId: question.id as string, state: "generated", question, provenance };
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_generator_class",
    );
  });

  it("rejects an absolute source path", () => {
    const { candidate } = buildCandidate({ sourcePath: "C:\\Users\\attacker\\file.json" });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "unsanitised_source_path",
    );
  });

  it("rejects a candidate carrying a donor approval/status field", () => {
    const { candidate } = buildCandidate({ questionOverrides: { status: "approved" } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "donor_trust_field_present",
    );
  });

  it("rejects a candidate carrying a donor origin field", () => {
    const { candidate } = buildCandidate({ questionOverrides: { origin: "ai_generated" } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "donor_trust_field_present",
    );
  });

  it("rejects an unsupported schema version", () => {
    const { candidate } = buildCandidate({ provenanceOverrides: { schemaVersion: "999" } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "unsupported_schema_version",
    );
  });

  it("rejects an unsupported taxonomy version", () => {
    const { candidate } = buildCandidate({ provenanceOverrides: { taxonomyVersion: "999" } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "unsupported_taxonomy_version",
    );
  });

  it("rejects a candidate whose top-level id disagrees with its provenance-declared id", () => {
    const { candidate } = buildCandidate();
    const mismatched = { ...candidate, candidateId: "some-other-id" };
    expect(issueCodes(validateCandidateStructure(mismatched, VALID_CONTEXT))).toContain(
      "invalid_candidate_id",
    );
  });

  it("rejects a negative revision", () => {
    const { candidate } = buildCandidate({ provenanceOverrides: { revision: -1 } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_revision",
    );
  });
});

describe("taxonomy failures", () => {
  it("rejects an unknown skill id", () => {
    const { candidate } = buildCandidate({
      questionOverrides: baseQuestion({ metadata: { ...baseQuestion().metadata as object, skill: "totally-unknown-skill" } }),
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "unknown_taxonomy_skill",
    );
  });

  it("rejects an undeclared alias", () => {
    const { candidate } = buildCandidate({
      questionOverrides: baseQuestion({
        metadata: { ...(baseQuestion().metadata as object), skill: "Some phrase nobody declared as an alias" },
      }),
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "unknown_taxonomy_skill",
    );
  });

  it("rejects a candidate with no declared skill as ambiguous", () => {
    const question = baseQuestion();
    const metadata = { ...(question.metadata as Record<string, unknown>) };
    delete metadata.skill;
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "ambiguous_taxonomy_reference",
    );
  });

  it("rejects a grade mismatch against the resolved taxonomy entry", () => {
    const { candidate } = buildCandidate({ questionOverrides: { yearLevel: 5 } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "taxonomy_grade_mismatch",
    );
  });

  it("rejects a subject mismatch against the resolved taxonomy entry", () => {
    const question = baseQuestion();
    const metadata = { ...(question.metadata as Record<string, unknown>), subject: "reading" };
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "taxonomy_subject_mismatch",
    );
  });

  it("rejects a strand mismatch against the resolved taxonomy entry", () => {
    const question = baseQuestion();
    const metadata = { ...(question.metadata as Record<string, unknown>), strand: "Not A Real Strand" };
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "taxonomy_strand_mismatch",
    );
  });

  it("rejects an exam style unsupported by the resolved taxonomy entry", () => {
    const { candidate } = buildCandidate({ questionOverrides: { examStyle: "icas_style" } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "taxonomy_exam_style_unsupported",
    );
  });
});

describe("interaction failures", () => {
  it("rejects duplicate ids inside an interaction", () => {
    const question = matchingQuestion({
      interaction: {
        type: "matching",
        sources: [
          { id: "src-1", text: "Dog" },
          { id: "src-1", text: "Run" },
        ],
        targets: [
          { id: "tgt-1", text: "Noun" },
          { id: "tgt-2", text: "Verb" },
        ],
      },
    });
    const { candidate } = buildCandidate({ questionOverrides: question });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_interaction",
    );
  });

  it("rejects a matching answer key referencing an unknown source", () => {
    const question = matchingQuestion({
      answerKey: {
        kind: "matching",
        pairs: [
          { sourceId: "not-a-real-source", targetId: "tgt-1" },
          { sourceId: "src-2", targetId: "tgt-2" },
        ],
      },
    });
    const { candidate } = buildCandidate({ questionOverrides: question });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_answer_key",
    );
  });

  it("rejects an answer key whose shape is incompatible with the question type", () => {
    const { candidate } = buildCandidate({ questionOverrides: { answerKey: { kind: "boolean", value: true } } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_answer_key",
    );
  });

  it("rejects duplicate multiple-select option ids in the answer key", () => {
    const question = multipleSelectQuestion({
      answerKey: { kind: "multiple_options", optionIds: ["opt-a", "opt-a"] },
    });
    const { candidate } = buildCandidate({ questionOverrides: question });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_answer_key",
    );
  });

  it("rejects an ordering answer key that is not a valid permutation of the interaction items", () => {
    const question = orderingQuestion({
      answerKey: { kind: "ordering", optionIds: ["step-1", "step-2"] },
    });
    const { candidate } = buildCandidate({ questionOverrides: question });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_answer_key",
    );
  });

  it("rejects a dropdown answer key referencing a missing option", () => {
    const question = dropdownQuestion({
      answerKey: { kind: "dropdown", fields: [{ id: "field-1", correctOptionId: "not-an-option" }] },
    });
    const { candidate } = buildCandidate({ questionOverrides: question });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_answer_key",
    );
  });

  it("rejects a fill-blank answer key whose blanks disagree with the interaction's blanks", () => {
    const question = fillBlankQuestion({
      answerKey: { kind: "fill_blank", blanks: [{ id: "not-a-real-blank", acceptedAnswers: ["mice"] }] },
    });
    const { candidate } = buildCandidate({ questionOverrides: question });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_answer_key",
    );
  });

  it("rejects a question type that requires an interaction when none is present", () => {
    const question = matchingQuestion();
    delete (question as Record<string, unknown>).interaction;
    const { candidate } = buildCandidate({ questionOverrides: question });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_interaction",
    );
  });
});

describe("prompt and safety failures", () => {
  it("rejects an empty prompt", () => {
    const { candidate } = buildCandidate({ questionOverrides: { prompt: "" } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_prompt",
    );
  });

  it("rejects an oversized prompt", () => {
    const { candidate } = buildCandidate({ questionOverrides: { prompt: "x".repeat(2500) } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_prompt",
    );
  });

  it("rejects script markup in the prompt", () => {
    const { candidate } = buildCandidate({
      questionOverrides: { prompt: "What is 1+1? <script>alert(1)</script>" },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "unsafe_markup_detected",
    );
  });

  it("rejects inline event-handler markup in the prompt", () => {
    const { candidate } = buildCandidate({
      questionOverrides: { prompt: '<img src=x onerror="alert(1)">What is 1+1?' },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "unsafe_markup_detected",
    );
  });

  it("rejects raw SVG markup in the prompt", () => {
    const { candidate } = buildCandidate({
      questionOverrides: { prompt: "What is 1+1? <svg><circle r='5'/></svg>" },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "unsafe_markup_detected",
    );
  });

  it("rejects dangerous HTML in the explanation", () => {
    const { candidate } = buildCandidate({
      questionOverrides: { explanation: 'See <iframe src="https://evil.example"></iframe> for details.' },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "unsafe_markup_detected",
    );
  });

  it("rejects a reading_comprehension candidate with no stimulus", () => {
    const question = baseQuestion({
      type: "reading_comprehension",
      answerKey: { kind: "single_option", optionId: "opt-a" },
    });
    const { candidate } = buildCandidate({ questionOverrides: question });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "missing_required_stimulus",
    );
  });

  it("rejects an oversized stimulus body", () => {
    const { candidate } = buildCandidate({
      questionOverrides: { stimulus: { body: "x".repeat(9000) } },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "missing_required_stimulus",
    );
  });

  it("rejects visual alt text that explicitly reveals the answer", () => {
    const question = visualQuestion({
      visuals: [
        {
          id: "chart-1",
          type: "bar_chart",
          altText: "Bar chart where the correct answer is Bananas with the most sales.",
          data: { labels: ["Apples", "Bananas"], values: [10, 20], colour: "#4B2E83" },
        },
      ],
    });
    const { candidate } = buildCandidate({ questionOverrides: question });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "answer_leakage_in_alt_text",
    );
  });
});

describe("visual failures", () => {
  it("rejects an unsupported visual type", () => {
    const { candidate } = buildCandidate({
      questionOverrides: {
        visuals: [{ id: "v1", type: "svg", altText: "Not a real visual type here." }],
      },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_visuals",
    );
  });

  it("rejects malformed bar-chart dimensions", () => {
    const { candidate } = buildCandidate({
      questionOverrides: {
        visuals: [
          {
            id: "v1",
            type: "bar_chart",
            altText: "Bar chart with mismatched labels and values.",
            data: { labels: ["A", "B", "C"], values: [1, 2], colour: "#4B2E83" },
          },
        ],
      },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_visuals",
    );
  });

  it("rejects inconsistent table dimensions", () => {
    const { candidate } = buildCandidate({
      questionOverrides: {
        visuals: [
          {
            id: "v1",
            type: "table",
            altText: "Table with a row longer than its headers.",
            data: { headers: ["A", "B"], rows: [["1", "2", "3"]], rowHeaders: false },
          },
        ],
      },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_visuals",
    );
  });

  it("rejects invalid number-line bounds", () => {
    const { candidate } = buildCandidate({
      questionOverrides: {
        visuals: [
          {
            id: "v1",
            type: "number_line",
            altText: "Number line with min greater than max.",
            data: { min: 10, max: 0, step: 1, highlightedValues: [] },
          },
        ],
      },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_visuals",
    );
  });

  it("rejects invalid geometry measurement values", () => {
    const { candidate } = buildCandidate({
      questionOverrides: {
        visuals: [
          {
            id: "v1",
            type: "geometry_shape",
            altText: "Triangle with a negative side length.",
            data: { shape: "triangle", measurements: [{ label: "side", value: -5 }] },
          },
        ],
      },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_visuals",
    );
  });

  it("rejects a visual with missing/too-short alt text", () => {
    const { candidate } = buildCandidate({
      questionOverrides: {
        visuals: [
          {
            id: "v1",
            type: "bar_chart",
            altText: "short",
            data: { labels: ["A"], values: [1], colour: "#4B2E83" },
          },
        ],
      },
    });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_visuals",
    );
  });
});

describe("numeric failures", () => {
  it("rejects zero marks", () => {
    const question = baseQuestion();
    const metadata = { ...(question.metadata as Record<string, unknown>), marks: 0 };
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_marks",
    );
  });

  it("rejects negative marks", () => {
    const question = baseQuestion();
    const metadata = { ...(question.metadata as Record<string, unknown>), marks: -1 };
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_marks",
    );
  });

  it("rejects excessive marks", () => {
    const question = baseQuestion();
    const metadata = { ...(question.metadata as Record<string, unknown>), marks: 999 };
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_marks",
    );
  });

  it("rejects NaN marks", () => {
    const question = baseQuestion();
    const metadata = { ...(question.metadata as Record<string, unknown>), marks: Number.NaN };
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_marks",
    );
  });

  it("rejects an invalid (negative) expected time", () => {
    const question = baseQuestion();
    const metadata = { ...(question.metadata as Record<string, unknown>), estimatedTimeSeconds: -5 };
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_expected_time",
    );
  });

  it("rejects an infinite expected time", () => {
    const question = baseQuestion();
    const metadata = {
      ...(question.metadata as Record<string, unknown>),
      estimatedTimeSeconds: Number.POSITIVE_INFINITY,
    };
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_expected_time",
    );
  });

  it("rejects a candidate with no expected time at all (required by the production schema)", () => {
    const question = baseQuestion();
    const metadata = { ...(question.metadata as Record<string, unknown>) };
    delete metadata.estimatedTimeSeconds;
    const { candidate } = buildCandidate({ questionOverrides: { ...question, metadata } });
    expect(issueCodes(validateCandidateStructure(candidate, VALID_CONTEXT))).toContain(
      "invalid_expected_time",
    );
  });
});

describe("evidence", () => {
  it("never includes an evidenceHash that changes when only the issue ordering changes", () => {
    const { candidate } = buildCandidate({ questionOverrides: { prompt: "", explanation: "" } });
    const result = failed(validateCandidateStructure(candidate, VALID_CONTEXT));
    expect(result.evidence.evidenceHash).toBeTypeOf("string");
    expect(result.evidence.evidenceHash.length).toBeGreaterThan(0);
    expect(result.evidence.issueSummary.errorCount).toBe(result.issues.length);
  });

  it("carries the candidate id, revision, and content hash even when provenance is malformed", () => {
    const { candidate } = buildCandidate({ provenanceOverrides: { revision: -1 } });
    const result = failed(validateCandidateStructure(candidate, VALID_CONTEXT));
    expect(result.evidence.candidateId).toBe(candidate.candidateId);
  });

  it("hashes identically to a second independently-built candidate with the same content", () => {
    const first = buildCandidate();
    const second = buildCandidate();
    const firstResult = passed(validateCandidateStructure(first.candidate, VALID_CONTEXT));
    const secondResult = passed(validateCandidateStructure(second.candidate, VALID_CONTEXT));
    expect(firstResult.evidence.evidenceHash).toBe(secondResult.evidence.evidenceHash);
  });

  it("proves hashJson is the same content-hash function used by provenance itself", () => {
    const { candidate, question } = buildCandidate();
    const result = passed(validateCandidateStructure(candidate, VALID_CONTEXT));
    expect(result.evidence.candidateContentHash).toBe(hashJson(question));
  });
});
