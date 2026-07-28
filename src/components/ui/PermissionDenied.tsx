import type { ReactNode } from "react";
import { ShieldX } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface PermissionDeniedProps {
  title?: string;
  description?: string;
  /** Optional recovery action, e.g. a "Back to dashboard" button. */
  action?: ReactNode;
  className?: string;
}

/**
 * Shown when a signed-in user reaches something their role isn't allowed to
 * see (a teacher opening an admin page, a student opening a parent route).
 * Distinct from an upgrade wall — this is a permanent role boundary, not a
 * billing tier, so it never links to checkout.
 */
export function PermissionDenied({
  title = "You don't have access to this page",
  description = "Your account role doesn't include this area. If you think this is a mistake, contact your administrator.",
  action,
  className,
}: PermissionDeniedProps) {
  return (
    <section
      role="alert"
      data-testid="permission-denied"
      className={twMerge(
        "rounded-3xl border border-error/15 bg-error/5 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10 text-error">
        <ShieldX aria-hidden="true" className="h-6 w-6" />
      </div>
      <h2 className="text-xl font-extrabold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {description}
      </p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </section>
  );
}
