import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { chapter3Scenes, chapterThree, journeySamples } from "@/features/landing/chapter3-journey";
import { ChapterThreeHowItWorks } from "@/features/landing/components/ChapterThreeHowItWorks";

/*
 * jsdom has no layout and no matchMedia, so the chapter renders in its
 * natural-flow shape: what phones, tablets and reduced-motion visitors get.
 */
function scene(container: HTMLElement, id: string) {
  return within(container.querySelector(`[data-scene="${id}"]`) as HTMLElement);
}

describe("Chapter 3 how it works", () => {
  it("has exactly one chapter h2 and four scene h3s in order", () => {
    const { container } = render(<ChapterThreeHowItWorks />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: chapterThree.heading })).toBeInTheDocument();
    const h3s = within(container).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(h3s).toEqual(chapter3Scenes.map((entry) => entry.heading));
  });

  it("previews the four steps in the intro and ends on the hand-off to Chapter 4", () => {
    const { container } = render(<ChapterThreeHowItWorks />);
    const steps = within(screen.getByRole("list", { name: "The four steps" })).getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    const handoff = container.querySelector('[data-handoff="chapter-4"]')!;
    expect(handoff).toHaveTextContent("See progress clearly.");
    expect(handoff).toHaveTextContent(chapterThree.handoff.body);
  });

  it("shows the lesson with its fraction model, worked example and common mix-up", () => {
    const { container } = render(<ChapterThreeHowItWorks />);
    const learn = scene(container, "learn");
    expect(learn.getByText(journeySamples.lesson.intention)).toBeInTheDocument();
    expect(learn.getByRole("img", { name: /bar split into 4 equal parts/i })).toBeInTheDocument();
    expect(learn.getByText(journeySamples.lesson.workedExample)).toBeInTheDocument();
    expect(learn.getByText(journeySamples.lesson.mixUp)).toBeInTheDocument();
  });

  it("shows the same question in Practise and Understand, so each reads on its own on a phone", () => {
    const { container } = render(<ChapterThreeHowItWorks />);
    for (const id of ["practise", "understand"]) {
      const view = scene(container, id);
      expect(view.getByText("What fraction of the bar is shaded?")).toBeInTheDocument();
      expect(view.getByRole("img", { name: "A bar split into 8 equal parts with 3 parts shaded" })).toBeInTheDocument();
    }
  });

  it("Practise shows the wrong pick with no verdict", () => {
    const { container } = render(<ChapterThreeHowItWorks />);
    const practise = scene(container, "practise");
    expect(practise.getByText("Selected")).toBeInTheDocument();
    expect(practise.queryByText(/Correct answer/)).toBeNull();
    expect(practise.queryByText(/not correct/i)).toBeNull();
    expect(practise.queryByText(journeySamples.practice.explanationSteps[0])).toBeNull();
  });

  it("Understand labels both answers in words and shows the approved worked explanation", () => {
    const { container } = render(<ChapterThreeHowItWorks />);
    const understand = scene(container, "understand");
    expect(understand.getByText(/Your answer · not correct/)).toBeInTheDocument();
    expect(understand.getByText("Correct answer")).toBeInTheDocument();
    for (const step of journeySamples.practice.explanationSteps) expect(understand.getByText(step)).toBeInTheDocument();
    const options = understand.getAllByRole("listitem").filter((item) => /Option [A-D]:/.test(item.textContent ?? ""));
    expect(options.find((item) => /Option A/.test(item.textContent ?? ""))).toHaveTextContent("Your answer");
    expect(options.find((item) => /Option B/.test(item.textContent ?? ""))).toHaveTextContent("Correct answer");
  });

  it("Next shows the sample skill breakdown with states and values in words, and conditional wording", () => {
    const { container } = render(<ChapterThreeHowItWorks />);
    const next = scene(container, "next");
    for (const skill of journeySamples.results.skills) {
      expect(next.getByText(skill.name)).toBeInTheDocument();
      expect(next.getByText(skill.state)).toBeInTheDocument();
      expect(next.getByText(`${skill.value}%`)).toBeInTheDocument();
    }
    expect(next.getByText(journeySamples.results.nextSet)).toBeInTheDocument();
    expect(next.getByText(/After an eligible test, MindMosaic can highlight/)).toBeInTheDocument();
    expect(next.getByText("Suggestions follow fixed rules applied to the student's answers.")).toBeInTheDocument();
    expect(screen.getAllByText(chapterThree.sampleLabel).length).toBeGreaterThanOrEqual(4);
  });

  it("keeps the sample product read-only: no buttons or tab stops inside the product frames", () => {
    const { container } = render(<ChapterThreeHowItWorks />);
    expect(within(container).queryAllByRole("button")).toHaveLength(0);
    const frames = container.querySelectorAll("section[data-scene] > div:last-child");
    expect(frames).toHaveLength(4);
    for (const frame of frames) {
      expect(frame.querySelectorAll("a, button, input, select, [tabindex]")).toHaveLength(0);
    }
  });

  it("links only to real routes and has no pinned navigator in flow mode", () => {
    const { container } = render(<ChapterThreeHowItWorks />);
    expect(screen.getByRole("link", { name: "Explore learning" })).toHaveAttribute("href", "/learn");
    expect(screen.getAllByRole("link", { name: /Try practice|Explore practice/ }).length).toBe(2);
    expect(screen.queryByRole("navigation", { name: chapterThree.progressLabel })).toBeNull();
    // The only <img> is the real MindMosaic brand mark in each frame header; no photography, canvas or video.
    const pictures = [...container.querySelectorAll("img")].filter(
      (image) => !decodeURIComponent(image.getAttribute("src") ?? "").includes("/brand/"),
    );
    expect(pictures).toHaveLength(0);
    expect(container.querySelector("canvas, video")).toBeNull();
    expect(container.querySelector("[aria-live]")).toBeNull();
  });
});
