import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { buildSupportMailto, ParentHelpCentre } from "@/features/parent-dashboard/components/ParentHelpCentre";
import {
  PREVIEW_HELP_ARTICLES,
  PREVIEW_HELP_CATEGORIES,
} from "@/features/parent-dashboard/fixtures";

describe("ParentHelpCentre Component (Claude Design Artboards #b27, #b28, #b29)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders Help Centre header, search input, and 6 topic tiles", () => {
    render(
      <ParentHelpCentre
        categories={PREVIEW_HELP_CATEGORIES}
        articles={PREVIEW_HELP_ARTICLES}
        childrenList={[]}
        userEmail="parent@example.com"
        isLocalPreview={true}
      />
    );

    // Title & subtitle
    expect(
      screen.getByRole("heading", { level: 1, name: "Help Centre" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Answers to the things parents ask most, and a way to reach a person\./i)
    ).toBeInTheDocument();

    // Preview badge
    expect(screen.getByTestId("illustrative-badge")).toBeInTheDocument();

    // Search input
    expect(screen.getByLabelText(/Search help/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Try “PIN” or “invoice”/i)).toBeInTheDocument();

    // 6 Topic tiles
    expect(screen.getByText("Getting your child signed in")).toBeInTheDocument();
    expect(screen.getByText("Practice and papers")).toBeInTheDocument();
    expect(screen.getByText("Understanding results")).toBeInTheDocument();
    expect(screen.getByText("Plan and payments")).toBeInTheDocument();
    expect(screen.getByText("Privacy and your family’s data")).toBeInTheDocument();
    expect(screen.getByText("Something is wrong")).toBeInTheDocument();

    // Design-canvas build notes never reach a family
    expect(screen.queryByText("What the Help Centre needs before it works")).not.toBeInTheDocument();
    expect(screen.queryByText(/NEEDS A BUILD/)).not.toBeInTheDocument();
  });

  it("filters articles dynamically when search keyword is typed", () => {
    render(
      <ParentHelpCentre
        categories={PREVIEW_HELP_CATEGORIES}
        articles={PREVIEW_HELP_ARTICLES}
        childrenList={[]}
        userEmail="parent@example.com"
        isLocalPreview={true}
      />
    );

    const searchInput = screen.getByLabelText(/Search help/i);
    fireEvent.change(searchInput, { target: { value: "PIN" } });

    // Should display search results section
    expect(screen.getByText(/Search results for “PIN”/i)).toBeInTheDocument();
    expect(
      screen.getByText("My child has forgotten their PIN")
    ).toBeInTheDocument();

    // Clearing search returns to topics
    fireEvent.click(screen.getByRole("button", { name: /Clear search/i }));
    expect(screen.getByText("Getting your child signed in")).toBeInTheDocument();
  });

  it("navigates into an article detail view matching Artboard #b28 Section 1", () => {
    render(
      <ParentHelpCentre
        categories={PREVIEW_HELP_CATEGORIES}
        articles={PREVIEW_HELP_ARTICLES}
        childrenList={[]}
        userEmail="parent@example.com"
        isLocalPreview={true}
      />
    );

    // Click Getting your child signed in (which opens premier article forgotten-pin)
    fireEvent.click(screen.getByText("Getting your child signed in"));

    // Article view elements
    expect(screen.getByTestId("article-detail-view")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "My child has forgotten their PIN" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reset it from their profile\. Go to Children/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We only keep a scrambled copy of a PIN/i)
    ).toBeInTheDocument();

    // Action button & feedback button
    expect(screen.getByRole("link", { name: "Go to Children" })).toHaveAttribute(
      "href",
      "/parent/children"
    );
    expect(screen.getByRole("link", { name: "This didn’t help" })).toHaveAttribute(
      "href",
      "#contact-form"
    );
  });

  it("hands the message to the parent's email app and never claims it was received", () => {
    const assigned: string[] = [];
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, set href(v: string) { assigned.push(v); }, get href() { return original.href; } },
    });
    try {
      render(
        <ParentHelpCentre
          categories={PREVIEW_HELP_CATEGORIES}
          articles={PREVIEW_HELP_ARTICLES}
          childrenList={[
            { id: "c-aisha", name: "Aisha", yearLevel: 3 },
            { id: "c-kiran", name: "Kiran", yearLevel: null },
          ]}
          userEmail="parent@example.com"
        />
      );
      expect(screen.getByRole("option", { name: "Kiran" })).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/Which child is this about\?/i), { target: { value: "c-aisha" } });
      fireEvent.change(screen.getByLabelText(/What is happening\?/i), { target: { value: "Question 12 has no mark." } });
      fireEvent.click(screen.getByRole("button", { name: /Email this to hello@mindmosaic\.app/i }));

      expect(assigned).toHaveLength(1);
      expect(assigned[0]).toMatch(/^mailto:hello@mindmosaic\.app\?subject=/);
      expect(decodeURIComponent(assigned[0]!)).toContain("Question 12 has no mark.");
      expect(decodeURIComponent(assigned[0]!)).toContain("Aisha, Year 3");
      expect(screen.getByTestId("contact-opened-note")).toHaveTextContent(/email app should now be open/i);
      expect(screen.queryByText(/We have your message/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/MM-\d{4}/)).not.toBeInTheDocument();
      // The typed message is kept in case the email app did not open
      expect(screen.getByLabelText(/What is happening\?/i)).toHaveValue("Question 12 has no mark.");
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });

  it("builds the email with the account and child", () => {
    const href = buildSupportMailto({ accountEmail: "p@example.com", childLabel: null, message: " Hi " });
    const body = decodeURIComponent(href.split("&body=")[1]!);
    expect(body).toBe(["Hi", "", "—", "Account: p@example.com", "Child: not about a child"].join("\n"));
  });
});
