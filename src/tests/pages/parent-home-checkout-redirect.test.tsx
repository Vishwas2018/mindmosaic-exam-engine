import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * A parent who pays before adding a first child is redirected from /parent to /parent/setup. Stripe's return URL is
 * /parent?checkout=success, so the one-shot flag must survive that redirect or the payment confirmation is lost.
 */
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true, SUPABASE_NOT_CONFIGURED_MESSAGE: "x" }));
vi.mock("@/features/parent-dashboard/preview-mode", () => ({ isParentPreviewEnabled: async () => false }));
vi.mock("@/features/parent-dashboard/child-access", () => ({ loadArchivedChildIds: async () => new Set() }));
vi.mock("@/features/parent-dashboard/queries", () => ({
  loadParentDashboard: vi.fn(async () => ({ status: "ready", parentName: "Pat", children: [] })),
}));
vi.mock("@/features/parent-dashboard", () => ({
  CheckoutStatusToast: () => null,
  FamilyOverview: () => null,
  ParentShell: ({ children }: { children: unknown }) => children,
  PREVIEW_FAMILY_OVERVIEW_SUMMARIES: [],
  buildChildSummary: vi.fn(),
}));
vi.mock("@/components/ui", () => ({ ErrorState: () => null, buttonClasses: () => "" }));
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));

import ParentHomePage from "@/app/parent/page";

describe("/parent for a family with no child yet", () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it.each(["success", "cancelled"])("carries ?checkout=%s to the setup screen", async (flag) => {
    await expect(ParentHomePage({ searchParams: Promise.resolve({ checkout: flag }) })).rejects.toThrow(
      `NEXT_REDIRECT:/parent/setup?checkout=${flag}`,
    );
  });

  it("does not forward an unknown checkout value", async () => {
    await expect(ParentHomePage({ searchParams: Promise.resolve({ checkout: "<script>" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/parent/setup",
    );
    expect(redirect).toHaveBeenCalledWith("/parent/setup");
  });

  it("goes to plain /parent/setup when there is no flag", async () => {
    await expect(ParentHomePage({})).rejects.toThrow("NEXT_REDIRECT:/parent/setup");
    expect(redirect).toHaveBeenCalledWith("/parent/setup");
  });
});
