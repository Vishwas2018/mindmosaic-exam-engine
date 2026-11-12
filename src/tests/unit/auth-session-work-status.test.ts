import { beforeEach, describe, expect, it } from "vitest";

import {
  WORK_STATUS_MAX_AGE_MS,
  clearWorkStatus,
  interpretWorkStatus,
  readWorkStatus,
  recordConfirmedSave,
  recordNoOpenWork,
  recordOpenWorkUnconfirmed,
} from "@/features/auth/session-work-status";

const NOW = Date.parse("2026-11-12T06:30:00.000Z");

describe("work status — only what the server confirmed", () => {
  beforeEach(() => window.localStorage.clear());

  it("is unknown when nothing was ever recorded (never defaults to empty or saved)", () => {
    expect(readWorkStatus(NOW)).toEqual({ kind: "unknown" });
  });

  it("is confirmed only after a server-returned save time", () => {
    recordConfirmedSave("2026-11-12T06:02:00.000Z", NOW - 60_000);
    expect(readWorkStatus(NOW)).toEqual({ kind: "confirmed", savedAt: "2026-11-12T06:02:00.000Z" });
  });

  it("ignores a save time the server did not really return", () => {
    recordConfirmedSave(undefined, NOW);
    recordConfirmedSave("not a date", NOW);
    recordConfirmedSave(12345, NOW);
    expect(readWorkStatus(NOW)).toEqual({ kind: "unknown" });
  });

  it("is empty only when the server confirmed there is no open sitting", () => {
    recordNoOpenWork(NOW - 1000);
    expect(readWorkStatus(NOW)).toEqual({ kind: "empty" });
  });

  it("an open sitting with no confirmed save reads as unknown, never saved or empty", () => {
    recordConfirmedSave("2026-11-12T05:00:00.000Z", NOW - 120_000);
    recordOpenWorkUnconfirmed(NOW - 1000);
    expect(readWorkStatus(NOW)).toEqual({ kind: "unknown" });
  });

  it("a later fact replaces an earlier one", () => {
    recordNoOpenWork(NOW - 5000);
    recordConfirmedSave("2026-11-12T06:29:00.000Z", NOW - 1000);
    expect(readWorkStatus(NOW).kind).toBe("confirmed");
  });

  it("goes stale: an old record may no longer describe the server", () => {
    recordConfirmedSave("2026-11-11T06:00:00.000Z", NOW - WORK_STATUS_MAX_AGE_MS - 1);
    expect(readWorkStatus(NOW)).toEqual({ kind: "unknown" });
    recordNoOpenWork(NOW - WORK_STATUS_MAX_AGE_MS - 1);
    expect(readWorkStatus(NOW)).toEqual({ kind: "unknown" });
  });

  it("treats a record from the future as unknown", () => {
    recordNoOpenWork(NOW + 10 * 60_000);
    expect(readWorkStatus(NOW)).toEqual({ kind: "unknown" });
  });

  it("treats corrupted storage as unknown", () => {
    expect(interpretWorkStatus("{not json", NOW)).toEqual({ kind: "unknown" });
    expect(interpretWorkStatus(JSON.stringify({ kind: "confirmed", recordedAt: NOW }), NOW)).toEqual({ kind: "unknown" });
    expect(interpretWorkStatus(JSON.stringify({ kind: "something-else", recordedAt: NOW }), NOW)).toEqual({ kind: "unknown" });
  });

  it("can be cleared", () => {
    recordNoOpenWork(NOW);
    clearWorkStatus();
    expect(readWorkStatus(NOW)).toEqual({ kind: "unknown" });
  });
});
