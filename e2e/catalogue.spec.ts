import { expect, test } from "@playwright/test";

test.describe("practice catalogue", () => {
  test("guest can browse the catalogue: live cards are links, coming-soon cards are not", async ({
    page,
  }) => {
    await page.goto("/practice");

    /* Every live program renders as a real, focusable link — the scoped
       programs through PracticeProgramCard, and the unscoped configurator
       through BuildYourOwnCard's own CTA. */
    for (const name of ["NAPLAN-style Numeracy — Grade 3"]) {
      const card = page.getByRole("link", { name: new RegExp(name) });
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute("href", /^\/practice\//);
    }
    await expect(page.getByTestId("build-your-own-cta")).toHaveAttribute(
      "href",
      "/practice/mixed-practice",
    );

    /* Every planned program is visible as text but is not a link, not a
       button, and carries no href a keyboard/AT user could activate.
       "SAT Prep" is deliberately absent from this list: US college-entrance
       prep was removed from an Australian primary catalogue. */
    for (const name of [
      "Australian Maths Competition",
      "Maths Olympiad",
      "Singapore Maths",
    ]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name })).toHaveCount(0);
      await expect(page.getByRole("button", { name })).toHaveCount(0);
    }
    await expect(page.getByRole("heading", { name: "Planned programs" })).toBeVisible();
  });

  test("opening a scoped live program pins its dimensions and reaches a real exam session", async ({
    page,
  }) => {
    await page.goto("/practice");
    await page.getByRole("link", { name: /NAPLAN-style Numeracy — Grade 3/ }).click();
    await expect(page).toHaveURL("/practice/naplan-g3-numeracy");

    /* Scope card queries to the visible copy: the configurator uses
       useSearchParams(), so React streams it out-of-band into a hidden
       <div hidden> at body end and relocates it into #main-content. In
       that transient window getByTestId (which matches hidden nodes)
       sees two copies. Scoping to #main-content excludes the hidden one. */
    const config = page.locator("#main-content");

    await expect(
      page.getByRole("heading", { level: 1, name: "NAPLAN-style Numeracy — Grade 3" }),
    ).toBeVisible();

    /* The three identity dimensions are pre-selected and locked; the
       program is real content, not an empty promise. */
    await expect(config.getByTestId("select-year-level")).toHaveValue("3");
    await expect(config.getByTestId("select-year-level")).toBeDisabled();
    await expect(config.getByTestId("select-exam-style")).toHaveValue("naplan_style");
    await expect(config.getByTestId("select-exam-style")).toBeDisabled();
    await expect(config.getByTestId("select-subject")).toHaveValue("numeracy");
    await expect(config.getByTestId("select-subject")).toBeDisabled();
    await expect(config.getByTestId("eligible-count")).not.toContainText("0 matching");

    /* Question count, timing and the extended-bank toggle stay editable —
       pre-scoping only pins identity, not every preference. */
    await expect(config.getByTestId("select-question-count")).toBeEnabled();
    await expect(config.getByTestId("select-timing")).toBeEnabled();
    await expect(config.getByTestId("toggle-practice")).toBeVisible();

    await config.getByTestId("start-exam").click();

    // Setup sheet -> standard instructions page -> the exam itself.

    await page.getByTestId("begin-exam").click();
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
    const config = page.locator("#main-content");
    await expect(config.getByTestId("toggle-practice").locator("input")).toBeChecked();
    await expect(config.getByTestId("eligible-count")).not.toContainText("0 matching");
    await expect(config.getByTestId("start-exam")).toBeEnabled();
  });

  test("the generic Mixed practice program renders the configurator fully unscoped", async ({
    page,
  }) => {
    await page.goto("/practice/mixed-practice");
    const config = page.locator("#main-content");
    for (const testId of ["select-year-level", "select-exam-style", "select-subject"]) {
      await expect(config.getByTestId(testId)).toBeEnabled();
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
