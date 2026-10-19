import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  markWritingAttemptRequestSchema,
  paperWritingAttemptRequestSchema,
  startWritingAttemptRequestSchema,
  submitWritingAttemptRequestSchema,
} from "@/features/writing/contracts";
import { mapWritingDbError, toAttemptDto, toMarkDto } from "@/server/writing/service";

describe("database error mapping", () => {
  it("maps the writing codes and nothing else to client errors", () => {
    expect(mapWritingDbError({ code: "MM310" })).toEqual({ status: 404, code: "not_found" });
    expect(mapWritingDbError({ code: "MM311", message: "attempt already submitted" })).toEqual({ status: 409, code: "already_submitted" });
    expect(mapWritingDbError({ code: "MM311", message: "attempt has not been submitted" })).toEqual({ status: 409, code: "not_submitted" });
    expect(mapWritingDbError({ code: "MM312" })).toEqual({ status: 400, code: "invalid_request" });
    expect(mapWritingDbError({ code: "MM313" })).toEqual({ status: 409, code: "expired" });
    expect(mapWritingDbError({ code: "42501" })).toEqual({ status: 500, code: "server_error" });
    expect(mapWritingDbError({})).toEqual({ status: 500, code: "server_error" });
  });
});

describe("row to DTO mapping", () => {
  it("turns the deadline into epoch milliseconds and carries the server clock", () => {
    const dto = toAttemptDto(
      {
        id: "a",
        task_id: "t",
        mode: "timed",
        duration_seconds: 900,
        started_at: "2027-02-06T00:00:00.000Z",
        deadline_at: "2027-02-06T00:15:00.000Z",
        response_text: "hi",
        response_source: "student_typed",
        submitted_at: null,
        submission_reason: null,
      },
      1234,
    );
    expect(dto.deadlineAt).toBe(Date.parse("2027-02-06T00:15:00.000Z"));
    expect(dto.serverNow).toBe(1234);
    expect(dto.submittedAt).toBeNull();
  });

  it("reads numeric totals as numbers", () => {
    const dto = toMarkDto({
      attempt_id: "a",
      rubric_id: "r",
      rubric_version: 1,
      awarded_marks: "21",
      max_marks: "30",
      feedback: null,
      marked_at: "2027-02-06T00:00:00.000Z",
      writing_mark_criteria: [{ criterion_id: "spelling", score: 2, comment: null }],
    });
    expect([dto.awardedMarks, dto.maxMarks]).toEqual([21, 30]);
  });
});

describe("request contracts cannot carry what the server decides", () => {
  it("a start request has no field for the deadline or duration", () => {
    const parsed = startWritingAttemptRequestSchema.parse({ taskId: "t", mode: "timed", deadlineAt: 1, durationSeconds: 99999 });
    expect(parsed).toEqual({ taskId: "t", mode: "timed" });
    expect(startWritingAttemptRequestSchema.safeParse({ taskId: "t", mode: "paper" }).success).toBe(false);
  });

  it("a mark request has no field for the total, the ceiling or the marker, and scores must be whole numbers", () => {
    const parsed = markWritingAttemptRequestSchema.parse({
      rubricId: "r",
      rubricVersion: 1,
      scores: { spelling: 3 },
      total: 30,
      maxMarks: 30,
      markedBy: "someone",
    });
    expect(Object.keys(parsed).sort()).toEqual(["rubricId", "rubricVersion", "scores"]);
    expect(markWritingAttemptRequestSchema.safeParse({ rubricId: "r", rubricVersion: 1, scores: { spelling: 2.5 } }).success).toBe(false);
  });

  it("submit and paper requests validate their shapes", () => {
    expect(submitWritingAttemptRequestSchema.safeParse({ reason: "timer_expired" }).success).toBe(true);
    expect(submitWritingAttemptRequestSchema.safeParse({ reason: "teacher_forced" }).success).toBe(false);
    expect(paperWritingAttemptRequestSchema.safeParse({ childId: "not-a-uuid", taskId: "t", text: "x" }).success).toBe(false);
  });
});
