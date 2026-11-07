import type { Question } from "@/schemas/question.schema";
import type { SubjectFilter } from "@/features/exam-engine/selection/selection-config";
import { filterEligibleQuestions } from "@/features/exam-engine/selection/select-questions";

/**
 * Practice Studio availability: what a student can honestly be offered, per
 * year / programme / subject / strand.
 *
 * Pure. It is handed the served bank and a verdict on whether the bank could be
 * checked; it never reads either itself, never touches the network, and never
 * sees an answer key (it reads prompt, options, stimulus, visuals, strand,
 * subject and `estimatedTimeSeconds` only). The server wrapper that feeds it is
 * `@/server/practice-studio-availability`.
 *
 * Design rules this module enforces (docs/plans/student-journey-trace-2026-11.md):
 *
 *  - C2  Groups on STRAND, not topic.
 *  - C3  The strand floor is a NEW Practice Studio rule, `STRAND_FLOOR`. It is not
 *        shared with, or borrowed from, the Learning Hub or the parent curriculum
 *        badge (src/features/curriculum/parent-content/index.ts), which sits on a
 *        different axis. No copy may attribute it to either.
 *  - C4  Strand labels are normalised at READ time only, for the mechanical
 *        variants (case, "&" vs "and", word order inside an "x and y" pair).
 *        Editorially different strands ("Number", "Number & Arithmetic",
 *        "Number and algebra") are NOT merged. No question content is edited.
 *  - C5  Counts are unique questions, de-duplicated on content.
 *  - C6  The year/programme/subject join goes through the same filter the
 *        selection engine uses (`filterEligibleQuestions`), so `language` in
 *        the catalogue maps to `language_conventions` in the bank. A short set's
 *        time is the median `estimatedTimeSeconds` of its slice times its size.
 *  - C7  Fails closed. Two states never share wording: `none` (really zero, or
 *        not launched) and `unknown` (could not check). `unknown` carries NO
 *        counts, not zero.
 *  - C9  Programme availability is whatever the caller resolved from
 *        PROGRAMS + resolveProgramStatuses. Only programmes handed in are ever
 *        surfaced; the server wrapper leaves out AMC-style and scholarship-style.
 */

/**
 * Minimum number of unique questions a strand needs before Practice Studio
 * offers it. Decision D2: 5, a NEW rule introduced for Practice Studio. Do not
 * describe it as "the Learning Hub threshold".
 */
export const STRAND_FLOOR = 5;

/** Set sizes the studio may offer. Only sizes not exceeding the available count are ever offered. */
export const SET_SIZE_OPTIONS: readonly number[] = [5, 10, 15, 20];

/** Round estimated times to this many minutes ("about N minutes"). */
export const MINUTES_ROUNDING = 5;

export type AvailabilityState = "ready" | "none" | "unknown";

/** Whether the bank could be read and verified. `unknown` is never treated as zero. */
export type BankIntegrity = "ok" | "unknown";

/** A scoped programme, in the catalogue's vocabulary, with its RESOLVED status. */
export interface StudioProgramme {
  readonly yearLevel: Question["yearLevel"];
  readonly examStyle: Question["examStyle"];
  readonly subject: Exclude<SubjectFilter, "mixed">;
  /** From resolveProgramStatuses; `coming_soon` is always `none`, whatever the bank holds. */
  readonly status: "live" | "coming_soon";
}

export interface StudioInput {
  readonly bank: readonly Question[];
  readonly integrity: BankIntegrity;
  readonly programmes: readonly StudioProgramme[];
}

export interface StrandAvailability {
  readonly yearLevel: StudioProgramme["yearLevel"];
  readonly examStyle: StudioProgramme["examStyle"];
  readonly subject: StudioProgramme["subject"];
  /** Canonical label, as displayed. */
  readonly strand: string;
  /** Stable key for the canonical label: use this, not the label, to compare or select. */
  readonly strandKey: string;
  /** Unique questions; null when unknown (never 0). */
  readonly uniqueQuestions: number | null;
  /** Reaches STRAND_FLOOR. Always false when unknown. */
  readonly eligible: boolean;
  /** Median estimatedTimeSeconds of the strand's unique questions; null when unknown. */
  readonly medianSeconds: number | null;
  readonly state: AvailabilityState;
}

