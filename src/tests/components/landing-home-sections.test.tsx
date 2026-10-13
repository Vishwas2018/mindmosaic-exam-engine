import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DRILL_QUESTION_COUNT } from "@/features/exam-engine/recommendation/build-drill";
import { FaqAndStart } from "@/features/landing/components/FaqAndStart";
import {
  EVERY_TEST_PROMISE,
  PARENT_LAUNCHES_DRILL,
  PROHIBITED_PRODUCT_CLAIMS,
  TEN_QUESTION_DRILL,
} from "@/features/landing/copy-guards";
import { LearningDemo } from "@/features/landing/components/LearningDemo";
import { ProductTour } from "@/features/landing/components/ProductTour";
import { ProgramHighlights } from "@/features/landing/components/ProgramHighlights";
import { QualityBand } from "@/features/landing/components/QualityBand";
import { RespondsToStudent } from "@/features/landing/components/RespondsToStudent";
import { TrustAndCare } from "@/features/landing/components/TrustAndCare";
import {
  faqAndStart,
  forParents,
  learningDemo,
  productTour,
  programHighlights,
  programmes,
  qualityBand,
  respondsToStudent,
  trustAndCare,
} from "@/features/landing/content";

describe("ProgramHighlights", () => {
  it("renders every program row with its real status and href", () => {
    render(<ProgramHighlights />);
    for (const row of programHighlights.rows) {
      const link = screen.getByRole("link", { name: new RegExp(row.name) });
      expect(link).toHaveAttribute("href", row.href);
      expect(within(link).getByText(row.status)).toBeInTheDocument();
    }
  });
});

describe("ProgramHighlights status source", () => {
  it("derives every row's status from the canonical programme, so the two cannot drift", () => {
    const wordFor = { available: "Available", limited: "Limited", in_development: "Planned" } as const;
    const canonicalId = { naplan: "naplan-style", icas: "icas-style", curriculum: "australian-curriculum", advanced: "amc-style" } as const;
    for (const row of programHighlights.rows) {
      const canonical = programmes.items.find((item) => item.id === canonicalId[row.id])!;
      expect(row.status, row.id).toBe(wordFor[canonical.status]);
    }
    const curriculum = programHighlights.rows.find((row) => row.id === "curriculum")!;
    expect(curriculum.status).toBe("Limited");
    expect(curriculum.tone).toBe("limited");
  });
});

describe("QualityBand", () => {
  it("numbers all four points from the array itself", () => {
    render(<QualityBand />);
    expect(qualityBand.points).toHaveLength(4);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
    for (const point of qualityBand.points) {
      expect(screen.getByText(point.title)).toBeInTheDocument();
    }
  });

  it("makes no claim of educator review, streaks, XP or badges", () => {
    render(<QualityBand />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/educator review|streak|\bXP\b|badge/i);
  });
});

describe("FaqAndStart", () => {
  it("opens exactly one FAQ answer at a time", async () => {
    render(<FaqAndStart />);
    const [first, second] = faqAndStart.items;
    const firstButton = screen.getByRole("button", { name: new RegExp(first!.question) });
    const secondButton = screen.getByRole("button", { name: new RegExp(second!.question) });

    expect(firstButton).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(firstButton);
    expect(firstButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(first!.answer)).toBeInTheDocument();

    await userEvent.click(secondButton);
    expect(firstButton).toHaveAttribute("aria-expanded", "false");
    expect(secondButton).toHaveAttribute("aria-expanded", "true");
  });

  it("never shows the real Family plan price in the closing card", () => {
    render(<FaqAndStart />);
    expect(screen.queryByText(/\$14\.99|\$149\b/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: faqAndStart.card.primaryCta.label })).toHaveAttribute(
      "href",
      faqAndStart.card.primaryCta.href,
    );
  });
});

