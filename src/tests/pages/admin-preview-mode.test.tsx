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

    it("renders parent support inquiries queue with privacy-redacted emails and notice", () => {
      render(<AdminPreviewDashboard initialView="support" />);

      expect(screen.getByRole("heading", { name: /Parent Support & Inquiry Tickets/i })).toBeInTheDocument();
      expect(screen.getByText("TICK-2026-881")).toBeInTheDocument();
      expect(screen.getByText(/p\*\*\*@masked\.invalid/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy boundary: Student identities, private responses, and parent emails are masked/i)).toBeInTheDocument();
    });

    it("enforces privacy boundaries on student writing submissions", () => {
      render(<AdminPreviewDashboard initialView="writing" />);

      expect(screen.getByRole("heading", { name: /Writing Submissions & Human Rubric Review/i })).toBeInTheDocument();
      expect(screen.getByText(/REDACTED-STU-042 \(Blind Review Privacy Protected\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy boundary enforced: Student names and identifying details are scrubbed/i)).toBeInTheDocument();
      // Ensure no raw unredacted student name is present
      expect(screen.queryByText(/Student: Aisha Raman/i)).not.toBeInTheDocument();
    });

    it("toggles mobile navigation drawer on small viewports", () => {
      render(<AdminPreviewDashboard initialView="overview" />);

      const toggleBtn = screen.getByRole("button", { name: /Toggle navigation menu/i });
      expect(screen.queryByText("Admin Workspace Sections")).not.toBeInTheDocument();

      fireEvent.click(toggleBtn);
      expect(screen.getByText("Admin Workspace Sections")).toBeInTheDocument();

      // Click a section inside mobile drawer
      const paperBtn = screen.getAllByRole("button", { name: /Paper review/i })[0];
      fireEvent.click(paperBtn);

      // Drawer closes and paper review view is displayed
      expect(screen.queryByText("Admin Workspace Sections")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Paper Review & Staging/i })).toBeInTheDocument();
    });

    it("renders the 8 approved state boards with loading, empty, error, and security gates", () => {
      render(<AdminPreviewDashboard initialView="states" />);

      expect(screen.getByRole("heading", { name: /Approved State Boards & Edge Cases/i })).toBeInTheDocument();
      expect(screen.getByText(/Queue Cleared — Nothing Waiting/i)).toBeInTheDocument();
      expect(screen.getByText(/No Match for the Filter/i)).toBeInTheDocument();
      expect(screen.getByText(/Could Not Load Queue/i)).toBeInTheDocument();
      expect(screen.getByText(/Signed in, Wrong Role \(Permission Denied\)/i)).toBeInTheDocument();

      // Switch to approve states
      fireEvent.click(screen.getByRole("button", { name: /Approve States \(b10\)/i }));
      expect(screen.getByText(/Stale Revision Block — Content Changed Under You/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Approve rev 4 \(Disabled\)/i })).toBeDisabled();

      // Switch to publish states
      fireEvent.click(screen.getByRole("button", { name: /Publish States \(b14\)/i }));
      expect(screen.getByText(/Can’t Publish: No Human Approval \(Rule #8 Enforced\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Can’t Publish: Approval is Stale/i)).toBeInTheDocument();

      // Switch to support states
      fireEvent.click(screen.getByRole("button", { name: /Support States \(b20\)/i }));
      expect(screen.getByText(/Priority Escalation: “Something upset me”/i)).toBeInTheDocument();
      expect(screen.getByText(/What a Reviewer Never Sees Here \(Privacy Line\)/i)).toBeInTheDocument();
    });
  });
});
