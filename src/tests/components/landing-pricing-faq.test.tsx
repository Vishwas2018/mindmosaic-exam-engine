import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Faq } from "@/features/landing/components/Faq";
import { Pricing } from "@/features/landing/components/Pricing";
import { faq, pricing } from "@/features/landing/content";

describe("Pricing preview (landing)", () => {
  it("exposes a #plans anchor target matching the nav's Plans link", () => {
    const { container } = render(<Pricing />);
    expect(container.querySelector("#plans")).toBeInTheDocument();
  });

  it("renders every configured plan with its features and CTA, without inventing a paid price", () => {
    render(<Pricing />);
    for (const plan of pricing.plans) {
      const heading = screen.getByRole("heading", { name: plan.name });
      const card = heading.closest("div");
      expect(card).not.toBeNull();
      const scoped = within(card as HTMLElement);
      expect(scoped.getAllByText(plan.price).length).toBeGreaterThan(0);
      expect(scoped.getByRole("link", { name: plan.cta.label })).toHaveAttribute("href", plan.cta.href);
    }
    // The paid tier is truthfully "Coming soon", not a fabricated number.
    expect(screen.getAllByText("Coming soon").length).toBeGreaterThan(0);
  });
});

describe("FAQ accordion (landing)", () => {
  it("exposes a #faq anchor target matching the nav's Resources link", () => {
    const { container } = render(<Faq />);
    expect(container.querySelector("#faq")).toBeInTheDocument();
  });

  it("starts with the first question open and the rest collapsed", () => {
    render(<Faq />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
    expect(buttons[1]).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(faq.items[0].answer)).toBeInTheDocument();
    expect(screen.queryByText(faq.items[1].answer)).not.toBeInTheDocument();
  });

  it("toggles a question open/closed as an accessible disclosure (aria-expanded + aria-controls)", async () => {
    const user = userEvent.setup();
    render(<Faq />);

    const secondButton = screen.getAllByRole("button")[1];
    const panelId = secondButton.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();

    await user.click(secondButton);
    expect(secondButton).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(panelId!);
    expect(panel).toHaveAttribute("role", "region");
    expect(within(panel!).getByText(faq.items[1].answer)).toBeInTheDocument();

    await user.click(secondButton);
    expect(secondButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(faq.items[1].answer)).not.toBeInTheDocument();
  });
});
