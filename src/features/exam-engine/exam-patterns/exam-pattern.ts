import { z } from "zod";

import { getStrandsForSubject } from "@/features/taxonomy/subject-registry";

import { parseProgrammeId } from "./programme-id";

/**
 * The shape of one full-length practice paper: how many questions, how long,
 * how it is composed, and — just as load-bearing — how it departs from the
 * assessment it is modelled on. Questions are drawn live from the published
 * bank at sitting time by the existing seeded selection, so a pattern fixes
 * the SHAPE and the bank supplies the content.
 *
 * Transcribed from `docs/content-status/exam-patterns.md` §4 (v3). The field
 * is `sources`; earlier drafts called it `drawsFrom`/`programmeIds` and the
 * doc explicitly forbids reintroducing either.
 */

/**
 * Fidelity is three independent properties, never one label (§1).
 *
 * `presentation` is what the child is told they are sitting.
 * `basis` is whether the count and duration match published figures — and
 * nothing more; it never claims the internal structure is authentic.
 * `adaptations` names every departure, and the UI must show them.
 */
export const examPatternPresentationSchema = z.enum([
  "full_length_practice",
  "practice_module",
]);
export type ExamPatternPresentation = z.infer<typeof examPatternPresentationSchema>;

export const examPatternBasisSchema = z.enum(["official_length_and_time", "internal"]);
export type ExamPatternBasis = z.infer<typeof examPatternBasisSchema>;

export const ADAPTATIONS = [
  /** Real NAPLAN is adaptive (three-stage tailored); ours is a fixed path. */
  "fixed_path",
  /** No audio dictation available, so spelling is delivered as text. */
  "text_only_spelling",
  /** Cannot prevent returning to a completed section. */
  "no_section_lock",
  /** The ICAS English area split is ours, not published. */
  "internal_english_mix",
] as const;

export const adaptationSchema = z.enum(ADAPTATIONS);
export type Adaptation = z.infer<typeof adaptationSchema>;

/**
 * One source-bank quota: how many questions to draw from which programme,
 * optionally narrowed further.
 *
 * `display` decides whether the child ever sees a boundary here.
 * `"section"` is a user-visible part of the paper (NAPLAN language:
 * spelling, then grammar and punctuation). `"merged"` is an INTERNAL
 * composition control that must never be rendered as a section — the ICAS
 * English 27/18 and 30/20 allocations are MindMosaic's own, not published
 * ICAS counts, and the child sits one undivided English paper.
 */
export const patternSourceSchema = z.object({
  id: z.string().min(1),
  programmeId: z.string().min(1),
  count: z.number().int().positive(),
  filters: z
    .object({
      /** Registered strand LABELS for the source's subject. */
      strandIn: z.array(z.string().min(1)).min(1).optional(),
      typeIn: z.array(z.string().min(1)).min(1).optional(),
      difficultyMix: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
  display: z.enum(["merged", "section"]),
});
export type PatternSource = z.infer<typeof patternSourceSchema>;

/**
 * Ordered, user-visible sections. Only meaningful where the sources it names
 * are `display: "section"`.
 *
 * `locked` is always false today and the schema enforces it: officially the
 * NAPLAN spelling section closes once grammar and punctuation begins, and
 * this engine cannot do that (`no_section_lock`). A pattern that declared
 * `locked: true` would be a promise the runtime does not keep, so it is
 * rejected rather than quietly ignored.
 */
export const patternSectionOrderSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
  locked: z.literal(false),
});
export type PatternSectionOrder = z.infer<typeof patternSectionOrderSchema>;

/**
 * Reading papers only. Questions sharing a stimulus are one unit: selecting
 * them individually produces orphaned questions from a passage, or the same
 * passage twice in one paper. Both bounds come from the doc's composition
 * column (4–7 questions per text; Y3 6–7 texts, Y5 6).
 */
export const stimulusRuleSchema = z.object({
  selectWholeGroup: z.literal(true),
  questionsPerStimulus: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  distinctStimuli: z.tuple([z.number().int().positive(), z.number().int().positive()]),
});
export type StimulusRule = z.infer<typeof stimulusRuleSchema>;

/**
 * Whether a pattern can be sat at all.
 *
 * `deferred` is the doc's ⏸️ — the writing patterns. They are registered so
 * the picker can say what is coming rather than pretend the subject does not
 * exist, and they are never startable: a writing task is rubric-marked, and
 * the selection engine has no writing-only filter to draw one with.
 */
export const examPatternStatusSchema = z.enum(["available", "deferred"]);
export type ExamPatternStatus = z.infer<typeof examPatternStatusSchema>;

