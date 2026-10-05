import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Credibility } from "@/features/landing/components/Credibility";
import { Hero } from "@/features/landing/components/Hero";
import { credibility, hero } from "@/features/landing/content";

describe("Hero", () => {
  it("renders the stationary two-line heading", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(hero.heading);
    expect(heading).toHaveTextContent(hero.headingEmphasis);
  });

  it("wires both CTAs and the availability link to real routes", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: hero.primaryCta.label })).toHaveAttribute(
      "href",
      hero.primaryCta.href,
    );
    expect(screen.getByRole("link", { name: hero.secondaryCta.label })).toHaveAttribute(
      "href",
      hero.secondaryCta.href,
    );
    expect(screen.getByRole("link", { name: hero.availability.link.label })).toHaveAttribute(
      "href",
      hero.availability.link.href,
    );
  });

  it("renders the first campaign slide as the photographic background, unbranded", () => {
    const { container } = render(<Hero />);
    const photos = [...container.querySelectorAll("img")].filter((image) =>
      decodeURIComponent(image.getAttribute("src") ?? "").includes("/landing/campaign/"),
    );
    expect(photos.length).toBeGreaterThanOrEqual(1);
    expect(decodeURIComponent(photos[0]!.getAttribute("src") ?? "")).toContain(hero.slides[0]!.src);
  });

  it("renders the sample question and answer options as live text", () => {
    render(<Hero />);
    const question = screen.getByRole("article", { name: hero.demo.label });
    expect(question).toHaveTextContent(hero.demo.question);
    for (const option of hero.demo.options) {
      expect(within(question).getByText(option.label)).toBeInTheDocument();
    }
  });

  /* The selected answer must be the correct one: 12 m x 8 m = 96 m2. */
  it("selects the correct answer and shows consistent working", () => {
    const selected = hero.demo.options.filter((option) => option.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0]!.label).toBe(`${12 * 8} m²`);
    expect(hero.demo.explanation.steps.join(" ")).toContain("12 × 8 = 96");
  });

  it("uses the official logo asset in the sample card, never a drawn mark", () => {
    const { container } = render(<Hero />);
    const sources = [...container.querySelectorAll("img")].map((image) => image.getAttribute("src") ?? "");
    expect(sources.some((src) => decodeURIComponent(src).includes("/brand/mark-"))).toBe(true);
  });

  it("lists every credibility point", () => {
    render(<Hero />);
    const list = screen.getByRole("list", { name: "What MindMosaic includes" });
    for (const item of hero.credibility) {
      expect(within(list).getByText(item)).toBeInTheDocument();
    }
  });

  describe("campaign carousel controls", () => {
    it("offers one labelled timer button per slide, with exactly one current", () => {
      render(<Hero />);
      const group = screen.getByRole("group", { name: "Choose hero slide" });
      const buttons = within(group).getAllByRole("button", { name: /^Slide \d of 6: / });
      expect(buttons).toHaveLength(hero.slides.length);
      hero.slides.forEach((slide, index) => {
        expect(buttons[index]).toHaveAccessibleName(`Slide ${index + 1} of 6: ${slide.label}`);
      });
      expect(buttons.filter((button) => button.getAttribute("aria-current") === "true")).toHaveLength(1);
      expect(buttons[0]).toHaveAttribute("aria-current", "true");
    });

    it("keeps the headline fixed and changes only the phrase when a slide is chosen", async () => {
      const user = userEvent.setup();
      const { container } = render(<Hero />);
      const target = hero.slides[3]!;
      // A newly selected slide shows once its photograph has loaded.
      await user.click(screen.getByRole("button", { name: `Slide 4 of 6: ${target.label}` }));
      const image = [...container.querySelectorAll("img")].find((img) =>
        decodeURIComponent(img.getAttribute("src") ?? "").includes(target.src),
      );
      expect(image).toBeDefined();
      fireEvent.load(image!);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: `Slide 4 of 6: ${target.label}` })).toHaveAttribute(
          "aria-current",
          "true",
        ),
      );
      expect(container.textContent).toContain(target.phrase);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(hero.heading);
    });

    it("advances to the next slide when the active timer finishes", async () => {
      const { container } = render(<Hero />);
      const fill = container.querySelector('.mm-hero-fill[data-active="true"]')!;
      fireEvent.animationEnd(fill);
      await waitFor(() => {
        const next = [...container.querySelectorAll("img")].find((img) =>
          decodeURIComponent(img.getAttribute("src") ?? "").includes(hero.slides[1]!.src),
        );
        expect(next).toBeDefined();
        fireEvent.load(next!);
      });
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /^Slide 2 of 6/ })).toHaveAttribute("aria-current", "true"),
      );
    });

    it("lets the visitor pause and resume the rotation", async () => {
      const user = userEvent.setup();
      const { container } = render(<Hero />);
      await user.click(screen.getByRole("button", { name: "Pause slideshow" }));
      expect(container.querySelector("section")).toHaveAttribute("data-paused", "true");
      await user.click(screen.getByRole("button", { name: "Play slideshow" }));
      expect(container.querySelector("section")).toHaveAttribute("data-paused", "false");
    });

    it("mounts only the first slide and the next one up front, not all six", () => {
      const { container } = render(<Hero />);
      const photos = [...container.querySelectorAll("img")].filter((image) =>
        decodeURIComponent(image.getAttribute("src") ?? "").includes("/landing/campaign/hero-"),
      );
      expect(photos.length).toBeLessThan(hero.slides.length);
    });
  });
});

describe("Credibility band", () => {
  it("renders all five claims", () => {
    render(<Credibility />);
    for (const card of credibility.cards) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });

  /*
   * The non-affiliation statement is a legal requirement, not decoration:
   * "NAPLAN-style" etc. describe a format, and the page has to say so
   * near the top where it makes the claim.
   */
  it("states the independence disclaimer and links the full one", () => {
    render(<Credibility />);
    expect(screen.getByText(/independent learning platform/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: credibility.disclaimerLink.label })).toHaveAttribute(
      "href",
      "/assessment-disclaimer",
    );
  });
});
