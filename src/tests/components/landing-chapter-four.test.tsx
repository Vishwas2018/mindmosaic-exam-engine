import { render, screen, within } from "@testing-library/react";
import { motionValue } from "framer-motion";
import { describe, expect, it } from "vitest";

import {
  chapter4Sample,
  chapter4Scenes,
  chapterFour,
} from "@/features/landing/chapter4-progress";
import { ChapterFourProgressParents } from "@/features/landing/components/ChapterFourProgressParents";
import {
  AssembledParentMosaic,
  BandBadge,
  ScoreRing,
  SubjectProgressModule,
} from "@/features/landing/components/chapter-four-visuals";

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

describe("ScoreRing component motion and band behaviour", () => {
  it("renders reactively with a Framer Motion value", () => {
    const draw = motionValue(0.5);
    const { container } = render(<ScoreRing percentage={80} draw={draw} label="Test score" />);

    expect(screen.getByRole("img", { name: "Test score: 80%" })).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("renders with static number draw factor", () => {
    const { container } = render(<ScoreRing percentage={70} draw={1} label="Static score" />);
    expect(screen.getByRole("img", { name: "Static score: 70%" })).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("renders focus band (<50%) with error tone", () => {
    const { container } = render(
      <ScoreRing percentage={42} label="Low score" band="focus" />,
    );
    expect(screen.getByText("42%")).toBeInTheDocument();
    const circles = container.querySelectorAll("circle");
    const arcCircle = circles[1];
    expect(arcCircle).toHaveClass("text-error");
  });
});

describe("BandBadge component", () => {
  it("renders all four performance bands with canonical labels and styles", () => {
    const { rerender } = render(<BandBadge band="strong" />);
    expect(screen.getByText("Strong")).toHaveClass("text-success");

    rerender(<BandBadge band="good" />);
    expect(screen.getByText("Good")).toHaveClass("text-primary");

    rerender(<BandBadge band="building" />);
    expect(screen.getByText("Building")).toHaveClass("text-warning");

    rerender(<BandBadge band="focus" />);
    expect(screen.getByText("Needs practice")).toHaveClass("text-error");
  });

  it("permits explicit label override if provided", () => {
    render(<BandBadge band="strong" label="Custom Strong" />);
    expect(screen.getByText("Custom Strong")).toBeInTheDocument();
  });
});

describe("SubjectProgressModule component motion and focus band", () => {
  it("renders reactive bars when buildProgress is a MotionValue", () => {
    const build = motionValue(0.8);
    const { container } = render(<SubjectProgressModule buildProgress={build} />);

    const progressbars = container.querySelectorAll('[role="progressbar"]');
    expect(progressbars.length).toBe(3);
  });

  it("renders focus band subjects (<50%) with 'Needs practice' and error styling", () => {
    const customSubjects = [
      {
        subject: "geometry",
        label: "Geometry",
        count: 4,
        total: 10,
        percentage: 40,
        band: "focus" as const,
        bandLabel: "Needs practice",
      },
    ];

    const { container } = render(<SubjectProgressModule subjects={customSubjects} />);
    expect(screen.getByText("Geometry")).toBeInTheDocument();
    expect(screen.getByText("Needs practice")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();

    const bar = container.querySelector('[role="progressbar"] > div');
    expect(bar).toHaveClass("bg-error");
  });
});

describe("AssembledParentMosaic component motion assembly", () => {
  it("renders assembled modules with a Framer Motion value", () => {
    const build = motionValue(0.5);
    const { container } = render(<AssembledParentMosaic build={build} />);

    expect(container.querySelector('[data-module="parent-header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-module="latest-result"]')).toBeInTheDocument();
    expect(container.querySelector('[data-module="weekly-activity"]')).toBeInTheDocument();
    expect(container.querySelector('[data-module="subject-progress"]')).toBeInTheDocument();
    expect(container.querySelector('[data-module="recent-sessions"]')).toBeInTheDocument();
  });
});
