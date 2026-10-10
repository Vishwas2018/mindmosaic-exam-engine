import { render, screen, within } from "@testing-library/react";
import { motionValue } from "framer-motion";
import { describe, expect, it } from "vitest";

import { ChapterTwoPrograms } from "@/features/landing/components/ChapterTwoPrograms";
import { chapter2Scenes } from "@/features/landing/chapter2-scenes";
import { ProgramScene } from "@/features/landing/components/ProgramScene";
import { chapterTwo, faqAndStart } from "@/features/landing/content";

/*
 * jsdom has no layout and no matchMedia, so the chapter renders in its
 * natural-flow mode: the same DOM a phone, a tablet or a reduced-motion
 * visitor gets, fully built and unhidden.
 */
describe("Chapter 2 programmes", () => {
  it("opens with 'Choose your pathway.' as the chapter heading and states what is open", () => {
    render(<ChapterTwoPrograms />);
    expect(screen.getByRole("heading", { level: 2, name: chapterTwo.heading })).toBeInTheDocument();
    expect(screen.getByText(/Open now: NAPLAN-style and ICAS-style practice for Years 3 and 5/)).toBeInTheDocument();
  });

  it("renders the six scenes in order, each with an h3, a status and its 0N / 06 label", () => {
    const { container } = render(<ChapterTwoPrograms />);
    const scenes = [...container.querySelectorAll("[data-scene]")] as HTMLElement[];
    expect(scenes.map((scene) => scene.getAttribute("data-scene"))).toEqual(chapter2Scenes.map((scene) => scene.id));
    chapter2Scenes.forEach((data, index) => {
      const scene = within(scenes[index]!);
      expect(scene.getByRole("heading", { level: 3, name: data.heading })).toBeInTheDocument();
      expect(scene.getByText(data.statusLine)).toBeInTheDocument();
      expect(scene.getByText(`0${data.number} / 06`)).toBeInTheDocument();
    });
  });

  it("labels NAPLAN and ICAS Available, Curriculum Limited, and the other three In development", () => {
    const { container } = render(<ChapterTwoPrograms />);
    const text = (id: string) => container.querySelector(`[data-scene="${id}"]`)!.textContent ?? "";
    expect(text("naplan")).toContain("Available now · Years 3 & 5");
    expect(text("icas")).toContain("Available now · Years 3 & 5");
    expect(text("curriculum")).toContain("Limited · Years 3 & 5");
    expect(text("curriculum")).not.toContain("In development");
    expect(text("curriculum")).not.toContain("Available now");
    for (const id of ["amc", "singapore", "selective"]) {
      expect(text(id), id).toContain("In development");
      expect(text(id), id).not.toContain("Available now");
    }
  });

  it("states the same Curriculum truth as the FAQ and the intro, so the page never contradicts itself", () => {
    const { container } = render(<ChapterTwoPrograms />);
    const faq = faqAndStart.items[0]!.answer;
    const note = chapter2Scenes[2]!.note!;
    for (const text of [faq, note, chapterTwo.availability]) expect(text).toMatch(/Years 3 and 5/);
    for (const text of [faq, note]) expect(text).toMatch(/Maths and English/);
    expect(faq).toMatch(/Curriculum lessons are limited and open to signed-in students/);
    expect(faq).toMatch(/wider coverage still being developed/);
    expect(chapterTwo.availability).toMatch(/Curriculum learning has limited Years 3 and 5 lesson coverage/);
    expect(chapterTwo.availability).not.toMatch(/other four pathways are in development/);
    for (const text of [faq, chapterTwo.availability]) expect(text).not.toMatch(/curriculum[^.]*in development/i);
    expect(container.querySelector('[data-scene="curriculum"]')!.textContent).toContain("Limited");
  });

  it("links the Curriculum scene to Explore learning and gives it no practice CTA", () => {
    const { container } = render(<ChapterTwoPrograms />);
    const scene = within(container.querySelector('[data-scene="curriculum"]') as HTMLElement);
    expect(scene.getByRole("link", { name: "Explore learning" })).toHaveAttribute("href", "/learn");
    expect(scene.queryByRole("link", { name: /practice options|Explore .*-style practice/i })).toBeNull();
  });

  it("keeps the selective caveat and never implies a live scholarship programme", () => {
    render(<ChapterTwoPrograms />);
    expect(screen.getByText(/Formats and eligibility vary by state and programme/)).toBeInTheDocument();
    expect(screen.getByText(/Scholarship-style preparation is a planned direction, not open/)).toBeInTheDocument();
  });

  it("shows a stationary product window on all six scenes and no photographs", () => {
    const { container } = render(<ChapterTwoPrograms />);
    const photos = [...container.querySelectorAll("img")].filter((image) =>
      decodeURIComponent(image.getAttribute("src") ?? "").includes("/chapter-02-programs/"),
    );
    expect(photos).toHaveLength(0);
    for (const id of ["naplan", "icas", "curriculum", "amc", "singapore", "selective"]) {
      const windows = container.querySelectorAll(`[data-scene="${id}"] [data-preview-window]`);
      expect(windows, id).toHaveLength(1);
      const frame = windows[0] as HTMLElement;
      expect(frame.getAttribute("aria-hidden"), id).toBe("true");
      expect(frame.hasAttribute("inert"), id).toBe(true);
      // The official lockup mark is on every screen.
      expect(frame.querySelector('img[src*="mark"]'), id).not.toBeNull();
    }
  });

  it("draws live programmes from the real app and labels the three in-development ones as planned concepts", () => {
    const { container } = render(<ChapterTwoPrograms />);
    const preview = (id: string) => container.querySelector(`[data-scene="${id}"] [data-preview-window]`)!.textContent ?? "";
    // Real exam runner, real ICAS hub, real lesson.
    expect(preview("naplan")).toContain("Question 6 of 20");
    expect(preview("naplan")).toContain("Mia has 24 stickers");
    expect(preview("icas")).toContain("ICAS practice");
    expect(preview("curriculum")).toContain("Learning Intention");
    for (const id of ["naplan", "icas", "curriculum"]) {
      expect(preview(id), id).not.toMatch(/Planned|Illustrative concept/);
    }
    for (const id of ["amc", "singapore", "selective"]) {
      expect(preview(id), id).toMatch(/Planned · .* · in development/);
      expect(preview(id), id).toContain("Illustrative concept screen. Not available yet.");
    }
  });

  it("keeps the window still: scene progress changes opacity only, never a transform", () => {
    const naplan = chapter2Scenes[0]!;
    const progress = motionValue(0.15);
    const { container } = render(<ProgramScene scene={naplan} layerIndex={1} progress={progress} />);
    const wrapper = container.querySelector<HTMLElement>("[data-preview]")!;
    for (const value of [0.04, 0.1, 0.15, 0.2, 0.3]) {
      progress.set(value);
      expect(wrapper.style.transform, String(value)).toBe("");
      expect(wrapper.style.scale, String(value)).toBe("");
    }
  });

  it("places the preview before the explanation from lg up", () => {
    const { container } = render(<ProgramScene scene={chapter2Scenes[0]!} layerIndex={1} progress={null} />);
    expect(container.querySelector("[data-preview]")!.className).toMatch(/lg:order-1/);
    expect(container.querySelector("[data-preview]")!.className).toMatch(/lg:col-span-7/);
    expect(container.querySelector("h3")!.closest("div[class*='lg:order-2']")).not.toBeNull();
  });

  it("links an Available scene to its programme and ends on the Chapter 3 hand-off", () => {
    const { container } = render(<ChapterTwoPrograms />);
    expect(screen.getByRole("link", { name: /Explore NAPLAN-style practice/ })).toHaveAttribute(
      "href",
      "/programs/naplan-style",
    );
    expect(screen.getByRole("link", { name: /Explore ICAS-style practice/ })).toHaveAttribute(
      "href",
      "/programs/icas-style",
    );
    const handoff = within(container.querySelector('[data-handoff="chapter-3"]') as HTMLElement);
    expect(handoff.getByText("See how MindMosaic works.").tagName).toBe("P");
    expect(handoff.queryByRole("heading", { name: "See how MindMosaic works." })).toBeNull();
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([chapterTwo.heading]);
    expect(handoff.getByRole("link", { name: /Explore all programs/ })).toHaveAttribute("href", "/programs");
  });

  it("has no pinned progress navigator in flow mode, and no timers or live regions", () => {
    const { container } = render(<ChapterTwoPrograms />);
    expect(screen.queryByRole("navigation", { name: chapterTwo.progressLabel })).toBeNull();
    // The decorative product windows reuse real app components (the lesson stepper has a live region); they are inert and hidden.
    const live = [...container.querySelectorAll("[aria-live]")].filter((node) => !node.closest("[data-preview-window]"));
    expect(live).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /play|pause|slideshow/i })).toBeNull();
  });
});
