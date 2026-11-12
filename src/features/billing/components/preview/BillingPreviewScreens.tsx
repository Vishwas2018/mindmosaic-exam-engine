"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Download,
  ArrowRight,
  RefreshCw,
  Info,
  ChevronRight,
  Home,
  Users,
  Sparkles,
} from "lucide-react";
import { MindMosaicLogo } from "@/components/branding";

export type BillingArtboardView =
  | "active"
  | "mobile"
  | "failed"
  | "cancelling"
  | "free"
  | "states";

export interface BillingPreviewScreensProps {
  initialView?: BillingArtboardView;
}

export function BillingPreviewScreens({ initialView = "active" }: BillingPreviewScreensProps) {
  const [view, setView] = useState<BillingArtboardView>(initialView);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  // Simulated subscription states
  const [planState, setPlanState] = useState<"active" | "failed" | "cancelling">("active");

  const handleSimulatedStripeAction = (actionName: string) => {
    setDemoNotice(
      `Demonstration only: "${actionName}" action handled in local preview state. No Stripe API request or billing charge occurred.`
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfbf8] text-[#1f1b24] flex flex-col justify-between">
      {/* Top Preview Banner with Artboard Switcher */}
      <header className="border-b border-royal/10 bg-white sticky top-0 z-40 shadow-xs">
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 text-center text-xs font-medium text-amber-900">
          <strong className="font-bold">Plan & Billing Preview:</strong> Interactive visual states from Claude Design export (01–07) in local preview mode. All checkout, payment method, and cancellation actions are isolated demonstrations (no Stripe writes).
        </div>
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <MindMosaicLogo size="sm" />
          </Link>

          {/* Artboard switcher pills */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="font-bold text-royal mr-1">Artboards:</span>
            {[
              { id: "active", label: "Family Active (01)" },
              { id: "mobile", label: "Mobile Active (02)" },
              { id: "failed", label: "Payment Failed (03)" },
              { id: "cancelling", label: "Cancellation Scheduled (04)" },
              { id: "free", label: "Free Account / Upgrade (05)" },
              { id: "states", label: "Loading / Empty / Error (06)" },
            ].map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => {
                  setView(art.id as BillingArtboardView);
                  setDemoNotice(null);
                }}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  view === art.id
                    ? "bg-royal text-white"
                    : "bg-royal/5 text-royal hover:bg-royal/10"
                }`}
              >
                {art.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl w-full mx-auto">
        {demoNotice && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-medium text-amber-900 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-amber-700" />
              <span>{demoNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setDemoNotice(null)}
              className="text-amber-800 hover:text-amber-950 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* VIEW: FAMILY ACTIVE (Artboard 01 & 02) */}
        {(view === "active" || view === "mobile") && (
          <div className={`space-y-8 ${view === "mobile" ? "max-w-sm mx-auto" : ""}`}>
            {view === "mobile" && (
              <div className="rounded-lg bg-royal/10 p-2 text-center text-xs font-bold text-royal">
                Mobile Viewport Preview (390px)
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-royal">
                MindMosaic Subscription
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#1f1b24]">
                Plan &amp; Billing
              </h1>
              <p className="mt-1 text-sm text-[#6e6779]">
                Manage your Family plan places, payment card, and past invoices.
              </p>
            </div>

            {/* Active Plan Overview Card */}
            <div className="rounded-2xl border border-royal/10 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800 border border-teal-200 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-600"></span>
                      Active Family Plan
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-[#1f1b24]">
                    $19.90 <span className="text-sm font-semibold text-[#6e6779]">/ month</span>
                  </h2>
                  <p className="text-xs text-[#6e6779]">
                    Next renewal on 28 November 2026 · Auto-renews monthly
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulatedStripeAction("Switch to Annual Plan ($199/yr)")}
                    className="rounded-xl border border-royal/20 bg-royal/5 px-3.5 py-2 text-xs font-bold text-royal hover:bg-royal/10 transition"
                  >
                    Switch to Annual (Save 17%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulatedStripeAction("Cancel Subscription")}
                    className="rounded-xl border border-royal/15 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel plan
                  </button>
                </div>
              </div>

              {/* Places Used Bar */}
              <div className="rounded-xl border border-royal/10 bg-[#fcfbf8] p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#1f1b24] flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-royal" />
                    <span>Family plan places: 2 of 3 used</span>
                  </span>
                  <span className="text-royal">1 place available</span>
                </div>
                <div className="h-2 w-full rounded-full bg-royal/10 overflow-hidden">
                  <div className="h-full bg-royal rounded-full" style={{ width: "66.6%" }}></div>
                </div>
                <p className="text-[11px] text-[#6e6779]">
                  Active students: Aisha Raman (Year 3) and Kabir Raman (Year 5). You can add 1 more student at no additional cost.
                </p>
              </div>

              {/* Feature check grid */}
              <div className="grid gap-2 sm:grid-cols-2 text-xs text-[#1f1b24] pt-2 border-t border-royal/8">
                {[
                  "Up to 3 active student profiles",
                  "Year 3 & Year 5 full question bank",
                  "NAPLAN & ICAS practice papers",
                  "Singapore Maths bar-model mastery",
                  "Original writing prompts & rubric review",
                  "Weekly parent dashboard & email summary",
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#1f1b24]">Payment Method</h2>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
                    VISA
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1f1b24]">Visa ending in 4242</p>
                    <p className="text-[11px] text-[#6e6779]">Expires 08/2028 · Default card</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSimulatedStripeAction("Update Payment Card")}
                  className="rounded-xl border border-royal/15 bg-white px-3.5 py-1.5 text-xs font-bold text-royal hover:bg-royal/5 transition"
                >
                  Update card
                </button>
              </div>
            </div>

            {/* Invoices History Table */}
            <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-[#1f1b24]">Invoice History</h2>
              <div className="overflow-hidden rounded-xl border border-royal/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-royal/10 bg-royal/[0.02] text-[#6e6779] font-bold">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-royal/5">
                    {[
                      { date: "28 Oct 2026", desc: "MindMosaic Family Plan (Monthly)", amt: "$19.90", status: "Paid" },
                      { date: "28 Sep 2026", desc: "MindMosaic Family Plan (Monthly)", amt: "$19.90", status: "Paid" },
                      { date: "28 Aug 2026", desc: "MindMosaic Family Plan (Monthly)", amt: "$19.90", status: "Paid" },
                    ].map((inv, idx) => (
                      <tr key={idx} className="hover:bg-royal/[0.01]">
                        <td className="py-3 px-4 font-medium text-[#1f1b24]">{inv.date}</td>
                        <td className="py-3 px-4 text-[#6e6779]">{inv.desc}</td>
                        <td className="py-3 px-4 font-bold text-[#1f1b24]">{inv.amt}</td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleSimulatedStripeAction(`Download Receipt for ${inv.date}`)}
                            className="inline-flex items-center gap-1 font-bold text-royal hover:underline"
                          >
                            <Download className="h-3 w-3" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PAYMENT FAILED (Artboard 03) */}
        {view === "failed" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1f1b24]">
                Plan &amp; Billing
              </h1>
              <p className="mt-1 text-sm text-[#6e6779]">
                Action required on your MindMosaic Family plan payment.
              </p>
            </div>

            {/* Error Callout Banner */}
            <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-950 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-red-900">
                    Your last payment was declined on 28 October 2026
                  </h2>
                  <p className="text-xs text-red-800 leading-relaxed">
                    Your card provider declined the $19.90 renewal charge. Your children&apos;s practice access remains active during the grace period until 4 November 2026. Please update your card to avoid interruption.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSimulatedStripeAction("Retry Charge Now")}
                  className="rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 transition shadow-xs"
                >
                  Retry payment now
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatedStripeAction("Update Payment Method")}
                  className="rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-900 hover:bg-red-50 transition"
                >
                  Update payment method
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CANCELLATION SCHEDULED (Artboard 04) */}
        {view === "cancelling" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1f1b24]">
                Plan &amp; Billing
              </h1>
              <p className="mt-1 text-sm text-[#6e6779]">
                Your subscription cancellation has been scheduled.
              </p>
            </div>

            {/* Warning Callout */}
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950 space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-amber-900">
                    Your Family plan will cancel on 28 November 2026
                  </h2>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    You have already paid through 28 November 2026. Aisha and Kabir can continue practising questions and completing tests until that date. You will not be charged again.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSimulatedStripeAction("Resume Subscription")}
                className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-bold text-white hover:bg-amber-800 transition shadow-xs"
              >
                Resume my subscription
              </button>
            </div>
          </div>
        )}

        {/* VIEW: FREE ACCOUNT / UPGRADE (Artboard 05) */}
        {view === "free" && (
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1f1b24]">
                Choose the Family Plan
              </h1>
              <p className="text-sm text-[#6e6779]">
                One subscription covers the entire household — up to 3 children with full access to Year 3 &amp; Year 5 practice.
              </p>

              {/* Billing interval toggle */}
              <div className="inline-flex rounded-xl border border-royal/15 bg-white p-1 text-xs font-bold mt-4 shadow-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-lg px-4 py-1.5 transition ${
                    billingCycle === "monthly" ? "bg-royal text-white" : "text-[#6e6779]"
                  }`}
                >
                  Monthly ($19.90/mo)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`rounded-lg px-4 py-1.5 transition ${
                    billingCycle === "annual" ? "bg-royal text-white" : "text-[#6e6779]"
                  }`}
                >
                  Annual ($199/yr · Save 17%)
                </button>
              </div>
            </div>

            {/* Plan Tier Cards */}
            <div className="grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
              {/* Free Plan */}
              <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
                <div>
                  <span className="text-xs font-bold text-[#6e6779] uppercase">Always Free</span>
                  <h2 className="text-xl font-bold text-[#1f1b24] mt-1">Free Practice</h2>
                  <p className="text-2xl font-black text-[#1f1b24] mt-2">$0</p>
                </div>
                <div className="space-y-2 text-xs text-[#6e6779]">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                    <span>Sample practice questions</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                    <span>Instant automatic scoring</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-400">
                    <span className="h-3.5 w-3.5 flex items-center justify-center font-bold">✕</span>
                    <span>No progress saving across sessions</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 cursor-default"
                >
                  Current Free Tier
                </button>
              </div>

              {/* Family Plan */}
              <div className="rounded-2xl border-2 border-royal bg-white p-6 shadow-md space-y-4 relative">
                <span className="absolute -top-3 right-6 rounded-full bg-royal px-3 py-0.5 text-[11px] font-bold text-white shadow-xs">
                  Recommended
                </span>
                <div>
                  <span className="text-xs font-bold text-royal uppercase">Full Access</span>
                  <h2 className="text-xl font-bold text-[#1f1b24] mt-1">Family Plan</h2>
                  <p className="text-2xl font-black text-royal mt-2">
                    {billingCycle === "monthly" ? "$19.90 / mo" : "$199 / yr"}
                  </p>
                </div>
                <div className="space-y-2 text-xs text-[#1f1b24]">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                    <span>Up to 3 student places included</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                    <span>Full question bank & timed exam papers</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
                    <span>Parent analytics & writing rubric review</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSimulatedStripeAction(`Checkout Family Plan (${billingCycle})`)}
                  className="w-full rounded-xl bg-royal py-2.5 text-xs font-bold text-white hover:bg-royal-deep transition shadow-xs"
                >
                  Upgrade to Family Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: LOADING / EMPTY / ERROR STATES (Artboard 06) */}
        {view === "states" && (
          <div className="space-y-8">
            <h1 className="text-2xl font-extrabold text-[#1f1b24]">
              States: Loading, Empty Invoices &amp; Network Error
            </h1>

            {/* Loading Skeleton */}
            <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs space-y-4">
              <p className="text-xs font-bold text-royal uppercase">Loading Skeleton State</p>
              <div className="animate-pulse space-y-3">
                <div className="h-6 w-1/3 rounded bg-slate-200"></div>
                <div className="h-4 w-1/2 rounded bg-slate-100"></div>
                <div className="h-10 w-full rounded bg-slate-100"></div>
              </div>
            </div>

            {/* Empty Invoices State */}
            <div className="rounded-2xl border border-royal/10 bg-white p-8 text-center shadow-xs space-y-3">
              <CreditCard className="mx-auto h-8 w-8 text-[#6e6779]" />
              <h2 className="text-sm font-bold text-[#1f1b24]">No invoices yet</h2>
              <p className="text-xs text-[#6e6779] max-w-sm mx-auto">
                Invoices will appear here once your first monthly payment has processed.
              </p>
            </div>

            {/* Network Error State */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center space-y-3">
              <AlertTriangle className="mx-auto h-7 w-7 text-red-600" />
              <h2 className="text-sm font-bold text-red-950">We couldn&apos;t load your billing details</h2>
              <p className="text-xs text-red-800">
                A temporary network glitch occurred. Your subscription remains active.
              </p>
              <button
                type="button"
                onClick={() => handleSimulatedStripeAction("Retry Loading Billing Details")}
                className="rounded-xl bg-red-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-800 transition"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-royal/8 bg-white py-4 px-4 text-center text-xs text-[#6e6779]">
        MindMosaic Educational Practice · Australian Curriculum Alignment · Secure Stripe Billing
      </footer>
    </div>
  );
}
