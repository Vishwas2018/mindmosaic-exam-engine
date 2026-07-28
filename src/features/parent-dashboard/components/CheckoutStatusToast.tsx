"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

type CheckoutStatus = "success" | "cancelled";

/**
 * Reads the one-shot `?checkout=success|cancelled` query param Stripe
 * Checkout redirects back with (src/app/api/stripe/checkout/route.ts's
 * success_url/cancel_url), shows a plain-language banner, and strips the
 * param from the URL so a refresh doesn't re-show it.
 *
 * The DB row is only ever updated by the verified webhook
 * (src/app/api/stripe/webhook/route.ts), which can land slightly after this
 * redirect — a single delayed router.refresh() re-runs the parent page's
 * server-side subscription fetch so the billing panel picks up the new
 * entitlement without the parent needing to manually reload.
 */
export function CheckoutStatusToast() {
  const router = useRouter();
  const [status, setStatus] = useState<CheckoutStatus | null>(null);

  useEffect(() => {
    /* Deliberately deferred to an effect rather than a lazy useState
       initializer: reading window.location during render would make the
       client's first hydration pass diverge from the server-rendered HTML
       (which never has access to the request URL's query string), a
       hydration mismatch — same reasoning as src/app/auth/reset/page.tsx. */
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout !== "success" && checkout !== "cancelled") return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(checkout);
    params.delete("checkout");
    const rest = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : ""));
  }, []);

  useEffect(() => {
    if (status !== "success") return;
    const timer = window.setTimeout(() => router.refresh(), 2500);
    return () => window.clearTimeout(timer);
  }, [status, router]);

  if (!status) return null;

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl border border-success/25 bg-success/10 px-5 py-4"
      >
        <CheckCircle2 aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-success" />
        <p className="text-sm font-semibold text-ink">
          Payment received — your plan is updating now.
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-royal/10 bg-white px-5 py-4"
    >
      <XCircle aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-muted" />
      <p className="text-sm font-semibold text-ink">
        Checkout was cancelled — no changes were made.
      </p>
    </div>
  );
}
