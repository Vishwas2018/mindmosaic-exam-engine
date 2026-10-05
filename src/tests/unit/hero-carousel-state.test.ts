import { describe, expect, it } from "vitest";

import {
  carouselReducer,
  initialCarouselState,
  isPending,
  type CarouselAction,
  type CarouselState,
} from "@/features/landing/components/heroCarouselState";

const COUNT = 6;

function run(actions: CarouselAction[], from: CarouselState = initialCarouselState()): CarouselState {
  return actions.reduce((state, action) => carouselReducer(state, action, COUNT), from);
}

/*
 * Slides are zero-indexed here: the brief's "slide 6" is index 5, "slide 4" is
 * index 3, "slide 2" is index 1. Only slide 1 (index 0) starts loaded.
 */
describe("hero carousel state machine", () => {
  it("starts on slide 1 with nothing pending", () => {
    const state = initialCarouselState();
    expect(state.shown).toBe(0);
    expect(isPending(state)).toBe(false);
  });

  describe("A: auto-advance can never overwrite an unresolved manual selection", () => {
    it("keeps slide 6 as the target when the interval expires, then activates it, not slide 2", () => {
      let state = run([{ type: "select", index: 5 }]);
      expect(state).toMatchObject({ shown: 0, requested: 5 });
      expect(isPending(state)).toBe(true);

      state = run([{ type: "timerEnd" }], state);
      expect(state).toMatchObject({ shown: 0, requested: 5 });

      state = run([{ type: "loaded", index: 5 }], state);
      expect(state).toMatchObject({ shown: 5, requested: 5 });
      expect(isPending(state)).toBe(false);
    });

    it("ignores repeated timer expiries while the request is pending", () => {
      const state = run([
        { type: "select", index: 5 },
        { type: "timerEnd" },
        { type: "timerEnd" },
        { type: "timerEnd" },
      ]);
      expect(state).toMatchObject({ shown: 0, requested: 5 });
    });
  });

  describe("B: the latest explicit selection is authoritative", () => {
    it("targets slide 4 after selecting 6 then 4 before either loads", () => {
      const state = run([
        { type: "select", index: 5 },
        { type: "select", index: 3 },
      ]);
      expect(state.requested).toBe(3);
      expect(state.shown).toBe(0);
    });

    it("lands on slide 4 even if slide 6 finishes loading first", () => {
      const state = run([
        { type: "select", index: 5 },
        { type: "select", index: 3 },
        { type: "loaded", index: 5 },
      ]);
      expect(state).toMatchObject({ shown: 0, requested: 3 });
      expect(run([{ type: "loaded", index: 3 }], state)).toMatchObject({ shown: 3, requested: 3 });
    });

    it("keeps slide 4 when slide 6 arrives after slide 4 activated", () => {
      const state = run([
        { type: "select", index: 5 },
        { type: "select", index: 3 },
        { type: "loaded", index: 3 },
        { type: "loaded", index: 5 },
      ]);
      expect(state).toMatchObject({ shown: 3, requested: 3 });
    });

    it("re-selecting the visible slide cancels a pending request", () => {
      const state = run([
        { type: "select", index: 5 },
        { type: "select", index: 0 },
      ]);
      expect(state).toMatchObject({ shown: 0, requested: 0 });
      expect(isPending(state)).toBe(false);
    });
  });

  describe("C: a manually activated slide starts a fresh timer", () => {
    it("bumps the cycle when the requested slide becomes active", () => {
      const pending = run([{ type: "select", index: 5 }]);
      const before = pending.cycle;
      const active = run([{ type: "loaded", index: 5 }], pending);
      expect(active.cycle).toBe(before + 1);
    });

    it("bumps the cycle for an instant switch to an already-loaded slide", () => {
      const state = run([
        { type: "loaded", index: 2 },
        { type: "select", index: 2 },
      ]);
      expect(state).toMatchObject({ shown: 2, requested: 2, cycle: 1 });
    });

    it("restarts the timer when the visible slide is re-selected", () => {
      expect(run([{ type: "select", index: 0 }]).cycle).toBe(1);
    });
  });

  describe("auto rotation", () => {
    it("advances to the next slide once it has loaded", () => {
      const state = run([{ type: "loaded", index: 1 }, { type: "timerEnd" }]);
      expect(state).toMatchObject({ shown: 1, requested: 1, cycle: 1 });
    });

    it("waits (and freezes) on a next slide that has not loaded, then shows it", () => {
      const waiting = run([{ type: "timerEnd" }]);
      expect(waiting).toMatchObject({ shown: 0, requested: 1 });
      expect(isPending(waiting)).toBe(true);
      expect(run([{ type: "loaded", index: 1 }], waiting)).toMatchObject({ shown: 1, requested: 1 });
    });

    it("wraps from the last slide to the first", () => {
      const state = run([
        { type: "loaded", index: 5 },
        { type: "select", index: 5 },
        { type: "loaded", index: 0 },
        { type: "timerEnd" },
      ]);
      expect(state.shown).toBe(0);
    });
  });

  describe("load failures", () => {
    it("clears the pending request, keeps the current slide and restarts the timer", () => {
      const pending = run([{ type: "select", index: 5 }]);
      const failed = run([{ type: "failed", index: 5 }], pending);
      expect(failed).toMatchObject({ shown: 0, requested: 0 });
      expect(isPending(failed)).toBe(false);
      expect(failed.cycle).toBe(pending.cycle + 1);
    });

    it("lets auto rotation continue and skip the failed slide", () => {
      const state = run([
        { type: "select", index: 1 },
        { type: "failed", index: 1 },
        { type: "loaded", index: 2 },
        { type: "timerEnd" },
      ]);
      expect(state.shown).toBe(2);
    });

    it("ignores a failure for a slide that is no longer the target", () => {
      const state = run([
        { type: "select", index: 5 },
        { type: "select", index: 3 },
        { type: "failed", index: 5 },
      ]);
      expect(state).toMatchObject({ shown: 0, requested: 3 });
    });

    it("retries a failed slide when it is selected again", () => {
      const state = run([
        { type: "select", index: 5 },
        { type: "failed", index: 5 },
        { type: "select", index: 5 },
      ]);
      expect(state.requested).toBe(5);
      expect(state.failed).not.toContain(5);
      expect(state.attempts[5]).toBe(1);
    });
  });
});
