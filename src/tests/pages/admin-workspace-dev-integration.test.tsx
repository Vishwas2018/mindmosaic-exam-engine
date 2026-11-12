import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/config", () => ({
  isSupabaseConfigured: true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/features/auth/require-role", () => ({
  requireRole: vi.fn(async () => ({
    configured: true,
    userId: "admin-uuid-1",
  })),
}));

vi.mock("@/server/exam-bank", () => ({
  getExamBank: vi.fn(() => [
    {
      id: "Q-PRAC-001",
      prompt: "What is 12 multiplied by 8?",
      yearLevel: 3,
      metadata: { subject: "Numeracy", difficulty: "medium", strand: "Number" },
      visual: null,
    },
  ]),
}));

vi.mock("@/server/publication-evidence", () => ({
  getPublicationEligibility: vi.fn(() => ({
    questions: ["Q-PRAC-001"],
    problems: [],
    pendingPublication: ["Q-AMC-001"],
  })),
}));

import { getAuthenticatedDevAdminData } from "@/server/admin-workspace-data";
import { AdminWorkspace } from "@/features/admin/components/AdminWorkspace";
import AdminHomePage from "@/app/admin/page";
import * as previewMode from "@/features/admin/preview-mode";

describe("Phase C: Authenticated DEV Integration", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();

    mockFrom.mockImplementation((table: string) => {
      if (table === "admin_platform_totals") {
        return {
          select: () => ({
            maybeSingle: async () => ({
              data: { total_attempts: 1548, active_students: 420 },
              error: null,
            }),
          }),
        };
      }
      if (table === "admin_draft_review_approvals") {
        return {
          select: () => ({
            order: () => ({
              data: [
                {
                  question_id: "Q-SCH-001",
                  content_hash: "a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890",
                  approved_by: "reviewer-uuid-1",
                  approved_at: "2026-11-08T14:14:00Z",
                  checks: { correctness: true, originality: true, ageAppropriateness: true },
                },
              ],
              error: null,
            }),
          }),
        };
      }
      return {
        select: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null }),
        }),
      };
    });
  });

  describe("getAuthenticatedDevAdminData", () => {
    it("connects to authentic DEV Supabase and maps real platform totals and approvals", async () => {
      const data = await getAuthenticatedDevAdminData();

      expect(data.source).toBe("dev");
      expect(data.reviewer.name).toContain("Admin");

      // Verify authentic metrics from admin_platform_totals
      const attemptsMetric = data.metrics.find((m) => m.label.includes("Active student attempts"));
      expect(attemptsMetric?.count).toBe(1548);
      expect(attemptsMetric?.change).toBe("420 active learners");

      // Verify real approval record
      expect(data.approvals).toHaveLength(1);
      expect(data.approvals[0].id).toBe("Q-SCH-001");
      expect(data.approvals[0].isApproved).toBe(true);
      expect(data.approvals[0].approvedBy).toBe("reviewer-uuid-1");

      // Verify publication manifest evidence
      expect(data.manifest.liveQuestionsCount).toBe(1);
      expect(data.manifest.rootHash).toMatch(/^sha256-[a-f0-9]{64}$/);

      // Verify honest unavailable states for unbuilt writing & support services
      expect(data.writing.availability.isAvailable).toBe(false);
      expect(data.writing.availability.reason).toContain("server-side double-blind anonymisation RPC");
      expect(data.writing.items).toHaveLength(0);

      expect(data.support.availability.isAvailable).toBe(false);
      expect(data.support.availability.reason).toContain("Question problem report triage table is not yet deployed");
      expect(data.support.items).toHaveLength(0);
    });
  });

  describe("AdminWorkspace with DEV data", () => {
    it("renders the Authenticated DEV Workspace badge and legacy tools", async () => {
      const devData = await getAuthenticatedDevAdminData();
      render(<AdminWorkspace data={devData} initialView="overview" />);

      expect(screen.getByText(/Authenticated DEV Workspace/i)).toBeInTheDocument();
      expect(screen.getByText(/Connected to authorized DEV data/i)).toBeInTheDocument();

      // Legacy tools quick links are present
      expect(screen.getAllByRole("link", { name: /Draft review/i })[0]).toHaveAttribute("href", "/admin/review");
      expect(screen.getAllByRole("link", { name: /Analytics/i })[0]).toHaveAttribute("href", "/admin/analytics");
      expect(screen.getAllByRole("link", { name: /Intelligence/i })[0]).toHaveAttribute("href", "/admin/intelligence");
      expect(screen.getAllByRole("link", { name: /Operations/i })[0]).toHaveAttribute("href", "/admin/operations");
    });

    it("displays honest unavailable state for Writing Review in DEV mode", async () => {
      const devData = await getAuthenticatedDevAdminData();
      render(<AdminWorkspace data={devData} initialView="writing" />);

      expect(screen.getByText(/Writing Review Queue: Honest Unavailable State/i)).toBeInTheDocument();
      expect(screen.getByText(/Awaiting migration: admin_redacted_writing_queue/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy boundary enforced: Student names and identifying details are scrubbed/i)).toBeInTheDocument();
    });

    it("displays honest unavailable state for Support in DEV mode", async () => {
      const devData = await getAuthenticatedDevAdminData();
      render(<AdminWorkspace data={devData} initialView="support" />);

      expect(screen.getByText(/Support Reports Queue: Honest Unavailable State/i)).toBeInTheDocument();
      expect(screen.getByText(/Awaiting migration: student_question_reports/i)).toBeInTheDocument();
    });

    it("disables mutations in read-only Phase C increment", async () => {
      const devData = await getAuthenticatedDevAdminData();
      render(<AdminWorkspace data={devData} initialView="approval" />);

      expect(screen.getByText(/Authenticated Read-Only Governance View/i)).toBeInTheDocument();
    });
  });

  describe("AdminHomePage Server Component Integration", () => {
    it("renders DEV workspace when preview mode is disabled", async () => {
      vi.spyOn(previewMode, "isAdminPreviewEnabled").mockResolvedValue(false);

      const element = await AdminHomePage({ searchParams: Promise.resolve({ view: "overview" }) });
      render(element);

      expect(screen.getByText(/Authenticated DEV Workspace/i)).toBeInTheDocument();
    });

    it("renders preview workspace when preview mode is enabled", async () => {
      vi.spyOn(previewMode, "isAdminPreviewEnabled").mockResolvedValue(true);

      const element = await AdminHomePage({ searchParams: Promise.resolve({ view: "overview" }) });
      render(element);

      expect(screen.getByText(/Admin Preview:/i)).toBeInTheDocument();
    });
  });
});
