import { expect, test } from "@playwright/test";

test.describe("billing page", () => {
  test("placeholder pricing banner is visible and the monthly/annual toggle switches the displayed price", async ({
    page,
  }) => {
    await page.goto("/billing");
    await expect(
      page.getByRole("heading", { level: 1, name: "Choose the Family plan" }),
    ).toBeVisible();

    /* Placeholder-pricing disclaimer: not yet linked to a real Stripe price. */
    await expect(
      page.getByText(
        "GST-inclusive AUD — pricing subject to change. Placeholder amounts, not yet linked to a live Stripe price.",
      ),
    ).toBeVisible();

    const cycleGroup = page.getByRole("radiogroup", { name: "Billing cycle" });
    const monthly = cycleGroup.getByRole("radio", { name: "Monthly" });
    const annual = cycleGroup.getByRole("radio", { name: "Annual" });

    await expect(monthly).toHaveAttribute("aria-checked", "true");
    await expect(annual).toHaveAttribute("aria-checked", "false");
    await expect(page.getByText("A$14.99")).toBeVisible();
    await expect(page.getByText("/mo")).toBeVisible();

    await annual.click();
    await expect(annual).toHaveAttribute("aria-checked", "true");
    await expect(monthly).toHaveAttribute("aria-checked", "false");
    await expect(page.getByText("A$149")).toBeVisible();
    await expect(page.getByText("/yr")).toBeVisible();
  });

  test("Subscribe shows the graceful 'not available yet' error for a guest", async ({ page }) => {
    /* Guests are never authenticated, so /api/stripe/checkout always
       returns a non-OK response here (401 unauthenticated at minimum,
       503 not_configured if Stripe/Supabase aren't wired up either) — the
       client only checks response.ok, so this exercises the same graceful
       failure path regardless of which non-OK status fires. */
    await page.goto("/billing");
    await page.getByRole("button", { name: "Subscribe to Family" }).click();
    /* Next's own route announcer (#__next-route-announcer__) also carries
       role="alert", so scope past it to the error message's own text. */
    await expect(
      page.getByText("Checkout isn't available yet. Please try again soon."),
    ).toBeVisible();
  });
});
