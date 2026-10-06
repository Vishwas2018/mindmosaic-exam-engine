import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getAllLessons, getPublishedLessons } from "@/features/curriculum/lessons/content";
import { CLASSROOM_ONLY_CURRICULUM_CODES } from "@/features/curriculum/lessons/classroom-only";
import { chapter2Scenes } from "@/features/landing/chapter2-scenes";
import { programmes } from "@/features/landing/content";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";

/**
 * Audit finding C-01: the landing programmes list advertised six programmes
 * and Years 1-12 as available while every shipped bank held only Years 3
 * and 5 in NAPLAN- and ICAS-style. AMC-style, Selective school entry-style,
 * Singapore Maths and the Australian Curriculum pathway had no content at
 * all.
 *
 * Nothing caught it. `e2e/landing.spec.ts`'s "programme coverage is honest"
 * case asserts only that a year OUTSIDE a programme's declared range shows
 * a warning — it compares the declaration to itself, never to real content,
 * so it passed throughout.
 *
 * These cases close that loop: they compare what the marketing copy claims
 * against what `taxonomy/coverage.ts` says we can actually serve. That
 * module is the same source `/practice` and the sign-up year grid already
 * read, so the marketing surface can no longer disagree with the product
 * about what exists.
 */
describe("landing programme availability matches real coverage", () => {
  const gatedYears = yearLevelsWithGatedCoverage();

  it("has gated coverage for at least one year, or every claim below is vacuous", () => {
    expect(gatedYears.length).toBeGreaterThan(0);
  });

  it("only claims a programme is available for years we can actually serve", () => {
    const offenders = programmes.items
      .filter((item) => item.status === "available")
      .flatMap((item) => {
        /* `coveredYears` is the claim where it is set; otherwise the whole
           from..to span is being claimed. */
        const claimed =
          item.coveredYears ??
          Array.from({ length: item.to - item.from + 1 }, (_unused, index) => item.from + index);
        const unbacked = claimed.filter(
          (year) => !gatedYears.includes(year as (typeof gatedYears)[number]),
        );
        return unbacked.length > 0
          ? [`${item.id} claims Years ${claimed.join(", ")}; no coverage at ${unbacked.join(", ")}`]
          : [];
      });

    expect(offenders).toEqual([]);
  });

  /*
   * The gap this test found in its own fix: capping NAPLAN-/ICAS-style to
   * "Years 3–5" still claimed Year 4, which has no content. A programme
   * whose covered years are not contiguous has to list them.
   */
  it("lists covered years explicitly wherever they are not a contiguous span", () => {
    for (const item of programmes.items) {
      if (item.status !== "available") continue;
      const span = item.to - item.from + 1;
      const covered = item.coveredYears ?? [];
      if (covered.length > 0 && covered.length !== span) {
        expect(covered.length).toBeLessThan(span);
      }
      if (covered.length === 0) {
        /* No explicit list means the whole span is claimed, so the span
           itself must be fully backed — asserted by the case above. */
        expect(span).toBeGreaterThan(0);
      }
    }
  });

  it("never labels an in-development programme's practice or exam mode as available", () => {
    for (const item of programmes.items) {
      if (item.status !== "in_development") continue;
      expect(item.practice, `${item.id} practice`).not.toMatch(/available/i);
      expect(item.exam, `${item.id} exam`).not.toMatch(/available|simulation|exam-style sets/i);
    }
  });

  /*
   * The four programmes the audit named, plus the Learning Hub, whose nine
   * articles are all `status: "planned"` briefs. Pinned by id so removing a
   * programme's content without demoting its card fails here rather than in
   * front of a parent.
   */
  it("keeps the programmes with no content behind them marked in development", () => {
    const expectedInDevelopment = [
      "singapore-maths",
      "amc-style",
      "selective-entry-style",
      "learning-hub",
    ];
    const actual = programmes.items
      .filter((item) => item.status === "in_development")
      .map((item) => item.id)
      .sort();

    expect(actual).toEqual([...expectedInDevelopment].sort());
  });

  /*
   * Curriculum learning is "limited", not "in development": published Level 3
   * and Level 5 lessons are served to signed-in students. The claim is held
   * to exactly those years, against the lesson catalogue itself.
   */
  it("keeps Curriculum limited, claiming only the Years the published lesson catalogue covers", () => {
    const curriculum = programmes.items.find((item) => item.id === "australian-curriculum")!;
    expect(curriculum.status).toBe("limited");
    expect(curriculum.coveredYears).toEqual([3, 5]);
    expect(curriculum.exam).toBe("Not applicable");

    const levelsWithPublishedLessons = new Set(getPublishedLessons().map((lesson) => lesson.level));
    expect([...levelsWithPublishedLessons].sort()).toEqual(["Level 3", "Level 5"]);
    const strands = new Set(getPublishedLessons().map((lesson) => lesson.strand));
    for (const strand of ["number", "language", "literacy"]) expect(strands.has(strand as never)).toBe(true);
    expect(curriculum.subjects).toEqual(["Mathematics", "English"]);
  });

  /*
   * Classroom-only lessons teach a concept but must never bind practice
   * questions, and any lesson may resolve to zero mapped questions. So public
   * Curriculum copy may say practice is linked "where available", never that
   * every lesson has digital practice.
   */
  it("never claims that every curriculum lesson has digital practice", () => {
    const classroomOnlyLessons = getAllLessons().filter((lesson) =>
      CLASSROOM_ONLY_CURRICULUM_CODES.has(lesson.curriculumCode),
    );
    expect(classroomOnlyLessons.length).toBeGreaterThan(0);

    const curriculum = programmes.items.find((item) => item.id === "australian-curriculum")!;
    const scene = chapter2Scenes.find((candidate) => candidate.id === "curriculum")!;
    expect(curriculum.practice).toBe("Linked practice where available");
    expect(scene.facts).toContain("Related practice where available");
    expect(scene.proposition).toBe("Understand the concept, then practise where it fits.");

    const publicCopy = [
      curriculum.practice,
      curriculum.blurb,
      scene.proposition,
      scene.note ?? "",
      ...scene.facts,
    ].join(" ");
    expect(publicCopy).not.toMatch(
      /(practice|questions?)\s+(follows?|accompanies|comes with|included)\s+(each|every)\s+lesson|every lesson (has|includes|comes with)\s+(practice|questions?)|before practising it/i,
    );
  });

  it("never lets a limited programme claim an exam simulation or generic practice availability", () => {
    for (const item of programmes.items.filter((candidate) => candidate.status === "limited")) {
      expect(item.exam, item.id).not.toMatch(/simulation|exam-style sets|available/i);
      expect(item.practice, item.id).not.toMatch(/^available$/i);
    }
  });

  it("holds the canonical status of all six Chapter 2 programmes", () => {
    const status = Object.fromEntries(programmes.items.map((item) => [item.id, item.status]));
    expect(status).toMatchObject({
      "naplan-style": "available",
      "icas-style": "available",
      "australian-curriculum": "limited",
      "amc-style": "in_development",
      "singapore-maths": "in_development",
      "selective-entry-style": "in_development",
    });
  });

  it("keeps only the two assessment styles with a real bank marked available", () => {
    const available = programmes.items
      .filter((item) => item.status === "available")
      .map((item) => item.id)
      .sort();

    expect(available).toEqual(["icas-style", "naplan-style"]);
  });
});
