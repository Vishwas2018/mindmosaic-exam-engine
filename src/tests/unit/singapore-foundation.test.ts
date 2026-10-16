import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { questionBank } from "@/content/questions/question-bank";
import { PROGRAMS, getProgramBySlug } from "@/features/catalogue/catalogue";
import { SINGAPORE_FOUNDATION_CONTRACT, singaporeFoundationContractSchema } from "@/features/curriculum/singapore-foundation";
import { EXAM_PATTERNS } from "@/features/exam-engine/exam-patterns";
import { filterEligibleQuestions } from "@/features/exam-engine/selection/select-questions";
import { EXAM_STYLE_OPTIONS, SUBJECT_OPTIONS } from "@/features/exam-engine/selection/selection-config";
import { blueprintSchema } from "@/features/question-factory/blueprints/schema";
import { validateBlueprint } from "@/features/question-factory/blueprints/validate";
import { skillTaxonomyRegistry } from "@/features/question-factory/taxonomy";
import { isDeterministicMathsSubject, isSubjectSatIn } from "@/features/taxonomy/subject-registry";
import { isStudentDeliveryStyle, isValidStyleYear, yearLevelsForStyle } from "@/features/taxonomy/year-registry";
import { examStyleSchema, questionMetadataSchema } from "@/schemas/question.schema";
import { getExamBank } from "@/server/exam-bank";

describe("Singapore foundation authoring without programme enablement", () => {
  it("registers the dedicated maths vocabulary and Years 3?6 only", () => {
    expect(examStyleSchema.parse("singapore_style")).toBe("singapore_style");
    expect(questionMetadataSchema.shape.subject.parse("singapore_mathematics")).toBe("singapore_mathematics");
    expect(isDeterministicMathsSubject("singapore_mathematics")).toBe(true);
    expect(yearLevelsForStyle("singapore_style")).toEqual([3, 4, 5, 6]);
    for (const year of [3, 4, 5, 6] as const) {
      expect(isSubjectSatIn("singapore_mathematics", "singapore_style", year)).toBe(true);
    }
    expect(isValidStyleYear("singapore_style", 2)).toBe(false);
    expect(isValidStyleYear("singapore_style", 7)).toBe(false);
    expect(isSubjectSatIn("singapore_mathematics", "naplan_style", 3)).toBe(false);
  });

  it("can isolate future authoring content without mixing styles or subjects", () => {
    // Reuse an existing question verbatim; this tests routing, not new content.
    const original = questionBank[0];
    const foundation = { ...original, examStyle: "singapore_style" as const,
      metadata: { ...original.metadata, subject: "singapore_mathematics" as const } };
    const config = { yearLevel: original.yearLevel, examStyle: "singapore_style" as const, subject: "singapore_mathematics" as const };
    expect(filterEligibleQuestions([original, foundation], config)).toEqual([foundation]);
    expect(filterEligibleQuestions([foundation], { ...config, examStyle: "naplan_style" })).toEqual([]);
  });

  it("validates a real blueprint against the registered foundation skills", () => {
    const path = `content/question-factory/blueprints/${SINGAPORE_FOUNDATION_CONTRACT.blueprintId}.json`;
    const blueprint = blueprintSchema.parse(JSON.parse(readFileSync(path, "utf8")));
    expect(validateBlueprint(blueprint)).toEqual({ valid: true, issues: [] });
    for (const id of SINGAPORE_FOUNDATION_CONTRACT.skills) {
      expect(skillTaxonomyRegistry.get(id)?.subject).toBe("singapore_mathematics");
    }
    const invalid = { ...blueprint, yearLevel: "year-7" as const };
    expect(validateBlueprint(invalid).issues.map((issue) => issue.code)).toContain("exam_style_not_sat_at_year_level");
  });

  it("has an internal deferred pattern contract that cannot claim student delivery", () => {
    expect(SINGAPORE_FOUNDATION_CONTRACT.pattern).toMatchObject({ mode: "authoring_only", questionCount: null, durationMinutes: null });
    expect(singaporeFoundationContractSchema.safeParse({ ...SINGAPORE_FOUNDATION_CONTRACT, studentDelivery: true }).success).toBe(false);
    expect(isStudentDeliveryStyle("singapore_style")).toBe(false);
    expect(EXAM_PATTERNS.filter((p) => String(p.examStyle) === "singapore_style")).toEqual([]);
  });

  it("preserves the existing coming-soon card without adding public scopes or picker options", () => {
    expect(getProgramBySlug("singapore-maths")).toMatchObject({ status: "coming_soon" });
    expect(getProgramBySlug("singapore-maths")?.scope).toBeUndefined();
    expect(PROGRAMS.filter((p) => p.scope?.examStyle === "singapore_style")).toEqual([]);
    expect(EXAM_STYLE_OPTIONS.some((o) => String(o) === "singapore_style")).toBe(false);
    expect(SUBJECT_OPTIONS.some((o) => String(o) === "singapore_mathematics")).toBe(false);
  });

  it.each(["practice", "published", "curated"] as const)("serves zero Singapore items from %s", (id) => {
    const bank = getExamBank(id);
    expect(bank.length).toBeGreaterThan(0);
    expect(bank.filter((q) => q.examStyle === "singapore_style" || q.metadata.subject === "singapore_mathematics")).toEqual([]);
  });
});
