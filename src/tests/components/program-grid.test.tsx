import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Program } from "@/features/catalogue/catalogue";
import { PracticeProgramGrid } from "@/features/catalogue/components/PracticeProgramGrid";
import { parseFilters } from "@/features/catalogue/filter-state";

/*
 * The server page parses the query and hands the grid `initialFilters`;
 * the grid owns state from there and publishes it with router.replace.
 * `replace` is captured so the written URL can be asserted, and
 * `initialFrom` mirrors what the server would have parsed for a given query.
 */
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/practice",
}));

function initialFrom(query: string) {
  return parseFilters(new URLSearchParams(query));
}

function program(overrides: Partial<Program> & Pick<Program, "id">): Program {
  return {
    slug: overrides.id,
    name: `${overrides.id} program`,
    blurb: "blurb",
    status: "live",
    ...overrides,
  } as Program;
}

const G3_NUMERACY = program({
  id: "g3-num",
  name: "NAPLAN-style Numeracy — Grade 3",
  scope: { yearLevel: 3, examStyle: "naplan_style", subject: "numeracy", initialBankId: "curated" },
});
const G3_READING = program({
  id: "g3-read",
  name: "NAPLAN-style Reading — Grade 3",
  scope: { yearLevel: 3, examStyle: "naplan_style", subject: "reading", initialBankId: "curated" },
});
const G5_ICAS_LANGUAGE = program({
  id: "g5-icas-lang",
  name: "ICAS-style English: Language — Grade 5",
  scope: { yearLevel: 5, examStyle: "icas_style", subject: "language", initialBankId: "curated" },
});
const BUILD_YOUR_OWN = program({
  id: "mixed-practice",
  name: "Build your own practice",
});
const PREMIUM = program({
  id: "premium",
  name: "Premium program",
  planTier: "premium",
  scope: { yearLevel: 3, examStyle: "naplan_style", subject: "reading", initialBankId: "curated" },
});

const ALL_THREE = [G3_NUMERACY, G3_READING, G5_ICAS_LANGUAGE];

