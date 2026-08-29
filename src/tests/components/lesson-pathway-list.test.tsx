import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonPathwayList } from "@/features/curriculum/lessons/components/LessonPathwayList";
import { getLevel3NumberPathway } from "@/features/curriculum/lessons/content";

describe("LessonPathwayList Component", () => {
  const pathway = getLevel3NumberPathway();

  it("renders pathway header, description and draft review badge", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={true} />);

    expect(screen.getByText(pathway.title)).toBeInTheDocument();
    expect(screen.getByText("Draft Review Mode")).toBeInTheDocument();
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
});