describe("LearningDemo", () => {
  it("defaults to the Learn tab and switches panels on click", async () => {
    render(<LearningDemo />);
    expect(screen.getByRole("tab", { name: "Learn" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("article", { name: "Sample lesson" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Practise" }));
    expect(screen.getByRole("tab", { name: "Practise" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("article", { name: "Sample practice question" })).toBeInTheDocument();
  });

  it("moves the tab focus with arrow keys", async () => {
    render(<LearningDemo />);
    const learnTab = screen.getByRole("tab", { name: "Learn" });
    learnTab.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Practise" })).toHaveAttribute("aria-selected", "true");
  });

  it("requires an answer before checking, then shows the worked explanation", async () => {
    render(<LearningDemo />);
    await userEvent.click(screen.getByRole("tab", { name: "Practise" }));
    const panel = screen.getByRole("article", { name: "Sample practice question" });

    await userEvent.click(within(panel).getByRole("button", { name: "Check answer" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choose an answer first.");

    await userEvent.click(within(panel).getByRole("radio", { name: /^B/ }));
    await userEvent.click(within(panel).getByRole("button", { name: "Check answer" }));
    expect(within(panel).getByRole("status")).toHaveTextContent(learningDemo.practiseDemo.correctFeedback);

    await userEvent.click(within(panel).getByRole("button", { name: "Try again" }));
    expect(within(panel).getByRole("button", { name: "Check answer" })).toBeInTheDocument();
  });
});

describe("ProductTour", () => {
  /* No tour video exists yet: nothing may look playable. */
  it("labels the poster as a preview and offers no play control or video", () => {
    const { container } = render(<ProductTour />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText(productTour.videoStatus)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("link", { name: productTour.link.label })).toHaveAttribute("href", "/how-it-works");
  });
});

describe("RespondsToStudent", () => {
  it("renders the three connected outcomes and a sample labelled as such", () => {
    render(<RespondsToStudent />);
    for (const step of respondsToStudent.steps) {
      expect(screen.getByRole("heading", { name: step.title })).toBeInTheDocument();
    }
    expect(screen.getByRole("article", { name: "Sample skill breakdown after a test" })).toHaveTextContent("Sample");
  });

  it("names each skill state in words, and never sells the section as AI", () => {
    render(<RespondsToStudent />);
    for (const skill of respondsToStudent.sample.skills) {
      expect(screen.getByText(skill.state)).toBeInTheDocument();
    }
    expect(document.body.textContent ?? "").not.toMatch(PROHIBITED_PRODUCT_CLAIMS);
  });
});

describe("TrustAndCare", () => {
  it("links each commitment to its real policy page", () => {
    render(<TrustAndCare />);
    for (const point of trustAndCare.care.points) {
      expect(screen.getByRole("link", { name: point.link.label })).toHaveAttribute("href", point.link.href);
    }
  });

  /* No testimonials have been collected; none may be invented. */
  it("renders no testimonial while content holds none, and no compliance claims", () => {
    const { container } = render(<TrustAndCare />);
    expect(trustAndCare.testimonials).toHaveLength(0);
    expect(container.querySelector("blockquote")).toBeNull();
    expect(container.textContent ?? "").not.toMatch(/compliant|certified|ISO|government approved/i);
  });
});

describe("FaqAndStart disclosure", () => {
  it("keeps closed answers out of view and marks the open one", async () => {
    render(<FaqAndStart />);
    const [first] = faqAndStart.items;
    const button = screen.getByRole("button", { name: first!.question });
    const panel = document.getElementById(button.getAttribute("aria-controls")!)!;
    expect(panel).toHaveAttribute("data-open", "false");
    await userEvent.click(button);
    expect(panel).toHaveAttribute("data-open", "true");
  });
});

describe("recommendation-drill copy", () => {
  /*
   * The landing copy describes the post-test "practise missed skills"
   * drill. Its size must match the builder, and no copy may promise that
   * every test produces one: a perfect result, or no eligible misses,
   * yields no drill at all (PractiseMissedSkills.tsx).
   */
  const words: Record<number, string> = { 5: "five" };

  it("states the drill size the builder actually produces", () => {
    expect(respondsToStudent.sample.nextSet.startsWith(`${DRILL_QUESTION_COUNT} questions`)).toBe(true);
    const drillCopy = respondsToStudent.steps.map((step) => step.body).join(" ");
    expect(drillCopy).toContain(`${words[DRILL_QUESTION_COUNT]}-question`);
    expect(drillCopy).not.toMatch(TEN_QUESTION_DRILL);
  });

  /*
   * The drill lives on the student's own results page (PractiseMissedSkills).
   * The parent dashboard cannot launch it, so no parent copy or sample may
   * offer it.
   */
  it("never offers the student-only drill in the parent section", () => {
    expect(JSON.stringify(forParents)).not.toMatch(PARENT_LAUNCHES_DRILL);
  });

  it("never promises a drill after every test", () => {
    const all = JSON.stringify({ respondsToStudent, forParents, faqAndStart });
    expect(all).not.toMatch(EVERY_TEST_PROMISE);
  });
});
