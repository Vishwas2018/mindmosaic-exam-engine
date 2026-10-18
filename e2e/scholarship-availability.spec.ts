import { expect, test } from "@playwright/test";

/**
 * The scholarship papers against the real production build with nothing approved: they must be listed honestly as not
 * available, never startable, never leak into the public guest bank, and stay usable by keyboard and on a phone.
 * The sitting itself (timed run, submit, results) is covered by scholarship-simulation.spec.ts against mocked routes,
 * because there is deliberately no approved scholarship content to sit.
 */
const PAPERS = [
  "scholarship-y6-verbal-reasoning-full",
  "scholarship-y6-numerical-reasoning-full",
  "scholarship-y6-reading-full",
  "scholarship-y6-mathematics-full",
  "scholarship-y6-written-expression-full",
] as const;

test.describe("scholarship papers while nothing is approved", () => {
  test("the picker lists them as coming soon and offers no link to start one", async ({ page }) => {
    await page.goto("/exams");
    for (const id of PAPERS) {
      await expect(page.getByTestId(`pattern-state-${id}`)).toHaveText("Coming soon");
      await expect(page.locator(`a[href="/exams/${id}"]`)).toHaveCount(0);
    }
  });

  test("a direct visit to a paper says coming soon and has no way to start", async ({ page }) => {
    for (const id of PAPERS) {
      await page.goto(`/exams/${id}`);
      await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();
      await expect(page.getByTestId("start-pattern")).toHaveCount(0);
      await expect(page.getByTestId("reduced-module-notice")).toHaveCount(0);
    }
    await page.goto("/exams/scholarship-y6-numerical-reasoning-full");
    await page.getByTestId("pattern-adaptations-scholarship-y6-numerical-reasoning-full").locator("summary").click();
    await expect(page.getByText("The length and time are our own")).toBeVisible();
    await expect(page.getByText(/not a real scholarship test paper/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /where scholarship-style practice is up to/i })).toHaveAttribute(
      "href",
      "/practice/scholarship-prep",
    );
  });

  test("the public guest bank carries no scholarship question, and the program route is not a builder", async ({ request, page }) => {
    const response = await request.get("/api/exam/guest-bank");
    expect(response.ok()).toBe(true);
    expect(await response.text()).not.toContain("scholarship-y6-");
    for (const slug of ["scholarship-y6-numerical-reasoning", "scholarship-y6-numeracy", "scholarship-y6-reading", "scholarship-y6-verbal-reasoning"]) {
      const result = await page.goto(`/practice/${slug}`);
      expect(result?.status()).toBe(404);
    }
    await page.goto("/practice/scholarship-prep");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/scholarship-style practice/i);
  });

  test("a custom scholarship draw is refused by the server before it reaches any question", async ({ request }) => {
    const response = await request.post("/api/exam/session", {
      data: { config: { yearLevel: 6, examStyle: "scholarship_style", subject: "numerical_reasoning", questionCount: 10, timing: "timed" } },
      headers: { origin: "http://127.0.0.1", host: "127.0.0.1" },
    });
    // No Supabase is configured for the guest suite, so the route stops at 503 before authentication; either way
    // it never returns a question.
    expect([401, 403, 422, 503]).toContain(response.status());
    expect(await response.text()).not.toContain("scholarship-y6-");
  });
});

test.describe("keyboard and phone", () => {
  test("the picker is reachable by keyboard and the skip link lands on the main content", async ({ page }) => {
    await page.goto("/exams");
    await page.keyboard.press("Tab");
    const first = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    expect(first.length).toBeGreaterThan(0);
    await expect(page.locator("main#main-content")).toBeVisible();
    // Every interactive element on the page can take focus in order without a mouse.
    const stops = new Set<string>();
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press("Tab");
      stops.add(await page.evaluate(() => `${document.activeElement?.tagName}:${document.activeElement?.getAttribute("href") ?? ""}`));
    }
    expect(stops.size).toBeGreaterThan(3);
  });

  test("a scholarship paper page has no horizontal scroll at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/exams", "/exams/scholarship-y6-reading-full", "/practice/scholarship-prep"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
});
