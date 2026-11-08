import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

// Mock next/navigation redirect
const mockRedirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase config & catalogue adapter
const mockIsSupabaseConfigured = vi.hoisted(() => ({ value: true }));
vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  get isSupabaseConfigured() {
    return mockIsSupabaseConfigured.value;
  },
  SUPABASE_NOT_CONFIGURED_MESSAGE: "Supabase environment variables are missing.",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
  }),
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

const mockResolveDefaultChildId = vi.hoisted(() => vi.fn());
vi.mock("@/features/parent-dashboard/queries", () => ({
  resolveDefaultChildId: mockResolveDefaultChildId,
}));

const mockCatalogueQuery = vi.hoisted(() => vi.fn());
vi.mock("@/server/curriculum", () => ({
  PostgresCurriculumCatalogue: class {
    constructor(public options?: unknown) {}
    query = mockCatalogueQuery;
  },
  gatedPracticeCoverageResolver: vi.fn(),
}));

import ChildCurriculumPage, {
  metadata,
} from "@/app/parent/children/[childId]/curriculum/page";
import ParentCurriculumExplorerRedirectPage from "@/app/parent/curriculum-explorer/page";
import { AuthProvider } from "@/features/auth";

describe("ChildCurriculumPage & Redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ChildCurriculumPage (Server Component)", () => {
    it("exports appropriate non-indexed metadata", () => {
      expect(metadata.title).toContain("Child Curriculum Explorer");
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it("renders ErrorState when Supabase is unconfigured", async () => {
      mockIsSupabaseConfigured.value = false;

      const pageElement = await ChildCurriculumPage({
        params: Promise.resolve({ childId: "child-1" }),
      });
      render(<AuthProvider>{pageElement}</AuthProvider>);

      expect(screen.getByText("Database not configured")).toBeVisible();
      expect(screen.getByText("Supabase environment variables are missing.")).toBeVisible();
      expect(screen.getByRole("link", { name: "Back to children" })).toHaveAttribute(
        "href",
        "/parent/children",
      );
    });

    it("fetches catalogue items and renders the child curriculum view", async () => {
      mockIsSupabaseConfigured.value = true;
      mockCatalogueQuery
        .mockResolvedValueOnce({
          total: 1,
          items: [
            {
              licenceEvidence: {
                schemaVersion: 1,
                evidenceId: "f2000000-0000-4000-8000-000000000001",
                evidenceKey: "ev-1",
                licenceId: "lic-1",
                evidenceUrl: "https://example.com",
                retrievedAt: "2026-08-28T00:00:00Z",
                evidenceFingerprint: "0000000000000000000000000000000000000000000000000000000000000000",
                permitsStorage: false,
                permitsDisplay: false,
              },
              source: {
                schemaVersion: 1,
                sourceId: "f3000000-0000-4000-8000-000000000001",
                sourceKey: "src-1",
                jurisdictionCode: "VIC",
                schoolSectors: ["government"],
                licenceEvidenceId: "f2000000-0000-4000-8000-000000000001",
                licence: {
                  id: "lic-1",
                  name: "CC BY-NC 3.0 AU",
                  officialTextAccess: "metadata_only",
                  attributionParty: "VCAA",
                  sourceUrl: "https://example.com",
                },
              },
              release: {
                schemaVersion: 1,
                releaseId: "f4000000-0000-4000-8000-000000000001",
                releaseKey: "rel-1",
                sourceId: "f3000000-0000-4000-8000-000000000001",
                jurisdictionCode: "VIC",
                schoolSectors: ["government"],
                title: "Victorian Curriculum F–10 v2.0",
                releaseVersion: "2.0",
                publishedOn: "2024-01-01",
                effectiveFrom: "2024-01-01",
                status: "active",
                provenance: {
                  importedBy: "test",
                  importedAt: "2026-08-28T00:00:00Z",
                  sourceFingerprint: "0000000000000000000000000000000000000000000000000000000000000000",
                },
                review: {
                  reviewedBy: "lead",
                  reviewedAt: "2026-08-28T00:00:00Z",
                  reviewState: "approved",
                },
              },
              node: {
                schemaVersion: 1,
                nodeId: "f5000000-0000-4000-8000-000000000001",
                nodeKey: "n-1",
                releaseId: "f4000000-0000-4000-8000-000000000001",
                officialCode: "VC2M3N01",
                kind: "content_description",
                label: "Odd and even numbers",
                parentNodeId: null,
                sortOrder: 1,
              },
              applicability: [
                {
                  schemaVersion: 1,
                  applicabilityId: "f6000000-0000-4000-8000-000000000001",
                  curriculumReleaseId: "f4000000-0000-4000-8000-000000000001",
                  curriculumNodeId: "f5000000-0000-4000-8000-000000000001",
                  jurisdictionCode: "VIC",
                  schoolSectors: ["government"],
                  yearLevels: [3],
                  levelCodes: ["VIC-L3"],
                  bandCodes: [],
                  stageCodes: [],
                },
              ],
              crosswalks: [],
              taxonomyAlignments: [],
              coverage: {
                status: "none",
                supportingContentCount: 0,
                policyId: "p-1",
                computedAt: "2026-08-28T00:00:00Z",
              },
            },
          ],
          nextCursor: undefined,
        });

      const pageElement = await ChildCurriculumPage({
        params: Promise.resolve({ childId: "child-1" }),
      });
      render(<AuthProvider>{pageElement}</AuthProvider>);

      expect(screen.getByText("Aisha's Curriculum Alignment")).toBeVisible();
      expect(screen.getByText("Year 3 Focus")).toBeVisible();
      expect(screen.getByText("Odd and even numbers")).toBeVisible();
      expect(mockCatalogueQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe("ParentCurriculumExplorerRedirectPage", () => {
    it("redirects to child curriculum route when a default child is found", async () => {
      mockIsSupabaseConfigured.value = true;
      mockResolveDefaultChildId.mockResolvedValueOnce("child-42");

      await ParentCurriculumExplorerRedirectPage();
      expect(mockRedirect).toHaveBeenCalledWith("/parent/children/child-42/curriculum");
    });

    it("redirects to /parent/children when no default child is found", async () => {
      mockIsSupabaseConfigured.value = true;
      mockResolveDefaultChildId.mockResolvedValueOnce(null);

      await ParentCurriculumExplorerRedirectPage();
      expect(mockRedirect).toHaveBeenCalledWith("/parent/children");
    });
  });
});
