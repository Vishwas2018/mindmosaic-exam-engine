import { z } from "zod";

import {
  questionBaseSchema,
  questionMetadataSchema,
} from "@/schemas/question.schema";

// Review-local extensions: these do not widen the student bank or its taxonomy.
export const scholarshipReviewSchema = questionBaseSchema
  .extend({
    type: z.enum(["multiple_choice", "reading_comprehension"]),
    examStyle: z.literal("scholarship_style"),
    yearLevel: z.literal(6),
    status: z.literal("draft").default("draft"),
    answerKey: z.object({
      kind: z.literal("single_option"),
      optionId: z.string().min(1),
    }),
    metadata: questionMetadataSchema.extend({
      subject: z.enum([
        "verbal_reasoning",
        "numerical_reasoning",
        "reading",
        "numeracy",
      ]),
      topic: z.string().default("Scholarship reasoning"),
      difficulty: z.enum(["easy", "medium", "hard", "challenging"]),
    }),
  })
  .superRefine((question, context) => {
    const ids = question.options.map((option) => option.id);
    if (
      ids.length < 2 ||
      new Set(ids).size !== ids.length ||
      !ids.includes(question.answerKey.optionId)
    ) {
      context.addIssue({
        code: "custom",
        message: "Options must be unique and contain the declared answer.",
      });
    }
    if (question.type === "reading_comprehension" && !question.stimulus) {
      context.addIssue({
        code: "custom",
        message: "Reading questions require their shared passage.",
      });
    }
  });

export type ReviewEntry = {
  source: string;
  contentHash: string;
  findings?: {
    reviewer: string;
    recommendation: string;
    difficultyEstimate?: string;
    difficultyVerdict?: string;
    notes?: string;
    semanticFlags: string[];
    originality?: string;
    myAnswer: string;
    working?: string;
  };
  approval?: { approvedBy: string; approvedAt: string };
  kind: "scholarship";
  question: z.infer<typeof scholarshipReviewSchema>;
};

export interface ReviewCatalogue {
  entries: ReviewEntry[];
  issues: string[];
  approvalsAvailable: boolean;
}
