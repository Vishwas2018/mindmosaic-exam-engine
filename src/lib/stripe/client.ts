import "server-only";

import Stripe from "stripe";

import { STRIPE_SECRET_KEY, isStripeConfigured } from "./config";

/**
 * Server-only Stripe SDK client. Lazily constructed (not at module load)
 * so importing this file never throws in an environment where
 * STRIPE_SECRET_KEY is unset — callers check `isStripeConfigured` first
 * (same fail-clean shape as the Supabase admin client in
 * src/features/auth/provision-child.ts) and only reach `getStripeClient()`
 * once that's confirmed true.
 *
 * Cached as a module-level singleton: constructing a new Stripe instance
 * per request is unnecessary overhead and the SDK is documented as safe to
 * reuse across requests.
 */
let cachedClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!isStripeConfigured) {
    throw new Error("Stripe is not configured: STRIPE_SECRET_KEY is unset.");
  }
  if (!cachedClient) {
    cachedClient = new Stripe(STRIPE_SECRET_KEY);
  }
  return cachedClient;
}
