import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ParentHelpCentre } from "@/features/parent-dashboard/components/ParentHelpCentre";
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

    // Build requirements notice
    expect(screen.getByText("What the Help Centre needs before it works")).toBeInTheDocument();
  });

  it("filters articles dynamically when search keyword is typed", () => {
    render(
      <ParentHelpCentre
        categories={PREVIEW_HELP_CATEGORIES}
        articles={PREVIEW_HELP_ARTICLES}
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

  it("handles the support message form flow matching Artboard #b28 Section 2", async () => {
    render(
      <ParentHelpCentre
        categories={PREVIEW_HELP_CATEGORIES}
        articles={PREVIEW_HELP_ARTICLES}
        childrenList={[
          { id: "c-aisha", name: "Aisha", yearLevel: 3 },
          { id: "c-kiran", name: "Kiran", yearLevel: 5 },
        ]}
        userEmail="priya.raman@example.com"
        isLocalPreview={true}
      />
    );

    // Check automatic attachment copy
    expect(
      screen.getByText(/Attached automatically:/i)
    ).toBeInTheDocument();
    expect(screen.getByText("priya.raman@example.com")).toBeInTheDocument();

    // Check child select
    const childSelect = screen.getByLabelText(/Which child is this about\?/i);
    expect(childSelect).toBeInTheDocument();
    fireEvent.change(childSelect, { target: { value: "c-aisha" } });

    // Enter message
    const messageInput = screen.getByLabelText(/What is happening\?/i);
    fireEvent.change(messageInput, {
      target: { value: "Aisha's numeracy test paper didn't record mark on question 12." },
    });

    // Send button
    const sendButton = screen.getByRole("button", { name: /Send/i });
    expect(sendButton).not.toBeDisabled();

    fireEvent.click(sendButton);

    // In flight sending state
    expect(screen.getByRole("button", { name: /Sending…/i })).toBeDisabled();
    expect(
      screen.getByText(/No reference yet\. Nothing is promised while this is in flight\./i)
    ).toBeInTheDocument();

    // Received state with reference number (MM-4821 in preview)
    await waitFor(() => {
      expect(screen.getByTestId("contact-success-banner")).toBeInTheDocument();
    });

    expect(screen.getByText(/We have your message\./i)).toBeInTheDocument();
    expect(screen.getByText("MM-4821")).toBeInTheDocument();
    expect(
      screen.getByText(/The reference appears here and nowhere earlier, because it is the proof the message exists\./i)
    ).toBeInTheDocument();
  });
});
