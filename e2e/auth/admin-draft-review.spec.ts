import { test, expect } from "../fixtures/auth.fixture";
import { readFileSync } from "node:fs";
import identities from "../../src/features/admin-review/release-identities.json";

test("Scholarship review is denied to guests and non-admin roles", async ({
  contextAs,
}) => {
  for (const key of [
    "unauthenticated",
    "student-no-attempts",
    "parent-no-children",
    "teacher-no-students",
  ] as const) {
    const page = await (await contextAs(key)).newPage();
    await page.goto("/admin/review");
    await expect(page).not.toHaveURL(/\/admin\/review$/);
    await expect(page.getByText("SOLAR is to SUN as LUNAR is to:")).toHaveCount(
      0,
    );
    await expect(
      page.getByText("THERMOMETER is to TEMPERATURE as ODOMETER is to:", { exact: true }),
    ).toHaveCount(0);
    await page.close();
  }
});

test("admin renders every corrected release item with current governance and historical findings labelled", async ({
  contextAs,
}) => {
  test.setTimeout(120_000);
  const page = await (await contextAs("admin")).newPage();
  await page.goto("/admin/review");
  // Next streaming can retain a hidden server copy outside the active main.
  // Role locators keep assertions on the accessible review without ignoring duplicates.
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("160 drafts match your filters");
  for (const [bucket, count] of [
    ["ready_for_review", 45],
    ["requires_revision_or_decision", 35],
    ["awaiting_external_evidence", 80],
  ] as const) {
    await page
      .getByRole("combobox", { name: "Review status", exact: true })
      .selectOption(`release:${bucket}`);
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("status")).toHaveText(
      `${count} drafts match your filters`,
    );
  }
  await page
    .getByRole("combobox", { name: "Review status", exact: true })
    .selectOption("");
  const revised = JSON.parse(
    readFileSync(
      "docs/reviews/scholarship-2026-10-18/revised-in-this-release.json",
      "utf8",
    ),
  ) as string[];
  const questions = Object.keys(identities.packets).flatMap(
    (file) =>
      JSON.parse(readFileSync(`content/scholarship-drafts/${file}`, "utf8"))
        .questions,
  ) as Array<{
    id: string;
    prompt: string;
    options: Array<{ text: string }>;
    stimulus?: { body: string };
  }>;
  for (const id of revised) {
    const question = questions.find((item) => item.id === id)!;
    await page
      .getByRole("combobox", { name: "Question", exact: true })
      .selectOption(id);
    await expect(
      page.getByRole("main").getByText(question.prompt, { exact: true }),
    ).toBeVisible();
    for (const option of question.options)
      await expect(
        page.getByRole("radio", { name: option.text, exact: true }),
      ).toBeVisible();
    if (question.stimulus)
      await expect(
        page.getByRole("article").locator("section p").first(),
      ).toHaveText(question.stimulus.body);
  }
  await page
    .getByRole("combobox", { name: "Question", exact: true })
    .selectOption("scholarship-y6-rc-025");
  await expect(
    page.getByRole("main").getByText(
      /Superseded content: these findings do not describe the current revision/,
    ),
  ).toBeVisible();
  await page.getByRole("main").getByText("Content revision", { exact: true }).click();
  await expect(
    page.getByRole("main").getByText(identities.sourceRevision, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText(identities.questions["scholarship-y6-rc-025"].contentHash, {
      exact: true,
    }),
  ).toBeVisible();
});

