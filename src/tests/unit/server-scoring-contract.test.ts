import { describe, expect, it } from "vitest";
import {
  createSessionRequestSchema,
  examSelectionConfigSchema,
  submitSessionRequestSchema,
} from "@/features/exam-engine/scoring/server-scoring-contract";

describe("server-scoring-contract", () => {
  describe("examSelectionConfigSchema", () => {
    it("accepts scholarship_style with verbal_reasoning and numerical_reasoning", () => {
      const vrConfig = {
        yearLevel: 6,
        examStyle: "scholarship_style",
        subject: "verbal_reasoning",
        questionCount: 45,
        timing: "timed",
      };
      const nrConfig = {
        yearLevel: 6,
        examStyle: "scholarship_style",
        subject: "numerical_reasoning",
        questionCount: 40,
        timing: "timed",
      };

      expect(examSelectionConfigSchema.safeParse(vrConfig).success).toBe(true);
      expect(examSelectionConfigSchema.safeParse(nrConfig).success).toBe(true);
    });

    it("accepts amc_style (closing known contract gap)", () => {
      const amcConfig = {
        yearLevel: 5,
        examStyle: "amc_style",
        subject: "amc_mathematics",
        questionCount: 30,
        timing: "timed",
      };
      const parsed = examSelectionConfigSchema.safeParse(amcConfig);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.examStyle).toBe("amc_style");
      }
    });

    it("accepts optional confidenceMode flag", () => {
      const untimedConfidence = {
        yearLevel: 6,
        examStyle: "scholarship_style",
        subject: "verbal_reasoning",
        questionCount: 45,
        timing: "untimed",
        confidenceMode: true,
      };
      const parsed = examSelectionConfigSchema.safeParse(untimedConfidence);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.confidenceMode).toBe(true);
      }
    });

    it("rejects unknown exam styles or invalid year levels", () => {
      const invalidStyle = {
        yearLevel: 6,
        examStyle: "sat_style",
        subject: "verbal_reasoning",
        questionCount: 45,
        timing: "timed",
      };
      expect(examSelectionConfigSchema.safeParse(invalidStyle).success).toBe(false);
    });
  });

  describe("createSessionRequestSchema and submitSessionRequestSchema", () => {
    it("validates session creation with scholarship config", () => {
      const payload = {
        config: {
          yearLevel: 6,
          examStyle: "scholarship_style",
          subject: "verbal_reasoning",
          questionCount: 45,
          timing: "timed",
        },
      };
      expect(createSessionRequestSchema.safeParse(payload).success).toBe(true);
    });

    it("validates submission request", () => {
      const payload = {
        responses: { "scholarship-y6-vr-001": "a" },
        submissionReason: "user_submitted",
      };
      expect(submitSessionRequestSchema.safeParse(payload).success).toBe(true);
    });
  });
});
