import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("server-only", () => ({}));

const mockHost = vi.hoisted(() => ({ value: "localhost:3013" as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => (name === "host" ? mockHost.value : null) }),
}));

import { isBillingPreviewEnabled } from "@/features/billing/preview-mode";
import { BillingPreviewScreens } from "@/features/billing/components/preview/BillingPreviewScreens";

describe("Plan & Billing Workspace Preview Gate & Component", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockHost.value = "localhost:3013";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isBillingPreviewEnabled", () => {
    it("returns false when BILLING_PREVIEW is not set", async () => {
      vi.unstubAllEnvs();
      const enabled = await isBillingPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns false when on Vercel even if BILLING_PREVIEW=1", async () => {
      vi.stubEnv("BILLING_PREVIEW", "1");
      vi.stubEnv("VERCEL", "1");
      const enabled = await isBillingPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns false if host is non-loopback", async () => {
      vi.stubEnv("BILLING_PREVIEW", "1");
      mockHost.value = "mindmosaic.com.au";
      const enabled = await isBillingPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns true when BILLING_PREVIEW=1 and loopback", async () => {
      vi.stubEnv("BILLING_PREVIEW", "1");
      mockHost.value = "localhost:3013";
      const enabled = await isBillingPreviewEnabled();
      expect(enabled).toBe(true);
    });
  });

  describe("BillingPreviewScreens component", () => {
    it("renders the active family plan artboard by default", () => {
      render(<BillingPreviewScreens initialView="active" />);

      expect(screen.getByRole("heading", { name: "Plan & Billing" })).toBeInTheDocument();
      expect(screen.getByText("Active Family Plan")).toBeInTheDocument();
      expect(screen.getByText(/Family plan places: 2 of 3 used/i)).toBeInTheDocument();
      expect(screen.getByText("Visa ending in 4242")).toBeInTheDocument();
    });

    it("renders the payment failed alert state", () => {
      render(<BillingPreviewScreens initialView="failed" />);

      expect(screen.getByText(/Your last payment was declined on 28 October 2026/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry payment now/i })).toBeInTheDocument();
    });

    it("renders the cancellation scheduled state with resume action", () => {
      render(<BillingPreviewScreens initialView="cancelling" />);

      expect(screen.getByText(/Your Family plan will cancel on 28 November 2026/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Resume my subscription/i })).toBeInTheDocument();
    });

    it("renders the free tier and upgrade cards with annual discount option", () => {
      render(<BillingPreviewScreens initialView="free" />);

      expect(screen.getByRole("heading", { name: "Choose the Family Plan" })).toBeInTheDocument();
      expect(screen.getByText("Free Practice")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Upgrade to Family Plan/i })).toBeInTheDocument();
    });

    it("allows switching artboards using the top switcher pills", () => {
      render(<BillingPreviewScreens initialView="active" />);

      const freePill = screen.getByRole("button", { name: /Free Account \/ Upgrade \(05\)/i });
      fireEvent.click(freePill);

      expect(screen.getByRole("heading", { name: "Choose the Family Plan" })).toBeInTheDocument();
    });

    it("handles simulated Stripe action without making network calls", () => {
      render(<BillingPreviewScreens initialView="active" />);

      const updateCardBtn = screen.getByRole("button", { name: /Update card/i });
      fireEvent.click(updateCardBtn);

      expect(screen.getByText(/Demonstration only: "Update Payment Card" action handled in local preview state/i)).toBeInTheDocument();
    });
  });
});
