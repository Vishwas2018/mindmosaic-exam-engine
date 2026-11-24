import { expect, test } from "@playwright/test";

/*
 * Whether a paid tier can take a payment is decided at RUNTIME by purchasablePlans()
 * (src/lib/stripe/config.ts): Stripe configured AND both cadence price ids set. These specs
 * assert what a visitor can actually do in whichever state the server process was started in,
 * so they hold in CI (placeholder Stripe key, no price ids: nothing for sale) and against a
 * fully configured sandbox (both tiers purchasable).
 */

/** The paid calls to action. */
const PAID_CTA_LABELS = ["Subscribe to Individual", "Subscribe to Family", "Choose the yearly plan"];

/*
 * /billing renders one of two views depending on whether the server process was
 * started with a Stripe secret key (src/lib/stripe/config.ts: isStripeConfigured).
 * CI supplies placeholder Stripe values, a bare local checkout supplies none, and
 * the Playwright webServer inherits this process's environment, so the spec
 * derives the expected view from the same rule instead of assuming one.
 * Both views are covered at component level in src/tests/pages/billing-page-beta.test.tsx.
 */
const stripeConfigured = (process.env.STRIPE_SECRET_KEY ?? "").trim().length > 0;
const has = (name: string) => (process.env[name] ?? "").trim().length > 0;
/* Mirrors purchasablePlans(): a tier is for sale only when Stripe is configured and BOTH its cadence prices are set. */
const tier = {
  individual: stripeConfigured && has("STRIPE_PRICE_INDIVIDUAL_MONTHLY") && has("STRIPE_PRICE_INDIVIDUAL_ANNUAL"),
  family: stripeConfigured && has("STRIPE_PRICE_FAMILY_MONTHLY") && has("STRIPE_PRICE_FAMILY_ANNUAL"),
};
const anyPurchasable = tier.individual || tier.family;

test.describe(stripeConfigured ? "billing page (Stripe configured)" : "billing page with payments disabled", () => {
  test("offers exactly the tiers this deployment can sell", async ({ page }) => {
    await page.goto("/billing", { waitUntil: "domcontentloaded" });

    if (!stripeConfigured) {
      const notice = page.getByTestId("billing-free-beta");
      await expect(notice.getByRole("heading", { level: 1, name: "The family beta is free" })).toBeVisible();
      await expect(notice).toContainText("There is nothing to pay during the beta");
      await expect(notice.getByRole("link", { name: "Back to your family" })).toHaveAttribute("href", "/parent");
      await expect(page.getByRole("radiogroup", { name: "Billing cycle" })).toHaveCount(0);
      return;
    }

    await expect(page.getByRole("heading", { level: 1, name: "Pick the plan that fits your family" })).toBeVisible();
    await expect(page.locator("input[autocomplete='cc-number']")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Subscribe to Individual" })).toHaveCount(tier.individual ? 1 : 0);
    await expect(page.getByRole("button", { name: "Subscribe to Family" })).toHaveCount(tier.family ? 1 : 0);
    if (!tier.individual || !tier.family) {
      const registerInterest = page.getByRole("link", { name: "Register interest" });
      await expect(registerInterest.first()).toBeVisible();
      await expect(registerInterest.first()).toHaveAttribute("href", "/help#contact");
    }
  });
});

test.describe("no unconfigured checkout is reachable from any public surface", () => {
  for (const path of ["/", "/pricing", "/billing"]) {
    test(`${path} offers no checkout call to action unless prices are configured`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("input[autocomplete='cc-number']")).toHaveCount(0);
      if (anyPurchasable) return;

      for (const label of PAID_CTA_LABELS) {
        await expect(page.getByRole("button", { name: label })).toHaveCount(0);
        await expect(page.getByRole("link", { name: label })).toHaveCount(0);
      }
      const registerInterest = page.getByRole("link", { name: "Register interest" });
      for (let i = 0; i < (await registerInterest.count()); i += 1) {
        await expect(registerInterest.nth(i)).toHaveAttribute("href", "/help#contact");
      }
    });
  }
});
