import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  chapter4Sample,
  chapter4Scenes,
  chapterFour,
} from "@/features/landing/chapter4-progress";
import { ChapterFourProgressParents } from "@/features/landing/components/ChapterFourProgressParents";

function scene(container: HTMLElement, id: string) {
  return within(container.querySelector(`[data-scene="${id}"]`) as HTMLElement);
}

describe("Chapter 4 progress and parents component", () => {
  it("has exactly one chapter h2 and three scene h3s in order", () => {
    const { container } = render(<ChapterFourProgressParents />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: chapterFour.heading })).toBeInTheDocument();

    const h3s = within(container)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(h3s).toEqual(chapter4Scenes.map((entry) => entry.heading));
  });

  it("previews the three steps in the intro and ends on the hand-off to quality", () => {
    const { container } = render(<ChapterFourProgressParents />);
    const steps = within(screen.getByRole("list", { name: "The three steps" })).getAllByRole("listitem");
    expect(steps).toHaveLength(3);

    const handoff = container.querySelector('[data-handoff="quality"]')!;
    expect(handoff).toHaveTextContent(chapterFour.handoff.heading);
    expect(handoff).toHaveTextContent(chapterFour.handoff.body);
  });

  it("renders Scene 1 (Latest) with score ring and session details", () => {
    const { container } = render(<ChapterFourProgressParents />);
    const latest = scene(container, "latest");

    expect(latest.getByText(chapter4Sample.latestSession.label)).toBeInTheDocument();
    expect(latest.getByText(/8 of 10 answered/)).toBeInTheDocument();
    expect(latest.getByText(/Completed Thu/)).toBeInTheDocument();
    expect(latest.getByRole("img", { name: /Latest session score.*80%/i })).toBeInTheDocument();
    expect(latest.getByText(chapterFour.sampleLabel)).toBeInTheDocument();
  });

  it("renders Scene 2 (Subjects) with accessible progress bars and band badges", () => {
    const { container } = render(<ChapterFourProgressParents />);
    const subjects = scene(container, "subjects");

    for (const sub of chapter4Sample.subjects) {
      expect(subjects.getByText(sub.label)).toBeInTheDocument();
      expect(subjects.getByText(`${sub.percentage}%`)).toBeInTheDocument();
      expect(subjects.getByText(sub.bandLabel)).toBeInTheDocument();
    }

    const progressbars = subjects.getAllByRole("progressbar");
    expect(progressbars).toHaveLength(3);
    expect(progressbars[0]).toHaveAttribute("aria-valuenow", "80");
    expect(progressbars[1]).toHaveAttribute("aria-valuenow", "70");
    expect(progressbars[2]).toHaveAttribute("aria-valuenow", "60");
  });

  it("renders Scene 3 (Parent view) with Aisha · Year 3, read-only cue, weekly activity and recent work", () => {
    const { container } = render(<ChapterFourProgressParents />);
    const parent = scene(container, "parent");

    expect(parent.getByText(chapter4Sample.studentName)).toBeInTheDocument();
    expect(parent.getByText("Parent view · Read only")).toBeInTheDocument();

    // Weekly activity
    for (const item of chapter4Sample.week) {
      expect(parent.getByText(item.day)).toBeInTheDocument();
      expect(
        parent.getByText(new RegExp(`${item.day}: ${item.done ? "practice session completed" : "no session"}`)),
      ).toBeInTheDocument();
    }

    // Recent work rows
    for (const s of chapter4Sample.recentSessions) {
      expect(parent.getAllByText(s.label).length).toBeGreaterThanOrEqual(1);
      expect(parent.getByText(new RegExp(`${s.count} of ${s.total} · ${s.when}`))).toBeInTheDocument();
    }

    // CTA
    expect(parent.getByRole("link", { name: "Parent guide" })).toHaveAttribute("href", "/parent-guide");
  });

  it("keeps the sample product visuals strictly read-only (no buttons or form inputs)", () => {
    const { container } = render(<ChapterFourProgressParents />);
    expect(within(container).queryAllByRole("button")).toHaveLength(0);

    const productContainers = container.querySelectorAll(
      "section[data-scene] > div:last-child",
    );
    for (const pc of productContainers) {
      expect(pc.querySelectorAll("a, button, input, select, textarea, [tabindex]")).toHaveLength(0);
    }
  });
});
