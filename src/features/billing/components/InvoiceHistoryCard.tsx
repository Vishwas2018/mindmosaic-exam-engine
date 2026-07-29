"use client";

import { useEffect, useState } from "react";
import { Download, Receipt } from "lucide-react";

import { Badge, Card, CardContent, CardHeader, CardTitle, SkeletonText, type BadgeVariant } from "@/components/ui";

import type { InvoiceSummary } from "@/app/api/stripe/invoices/route";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; invoices: InvoiceSummary[] };

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  paid: "success",
  open: "warning",
  uncollectible: "error",
  void: "neutral",
  draft: "neutral",
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" });

function formatAmount(amountInCents: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: currency.toUpperCase() }).format(
    amountInCents / 100,
  );
}

/** Invoice history + PDF links, read from Stripe (GET /api/stripe/invoices). */
export function InvoiceHistoryCard() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stripe/invoices")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("not ok"))))
      .then((body: { invoices: InvoiceSummary[] }) => {
        if (!cancelled) setState({ status: "ready", invoices: body.invoices });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt aria-hidden="true" className="h-5 w-5 text-royal" />
          Invoice history
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-0">
        {state.status === "loading" && (
          <div className="p-6">
            <SkeletonText lines={3} />
          </div>
        )}

        {state.status === "error" && (
          <p className="p-6 text-sm font-semibold text-muted">Invoice history unavailable right now.</p>
        )}

        {state.status === "ready" && state.invoices.length === 0 && (
          <p className="p-6 text-sm font-semibold text-muted">No invoices yet.</p>
        )}

        {state.status === "ready" && state.invoices.length > 0 && (
          <ul className="divide-y divide-royal/8">
            {state.invoices.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{DATE_FORMAT.format(new Date(invoice.createdAt))}</p>
                  <p className="mt-0.5 text-xs font-semibold text-muted">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[invoice.status] ?? "neutral"}>{invoice.status}</Badge>
                {invoice.invoicePdf && (
                  <a
                    href={invoice.invoicePdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-extrabold text-royal underline underline-offset-4"
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                    PDF
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