export const examPatternSchema = z
  .object({
    /** URL segment of /exams/[patternId]; unique across the registry. */
    id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, "Pattern ids are URL segments: lower-case, hyphens only."),
    label: z.string().min(1),
    examStyle: z.enum(["naplan_style", "icas_style"]),
    yearLevel: z.union([z.literal(3), z.literal(5)]),

    presentation: examPatternPresentationSchema,
    basis: examPatternBasisSchema,
    /*
     * Required, and may legitimately be empty: an ICAS Mathematics paper
     * departs from the real assessment in none of the four ways the doc
     * enumerates. The superRefine below enforces the departures that ARE
     * real — NAPLAN's fixed path, text-only spelling, unlockable sections,
     * the internal English mix — so an empty list is a claim the registry
     * has checked, not one it forgot to make.
     */
    adaptations: z.array(adaptationSchema),

    questionCount: z.number().int().positive(),
    timeMinutes: z.number().int().positive(),

    sources: z.array(patternSourceSchema).min(1),
    sectionOrder: z.array(patternSectionOrderSchema).min(1).optional(),
    stimulusRule: stimulusRuleSchema.optional(),

    status: examPatternStatusSchema.default("available"),
  })
  .superRefine((pattern, ctx) => {
    const sourceIds = new Set<string>();
    for (const source of pattern.sources) {
      if (sourceIds.has(source.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["sources"],
          message: `Duplicate source id '${source.id}'.`,
        });
      }
      sourceIds.add(source.id);

      /* Every programmeId must name a real sitting, and must agree with the
         pattern's own year and style — a Year 5 pattern drawing from a Year 3
         bank would silently serve the wrong paper. */
      const scope = parseProgrammeId(source.programmeId);
      if (!scope) {
        ctx.addIssue({
          code: "custom",
          path: ["sources"],
          message: `'${source.programmeId}' does not name a real sitting.`,
        });
        continue;
      }
      if (scope.yearLevel !== pattern.yearLevel || scope.examStyle !== pattern.examStyle) {
        ctx.addIssue({
          code: "custom",
          path: ["sources"],
          message: `'${source.programmeId}' does not match the pattern's year level and exam style.`,
        });
      }
      /* A strand filter that names a strand the subject does not have would
         silently select nothing — the exact failure mode that looks like an
         empty bank. Checked against the same registry the content validator
         uses, so a renamed strand breaks here rather than at sitting time. */
      const registered = getStrandsForSubject(scope.subjectId).map((strand) =>
        strand.label.trim().toLocaleLowerCase("en-AU"),
      );
      for (const label of source.filters?.strandIn ?? []) {
        if (!registered.includes(label.trim().toLocaleLowerCase("en-AU"))) {
          ctx.addIssue({
            code: "custom",
            path: ["sources"],
            message: `Strand '${label}' is not registered for subject '${scope.subjectId}'.`,
          });
        }
      }
      /* An available pattern must be drawable. `writing` resolves to a real
         programme but has no isolating filter, which is precisely why the
         writing patterns are deferred. */
      if (pattern.status === "available" && scope.subject === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["sources"],
          message: `Subject '${scope.subjectId}' cannot be isolated by the selection engine, so a pattern drawing from '${source.programmeId}' cannot be 'available'.`,
        });
      }
    }

    const total = pattern.sources.reduce((sum, source) => sum + source.count, 0);
    if (total !== pattern.questionCount) {
      ctx.addIssue({
        code: "custom",
        path: ["sources"],
        message: `Source counts total ${total}, which is not the pattern's ${pattern.questionCount} questions.`,
      });
    }

    for (const section of pattern.sectionOrder ?? []) {
      for (const sourceId of section.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          ctx.addIssue({
            code: "custom",
            path: ["sectionOrder"],
            message: `Section '${section.id}' names source '${sourceId}', which the pattern does not declare.`,
          });
          continue;
        }
        const source = pattern.sources.find((candidate) => candidate.id === sourceId)!;
        if (source.display !== "section") {
          ctx.addIssue({
            code: "custom",
            path: ["sectionOrder"],
            message: `Section '${section.id}' names source '${sourceId}', which is display: "merged" and must not be shown as a section.`,
          });
        }
      }
    }

    /* Every source the pattern declares as a visible section must appear in
       sectionOrder, or the paper would have an unordered visible boundary. */
    const orderedSourceIds = new Set(
      (pattern.sectionOrder ?? []).flatMap((section) => section.sourceIds),
    );
    for (const source of pattern.sources) {
      if (source.display === "section" && !orderedSourceIds.has(source.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["sectionOrder"],
          message: `Source '${source.id}' is display: "section" but no section orders it.`,
        });
      }
    }

    /* A visible section boundary the engine cannot lock must be declared as
       such — the one adaptation a section-bearing pattern always carries. */
    const hasVisibleSections = pattern.sources.some(
      (source) => source.display === "section",
    );
    if (hasVisibleSections && !pattern.adaptations.includes("no_section_lock")) {
      ctx.addIssue({
        code: "custom",
        path: ["adaptations"],
        message: "A pattern with visible sections must declare 'no_section_lock'.",
      });
    }

    /* Real NAPLAN is a three-stage tailored test and every pattern here is a
       single linear path, without exception. */
    if (pattern.examStyle === "naplan_style" && !pattern.adaptations.includes("fixed_path")) {
      ctx.addIssue({
        code: "custom",
        path: ["adaptations"],
        message: "Every NAPLAN-style pattern must declare 'fixed_path'.",
      });
    }

    /* Both spelling pathways are delivered by audio officially — NAPLAN's
       25-item spelling section (16 dictation + 9 proofreading) and the whole
       ICAS Spelling Bee. This platform has no audio, so any pattern carrying
       spelling content must say so. Detected from the sources rather than
       listed by hand, so a new spelling-bearing pattern cannot forget. */
    const carriesSpelling = pattern.sources.some((source) => {
      const scope = parseProgrammeId(source.programmeId);
      if (scope?.subjectId === "spelling") return true;
      return (source.filters?.strandIn ?? []).some(
        (label) => label.trim().toLocaleLowerCase("en-AU") === "spelling",
      );
    });
    if (carriesSpelling && !pattern.adaptations.includes("text_only_spelling")) {
      ctx.addIssue({
        code: "custom",
        path: ["adaptations"],
        message:
          "A pattern drawing spelling content must declare 'text_only_spelling' — there is no audio dictation.",
      });
    }

    /* Drawing from more than one programme is an internal composition the
       child never sees a boundary for, which is only honest if the pattern
       says the mix is ours. */
    const programmes = new Set(pattern.sources.map((source) => source.programmeId));
    if (
      programmes.size > 1 &&
      pattern.sources.some((source) => source.display === "merged") &&
      !pattern.adaptations.includes("internal_english_mix")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["adaptations"],
        message:
          "A pattern merging more than one programme must declare 'internal_english_mix'.",
      });
    }

    if (pattern.stimulusRule) {
      const [minPerStimulus, maxPerStimulus] = pattern.stimulusRule.questionsPerStimulus;
      const [minStimuli, maxStimuli] = pattern.stimulusRule.distinctStimuli;
      if (minPerStimulus > maxPerStimulus) {
        ctx.addIssue({
          code: "custom",
          path: ["stimulusRule"],
          message: "questionsPerStimulus is not an ascending range.",
        });
      }
      if (minStimuli > maxStimuli) {
        ctx.addIssue({
          code: "custom",
          path: ["stimulusRule"],
          message: "distinctStimuli is not an ascending range.",
        });
      }
      /* The question count has to be reachable by whole groups within the
         declared bounds, or no draw could ever satisfy the pattern. */
      if (
        pattern.questionCount < minStimuli * minPerStimulus ||
        pattern.questionCount > maxStimuli * maxPerStimulus
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["stimulusRule"],
          message: `${pattern.questionCount} questions cannot be composed from ${minStimuli}-${maxStimuli} stimuli of ${minPerStimulus}-${maxPerStimulus} questions.`,
        });
      }
    }
  });

