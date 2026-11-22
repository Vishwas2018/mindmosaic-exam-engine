/**
 * `npm run stripe:setup` — creates the MindMosaic products and the four
 * recurring AUD prices in YOUR Stripe account, then prints the env lines to
 * paste into .env.local / Vercel.
 *
 *   STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
 *
 * Safe to re-run: prices are found by `lookup_key`, so nothing is created
 * twice. A live key (sk_live_/rk_live_) is refused unless you pass `--live`,
 * so the first run is always against test mode.
 *
 * Amounts come from src/lib/billing/prices.ts — the same constants the
 * /billing page renders — so the page and Stripe cannot drift. Prices are
 * GST-inclusive (`tax_behavior: "inclusive"`).
 *
 * It does NOT create the webhook endpoint (that needs your deployed URL);
 * the next steps it prints say how.
 */
import Stripe from "stripe";

import { FAMILY_PLAN, INDIVIDUAL_PLAN } from "../src/lib/billing/prices";

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error("Set STRIPE_SECRET_KEY (use a TEST key first: sk_test_...).");
  process.exit(1);
}
const isLive = /^(sk|rk)_live_/.test(key);
if (isLive && !process.argv.includes("--live")) {
  console.error("That is a LIVE key. Re-run with --live if you really mean to create live prices.");
  process.exit(1);
}

const stripe = new Stripe(key);

const TIERS = [
  {
    name: "MindMosaic Individual",
    description: "One learner: full question bank, practice exam papers and progress tracking.",
    metadata: { tier: "individual" },
    prices: [
      { env: "STRIPE_PRICE_INDIVIDUAL_MONTHLY", lookup: "mindmosaic_individual_monthly", cents: Math.round(INDIVIDUAL_PLAN.monthly.amount * 100), interval: "month" as const },
      { env: "STRIPE_PRICE_INDIVIDUAL_ANNUAL", lookup: "mindmosaic_individual_annual", cents: Math.round(INDIVIDUAL_PLAN.annual.amount * 100), interval: "year" as const },
    ],
  },
  {
    name: "MindMosaic Family",
    description: `Up to ${FAMILY_PLAN.maxChildren} children on one account, with learning observations and exam history.`,
    metadata: { tier: "family" },
    prices: [
      { env: "STRIPE_PRICE_FAMILY_MONTHLY", lookup: "mindmosaic_family_monthly", cents: Math.round(FAMILY_PLAN.monthly.amount * 100), interval: "month" as const },
      { env: "STRIPE_PRICE_FAMILY_ANNUAL", lookup: "mindmosaic_family_annual", cents: Math.round(FAMILY_PLAN.annual.amount * 100), interval: "year" as const },
    ],
  },
];

async function findOrCreateProduct(tier: (typeof TIERS)[number]): Promise<string> {
  const existing = await stripe.products.search({
    query: `metadata['tier']:'${tier.metadata.tier}' AND active:'true'`,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0].id;
  const created = await stripe.products.create({
    name: tier.name,
    description: tier.description,
    metadata: tier.metadata,
  });
  return created.id;
}

async function main() {
  console.log(`Stripe mode: ${isLive ? "LIVE" : "test"}\n`);
  const lines: string[] = [];

  for (const tier of TIERS) {
    const productId = await findOrCreateProduct(tier);
    for (const price of tier.prices) {
      const found = await stripe.prices.list({ lookup_keys: [price.lookup], active: true, limit: 1 });
      let id = found.data[0]?.id;
      if (id && found.data[0].unit_amount !== price.cents) {
        // An existing price with a different amount: Stripe prices are
        // immutable, so move the lookup key to a fresh price.
        const fresh = await stripe.prices.create({
          product: productId,
          currency: "aud",
          unit_amount: price.cents,
          recurring: { interval: price.interval },
          tax_behavior: "inclusive",
          lookup_key: price.lookup,
          transfer_lookup_key: true,
        });
        id = fresh.id;
        console.log(`updated  ${price.lookup} -> A$${price.cents / 100}`);
      } else if (!id) {
        const created = await stripe.prices.create({
          product: productId,
          currency: "aud",
          unit_amount: price.cents,
          recurring: { interval: price.interval },
          tax_behavior: "inclusive",
          lookup_key: price.lookup,
        });
        id = created.id;
        console.log(`created  ${price.lookup} A$${price.cents / 100}/${price.interval}`);
      } else {
        console.log(`exists   ${price.lookup} A$${price.cents / 100}/${price.interval}`);
      }
      lines.push(`${price.env}=${id}`);
    }
  }

  console.log("\nAdd these to .env.local and your Vercel environment:\n");
  console.log(lines.join("\n"));
  console.log(`
Next steps (Stripe Dashboard):
  1. Developers -> Webhooks -> Add endpoint:  https://<your-domain>/api/stripe/webhook
     Events: checkout.session.completed, customer.subscription.updated,
             customer.subscription.deleted, invoice.payment_failed
     Copy its signing secret into STRIPE_WEBHOOK_SECRET.
  2. Settings -> Billing -> Customer portal: enable it (payment method, invoices, cancel).
  3. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, then apply the
     supabase migration 20261106090000_individual_plans.sql.
  4. Test locally with:  stripe listen --forward-to localhost:3000/api/stripe/webhook
     and the test card 4242 4242 4242 4242.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
