import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LearningAreaPathways } from "@/features/curriculum/lessons/components/LearningAreaPathways";
import { LessonPathwayList } from "@/features/curriculum/lessons/components/LessonPathwayList";
import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
  getLevel5LiteracyPathway,
} from "@/features/curriculum/lessons/content";

describe("LearningAreaPathways", () => {
  it("renders every strand and lesson for a learning area, all mounted in the DOM", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    const mathematics = learningAreas.find((area) => area.learningArea === "Mathematics")!;
    render(<LearningAreaPathways pathways={mathematics.pathways} />);

    const totalNodes = mathematics.pathways.reduce((sum, pathway) => sum + pathway.nodes.length, 0);
    expect(totalNodes).toBe(24); // Number 10 + Algebra 2 + Measurement 4 + Space 3 + Statistics 3 + Probability 2

    // Every pathway header (and therefore every lesson inside it) stays
    // mounted in the DOM even while its accordion is collapsed.
    for (const pathway of mathematics.pathways) {
      expect(screen.getByText(pathway.title)).toBeInTheDocument();
      for (const node of pathway.nodes) {
        expect(screen.getByText(node.title)).toBeInTheDocument();
      }
    }
  });

  it("shows a deterministic 'Start here' anchor for the first pathway's first lesson, never a fabricated resume position", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    const mathematics = learningAreas.find((area) => area.learningArea === "Mathematics")!;
    render(<LearningAreaPathways pathways={mathematics.pathways} />);

    const firstNode = mathematics.pathways[0].nodes[0];
    const startHereChip = screen.getByRole("button", { name: /Start here:/i });
    expect(startHereChip).toHaveTextContent(firstNode.title);
    // "Start here", never "Continue" — there is no per-lesson completion data.
    expect(screen.queryByText(/continue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+% complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/of \d+ (lessons|complete)/i)).not.toBeInTheDocument();
  });

  it("opens only the first strand by default, with the rest collapsed but present", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    const mathematics = learningAreas.find((area) => area.learningArea === "Mathematics")!;
    render(<LearningAreaPathways pathways={mathematics.pathways} />);

    const firstStrandButton = screen.getByRole("button", {
      name: new RegExp(mathematics.pathways[0].strand, "i"),
      expanded: true,
    });
    expect(firstStrandButton).toBeInTheDocument();

    const secondStrandButton = screen.getByRole("button", {
      name: new RegExp(mathematics.pathways[1].strand, "i"),
      expanded: false,
    });
    expect(secondStrandButton).toBeInTheDocument();
  });
});

describe("LessonPathwayList classroom-only CTA gating (Grade 5)", () => {
  it("hides the practice drill CTA and shows a classroom-only badge for VC2E5LY01, while other lessons keep their drill CTA", () => {
    const literacyPathway = getLevel5LiteracyPathway();
    render(
      <LessonPathwayList pathway={literacyPathway} previewMode={false} isOpen={true} onToggle={() => {}} />,
    );

    const classroomOnlyNode = literacyPathway.nodes.find((n) => n.curriculumCode === "VC2E5LY01");
    expect(classroomOnlyNode?.isClassroomOnly).toBe(true);

    const cards = screen.getAllByRole("listitem");
    const classroomCard = cards.find((card) => within(card).queryByText("VC2E5LY01"));
    expect(classroomCard).toBeDefined();
    expect(within(classroomCard!).queryByRole("link", { name: /Practise drill/i })).not.toBeInTheDocument();
    expect(within(classroomCard!).getByText(/Classroom-only skill/i)).toBeInTheDocument();
    expect(within(classroomCard!).getByRole("link", { name: /Start lesson/i })).toBeInTheDocument();

    const nonClassroomNode = literacyPathway.nodes.find((n) => !n.isClassroomOnly && n.questionCount > 0);
    expect(nonClassroomNode).toBeDefined();
    const nonClassroomCard = cards.find((card) =>
      within(card).queryByText(nonClassroomNode!.curriculumCode),
    );
    expect(within(nonClassroomCard!).getByRole("link", { name: /Practise drill/i })).toBeInTheDocument();
  });
});
