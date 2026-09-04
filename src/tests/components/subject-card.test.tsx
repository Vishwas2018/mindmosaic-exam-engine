import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubjectCard } from "@/features/curriculum/lessons/components/SubjectCard";

describe("SubjectCard", () => {
  it("renders the real lesson count and links to the subject's hub route, with no mastery/completion claim", () => {
    render(<SubjectCard learningArea="Mathematics" lessonCount={24} href="/student/learn/mathematics" />);

    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("24 lessons")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mathematics/i })).toHaveAttribute(
      "href",
      "/student/learn/mathematics",
    );

    // No fabricated "X Mastered" / "X of Y Complete" — no such field exists.
    expect(screen.queryByText(/mastered/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("singularises the lesson count for exactly one lesson", () => {
    render(<SubjectCard learningArea="English" lessonCount={1} href="/student/learn/english" />);
    expect(screen.getByText("1 lesson")).toBeInTheDocument();
  });
});
