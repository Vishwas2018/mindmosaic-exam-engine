import { describe, expect, it } from "vitest";

import { toCandidateItemGroup, toCandidateQuestion } from "@/features/exam-engine/types";
import { evaluateAdaptiveEligibility } from "@/features/exam-engine/selection/adaptive-eligibility";
import { scoreResponse } from "@/features/exam-engine/scoring/question-scorers";
import { itemGroupVersionSchema } from "@/schemas/platform";
import { questionSchema, type QuestionInput } from "@/schemas/question.schema";

function base(overrides: Partial<QuestionInput> = {}): QuestionInput {
  return {
    id: "capability-fixture",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "draft",
    origin: "original_seed",
    prompt: "Which original diagram shows a shape with three sides?",
    options: [{ id: "a", text: "Triangle" }, { id: "b", text: "Square" }],
    visuals: [],
    answerKey: { kind: "single_option", optionId: "a" },
    explanation: "A triangle has three sides.",
    metadata: {
      subject: "numeracy",
      strand: "Space",
      topic: "Shapes",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
    },
    ...overrides,
  };
}

const triangleVisual = {
  id: "triangle-visual",
  type: "geometry_shape" as const,
  altText: "A plain three-sided polygon without answer annotations.",
  data: {
    shape: "triangle" as const,
    measurements: [],
    vertices: [{ x: 10, y: 90 }, { x: 50, y: 10 }, { x: 90, y: 90 }],
  },
};

describe("rich option contracts", () => {
  it("keeps old text-only options valid", () => {
    expect(questionSchema.safeParse(base()).success).toBe(true);
  });

  it("accepts visual-only and text-plus-visual options", () => {
    const parsed = questionSchema.parse(base({
      visuals: [triangleVisual],
      options: [
        { id: "a", visualId: "triangle-visual", accessibleLabel: "Option A, a three-sided polygon" },
        { id: "b", text: "A different shape", visualId: "triangle-visual" },
      ],
    }));
    expect(parsed.options[0].text).toBe("");
  });

  it("rejects broken and inaccessible visual-only references", () => {
    expect(questionSchema.safeParse(base({ options: [{ id: "a", visualId: "missing", accessibleLabel: "Missing diagram" }, { id: "b", text: "Square" }] })).success).toBe(false);
    expect(questionSchema.safeParse(base({ visuals: [triangleVisual], options: [{ id: "a", visualId: "triangle-visual" }, { id: "b", text: "Square" }] })).success).toBe(false);
  });
});

describe("safe audio contracts", () => {
  const media = {
    id: "spelling-audio",
    kind: "audio" as const,
    source: { kind: "private_storage" as const, bucket: "assessment-media" as const, objectPath: "audio/original/spelling-audio.mp3" },
    mimeType: "audio/mpeg" as const,
    durationSeconds: 8,
    title: "Listen to the word",
    playback: { autoplay: false as const, maxPlays: 2 },
    transcript: { visibility: "review_only" as const, text: "An original spelling script." },
    accessibility: { fallbackMessage: "Ask a supervisor for the approved accommodation.", accommodationRequiredWhenUnavailable: true },
    provenance: { creator: "MindMosaic", licence: "MindMosaic original", copyright: "Copyright MindMosaic" },
    integrity: { sha256: "a".repeat(64), sizeBytes: 1024 },
  };

  it("validates MIME and governed namespaces", () => {
    expect(questionSchema.safeParse(base({ media: [media] })).success).toBe(true);
    expect(questionSchema.safeParse(base({ media: [{ ...media, mimeType: "text/html" as never }] })).success).toBe(false);
    expect(questionSchema.safeParse(base({ media: [{ ...media, source: { ...media.source, objectPath: "../answer.mp3" } }] })).success).toBe(false);
  });

  it("strips private coordinates and review-only transcripts from candidate DTOs", () => {
    const candidate = toCandidateQuestion(questionSchema.parse(base({ media: [media] })));
    expect(candidate.media?.[0].src).toBe("/api/assessment/media/spelling-audio");
    expect(candidate.media?.[0]).not.toHaveProperty("source");
    expect(candidate.media?.[0]).not.toHaveProperty("transcript");
    expect(JSON.stringify(candidate)).not.toContain("An original spelling script.");
  });
});