export interface SubjectAvailability {
  readonly yearLevel: StudioProgramme["yearLevel"];
  readonly examStyle: StudioProgramme["examStyle"];
  readonly subject: StudioProgramme["subject"];
  /** `ready` iff at least one strand is eligible. */
  readonly state: AvailabilityState;
  /** Unique questions across the subject; null when unknown. */
  readonly uniqueQuestions: number | null;
  /** Every strand with content, eligible or not, sorted by label. Empty when unknown or none. */
  readonly strands: readonly StrandAvailability[];
  /** Why a `none` is none. */
  readonly reason: "has_content" | "coming_soon" | "no_content" | "no_strand_reaches_floor" | "unchecked";
}

export interface StudioAvailability {
  readonly integrity: BankIntegrity;
  readonly subjects: readonly SubjectAvailability[];
}

/* ------------------------------------------------------------------ */
/* Strand labels                                                       */
/* ------------------------------------------------------------------ */

/**
 * Mechanical key for a strand label: lower case, "&" read as "and", spaces
 * collapsed, and the two halves of an "x and y" label put in a fixed order so
 * "Algebra & Patterns" and "Patterns & Algebra" meet. A label with no "and"
 * is just lower-cased. Deliberately does NOT merge distinct strands such as
 * "Number" and "Number & Arithmetic" (audit §2: editorial, not mechanical).
 */
export function strandKey(label: string): string {
  const cleaned = label.trim().toLowerCase().replace(/\s*&\s*/g, " and ").replace(/\s+/g, " ");
  const parts = cleaned.split(" and ").map((part) => part.trim()).filter(Boolean);
  return parts.sort().join(" and ");
}

