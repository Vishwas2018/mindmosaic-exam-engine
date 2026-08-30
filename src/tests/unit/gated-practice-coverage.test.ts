import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { resolveCoverageBadge } from "@/features/curriculum/parent-content";
import {
  createGatedPracticeCoverageResolver,
  extractQuestionIdsFromAlignments,
  gatedPracticeCoverageResolver,
} from "@/server/curriculum/gated-practice-coverage";
import { getExamBank } from "@/server/exam-bank";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";

// Helper to construct mock alignment objects
function makeAlignment(questionId: string, rationale?: string) {
  return {
    curriculum_node_id: "test-node",
    taxonomy_node_id: "test-taxonomy",
    relation: "aligned",
    rationale: rationale ?? `Aligned to Skill [Question ID: ${questionId}]`,
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

  // 1. ungated generated practice questions are excluded
  it("1. excludes ungated generated practice questions from coverage count", () => {
    expect(practiceOnlyIds.length).toBeGreaterThan(0);
    const ungatedId = practiceOnlyIds[0]!;

    const alignments = [makeAlignment(ungatedId)];
    const coverage = gatedPracticeCoverageResolver("test-node-1", alignments);

    expect(coverage.supportingContentCount).toBe(0);
    expect(coverage.status).toBe("none");
  });

  // 2. curated governed questions are counted
  it("2. counts curated governed questions (questionBank)", () => {
    const curatedQuestion = curatedBank[0]!;
    expect(publishedIds.has(curatedQuestion.id)).toBe(true);

    const alignments = [makeAlignment(curatedQuestion.id)];
    const coverage = gatedPracticeCoverageResolver("test-node-2", alignments);

    expect(coverage.supportingContentCount).toBe(1);
    expect(coverage.status).toBe("partial");
  });

  // 3. factory-published questions are counted
  it("3. counts factory-published questions (factoryPublishedQuestions)", () => {
    const factoryQuestion = publishedBank.find((q) => q.id.startsWith("man-"));
    expect(factoryQuestion).toBeDefined();

    const alignments = [makeAlignment(factoryQuestion!.id)];
    const coverage = gatedPracticeCoverageResolver("test-node-3", alignments);

    expect(coverage.supportingContentCount).toBe(1);
    expect(coverage.status).toBe("partial");
  });

  // 4. mapped-but-not-published questions do not contribute coverage
  it("4. mapped-but-not-published / nonexistent question IDs do not contribute coverage", () => {
    const alignments = [
      makeAlignment("nonexistent-q-001"),
      makeAlignment("fictional-g5-question-999"),
      makeAlignment("draft-unverified-q-123"),
    ];
    const coverage = gatedPracticeCoverageResolver("test-node-4", alignments);

    expect(coverage.supportingContentCount).toBe(0);
    expect(coverage.status).toBe("none");
  });

  // 5. unmapped nodes return zero
  it("5. unmapped nodes with empty alignments return zero coverage", () => {
    const coverage = gatedPracticeCoverageResolver("unmapped-node-code", []);

    expect(coverage.supportingContentCount).toBe(0);
    expect(coverage.status).toBe("none");
    expect(resolveCoverageBadge(coverage).state).toBe("empty");
    expect(resolveCoverageBadge(coverage).meta.label).toBe("Coming soon");
  });

  // 6. threshold 0 -> empty ("Coming soon")
  it("6. evaluates threshold 0 as empty ('Coming soon')", () => {
    const customResolver = createGatedPracticeCoverageResolver({
      publishedBank: new Set(["pub-1", "pub-2"]),
    });

    const coverage = customResolver("node-0", [makeAlignment("other-1")]);
    expect(coverage.supportingContentCount).toBe(0);
    expect(coverage.status).toBe("none");

    const badge = resolveCoverageBadge(coverage);
    expect(badge.state).toBe("empty");
    expect(badge.meta.label).toBe("Coming soon");
    expect(badge.meta.variant).toBe("neutral");
  });

  // 7. threshold 1-4 -> partial ("In development")
  it("7. evaluates threshold 1 to 4 as partial ('In development')", () => {
    const customResolver = createGatedPracticeCoverageResolver({
      publishedBank: new Set(["pub-1", "pub-2", "pub-3", "pub-4"]),
    });

    // Exactly 1 question
    const cov1 = customResolver("node-1", [makeAlignment("pub-1")]);
    expect(cov1.supportingContentCount).toBe(1);
    expect(cov1.status).toBe("partial");
    expect(resolveCoverageBadge(cov1).state).toBe("partial");
    expect(resolveCoverageBadge(cov1).meta.label).toBe("In development");

    // Exactly 4 questions
    const cov4 = customResolver("node-4", [
      makeAlignment("pub-1"),
      makeAlignment("pub-2"),
      makeAlignment("pub-3"),
      makeAlignment("pub-4"),
    ]);
    expect(cov4.supportingContentCount).toBe(4);
    expect(cov4.status).toBe("partial");
    expect(resolveCoverageBadge(cov4).state).toBe("partial");
    expect(resolveCoverageBadge(cov4).meta.label).toBe("In development");
  });

  // 8. threshold >=5 -> covered ("Ready to practise")
  it("8. evaluates threshold >=5 as covered ('Ready to practise')", () => {
    const customResolver = createGatedPracticeCoverageResolver({
      publishedBank: new Set(["pub-1", "pub-2", "pub-3", "pub-4", "pub-5", "pub-6"]),
    });

    const cov5 = customResolver("node-5", [
      makeAlignment("pub-1"),
      makeAlignment("pub-2"),
      makeAlignment("pub-3"),
      makeAlignment("pub-4"),
      makeAlignment("pub-5"),
    ]);
    expect(cov5.supportingContentCount).toBe(5);
    expect(cov5.status).toBe("covered");
    expect(resolveCoverageBadge(cov5).state).toBe("covered");
    expect(resolveCoverageBadge(cov5).meta.label).toBe("Ready to practise");

    const cov6 = customResolver("node-6", [
      makeAlignment("pub-1"),
      makeAlignment("pub-2"),
      makeAlignment("pub-3"),
      makeAlignment("pub-4"),
      makeAlignment("pub-5"),
      makeAlignment("pub-6"),
    ]);
    expect(cov6.supportingContentCount).toBe(6);
    expect(cov6.status).toBe("covered");
    expect(resolveCoverageBadge(cov6).state).toBe("covered");
  });

  // 9. no answer/question payload is exposed by the coverage API/resolver
  it("9. never leaks answer keys, prompts, rubrics, or solutions in the coverage payload", () => {
    const curatedQuestion = curatedBank[0]!;
    const alignments = [makeAlignment(curatedQuestion.id)];
    const coverage = gatedPracticeCoverageResolver("test-node-leak-check", alignments) as Record<string, unknown>;

    // Must strictly conform to CurriculumCoverage schema
    expect(Object.keys(coverage).sort()).toEqual(
      ["computedAt", "policyId", "status", "supportingContentCount"].sort(),
    );
    expect(coverage).not.toHaveProperty("answerKey");
    expect(coverage).not.toHaveProperty("prompt");
    expect(coverage).not.toHaveProperty("rubric");
    expect(coverage).not.toHaveProperty("solution");
    expect(coverage).not.toHaveProperty("explanation");
    expect(coverage).not.toHaveProperty("questions");
  });

  // 10. coverage is deterministic
  it("10. coverage resolution is strictly deterministic across repeated invocations", () => {
    const sampleAlignments = [
      makeAlignment(curatedBank[0]!.id),
      makeAlignment(curatedBank[1]!.id),
      makeAlignment("nonexistent-1"),
    ];

    const run1 = gatedPracticeCoverageResolver("det-node", sampleAlignments);
    const run2 = gatedPracticeCoverageResolver("det-node", sampleAlignments);
    const run3 = gatedPracticeCoverageResolver("det-node", sampleAlignments);

    expect(run1.supportingContentCount).toBe(run2.supportingContentCount);
    expect(run2.supportingContentCount).toBe(run3.supportingContentCount);
    expect(run1.status).toBe(run2.status);
    expect(run2.status).toBe(run3.status);
  });

  // 11. duplicate/template variants cannot inflate coverage under the repository's canonical rules
  it("11. deduplicates repeated question references so duplicate alignments cannot inflate count", () => {
    const sampleId = curatedBank[0]!.id;
    // Same question ID repeated 10 times with slightly different rationale text
    const duplicatedAlignments = Array.from({ length: 10 }, (_, i) => ({
      curriculum_node_id: "dup-node",
      taxonomy_node_id: `skill-variant-${i}`,
      rationale: `Skill template variant #${i} [Question ID: ${sampleId}]`,
    }));

    const extracted = extractQuestionIdsFromAlignments(duplicatedAlignments);
    expect(extracted).toEqual([sampleId]);

    const coverage = gatedPracticeCoverageResolver("dup-node", duplicatedAlignments);
    expect(coverage.supportingContentCount).toBe(1);
    expect(coverage.status).toBe("partial"); // 1 is partial, not covered!
  });

  // 12. VC2M3A01 parent/student practice availability agrees
  it("12. VC2M3A01 parent practice availability and student resolver agree on 0 servable questions", () => {
    // Student lesson resolver
    const studentQuestions = resolveQuestionsForCurriculumNode("VC2M3A01");
    expect(studentQuestions).toHaveLength(0);

    // Manifest alignment for VC2M3A01
    const manifest = JSON.parse(
      fs.readFileSync("content/curriculum-imports/vic-f10-v2-l3-l5.json", "utf8"),
    ) as {
      nodes: Array<{ nodeId: string; officialCode: string }>;
      taxonomyAlignments: Array<{ curriculumNodeId: string; rationale: string }>;
    };
    const a01Node = manifest.nodes.find((n) => n.officialCode === "VC2M3A01");
    expect(a01Node).toBeDefined();

    const a01Alignments = manifest.taxonomyAlignments.filter(
      (t) => t.curriculumNodeId === a01Node!.nodeId,
    );

    // Parent gated coverage resolver
    const parentCoverage = gatedPracticeCoverageResolver(a01Node!.nodeId, a01Alignments);
    expect(parentCoverage.supportingContentCount).toBe(0);
    expect(parentCoverage.status).toBe("none");

    const parentBadge = resolveCoverageBadge(parentCoverage);
    expect(parentBadge.state).toBe("empty");
    expect(parentBadge.meta.label).toBe("Coming soon");
  });

  // 13. all Level 3 nodes have parent gated counts consistent with the student resolver's servable-question universe
  it("13. all 54 Level 3 nodes have parent gated counts exactly matching student resolver counts", () => {
    const manifest = JSON.parse(
      fs.readFileSync("content/curriculum-imports/vic-f10-v2-l3-l5.json", "utf8"),
    ) as {
      nodes: Array<{ nodeId: string; officialCode: string }>;
      taxonomyAlignments: Array<{ curriculumNodeId: string; rationale: string }>;
    };

    const l3Nodes = manifest.nodes.filter(
      (n) => n.officialCode?.startsWith("VC2M3") || n.officialCode?.startsWith("VC2E3"),
    );
    expect(l3Nodes).toHaveLength(54);

    for (const node of l3Nodes) {
      // Student resolver count
      const studentQuestions = resolveQuestionsForCurriculumNode(node.officialCode);
      const studentCount = studentQuestions.length;

      // Parent resolver count
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

  // 14. all 50 Level 5 nodes can be evaluated without special-case code
  it("14. evaluates all 50 Level 5 nodes without special cases, yielding 15 covered / 12 partial / 23 empty", () => {
    const manifest = JSON.parse(
      fs.readFileSync("content/curriculum-imports/vic-f10-v2-l3-l5.json", "utf8"),
    ) as {
      nodes: Array<{ nodeId: string; officialCode: string }>;
      taxonomyAlignments: Array<{ curriculumNodeId: string; rationale: string }>;
    };

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

    expect(coveredCount).toBe(15);
    expect(partialCount).toBe(12);
    expect(emptyCount).toBe(23);
  });
});
