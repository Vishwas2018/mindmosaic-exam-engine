import { describe, expect, it } from "vitest";

import {
  getEffectiveRemainingSeconds,
  getEffectiveSubmissionReason,
  getEffectiveSubmittedAt,
  hasDeadlineExpired,
} from "@/features/exam-engine/state/deadline";

describe("hasDeadlineExpired", () => {
  it("is never expired for untimed exams", () => {
    expect(hasDeadlineExpired(null, Number.MAX_SAFE_INTEGER)).toBe(false);
  });

  it("is not expired one millisecond before the deadline", () => {
    expect(hasDeadlineExpired(1_000, 999)).toBe(false);
  });

  it("is expired exactly at the deadline (documented boundary)", () => {
    expect(hasDeadlineExpired(1_000, 1_000)).toBe(true);
  });

  it("is expired after the deadline", () => {
    expect(hasDeadlineExpired(1_000, 1_001)).toBe(true);
  });
});

describe("getEffectiveRemainingSeconds", () => {
  it("returns null for untimed exams", () => {
    expect(getEffectiveRemainingSeconds(null, 0)).toBeNull();
  });

  it("rounds up remaining whole seconds", () => {
    expect(getEffectiveRemainingSeconds(10_000, 8_500)).toBe(2);
  });

  it("never goes negative once past the deadline", () => {
    expect(getEffectiveRemainingSeconds(10_000, 15_000)).toBe(0);
  });
});

describe("getEffectiveSubmissionReason", () => {
  it("keeps the requested reason before the deadline", () => {
    expect(getEffectiveSubmissionReason("user_submitted", 10_000, 9_000)).toBe(
      "user_submitted",
    );
  });

  it("overrides a late user_submitted with timer_expired", () => {
    expect(getEffectiveSubmissionReason("user_submitted", 10_000, 10_001)).toBe(
      "timer_expired",
    );
  });

  it("is unaffected for untimed exams", () => {
    expect(getEffectiveSubmissionReason("user_submitted", null, 999_999)).toBe(
      "user_submitted",
    );
  });
});

describe("getEffectiveSubmittedAt", () => {
  it("uses now before the deadline", () => {
    expect(getEffectiveSubmittedAt(9_000, 10_000)).toBe(9_000);
  });

  it("clamps to the deadline for a delayed finalisation", () => {
    /* A 900-second exam whose expiry is only processed 1,200 seconds in
       must still record exactly 900 seconds of time taken. */
    const startedAt = 0;
    const deadlineAt = startedAt + 900_000;
    const delayedNow = startedAt + 1_200_000;
    expect(getEffectiveSubmittedAt(delayedNow, deadlineAt)).toBe(deadlineAt);
  });

  it("passes now through for untimed exams", () => {
    expect(getEffectiveSubmittedAt(12_345, null)).toBe(12_345);
  });
});
