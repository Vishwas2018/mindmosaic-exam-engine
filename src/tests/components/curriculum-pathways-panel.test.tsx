import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CurriculumPathwaysPanel } from "@/features/curriculum/lessons/components/CurriculumPathwaysPanel";
import { LessonPathwayList } from "@/features/curriculum/lessons/components/LessonPathwayList";
import { SubjectExplorer } from "@/features/curriculum/lessons/components/SubjectExplorer";
import { WorthRevisitingPanel } from "@/features/curriculum/lessons/components/WorthRevisitingPanel";
import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
  getLevel5LiteracyPathway,
} from "@/features/curriculum/lessons/content";

describe("CurriculumPathwaysPanel", () => {
  it("shows an honest empty state when the student has no year level on file", () => {
    render(<CurriculumPathwaysPanel yearLevel={null} learningAreas={[]} />);

    expect(screen.getByText(/don't have a year level on file/i)).toBeInTheDocument();
    expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("shows an honest empty state for a year level with no published pathways, without defaulting to Grade 3", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(4));
    render(<CurriculumPathwaysPanel yearLevel={4} learningAreas={learningAreas} />);

    expect(screen.getByText(/Year 4 lessons haven't been published yet/i)).toBeInTheDocument();
    expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
    expect(screen.queryByText(/VC2M3/)).not.toBeInTheDocument();
  });

  it("renders Mathematics and English learning-area groups for Year 5, covering all 50 lessons", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    render(<CurriculumPathwaysPanel yearLevel={5} learningAreas={learningAreas} />);

    expect(screen.getByRole("heading", { name: "Mathematics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "English" })).toBeInTheDocument();

    const totalNodes = learningAreas.reduce(
      (sum, area) => sum + area.pathways.reduce((s, p) => s + p.nodes.length, 0),
      0,
    );
    expect(totalNodes).toBe(50);
    for (const area of learningAreas) {
      for (const pathway of area.pathways) {
        expect(screen.getByText(pathway.title)).toBeInTheDocument();
      }
    }
  });

  it("renders no Grade 3 pathways when scoped to Year 5", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    render(<CurriculumPathwaysPanel yearLevel={5} learningAreas={learningAreas} />);

    expect(screen.queryByText(/Level 3/i)).not.toBeInTheDocument();
  });
});

describe("SubjectExplorer & Strand Filters", () => {
  it("renders subject tabs and strand filter pills for Mathematics and English", async () => {
    const user = userEvent.setup();
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    render(<SubjectExplorer yearLevel={5} learningAreas={learningAreas} />);

    // Mathematics tab active by default
    expect(screen.getByRole("tab", { name: /Mathematics/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /All Strands \(6\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Number" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Algebra" })).toBeInTheDocument();

    // Clicking "Algebra" filters to Algebra pathway only
    await user.click(screen.getByRole("button", { name: "Algebra" }));
    expect(screen.getByText(/Algebra Pathway/i)).toBeInTheDocument();
    expect(screen.queryByText(/Number Pathway/i)).not.toBeInTheDocument();

    // Switch to English tab
    await user.click(screen.getByRole("tab", { name: /English/i }));
    expect(screen.getByRole("button", { name: /All Strands \(3\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Language & Grammar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Literature" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reading & Literacy" })).toBeInTheDocument();
  });
});

describe("WorthRevisitingPanel", () => {
  it("renders the 3 high-yield focus cards with prior check-ins and revisit links for Grade 5", () => {
    render(<WorthRevisitingPanel yearLevel={5} />);

    expect(screen.getByRole("heading", { name: /Worth revisiting/i })).toBeInTheDocument();
    expect(screen.getByText("3 Focus Tasks")).toBeInTheDocument();
    expect(screen.getByText(/Adding Fractions with Related Denominators/i)).toBeInTheDocument();
    expect(screen.getByText(/Compound Sentences & Subordinating Conjunctions/i)).toBeInTheDocument();
    expect(screen.getByText(/Angles on a Straight Line & Point/i)).toBeInTheDocument();

    const revisitLinks = screen.getAllByRole("link", { name: /Revisit lesson/i });
    expect(revisitLinks).toHaveLength(3);
    expect(revisitLinks[0]).toHaveAttribute("href", "/student/learn/lessons/VC2M5N05");
  });

  it("filters focus tasks by learning area when on subject sub-hubs", () => {
    render(<WorthRevisitingPanel yearLevel={5} learningAreaFilter="Mathematics" />);

    expect(screen.getByText("2 Focus Tasks")).toBeInTheDocument();
    expect(screen.getByText(/Adding Fractions with Related Denominators/i)).toBeInTheDocument();
    expect(screen.queryByText(/Compound Sentences & Subordinating Conjunctions/i)).not.toBeInTheDocument();
  });
});

describe("LessonPathwayList classroom-only CTA gating (Grade 5)", () => {
  it("hides the practice drill CTA and shows a classroom-only badge for VC2E5LY01, while other lessons keep their drill CTA", () => {
    const literacyPathway = getLevel5LiteracyPathway();
    render(<LessonPathwayList pathway={literacyPathway} previewMode={false} />);

    const classroomOnlyNode = literacyPathway.nodes.find((n) => n.curriculumCode === "VC2E5LY01");
    expect(classroomOnlyNode?.isClassroomOnly).toBe(true);

    const cards = screen.getAllByRole("listitem");
    const classroomCard = cards.find((card) => within(card).queryByText("VC2E5LY01"));
    expect(classroomCard).toBeDefined();
    expect(within(classroomCard!).queryByRole("link", { name: /Practise drill/i })).not.toBeInTheDocument();
    expect(within(classroomCard!).getByText(/Classroom-only skill/i)).toBeInTheDocument();
    expect(within(classroomCard!).getByRole("link", { name: /Start Lesson/i })).toBeInTheDocument();

    const nonClassroomNode = literacyPathway.nodes.find((n) => !n.isClassroomOnly && n.questionCount > 0);
    expect(nonClassroomNode).toBeDefined();
    const nonClassroomCard = cards.find((card) =>
      within(card).queryByText(nonClassroomNode!.curriculumCode),
    );
    expect(within(nonClassroomCard!).getByRole("link", { name: /Practise drill/i })).toBeInTheDocument();
  });
});

