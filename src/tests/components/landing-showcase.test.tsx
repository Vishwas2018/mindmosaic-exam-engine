import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { QuestionTypes } from "@/features/landing/components/QuestionTypes";
import { Showcase } from "@/features/landing/components/Showcase";
import { questionTypes, showcase } from "@/features/landing/content";

describe("Showcase", () => {
  it("offers all nine views as tabs", () => {
    render(<Showcase />);
    const tabs = within(screen.getByRole("tablist", { name: "Platform views" })).getAllByRole("tab");
    expect(tabs).toHaveLength(showcase.screens.length);
  });

  it("opens on the student home and switches screens on click", async () => {
    render(<Showcase />);
    expect(screen.getByRole("heading", { name: "Good afternoon, Mia." })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Parent view" }));
    expect(screen.getByRole("heading", { name: "Your family this fortnight" })).toBeInTheDocument();
  });

  /*
   * The section's whole argument is that practice and exam simulation are
   * different experiences — practice explains as you go, the simulation
   * holds feedback until submission. If those two screens ever render the
   * same thing, the claim is false.
   */
  it("shows practice mode and exam simulation as genuinely different screens", async () => {
    render(<Showcase />);
    await userEvent.click(screen.getByRole("tab", { name: "Practice mode" }));
    expect(screen.getByText(/Practice mode · untimed · feedback after submit/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Exam simulation" }));
    expect(screen.getByText(/Exam simulation · NAPLAN-style numeracy/)).toBeInTheDocument();
    expect(screen.getByText(/not official examinations or past papers/i)).toBeInTheDocument();
  });

  it("labels every illustrative figure as illustrative", async () => {
    render(<Showcase />);
    expect(screen.getByText(/All names, scores and dates shown are illustrative/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Session results" }));
    expect(screen.getByText(/Session results · illustrative/)).toBeInTheDocument();
  });

  it("moves between tabs with the arrow keys", async () => {
    render(<Showcase />);
    screen.getByRole("tab", { name: "Student home" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Learning Hub" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("QuestionTypes", () => {
  it("lists all 14 types at once, so the heading's count can be checked", () => {
    render(<QuestionTypes />);
    const all = questionTypes.families.flatMap((family) => family.types);
    expect(all).toHaveLength(14);
    for (const type of all) {
      expect(screen.getAllByText(type).length).toBeGreaterThan(0);
    }
  });

  it("swaps the worked example when another family is selected", async () => {
    render(<QuestionTypes />);
    // The prompt bolds "all", so the copy is split across elements — match
    // the contiguous tail rather than the whole sentence.
    expect(screen.getByText(/the numbers that are multiples of 6\./)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Enter" }));
    expect(screen.getByText(/A netball club sells 148 tickets/)).toBeInTheDocument();
  });

  it("shows the keyboard-focus state as a labelled state, not colour alone", () => {
    render(<QuestionTypes />);
    expect(screen.getByText("Keyboard focus")).toBeInTheDocument();
    expect(screen.getByText(/never colour alone/i)).toBeInTheDocument();
  });
});
