"use client";

import { useState } from "react";

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { redirectTo } from "@/lib/browser-redirect";
import type { MySubscriptionResult, SubscriptionStatus } from "@/lib/billing/subscription";

/**
 * Billing summary section of the parent dashboard: current plan/status,
 * trial days remaining, and a "Manage billing" button that hands off to
 * Stripe's customer portal (POST /api/stripe/portal — Batch 2's job to
 * build, this only calls it). Degrades gracefully: an error or missing
 * subscription result never breaks the rest of the dashboard, it just
 * shows a fallback message.
 */

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

function daysRemaining(target: string): number {
  const diffMs = new Date(target).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function Fallback({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-semibold text-muted">{message}</p>
      </CardContent>
    </Card>
  );
}

export function BillingPanel({ subscription: result }: { subscription: MySubscriptionResult }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManageBilling() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      if (!response.ok) {
        setError("Billing management isn't available yet. Please try again soon.");
        return;
      }
      const body = (await response.json().catch(() => null)) as { url?: string } | null;
      if (!body?.url) {
        setError("Billing management isn't available yet. Please try again soon.");
        return;
      }
      redirectTo(body.url);
    } catch {
      setError("Billing management isn't available yet. Please try again soon.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result.status === "error") {
    return <Fallback message="Billing info unavailable right now. Please refresh to try again." />;
  }

  const { subscription } = result;
  if (!subscription) {
    return <Fallback message="No billing plan set up yet." />;
  }

  const statusInfo = STATUS_LABELS[subscription.status];
  const showTrialCountdown = subscription.status === "trialing" && subscription.trialEnd !== null;
  const trialDaysLeft = showTrialCountdown ? daysRemaining(subscription.trialEnd as string) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            {subscription.plan ? PLAN_LABELS[subscription.plan] : "No plan selected yet"}
          </CardDescription>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {trialDaysLeft !== null && (
          <p className="text-sm font-semibold text-ink">
            {trialDaysLeft > 0
              ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left in your free trial`
              : "Your free trial has ended"}
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}

        <Button
          type="button"
          variant="secondary"
          isLoading={isSubmitting}
          loadingLabel="Opening billing portal"
          onClick={handleManageBilling}
        >
          Manage billing
        </Button>
      </CardContent>
    </Card>
  );
}
