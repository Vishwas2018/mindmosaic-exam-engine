import { z } from "zod";

import {
  ISOLABLE_SUBJECT_FILTERS,
  type ExamStyleFilter,
  type SubjectFilter,
  type YearLevelFilter,
} from "../selection";

export const standardPracticeParamsSchema = z.object({
  mode: z.literal("standard").default("standard"),
  subject: z
    .string()
    .nullish()
    .transform((val): SubjectFilter => {
      if (!val) return "mixed";
      const match = ISOLABLE_SUBJECT_FILTERS.find((s) => s === val);
      return match ?? "mixed";
    }),
  year: z
    .string()
    .nullish()
    .transform((val): YearLevelFilter => {
      if (val === "3") return 3;
      if (val === "5") return 5;
      return "mixed";
    }),
  style: z
    .string()
    .nullish()
    .transform((val): ExamStyleFilter => {
      if (val === "naplan_style" || val === "icas_style") return val;
      return "mixed";
    }),
  skill: z
    .string()
    .nullish()
    .transform((val) => {
      if (!val) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed.slice(0, 100) : null;
    }),
  count: z
    .string()
    .nullish()
    .transform((val) => {
      if (!val) return 8;
      const parsed = parseInt(val, 10);
      if (Number.isNaN(parsed) || parsed < 1) return 8;
      return Math.min(parsed, 50);
    }),
  seed: z
    .string()
    .nullish()
    .transform((val) => {
      if (!val) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed.slice(0, 200) : null;
    }),
  extended: z
    .string()
    .nullish()
    .transform((val) => val === "1"),
  launchId: z.string().nullish().transform(() => null),
  curriculumCode: z
    .string()
    .nullish()
    .transform((val) => {
      if (!val) return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed.slice(0, 100) : null;
    }),
});

export const drillPracticeParamsSchema = z.object({
  mode: z.literal("drill"),
  launchId: z
    .string({ message: "Launch ID is required for drill mode" })
    .trim()
    .min(1, "Launch ID is required for drill mode")
    .max(100),
});

export const practiceSessionParamsSchema = z.discriminatedUnion("mode", [
  standardPracticeParamsSchema,
  drillPracticeParamsSchema,
]);

export type StandardPracticeParams = z.infer<typeof standardPracticeParamsSchema>;
export type DrillPracticeParams = z.infer<typeof drillPracticeParamsSchema>;
export type PracticeSessionParams = z.infer<typeof practiceSessionParamsSchema>;

export type ParsedPracticeParamsResult =
  | {
      ok: true;
      mode: "standard";
      params: StandardPracticeParams;
    }
  | {
      ok: true;
      mode: "drill";
      params: DrillPracticeParams;
    }
  | {
      ok: false;
      mode: "drill" | "standard";
      error: string;
    };

/**
 * Parse and validate raw search params into a typed discriminated result.
 * Enforces an opaque contract for drill mode (mode=drill&launchId=<id>) while
 * preserving forgiving backwards-compatible defaults for standard mode.
 */
export function parsePracticeSessionParams(
  searchParams: { get: (key: string) => string | null } | URLSearchParams,
): ParsedPracticeParamsResult {
  const rawMode = searchParams.get("mode");
  const isDrill = rawMode === "drill";

  if (isDrill) {
    const raw = {
      mode: "drill" as const,
      launchId: searchParams.get("launchId") ?? "",
    };

    const parsed = drillPracticeParamsSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const errorMessage = issue
        ? `${issue.path.join(".")}: ${issue.message}`
        : "Invalid practice drill parameters.";
      return {
        ok: false,
        mode: "drill",
        error: errorMessage,
      };
    }

    return {
      ok: true,
      mode: "drill",
      params: parsed.data,
    };
  }

  const rawStandard = {
    mode: "standard" as const,
    subject: searchParams.get("subject"),
    year: searchParams.get("year"),
    style: searchParams.get("style"),
    skill: searchParams.get("skill"),
    count: searchParams.get("count"),
    seed: searchParams.get("seed"),
    extended: searchParams.get("extended"),
    launchId: null,
    curriculumCode: searchParams.get("curriculumCode") ?? searchParams.get("node"),
  };

  const parsedStandard = standardPracticeParamsSchema.safeParse(rawStandard);
  if (parsedStandard.success) {
    return {
      ok: true,
      mode: "standard",
      params: parsedStandard.data,
    };
  }

  return {
    ok: true,
    mode: "standard",
    params: {
      mode: "standard",
      subject: "mixed",
      year: "mixed",
      style: "mixed",
      skill: null,
      count: 8,
      seed: null,
      extended: false,
      launchId: null,
      curriculumCode: null,
    },
  };
}
