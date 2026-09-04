import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CurriculumPathwaysPanel } from "@/features/curriculum/lessons/components/CurriculumPathwaysPanel";
import { LessonPathwayList } from "@/features/curriculum/lessons/components/LessonPathwayList";
import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
  getLevel5LiteracyPathway,
} from "@/features/curriculum/lessons/content";

describe("CurriculumPathwaysPanel", () => {
  it("shows an honest empty state when the student has no year level on file", () => {
    render(<CurriculumPathwaysPanel yearLevel={null} learningAreas={[]} />);

    expect(screen.getByText(/don't have a year level on file/i)).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Mathematics" })).not.toBeInTheDocument();
  });

  it("shows an honest empty state for a year level with no published pathways, without defaulting to Grade 3", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(4));
    render(<CurriculumPathwaysPanel yearLevel={4} learningAreas={learningAreas} />);

    expect(screen.getByText(/Year 4 lessons haven't been published yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Mathematics" })).not.toBeInTheDocument();
    expect(screen.queryByText(/VC2M3/)).not.toBeInTheDocument();
  });

  it("renders Mathematics and English learning-area tabs for Year 5, covering all 50 lessons", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    render(<CurriculumPathwaysPanel yearLevel={5} learningAreas={learningAreas} />);

    expect(screen.getByRole("tab", { name: "Mathematics" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "English" })).toBeInTheDocument();

    const totalNodes = learningAreas.reduce(
      (sum, area) => sum + area.pathways.reduce((s, p) => s + p.nodes.length, 0),
      0,
    );
    expect(totalNodes).toBe(50);
    // Every pathway header (and therefore every lesson inside it) stays
    // mounted in the DOM even while its tab/accordion is collapsed.
    for (const area of learningAreas) {
      for (const pathway of area.pathways) {
        expect(screen.getByText(pathway.title)).toBeInTheDocument();
        for (const node of pathway.nodes) {
          expect(screen.getByText(node.title)).toBeInTheDocument();
        }
      }
    }
  });

  it("renders no Grade 3 pathways when scoped to Year 5", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    render(<CurriculumPathwaysPanel yearLevel={5} learningAreas={learningAreas} />);

    expect(screen.queryByText(/Level 3/i)).not.toBeInTheDocument();
  });

  it("opens the strand matching the recommended focus subject by default, never fabricating progress", () => {
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    render(
      <CurriculumPathwaysPanel
        yearLevel={5}
        learningAreas={learningAreas}
        recommendedFocusLabel="Numeracy"
      />,
    );

    expect(screen.getByRole("tab", { name: "Mathematics" })).toHaveAttribute("aria-selected", "true");
    // "Start here", never "Continue" — there is no per-lesson completion data.
    const startHereChip = screen.getByRole("button", { name: /Start here:/i });
    expect(startHereChip).toBeInTheDocument();
    expect(screen.queryByText(/continue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+% complete/i)).not.toBeInTheDocument();
  });

  it("lets keyboard users switch learning-area tabs with arrow keys", async () => {
    const user = userEvent.setup();
    const learningAreas = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    render(<CurriculumPathwaysPanel yearLevel={5} learningAreas={learningAreas} />);

    const mathTab = screen.getByRole("tab", { name: "Mathematics" });
    const englishTab = screen.getByRole("tab", { name: "English" });
    mathTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(englishTab).toHaveFocus();
    expect(englishTab).toHaveAttribute("aria-selected", "true");
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
