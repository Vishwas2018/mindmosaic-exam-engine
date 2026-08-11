import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ScratchpadPanel, useScratchpadStore } from "@/features/exam-engine/scratchpad";

const QUESTION = "q-1";

function resetStore(): void {
  useScratchpadStore.setState({
    sessionKey: "test-session",
    isOpen: true,
    mode: "docked",
    tool: "pen",
    colour: "slate",
    entries: {},
    drawing: null,
  });
  window.sessionStorage.clear();
}

function renderPanel() {
  return render(<ScratchpadPanel questionId={QUESTION} questionNumber={3} />);
}

beforeEach(resetStore);

describe("ScratchpadPanel", () => {
  it("renders nothing while closed", () => {
    useScratchpadStore.setState({ isOpen: false });
    renderPanel();
    expect(screen.queryByTestId("scratchpad-panel")).not.toBeInTheDocument();
  });

  it("names the question it belongs to", () => {
    renderPanel();
    expect(screen.getByRole("heading", { name: /rough work/i })).toHaveTextContent(
      "Question 3",
    );
  });

  it("tells the child their working is private and unmarked", () => {
    /* A child who believes their scribbles are being marked will not use
       the pad, which defeats the point of providing one. */
    renderPanel();
    expect(screen.getByText(/not marked and is not sent with your answers/i)).toBeVisible();
  });

  it("minimise hides the tools and surface but keeps the panel reachable", async () => {
    const user = userEvent.setup();
    renderPanel();
    expect(screen.getByTestId("scratchpad-surface")).toBeInTheDocument();

    await user.click(screen.getByTestId("scratchpad-minimise"));

    expect(screen.queryByTestId("scratchpad-surface")).not.toBeInTheDocument();
    expect(screen.getByTestId("scratchpad-panel")).toHaveAttribute("data-mode", "minimised");
    expect(screen.getByTestId("scratchpad-minimise")).toHaveAttribute("aria-expanded", "false");
  });

  it("maximise toggles the mode and reports pressed state to assistive tech", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByTestId("scratchpad-maximise"));
    expect(screen.getByTestId("scratchpad-panel")).toHaveAttribute("data-mode", "maximised");
    expect(screen.getByTestId("scratchpad-maximise")).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByTestId("scratchpad-maximise"));
    expect(screen.getByTestId("scratchpad-panel")).toHaveAttribute("data-mode", "docked");
  });

  it("close hides the panel", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByTestId("scratchpad-close"));
    expect(screen.queryByTestId("scratchpad-panel")).not.toBeInTheDocument();
  });

  it("selecting the rubber switches tool, and a colour switches back to the pen", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByTestId("scratchpad-eraser"));
    expect(useScratchpadStore.getState().tool).toBe("eraser");

    await user.click(screen.getByTestId("scratchpad-colour-orange"));
    expect(useScratchpadStore.getState().tool).toBe("pen");
    expect(useScratchpadStore.getState().colour).toBe("orange");
  });

  it("disables undo and clear until there is something to remove", async () => {
    const user = userEvent.setup();
    renderPanel();
    expect(screen.getByTestId("scratchpad-undo")).toBeDisabled();
    expect(screen.getByTestId("scratchpad-clear")).toBeDisabled();

    await user.type(screen.getByTestId("scratchpad-note"), "hi");
    expect(screen.getByTestId("scratchpad-clear")).toBeEnabled();
  });

  it("types notes into the entry for this question", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByTestId("scratchpad-note"), "carry the one");
    expect(useScratchpadStore.getState().entries[QUESTION]?.note).toBe("carry the one");
  });

  it("shows the working already stored for this question", () => {
    useScratchpadStore.setState({
      entries: {
        [QUESTION]: {
          strokes: [{ id: "s1", colour: "royal", points: [{ x: 0.2, y: 0.2 }] }],
          note: "restored note",
        },
      },
    });
    renderPanel();
    expect(screen.getByTestId("scratchpad-note")).toHaveValue("restored note");
    expect(screen.getByTestId("scratchpad-undo")).toBeEnabled();
  });

  it("exposes the drawing tools as a labelled toolbar", () => {
    renderPanel();
    expect(screen.getByRole("toolbar", { name: /drawing tools/i })).toBeInTheDocument();
  });
});
