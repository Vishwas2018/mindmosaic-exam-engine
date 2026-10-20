import { describe, expect, it } from "vitest";
import { parseSessionCreationError } from "@/features/exam-engine/state/session-error";

describe("parseSessionCreationError", () => {
  it("maps 403 students_only to role-specific message", async () => {
    const response = new Response(JSON.stringify({ error: "students_only" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
    const message = await parseSessionCreationError(response);
    expect(message).toBe(
      "Exam sessions are only available to student accounts. Please sign in with a student account to start this exam.",
    );
  });

  it("maps 401 unauthenticated to session expired message", async () => {
    const response = new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
    const message = await parseSessionCreationError(response);
    expect(message).toBe("Your session has expired. Please sign in again.");
  });

  it("maps 422 insufficient_questions to informative message", async () => {
    const response = new Response(
      JSON.stringify({ error: "insufficient_questions", eligibleCount: 5, requestedCount: 10 }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      },
    );
    const message = await parseSessionCreationError(response);
    expect(message).toBe(
      "Not enough reviewed questions are currently available for this paper.",
    );
  });

  it("maps 409 idempotency conflict to already started message", async () => {
    const response = new Response(
      JSON.stringify({ error: "idempotency_key_reused" }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      },
    );
    const message = await parseSessionCreationError(response);
    expect(message).toBe("This exam session was already started. Please refresh the page.");
  });

  it("maps 503 not_configured to service unavailable message", async () => {
    const response = new Response(
      JSON.stringify({ error: "not_configured" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
    const message = await parseSessionCreationError(response);
    expect(message).toBe("Exam services are temporarily unavailable. Please try again shortly.");
  });

  it("maps 500 session_not_created to server error message", async () => {
    const response = new Response(
      JSON.stringify({ error: "session_not_created" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
    const message = await parseSessionCreationError(response);
    expect(message).toBe(
      "The server encountered an error while creating your exam session. Please try again shortly.",
    );
  });

  it("falls back to default message for unrecognized errors", async () => {
    const response = new Response("Bad Gateway", { status: 502 });
    const message = await parseSessionCreationError(response);
    expect(message).toBe(
      "The server encountered an error while creating your exam session. Please try again shortly.",
    );
  });
});
