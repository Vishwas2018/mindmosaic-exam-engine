import { describe, expect, it } from "vitest";

import {
  checkPublicationEligibility,
  parsePrimaryNumericToken,
  type PublicationEligibilityContext,
} from "@/features/question-factory/publication/eligibility";
import type { FactoryRepository } from "@/features/question-factory/storage";
import { hashJson } from "@/features/question-factory/provenance";

describe("publish-gate solver verification & fail-closed invariants", () => {
  describe("parsePrimaryNumericToken", () => {
    it("extracts integers and negative numbers with units", () => {
      expect(parsePrimaryNumericToken("-70 m")).toBe(-70);
      expect(parsePrimaryNumericToken("-3°C")).toBe(-3);
      expect(parsePrimaryNumericToken("420 km")).toBe(420);
      expect(parsePrimaryNumericToken("75°")).toBe(75);
    });

    it("extracts currency values with commas and dollar signs", () => {
      expect(parsePrimaryNumericToken("$24,000")).toBe(24000);
      expect(parsePrimaryNumericToken("$108")).toBe(108);
      expect(parsePrimaryNumericToken("$3")).toBe(3);
      expect(parsePrimaryNumericToken("10 cents")).toBe(10);
    });

    it("extracts decimals and percentages", () => {
      expect(parsePrimaryNumericToken("12.5 kg")).toBe(12.5);
      expect(parsePrimaryNumericToken("30%")).toBe(30);
    });

    it("parses only the first numeric token without concatenating disjoint numbers", () => {
      // Must return 2, never 230
      expect(parsePrimaryNumericToken("2 hours 30 minutes")).toBe(2);
      expect(parsePrimaryNumericToken("step 4 of 10")).toBe(4);
    });

    it("returns null for non-numeric text", () => {
      expect(parsePrimaryNumericToken("no numbers here")).toBeNull();
      expect(parsePrimaryNumericToken("")).toBeNull();
    });
  });

  describe("fail-closed gate checks in checkPublicationEligibility", () => {
    // Minimal mock repo that passes upstream gate chain
    const mockRepo: FactoryRepository = {
      read: async () => undefined,
      write: async () => {},
      exists: async () => true,
      remove: async () => {},
      list: async () => [],
      readAll: async () => [],
    } as unknown as FactoryRepository;

    function buildContext(overrides: {
      options?: Array<{ id: string; text: string }>;
      answerKey: Record<string, unknown>;
      solverParams: Record<string, unknown>;
    }): PublicationEligibilityContext {
      const q = {
        id: "candidate-test-001",
        type: overrides.answerKey.kind === "number" ? "short_answer" : "multiple_choice",
        yearLevel: 6,
        examStyle: "scholarship_style",
        prompt: "Calculate the value",
        options: overrides.options ?? [
          { id: "a", text: "12" },
          { id: "b", text: "20" },
          { id: "c", text: "120" },
          { id: "d", text: "-50 m" },
          { id: "e", text: "-70 m" },
        ],
        visuals: [],
        answerKey: overrides.answerKey,
        explanation: "Test explanation text.",
        metadata: {
          subject: "numeracy",
          strand: "Directed Numbers",
          skill: "maths-directed-numbers",
          difficulty: "medium",
          marks: 1,
          estimatedTimeSeconds: 45,
          tags: ["test"],
        },
        solverParams: overrides.solverParams,
      };

      const contentHash = hashJson(q);

      return {
        candidateId: "candidate-test-001",
        question: q as unknown as PublicationEligibilityContext["question"],
        provenance: {
          candidateId: "candidate-test-001",
          blueprintId: "bp-test",
          batchId: "b-test",
          pipelineRunId: "run-test",
          revision: 1,
          generatedAt: "2026-10-14T00:00:00.000Z",
          generatorAdapter: {
            class: "manual_external",
            identity: { provider: "human", modelId: "human", modelFamily: "human", interactionMode: "external_manual" },
          },
          generatorVersion: "1.0.0",
          promptVersion: "1.0.0",
          schemaVersion: "1.0.0",
          taxonomyVersion: "1.0.0",
          contentHash,
          reviewRecords: [],
        },
      };
    }

    it("NEGATIVE TEST: fails closed when wrong answer has the right unit ('-50 m' vs solver '-70')", async () => {
      const ctx = buildContext({
        answerKey: { kind: "single_option", optionId: "d" }, // option "d" is "-50 m"
        solverParams: {
          solver: "arithmetical_reasoning",
          solverParams: {
            variables: [{ name: "X", min: -100, max: 0 }],
            constraints: ["X === -70"],
            targetVariable: "X",
          },
          targetOption: "d",
          correctValue: "-50 m",
        },
      });

      const res = await checkPublicationEligibility(ctx, mockRepo);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        const solverIssue = res.issues.find((i) => i.code === "publication_solver_verification_failed");
        expect(solverIssue).toBeDefined();
        expect(solverIssue?.message).toContain("does not match solver computed value '-70'");
      }
    });

    it("NEGATIVE TEST: fails closed when solver result is a substring of the option text ('12' vs option '120')", async () => {
      const ctx = buildContext({
        answerKey: { kind: "single_option", optionId: "c" }, // option "c" is "120"
        solverParams: {
          solver: "arithmetical_reasoning",
          solverParams: {
            variables: [{ name: "X", min: 1, max: 20 }],
            constraints: ["X === 12"],
            targetVariable: "X",
          },
          targetOption: "c",
          correctValue: "120",
        },
      });

      const res = await checkPublicationEligibility(ctx, mockRepo);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        const solverIssue = res.issues.find((i) => i.code === "publication_solver_verification_failed");
        expect(solverIssue).toBeDefined();
        expect(solverIssue?.message).toContain("does not match solver computed value '12'");
      }
    });

    it("NEGATIVE TEST: fails closed when number-entry item has a mismatching solver result", async () => {
      const ctx = buildContext({
        answerKey: { kind: "number", value: 15, tolerance: 0 },
        solverParams: {
          solver: "arithmetical_reasoning",
          solverParams: {
            variables: [{ name: "X", min: 1, max: 30 }],
            constraints: ["X === 20"],
            targetVariable: "X",
          },
        },
      });

      const res = await checkPublicationEligibility(ctx, mockRepo);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        const solverIssue = res.issues.find((i) => i.code === "publication_solver_verification_failed");
        expect(solverIssue).toBeDefined();
        expect(solverIssue?.message).toContain("Number answer key value 15 does not match solver computed value 20");
      }
    });

    it("NEGATIVE TEST: fails closed when an unsupported answerKey kind has solverParams (never compute and ignore)", async () => {
      const ctx = buildContext({
        answerKey: { kind: "text", acceptableAnswers: ["42"] },
        solverParams: {
          solver: "arithmetical_reasoning",
          solverParams: {
            variables: [{ name: "X", min: 1, max: 50 }],
            constraints: ["X === 42"],
            targetVariable: "X",
          },
        },
      });

      const res = await checkPublicationEligibility(ctx, mockRepo);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        const solverIssue = res.issues.find((i) => i.code === "publication_solver_verification_failed");
        expect(solverIssue).toBeDefined();
        expect(solverIssue?.message).toContain("Solver verification is not supported for answer key kind 'text'");
      }
    });

    it("POSITIVE TEST: passes solver verification when number-entry item matches solver result", async () => {
      const ctx = buildContext({
        answerKey: { kind: "number", value: 42, tolerance: 0 },
        solverParams: {
          solver: "arithmetical_reasoning",
          solverParams: {
            variables: [{ name: "X", min: 1, max: 50 }],
            constraints: ["X === 42"],
            targetVariable: "X",
          },
        },
      });

      const res = await checkPublicationEligibility(ctx, mockRepo);
      // Fails only on upstream gate chain (mockRepo has no real manifest), but MUST have 0 solver issues!
      if (!res.ok) {
        const solverIssues = res.issues.filter((i) => i.code === "publication_solver_verification_failed");
        expect(solverIssues).toHaveLength(0);
      }
    });

    it("POSITIVE TEST: passes solver verification when single-option has unit-formatted text matching numeric solver output", async () => {
      const ctx = buildContext({
        answerKey: { kind: "single_option", optionId: "e" }, // option "e" is "-70 m"
        solverParams: {
          solver: "arithmetical_reasoning",
          solverParams: {
            variables: [{ name: "X", min: -100, max: 0 }],
            constraints: ["X === -70"],
            targetVariable: "X",
          },
          targetOption: "e",
          correctValue: "-70 m",
        },
      });

      const res = await checkPublicationEligibility(ctx, mockRepo);
      if (!res.ok) {
        const solverIssues = res.issues.filter((i) => i.code === "publication_solver_verification_failed");
        expect(solverIssues).toHaveLength(0);
      }
    });
  });
});
