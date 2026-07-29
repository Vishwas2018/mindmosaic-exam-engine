"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmDialog } from "@/components/ui";
import { redirectTo } from "@/lib/browser-redirect";
import type { MySubscriptionDetails, SubscriptionStatus } from "@/lib/billing/subscription";

interface LiveStatus {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

const STATUS_LABELS: Record<SubscriptionStatus, { label: string; variant: "success" | "purple" | "warning" | "error" | "neutral" }> = {
  trialing: { label: "Free trial", variant: "purple" },
  active: { label: "Active", variant: "success" },
  past_due: { label: "Payment overdue", variant: "warning" },
  paused: { label: "Paused", variant: "neutral" },
  canceled: { label: "Canceled", variant: "neutral" },
  incomplete: { label: "Incomplete", variant: "warning" },
  trial_expired: { label: "Trial expired", variant: "error" },
};

const PLAN_LABELS: Record<"family_monthly" | "family_annual", string> = {
  family_monthly: "Family (monthly)",
  family_annual: "Family (annual)",
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" });

/**
 * Current-status + cancel/undo-cancel section of the signed-in parent's
 * billing page. Plan/trial/status come from the server-fetched DB row
 * (getMySubscription, same as the parent-dashboard BillingPanel); the
 * cancel_at_period_end flag isn't stored there (no column for it — see
 * ../../../app/api/stripe/status/route.ts's comment), so it's fetched
 * live from /api/stripe/status on mount instead.
 */
export function SubscriptionOverviewCard({ subscription }: { subscription: MySubscriptionDetails }) {
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [liveError, setLiveError] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stripe/status")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("not ok"))))
      .then((body: LiveStatus) => {
        if (!cancelled) setLive(body);
      })
      .catch(() => {
        if (!cancelled) setLiveError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleManageBilling() {
    setActionError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const body = response.ok ? ((await response.json().catch(() => null)) as { url?: string } | null) : null;
      if (!body?.url) {
        setActionError("Billing management isn't available right now. Please try again soon.");
        return;
      }
      redirectTo(body.url);
    } catch {
      setActionError("Billing management isn't available right now. Please try again soon.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const response = await fetch("/api/stripe/cancel", { method: "POST" });
      if (!response.ok) {
        setActionError("Could not cancel right now. Please try again.");
        return;
      }
      const body = (await response.json()) as LiveStatus;
      setLive(body);
      setConfirmingCancel(false);
    } catch {
      setActionError("Could not cancel right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUndoCancel() {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const response = await fetch("/api/stripe/resume", { method: "POST" });
      if (!response.ok) {
        setActionError("Could not undo the cancellation right now. Please try again.");
        return;
      }
      setLive((current) => (current ? { ...current, cancelAtPeriodEnd: false } : current));
    } catch {
      setActionError("Could not undo the cancellation right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusInfo = STATUS_LABELS[subscription.status];
  const planDescription = subscription.plan
    ? PLAN_LABELS[subscription.plan]
    : subscription.status === "trialing"
      ? "Free trial in progress"
      : "No plan selected yet";

  const canManageCancellation =
    !liveError && live !== null && subscription.plan !== null && subscription.status !== "canceled";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Your subscription</CardTitle>
          <CardDescription>{planDescription}</CardDescription>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.status === "past_due" && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-warning/10 px-4 py-3 text-sm font-semibold text-warning"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0" />
            Your last payment didn&apos;t go through. Update your payment method to keep access.
          </p>
        )}

        {live?.cancelAtPeriodEnd && (
          <p className="rounded-xl bg-page px-4 py-3 text-sm font-semibold text-ink">
            Your plan will end
            {live.currentPeriodEnd ? ` on ${DATE_FORMAT.format(new Date(live.currentPeriodEnd))}` : " at the end of this billing period"}
            . <button type="button" onClick={handleUndoCancel} className="font-extrabold text-royal underline underline-offset-4">
              Undo cancellation
            </button>
          </p>
        )}

        {actionError && (
          <p role="alert" className="text-sm font-semibold text-error">
            {actionError}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            isLoading={isSubmitting}
            loadingLabel="Opening billing portal"
            onClick={handleManageBilling}
          >
            Manage payment details
          </Button>
          {canManageCancellation && !live?.cancelAtPeriodEnd && (
            <Button type="button" variant="ghost" onClick={() => setConfirmingCancel(true)}>
              Cancel subscription
            </Button>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel your subscription?"
        description="You'll keep full access until the end of your current billing period. You can undo this any time before it lapses."
        confirmLabel="Yes, cancel"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleCancel}
        onCancel={() => setConfirmingCancel(false)}
      />
    </Card>
  );
}