export type ExamPattern = z.infer<typeof examPatternSchema>;

/** The sources of one visible section, in the order the section names them. */
export function sourcesForSection(
  pattern: ExamPattern,
  section: PatternSectionOrder,
): readonly PatternSource[] {
  return section.sourceIds.flatMap((sourceId) => {
    const source = pattern.sources.find((candidate) => candidate.id === sourceId);
    return source ? [source] : [];
  });
}

/**
 * Sources in the order they are sat.
 *
 * Where a pattern declares `sectionOrder`, that order wins — the whole point
 * of NAPLAN language's spelling-then-grammar sequence. Everything else keeps
 * registry order, which for a merged pattern is only an internal draw order:
 * the child sees one undivided paper.
 */
export function sourcesInSittingOrder(pattern: ExamPattern): readonly PatternSource[] {
  if (!pattern.sectionOrder) return pattern.sources;
  const ordered = pattern.sectionOrder.flatMap((section) =>
    sourcesForSection(pattern, section),
  );
  const seen = new Set(ordered.map((source) => source.id));
  return [...ordered, ...pattern.sources.filter((source) => !seen.has(source.id))];
}

/** Whether the child is ever shown a boundary inside this paper. */
export function hasVisibleSections(pattern: ExamPattern): boolean {
  return pattern.sources.some((source) => source.display === "section");
}

/** Whether a question's free-text strand satisfies a source's strand filter. */
export function matchesStrandFilter(
  source: PatternSource,
  strand: string | undefined,
): boolean {
  const strandIn = source.filters?.strandIn;
  if (!strandIn) return true;
  if (strand === undefined) return false;
  const wanted = strand.trim().toLocaleLowerCase("en-AU");
  return strandIn.some((label) => label.trim().toLocaleLowerCase("en-AU") === wanted);
}

/** Whether a question's type satisfies a source's type filter. */
export function matchesTypeFilter(source: PatternSource, type: string): boolean {
  const typeIn = source.filters?.typeIn;
  return typeIn === undefined || typeIn.includes(type);
}
