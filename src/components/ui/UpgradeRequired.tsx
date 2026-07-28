import { Lock, Sparkles } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { Badge } from "./Badge";
import { Button, buttonClasses } from "./Button";

export interface UpgradeRequiredProps {
  /** The plan the locked feature needs, e.g. `"Standard"` or `"Premium"`. */
  requiredTier: string;
  /**
   * Name of the gated feature, e.g. `"Detailed insights"`. Preserved as a
   * `feature` query param on the upgrade link so billing can return the user
   * to the right place after checkout.
   */
  feature?: string;
  title?: string;
  description?: string;
  /** Destination for the upgrade CTA. Defaults to `/billing`. */
  upgradeHref?: string;
  /**
   * If provided, the CTA is a button that calls this instead of a link — use
   * when the upgrade flow is driven in-page (e.g. opening a checkout modal).
   */
  onUpgrade?: () => void;
  className?: string;
}

/**
 * The paywall shown when a user hits a feature above their subscription tier.
 * Unlike {@link PermissionDenied} (a permanent role boundary), this is a
 * billing gate, so it always offers a route to upgrade and carries the feature
 * context through so billing can send the user back afterwards.
 */
export function UpgradeRequired({
  requiredTier,
  feature,
  title = "Upgrade to unlock this",
  description,
  upgradeHref = "/billing",
  onUpgrade,
  className,
}: UpgradeRequiredProps) {
  const resolvedDescription =
    description ??
    `${feature ? `${feature} is` : "This feature is"} part of the ${requiredTier} plan. Upgrade to unlock it for your family.`;

  const params = new URLSearchParams({ requiredTier });
  if (feature) params.set("feature", feature);
  const href = `${upgradeHref}?${params.toString()}`;

  return (
    <section
      data-testid="upgrade-required"
      data-required-tier={requiredTier}
      className={twMerge(
        "rounded-3xl border border-royal/15 bg-soft-purple px-6 py-12 text-center",
        className,
      )}
      aria-labelledby="upgrade-required-title"
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
        <Lock aria-hidden="true" className="h-6 w-6" />
      </div>
      <div className="flex justify-center">
        <Badge variant="purple">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
          {requiredTier} plan
        </Badge>
      </div>
      <h2
        id="upgrade-required-title"
        className="mt-3 text-xl font-extrabold text-ink"
      >
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {resolvedDescription}
      </p>
      <div className="mt-6 flex justify-center">
        {onUpgrade ? (
          <Button variant="primary" onClick={onUpgrade} data-testid="upgrade-cta">
            View plans
          </Button>
        ) : (
          <a
            href={href}
            data-testid="upgrade-cta"
            className={buttonClasses({ variant: "primary" })}
          >
            View plans
          </a>
        )}
      </div>
    </section>
  );
}
