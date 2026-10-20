/**
 * Maps /api/exam/session API response errors into user-facing, accurate messages.
 * Replaces generic "Check your connection and try again" errors with precise,
 * role-aware and cause-specific explanations.
 */
export async function parseSessionCreationError(
  response: Response,
  fallbackMessage = "We couldn't start this exam just now. Please try again.",
): Promise<string> {
  let errorData: { error?: string; message?: string } | null = null;
  try {
    errorData = (await response.json()) as { error?: string; message?: string };
  } catch {
    // Non-JSON response body
  }

  const errorCode = errorData?.error;

  if (errorCode === "students_only" || response.status === 403) {
    return "Exam sessions are only available to student accounts. Please sign in with a student account to start this exam.";
  }

  if (errorCode === "unauthenticated" || response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (errorCode === "insufficient_questions") {
    return "Not enough reviewed questions are currently available for this paper.";
  }

  if (errorCode === "pattern_deferred") {
    return "This paper is not yet available to sit.";
  }

  if (errorCode === "scholarship_requires_paper") {
    return "Scholarship questions must be sat as a complete paper.";
  }

  if (errorCode === "idempotency_key_reused" || response.status === 409) {
    return "This exam session was already started. Please refresh the page.";
  }

  if (errorCode === "invalid_bank") {
    return errorData?.message ?? "The selected question bank is not available for exam sessions.";
  }

  if (errorCode === "not_configured" || response.status === 503) {
    return "Exam services are temporarily unavailable. Please try again shortly.";
  }

  if (response.status >= 500) {
    return "The server encountered an error while creating your exam session. Please try again shortly.";
  }

  return errorData?.message ?? fallbackMessage;
}
