import { describe, expect, it } from "vitest";

import { getEffectiveSubmissionReason, hasDeadlineExpired } from "@/features/exam-engine/state/deadline";
import { activeWritingWarning, formatClock, remainingWithSkew, writingWarningMessage } from "@/features/writing/timing";

describe("writing time cues", () => {
  it("warns once at five minutes and again at one minute, never before or after", () => {
    expect(activeWritingWarning(null)).toBeNull();
    expect(activeWritingWarning(900)).toBeNull();
    expect(activeWritingWarning(301)).toBeNull();
    expect(activeWritingWarning(300)).toBe(300);
    expect(activeWritingWarning(61)).toBe(300);
    expect(activeWritingWarning(60)).toBe(60);
    expect(activeWritingWarning(1)).toBe(60);
    expect(activeWritingWarning(0)).toBeNull();
  });

  it("uses calm wording that does not rely on colour", () => {
    expect(writingWarningMessage(300)).toBe("About five minutes left.");
    expect(writingWarningMessage(60)).toBe("About one minute left. Finish your last sentence.");
  });

  it("formats a countdown as m:ss", () => {
    expect(formatClock(900)).toBe("15:00");
    expect(formatClock(61)).toBe("1:01");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(-5)).toBe("0:00");
  });
});

describe("the deadline is the server's, not the device's", () => {
  const deadline = 1_000_000_000;

  it("a device clock that runs fast or slow cannot change the remaining time", () => {
    // Server says it is 1_000_000_000 - 600_000 (10 minutes left). The device thinks it is an hour ahead.
    const clientNow = 1_000_000_000 - 600_000 + 3_600_000;
    const skew = (1_000_000_000 - 600_000) - clientNow; // serverNow - clientNow, measured at fetch time
    expect(remainingWithSkew(deadline, clientNow, skew)).toBe(600);
    expect(remainingWithSkew(deadline, clientNow + 59_000, skew)).toBe(541);
  });

  it("is untimed when there is no deadline", () => {
    expect(remainingWithSkew(null, 123, 0)).toBeNull();
  });

  it("reuses the engine's boundary rule: at the deadline is already expired, and timer_expired wins", () => {
    expect(hasDeadlineExpired(deadline, deadline - 1)).toBe(false);
    expect(hasDeadlineExpired(deadline, deadline)).toBe(true);
    expect(getEffectiveSubmissionReason("user_submitted", deadline, deadline + 5_000)).toBe("timer_expired");
    expect(getEffectiveSubmissionReason("user_submitted", deadline, deadline - 5_000)).toBe("user_submitted");
    expect(getEffectiveSubmissionReason("user_submitted", null, 9e12)).toBe("user_submitted");
  });
});
