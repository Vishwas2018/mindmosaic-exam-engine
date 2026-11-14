import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ChildSwitcher,
  MarksMeter,
  ClaimWithEvidence,
  LoadingStateBlock,
  NothingYetStateBlock,
  NotEnoughYetStateBlock,
  CouldNotLoadStateBlock,
  INSUFFICIENT_EVIDENCE_COPY,
  MIN_CLAIM_PAPERS,
  MIN_CLAIM_MARKS,
} from "@/features/parent-dashboard";

describe("ChildSwitcher", () => {
  const sampleChildren = [
    { id: "child-1", name: "Aisha" },
    { id: "child-2", name: "Kiran" },
  ];

  it("renders All children and each child with initial letter", () => {
    render(
      <ChildSwitcher
        childrenList={sampleChildren}
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /all children/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aisha/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kiran/i })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("K")).toBeInTheDocument();
  });

  it("marks the active child with aria-current and aria-pressed", () => {
    render(
      <ChildSwitcher
        childrenList={sampleChildren}
        selectedId="child-1"
        onSelect={vi.fn()}
      />,
    );

    const aishaButton = screen.getByRole("button", { name: /aisha/i });
    expect(aishaButton).toHaveAttribute("aria-current", "page");
    expect(aishaButton).toHaveAttribute("aria-pressed", "true");

    const kiranButton = screen.getByRole("button", { name: /kiran/i });
    expect(kiranButton).not.toHaveAttribute("aria-current");
    expect(kiranButton).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSelect when a pill is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <ChildSwitcher
        childrenList={sampleChildren}
        selectedId={null}
        onSelect={handleSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /kiran/i }));
    expect(handleSelect).toHaveBeenCalledWith("child-2");
  });

  it("renders link elements when hrefForChild is provided", () => {
    render(
      <ChildSwitcher
        childrenList={sampleChildren}
        selectedId="child-2"
        hrefForChild={(id) => (id ? `/parent/children/${id}` : "/parent")}
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "/parent");
    expect(links[2]).toHaveAttribute("href", "/parent/children/child-2");
    expect(links[2]).toHaveAttribute("aria-current", "page");
  });
});

describe("MarksMeter", () => {
  it("renders exact mark counts and never renders a percentage sign", () => {
    const { container } = render(
      <MarksMeter
        label="Numeracy"
        earnedMarks={41}
        availableMarks={60}
        papersCount={3}
      />,
    );

    expect(screen.getByText("Numeracy")).toBeInTheDocument();
    expect(screen.getByText("41 of 60 marks")).toBeInTheDocument();
    expect(screen.getByText("3 papers · 60 marks counted")).toBeInTheDocument();

    // Strict honesty rule: No percentage symbol rendered
    expect(container.textContent).not.toContain("%");
  });

  it("hides the visual progress bar from assistive tech with aria-hidden", () => {
    const { container } = render(
      <MarksMeter label="Reading" earnedMarks={15} availableMarks={20} />,
    );

    const decorativeBar = container.querySelector('[aria-hidden="true"]');
    expect(decorativeBar).toBeInTheDocument();
  });
});

describe("ClaimWithEvidence", () => {
  it("renders the evaluative claim when threshold (>= 2 papers AND >= 8 marks) is met", () => {
    render(
      <ClaimWithEvidence
        headline="Going well: Number and algebra"
        papersCount={3}
        marksCount={26}
      />,
    );

    expect(screen.getByText("Going well: Number and algebra")).toBeInTheDocument();
    expect(screen.getByText("3 papers · 26 marks counted")).toBeInTheDocument();
    expect(screen.queryByText(INSUFFICIENT_EVIDENCE_COPY)).not.toBeInTheDocument();
  });

  it("withholds claim and renders exact insufficient evidence copy when papers < 2", () => {
    render(
      <ClaimWithEvidence
        headline="Going well: Number and algebra"
        papersCount={1}
        marksCount={20}
      />,
    );

    expect(screen.queryByText("Going well: Number and algebra")).not.toBeInTheDocument();
    expect(screen.getByText("To practise")).toBeInTheDocument();
    expect(screen.getByText(INSUFFICIENT_EVIDENCE_COPY)).toBeInTheDocument();
    expect(screen.getByText("1 paper · 20 marks")).toBeInTheDocument();
  });

  it("withholds claim when marks < 8", () => {
    render(
      <ClaimWithEvidence
        headline="Going well: Number and algebra"
        papersCount={3}
        marksCount={7}
      />,
    );

    expect(screen.queryByText("Going well: Number and algebra")).not.toBeInTheDocument();
    expect(screen.getByText(INSUFFICIENT_EVIDENCE_COPY)).toBeInTheDocument();
  });

  it("exports standard threshold constants", () => {
    expect(MIN_CLAIM_PAPERS).toBe(2);
    expect(MIN_CLAIM_MARKS).toBe(8);
  });
});

describe("StateBlocks", () => {
  it("renders LoadingStateBlock with role=status", () => {
    render(<LoadingStateBlock />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Checking this week's practice...");
    expect(status).toHaveTextContent("Loading your family's recent activity.");
  });

  it("renders NothingYetStateBlock with child fact", () => {
    render(<NothingYetStateBlock childName="Aisha" />);
    expect(screen.getByText("Nothing finished yet")).toBeInTheDocument();
    expect(
      screen.getByText("Once Aisha completes a practice session or exam, their work will appear here."),
    ).toBeInTheDocument();
  });

  it("renders NotEnoughYetStateBlock below floor", () => {
    render(<NotEnoughYetStateBlock papersCount={1} marksCount={5} />);
    expect(screen.getByText("Not enough yet to show trends")).toBeInTheDocument();
    expect(
      screen.getByText("Needs at least 2 finished papers and 8 marks to establish reliable evidence."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Current recorded work: 1 paper · 5 marks/i)).toBeInTheDocument();
  });

  it("renders CouldNotLoadStateBlock with role=alert and honest copy", () => {
    render(<CouldNotLoadStateBlock />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("We couldn't load this section.");
    expect(alert).toHaveTextContent(
      "Nothing has changed on your account. Please refresh or try again in a few minutes.",
    );
  });
});
