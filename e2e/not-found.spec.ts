import { expect, test } from "@playwright/test";

test.describe("branded 404", () => {
  test("a bogus top-level route renders the branded not-found page with a real 404 status", async ({
    page,
  }) => {
    const response = await page.goto("/this-route-does-not-exist-e2e");
    expect(response?.status()).toBe(404);
    /* not-found.tsx sets metadata.title = "Page not found"; the root
       layout's title template ("%s | MindMosaic") wraps it the same way
       it wraps every other non-home page's title. */
    await expect(page).toHaveTitle("Page not found | MindMosaic");

    await expect(page.getByRole("link", { name: "MindMosaic home" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "We can't find that page" })).toBeVisible();
    await expect(
      page.getByText(
        "The page you're looking for doesn't exist or may have moved. Let's get you back on track.",
      ),
    ).toBeVisible();

    const homeLink = page.getByRole("link", { name: "Go home" });
    await expect(homeLink).toHaveAttribute("href", "/");
    const practiceLink = page.getByRole("link", { name: "Go to practice" });
    await expect(practiceLink).toHaveAttribute("href", "/practice");

    await practiceLink.click();
    await expect(page).toHaveURL("/practice");
  });

  test("a bogus program slug under a real route segment falls through to the same branded 404", async ({
    page,
  }) => {
    /* src/app/practice/[program]/page.tsx calls next/navigation's notFound()
       for any slug that isn't a live catalogue program — confirming that
       lands on the same global not-found.tsx, not a dead end or a raw
       framework error page. */
    const response = await page.goto("/practice/this-program-does-not-exist-e2e");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We can't find that page" })).toBeVisible();
  });
});
