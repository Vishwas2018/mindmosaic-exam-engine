import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Program } from "@/features/catalogue/catalogue";
import { ProgramGrid } from "@/features/catalogue/components/ProgramGrid";

const NUMERACY: Program = {
  id: "num",
  slug: "num",
  name: "Numeracy program",
  blurb: "blurb",
  status: "live",
  scope: { yearLevel: 3, examStyle: "naplan_style", subject: "numeracy", initialBankId: "curated" },
};

const READING: Program = {
  id: "read",
  slug: "read",
  name: "Reading program",
  blurb: "blurb",
  status: "live",
  scope: { yearLevel: 3, examStyle: "naplan_style", subject: "reading", initialBankId: "curated" },
};

const PREMIUM_READING: Program = {
  ...READING,
  id: "read-premium",
  slug: "read-premium",
  planTier: "premium",
};

describe("ProgramGrid", () => {
  it("shows every program with no filter applied", () => {
    render(<ProgramGrid programs={[NUMERACY, READING]} />);
    expect(screen.getByText("Numeracy program")).toBeInTheDocument();
    expect(screen.getByText("Reading program")).toBeInTheDocument();
  });

  it("filters the grid down to the selected subject", async () => {
    const user = userEvent.setup();
    render(<ProgramGrid programs={[NUMERACY, READING]} />);

    await user.click(screen.getByTestId("subject-filter-reading"));
    expect(screen.getByText("Reading program")).toBeInTheDocument();
    expect(screen.queryByText("Numeracy program")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("subject-filter-all"));
    expect(screen.getByText("Numeracy program")).toBeInTheDocument();
  });

  it("keeps alwaysShown programs visible regardless of the active filter", async () => {
    const user = userEvent.setup();
    const mixed: Program = { id: "mixed", slug: "mixed", name: "Mixed practice", blurb: "b", status: "live" };
    render(<ProgramGrid programs={[NUMERACY, READING]} alwaysShown={[mixed]} />);

    await user.click(screen.getByTestId("subject-filter-numeracy"));
    expect(screen.getByText("Mixed practice")).toBeInTheDocument();
    expect(screen.queryByText("Reading program")).not.toBeInTheDocument();
  });

  it("renders a locked upgrade card for a premium program on the free plan", () => {
    render(<ProgramGrid programs={[PREMIUM_READING]} plan="free" />);
    expect(screen.getByRole("heading", { name: "Reading program" })).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing");
    expect(screen.queryByRole("link", { name: /Reading program/ })).not.toBeInTheDocument();
  });

  it("renders the normal card once the viewer's plan covers a premium program", () => {
    render(<ProgramGrid programs={[PREMIUM_READING]} plan="premium" />);
    expect(screen.getByRole("link", { name: /Reading program/ })).toHaveAttribute(
      "href",
      "/practice/read-premium",
    );
  });
});
