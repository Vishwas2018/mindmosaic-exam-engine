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
    await page.close();
  }
});

test("admin renders every corrected release item with current governance and historical findings labelled", async ({
  contextAs,
}) => {
  test.setTimeout(120_000);
  const page = await (await contextAs("admin")).newPage();
  await page.goto("/admin/review");
  await expect(page.getByText("160 drafts match your filters")).toBeVisible();
  for (const [bucket, count] of [
    ["ready_for_review", 45],
    ["requires_revision_or_decision", 35],
    ["awaiting_external_evidence", 80],
  ] as const) {
    await page
      .getByRole("combobox", { name: "Review status", exact: true })
      .selectOption(`release:${bucket}`);
    await expect(
      page.getByText(`${count} drafts match your filters`),
    ).toBeVisible();
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
      page.getByText(question.prompt, { exact: true }),
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
    page.getByText(
      /Superseded content: these findings do not describe the current revision/,
    ),
  ).toBeVisible();
  await page.getByText("Content revision", { exact: true }).click();
  await expect(
    page.getByText(identities.sourceRevision, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(identities.questions["scholarship-y6-rc-025"].contentHash, {
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
      /\/api\/(exam|assessment|student)\//.test(request.url())
    )
      studentWrites.push(request.url());
  });
  await page.goto("/admin/review");
  await expect(
    page.getByText("Scholarship: 160 draft questions across four sections."),
  ).toBeVisible();
  await expect(page.getByText("160 drafts match your filters")).toBeVisible();
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
    await expect(
      page.getByText(`${count} drafts match your filters`),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Complete draft papers" }).click();
  await page
    .getByLabel("Draft section paper")
    .selectOption({ label: "scholarship y6 reading" });
  await expect(
    page.getByText(/Complete source packet: 35 questions/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The Estuary Watchers" }),
  ).toBeVisible();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.getByRole("button", { name: "Submit draft paper" }).click();
  await expect(page.getByText(/Preview total: 1 \/ 35 marks/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Worked explanation" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Preview responses|No student progress was recorded/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Record my explicit approval" }),
  ).toBeDisabled();
  expect(studentWrites).toEqual([]);
});
