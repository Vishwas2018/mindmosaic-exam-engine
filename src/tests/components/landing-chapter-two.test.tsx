import { render, screen, within } from "@testing-library/react";
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

  it("uses a decorative empty-alt photograph on all six programme scenes", () => {
    const { container } = render(<ChapterTwoPrograms />);
    // The product cards carry the real MindMosaic mark as an <img>; only the photographs are under test here.
    const images = [...container.querySelectorAll("img")].filter((image) =>
      decodeURIComponent(image.getAttribute("src") ?? "").includes("/landing/media/chapter-02-programs/"),
    );
    expect(images).toHaveLength(6);
    for (const image of images) expect(image.getAttribute("alt")).toBe("");
    for (const id of ["naplan", "icas", "curriculum", "amc", "singapore", "selective"]) {
      const sources = [...container.querySelectorAll(`[data-scene="${id}"] img`)].map((image) =>
        decodeURIComponent(image.getAttribute("src") ?? ""),
      );
      expect(sources.some((src) => src.includes("chapter-02-programs")), id).toBe(true);
    }
  });

  it("mounts a scene photograph only when enabled and keeps it mounted afterwards", () => {
    const naplan = chapter2Scenes[0]!;
    const photos = (container: HTMLElement) =>
      [...container.querySelectorAll("img")].filter((image) =>
        decodeURIComponent(image.getAttribute("src") ?? "").includes("/chapter-02-programs/"),
      );
    const { container, rerender } = render(
      <ProgramScene scene={naplan} layerIndex={1} progress={null} imageEnabled={false} />,
    );
    expect(photos(container)).toHaveLength(0);
    rerender(<ProgramScene scene={naplan} layerIndex={1} progress={null} imageEnabled />);
    expect(photos(container)).toHaveLength(1);
    expect(photos(container)[0]!.getAttribute("loading")).toBe("lazy");
    rerender(<ProgramScene scene={naplan} layerIndex={1} progress={null} imageEnabled={false} />);
    expect(photos(container)).toHaveLength(1);
  });

  it("gives meaningful product graphics accessible names and marks no answer", () => {
    render(<ChapterTwoPrograms />);
    expect(screen.getByRole("article", { name: "Sample NAPLAN-style practice paper" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Sample curriculum lesson" })).toBeInTheDocument();
    const model = screen.getByRole("img", { name: /^Bar model\./ });
    expect(model.getAttribute("aria-label")).toBe(
      "Bar model. Mia has 3 units, Ben has 5 units. Together that is 8 units, which is 40 stickers.",
    );
    expect(screen.getByRole("article", { name: "Sample ICAS-style extension question" })).not.toHaveTextContent(
      /selected/i,
    );
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
    expect(container.querySelector("[aria-live]")).toBeNull();
    expect(screen.queryByRole("button", { name: /play|pause|slideshow/i })).toBeNull();
  });
});
