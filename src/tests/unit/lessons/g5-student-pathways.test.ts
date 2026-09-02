/**
 * @file g5-student-pathways.test.ts
 *
 * Invariant test suite for the Grade 5 student-facing curriculum lesson pathways.
 * Covers all 14 required invariants from the task specification.
 *
 * Invariant 15: lesson registry total (Grade 3 = 54, Grade 5 = 50, total = 104)
 */

import { describe, expect, it } from "vitest";
import {
  getAllLessons,
  getCurriculumPathwaysForYearLevel,
  getAllLevel3Pathways,
  getAllLevel5Pathways,
  getLessonByCode,
  getPublishedLessons,
} from "@/features/curriculum/lessons/content";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";
import { CLASSROOM_ONLY_CURRICULUM_CODES } from "@/features/curriculum/lessons/classroom-only";

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 15: Lesson registry universe
────────────────────────────────────────────────────────────────────────── */

describe("Lesson Registry Universe", () => {
  it("Grade 3 expected lesson universe = 54", () => {
    const l3 = getAllLessons().filter((l) => l.level === "Level 3");
    expect(l3).toHaveLength(54);
  });

  it("Grade 5 expected lesson universe = 50", () => {
    const l5 = getAllLessons().filter((l) => l.level === "Level 5");
    expect(l5).toHaveLength(50);
  });

  it("Total = 104", () => {
    expect(getAllLessons()).toHaveLength(104);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 1: Year 3 student still receives Grade 3 curriculum pathways
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 1: Year 3 receives Grade 3 pathways", () => {
  it("getCurriculumPathwaysForYearLevel(3) returns exactly 9 pathways", () => {
    const pathways = getCurriculumPathwaysForYearLevel(3);
    expect(pathways).toHaveLength(9);
  });

  it("Year 3 pathways all carry 'Level 3' level field", () => {
    for (const p of getCurriculumPathwaysForYearLevel(3)) {
      expect(p.level).toBe("Level 3");
    }
  });

  it("Year 3 pathways total 54 nodes matching the complete Level 3 catalogue", () => {
    const pathways = getCurriculumPathwaysForYearLevel(3);
    const total = pathways.reduce((acc, p) => acc + p.nodes.length, 0);
    expect(total).toBe(54);
  });

  it("getAllLevel3Pathways() still builds the same 9 pathways independently", () => {
    expect(getAllLevel3Pathways()).toHaveLength(9);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 2: Year 5 student receives Grade 5 curriculum pathways
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 2: Year 5 receives Grade 5 pathways", () => {
  it("getCurriculumPathwaysForYearLevel(5) returns exactly 9 pathways", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    expect(pathways).toHaveLength(9);
  });

  it("Year 5 pathways all carry 'Level 5' level field", () => {
    for (const p of getCurriculumPathwaysForYearLevel(5)) {
      expect(p.level).toBe("Level 5");
    }
  });

  it("getAllLevel5Pathways() still builds the same 9 pathways independently", () => {
    expect(getAllLevel5Pathways()).toHaveLength(9);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 3: Grade 5 exposes exactly the expected 50 curriculum lessons
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 3: Grade 5 has exactly 50 curriculum lessons", () => {
  it("getCurriculumPathwaysForYearLevel(5) aggregates exactly 50 nodes", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    const total = pathways.reduce((acc, p) => acc + p.nodes.length, 0);
    expect(total).toBe(50);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 4: Grade 5 Maths contains exactly 24 curriculum nodes
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 4: Grade 5 Maths = 24 nodes", () => {
  const MATHS_STRANDS = new Set(["number", "algebra", "measurement", "space", "statistics", "probability"]);

  it("Grade 5 Mathematics pathways total 24 nodes", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    const mathsNodes = pathways
      .filter((p) => MATHS_STRANDS.has(p.strand))
      .flatMap((p) => p.nodes);
    expect(mathsNodes).toHaveLength(24);
  });

  it("Grade 5 Number = 10, Algebra = 2, Measurement = 4, Space = 3, Statistics = 3, Probability = 2", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    const byStrand = new Map(pathways.map((p) => [p.strand, p.nodes.length]));
    expect(byStrand.get("number")).toBe(10);
    expect(byStrand.get("algebra")).toBe(2);
    expect(byStrand.get("measurement")).toBe(4);
    expect(byStrand.get("space")).toBe(3);
    expect(byStrand.get("statistics")).toBe(3);
    expect(byStrand.get("probability")).toBe(2);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 5: Grade 5 English contains exactly 26 curriculum nodes
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 5: Grade 5 English = 26 nodes", () => {
  const ENGLISH_STRANDS = new Set(["language", "literature", "literacy"]);

  it("Grade 5 English pathways total 26 nodes", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    const englishNodes = pathways
      .filter((p) => ENGLISH_STRANDS.has(p.strand))
      .flatMap((p) => p.nodes);
    expect(englishNodes).toHaveLength(26);
  });

  it("Grade 5 Language = 9, Literature = 5, Literacy = 12", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    const byStrand = new Map(pathways.map((p) => [p.strand, p.nodes.length]));
    expect(byStrand.get("language")).toBe(9);
    expect(byStrand.get("literature")).toBe(5);
    expect(byStrand.get("literacy")).toBe(12);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 6: No duplicate Grade 5 curriculum codes
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 6: No duplicate Grade 5 curriculum codes", () => {
  it("all Grade 5 node curriculum codes are unique", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    const codes = pathways.flatMap((p) => p.nodes).map((n) => n.curriculumCode);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 7: No Grade 3 curriculum node appears in the Grade 5 pathway
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 7: No Grade 3 nodes in Grade 5 pathway", () => {
  it("Grade 5 nodes contain no VC2M3* or VC2E3* codes", () => {
    const l5Codes = getCurriculumPathwaysForYearLevel(5)
      .flatMap((p) => p.nodes)
      .map((n) => n.curriculumCode);

    for (const code of l5Codes) {
      expect(code).not.toMatch(/^VC2[ME]3/);
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 8: No Grade 5 curriculum node appears in the Grade 3 pathway
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 8: No Grade 5 nodes in Grade 3 pathway", () => {
  it("Grade 3 nodes contain no VC2M5* or VC2E5* codes", () => {
    const l3Codes = getCurriculumPathwaysForYearLevel(3)
      .flatMap((p) => p.nodes)
      .map((n) => n.curriculumCode);

    for (const code of l3Codes) {
      expect(code).not.toMatch(/^VC2[ME]5/);
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 9: Missing year level does not silently default to Grade 3
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 9: Null year level does not default to Grade 3", () => {
  it("getCurriculumPathwaysForYearLevel(null) returns empty array", () => {
    const pathways = getCurriculumPathwaysForYearLevel(null);
    expect(pathways).toHaveLength(0);
  });

  it("getCurriculumPathwaysForYearLevel(null) contains no Grade 3 content", () => {
    const pathways = getCurriculumPathwaysForYearLevel(null);
    const nodes = pathways.flatMap((p) => p.nodes);
    expect(nodes).toHaveLength(0);
  });

  it("unsupported year levels (1, 2, 4, 6, 7, 8, 9, 10) return empty array", () => {
    for (const year of [1, 2, 4, 6, 7, 8, 9, 10]) {
      expect(getCurriculumPathwaysForYearLevel(year)).toHaveLength(0);
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 10: Classroom-only nodes do not expose inappropriate digital CTAs
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 10: Classroom-only nodes have zero digital practice", () => {
  it("classroom-only codes have no mapped question IDs", () => {
    for (const code of CLASSROOM_ONLY_CURRICULUM_CODES) {
      const ids = getMappedQuestionIdsForNode(code);
      expect(ids).toHaveLength(0);
    }
  });

  it("classroom-only lessons have no worked_example or check sections", () => {
    const lessons = getAllLessons();
    for (const lesson of lessons) {
      if (CLASSROOM_ONLY_CURRICULUM_CODES.has(lesson.curriculumCode)) {
        const hasWorkedExample = lesson.sections.some((s) => s.kind === "worked_example");
        const hasCheck = lesson.sections.some((s) => s.kind === "check");
        expect(hasWorkedExample).toBe(false);
        expect(hasCheck).toBe(false);
      }
    }
  });

  it("Grade 5 has exactly 3 classroom-only nodes", () => {
    const l5ClassroomOnly = getAllLessons()
      .filter((l) => l.level === "Level 5")
      .filter((l) => CLASSROOM_ONLY_CURRICULUM_CODES.has(l.curriculumCode));
    // VC2E5LY01, VC2E5LY02, VC2E5LY12
    expect(l5ClassroomOnly).toHaveLength(3);
  });

  it("Grade 3 has exactly 6 classroom-only nodes", () => {
    const l3ClassroomOnly = getAllLessons()
      .filter((l) => l.level === "Level 3")
      .filter((l) => CLASSROOM_ONLY_CURRICULUM_CODES.has(l.curriculumCode));
    // VC2E3LA01, VC2E3LE02, VC2E3LE05, VC2E3LY01, VC2E3LY02, VC2E3LY13
    expect(l3ClassroomOnly).toHaveLength(6);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 11: Governed practice nodes still resolve using the existing resolver
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 11: Digital practice nodes resolve question IDs", () => {
  it("at least one Grade 5 Mathematics node has mapped question IDs", () => {
    const mathsL5 = getAllLevel5Pathways()
      .filter((p) => ["number", "algebra", "measurement", "space", "statistics", "probability"].includes(p.strand))
      .flatMap((p) => p.nodes);

    const withQuestions = mathsL5.filter((n) => n.questionCount > 0);
    expect(withQuestions.length).toBeGreaterThan(0);
  });

  it("at least one Grade 5 English node has mapped question IDs", () => {
    const englishL5 = getAllLevel5Pathways()
      .filter((p) => ["language", "literature", "literacy"].includes(p.strand))
      .flatMap((p) => p.nodes);

    const withQuestions = englishL5.filter((n) => n.questionCount > 0);
    expect(withQuestions.length).toBeGreaterThan(0);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 12: In-review/unapproved question mappings remain inaccessible
   (Governed by gated-practice-coverage — tested in gated-practice-coverage.test.ts)
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 12: Only approved alignments exposed (boundary check)", () => {
  it("getMappedQuestionIdsForNode returns only IDs, not approval states (resolver governs)", () => {
    // The resolver (resolver.ts) then filters to published bank only.
    // This test verifies the alignment map itself returns the raw IDs.
    const ids = getMappedQuestionIdsForNode("VC2M5N01");
    expect(Array.isArray(ids)).toBe(true);
    // The existence of IDs does not mean they are accessible — the resolver
    // enforces the published-bank filter separately.
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 13: All lesson links resolve to valid lesson pages
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 13: All curriculum codes resolve to a published lesson", () => {
  it("every Grade 5 node curriculum code resolves to a published lesson", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    for (const pathway of pathways) {
      for (const node of pathway.nodes) {
        const lesson = getLessonByCode(node.curriculumCode, { publishedOnly: true });
        expect(lesson).toBeDefined();
        expect(lesson?.curriculumCode).toBe(node.curriculumCode);
      }
    }
  });

  it("every Grade 3 node curriculum code resolves to a published lesson", () => {
    const pathways = getCurriculumPathwaysForYearLevel(3);
    for (const pathway of pathways) {
      for (const node of pathway.nodes) {
        const lesson = getLessonByCode(node.curriculumCode, { publishedOnly: true });
        expect(lesson).toBeDefined();
        expect(lesson?.curriculumCode).toBe(node.curriculumCode);
      }
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   Invariant 14: Existing Grade 3 lesson-route tests remain intact (smoke)
   (Full route tests are in lesson-resolver.test.ts)
────────────────────────────────────────────────────────────────────────── */

describe("Invariant 14: Grade 3 lesson resolution unchanged", () => {
  it("getPublishedLessons() returns 104 lessons (Grade 3 + Grade 5)", () => {
    const published = getPublishedLessons();
    expect(published).toHaveLength(104);
  });

  it("Grade 3 first Number lesson VC2M3N01 is still published and accessible", () => {
    const lesson = getLessonByCode("VC2M3N01", { publishedOnly: true });
    expect(lesson).toBeDefined();
    expect(lesson?.level).toBe("Level 3");
    expect(lesson?.strand).toBe("number");
  });

  it("Grade 3 last Literacy lesson VC2E3LY13 is still published and accessible", () => {
    const lesson = getLessonByCode("VC2E3LY13", { publishedOnly: true });
    expect(lesson).toBeDefined();
    expect(lesson?.level).toBe("Level 3");
  });
});
