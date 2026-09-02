import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CurriculumPathwaysPanel } from "@/features/curriculum/lessons/components/CurriculumPathwaysPanel";
import { getCurriculumPathwaysForYearLevel } from "@/features/curriculum/lessons/pathways";

describe("CurriculumPathwaysPanel", () => {
  it.each([
    { yearLevel: 3, lessonCount: 54 },
    { yearLevel: 5, lessonCount: 50 },
  ])("renders all $lessonCount Year $yearLevel lessons as openable links", ({
    yearLevel,
    lessonCount,
  }) => {
    const pathways = getCurriculumPathwaysForYearLevel(yearLevel);
    render(<CurriculumPathwaysPanel pathways={pathways} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: `Level ${yearLevel} curriculum lessons`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mathematics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "English" })).toBeInTheDocument();

    const lessonLinks = screen.getAllByRole("link", { name: /Start Lesson/i });
    expect(lessonLinks).toHaveLength(lessonCount);
    expect(new Set(lessonLinks.map((link) => link.getAttribute("href"))).size).toBe(
      lessonCount,
    );

    const expectedPracticeLinks = pathways.learningAreas
      .flatMap((area) => area.pathways)
      .flatMap((pathway) => pathway.nodes)
      .filter((node) => node.practiceHref !== undefined).length;
    expect(screen.getAllByRole("link", { name: /Practise drill/i })).toHaveLength(
      expectedPracticeLinks,
    );
  });

  it("renders an informational state instead of silently falling back for a missing year", () => {
    render(
      <CurriculumPathwaysPanel pathways={getCurriculumPathwaysForYearLevel(null)} />,
    );

    expect(screen.getByRole("heading", { name: "Year level needed" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Start Lesson/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Level 3 curriculum lessons/i)).not.toBeInTheDocument();
  });
});