describe("PracticeProgramGrid", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("shows every program with no filter applied", () => {
    render(<PracticeProgramGrid programs={ALL_THREE} />);
    for (const entry of ALL_THREE) {
      expect(screen.getByRole("heading", { name: entry.name })).toBeInTheDocument();
    }
  });

  it("filters by grade", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PracticeProgramGrid programs={ALL_THREE} />);

    await user.click(screen.getByTestId("grade-filter-5"));
    expect(replace).toHaveBeenCalledWith("/practice?grade=5", { scroll: false });

    rerender(<PracticeProgramGrid programs={ALL_THREE} />);
    expect(screen.getByRole("heading", { name: G5_ICAS_LANGUAGE.name })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: G3_NUMERACY.name })).not.toBeInTheDocument();
  });

  it("filters by subject", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PracticeProgramGrid programs={ALL_THREE} />);

    await user.click(screen.getByTestId("subject-filter-reading"));
    rerender(<PracticeProgramGrid programs={ALL_THREE} />);

    expect(screen.getByRole("heading", { name: G3_READING.name })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: G3_NUMERACY.name })).not.toBeInTheDocument();
  });

  it("filters by assessment style", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PracticeProgramGrid programs={ALL_THREE} />);

    await user.click(screen.getByTestId("style-filter-icas_style"));
    rerender(<PracticeProgramGrid programs={ALL_THREE} />);

    expect(screen.getByRole("heading", { name: G5_ICAS_LANGUAGE.name })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: G3_READING.name })).not.toBeInTheDocument();
  });

  it("combines filters and reports an accurate count", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PracticeProgramGrid programs={ALL_THREE} />);
    expect(screen.getByTestId("filter-result-announcement")).toHaveTextContent(
      "3 practice programs available",
    );

    await user.click(screen.getByTestId("grade-filter-3"));
    rerender(<PracticeProgramGrid programs={ALL_THREE} />);
    await user.click(screen.getByTestId("subject-filter-numeracy"));
    rerender(<PracticeProgramGrid programs={ALL_THREE} />);

    expect(replace).toHaveBeenLastCalledWith("/practice?grade=3&subject=numeracy", {
      scroll: false,
    });
    expect(screen.getByTestId("filter-result-announcement")).toHaveTextContent(
      "1 practice program match your filters",
    );
  });

  /*
   * Regression: the grid used to derive its chips straight from
   * useSearchParams, and router.replace does not update those on the same
   * tick — so two clicks in quick succession both read the pre-update value
   * and the second dropped the first. Reproduced here by NOT re-rendering
   * between the clicks, which is exactly the stale-params window.
   */
  it("keeps an earlier filter when a second chip is clicked before the URL settles", async () => {
    const user = userEvent.setup();
    render(<PracticeProgramGrid programs={ALL_THREE} />);

    await user.click(screen.getByTestId("grade-filter-3"));
    await user.click(screen.getByTestId("style-filter-naplan_style"));

    expect(replace).toHaveBeenLastCalledWith("/practice?grade=3&style=naplan_style", {
      scroll: false,
    });
    expect(screen.getByTestId("grade-filter-3")).toHaveAttribute("aria-pressed", "true");
  });

  it("adopts the query on a Back/Forward press", () => {
    render(<PracticeProgramGrid programs={ALL_THREE} />);
    expect(screen.getByRole("heading", { name: G3_NUMERACY.name })).toBeInTheDocument();

    window.history.pushState({}, "", "/practice?grade=5");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByRole("heading", { name: G5_ICAS_LANGUAGE.name })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: G3_NUMERACY.name })).not.toBeInTheDocument();
    window.history.pushState({}, "", "/practice");
  });

  it("marks the active chip with aria-pressed", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PracticeProgramGrid programs={ALL_THREE} />);

    expect(screen.getByTestId("grade-filter-all")).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByTestId("grade-filter-3"));
    rerender(<PracticeProgramGrid programs={ALL_THREE} />);

    expect(screen.getByTestId("grade-filter-3")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("grade-filter-all")).toHaveAttribute("aria-pressed", "false");
  });

  it("restores every filter from the URL on first render", () => {
    render(
      <PracticeProgramGrid
        programs={ALL_THREE}
        initialFilters={initialFrom("grade=5&style=icas_style")}
      />,
    );

    expect(screen.getByRole("heading", { name: G5_ICAS_LANGUAGE.name })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: G3_NUMERACY.name })).not.toBeInTheDocument();
  });

  /* A stale or hand-typed value must not filter the grid to nothing with no
     explanation — it falls back to "all". */
  it("ignores an unrecognised filter value in the URL", () => {
    render(
      <PracticeProgramGrid
        programs={ALL_THREE}
        initialFilters={initialFrom("subject=chemistry")}
      />,
    );
    expect(screen.getByTestId("filter-result-announcement")).toHaveTextContent(
      "3 practice programs available",
    );
  });

  it("resets every filter at once", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PracticeProgramGrid
        programs={ALL_THREE}
        initialFilters={initialFrom("grade=3&subject=numeracy")}
      />,
    );

    await user.click(screen.getByTestId("reset-filters"));
    expect(replace).toHaveBeenCalledWith("/practice", { scroll: false });

    rerender(<PracticeProgramGrid programs={ALL_THREE} />);
    expect(screen.getByTestId("filter-result-announcement")).toHaveTextContent(
      "3 practice programs available",
    );
  });

  it("shows the empty state with both ways out when nothing matches", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PracticeProgramGrid
        programs={ALL_THREE}
        initialFilters={initialFrom("grade=5&subject=numeracy")}
      />,
    );

    expect(
      screen.getByText("No practice programs match these filters."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all programs" })).toHaveAttribute(
      "href",
      "/practice",
    );

    await user.click(screen.getByTestId("empty-clear-filters"));
    rerender(<PracticeProgramGrid programs={ALL_THREE} />);
    expect(screen.getByRole("heading", { name: G3_NUMERACY.name })).toBeInTheDocument();
  });

  /* The build-your-own pathway is not part of the filtered set — filtering
     to Grade 5 must never hide the way to build a Grade 5 session. */
  it("keeps the build-your-own card visible under every filter", () => {
    render(
      <PracticeProgramGrid
        programs={ALL_THREE}
        buildYourOwn={BUILD_YOUR_OWN}
        initialFilters={initialFrom("grade=5&subject=numeracy")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Build your own practice" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("build-your-own-cta")).toHaveAttribute(
      "href",
      "/practice/mixed-practice",
    );
  });

  it("renders a locked upgrade card for a premium program on the free plan", () => {
    render(<PracticeProgramGrid programs={[PREMIUM]} plan="free" />);
    expect(screen.getByRole("heading", { name: "Premium program" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing");
    expect(screen.queryByTestId("program-card-premium")).not.toBeInTheDocument();
  });

  it("renders the normal card once the viewer's plan covers a premium program", () => {
    render(<PracticeProgramGrid programs={[PREMIUM]} plan="premium" />);
    expect(screen.getByTestId("program-card-premium")).toHaveAttribute(
      "href",
      "/practice/premium",
    );
  });

  it("shows the question count and an estimated length from the server-computed counts", () => {
    render(
      <PracticeProgramGrid programs={[G3_NUMERACY]} questionCounts={{ "g3-num": 64 }} />,
    );
    expect(screen.getByText("64 questions available")).toBeInTheDocument();
    /* 64 fills the 10, 20 and 30 options -> 15, 30 and 45 minutes. */
    expect(screen.getByText("Approx. 15–45 min")).toBeInTheDocument();
  });

  it("never promises a length the program cannot fill", () => {
    render(
      <PracticeProgramGrid programs={[G3_NUMERACY]} questionCounts={{ "g3-num": 17 }} />,
    );
    expect(screen.getByText("17 questions available")).toBeInTheDocument();
    expect(screen.getByText("Approx. 15 min")).toBeInTheDocument();
  });

  /*
   * The chips used to be rendered twice — once for the mobile drawer, once
   * for desktop — so every data-testid and every role="group" label existed
   * twice in the DOM. Caught by a cross-engine Playwright pass as a strict-
   * mode violation once the drawer was opened on a phone viewport.
   */
  it("renders exactly one copy of each filter control", () => {
    render(<PracticeProgramGrid programs={ALL_THREE} />);

    for (const testId of ["grade-filter-3", "subject-filter-reading", "style-filter-icas_style"]) {
      expect(screen.getAllByTestId(testId)).toHaveLength(1);
    }
    for (const group of ["Grade", "Subject", "Style"]) {
      expect(screen.getAllByRole("group", { name: group })).toHaveLength(1);
    }
  });

  it("gives every card a single link named after its program", () => {
    render(<PracticeProgramGrid programs={ALL_THREE} />);
    for (const entry of ALL_THREE) {
      const links = screen.getAllByRole("link", { name: new RegExp(entry.name) });
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", `/practice/${entry.slug}`);
    }
  });
});
