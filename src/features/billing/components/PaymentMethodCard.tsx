"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SkeletonText } from "@/components/ui";
import { redirectTo } from "@/lib/browser-redirect";

import type { PaymentMethodSummary } from "@/app/api/stripe/payment-method/route";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; paymentMethod: PaymentMethodSummary | null };

function brandLabel(brand: string): string {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

/**
 * Read-only display of the parent's card on file. Updating it happens on
 * Stripe's own hosted customer portal (POST /api/stripe/portal) — the same
 * "Manage payment details" action SubscriptionOverviewCard exposes — never
 * a card form on this domain.
 */
export function PaymentMethodCard() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stripe/payment-method")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("not ok"))))
      .then((body: { paymentMethod: PaymentMethodSummary | null }) => {
        if (!cancelled) setState({ status: "ready", paymentMethod: body.paymentMethod });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpdate() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const body = response.ok ? ((await response.json().catch(() => null)) as { url?: string } | null) : null;
      if (!body?.url) {
        setError("Payment management isn't available right now. Please try again soon.");
        return;
      }
      redirectTo(body.url);
    } catch {
      setError("Payment management isn't available right now. Please try again soon.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard aria-hidden="true" className="h-5 w-5 text-royal" />
          Payment method
        </CardTitle>
        <CardDescription>Card entry and storage happen entirely on Stripe&apos;s side.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.status === "loading" && <SkeletonText lines={1} />}

        {state.status === "error" && (
          <p className="text-sm font-semibold text-muted">Payment method info unavailable right now.</p>
        )}

        {state.status === "ready" && state.paymentMethod && (
          <p className="text-sm font-semibold text-ink">
            {brandLabel(state.paymentMethod.brand)} ending in {state.paymentMethod.last4} · expires{" "}
            {String(state.paymentMethod.expMonth).padStart(2, "0")}/{state.paymentMethod.expYear}
          </p>
        )}

        {state.status === "ready" && !state.paymentMethod && (
          <p className="text-sm font-semibold text-muted">No card on file yet.</p>
        )}

        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}

        <Button type="button" variant="secondary" isLoading={isSubmitting} loadingLabel="Opening" onClick={handleUpdate}>
          Update payment method
        </Button>
      </CardContent>
    </Card>
  );
}
