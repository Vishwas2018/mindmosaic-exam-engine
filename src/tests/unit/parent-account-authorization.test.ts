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
const mockProfileMaybeSingle = vi.hoisted(() => vi.fn());
const mockChildrenLinks = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockProfileMaybeSingle,
            }),
          }),
        };
      }
      if (table === "parent_children") {
        return {
          select: () => ({
            eq: mockChildrenLinks,
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

const mockGetMySubscription = vi.hoisted(() => vi.fn());
vi.mock("@/lib/billing/subscription", () => ({
  getMySubscription: mockGetMySubscription,
}));

import ParentAccountPage from "@/app/parent/account/page";
import ParentAccountBillingPage from "@/app/parent/account/billing/page";
import ParentSettingsPage from "@/app/parent/settings/page";

describe("Parent Account & Billing Authorization Guardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSupabaseConfigured.value = true;
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  describe("ParentAccountPage", () => {
    it("redirects unauthenticated user to /sign-in", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      await expect(ParentAccountPage()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
      expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
    });

    it("renders account page for authenticated parent", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "parent-1",
            email: "parent@example.com",
            updated_at: "2026-09-03T10:00:00Z",
          },
        },
      });
      mockProfileMaybeSingle.mockResolvedValueOnce({
        data: { display_name: "Priya Raman" },
      });
      mockChildrenLinks.mockResolvedValueOnce({
        data: [{ child_id: "c-1" }, { child_id: "c-2" }],
      });
      mockGetMySubscription.mockResolvedValueOnce({
        status: "ready",
        subscription: {
          status: "active",
          plan: "family_monthly",
          seats: 3,
          currentPeriodEnd: "2026-12-03T00:00:00Z",
          hasAccess: true,
        },
      });

      const element = await ParentAccountPage();
      expect(element).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("serves isolated preview fixtures when database is unconfigured", async () => {
      mockIsSupabaseConfigured.value = false;
      mockIsParentPreviewEnabled.mockResolvedValueOnce(true);

      const element = await ParentAccountPage();
      expect(element).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("ParentAccountBillingPage", () => {
    it("redirects unauthenticated user to /sign-in", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      await expect(ParentAccountBillingPage()).rejects.toThrow("NEXT_REDIRECT:/sign-in");
      expect(mockRedirect).toHaveBeenCalledWith("/sign-in");
    });

    it("renders billing handoff for authenticated parent", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "parent-1" } },
      });
      mockChildrenLinks.mockResolvedValueOnce({
        data: [{ child_id: "c-1" }, { child_id: "c-2" }],
      });
      mockGetMySubscription.mockResolvedValueOnce({
        status: "ready",
        subscription: {
          status: "active",
          plan: "family_monthly",
          seats: 3,
          currentPeriodEnd: "2026-12-03T00:00:00Z",
          hasAccess: true,
        },
      });

      const element = await ParentAccountBillingPage();
      expect(element).toBeDefined();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("ParentSettingsPage (Legacy Compatibility)", () => {
    it("redirects to canonical /parent/account", () => {
      expect(() => ParentSettingsPage()).toThrow("NEXT_REDIRECT:/parent/account");
      expect(mockRedirect).toHaveBeenCalledWith("/parent/account");
    });
  });
});
