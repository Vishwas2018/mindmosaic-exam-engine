import { beforeEach, describe, expect, it } from "vitest";

import {
  MAX_NOTE_LENGTH,
  readPersisted,
  selectEntry,
  useScratchpadStore,
} from "@/features/exam-engine/scratchpad";

const QUESTION = "q-1";
const OTHER = "q-2";

function resetStore(): void {
  useScratchpadStore.setState({
    sessionKey: null,
    isOpen: false,
    mode: "docked",
    tool: "pen",
    colour: "slate",
    entries: {},
    drawing: null,
  });
  window.sessionStorage.clear();
}

function draw(questionId: string, points: readonly { x: number; y: number }[]): void {
  const store = useScratchpadStore.getState();
  store.beginStroke(questionId, points[0]);
  for (const point of points.slice(1)) useScratchpadStore.getState().extendStroke(point);
  useScratchpadStore.getState().endStroke(questionId);
}

function entry(questionId: string) {
  return selectEntry(useScratchpadStore.getState(), questionId);
}

beforeEach(resetStore);

describe("drawing", () => {
  it("commits a stroke on pointer up, not before", () => {
    const store = useScratchpadStore.getState();
    store.beginStroke(QUESTION, { x: 0.1, y: 0.1 });
    useScratchpadStore.getState().extendStroke({ x: 0.9, y: 0.9 });

    expect(entry(QUESTION).strokes).toHaveLength(0);
    expect(useScratchpadStore.getState().drawing).not.toBeNull();

    useScratchpadStore.getState().endStroke(QUESTION);
    expect(entry(QUESTION).strokes).toHaveLength(1);
    expect(useScratchpadStore.getState().drawing).toBeNull();
  });

  it("keeps each question's working separate", () => {
    draw(QUESTION, [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }]);
    expect(entry(QUESTION).strokes).toHaveLength(1);
    expect(entry(OTHER).strokes).toHaveLength(0);
  });

  it("ignores extend and end when no stroke is in progress", () => {
    useScratchpadStore.getState().extendStroke({ x: 0.5, y: 0.5 });
    useScratchpadStore.getState().endStroke(QUESTION);
    expect(entry(QUESTION).strokes).toHaveLength(0);
  });

  it("gives every stroke a distinct id so erase removes only one", () => {
    draw(QUESTION, [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }]);
    draw(QUESTION, [{ x: 0.8, y: 0.8 }, { x: 0.9, y: 0.9 }]);
    const [first, second] = entry(QUESTION).strokes;
    expect(first.id).not.toBe(second.id);
  });
});

describe("eraser", () => {
  it("removes a whole stroke that the pointer touches", () => {
    draw(QUESTION, [{ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }]);
    useScratchpadStore.getState().eraseAt(QUESTION, { x: 0.5, y: 0.5 });
    expect(entry(QUESTION).strokes).toHaveLength(0);
  });

  it("leaves untouched strokes alone", () => {
    draw(QUESTION, [{ x: 0.1, y: 0.1 }]);
    draw(QUESTION, [{ x: 0.9, y: 0.9 }]);
    useScratchpadStore.getState().eraseAt(QUESTION, { x: 0.1, y: 0.1 });
    expect(entry(QUESTION).strokes).toHaveLength(1);
  });

  it("begins an erase rather than a stroke when the eraser is selected", () => {
    draw(QUESTION, [{ x: 0.5, y: 0.5 }]);
    useScratchpadStore.getState().setTool("eraser");
    useScratchpadStore.getState().beginStroke(QUESTION, { x: 0.5, y: 0.5 });

    expect(useScratchpadStore.getState().drawing).toBeNull();
    expect(entry(QUESTION).strokes).toHaveLength(0);
  });
});

describe("undo and clear", () => {
  it("undo removes the most recent stroke only", () => {
    draw(QUESTION, [{ x: 0.1, y: 0.1 }]);
    draw(QUESTION, [{ x: 0.9, y: 0.9 }]);
    useScratchpadStore.getState().undo(QUESTION);
    expect(entry(QUESTION).strokes).toHaveLength(1);
  });

  it("undo on an empty pad is a no-op", () => {
    useScratchpadStore.getState().undo(QUESTION);
    expect(entry(QUESTION).strokes).toHaveLength(0);
  });

  it("clearQuestion drops strokes and the note for that question only", () => {
    draw(QUESTION, [{ x: 0.5, y: 0.5 }]);
    useScratchpadStore.getState().setNote(QUESTION, "carry the one");
    useScratchpadStore.getState().setNote(OTHER, "keep me");

    useScratchpadStore.getState().clearQuestion(QUESTION);
    expect(entry(QUESTION).strokes).toHaveLength(0);
    expect(entry(QUESTION).note).toBe("");
    expect(entry(OTHER).note).toBe("keep me");
  });
});

