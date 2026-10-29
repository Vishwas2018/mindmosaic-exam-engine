import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { setViewport, visitAndStabilize } from "./helpers/screen-helpers";

const CONSOLE_URL = "/dev/review-console";

test.describe("review console keyboard workflow (dev only)", () => {
  test("full keyboard pass through fixture batch with pinned stimulus and CSV export", async ({ page }) => {
    await setViewport(page, { name: "desktop", width: 1400, height: 900 });
    await visitAndStabilize(page, CONSOLE_URL, { readyLocator: "[data-testid='batch-select']" });

    // Switch to fixture batch
    await page.getByTestId("batch-select").selectOption("fixture-year3");
    await expect(page.getByTestId("question-viewer")).toBeVisible();

    // 1. First Item: Reading question 1
    await expect(page.getByText("Item 1 of 4")).toBeVisible();
    await expect(page.getByText("fixture-y3-reading-01-q1")).toBeVisible();

    // Pinned stimulus is rendered
    const stimulusCard = page.getByTestId("pinned-stimulus-card");
    await expect(stimulusCard).toBeVisible();
    await expect(stimulusCard).toContainText("The borrowed cart");
    await expect(stimulusCard).toContainText("Luca and Fern had to move books");

    // Key option is highlighted
    await expect(page.getByTestId("option-a")).toHaveAttribute("data-is-key", "true");
    await expect(page.getByTestId("option-a")).toContainText("KEY");

    // Press 'a' to approve Item 1
    await page.keyboard.press("a");
    await expect(page.getByTestId("current-decision-badge")).toHaveText("approve");
    await expect(page.getByTestId("counter-approved")).toContainText("1 Approved");

    // 2. Navigate to Item 2 using 'n'
    await page.keyboard.press("n");
    await expect(page.getByText("Item 2 of 4")).toBeVisible();
    await expect(page.getByText("fixture-y3-reading-01-q2")).toBeVisible();

    // Pinned stimulus stays pinned and visible without reloading
    await expect(stimulusCard).toBeVisible();
    await expect(stimulusCard).toContainText("The borrowed cart");

    // Key option for Q2 is d
    await expect(page.getByTestId("option-d")).toHaveAttribute("data-is-key", "true");

    // Press 'r' to reject Item 2
    await page.keyboard.press("r");
    await expect(page.getByTestId("current-decision-badge")).toHaveText("reject");
    await expect(page.getByTestId("counter-rejected")).toContainText("1 Rejected");

    // Focus note field using 'e' and type notes without clicking mouse
    await page.keyboard.press("e");
    await expect(page.getByTestId("input-notes")).toBeFocused();
    await page.keyboard.type("Ambiguous distractor needs rephrasing.");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("input-notes")).not.toBeFocused();

    // 3. Navigate to Item 3 using 'n'
    await page.keyboard.press("n");
    await expect(page.getByText("Item 3 of 4")).toBeVisible();

    // Press 'v' for revision
    await page.keyboard.press("v");
    await expect(page.getByTestId("current-decision-badge")).toHaveText("revise");
    await expect(page.getByTestId("counter-revised")).toContainText("1 Revision");

    // 4. Navigate to Item 4 (Spelling item) using 'n'
    await page.keyboard.press("n");
    await expect(page.getByText("Item 4 of 4")).toBeVisible();
    await expect(page.getByText("fixture-y3-spelling-001")).toBeVisible();

    // Item 4 has no passage stimulus: verify placeholder
    await expect(page.getByTestId("no-passage-placeholder")).toBeVisible();
    await expect(page.getByTestId("no-passage-placeholder")).toContainText("No Passage Attached");

    // Leave Item 4 undecided (blank)
    await expect(page.getByTestId("current-decision-badge")).toContainText("Undecided");
    await expect(page.getByTestId("counter-undecided")).toContainText("1 Undecided");

    // 5. Open Batch Summary view with 's'
    await page.keyboard.press("s");
    const summaryModal = page.getByTestId("batch-summary-modal");
    await expect(summaryModal).toBeVisible();
    await expect(summaryModal).toContainText("Pre-Review Briefing");
    await expect(summaryModal).toContainText("Answer-Position Distribution");
    await expect(summaryModal).toContainText("Reviewer Attention Guide");

    // Close summary with 's'
    await page.keyboard.press("s");
    await expect(summaryModal).toBeHidden();

    // 6. Export CSV using 'x'
    await page.keyboard.press("x");
    const exportModal = page.getByTestId("export-success-modal");
    await expect(exportModal).toBeVisible();
    await expect(exportModal).toContainText("CSV Successfully Exported");
    await expect(exportModal).toContainText("1 approved, 1 rejected, 1 revised, 1 undecided (blank)");
    await expect(exportModal).toContainText("npm run content:record-approvals");

    // Close export modal
    await page.getByTestId("btn-close-export-modal").click();
    await expect(exportModal).toBeHidden();
  });
});

async function statusFromFreshProductionServer(
  portOffset: number,
  environment: Record<string, string | undefined>,
  urlPath: string,
): Promise<{ status: number; body: string }> {
  const basePort = Number(process.env.PW_PORT) || 3100;
  const port = basePort + portOffset;
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const env = { ...process.env, NODE_ENV: "production", ...environment } as NodeJS.ProcessEnv;
  for (const key of Object.keys(environment)) if (environment[key] === undefined) delete env[key];
  delete env.SHOWCASE_ENABLED;

  const server: ChildProcess = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      env,
      stdio: "ignore",
    },
  );
  try {
    const url = `http://127.0.0.1:${port}${urlPath}`;
    let status = 0;
    for (let attempt = 0; attempt < 60 && status === 0; attempt += 1) {
      try {
        status = (await fetch(url)).status;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return { status, body: await (await fetch(url)).text() };
  } finally {
    server.kill();
  }
}

test.describe("review console production 404 gate", () => {
  test("production build returns 404 without the flag", async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    const env = { REVIEW_CONSOLE_ENABLED: undefined, VERCEL_ENV: undefined };
    const { status, body } = await statusFromFreshProductionServer(46, env, CONSOLE_URL);
    expect(status).toBe(404);
    expect(body).not.toContain("REVIEW CONSOLE");
    expect(body).not.toContain("Pre-Review Briefing");
  });

  test("production build returns 404 when VERCEL_ENV=production even with flag", async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    const env = { REVIEW_CONSOLE_ENABLED: "1", VERCEL_ENV: "production" };
    const { status, body } = await statusFromFreshProductionServer(47, env, CONSOLE_URL);
    expect(status).toBe(404);
    expect(body).not.toContain("REVIEW CONSOLE");
  });

  test("control: with REVIEW_CONSOLE_ENABLED=1 and non-production VERCEL_ENV the console is reachable", async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    const { status, body } = await statusFromFreshProductionServer(
      48,
      { REVIEW_CONSOLE_ENABLED: "1", VERCEL_ENV: "preview" },
      CONSOLE_URL,
    );
    expect(status).toBe(200);
    expect(body.length).toBeGreaterThan(0);
  });
});
