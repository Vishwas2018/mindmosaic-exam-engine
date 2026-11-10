import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockRedirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockIsSupabaseConfigured = vi.hoisted(() => ({ value: true }));
vi.mock("@/lib/supabase/config", () => ({
  get isSupabaseConfigured() {
    return mockIsSupabaseConfigured.value;
  },
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

vi.mock("@/server/writing/tasks", () => ({
  listWritingTasks: () => [{ id: "task-1", title: "Narrative prompt" }],
}));

const mockLoadLinkedChildren = vi.hoisted(() => vi.fn());
const mockLoadWritingHistory = vi.hoisted(() => vi.fn());

vi.mock("@/server/writing/queries", () => ({
  loadLinkedChildren: mockLoadLinkedChildren,
  loadWritingHistory: mockLoadWritingHistory,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "parent-1" } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: async () => ({
            data: { id: "child-1", display_name: "Aisha", year_level: 3 },
            error: null,
          }),
        })),
      })),
    })),
  })),
}));

import ParentWritingPage from "@/app/parent/writing/page";
import ChildWritingPage from "@/app/parent/children/[childId]/writing/page";

describe("ParentWritingPage & ChildWritingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ParentWritingPage (Legacy compatibility)", () => {
    it("redirects to /parent when Supabase is not configured", async () => {
      mockIsSupabaseConfigured.value = false;
      await ParentWritingPage();
      expect(mockRedirect).toHaveBeenCalledWith("/parent");
    });

    it("renders writing list for all linked children without redirecting to an arbitrary child", async () => {
      mockIsSupabaseConfigured.value = true;
      mockLoadLinkedChildren.mockResolvedValueOnce([
        { id: "child-1", name: "Aisha" },
        { id: "child-2", name: "Kiran" },
      ]);
      mockLoadWritingHistory.mockResolvedValueOnce([
        { id: "att-1", studentId: "child-1", taskId: "task-1", submittedAt: "2026-11-01" },
      ]);

      const element = await ParentWritingPage();
      expect(element).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("ChildWritingPage", () => {
    it("renders child writing page for a valid child", async () => {
      mockIsSupabaseConfigured.value = true;
      mockLoadWritingHistory.mockResolvedValueOnce([]);
      const element = await ChildWritingPage({
        params: Promise.resolve({ childId: "child-1" }),
      });
      expect(element).toBeDefined();
    });
  });
});