function displayForm(label: string): string {
  const cleaned = label.trim().replace(/\s*&\s*/g, " and ").replace(/\s+/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Canonical display label per key: the most common variant in the bank, ties broken alphabetically. */
function canonicalLabels(bank: readonly Question[]): ReadonlyMap<string, string> {
  const tallies = new Map<string, Map<string, number>>();
  for (const question of bank) {
    const key = strandKey(question.metadata.strand);
    const form = displayForm(question.metadata.strand);
    const forms = tallies.get(key) ?? new Map<string, number>();
    forms.set(form, (forms.get(form) ?? 0) + 1);
    tallies.set(key, forms);
  }
  const labels = new Map<string, string>();
  for (const [key, forms] of tallies) {
    const best = [...forms.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0];
    labels.set(key, best[0]);
  }
  return labels;
}

/* ------------------------------------------------------------------ */
/* De-duplication                                                      */
/* ------------------------------------------------------------------ */

function norm(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Content key for de-duplication (C5). The brief names the prompt text; the
 * key also folds in the stimulus, option text and visuals because a generic
 * prompt ("What is the main idea?") over two different passages is two
 * questions, not one. On the base this reproduces 13 duplicate groups / 55
 * questions against 17 / 68 for prompt text alone; the difference is
 * questions that share a prompt but not their content.
 */
export function contentKey(question: Question): string {
  const options = question.options.map((option) => norm(option.text ?? "")).join("¦");
  const stimulus = question.stimulus ? norm(question.stimulus.body) : "";
  const visuals = question.visuals.length ? JSON.stringify(question.visuals) : "";
  return [norm(question.prompt), stimulus, options, visuals].join("␟");
}

/** Unique questions, first occurrence by id order so the choice is stable. */
function uniqueByContent(questions: readonly Question[]): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const question of [...questions].sort((a, b) => a.id.localeCompare(b.id))) {
    const key = contentKey(question);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(question);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Median, set size, time                                              */
/* ------------------------------------------------------------------ */

export function medianOf(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Set sizes this many unique questions can honestly fill. Empty when none fits. */
export function offeredSetSizes(uniqueQuestions: number | null): readonly number[] {
  if (uniqueQuestions === null) return [];
  return SET_SIZE_OPTIONS.filter((size) => size <= uniqueQuestions);
}

/**
 * "About N minutes" for a short set: median seconds of the slice times the set
 * size, rounded to the nearest MINUTES_ROUNDING, never below it. Null when the
 * slice is unknown, the set is larger than the slice, or there is no median.
 * Full papers use the pattern's own timeMinutes and never come through here.
 */
export function aboutMinutes(entry: Pick<StrandAvailability, "medianSeconds" | "uniqueQuestions">, setSize: number): number | null {
  if (entry.medianSeconds === null || entry.uniqueQuestions === null) return null;
  if (!Number.isInteger(setSize) || setSize < 1 || setSize > entry.uniqueQuestions) return null;
  const minutes = (entry.medianSeconds * setSize) / 60;
  return Math.max(MINUTES_ROUNDING, Math.round(minutes / MINUTES_ROUNDING) * MINUTES_ROUNDING);
}

/* ------------------------------------------------------------------ */
/* The module                                                          */
/* ------------------------------------------------------------------ */

function unknownSubject(p: StudioProgramme): SubjectAvailability {
  return {
    yearLevel: p.yearLevel,
    examStyle: p.examStyle,
    subject: p.subject,
    state: "unknown",
    uniqueQuestions: null,
    strands: [],
    reason: "unchecked",
  };
}

function noneSubject(p: StudioProgramme, reason: SubjectAvailability["reason"], uniqueQuestions = 0, strands: readonly StrandAvailability[] = []): SubjectAvailability {
  return {
    yearLevel: p.yearLevel,
    examStyle: p.examStyle,
    subject: p.subject,
    state: "none",
    uniqueQuestions,
    strands,
    reason,
  };
}

export function buildStudioAvailability(input: StudioInput): StudioAvailability {
  /* Unknown = zero would be wrong in the other direction: an empty served bank
     is the signature of an integrity failure (servedBank() returns [] whole),
     and "none yet" would then be shown for every programme. An empty bank is
     reported as unchecked, never as no content. */
  const unchecked = input.integrity === "unknown" || input.bank.length === 0;
  if (unchecked) {
    return {
      integrity: "unknown",
      subjects: input.programmes.map((programme) =>
        programme.status === "coming_soon" ? noneSubject(programme, "coming_soon", 0) : unknownSubject(programme),
      ),
    };
  }

  const labels = canonicalLabels(input.bank);
  const subjects: SubjectAvailability[] = input.programmes.map((programme) => {
    if (programme.status === "coming_soon") return noneSubject(programme, "coming_soon", 0);

    /* Same filter the selection engine uses, so language ↔ language_conventions
       is handled where it already is (REGISTRY_SUBJECT_BY_FILTER). */
    const slice = uniqueByContent(
      filterEligibleQuestions(input.bank, {
        yearLevel: programme.yearLevel,
        examStyle: programme.examStyle,
        subject: programme.subject,
      }),
    );
    if (!slice.length) return noneSubject(programme, "no_content");

    const byStrand = new Map<string, Question[]>();
    for (const question of slice) {
      const key = strandKey(question.metadata.strand);
      byStrand.set(key, [...(byStrand.get(key) ?? []), question]);
    }
    const strands: StrandAvailability[] = [...byStrand.entries()]
      .map(([key, questions]) => {
        const eligible = questions.length >= STRAND_FLOOR;
        return {
          yearLevel: programme.yearLevel,
          examStyle: programme.examStyle,
          subject: programme.subject,
          strand: labels.get(key) ?? displayForm(key),
          strandKey: key,
          uniqueQuestions: questions.length,
          eligible,
          medianSeconds: medianOf(questions.map((q) => q.metadata.estimatedTimeSeconds)),
          state: eligible ? ("ready" as const) : ("none" as const),
        };
      })
      .sort((a, b) => a.strand.localeCompare(b.strand));

    const anyEligible = strands.some((strand) => strand.eligible);
    if (!anyEligible) return noneSubject(programme, "no_strand_reaches_floor", slice.length, strands);
    return {
      yearLevel: programme.yearLevel,
      examStyle: programme.examStyle,
      subject: programme.subject,
      state: "ready",
      uniqueQuestions: slice.length,
      strands,
      reason: "has_content",
    };
  });

  return { integrity: "ok", subjects };
}
