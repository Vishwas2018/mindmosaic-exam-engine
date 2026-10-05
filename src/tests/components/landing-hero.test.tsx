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
    /** The hero photograph <img> for a slide, once that slide has been mounted. */
    function slideImage(container: HTMLElement, slideIndex: number): HTMLImageElement | undefined {
      return [...container.querySelectorAll("img")].find((img) =>
        decodeURIComponent(img.getAttribute("src") ?? "").includes(hero.slides[slideIndex]!.src),
      );
    }

    /** Resolve a slide's image load (or failure) the way the browser would. */
    async function finishLoading(container: HTMLElement, slideIndex: number, outcome: "load" | "error" = "load") {
      await waitFor(() => expect(slideImage(container, slideIndex)).toBeDefined());
      if (outcome === "load") fireEvent.load(slideImage(container, slideIndex)!);
      else fireEvent.error(slideImage(container, slideIndex)!);
    }

    const timer = (n: number) => screen.getByRole("button", { name: new RegExp(`^Slide ${n} of 6`) });
    const expectCurrent = (n: number) =>
      waitFor(() => {
        const current = screen
          .getAllByRole("button", { name: /^Slide \d of 6/ })
          .filter((button) => button.getAttribute("aria-current") === "true");
        expect(current).toHaveLength(1);
        expect(current[0]).toHaveAccessibleName(new RegExp(`^Slide ${n} of 6`));
      });
    const activeWrappers = (container: HTMLElement) => container.querySelectorAll('.mm-hero-slide[data-active="true"]');
    const activeFill = (container: HTMLElement) => container.querySelector('.mm-hero-fill[data-active="true"]')!;

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
      await user.click(timer(4));
      await finishLoading(container, 3);
      await expectCurrent(4);
      expect(container.textContent).toContain(target.phrase);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(hero.heading);
    });

    it("advances to the next slide when the active timer finishes", async () => {
      const { container } = render(<Hero />);
      fireEvent.animationEnd(activeFill(container));
      await finishLoading(container, 1);
      await expectCurrent(2);
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

    describe("manual selection while the photograph is still loading", () => {
      /* A. The interval expires while slide 6 is pending: slide 6 wins, not slide 2. */
      it("is not overwritten by auto-advance, and slide 6 activates when it loads", async () => {
        const user = userEvent.setup();
        const { container } = render(<Hero />);
        await user.click(timer(6));
        // Slide 6 has not loaded: slide 1 stays on screen and the timer is frozen.
        await expectCurrent(1);
        expect(container.querySelector("section")).toHaveAttribute("data-paused", "true");

        // The normal 5s expiry fires anyway.
        fireEvent.animationEnd(activeFill(container));
        await expectCurrent(1);

        await finishLoading(container, 5);
        await expectCurrent(6);
        expect(timer(2)).not.toHaveAttribute("aria-current");
      });

      /* B. Last explicit click wins. */
      it("makes the most recent selection authoritative (6 then 4)", async () => {
        const user = userEvent.setup();
        const { container } = render(<Hero />);
        await user.click(timer(6));
        await user.click(timer(4));
        await finishLoading(container, 5); // slide 6 arrives first: must not activate
        await expectCurrent(1);
        await finishLoading(container, 3);
        await expectCurrent(4);
        // Auto-advance while nothing is pending still works from slide 4.
        expect(container.querySelector("section")).toHaveAttribute("data-paused", "false");
      });

      /* C. A fresh timer starts at the moment the requested slide activates. */
      it("starts the activated slide's timer from zero", async () => {
        const user = userEvent.setup();
        const { container } = render(<Hero />);
        await user.click(timer(6));
        const staleFill = timer(6).querySelector(".mm-hero-fill")!;
        expect(staleFill).toHaveAttribute("data-active", "false");
        await finishLoading(container, 5);
        await expectCurrent(6);
        const freshFill = activeFill(container);
        expect(timer(6).contains(freshFill)).toBe(true);
        expect(freshFill).not.toBe(staleFill); // remounted, so its CSS animation begins at 0
        expect(container.querySelector("section")).toHaveAttribute("data-paused", "false");
      });

      /* D. Never a blank frame: the previous slide stays the single visible one. */
      it("keeps exactly one slide visible while waiting, never a blank frame", async () => {
        const user = userEvent.setup();
        const { container } = render(<Hero />);
        await user.click(timer(6));
        await waitFor(() => expect(slideImage(container, 5)).toBeDefined());
        expect(activeWrappers(container)).toHaveLength(1);
        expect(slideImage(container, 0)!.closest(".mm-hero-slide")).toHaveAttribute("data-active", "true");
        expect(slideImage(container, 5)!.closest(".mm-hero-slide")).toHaveAttribute("data-active", "false");
        await finishLoading(container, 5);
        await expectCurrent(6);
        expect(activeWrappers(container)).toHaveLength(1);
      });

      it("on a load failure keeps the current slide visible and resumes auto rotation", async () => {
        const user = userEvent.setup();
        const { container } = render(<Hero />);
        await user.click(timer(6));
        expect(container.querySelector("section")).toHaveAttribute("data-paused", "true");
        await finishLoading(container, 5, "error");
        await expectCurrent(1);
        await waitFor(() => expect(container.querySelector("section")).toHaveAttribute("data-paused", "false"));
        expect(activeWrappers(container)).toHaveLength(1);
        // Rotation resumes and skips the failed slide.
        fireEvent.animationEnd(activeFill(container));
        await finishLoading(container, 1);
        await expectCurrent(2);
      });
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