test("admin can browse all 160 drafts and try a complete Reading paper without student API writes", async ({
  contextAs,
}, testInfo) => {
  const page = await (await contextAs("admin")).newPage();
  const studentWrites: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() !== "GET" &&
      (/\/api\/(exam|assessment|student)\//.test(request.url()) || /\/admin\/review/.test(request.url()))
    )
      studentWrites.push(request.url());
  });
  await page.goto("/admin/review");
  await expect(
    page.getByRole("main").getByText("Scholarship: 160 draft questions across four sections."),
  ).toBeVisible();
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("160 drafts match your filters");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: testInfo.outputPath("review-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: testInfo.outputPath("review-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [section, count] of [
    ["verbal_reasoning", 45],
    ["numerical_reasoning", 40],
    ["reading", 35],
    ["numeracy", 40],
  ] as const) {
    await page
      .getByRole("combobox", { name: "Section", exact: true })
      .selectOption(section);
    await expect(page.getByRole("status")).toBeVisible();
    await expect(page.getByRole("status")).toHaveText(
      `${count} drafts match your filters`,
    );
  }
  await page.getByRole("button", { name: "Complete draft papers" }).click();
  await page
    .getByLabel("Draft section paper")
    .selectOption({ label: "scholarship y6 reading" });
  await expect(
    page.getByRole("main").getByText(/Complete source packet: 35 questions/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Estuary Watchers" }),
  ).toBeVisible();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.getByRole("button", { name: "Submit draft paper" }).click();
  await expect(page.getByRole("main").getByText(/Preview total: 1 \/ 35 marks/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Worked explanation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText(/Preview responses|No student progress was recorded/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record my explicit approval" }),
  ).toBeDisabled();
  expect(studentWrites).toEqual([]);
});

test("admin can preview the 12-question sample with start, navigation, shared passage, submission, scoring, explanations, and verify full papers unavailable", async ({
  contextAs,
}) => {
  const page = await (await contextAs("admin")).newPage();
  const studentWrites: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() !== "GET" &&
      /\/api\/(exam|assessment|student)\//.test(request.url())
    )
      studentWrites.push(request.url());
  });

  // Verify full papers remain unavailable
  for (const paperId of [
    "scholarship-y6-comprehensive-sample-module",
    "scholarship-y6-verbal-reasoning-full",
    "scholarship-y6-numerical-reasoning-full",
    "scholarship-y6-reading-full",
    "scholarship-y6-mathematics-full",
  ]) {
    await page.goto(`/exams/${paperId}`);
    await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();
    await expect(
      page.getByText("We do not have enough reviewed questions for this paper yet."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Start paper" })).toHaveCount(0);
  }

  // Open admin review
  await page.goto("/admin/review");
  await page.getByRole("button", { name: "Complete draft papers" }).click();
  await page
    .getByLabel("Draft section paper")
    .selectOption("sample-12");

  await expect(
    page.getByRole("main").getByText(/Year 6 Comprehensive Sample practice module: 12 questions/),
  ).toBeVisible();

  // 1. Start: Q1 (scholarship-y6-vr-001)
  await expect(page.getByText("1 of 12: scholarship-y6-vr-001")).toBeVisible();
  await page.getByRole("radio", { name: "DISTANCE" }).check();

  // 2. Navigation: Next and Previous
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("2 of 12: scholarship-y6-vr-016")).toBeVisible();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByRole("radio", { name: "DISTANCE" })).toBeChecked();

  // 3. Navigation to RC Q7 (scholarship-y6-rc-001) and shared passage "The Estuary Watchers"
  await page.getByLabel("Paper question").selectOption("6");
  await expect(page.getByText("7 of 12: scholarship-y6-rc-001")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Estuary Watchers" })).toBeVisible();
  await page.getByRole("radio", { name: "To set a quiet, patient mood as the two characters wait" }).check();

  const readingPacket = JSON.parse(readFileSync("content/scholarship-drafts/scholarship-y6-reading-draft.json", "utf8"));
  for (const index of [6, 7, 8]) {
    await page.getByLabel("Paper question").selectOption(String(index));
    await expect(page.getByRole("article").locator("section p").first()).toHaveText(readingPacket.questions[index - 6].stimulus.body);
  }
  await page.getByLabel("Paper question").selectOption("10");
  await expect(page.getByRole("radio", { name: "$108", exact: true })).toBeVisible();
  await expect(page.getByRole("article")).toContainText("$160");

  // 4. Submission
  await page.getByRole("button", { name: "Submit draft paper" }).click();

  // 5. Scoring
  await expect(page.getByRole("main").getByText(/Preview total: 2 \/ 12 marks/)).toBeVisible();
  await expect(page.getByRole("main").getByText(/No student progress was recorded/)).toBeVisible();
  await expect(page.getByRole("main").getByText("25% off $160 reduces the price to 160 * 0.75 = $120. A further 10% off $120 is 120 * 0.90 = $108.", { exact: true })).toBeVisible();

  // 6. Explanations
  await expect(page.getByRole("heading", { name: "Worked explanation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Declared answer" })).toBeVisible();

  // 7. Approvals still absent
  await expect(
    page.getByRole("button", { name: "Record my explicit approval" }),
  ).toBeDisabled();
  expect(studentWrites).toEqual([]);
});
