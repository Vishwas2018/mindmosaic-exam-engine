import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonView } from "@/features/curriculum/lessons/components/LessonView";
import { LEVEL_3_NUMBER_LESSONS } from "@/features/curriculum/lessons/content/level-3-number";

describe("LessonView Component", () => {
  const lesson1 = LEVEL_3_NUMBER_LESSONS[0];

  it("renders lesson title, curriculum code, learning intentions and success criteria", () => {
    render(
      <LessonView
        lesson={lesson1}
        nextLesson={{ curriculumCode: "VC2M3N02", title: "Place Value" }}
        availableQuestionsCount={6}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: lesson1.title })).toBeInTheDocument();
    expect(screen.getAllByText("VC2M3N01").length).toBeGreaterThan(0);
    expect(screen.getByText("Learning Intention")).toBeInTheDocument();
    expect(screen.getByText(lesson1.learningIntention)).toBeInTheDocument();

    for (const sc of lesson1.successCriteria) {
      expect(screen.getByText(sc)).toBeInTheDocument();
    }
  });

  it("does not render draft preview badge for published lessons", () => {
    render(
      <LessonView
        lesson={lesson1}
        nextLesson={{ curriculumCode: "VC2M3N02", title: "Place Value" }}
        availableQuestionsCount={6}
      />,
    );

    expect(screen.queryByText("Draft Preview Mode")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Learning Pathway/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Next Lesson: VC2M3N02/i })).toBeInTheDocument();
  });

  it("renders draft preview badge when lesson status is draft", () => {
    const draftLesson = { ...lesson1, status: "draft" as const };
    render(
      <LessonView
        lesson={draftLesson}
        nextLesson={{ curriculumCode: "VC2M3N02", title: "Place Value" }}
        availableQuestionsCount={6}
      />,
    );

    expect(screen.getByText("Draft Preview Mode")).toBeInTheDocument();
  });

  it("renders the practice check section with practice drill launcher", () => {
    render(
      <LessonView
        lesson={lesson1}
        nextLesson={{ curriculumCode: "VC2M3N02", title: "Place Value" }}
        availableQuestionsCount={6}
      />,
    );

    expect(screen.getByRole("link", { name: /Start Practice Drill/i })).toHaveAttribute(
      "href",
      "/practice/session?curriculumCode=VC2M3N01&count=5",
    );
  });
});
