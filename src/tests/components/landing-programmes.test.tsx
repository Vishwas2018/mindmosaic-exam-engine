import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Programmes } from "@/features/landing/components/Programmes";
import { programmes } from "@/features/landing/content";

function tablist() {
  return screen.getByRole("tablist", { name: "Programmes" });
}

describe("Programmes", () => {
  it("lists every programme as a tab", () => {
    render(<Programmes />);
    for (const item of programmes.items) {
      expect(within(tablist()).getByRole("tab", { name: new RegExp(item.name) })).toBeInTheDocument();
    }
  });

  /*
   * Coverage honesty: a programme that does not cover the chosen year is
   * still listed, and says "Unavailable" in words — never by colour or by
   * being silently hidden.
   */
  it("marks a programme unavailable in words when the chosen year is outside its coverage", async () => {
    render(<Programmes />);
    // Year 5 is the default; Selective school entry-style starts at Year 5,
    // so drop to Year 1, which no assessment programme covers.
    await userEvent.click(screen.getByRole("button", { name: "Year 1" }));

    const naplanTab = within(tablist()).getByRole("tab", { name: /NAPLAN-style/ });
    expect(naplanTab).toHaveTextContent("Unavailable");

    await userEvent.click(naplanTab);
    expect(screen.getByText(/Not available for Year 1/)).toBeInTheDocument();
  });

  it("switches the year row when the secondary group is chosen", async () => {
    render(<Programmes />);
    expect(screen.getByRole("button", { name: "Year 3" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Secondary/ }));
    expect(screen.queryByRole("button", { name: "Year 3" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Year 9" })).toBeInTheDocument();
  });

  it("filters the tablist by category and follows the filter with the panel", async () => {
    render(<Programmes />);
    await userEvent.click(screen.getByRole("button", { name: "Competitions" }));

    const tabs = within(tablist()).getAllByRole("tab");
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent("AMC-style");
    // The panel must not still be showing a programme the filter hid.
    expect(screen.getByRole("heading", { level: 3, name: "AMC-style" })).toBeInTheDocument();
  });

  it("asks for a jurisdiction only on the programme that varies by state", async () => {
    render(<Programmes />);
    expect(screen.queryByRole("group", { name: "State or territory" })).not.toBeInTheDocument();

    await userEvent.click(within(tablist()).getByRole("tab", { name: /Selective school entry-style/ }));
    const regionGroup = screen.getByRole("group", { name: "State or territory" });
    for (const region of programmes.regions) {
      expect(within(regionGroup).getByRole("button", { name: region.label })).toBeInTheDocument();
    }
  });

  it("moves selection with the arrow keys, as the tabs pattern expects", async () => {
    render(<Programmes />);
    const first = within(tablist()).getAllByRole("tab")[0]!;
    first.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(within(tablist()).getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
  });

  it("shows the selected programme's confirmed coverage and its unconfirmed remainder", async () => {
    render(<Programmes />);
    await userEvent.click(within(tablist()).getByRole("tab", { name: /Australian Curriculum/ }));
    expect(screen.getByText(/Years 1–10 \(Years 11–12 to be confirmed\)/)).toBeInTheDocument();
  });
});
