import "server-only";

import rawPilotBatch from "../../../../../content/vihaan-scholarship/pilot-01/draft.json";
import type { Question } from "@/schemas/question.schema";

/**
 * Vihaan Scholarship Prep — canonical 20-question pilot bank (`vihaan-pilot-01`).
 *
 * Re-exported strictly on the server from the schema-validated draft JSON at
 * `content/vihaan-scholarship/pilot-01/draft.json` so there is a single canonical
 * question source across content governance, validation scripts, and tests.
 * All items remain `status: "draft"` with `approvedBy: null` per ADR-017.
 */

export interface VihaanPilotDraftItem {
  readonly question: Question;
  readonly workedSolution: readonly string[];
  readonly reviewFocus: readonly string[];
  readonly writingGuidance: {
    readonly rubricId: string;
    readonly rubricVersion: number;
    readonly successCriteria: readonly string[];
    readonly assessmentMode: string;
  } | null;
}

export interface VihaanPilotBatch {
  readonly batchId: string;
  readonly version: number;
  readonly provenance: Record<string, unknown>;
  readonly approvedBy: null;
  readonly items: readonly VihaanPilotDraftItem[];
}

function assertDraftPilotBatch(batch: typeof rawPilotBatch): VihaanPilotBatch {
  if (batch.approvedBy !== null) {
    throw new Error("vihaan-pilot-01 draft bank must remain unapproved (approvedBy: null)");
  }

  for (const item of batch.items) {
    if (item.question.status !== "draft") {
      throw new Error(
        `vihaan-pilot-01 item ${item.question.id} must remain in draft status until governed approval`,
      );
    }
  }

  return batch as unknown as VihaanPilotBatch;
}

export const VIHAAN_PILOT_BATCH: VihaanPilotBatch = assertDraftPilotBatch(rawPilotBatch);

export const VIHAAN_PILOT_ITEMS: readonly VihaanPilotDraftItem[] = VIHAAN_PILOT_BATCH.items;

export const VIHAAN_PILOT_QUESTIONS: readonly Question[] = VIHAAN_PILOT_ITEMS.map(
  (item) => item.question,
);

export const MATH_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "numeracy",
);

export const NR_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "numerical_reasoning",
);

export const VR_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "verbal_reasoning",
);

export const RC_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "reading",
);

export const WE_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "writing",
);

export const VIHAAN_PILOT_COUNTS = {
  numeracy: MATH_QUESTIONS.length,
  numerical_reasoning: NR_QUESTIONS.length,
  verbal_reasoning: VR_QUESTIONS.length,
  reading: RC_QUESTIONS.length,
  writing: WE_QUESTIONS.length,
  mathematics: MATH_QUESTIONS.length,
  reading_comprehension: RC_QUESTIONS.length,
  written_expression: WE_QUESTIONS.length,
  total: VIHAAN_PILOT_QUESTIONS.length,
} as const;

export const VIHAAN_QUESTION_METADATA_BY_ID: ReadonlyMap<
  string,
  { readonly subject: string; readonly topic: string }
> = new Map(
  VIHAAN_PILOT_QUESTIONS.map((question) => [
    question.id,
    {
      subject: question.metadata.subject,
      topic: question.metadata.topic,
    },
  ]),
);
