import { beforeEach, describe, expect, it, vi } from "vitest";

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
  SUPABASE_NOT_CONFIGURED_MESSAGE: "Supabase not configured",
}));

const mockIsParentPreviewEnabled = vi.hoisted(() => vi.fn(async () => true));
vi.mock("@/features/parent-dashboard/preview-mode", () => ({
  isParentPreviewEnabled: mockIsParentPreviewEnabled,
}));

const mockGetUser = vi.hoisted(() => vi.fn());
const mockChildrenQuery = vi.hoisted(() => vi.fn());
const mockProfilesQuery = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === "parent_children") {
        return {
          select: () => ({
            eq: mockChildrenQuery,
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            in: mockProfilesQuery,
            eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  })),
}));

import ParentHelpPage from "@/app/parent/help/page";

describe("Parent Help Centre Route Authorization Guardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSupabaseConfigured.value = true;
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  it("redirects unauthenticated parent to /sign-in?next=/parent/help", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    await expect(ParentHelpPage()).rejects.toThrow("NEXT_REDIRECT:/sign-in?next=/parent/help");
    expect(mockRedirect).toHaveBeenCalledWith("/sign-in?next=/parent/help");
  });

  it("renders Help Centre for authenticated parent with children list", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "parent-123",
          email: "priya@example.com",
        },
      },
    });

    // The real schema: parent_children links, names and years on profiles (RLS-scoped to this parent).
    mockChildrenQuery.mockResolvedValueOnce({ data: [{ child_id: "c-1" }, { child_id: "c-2" }] });
    mockProfilesQuery.mockResolvedValueOnce({
      data: [
        { id: "c-1", display_name: "Aisha", year_level: 3 },
        { id: "c-2", display_name: "Kiran", year_level: null },
      ],
    });

    const element = await ParentHelpPage();
    expect(element).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockProfilesQuery).toHaveBeenCalledWith("id", ["c-1", "c-2"]);
    const centre = (element as { props: { children: { props: Record<string, unknown> } } }).props.children;
    expect(centre.props.childrenList).toEqual([
      { id: "c-1", name: "Aisha", yearLevel: 3 },
      { id: "c-2", name: "Kiran", yearLevel: null },
    ]);
    expect(centre.props.userEmail).toBe("priya@example.com");
  });

  it("serves isolated preview demonstration when database is unconfigured", async () => {
    mockIsSupabaseConfigured.value = false;
    mockIsParentPreviewEnabled.mockResolvedValueOnce(true);

    const element = await ParentHelpPage();
    expect(element).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
