import type { Page } from "@playwright/test";
import { getExamPattern, patternExamConfig, sessionDurationSeconds } from "@/features/exam-engine/exam-patterns";
import { buildExamResult } from "@/features/exam-engine/scoring/exam-report";
import { toCandidateQuestions, type AuthoringQuestion } from "@/features/exam-engine/types";

export async function stubGuestSession(page: Page, bank: readonly AuthoringQuestion[]) {
  let startedAt = 0;
  let selected = bank;
  await page.route("**/api/exam/guest-session", async (route) => {
    const method = route.request().method();
    const body = route.request().postDataJSON();
    if (method === "POST") {
      const selection = body.selection;
      const pattern = selection.patternId ? getExamPattern(selection.patternId) : undefined;
      const config = pattern
        ? patternExamConfig(pattern, bank.length, !!selection.asPracticeModule, body.confidenceMode)
        : selection.config;
      selected = typeof config.questionCount === "number" ? bank.slice(0, config.questionCount) : bank;
      startedAt = Date.now();
      await route.fulfill({ status: 201, json: {
        sessionId: "synthetic-guest-exam",
        ticket: "synthetic-guest-ticket",
        startedAt,
        bankId: selection.bankId ?? "published",
        durationSeconds: sessionDurationSeconds(config, selected),
        config,
        questions: toCandidateQuestions(selected),
      } });
      return;
    }
    if (method === "PATCH") {
      const item = selected.find((question) => question.id === body.questionId);
      await route.fulfill({ json: { explanation: item?.explanation ?? null } });
      return;
    }
    await route.fulfill({ json: {
      result: buildExamResult(selected, body.responses, {
        startedAt, submittedAt: Date.now(), submissionReason: "user_submitted",
      }),
      reviewQuestions: selected,
    } });
  });
}
