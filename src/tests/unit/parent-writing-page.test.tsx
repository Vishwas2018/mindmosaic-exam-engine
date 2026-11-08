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

const mockResolveDefaultChildId = vi.hoisted(() => vi.fn());
vi.mock("@/features/parent-dashboard/queries", () => ({
  resolveDefaultChildId: mockResolveDefaultChildId,
}));

vi.mock("@/server/writing/tasks", () => ({
  listWritingTasks: () => [{ id: "task-1", title: "Narrative prompt" }],
}));

vi.mock("@/server/writing/queries", () => ({
  loadWritingHistory: async () => [],
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

import ParentWritingRedirectPage from "@/app/parent/writing/page";
import ChildWritingPage from "@/app/parent/children/[childId]/writing/page";

describe("ParentWritingRedirectPage & ChildWritingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ParentWritingRedirectPage", () => {
    it("redirects to child writing route when a default child is found", async () => {
      mockIsSupabaseConfigured.value = true;
      mockResolveDefaultChildId.mockResolvedValueOnce("child-99");

      await ParentWritingRedirectPage();
      expect(mockRedirect).toHaveBeenCalledWith("/parent/children/child-99/writing");
    });

    it("redirects to /parent/children when no default child is found", async () => {
      mockIsSupabaseConfigured.value = true;
      mockResolveDefaultChildId.mockResolvedValueOnce(null);

      await ParentWritingRedirectPage();
      expect(mockRedirect).toHaveBeenCalledWith("/parent/children");
    });
  });

  describe("ChildWritingPage", () => {
    it("renders child writing page for a valid child", async () => {
      mockIsSupabaseConfigured.value = true;
      const element = await ChildWritingPage({
        params: Promise.resolve({ childId: "child-1" }),
      });
      expect(element).toBeDefined();
    });
  });
});
