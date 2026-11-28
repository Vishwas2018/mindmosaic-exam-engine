import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/*
 * Programme availability must follow APPROVED content on every surface (MT-001, MT-002, MT-005).
 *
 * The gate is forced to "enforce" before any server module loads, so these cases see what a deployed DEV/PROD build
 * serves, not the authored-but-unapproved bank that local runs and CI otherwise expose.
 */
vi.hoisted(() => {
  process.env.MM_PUBLICATION_GATE = "enforce";
});

import { PROGRAMS, isListedInCatalogue } from "@/features/catalogue/catalogue";
import { getStyleAvailability } from "@/features/catalogue/style-availability";
import { EXAM_PATTERNS } from "@/features/exam-engine/exam-patterns/exam-pattern-registry";
import { listPatternsForPicker } from "@/features/exam-engine/exam-patterns/pattern-listing";
import { programHighlights, programmes } from "@/features/landing/content";
import { getPatternReadiness, isPublicationGateEnforced } from "@/server/exam-bank";
import { resolveProgramStatuses } from "@/features/taxonomy/coverage";

const STYLE_BY_PROGRAMME = {
  "naplan-style": "naplan_style",
  "icas-style": "icas_style",
  "amc-style": "amc_style",
} as const;

describe("landing programme status matches what approved content can start (MT-001, MT-002)", () => {
  it("runs under the enforced publication gate", () => {
    expect(isPublicationGateEnforced()).toBe(true);
  });

  for (const [id, examStyle] of Object.entries(STYLE_BY_PROGRAMME)) {
    it(`${id}: in development exactly when nothing in the style can be started`, () => {
      const item = programmes.items.find((candidate) => candidate.id === id)!;
      const availability = getStyleAvailability(examStyle);
      expect(item.status === "in_development", `${id} is ${item.status}, readiness says ${availability.state}`).toBe(
        availability.state === "in_development",
      );
    });

    it(`${id}: claims no year the approved content cannot start`, () => {
      const item = programmes.items.find((candidate) => candidate.id === id)!;
      if (item.status === "in_development") return;
      const availability = getStyleAvailability(examStyle);
      expect(availability.years.length).toBeGreaterThan(0);
      for (const year of item.coveredYears ?? []) expect(availability.years).toContain(year);
    });
  }

  it("never marks a style fully available while any of its subjects cannot be started", () => {
    for (const item of programmes.items) {
      const examStyle = STYLE_BY_PROGRAMME[item.id as keyof typeof STYLE_BY_PROGRAMME];
      if (!examStyle || item.status !== "available") continue;
      const unstartable = EXAM_PATTERNS.filter(
        (pattern) =>
          pattern.examStyle === examStyle &&
          pattern.status === "available" &&
          getPatternReadiness()[pattern.id]?.state === "unavailable",
      );
      expect(unstartable.map((pattern) => pattern.id), item.id).toEqual([]);
    }
  });

  it("ICAS-style is not claimed open while the practice catalogue lists every ICAS programme as coming soon", () => {
    const icasPrograms = resolveProgramStatuses(PROGRAMS).filter((program) => program.scope?.examStyle === "icas_style");
    const live = icasPrograms.filter((program) => program.status === "live");
    const icas = programmes.items.find((item) => item.id === "icas-style")!;
    if (live.length === 0) {
      expect(icas.status).toBe("in_development");
      expect(programHighlights.rows.find((row) => row.id === "icas")!.tone).toBe("planned");
    } else {
      expect(icas.status).not.toBe("in_development");
    }
  });

  it("NAPLAN-style names only the subjects the practice catalogue lists as live", () => {
    const live = resolveProgramStatuses(PROGRAMS).filter(
      (program) => program.status === "live" && program.scope?.examStyle === "naplan_style",
    );
    const liveSubjects = new Set<string>(live.map((program) => program.scope!.subject));
    const naplan = programmes.items.find((item) => item.id === "naplan-style")!;
    const claimed = naplan.subjects.map((subject) => (subject === "Numeracy" ? "numeracy" : subject.toLowerCase()));
    for (const subject of claimed) expect(liveSubjects.has(subject), subject).toBe(true);
  });
});

describe("AMC-style has one catalogue entry and modules are not full papers (MT-005)", () => {
  it("lists AMC once in the practice catalogue, with no per-year duplicates", () => {
    const amc = PROGRAMS.filter(isListedInCatalogue).filter(
      (program) => /(^|-)amc(-|$)/.test(program.slug) || /maths-competition/.test(program.slug),
    );
    expect(amc.map((program) => program.slug)).toEqual(["australian-maths-competition"]);
    expect(amc[0]!.modules?.href).toBe("/exams");
    // The generated cells stay: the exam-pattern registry and the governance tripwire resolve against them.
    expect(PROGRAMS.some((program) => program.scope?.examStyle === "amc_style")).toBe(true);
  });

  it("offers each year one AMC listing on the paper picker: the module, with the full paper withheld", () => {
    const readiness = getPatternReadiness();
    const amcPatterns = EXAM_PATTERNS.filter((pattern) => pattern.examStyle === "amc_style");
    const { shown, withheldFull } = listPatternsForPicker(amcPatterns, readiness);

    for (const year of [3, 5]) {
      const forYear = shown.filter((pattern) => pattern.yearLevel === year);
      expect(forYear, `Year ${year}`).toHaveLength(1);
      expect(forYear[0]!.presentation).toBe("practice_module");
      expect(withheldFull.filter((paper) => paper.pattern.yearLevel === year)).toHaveLength(1);
    }
  });

  it("reports one question count per AMC listing, from the same readiness the page reads", () => {
    const readiness = getPatternReadiness();
    const { shown } = listPatternsForPicker(
      EXAM_PATTERNS.filter((pattern) => pattern.examStyle === "amc_style"),
      readiness,
    );
    const counts = shown.map((pattern) => `${pattern.yearLevel}:${readiness[pattern.id]!.availableCount}`);
    expect(new Set(counts).size).toBe(counts.length);
  });

  it("keeps a paper listed when it has no module to stand for it", () => {
    const base = EXAM_PATTERNS.find((pattern) => pattern.id === "naplan-y5-numeracy-full")!;
    const { shown, withheldFull } = listPatternsForPicker([base], getPatternReadiness());
    expect(shown.map((pattern) => pattern.id)).toEqual([base.id]);
    expect(withheldFull).toEqual([]);
  });
});
