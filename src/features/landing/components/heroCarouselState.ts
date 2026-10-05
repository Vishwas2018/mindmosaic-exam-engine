/**
 * The hero carousel's slide state machine, kept pure so the manual-selection
 * race can be tested without timers or images.
 *
 * `requested` is the slide the carousel is heading for and `shown` is the one
 * on screen. They differ only while the requested slide's photograph is still
 * loading ("pending"). Rules:
 *
 * - The most recent explicit selection always wins (`select` overwrites
 *   `requested`).
 * - Auto-advance (`timerEnd`) never runs while a request is pending, so it can
 *   never overwrite one.
 * - A slide becomes `shown` only once it has loaded, and `cycle` then bumps so
 *   its timer restarts from zero. The previous slide stays visible meanwhile.
 * - A load failure clears the pending request, leaves `shown` untouched,
 *   restarts the timer so auto rotation resumes, and marks the slide failed so
 *   rotation skips it; selecting it again retries.
 */
export type CarouselState = {
  shown: number;
  requested: number;
  /** Bumped whenever the shown slide's timer must restart from zero. */
  cycle: number;
  loaded: readonly number[];
  failed: readonly number[];
  /** Per-slide retry counter, so a retried image remounts. */
  attempts: Readonly<Record<number, number>>;
};

export type CarouselAction =
  | { type: "select"; index: number }
  | { type: "loaded"; index: number }
  | { type: "failed"; index: number }
  | { type: "timerEnd" };

export function initialCarouselState(): CarouselState {
  return { shown: 0, requested: 0, cycle: 0, loaded: [0], failed: [], attempts: {} };
}

export function isPending(state: CarouselState): boolean {
  return state.requested !== state.shown;
}

function activate(state: CarouselState, index: number): CarouselState {
  return { ...state, shown: index, requested: index, cycle: state.cycle + 1 };
}

function nextPlayable(state: CarouselState, count: number): number | null {
  for (let step = 1; step < count; step += 1) {
    const candidate = (state.shown + step) % count;
    if (!state.failed.includes(candidate)) return candidate;
  }
  return null;
}

export function carouselReducer(state: CarouselState, action: CarouselAction, count: number): CarouselState {
  switch (action.type) {
    case "select": {
      const { index } = action;
      const retrying = state.failed.includes(index);
      const base: CarouselState = retrying
        ? {
            ...state,
            failed: state.failed.filter((value) => value !== index),
            loaded: state.loaded.filter((value) => value !== index),
            attempts: { ...state.attempts, [index]: (state.attempts[index] ?? 0) + 1 },
          }
        : state;
      // Re-selecting the visible slide also cancels any pending request.
      if (index === base.shown) return activate(base, index);
      if (base.loaded.includes(index)) return activate(base, index);
      return { ...base, requested: index };
    }
    case "loaded": {
      const loaded = state.loaded.includes(action.index) ? state.loaded : [...state.loaded, action.index];
      const next = { ...state, loaded };
      return next.requested === action.index && next.shown !== action.index ? activate(next, action.index) : next;
    }
    case "failed": {
      const failed = state.failed.includes(action.index) ? state.failed : [...state.failed, action.index];
      const next = { ...state, failed };
      if (next.requested !== action.index || next.shown === action.index) return next;
      return { ...next, requested: next.shown, cycle: next.cycle + 1 };
    }
    case "timerEnd": {
      if (isPending(state)) return state;
      const target = nextPlayable(state, count);
      if (target === null) return state;
      return state.loaded.includes(target) ? activate(state, target) : { ...state, requested: target };
    }
  }
}
