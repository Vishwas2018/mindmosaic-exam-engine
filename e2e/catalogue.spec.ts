import { expect, test } from "@playwright/test";

test.describe("practice catalogue", () => {
  test("guest can browse the catalogue: live cards are links, coming-soon cards are not", async ({
    page,
  }) => {
    await page.goto("/practice");

    /* Every live program (scoped + the generic "Mixed practice" entry)
       renders as a real, focusable link. */
    for (const name of ["NAPLAN-style Numeracy — Grade 3", "Mixed practice"]) {
      const card = page.getByRole("link", { name: new RegExp(name) });
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute("href", /^\/practice\//);
    }

    /* Every coming-soon program is visible as text but is not a link, not a
       button, and carries no href a keyboard/AT user could activate. */
    for (const name of [
      "Australian Maths Competition",
      "Maths Olympiad",
      "Singapore Maths",
      "SAT Prep",
    ]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name })).toHaveCount(0);
      await expect(page.getByRole("button", { name })).toHaveCount(0);
    }
    await expect(page.getByText("Coming soon").first()).toBeVisible();
  });

  test("opening a scoped live program pins its dimensions and reaches a real exam session", async ({
    page,
  }) => {
    await page.goto("/practice");
    await page.getByRole("link", { name: /NAPLAN-style Numeracy — Grade 3/ }).click();
    await expect(page).toHaveURL("/practice/naplan-g3-numeracy");

    await expect(
      page.getByRole("heading", { level: 1, name: "NAPLAN-style Numeracy — Grade 3" }),
    ).toBeVisible();

    /* The three identity dimensions are pre-selected and locked; the
       program is real content, not an empty promise. */
    await expect(page.getByTestId("select-year-level")).toHaveValue("3");
    await expect(page.getByTestId("select-year-level")).toBeDisabled();
    await expect(page.getByTestId("select-exam-style")).toHaveValue("naplan_style");
    await expect(page.getByTestId("select-exam-style")).toBeDisabled();
    await expect(page.getByTestId("select-subject")).toHaveValue("numeracy");
    await expect(page.getByTestId("select-subject")).toBeDisabled();
    await expect(page.getByTestId("eligible-count")).not.toContainText("0 matching");

    /* Question count, timing and the extended-bank toggle stay editable —
       pre-scoping only pins identity, not every preference. */
    await expect(page.getByTestId("select-question-count")).toBeEnabled();
    await expect(page.getByTestId("select-timing")).toBeEnabled();
    await expect(page.getByTestId("toggle-practice")).toBeVisible();

    await page.getByTestId("start-exam").click();
    await expect(page).toHaveURL(/\/exam/);
    await expect(page.getByRole("heading", { name: /^Question 1 of/ })).toBeVisible();
  });

  test("a program starting from the extended bank pre-selects that toggle", async ({
    page,
  }) => {
    /* icas-g3-reading's curated-bank count is too thin (1 question) to
       clear the smallest fixed count, so catalogue.ts starts it from the
       "practice" bank instead (see catalogue.test.ts). */
    await page.goto("/practice/icas-g3-reading");
    await expect(page.getByTestId("toggle-practice").locator("input")).toBeChecked();
    await expect(page.getByTestId("eligible-count")).not.toContainText("0 matching");
    await expect(page.getByTestId("start-exam")).toBeEnabled();
  });

  test("the generic Mixed practice program renders the configurator fully unscoped", async ({
    page,
  }) => {
    await page.goto("/practice/mixed-practice");
    for (const testId of ["select-year-level", "select-exam-style", "select-subject"]) {
      await expect(page.getByTestId(testId)).toBeEnabled();
    }
  });

  test("an unknown program slug 404s", async ({ page }) => {
    const response = await page.goto("/practice/not-a-real-program");
    expect(response?.status()).toBe(404);
  });

  test("a coming_soon program slug 404s rather than rendering a broken page", async ({
    page,
  }) => {
    const response = await page.goto("/practice/maths-olympiad");
    expect(response?.status()).toBe(404);
  });
});
