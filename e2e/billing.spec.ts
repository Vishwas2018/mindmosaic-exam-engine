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

test.describe("billing page (Family plan on roadmap)", () => {
  test("shows the coming-soon card with no price and no checkout button", async ({ page }) => {
    await page.goto("/billing");
    await expect(
      page.getByRole("heading", { level: 1, name: "Choose the Family plan" }),
    ).toBeVisible();

    /* The roadmap card replaces FamilyPlanCard's price block, billing-cycle
       toggle and Subscribe button outright. Matched as a regex because the
       plan name is a separate JSX expression, so the sentence spans two
       text nodes and an exact string match resolves to nothing. */
    await expect(page.getByText(/isn't open for subscriptions yet/)).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Billing cycle" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Subscribe to Family" })).toHaveCount(0);

    /* The one action offered instead goes somewhere real. */
    const registerInterest = page.getByRole("link", { name: "Register interest" });
    await expect(registerInterest).toBeVisible();
    await expect(registerInterest).toHaveAttribute("href", "/contact");
  });

  test("the comparison table labels Family as coming soon and keeps the placeholder disclaimer", async ({
    page,
  }) => {
    await page.goto("/billing");
    /* PlanComparisonTable still quotes an indicative price — that is fine
       without a purchase path, but it must say so and must keep carrying
       the "not yet linked to a live Stripe price" disclaimer. */
    await expect(page.getByText("Coming soon").first()).toBeVisible();
    await expect(
      page
        .getByText(
          "GST-inclusive AUD — pricing subject to change. Placeholder amounts, not yet linked to a live Stripe price.",
        )
        .first(),
    ).toBeVisible();
  });
});

test.describe("no paid checkout is reachable from any public surface", () => {
  for (const path of ["/", "/pricing", "/billing"]) {
    test(`${path} offers no checkout call to action`, async ({ page }) => {
      await page.goto(path);

      for (const label of PAID_CTA_LABELS) {
        await expect(page.getByRole("button", { name: label })).toHaveCount(0);
        await expect(page.getByRole("link", { name: label })).toHaveCount(0);
      }

      /* Whatever a paid plan card does offer must lead to /contact, never
         to the checkout page. `paidCta` renders "Register interest" for
         both cards while availability is "roadmap". */
      const registerInterest = page.getByRole("link", { name: "Register interest" });
      for (let i = 0; i < (await registerInterest.count()); i += 1) {
        await expect(registerInterest.nth(i)).toHaveAttribute("href", "/contact");
      }
    });
  }
});
