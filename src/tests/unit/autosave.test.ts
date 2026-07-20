import { describe, expect, it } from "vitest";

import { isAutosaveDue } from "@/features/exam-engine/state/autosave";

describe("isAutosaveDue", () => {
  it("is never due before any change has happened", () => {
    expect(isAutosaveDue(null, null, 100_000, 2_000)).toBe(false);
  });

  it("is not due before the debounce interval has elapsed", () => {
    expect(isAutosaveDue(10_000, null, 11_999, 2_000)).toBe(false);
  });

  it("is due exactly at the debounce interval (documented boundary)", () => {
    expect(isAutosaveDue(10_000, null, 12_000, 2_000)).toBe(true);
  });

  it("is due after the debounce interval", () => {
    expect(isAutosaveDue(10_000, null, 20_000, 2_000)).toBe(true);
  });

  it("is not due again once the change has already been flushed", () => {
    /* A save already happened at or after the most recent change — nothing
       new to send. */
    expect(isAutosaveDue(10_000, 12_000, 20_000, 2_000)).toBe(false);
  });

  it("is due again after a new change following a previous flush", () => {
    /* Flushed at 12,000 for a change at 10,000; a further edit at 13,000
       makes it due again once its own debounce interval elapses. */
    expect(isAutosaveDue(13_000, 12_000, 14_999, 2_000)).toBe(false);
    expect(isAutosaveDue(13_000, 12_000, 15_000, 2_000)).toBe(true);
  });

  it("keeps pushing the due time out across rapid successive changes", () => {
    /* Simulates a debounce: each new change resets the clock, so only a
       quiet period of debounceMs with no further change is ever due. */
    let lastChangeAt = 0;
    const debounceMs = 2_000;
    lastChangeAt = 1_000;
    expect(isAutosaveDue(lastChangeAt, null, 2_500, debounceMs)).toBe(false);
    lastChangeAt = 2_500;
    expect(isAutosaveDue(lastChangeAt, null, 4_000, debounceMs)).toBe(false);
    lastChangeAt = 4_000;
    expect(isAutosaveDue(lastChangeAt, null, 6_000, debounceMs)).toBe(true);
  });
});
