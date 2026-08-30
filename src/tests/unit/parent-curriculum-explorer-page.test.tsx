import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));

// Mock Supabase config & catalogue adapter
const mockIsSupabaseConfigured = vi.hoisted(() => ({ value: true }));
vi.mock("@/lib/supabase/config", () => ({
  get isSupabaseConfigured() {
    return mockIsSupabaseConfigured.value;
  },
  SUPABASE_NOT_CONFIGURED_MESSAGE: "Supabase environment variables are missing.",
}));

const mockCatalogueQuery = vi.hoisted(() => vi.fn());
vi.mock("@/server/curriculum", () => ({
  PostgresCurriculumCatalogue: class {
    constructor(public options?: unknown) {}
    query = mockCatalogueQuery;
  },
  gatedPracticeCoverageResolver: vi.fn(),
}));

vi.mock("@/features/landing/components/SiteNav", () => ({
  SiteNav: () => <nav data-testid="site-nav">SiteNav</nav>,
}));

vi.mock("@/features/landing/components/Closing", () => ({
  SiteFooter: () => <footer data-testid="site-footer">SiteFooter</footer>,
}));

import ParentCurriculumExplorerPage, {
  metadata,
} from "@/app/parent/curriculum-explorer/page";

describe("ParentCurriculumExplorerPage (Server Component)", () => {
  it("exports appropriate non-indexed metadata", () => {
    expect(metadata.title).toContain("Victorian Curriculum Explorer");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders ErrorState when Supabase is unconfigured", async () => {
    mockIsSupabaseConfigured.value = false;

    const pageElement = await ParentCurriculumExplorerPage();
    render(pageElement);

    expect(screen.getByText("Database not configured")).toBeVisible();
    expect(screen.getByText("Supabase environment variables are missing.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to dashboard" })).toHaveAttribute(
      "href",
      "/parent",
    );
  });

  it("fetches catalogue items with pagination and renders the explorer", async () => {
    mockIsSupabaseConfigured.value = true;
    mockCatalogueQuery
      .mockResolvedValueOnce({
        total: 2,
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
        nextCursor: "cursor-page-2",
      })
      .mockResolvedValueOnce({
        total: 2,
        items: [],
        nextCursor: undefined,
      });

    const pageElement = await ParentCurriculumExplorerPage();
    render(pageElement);

    expect(screen.getByTestId("site-nav")).toBeVisible();
    expect(screen.getByTestId("site-footer")).toBeVisible();
    expect(screen.getByText("Odd and even numbers")).toBeVisible();
    expect(mockCatalogueQuery).toHaveBeenCalledTimes(2);
  });
});
