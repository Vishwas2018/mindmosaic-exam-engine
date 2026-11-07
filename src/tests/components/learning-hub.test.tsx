import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  getCurriculumPathwaysForYearLevel,
} from "@/features/curriculum/lessons/content";
import { LearningHubExplorer } from "@/features/student/components/learning-hub/LearningHubExplorer";
import { LearningHubHero } from "@/features/student/components/learning-hub/LearningHubHero";
import { LessonCheckSection } from "@/features/curriculum/lessons/components/LessonCheckSection";
import type { CheckSection } from "@/features/curriculum/lessons/schema";

describe("LearningHubExplorer", () => {
  const pathwaysByYear = {
    3: getCurriculumPathwaysForYearLevel(3),
    5: getCurriculumPathwaysForYearLevel(5),
  };

  it("renders Year 3 by default when student has yearLevel 3", () => {
    render(
      <LearningHubExplorer
        initialYearLevel={3}
        pathwaysByYear={pathwaysByYear}
        hasPriorAttempts={false}
      />,
    );

    const year3Btn = screen.getByRole("button", { name: /Year 3/i });
    expect(year3Btn).toHaveAttribute("aria-pressed", "true");

    // Level 3 Number strand is present
    expect(screen.getByText("Number")).toBeInTheDocument();
    expect(screen.getAllByText("VC2M3N01").length).toBeGreaterThan(0);
  });

  it("switches to Year 5 when the Year 5 button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <LearningHubExplorer
        initialYearLevel={3}
        pathwaysByYear={pathwaysByYear}
        hasPriorAttempts={false}
      />,
    );

    const year5Btn = screen.getByRole("button", { name: /Year 5/i });
    await user.click(year5Btn);

    expect(year5Btn).toHaveAttribute("aria-pressed", "true");
    // Level 5 Number lesson is now visible
    expect(screen.getAllByText("VC2M5N01").length).toBeGreaterThan(0);
  });

  it("filters by learning area (Mathematics vs English)", async () => {
    const user = userEvent.setup();
    render(
      <LearningHubExplorer
        initialYearLevel={5}
        pathwaysByYear={pathwaysByYear}
        hasPriorAttempts={true}
      />,
    );

    // Click English
    const englishBtn = screen.getByRole("button", { name: /^English/i });
    await user.click(englishBtn);
    expect(englishBtn).toHaveAttribute("aria-pressed", "true");

    // English strands visible
    expect(screen.getByText("Reading & Literacy")).toBeInTheDocument();
    // Mathematics strand (Number) not visible in English view
    expect(screen.queryByText("VC2M5N01")).not.toBeInTheDocument();

    // Click Mathematics
    const mathsBtn = screen.getByRole("button", { name: /^Mathematics/i });
    await user.click(mathsBtn);
    expect(mathsBtn).toHaveAttribute("aria-pressed", "true");

    expect(screen.getAllByText("VC2M5N01").length).toBeGreaterThan(0);
    expect(screen.queryByText("Reading & Literacy")).not.toBeInTheDocument();
  });

  it("shows first-visit welcome guidance when hasPriorAttempts is false", () => {
    render(
      <LearningHubExplorer
        initialYearLevel={3}
        pathwaysByYear={pathwaysByYear}
        hasPriorAttempts={false}
      />,
    );

    expect(screen.getByText(/Welcome to the Learning Hub/i)).toBeInTheDocument();
    expect(screen.getByText(/There are no test clocks or scores here/i)).toBeInTheDocument();
  });

  it("shows returning guidance when hasPriorAttempts is true", () => {
    render(
      <LearningHubExplorer
        initialYearLevel={3}
        pathwaysByYear={pathwaysByYear}
        hasPriorAttempts={true}
      />,
    );

    expect(screen.getByText(/Welcome back to your lessons/i)).toBeInTheDocument();
    expect(screen.getByText(/Pick any strand below to review core ideas/i)).toBeInTheDocument();
  });

  it("shows an honest empty state for an unauthored year level", () => {
    const withYear4 = {
      ...pathwaysByYear,
      4: [],
    };
    render(
      <LearningHubExplorer
        initialYearLevel={4}
        pathwaysByYear={withYear4}
        hasPriorAttempts={false}
      />,
    );

    expect(
      screen.getByText(/Year 4 lessons haven['’]t been published yet/i),
    ).toBeInTheDocument();
  });

  it("has zero invented progress bars, ticks, or percent completion widgets (C16)", () => {
    const { container } = render(
      <LearningHubExplorer
        initialYearLevel={3}
        pathwaysByYear={pathwaysByYear}
        hasPriorAttempts={true}
      />,
    );

    // Verify no fake completion progress bars or invented 65% stats
    expect(screen.queryByText("65%")).not.toBeInTheDocument();
    expect(screen.queryByText("Term 2 Progress")).not.toBeInTheDocument();
    expect(screen.queryByText(/units complete/i)).not.toBeInTheDocument();
    expect(container.querySelector(".w-\\[65\\%\\]")).toBeNull();
  });

  it("displays curriculum codes as recorded without alignment claims", () => {
    render(
      <LearningHubExplorer
        initialYearLevel={3}
        pathwaysByYear={pathwaysByYear}
        hasPriorAttempts={false}
      />,
    );

    const codeElements = screen.getAllByText("VC2M3N01");
    expect(codeElements.length).toBeGreaterThan(0);
    const codeSpan = codeElements.find((el) => el.tagName.toLowerCase() === "span");
    expect(codeSpan).toBeDefined();
    expect(screen.queryByText(/aligned to Victorian Curriculum Level 3 standards/i)).not.toBeInTheDocument();
  });
});

describe("LearningHubHero", () => {
  it("renders lesson and strand counts without placeholder syllabus chip", () => {
    render(
      <LearningHubHero
        yearLevel={3}
        mathsLessonCount={24}
        englishLessonCount={30}
        strandCount={9}
      />,
    );

    expect(screen.getByRole("heading", { name: "Learning Hub" })).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(screen.getByText("Maths lessons")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("English lessons")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("Active strands")).toBeInTheDocument();

    // Verify line 28-30 placeholder chip is completely removed
    expect(screen.queryByText(/NSW Syllabus Stage 3 · Australian Curriculum/i)).not.toBeInTheDocument();
  });
});

describe("LessonCheckSection", () => {
  const dummyCheckSection: CheckSection = {
    id: "check-1",
    kind: "check",
    heading: "Check Your Understanding",
    prompt: "Solve these practice problems to test your understanding.",
    curriculumCode: "VC2M5N01",
    practiceCount: 5,
  };

  it("renders neutral verified copy without hardcoded Level 3 alignment claim", () => {
    render(
      <LessonCheckSection
        section={dummyCheckSection}
        availableQuestionsCount={5}
      />,
    );

    expect(
      screen.getByText("Every practice question is verified with worked solutions."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/aligned to Victorian Curriculum Level 3 standards/i),
    ).not.toBeInTheDocument();
  });
});
