import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  LEVEL_3_ALIGNMENTS,
  LEVEL_5_ALIGNMENTS,
  LEVEL_3_NUMBER_ALIGNMENTS,
  LEVEL_5_NUMBER_ALIGNMENTS,
  getMappedQuestionIdsForNode,
} from "@/features/curriculum/lessons/alignments";
import { resolveQuestionsForCurriculumNode, resolveQuestionsForNode } from "@/features/curriculum/lessons/resolver";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { parseQuestionIdAnnotation, isAlignmentApprovedAndMapped } from "@/server/curriculum/gated-practice-coverage";

describe("Curriculum Node Question Resolver", () => {
  it("defines mappings for all 54 Level 3 nodes and all 50 Level 5 nodes in alignments", () => {
    const l3Keys = Object.keys(LEVEL_3_ALIGNMENTS);
    expect(l3Keys).toHaveLength(54);
    expect(LEVEL_3_NUMBER_ALIGNMENTS).toBe(LEVEL_3_ALIGNMENTS);

    const l5Keys = Object.keys(LEVEL_5_ALIGNMENTS);
    expect(l5Keys).toHaveLength(50);
    expect(LEVEL_5_NUMBER_ALIGNMENTS).toBe(LEVEL_5_ALIGNMENTS);
  });

  it("returns mapped question IDs via helper function for Level 3 Number nodes", () => {
    const ids = getMappedQuestionIdsForNode("VC2M3N01");
    expect(ids).toEqual([
      "g3-nap-num-number-001",
      "man-1073b6dfccd922bb3dff1d7e",
      "man-30f6b506e9f643379eb704df",
      "man-3ceeafa77022f47d2e1c24ac",
      "man-be1f53f36fe30de66abd3034",
      "man-ce9b5b7301d4c6c950eee793",
    ]);
  });

  it("returns mapped question IDs via helper function for Level 5 Number nodes", () => {
    const ids = getMappedQuestionIdsForNode("VC2M5N01");
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(ids).toContain("g5-nap-num-number-001");
  });

  it("returns mapped question IDs for Level 5 English nodes with coverage", () => {
    // VC2E5LA01's own mapped set (g5-eng-reg-*) was entirely retired to the
    // quarantine archive by the 2026-08-31 runtime-quarantine correction —
    // see g5-runtime-quarantine.test.ts, which asserts it now resolves to
    // zero mapped IDs. VC2E5LA05 is unaffected (backed by pre-existing
    // NAPLAN/ICAS/factory content, none of it among the 195 retired seeds).
    const ids = getMappedQuestionIdsForNode("VC2E5LA05");
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(ids).toContain("g5-nap-lang-tense-001");
  });

  it("VC2E5LA01 correctly resolves to zero mapped IDs now that its only content (g5-eng-reg-*) is quarantined and retired from the runtime seed pool", () => {
    expect(getMappedQuestionIdsForNode("VC2E5LA01")).toEqual([]);
  });

  it("returns empty array for unknown node codes", () => {
    expect(getMappedQuestionIdsForNode("UNKNOWN_CODE")).toEqual([]);
  });

  it("resolves full question objects from published bank for Level 3 and Level 5 nodes", () => {
    const l3Questions = resolveQuestionsForNode("VC2M3N01", 3);
    expect(l3Questions.length).toBeGreaterThan(0);
    expect(l3Questions.length).toBeLessThanOrEqual(3);
    expect(l3Questions[0]).toHaveProperty("id");
    expect(l3Questions[0]).toHaveProperty("prompt");

    const l5Questions = resolveQuestionsForCurriculumNode("VC2M5N01", 3);
    expect(l5Questions.length).toBeGreaterThan(0);
    expect(l5Questions.length).toBeLessThanOrEqual(3);
    expect(l5Questions[0]).toHaveProperty("id");
    expect(l5Questions[0]).toHaveProperty("prompt");
  });

  describe("Governance Lockstep & Alignment State Separation", () => {
    const publishedIds = new Set(publishedExamBank.map((q) => q.id));
    const manifestPath = path.join(
      process.cwd(),
      "content/curriculum-imports/vic-f10-v2-l3-l5.json",
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      nodes: Array<{ nodeId: string; officialCode: string; label: string }>;
      taxonomyAlignments: Array<{
        curriculumNodeId: string;
        rationale?: string;
        review?: { status?: string };
        relationshipType?: string;
      }>;
    };

    const nodeCodeToId = new Map<string, string>();
    const nodeIdToCode = new Map<string, string>();
    for (const n of manifest.nodes) {
      nodeCodeToId.set(n.officialCode, n.nodeId);
      nodeIdToCode.set(n.nodeId, n.officialCode);
    }

    const FOUR_FACTORY_MAN_IDS = [
      { code: "VC2M5N05", id: "man-4fc5e33369f68d95c00b000a" },
      { code: "VC2M5N06", id: "man-4808d7fa035ee2fe23e50a2c" },
      { code: "VC2M5N06", id: "man-872cddbadec42d570159f2c7" },
      { code: "VC2M5N07", id: "man-97d2bffc5f3f4209395e3f0a" },
    ];

    it("all 4 factory-published replacement questions exist in publishedExamBank (generic publication preserved)", () => {
      for (const item of FOUR_FACTORY_MAN_IDS) {
        expect(publishedIds.has(item.id), `expected ${item.id} in publishedExamBank`).toBe(true);
      }
    });

    it("all 4 authoritative curriculum alignment records remain review.status === 'in_review'", () => {
      for (const item of FOUR_FACTORY_MAN_IDS) {
        const nodeId = nodeCodeToId.get(item.code);
        expect(nodeId).toBeDefined();

        const alignment = manifest.taxonomyAlignments.find((ta) => {
          if (ta.curriculumNodeId !== nodeId) return false;
          const parsed = parseQuestionIdAnnotation(ta.rationale);
          return parsed.status === "valid" && parsed.questionId === item.id;
        });

        expect(alignment, `alignment for ${item.id} on ${item.code}`).toBeDefined();
        expect(alignment?.review?.status).toBe("in_review");
        expect(isAlignmentApprovedAndMapped(alignment)).toBe(false);
      }
    });

    it("none of the 4 in_review factory questions can be resolved through their curriculum lesson nodes", () => {
      // VC2M5N05
      const n05Mapped = getMappedQuestionIdsForNode("VC2M5N05");
      const n05Resolved = resolveQuestionsForCurriculumNode("VC2M5N05");
      expect(n05Mapped).not.toContain("man-4fc5e33369f68d95c00b000a");
      expect(n05Resolved.map((q) => q.id)).not.toContain("man-4fc5e33369f68d95c00b000a");

      // VC2M5N06
      const n06Mapped = getMappedQuestionIdsForNode("VC2M5N06");
      const n06Resolved = resolveQuestionsForCurriculumNode("VC2M5N06");
      expect(n06Mapped).not.toContain("man-4808d7fa035ee2fe23e50a2c");
      expect(n06Mapped).not.toContain("man-872cddbadec42d570159f2c7");
      expect(n06Resolved.map((q) => q.id)).not.toContain("man-4808d7fa035ee2fe23e50a2c");
      expect(n06Resolved.map((q) => q.id)).not.toContain("man-872cddbadec42d570159f2c7");

      // VC2M5N07
      const n07Mapped = getMappedQuestionIdsForNode("VC2M5N07");
      const n07Resolved = resolveQuestionsForCurriculumNode("VC2M5N07");
      expect(n07Mapped).not.toContain("man-97d2bffc5f3f4209395e3f0a");
      expect(n07Resolved.map((q) => q.id)).not.toContain("man-97d2bffc5f3f4209395e3f0a");
    });

    it("approved and published curriculum mappings continue to resolve normally into full question objects", () => {
      // VC2M5N05 has approved + published question g5-icas-math-b01-028
      const n05Resolved = resolveQuestionsForCurriculumNode("VC2M5N05");
      expect(n05Resolved.map((q) => q.id)).toEqual(["g5-icas-math-b01-028"]);

      // VC2M5N06 has approved + published question g5-icas-math-b01-015
      const n06Resolved = resolveQuestionsForCurriculumNode("VC2M5N06");
      expect(n06Resolved.map((q) => q.id)).toEqual(["g5-icas-math-b01-015"]);

      // VC2M5N07 has 4 approved + published questions
      const n07Resolved = resolveQuestionsForCurriculumNode("VC2M5N07");
      expect(n07Resolved.map((q) => q.id)).toEqual([
        "g5-icas-math-b01-005",
        "g5-icas-math-b01-031",
        "g5-icas-math-b01-034",
        "g5-icas-math-b01-037",
      ]);
    });

    it("Grade 5 Parent Explorer gated question IDs and student lesson resolver are in exact 100% lockstep for all 50 Grade 5 nodes", () => {
      const approvedIdsByCode = new Map<string, Set<string>>();
      for (const ta of manifest.taxonomyAlignments) {
        if (!isAlignmentApprovedAndMapped(ta)) continue;
        const code = nodeIdToCode.get(ta.curriculumNodeId);
        if (!code || !code.startsWith("VC2M5") && !code.startsWith("VC2E5")) continue;

        const parsed = parseQuestionIdAnnotation(ta.rationale);
        if (parsed.status === "valid" && parsed.questionId) {
          if (!approvedIdsByCode.has(code)) approvedIdsByCode.set(code, new Set());
          approvedIdsByCode.get(code)!.add(parsed.questionId);
        }
      }

      const l5Nodes = manifest.nodes.filter(
        (n) => n.officialCode.startsWith("VC2M5") || n.officialCode.startsWith("VC2E5"),
      );
      expect(l5Nodes).toHaveLength(50);

      for (const node of l5Nodes) {
        const code = node.officialCode;
        const approvedManifestSet = approvedIdsByCode.get(code) ?? new Set<string>();

        // 1. Static alignments must contain EXACTLY the approved mapped IDs from manifest
        const staticMappedIds = getMappedQuestionIdsForNode(code);
        expect(
          new Set(staticMappedIds),
          `Static alignments for ${code} must match approved manifest alignments`,
        ).toEqual(approvedManifestSet);

        // 2. Lesson resolver (publishedExamBank intersection) must match Parent Explorer gated IDs
        const lessonResolvedQuestions = resolveQuestionsForCurriculumNode(code);
        const lessonResolvedIds = new Set(lessonResolvedQuestions.map((q) => q.id));

        const parentExplorerGatedIds = new Set(
          [...approvedManifestSet].filter((id) => publishedIds.has(id)),
        );

        expect(
          lessonResolvedIds,
          `Lesson resolver IDs for ${code} must match Parent Explorer gated IDs`,
        ).toEqual(parentExplorerGatedIds);
      }
    });
  });
});

