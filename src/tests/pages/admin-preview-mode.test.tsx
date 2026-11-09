import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("server-only", () => ({}));

const mockHost = vi.hoisted(() => ({ value: "localhost:3012" as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => (name === "host" ? mockHost.value : null) }),
}));

import { isAdminPreviewEnabled } from "@/features/admin/preview-mode";
import { AdminPreviewDashboard } from "@/features/admin/components/preview/AdminPreviewDashboard";

describe("Admin Workspace Preview Gate & Component", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockHost.value = "localhost:3012";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isAdminPreviewEnabled", () => {
    it("returns false when ADMIN_WORKSPACE_PREVIEW is not set", async () => {
      vi.unstubAllEnvs();
      const enabled = await isAdminPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns false when on Vercel even if ADMIN_WORKSPACE_PREVIEW=1", async () => {
      vi.stubEnv("ADMIN_WORKSPACE_PREVIEW", "1");
      vi.stubEnv("VERCEL", "1");
      const enabled = await isAdminPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns false if host is non-loopback", async () => {
      vi.stubEnv("ADMIN_WORKSPACE_PREVIEW", "1");
      mockHost.value = "mindmosaic.com.au";
      const enabled = await isAdminPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns true when ADMIN_WORKSPACE_PREVIEW=1 and loopback", async () => {
      vi.stubEnv("ADMIN_WORKSPACE_PREVIEW", "1");
      mockHost.value = "localhost:3012";
      const enabled = await isAdminPreviewEnabled();
      expect(enabled).toBe(true);
    });
  });

  describe("AdminPreviewDashboard component", () => {
    it("renders the overview artboard by default with metrics and queues", () => {
      render(<AdminPreviewDashboard initialView="overview" />);

      expect(screen.getByRole("heading", { name: "Editorial & Governance Overview" })).toBeInTheDocument();
      expect(screen.getByText("Draft questions in review")).toBeInTheDocument();
      expect(screen.getByText("Awaiting human approval")).toBeInTheDocument();
      expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    });

    it("renders the question library and allows filtering", () => {
      render(<AdminPreviewDashboard initialView="library" />);

      expect(screen.getByRole("heading", { name: /Question Library/i })).toBeInTheDocument();
      expect(screen.getByText("Q-NUM-Y3-042")).toBeInTheDocument();
      expect(screen.getByText("Perimeter of Rectangular Garden")).toBeInTheDocument();
    });

    it("renders the Human Approval Gate with Rule #8 notice", () => {
      render(<AdminPreviewDashboard initialView="approval" />);

      expect(screen.getByRole("heading", { name: /Human Approval Gate \(Rule #8\)/i })).toBeInTheDocument();
      expect(screen.getByText(/Standing Rule #8: Content publication requires human sign-off/i)).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /Sign Off as Maya Chen/i })[0]).toBeInTheDocument();
    });

    it("simulates human sign-off without mutating database", () => {
      render(<AdminPreviewDashboard initialView="approval" />);

      const signoffBtn = screen.getAllByRole("button", { name: /Sign Off as Maya Chen/i })[0];
      fireEvent.click(signoffBtn);

      expect(screen.getByText(/Demonstration only: Human sign-off/i)).toBeInTheDocument();
      expect(screen.getByText(/No database or tamper-evident ledger write occurred/i)).toBeInTheDocument();
    });

    it("renders the publication ledger view with tamper-evident root hash", () => {
      render(<AdminPreviewDashboard initialView="publication" />);

      expect(screen.getByRole("heading", { name: /Publication Status & Tamper-Evident Ledger/i })).toBeInTheDocument();
      expect(screen.getByText(/Tamper-Evident Ledger Root Hash/i)).toBeInTheDocument();
    });

    it("renders parent support inquiries queue", () => {
      render(<AdminPreviewDashboard initialView="support" />);

      expect(screen.getByRole("heading", { name: /Parent Support & Inquiry Tickets/i })).toBeInTheDocument();
      expect(screen.getByText("TICK-2026-881")).toBeInTheDocument();
    });
  });
});