describe("groups, structured scoring and adaptive gates", () => {
  it("requires deterministic contiguous group membership", () => {
    const valid = {
      kind: "item_group_version" as const,
      schemaVersion: 1 as const,
      itemGroupId: "11111111-1111-4111-8111-111111111111",
      revision: 1,
      title: "Original paired sources",
      stimulusVersionIds: ["22222222-2222-4222-8222-222222222222"],
      members: [
        { itemVersionId: "33333333-3333-4333-8333-333333333333", ordinal: 1, partLabel: "(a)" },
        { itemVersionId: "44444444-4444-4444-8444-444444444444", ordinal: 2, partLabel: "(b)" },
      ],
      accessibility: { readingOrder: ["source-1", "part-a", "part-b"], answerableFromAccessibleRepresentation: true },
      contentHash: "b".repeat(64),
    };
    expect(itemGroupVersionSchema.safeParse(valid).success).toBe(true);
    expect(itemGroupVersionSchema.safeParse({ ...valid, members: valid.members.map((member, index) => ({ ...member, ordinal: index + 2 })) }).success).toBe(false);
  });

  it("projects group children without answer keys or private scripts", () => {
    const child = questionSchema.parse(base());
    const candidate = toCandidateItemGroup({
      itemGroupVersionId: "55555555-5555-4555-8555-555555555555",
      revision: 1,
      title: "Original two-part group",
      accessibility: { readingOrder: ["source", "part-a", "part-b"], answerableFromAccessibleRepresentation: true },
      stimuli: [{ id: "source", kind: "text", body: "An original shared source." }],
      members: [
        { ordinal: 2, partLabel: "(b)", question: { ...child, id: "child-b" } },
        { ordinal: 1, partLabel: "(a)", question: { ...child, id: "child-a" } },
      ],
    });
    expect(candidate.members.map((member) => member.ordinal)).toEqual([1, 2]);
    expect(candidate.totalMarks).toBe(2);
    expect(JSON.stringify(candidate)).not.toMatch(/answerKey|explanation/);
  });

  it("awards automatic part marks and leaves rubric-versioned evidence pending", () => {
    const question = questionSchema.parse(base({
      type: "structured_response",
      prompt: "Complete both original parts.",
      options: [],
      interaction: {
        type: "structured_response",
        parts: [
          { id: "total", label: "Enter the total", responseKind: "number" },
          { id: "method", label: "Explain your method", responseKind: "short_text" },
        ],
        workingArea: { enabled: true, label: "Working", maxLength: 1000 },
      },
      answerKey: {
        kind: "structured",
        markingMode: "hybrid",
        parts: [
          { id: "total", responseKind: "number", marking: "automatic", marks: 1, value: 12, tolerance: 0 },
          { id: "method", responseKind: "short_text", marking: "manual", marks: 2, rubric: "Award marks for a valid, clearly stated method.", rubricVersion: "method-v1" },
        ],
      },
      metadata: { ...base().metadata, marks: 3 },
    }));
    const result = scoreResponse(question, { total: "12", method: "I combined equal groups." });
    expect(result.status).toBe("manual_review");
    expect(result.earnedMarks).toBe(1);
    expect(result.partEvidence).toEqual([
      { partId: "total", status: "correct", earnedMarks: 1, availableMarks: 1 },
      { partId: "method", status: "pending_review", earnedMarks: null, availableMarks: 2, rubricVersion: "method-v1" },
    ]);
  });

  it("fails adaptive routing closed for unavailable media and hybrid work", () => {
    const result = evaluateAdaptiveEligibility({
      machineScorableAtRoutingPoint: true,
      rendererSupported: true,
      accessibleRepresentationSufficient: true,
      requiredMediaAvailable: false,
      blueprintMetadataComplete: true,
      unresolvedQaFlags: [],
      enemySetAssessmentComplete: true,
      peerPoolCapacityPasses: true,
      hasUnresolvedManualParts: true,
    });
    expect(result).toEqual({ eligible: false, reasons: ["required_media_unavailable", "manual_marks_unresolved"] });
  });
});
