import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonPathwayList } from "@/features/curriculum/lessons/components/LessonPathwayList";
import {
  getLevel3LiteracyPathway,
  getLevel3NumberPathway,
  getLevel5LiteracyPathway,
} from "@/features/curriculum/lessons/content";

describe("LessonPathwayList Component", () => {
  const pathway = getLevel3NumberPathway();

  it("renders pathway header, description and draft review badge when previewMode is true", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={true} />);

    expect(screen.getByText(pathway.title)).toBeInTheDocument();
    expect(screen.getByText("Draft Review Mode")).toBeInTheDocument();
    expect(screen.getByText(/9 Structured Lessons/i)).toBeInTheDocument();
  });

  it("does not render draft review badge when previewMode is false (published student mode)", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={false} />);

    expect(screen.getByText(pathway.title)).toBeInTheDocument();
    expect(screen.queryByText("Draft Review Mode")).not.toBeInTheDocument();
    expect(screen.getByText(/9 Structured Lessons/i)).toBeInTheDocument();
  });

  it("renders all 9 lesson cards in sequential order", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={true} />);

    for (const node of pathway.nodes) {
      expect(screen.getAllByText(node.curriculumCode).length).toBeGreaterThan(0);
      expect(screen.getByText(node.title)).toBeInTheDocument();
    }
  });

  it("renders prerequisite links on cards that have prerequisites", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={true} />);

    // VC2M3N04 has prerequisite VC2M3N02
    const prereqLink = screen.getAllByRole("link", { name: "VC2M3N02" });
    expect(prereqLink.length).toBeGreaterThan(0);
  });

  it("renders start lesson and practice drill CTAs for each lesson", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={true} />);

    const startButtons = screen.getAllByRole("link", { name: /Start Lesson/i });
    expect(startButtons).toHaveLength(9);

    const drillButtons = screen.getAllByRole("link", { name: /Practise drill/i });
    expect(drillButtons).toHaveLength(9);
  });

  it("keeps classroom-only lessons browsable without exposing a practice CTA", () => {
    render(<LessonPathwayList pathway={getLevel3LiteracyPathway()} previewMode={false} />);

    const classroomCard = screen.getByText("VC2E3LY13").closest("li");
    expect(classroomCard).not.toBeNull();

    const card = within(classroomCard!);
    expect(card.getByText("Practised in class")).toBeInTheDocument();
    expect(card.getByRole("link", { name: /Start Lesson/i })).toHaveAttribute(
      "href",
      "/student/learn/lessons/VC2E3LY13",
    );
    expect(card.queryByRole("link", { name: /Practise drill/i })).not.toBeInTheDocument();
  });

  it("applies the same no-practice treatment to every Grade 5 classroom-only card", () => {
    render(<LessonPathwayList pathway={getLevel5LiteracyPathway()} previewMode={false} />);

    for (const code of ["VC2E5LY01", "VC2E5LY02", "VC2E5LY12"]) {
      const classroomCard = screen.getAllByText(code)[0]?.closest("li");
      expect(classroomCard).not.toBeNull();

      const card = within(classroomCard!);
      expect(card.getByText("Practised in class")).toBeInTheDocument();
      expect(card.getByRole("link", { name: /Start Lesson/i })).toHaveAttribute(
        "href",
        `/student/learn/lessons/${code}`,
      );
      expect(card.queryByRole("link", { name: /Practise drill/i })).not.toBeInTheDocument();
    }
  });
});
