-- Individual plan: one learner, monthly or annual.
--
-- public.subscriptions.plan was constrained to the two Family values. The
-- Stripe webhook writes plan through apply_stripe_subscription_event, which
-- stores whatever text it is given, so the check constraint is the only
-- thing standing between an Individual checkout and a failed webhook.
--
-- Child-profile limits are derived from the plan in application code
-- (maxChildrenForPlan in src/lib/billing/prices.ts); the `seats` column is
-- left as it was and is not read for that purpose.

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check check (
    plan is null
    or plan in (
      'family_monthly',
      'family_annual',
      'individual_monthly',
      'individual_annual'
    )
  );