describe("notes", () => {
  it("stores a note per question", () => {
    useScratchpadStore.getState().setNote(QUESTION, "units column first");
    expect(entry(QUESTION).note).toBe("units column first");
  });

  it("caps note length so storage cannot be filled", () => {
    useScratchpadStore.getState().setNote(QUESTION, "x".repeat(MAX_NOTE_LENGTH + 500));
    expect(entry(QUESTION).note).toHaveLength(MAX_NOTE_LENGTH);
  });
});

describe("panel mode", () => {
  it("toggles between docked and maximised", () => {
    const store = useScratchpadStore.getState();
    expect(store.mode).toBe("docked");
    store.toggleMaximised();
    expect(useScratchpadStore.getState().mode).toBe("maximised");
    useScratchpadStore.getState().toggleMaximised();
    expect(useScratchpadStore.getState().mode).toBe("docked");
  });

  it("toggles between docked and minimised", () => {
    useScratchpadStore.getState().toggleMinimised();
    expect(useScratchpadStore.getState().mode).toBe("minimised");
    useScratchpadStore.getState().toggleMinimised();
    expect(useScratchpadStore.getState().mode).toBe("docked");
  });

  it("reopening a minimised pad restores it to docked", () => {
    /* Otherwise the toggle button appears to do nothing: the panel is
       "open" but still collapsed to its title bar. */
    useScratchpadStore.getState().toggleMinimised();
    useScratchpadStore.getState().close();
    useScratchpadStore.getState().open();
    expect(useScratchpadStore.getState().mode).toBe("docked");
    expect(useScratchpadStore.getState().isOpen).toBe(true);
  });

  it("picking a colour switches back to the pen", () => {
    useScratchpadStore.getState().setTool("eraser");
    useScratchpadStore.getState().setColour("orange");
    expect(useScratchpadStore.getState().tool).toBe("pen");
    expect(useScratchpadStore.getState().colour).toBe("orange");
  });
});

describe("session binding and persistence", () => {
  it("persists working to sessionStorage under the sitting's key", () => {
    useScratchpadStore.getState().useSession("session-a");
    draw(QUESTION, [{ x: 0.5, y: 0.5 }]);

    const persisted = readPersisted();
    expect(persisted?.sessionKey).toBe("session-a");
    expect(persisted?.entries[QUESTION].strokes).toHaveLength(1);
  });

  it("restores working when the same sitting is adopted again (the refresh case)", () => {
    useScratchpadStore.getState().useSession("session-a");
    draw(QUESTION, [{ x: 0.5, y: 0.5 }]);
    useScratchpadStore.getState().setNote(QUESTION, "borrowed ten");

    /* Simulate a page refresh: memory is gone, sessionStorage is not. */
    useScratchpadStore.setState({ sessionKey: null, entries: {}, drawing: null });
    useScratchpadStore.getState().useSession("session-a");

    expect(entry(QUESTION).strokes).toHaveLength(1);
    expect(entry(QUESTION).note).toBe("borrowed ten");
  });

  it("starts blank when a different sitting is adopted", () => {
    /* Question ids repeat across sittings — without this a child would open
       question 1 of a new paper to find the last paper's working on it. */
    useScratchpadStore.getState().useSession("session-a");
    draw(QUESTION, [{ x: 0.5, y: 0.5 }]);

    useScratchpadStore.setState({ sessionKey: null, entries: {}, drawing: null });
    useScratchpadStore.getState().useSession("session-b");

    expect(entry(QUESTION).strokes).toHaveLength(0);
  });

  it("adopting the same key twice does not wipe in-memory working", () => {
    useScratchpadStore.getState().useSession("session-a");
    draw(QUESTION, [{ x: 0.5, y: 0.5 }]);
    useScratchpadStore.getState().useSession("session-a");
    expect(entry(QUESTION).strokes).toHaveLength(1);
  });

  it("clearAll wipes memory and storage, and closes the pad", () => {
    useScratchpadStore.getState().useSession("session-a");
    draw(QUESTION, [{ x: 0.5, y: 0.5 }]);
    useScratchpadStore.getState().open();

    useScratchpadStore.getState().clearAll();

    expect(entry(QUESTION).strokes).toHaveLength(0);
    expect(useScratchpadStore.getState().isOpen).toBe(false);
    expect(readPersisted()).toBeNull();
  });

  it("ignores corrupt stored data instead of throwing on mount", () => {
    window.sessionStorage.setItem("mindmosaic.scratchpad.v1", "{not json");
    expect(readPersisted()).toBeNull();
    expect(() => useScratchpadStore.getState().useSession("session-a")).not.toThrow();
  });
});
