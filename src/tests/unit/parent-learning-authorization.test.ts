import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockNotFound = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockIsSupabaseConfigured = vi.hoisted(() => ({ value: true }));
vi.mock("@/lib/supabase/config", () => ({
  get isSupabaseConfigured() {
    return mockIsSupabaseConfigured.value;
  },
  SUPABASE_NOT_CONFIGURED_MESSAGE: "Supabase not configured",
}));

const mockIsParentPreviewEnabled = vi.hoisted(() => vi.fn(async () => true));
vi.mock("@/features/parent-dashboard/preview-mode", () => ({
  isParentPreviewEnabled: mockIsParentPreviewEnabled,
}));

const mockGetUser = vi.hoisted(() => vi.fn());
const mockParentChildrenSelect = vi.hoisted(() => vi.fn());
const mockProfilesSelect = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === "parent_children") {
        return {
          select: mockParentChildrenSelect,
        };
      }
      if (table === "profiles") {
        return {
          select: mockProfilesSelect,
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: async () => ({ data: null, error: null }),
            single: async () => ({ data: null, error: null }),
          })),
        })),
      };
    },
  })),
}));

vi.mock("@/server/exam-bank", () => ({
  getExamBank: () => [
    {
      id: "q-1",
      yearLevel: 3,
      metadata: { subject: "numeracy" },
      prompt: "Sample math question",
      options: [{ id: "o1", text: "10" }],
    },
    {
      id: "q-2",
      yearLevel: 3,
      metadata: { subject: "reading" },
      prompt: "Sample reading question",
      options: [{ id: "o1", text: "Book" }],
    },
  ],
}));

vi.mock("@/server/writing/tasks", () => ({
  listWritingTasks: () => [
    {
      id: "task-1",
      title: "Narrative prompt",
      form: "narrative",
      yearLevel: 3,
      prompt: "Write a narrative story about a lost treasure.",
    },
  ],
}));

vi.mock("@/server/writing/queries", () => ({
  loadWritingHistory: vi.fn(async () => []),
}));

import ChildLearningPage from "@/app/parent/children/[childId]/learning/page";
import PracticePreviewPage from "@/app/parent/children/[childId]/learning/preview/page";
import ChildWritingPage from "@/app/parent/children/[childId]/writing/page";

describe("Parent Learning & Controls Authorization Guardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSupabaseConfigured.value = true;
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });
  });

  describe("ChildLearningPage", () => {
    it("fails closed (notFound) when user is not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      await expect(
        ChildLearningPage({ params: Promise.resolve({ childId: "child-unlinked" }) }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it("fails closed (notFound) when child does not belong to parent (cross-family)", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "parent-attacker" } } });
      mockParentChildrenSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      });

      await expect(
        ChildLearningPage({ params: Promise.resolve({ childId: "child-victim" }) }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it("renders successfully when parent owns child", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "parent-legit" } } });
      // First call: link check
      mockParentChildrenSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: async () => ({ data: { child_id: "child-legit" }, error: null }),
          }),
        }),
      });
      // Second call: profile
      mockProfilesSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          single: async () => ({
            data: {
              id: "child-legit",
              display_name: "Aisha",
              year_level: 3,
              student_login_code: "K7XJ-2P9R",
            },
            error: null,
          }),
        }),
      });
      // Sibling links
      mockParentChildrenSelect.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({
          data: [{ child_id: "child-legit" }],
        }),
      });
      // Sibling profiles
      mockProfilesSelect.mockReturnValueOnce({
        in: vi.fn().mockReturnValueOnce({
          order: vi.fn().mockResolvedValueOnce({
            data: [{ id: "child-legit", display_name: "Aisha" }],
          }),
        }),
      });

      const element = await ChildLearningPage({
        params: Promise.resolve({ childId: "child-legit" }),
      });
      expect(element).toBeDefined();
      expect(mockNotFound).not.toHaveBeenCalled();
    });

    it("serves isolated preview fixtures when database is unconfigured", async () => {
      mockIsSupabaseConfigured.value = false;
      mockIsParentPreviewEnabled.mockResolvedValueOnce(true);

      const element = await ChildLearningPage({
        params: Promise.resolve({ childId: "child-aisha" }),
      });
      expect(element).toBeDefined();
      expect(mockNotFound).not.toHaveBeenCalled();
    });
  });

  describe("PracticePreviewPage", () => {
    it("fails closed (notFound) when child does not belong to parent", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "parent-attacker" } } });
      mockParentChildrenSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      });

      await expect(
        PracticePreviewPage({
          params: Promise.resolve({ childId: "child-victim" }),
          searchParams: Promise.resolve({ programme: "naplan-numeracy-y3" }),
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it("renders preview for authorized parent without mutating database", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "parent-legit" } } });
      mockParentChildrenSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: async () => ({ data: { child_id: "child-legit" }, error: null }),
          }),
        }),
      });
      mockProfilesSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          single: async () => ({
            data: { id: "child-legit", display_name: "Aisha", year_level: 3 },
            error: null,
          }),
        }),
      });

      const element = await PracticePreviewPage({
        params: Promise.resolve({ childId: "child-legit" }),
        searchParams: Promise.resolve({ programme: "naplan-numeracy-y3" }),
      });
      expect(element).toBeDefined();
      expect(mockNotFound).not.toHaveBeenCalled();
    });
  });

  describe("ChildWritingPage", () => {
    it("fails closed (notFound) when cross-family access is attempted", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "parent-attacker" } } });
      mockParentChildrenSelect.mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      });

      await expect(
        ChildWritingPage({ params: Promise.resolve({ childId: "child-victim" }) }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });
  });
});
