import {test, expect} from "../fixtures/auth.fixture";
import {type BrowserContext, type Page} from "@playwright/test";

// Correct answers taken from the server's pilot fixture answer keys. These are
// used only to drive a "correct" submission through the server; the test never
// reads them from the client (that would defeat the purpose).
// Question 2 for each year:
const CORRECT_Q2_BY_YEAR: Record<3 | 5, number> = {
  3: 12, // pilot-y3-comparison-01: 27 - 15 = 12
  5: 45, // pilot-y5-before-after-01: start = 31 + 14 = 45
};

const WRONG_ANSWER = 99999;

type ContextAs = (key: string) => Promise<BrowserContext>;

/*
 * Answers are recorded durably, one immutable submission per question per attempt, and the same fixture
 * account is reused by every test below. Each test therefore starts its own fresh attempt (the explicit
 * "new attempt" the product offers) so it does not inherit another test's answers.
 */
async function startFreshAttempt(context: BrowserContext, year: 3 | 5) {
  const response = await context.request.delete(`/api/practice/singapore-maths/sample/session?year=${year}`);
  expect(response.ok()).toBe(true);
}

async function openSampleYear(contextAs: ContextAs, year: 3 | 5) {
  const context = await contextAs("student-no-attempts");
  await startFreshAttempt(context, year);
  const page = await context.newPage();
  await page.goto(`/practice/singapore-maths/sample?year=${year}`);
  await expect(
    page.getByRole("heading", {name: `Year ${year} · Question 1 of 15`}),
  ).toBeVisible();
  return page;
}

async function submitAnswer(page: Page, answer: number) {
  await page.getByLabel(/Your answer/).fill(String(answer));
  await page.getByRole("button", {name: "Submit answer"}).click();
}

function statusText(answer: number, correct: boolean): RegExp {
  return new RegExp(
    `Your answer: ${answer} .* ${correct ? "Correct\\." : "Not quite\\."}`,
  );
}

test.describe("Singapore Maths sample practice", () => {
  for (const viewport of [
    {name: "desktop 1280×720", width: 1280, height: 720},
    {name: "mobile 320×568", width: 320, height: 568},
  ]) {
    test.describe(viewport.name, () => {
      test.use({viewport: {width: viewport.width, height: viewport.height}});

      for (const year of [3, 5] as const) {
        test(`authenticated student: ${year} — wrong then correct answer, explanation only after correct, navigation preserves status, summary scoring`, async ({
          contextAs,
        }) => {
          const page = await openSampleYear(contextAs as ContextAs, year);

          // Landing shows 15 questions for this year.
          await expect(
            page.getByRole("heading", {name: `Year ${year} · Question 1 of 15`}),
          ).toBeVisible();

          // Q1: wrong answer → incorrect, no explanation button.
          await submitAnswer(page, WRONG_ANSWER);
          await expect(page.getByText(statusText(WRONG_ANSWER, false))).toBeVisible();
          await expect(
            page.getByRole("button", {name: "Show explanation"}),
          ).not.toBeVisible();

          // Q2: correct answer → correct, explanation button appears.
          await page.getByRole("button", {name: "Next question"}).click();
          await expect(
            page.getByRole("heading", {name: `Year ${year} · Question 2 of 15`}),
          ).toBeVisible();
          const answer = CORRECT_Q2_BY_YEAR[year];
          await submitAnswer(page, answer);
          await expect(page.getByText(statusText(answer, true))).toBeVisible();
          await expect(
            page.getByRole("button", {name: "Show explanation"}),
          ).toBeVisible();

          // Reveal explanation — server verifies a correct submission exists.
          await page.getByRole("button", {name: "Show explanation"}).click();
          await expect(
            page.getByRole("region", {name: "Worked explanation"}),
          ).toBeVisible();

          // Navigate back to Q1 → incorrect status preserved.
          await page.getByRole("button", {name: "Previous question"}).click();
          await expect(page.getByText(statusText(WRONG_ANSWER, false))).toBeVisible();
          await expect(
            page.getByRole("button", {name: "Show explanation"}),
          ).not.toBeVisible();

          // Navigate forward to Q2 → correct status preserved.
          await page.getByRole("button", {name: "Next question"}).click();
          await expect(page.getByText(statusText(answer, true))).toBeVisible();

          // Finish → summary scoring.
          await page.getByRole("button", {name: "Finish session"}).click();
          await expect(page.getByRole("heading", {name: "Session summary"})).toBeVisible();
          await expect(page.getByText(/1 correct/)).toBeVisible();
          await expect(page.getByText(/1 incorrect/)).toBeVisible();
          await expect(page.getByText(/13 unanswered/)).toBeVisible();

          // Review list preserves Correct/Incorrect per question.
          await expect(page.getByText(/Question 1 · Incorrect/)).toBeVisible();
          await expect(page.getByText(/Question 2 · Correct/)).toBeVisible();
        });
      }

      test(`unauthenticated submission is rejected (${viewport.name})`, async ({
        contextAs,
      }) => {
        const context = await contextAs("unauthenticated");
        const page = await context.newPage();
        await page.goto("/practice/singapore-maths/sample?year=3");
        await expect(
          page.getByRole("heading", {name: "Year 3 · Question 1 of 15"}),
        ).toBeVisible();

        await submitAnswer(page, 42);
        // The server returns 401; the client must not record it as an answer.
        await expect(page.getByText("Could not submit that answer. Try again.")).toBeVisible();
        await expect(
          page.getByRole("button", {name: "Show explanation"}),
        ).not.toBeVisible();
      });
    });
  }
});

