import { expect, test } from "@playwright/test";

/*
 * FAMILY_PLAN_AVAILABILITY is "roadmap" (src/lib/billing/prices.ts, audit
 * finding C-02), so no surface may offer a paid checkout: the displayed
 * amounts are still placeholders not linked to a live Stripe price, and the
 * legal pages are unsigned drafts.
 *
 * These specs assert the CONTAINMENT, not the flag — they check what a
 * visitor can actually do. If the flag is flipped back to "purchasable"
 * they should fail, which is the point: re-enabling checkout is a decision
 * that has to come with new copy and new expectations, not a silent revert.
 */

/** The two paid calls to action `content.ts`'s `paidCta` produces. */
const PAID_CTA_LABELS = ["Subscribe to Family", "Choose the yearly plan"];

test.describe("billing page with payments disabled", () => {
  test("shows the free beta and offers no plan, card entry or checkout", async ({ page }) => {
    await page.goto("/billing", { waitUntil: "domcontentloaded" });
    const notice = page.getByTestId("billing-free-beta");
    await expect(notice.getByRole("heading", { level: 1, name: "The family beta is free" })).toBeVisible();
    await expect(notice).toContainText("There is nothing to pay during the beta");
    await expect(notice.getByRole("link", { name: "Back to your family" })).toHaveAttribute("href", "/parent");
    await expect(page.getByRole("heading", { name: "Choose the Family plan" })).toHaveCount(0);
    await expect(page.getByRole("radiogroup", { name: "Billing cycle" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Subscribe to Family" })).toHaveCount(0);
  });
});

test.describe("no paid checkout is reachable from any public surface", () => {
  for (const path of ["/", "/pricing", "/billing"]) {
    test(`${path} offers no checkout call to action`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });

      for (const label of PAID_CTA_LABELS) {
        await expect(page.getByRole("button", { name: label })).toHaveCount(0);
        await expect(page.getByRole("link", { name: label })).toHaveCount(0);
      }

      /* Whatever a paid plan card does offer must lead to /help#contact,
         never to the checkout page. `paidCta` renders "Register interest"
         for both cards while availability is "roadmap". */
      const registerInterest = page.getByRole("link", { name: "Register interest" });
      for (let i = 0; i < (await registerInterest.count()); i += 1) {
        await expect(registerInterest.nth(i)).toHaveAttribute("href", "/help#contact");
      }
    });
  }
});
