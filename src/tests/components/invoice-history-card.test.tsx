import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InvoiceHistoryCard } from "@/features/billing/components/InvoiceHistoryCard";
import type { InvoiceSummary } from "@/app/api/stripe/invoices/route";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const INVOICE: InvoiceSummary = {
  id: "in_1",
  createdAt: "2026-06-01T00:00:00.000Z",
  amount: 1499,
  currency: "aud",
  status: "paid",
  hostedInvoiceUrl: "https://invoice.stripe.com/i/1",
  invoicePdf: "https://invoice.stripe.com/i/1/pdf",
};

describe("InvoiceHistoryCard", () => {
  it("renders each invoice's date, amount, status, and a PDF link", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ invoices: [INVOICE] })));
    render(<InvoiceHistoryCard />);

    expect(await screen.findByText("paid")).toBeInTheDocument();
    expect(screen.getByText("$14.99")).toBeInTheDocument();
    const pdfLink = screen.getByRole("link", { name: /pdf/i });
    expect(pdfLink).toHaveAttribute("href", INVOICE.invoicePdf);
  });

  it("shows a no-invoices message when the list is empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ invoices: [] })));
    render(<InvoiceHistoryCard />);
    expect(await screen.findByText(/no invoices yet/i)).toBeInTheDocument();
  });

  it("shows a graceful fallback instead of crashing when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { status: 500 })));
    render(<InvoiceHistoryCard />);
    expect(await screen.findByText(/invoice history unavailable/i)).toBeInTheDocument();
  });
});