test.describe("Singapore Maths sample practice: durable answers", () => {
  test("a refresh keeps every recorded verdict and the explanation, without asking the server to reveal it", async ({contextAs}) => {
    const page = await openSampleYear(contextAs as ContextAs, 3);
    const revealRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/singapore-maths/sample/reveal")) revealRequests.push(request.url());
    });

    await submitAnswer(page, WRONG_ANSWER);
    await expect(page.getByText(statusText(WRONG_ANSWER, false))).toBeVisible();
    await page.getByRole("button", {name: "Next question"}).click();
    const answer = CORRECT_Q2_BY_YEAR[3];
    await submitAnswer(page, answer);
    await expect(page.getByText(statusText(answer, true))).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", {name: "Year 3 · Question 1 of 15"})).toBeVisible();
    await expect(page.getByText(statusText(WRONG_ANSWER, false))).toBeVisible();
    await expect(page.getByRole("button", {name: "Submit answer"})).toHaveCount(0);
    await page.getByRole("button", {name: "Next question"}).click();
    await expect(page.getByText(statusText(answer, true))).toBeVisible();
    await page.getByRole("button", {name: "Show explanation"}).click();
    await expect(page.getByRole("region", {name: "Worked explanation"})).toBeVisible();

    expect(revealRequests).toEqual([]);
  });

  test("a stale tab is shown the recorded answer, never a verdict for the answer it just typed", async ({contextAs}) => {
    const first = await openSampleYear(contextAs as ContextAs, 3);
    const context = first.context();
    const stale = await context.newPage();
    await stale.goto("/practice/singapore-maths/sample?year=3");
    await expect(stale.getByRole("heading", {name: "Year 3 · Question 1 of 15"})).toBeVisible();

    await first.getByRole("button", {name: "Next question"}).click();
    await submitAnswer(first, WRONG_ANSWER);
    await expect(first.getByText(statusText(WRONG_ANSWER, false))).toBeVisible();

    await stale.getByRole("button", {name: "Next question"}).click();
    await expect(stale.getByRole("button", {name: "Submit answer"})).toBeEnabled();
    await submitAnswer(stale, CORRECT_Q2_BY_YEAR[3]);

    await expect(stale.getByText(statusText(WRONG_ANSWER, false))).toBeVisible();
    await expect(stale.getByText(/first answer is the one that counts/i)).toBeVisible();
    await expect(stale.getByRole("button", {name: "Show explanation"})).toHaveCount(0);
  });

  test("starting a new attempt is the only retry and survives a refresh", async ({contextAs}) => {
    const page = await openSampleYear(contextAs as ContextAs, 3);
    await submitAnswer(page, WRONG_ANSWER);
    await expect(page.getByText(statusText(WRONG_ANSWER, false))).toBeVisible();

    await page.getByRole("button", {name: "Finish session"}).click();
    await page.getByRole("button", {name: "Start a new attempt"}).click();
    await expect(page.getByRole("button", {name: "Submit answer"})).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", {name: "Submit answer"})).toBeVisible();
    await expect(page.getByText(statusText(WRONG_ANSWER, false))).toHaveCount(0);
  });
});
