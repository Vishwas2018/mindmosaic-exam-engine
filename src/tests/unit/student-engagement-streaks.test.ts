import { describe, expect, it } from "vitest";

import {
  computeStreakStats,
  countThisWeek,
  streakReachedOn,
  toDayKey,
  uniqueSortedDayKeys,
  weekDots,
} from "@/features/student/engagement/streaks";

/* Friday 10 April 2026 (a fixed local-calendar day). */
const TODAY = "2026-04-10";

describe("toDayKey / uniqueSortedDayKeys", () => {
  it("formats local calendar days and pads components", () => {
    expect(toDayKey(new Date(2026, 3, 5, 23, 59))).toBe("2026-04-05");
    expect(toDayKey(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
  });

  it("dedupes multiple attempts on one day and sorts", () => {
    const keys = uniqueSortedDayKeys([
      new Date(2026, 3, 7, 18, 0),
      new Date(2026, 3, 5, 9, 0),
      new Date(2026, 3, 7, 8, 0),
    ]);
    expect(keys).toEqual(["2026-04-05", "2026-04-07"]);
  });
});

describe("computeStreakStats", () => {
  it("is all zeroes with no practice days", () => {
    expect(computeStreakStats([], TODAY)).toEqual({
      current: 0,
      best: 0,
      practisedToday: false,
    });
  });

  it("counts a run ending today", () => {
    const stats = computeStreakStats(
      ["2026-04-08", "2026-04-09", "2026-04-10"],
      TODAY,
    );
    expect(stats.current).toBe(3);
    expect(stats.best).toBe(3);
    expect(stats.practisedToday).toBe(true);
  });

  it("keeps a streak alive through yesterday until today is missed", () => {
    const stats = computeStreakStats(["2026-04-08", "2026-04-09"], TODAY);
    expect(stats.current).toBe(2);
    expect(stats.practisedToday).toBe(false);
  });

  it("resets current after a full missed day but keeps the best", () => {
    const stats = computeStreakStats(
      ["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-04", "2026-04-08"],
      TODAY,
    );
    expect(stats.current).toBe(0);
    expect(stats.best).toBe(4);
  });

  it("spans month boundaries", () => {
    const stats = computeStreakStats(
      ["2026-03-30", "2026-03-31", "2026-04-01"],
      "2026-04-01",
    );
    expect(stats.current).toBe(3);
  });
});

describe("streakReachedOn", () => {
  it("returns the day the target run length was first completed", () => {
    expect(
      streakReachedOn(["2026-04-05", "2026-04-06", "2026-04-07"], 3),
    ).toBe("2026-04-07");
  });

  it("returns null when the target was never reached", () => {
    expect(streakReachedOn(["2026-04-05", "2026-04-07"], 2)).toBeNull();
  });

  it("picks the earliest qualifying run", () => {
    expect(
      streakReachedOn(
        ["2026-03-01", "2026-03-02", "2026-04-05", "2026-04-06"],
        2,
      ),
    ).toBe("2026-03-02");
  });
});

describe("weekDots", () => {
  it("builds a Monday-start week around today", () => {
    const dots = weekDots(["2026-04-06", "2026-04-08"], TODAY);
    expect(dots.map((d) => d.dayKey)).toEqual([
      "2026-04-06",
      "2026-04-07",
      "2026-04-08",
      "2026-04-09",
      "2026-04-10",
      "2026-04-11",
      "2026-04-12",
    ]);
    expect(dots.map((d) => d.state)).toEqual([
      "done",
      "missed",
      "done",
      "missed",
      "today_pending",
      "future",
      "future",
    ]);
  });

  it("marks today done when practised", () => {
    const dots = weekDots([TODAY], TODAY);
    expect(dots[4].state).toBe("today_done");
  });

  it("handles a Sunday today (end of the Monday-start week)", () => {
    const dots = weekDots([], "2026-04-12");
    expect(dots[0].dayKey).toBe("2026-04-06");
    expect(dots[6].dayKey).toBe("2026-04-12");
    expect(dots[6].state).toBe("today_pending");
  });
});

describe("countThisWeek", () => {
  it("counts attempts (not unique days) within the current week only", () => {
    expect(
      countThisWeek(
        ["2026-04-05", "2026-04-06", "2026-04-06", "2026-04-10", "2026-04-13"],
        TODAY,
      ),
    ).toBe(3);
  });
});
