import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { resolveCoverageBadge } from "@/features/curriculum/parent-content";
import {
  createGatedPracticeCoverageResolver,
  extractQuestionIdsFromAlignments,
  gatedPracticeCoverageResolver,
  isAlignmentApprovedAndMapped,
  parseQuestionIdAnnotation,
} from "@/server/curriculum/gated-practice-coverage";
import { getExamBank } from "@/server/exam-bank";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";

// Helper to construct mock alignment objects with review and relation
function makeAlignment(
  questionId: string,
  options: {
    rationale?: string;
    reviewStatus?: "approved" | "draft" | "in_review" | "rejected";
    relation?: "exact" | "equivalent" | "broader" | "narrower" | "related" | "unmapped";
  } = {},
) {
  const {
    rationale = `Aligned to Skill [Question ID: ${questionId}]`,
    reviewStatus = "approved",
    relation = "related",
  } = options;

  return {
    curriculum_node_id: "test-node",
    taxonomy_node_id: relation === "unmapped" ? null : "test-taxonomy",
    relation,
    rationale,
    review_status: reviewStatus,
    review: {
      status: reviewStatus,
      reviewedBy: "Review Board",
      reviewedAt: "2026-08-30T00:00:00.000Z",
    },
  };
}

describe("Gated Practice Coverage Resolver Suite", () => {
  const publishedBank = getExamBank("published");
  const practiceBank = getExamBank("practice");
  const curatedBank = getExamBank("curated");

  const publishedIds = new Set(publishedBank.map((q) => q.id));
  const practiceOnlyIds = practiceBank
    .filter((q) => !publishedIds.has(q.id))
    .map((q) => q.id);

  describe("1. Alignment Approval & Relation Verification", () => {
    const publishedId = curatedBank[0]!.id;

    it("approved + published -> counted", () => {
      const alignment = makeAlignment(publishedId, { reviewStatus: "approved", relation: "related" });
      expect(isAlignmentApprovedAndMapped(alignment)).toBe(true);

      const coverage = gatedPracticeCoverageResolver("test-node-approved", [alignment]);
      expect(coverage.supportingContentCount).toBe(1);
      expect(coverage.status).toBe("partial");
    });

    it("draft + published -> NOT counted", () => {
      const alignment = makeAlignment(publishedId, { reviewStatus: "draft", relation: "related" });
      expect(isAlignmentApprovedAndMapped(alignment)).toBe(false);

      const coverage = gatedPracticeCoverageResolver("test-node-draft", [alignment]);
      expect(coverage.supportingContentCount).toBe(0);
      expect(coverage.status).toBe("none");
    });

    it("in_review + published -> NOT counted", () => {
      const alignment = makeAlignment(publishedId, { reviewStatus: "in_review", relation: "related" });
      expect(isAlignmentApprovedAndMapped(alignment)).toBe(false);

      const coverage = gatedPracticeCoverageResolver("test-node-in-review", [alignment]);
      expect(coverage.supportingContentCount).toBe(0);
      expect(coverage.status).toBe("none");
    });

    it("rejected + published -> NOT counted", () => {
      const alignment = makeAlignment(publishedId, { reviewStatus: "rejected", relation: "related" });
      expect(isAlignmentApprovedAndMapped(alignment)).toBe(false);

      const coverage = gatedPracticeCoverageResolver("test-node-rejected", [alignment]);
      expect(coverage.supportingContentCount).toBe(0);
      expect(coverage.status).toBe("none");
    });

    it("unmapped + published -> NOT counted", () => {
      const alignment = makeAlignment(publishedId, { reviewStatus: "approved", relation: "unmapped" });
      expect(isAlignmentApprovedAndMapped(alignment)).toBe(false);

      const coverage = gatedPracticeCoverageResolver("test-node-unmapped", [alignment]);
      expect(coverage.supportingContentCount).toBe(0);
      expect(coverage.status).toBe("none");
    });

    it("approved + ungated -> NOT counted", () => {
      const ungatedId = practiceOnlyIds[0]!;
      const alignment = makeAlignment(ungatedId, { reviewStatus: "approved", relation: "related" });
      expect(isAlignmentApprovedAndMapped(alignment)).toBe(true);

      const coverage = gatedPracticeCoverageResolver("test-node-ungated", [alignment]);
      expect(coverage.supportingContentCount).toBe(0);
      expect(coverage.status).toBe("none");
    });
  });

  describe("2. Question-ID Annotation Parser & Strict Fail-Closed Behavior", () => {
    it("parses well-formed [Question ID: <id>] correctly", () => {
      const res = parseQuestionIdAnnotation("Aligned to Skill [Question ID: g3-nap-num-001]");
      expect(res.status).toBe("valid");
      expect(res.questionId).toBe("g3-nap-num-001");
    });

    it("fails closed on unclosed tag: [Question ID: q-1] text [Question ID:", () => {
      const res = parseQuestionIdAnnotation("[Question ID: q-1] text [Question ID:");
      expect(res.status).toBe("malformed");
      expect(res.questionId).toBeNull();
    });

    it("fails closed on mixed tag with empty ID: [Question ID: q-1] [Question ID: ]", () => {
      const res = parseQuestionIdAnnotation("[Question ID: q-1] [Question ID: ]");
      expect(res.status).toBe("malformed");
      expect(res.questionId).toBeNull();
    });

    it("fails closed on mixed tag with bad ID: [Question ID: q-1] [Question ID: bad@id]", () => {
      const res = parseQuestionIdAnnotation("[Question ID: q-1] [Question ID: bad@id]");
      expect(res.status).toBe("malformed");
      expect(res.questionId).toBeNull();
    });

    it("fails closed on unclosed second tag: [Question ID: q-1] [Question ID: q-2", () => {
      const res = parseQuestionIdAnnotation("[Question ID: q-1] [Question ID: q-2");
      expect(res.status).toBe("malformed");
      expect(res.questionId).toBeNull();
    });

    it("accepts identical redundant tags: [Question ID: q-1] [Question ID: q-1]", () => {
      const res = parseQuestionIdAnnotation("[Question ID: q-1] [Question ID: q-1]");
      expect(res.status).toBe("valid");
      expect(res.questionId).toBe("q-1");
    });

    it("fails closed on ambiguous multiple distinct question IDs: [Question ID: q-1] [Question ID: q-2]", () => {
      const res = parseQuestionIdAnnotation("[Question ID: q-1] [Question ID: q-2]");
      expect(res.status).toBe("ambiguous");
      expect(res.questionId).toBeNull();
    });

    it("extractQuestionIdsFromAlignments calls onMalformed and contributes ZERO IDs for mixed valid+malformed rationale", () => {
      const mixedAlignments = [
        makeAlignment("q-good", { rationale: "[Question ID: q-good]" }),
        makeAlignment("q-bad-mixed-1", { rationale: "[Question ID: q-1] text [Question ID:" }),
        makeAlignment("q-bad-mixed-2", { rationale: "[Question ID: q-1] [Question ID: ]" }),
        makeAlignment("q-bad-mixed-3", { rationale: "[Question ID: q-1] [Question ID: bad@id]" }),
        makeAlignment("q-bad-mixed-4", { rationale: "[Question ID: q-1] [Question ID: q-2" }),
        makeAlignment("q-ambiguous", { rationale: "[Question ID: q-1] [Question ID: q-2]" }),
      ];

      const malformedErrors: string[] = [];
      const extracted = extractQuestionIdsFromAlignments(mixedAlignments, {
        onlyApproved: true,
        onMalformed: (_alignment, error) => malformedErrors.push(error),
      });

      // Only the purely well-formed alignment contributes
      expect(extracted).toEqual(["q-good"]);
      // All 5 corrupted or ambiguous alignments triggered onMalformed
      expect(malformedErrors).toHaveLength(5);
    });
  });

  describe("3. Governed Bank Integration & Threshold Policies", () => {
    it("counts curated governed questions (questionBank)", () => {
      const curatedQuestion = curatedBank[0]!;
      const alignments = [makeAlignment(curatedQuestion.id)];
      const coverage = gatedPracticeCoverageResolver("test-node-curated", alignments);

      expect(coverage.supportingContentCount).toBe(1);
      expect(coverage.status).toBe("partial");
    });

    it("counts factory-published questions (factoryPublishedQuestions)", () => {
      const factoryQuestion = publishedBank.find((q) => q.id.startsWith("man-"));
      expect(factoryQuestion).toBeDefined();

      const alignments = [makeAlignment(factoryQuestion!.id)];
      const coverage = gatedPracticeCoverageResolver("test-node-factory", alignments);

      expect(coverage.supportingContentCount).toBe(1);
      expect(coverage.status).toBe("partial");
    });

    it("unmapped / empty alignments return zero coverage ('Coming soon')", () => {
      const coverage = gatedPracticeCoverageResolver("unmapped-node", []);

      expect(coverage.supportingContentCount).toBe(0);
      expect(coverage.status).toBe("none");
      expect(resolveCoverageBadge(coverage).state).toBe("empty");
      expect(resolveCoverageBadge(coverage).meta.label).toBe("Coming soon");
    });

    it("evaluates thresholds accurately (0 -> empty, 1-4 -> partial, >=5 -> covered)", () => {
      const customResolver = createGatedPracticeCoverageResolver({
        publishedBank: new Set(["pub-1", "pub-2", "pub-3", "pub-4", "pub-5"]),
      });

      // 0
      const cov0 = customResolver("n0", []);
      expect(cov0.supportingContentCount).toBe(0);
      expect(resolveCoverageBadge(cov0).state).toBe("empty");

      // 1
      const cov1 = customResolver("n1", [makeAlignment("pub-1")]);
      expect(cov1.supportingContentCount).toBe(1);
      expect(resolveCoverageBadge(cov1).state).toBe("partial");

      // 4
      const cov4 = customResolver("n4", [
        makeAlignment("pub-1"),
        makeAlignment("pub-2"),
        makeAlignment("pub-3"),
        makeAlignment("pub-4"),
      ]);
      expect(cov4.supportingContentCount).toBe(4);
      expect(resolveCoverageBadge(cov4).state).toBe("partial");

      // 5
      const cov5 = customResolver("n5", [
        makeAlignment("pub-1"),
        makeAlignment("pub-2"),
        makeAlignment("pub-3"),
        makeAlignment("pub-4"),
        makeAlignment("pub-5"),
      ]);
      expect(cov5.supportingContentCount).toBe(5);
      expect(resolveCoverageBadge(cov5).state).toBe("covered");
      expect(resolveCoverageBadge(cov5).meta.label).toBe("Ready to practise");
    });

    it("never leaks answer keys, prompts, rubrics, or solutions in the coverage payload", () => {
      const curatedQuestion = curatedBank[0]!;
      const alignments = [makeAlignment(curatedQuestion.id)];
      const coverage = gatedPracticeCoverageResolver("test-node-leak-check", alignments) as Record<string, unknown>;

      expect(Object.keys(coverage).sort()).toEqual(
        ["computedAt", "policyId", "status", "supportingContentCount"].sort(),
      );
      expect(coverage).not.toHaveProperty("answerKey");
      expect(coverage).not.toHaveProperty("prompt");
      expect(coverage).not.toHaveProperty("rubric");
      expect(coverage).not.toHaveProperty("solution");
    });

    it("deduplicates repeated question references so duplicate alignments cannot inflate count", () => {
      const sampleId = curatedBank[0]!.id;
      const duplicatedAlignments = Array.from({ length: 10 }, (_, i) =>
        makeAlignment(sampleId, {
          rationale: `Skill template variant #${i} [Question ID: ${sampleId}]`,
        }),
      );

      const extracted = extractQuestionIdsFromAlignments(duplicatedAlignments);
      expect(extracted).toEqual([sampleId]);

      const coverage = gatedPracticeCoverageResolver("dup-node", duplicatedAlignments);
      expect(coverage.supportingContentCount).toBe(1);
      expect(coverage.status).toBe("partial");
    });
  });

  describe("4. Repository Invariant Tests Over vic-f10-v2-l3-l5.json Manifest", () => {
    const manifest = JSON.parse(
      fs.readFileSync("content/curriculum-imports/vic-f10-v2-l3-l5.json", "utf8"),
    ) as {
      nodes: Array<{ nodeId: string; officialCode: string; label: string }>;
      taxonomyAlignments: Array<{
        alignmentId: string;
        curriculumNodeId: string;
        relation: string;
        rationale: string;
        review?: { status: string };
        review_status?: string;
      }>;
    };

    const practiceIdSet = new Set(practiceBank.map((q) => q.id));

    it("proves every approved mapped taxonomy alignment explicitly satisfies isAlignmentApprovedAndMapped and contains exactly one valid [Question ID: <id>]", () => {
      expect(manifest.taxonomyAlignments.length).toBeGreaterThan(0);

      const malformed: Array<{ alignmentId: string; error: string }> = [];
      let checkedApprovedCount = 0;

      for (const ta of manifest.taxonomyAlignments) {
        // Explicitly filter for approved and mapped alignments using isAlignmentApprovedAndMapped
        if (!isAlignmentApprovedAndMapped(ta)) {
          continue;
        }

        checkedApprovedCount++;
        const parsed = parseQuestionIdAnnotation(ta.rationale);
        if (parsed.status !== "valid" || !parsed.questionId) {
          malformed.push({
            alignmentId: ta.alignmentId,
            error: parsed.error ?? `Status was ${parsed.status}`,
          });
        }
      }

      /*
       * 751 pre-existing alignments plus 194 newly approved factory Level 5
       * alignments = 945 total approved alignments.
       */
      expect(checkedApprovedCount).toBe(945);
      expect(malformed).toEqual([]);
    });

    /*
     * NOTE ON SCOPE: this is a referential-integrity check only — every
     * [Question ID: ...] an approved alignment cites resolves to SOME real
     * question record somewhere (practiceExamBank ∪ curated ∪ published),
     * i.e. not a typo or a deleted question.
     */
    it("proves every extracted question ID from approved mapped alignments exists SOMEWHERE in real question data (referential integrity, not governed availability)", () => {
      const unknownIds: Array<{ alignmentId: string; questionId: string }> = [];

      for (const ta of manifest.taxonomyAlignments) {
        if (!isAlignmentApprovedAndMapped(ta)) continue;

        const parsed = parseQuestionIdAnnotation(ta.rationale);
        if (parsed.status === "valid" && parsed.questionId) {
          if (!practiceIdSet.has(parsed.questionId)) {
            unknownIds.push({
              alignmentId: ta.alignmentId,
              questionId: parsed.questionId,
            });
          }
        }
      }

      expect(unknownIds).toEqual([]);
    });

    it("proves an approved alignment pointing only at a seed-only (ungated) ID does NOT count as governed coverage", () => {
      // g5-num-perc-001 exists only in practiceQuestionSeeds, never in getExamBank("published").
      const seedOnlyAlignment = makeAlignment("g5-num-perc-001", {
        reviewStatus: "approved",
        relation: "related",
      });
      expect(isAlignmentApprovedAndMapped(seedOnlyAlignment)).toBe(true);

      const coverage = gatedPracticeCoverageResolver("seed-only-node", [seedOnlyAlignment]);
      expect(coverage.supportingContentCount).toBe(0);
      expect(coverage.status).toBe("none");
    });

    it("VC2M3A01 parent practice availability and student resolver agree on 0 servable questions", () => {
      const studentQuestions = resolveQuestionsForCurriculumNode("VC2M3A01");
      expect(studentQuestions).toHaveLength(0);

      const a01Node = manifest.nodes.find((n) => n.officialCode === "VC2M3A01");
      expect(a01Node).toBeDefined();

      const a01Alignments = manifest.taxonomyAlignments.filter(
        (t) => t.curriculumNodeId === a01Node!.nodeId,
      );

      const parentCoverage = gatedPracticeCoverageResolver(a01Node!.nodeId, a01Alignments);
      expect(parentCoverage.supportingContentCount).toBe(0);
      expect(parentCoverage.status).toBe("none");

      const parentBadge = resolveCoverageBadge(parentCoverage);
      expect(parentBadge.state).toBe("empty");
      expect(parentBadge.meta.label).toBe("Coming soon");
    });

    it("all 54 Level 3 nodes have parent gated counts exactly matching student resolver counts", () => {
      const l3Nodes = manifest.nodes.filter(
        (n) => n.officialCode?.startsWith("VC2M3") || n.officialCode?.startsWith("VC2E3"),
      );
      expect(l3Nodes).toHaveLength(54);

      for (const node of l3Nodes) {
        const studentQuestions = resolveQuestionsForCurriculumNode(node.officialCode);
        const studentCount = studentQuestions.length;

        const alignments = manifest.taxonomyAlignments.filter(
          (t) => t.curriculumNodeId === node.nodeId,
        );
        const parentCoverage = gatedPracticeCoverageResolver(node.nodeId, alignments);

        expect(
          parentCoverage.supportingContentCount,
          `Mismatch on node ${node.officialCode}`,
        ).toBe(studentCount);
      }
    });

    it("evaluates all 50 Level 5 nodes without special cases, yielding 49 covered / 1 partial / 0 empty", () => {
      const l5Nodes = manifest.nodes.filter(
        (n) => n.officialCode?.startsWith("VC2M5") || n.officialCode?.startsWith("VC2E5"),
      );
      expect(l5Nodes).toHaveLength(50);

      let coveredCount = 0;
      let partialCount = 0;
      let emptyCount = 0;

      for (const node of l5Nodes) {
        const alignments = manifest.taxonomyAlignments.filter(
          (t) => t.curriculumNodeId === node.nodeId,
        );
        const coverage = gatedPracticeCoverageResolver(node.nodeId, alignments);
        const badge = resolveCoverageBadge(coverage);

        if (badge.state === "covered") coveredCount++;
        else if (badge.state === "partial") partialCount++;
        else if (badge.state === "empty") emptyCount++;
      }

      expect(coveredCount).toBe(49);
      expect(partialCount).toBe(1);
      expect(emptyCount).toBe(0);
    });
  });
});
