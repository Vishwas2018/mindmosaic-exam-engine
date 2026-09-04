import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LessonPathwayList } from "@/features/curriculum/lessons/components/LessonPathwayList";
import { getLevel3NumberPathway } from "@/features/curriculum/lessons/content";

describe("LessonPathwayList Component", () => {
  const pathway = getLevel3NumberPathway();

  it("renders pathway header, description and draft badge when previewMode is true and open", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={true} isOpen={true} onToggle={() => {}} />);

    expect(screen.getByText(pathway.title)).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText(/9 lessons/i)).toBeInTheDocument();
  });

  it("does not render draft badge when previewMode is false (published student mode)", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={false} isOpen={true} onToggle={() => {}} />);

    expect(screen.getByText(pathway.title)).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    expect(screen.getByText(/9 lessons/i)).toBeInTheDocument();
  });

  it("marks the accordion header's expanded state via aria-expanded", () => {
    const { rerender } = render(
      <LessonPathwayList pathway={pathway} previewMode={false} isOpen={false} onToggle={() => {}} />,
    );
    expect(screen.getByRole("button", { name: new RegExp(pathway.title) })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    rerender(<LessonPathwayList pathway={pathway} previewMode={false} isOpen={true} onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: new RegExp(pathway.title) })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("keeps every lesson card mounted (not unmounted) even while the accordion is closed", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={false} isOpen={false} onToggle={() => {}} />);

    // getByText finds DOM text regardless of the `hidden` attribute — the
    // panel must stay mounted, only visually/AT-hidden, so it's reachable
    // by Ctrl-F and deep links even while the accordion is closed.
    for (const node of pathway.nodes) {
      expect(screen.getByText(node.title)).toBeInTheDocument();
    }
    // But collapsed content must be excluded from the accessibility tree.
    expect(screen.queryByRole("link", { name: /Start lesson/i })).not.toBeInTheDocument();
  });

  it("renders all 9 lesson cards in sequential order when open", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={true} isOpen={true} onToggle={() => {}} />);

    for (const node of pathway.nodes) {
      expect(screen.getAllByText(node.curriculumCode).length).toBeGreaterThan(0);
      expect(screen.getByText(node.title)).toBeInTheDocument();
    }
  });

  it("renders prerequisite links on cards that have prerequisites, once expanded", async () => {
    const user = userEvent.setup();
    render(<LessonPathwayList pathway={pathway} previewMode={true} isOpen={true} onToggle={() => {}} />);

    // VC2M3N04 has prerequisite VC2M3N02, tucked behind a disclosure toggle
    const toggles = screen.getAllByRole("button", { name: /prerequisite/i });
    for (const toggle of toggles) {
      await user.click(toggle);
    }

    const prereqLink = screen.getAllByRole("link", { name: "VC2M3N02" });
    expect(prereqLink.length).toBeGreaterThan(0);
  });

  it("renders start lesson and practice drill CTAs for each lesson when open", () => {
    render(<LessonPathwayList pathway={pathway} previewMode={true} isOpen={true} onToggle={() => {}} />);

    const startButtons = screen.getAllByRole("link", { name: /Start lesson/i });
    expect(startButtons).toHaveLength(9);

    const drillButtons = screen.getAllByRole("link", { name: /Practise drill/i });
    expect(drillButtons).toHaveLength(9);
  });
});
