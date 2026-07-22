/**
 * Billing enforcement kill switch (Batch 3, docs/PRIVACY_AND_BILLING_GUARDRAILS.md).
 * Ships defaulted off: unset or anything other than the literal "true" leaves
 * ./require-active-subscription.ts a complete no-op, so merging this batch
 * changes nothing until a later batch flips it on in the deployment env.
 * Read at call time (not cached at import) so tests can toggle it per-case
 * without vi.resetModules() gymnastics.
 */
export function isBillingEnforcementEnabled(): boolean {
  return process.env.BILLING_ENFORCEMENT_ENABLED === "true";
}
