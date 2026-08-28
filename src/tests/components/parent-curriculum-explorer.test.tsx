import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  curriculumApplicabilitySchema,
  curriculumCatalogueItemSchema,
  curriculumCoverageSchema,
  curriculumLicenceEvidenceSchema,
  curriculumNodeSchema,
  curriculumReleaseSchema,
  curriculumSourceSchema,
  type CurriculumCatalogueItem,
} from "@/features/curriculum/contracts";
import {
  CoverageBadge,
  ParentCurriculumExplorer,
  resolveCoverageBadge,
} from "@/features/curriculum/parent-explorer";

const SHA256_FIXTURE = "0000000000000000000000000000000000000000000000000000000000000000";

const licenceEvidence = curriculumLicenceEvidenceSchema.parse({
  schemaVersion: 1,
  evidenceId: "f2000000-0000-4000-8000-000000000001",
  evidenceKey: "vcaa-f10-v2-licence-evidence",
  licenceId: "vcaa-cc-by-nc-3.0-au",
  evidenceUrl: "https://f10.vcaa.vic.edu.au/copyright-statement",
  retrievedAt: "2026-08-28T12:00:00.000Z",
  evidenceFingerprint: SHA256_FIXTURE,
  permitsStorage: false,
  permitsDisplay: false,
});

const source = curriculumSourceSchema.parse({
  schemaVersion: 1,
  sourceId: "f3000000-0000-4000-8000-000000000001",
  sourceKey: "vcaa-f10-v2-source",
  authorityCode: "vcaa",
  authorityName: "Victorian Curriculum and Assessment Authority",
  jurisdictionCode: "VIC",
  schoolSectors: ["government", "catholic", "independent"],
  title: "Victorian Curriculum F–10 Version 2.0",
  sourceUrl: "https://f10.vcaa.vic.edu.au/",
  retrievedAt: "2026-08-28T12:00:00.000Z",
  sourceFingerprint: SHA256_FIXTURE,
  licenceEvidenceId: licenceEvidence.evidenceId,
  licence: {
    id: licenceEvidence.licenceId,
    name: "Creative Commons Attribution-NonCommercial 3.0 Australia",
    officialTextAccess: "metadata_only",
  },
});

const release = curriculumReleaseSchema.parse({
  schemaVersion: 1,
  releaseId: "f4000000-0000-4000-8000-000000000001",
  releaseKey: "vcaa-f10-v2-2024",
  sourceId: source.sourceId,
  frameworkScope: "state",
  jurisdictionCode: "VIC",
  schoolSectors: ["government", "catholic", "independent"],
  title: "Victorian Curriculum F–10 Version 2.0",
  version: "2.0",
  effectiveFrom: "2024-01-01",
  publishedAt: "2024-01-01T00:00:00.000Z",
  sourceFingerprint: SHA256_FIXTURE,
});

function createMockItem(
  nodeId: string,
  nodeKey: string,
  officialCode: string,
  label: string,
  yearLevel: number,
  levelCode: string,
  sortOrder: number,
  coverageStatus: "none" | "partial" | "covered" = "none",
  supportingContentCount = 0,
): CurriculumCatalogueItem {
  const node = curriculumNodeSchema.parse({
    schemaVersion: 1,
    nodeId,
    nodeKey,
    releaseId: release.releaseId,
    officialCode,
    kind: "content_descriptor",
    label,
    sortOrder,
  });

  const applicability = [
    curriculumApplicabilitySchema.parse({
      schemaVersion: 1,
      applicabilityId: nodeId.replace("f5", "f6"),
      releaseId: release.releaseId,
      nodeId: node.nodeId,
      jurisdictionCode: "VIC",
      schoolSectors: ["government", "catholic", "independent"],
      yearLevels: [yearLevel],
      levelCodes: [levelCode],
      bandCodes: [],
      stageCodes: [],
    }),
  ];

  const coverage = curriculumCoverageSchema.parse({
    status: coverageStatus,
    supportingContentCount,
    policyId: "curriculum-coverage-default",
    computedAt: "2026-08-28T12:00:00.000Z",
  });

  return curriculumCatalogueItemSchema.parse({
    licenceEvidence,
    source,
    release,
    node,
    applicability,
    crosswalks: [],
    taxonomyAlignments: [],
    coverage,
  });
}

const MOCK_CATALOGUE_ITEMS: CurriculumCatalogueItem[] = [
  createMockItem(
    "f5000000-0000-4000-8000-000000000001",
    "vic-m3-num-01",
    "VC2M3N01",
    "Odd and even numbers",
    3,
    "VIC-L3",
    1,
    "none",
    0,
  ),
  createMockItem(
    "f5000000-0000-4000-8000-000000000002",
    "vic-m3-alg-01",
    "VC2M3A01",
    "Inverse operations in addition and subtraction",
    3,
    "VIC-L3",
    2,
    "covered",
    8,
  ),
  createMockItem(
    "f5000000-0000-4000-8000-000000000003",
    "vic-e3-la-01",
    "VC2E3LA01",
    "Language variations and social context",
    3,
    "VIC-L3",
    3,
    "partial",
    3,
  ),
  createMockItem(
    "f5000000-0000-4000-8000-000000000004",
    "vic-m5-num-01",
    "VC2M5N01",
    "Decimal place value to thousandths",
    5,
    "VIC-L5",
    4,
    "none",
    0,
  ),
];

describe("ParentCurriculumExplorer Component", () => {
  it("renders the explorer header, jurisdiction, and sequencing notice", () => {
    render(<ParentCurriculumExplorer initialItems={MOCK_CATALOGUE_ITEMS} />);

    expect(
      screen.getByRole("heading", { name: /What your child learns in Year 3/i }),
    ).toBeVisible();
    expect(screen.getByLabelText(/Important curriculum sequencing note/i)).toBeVisible();
    expect(
      screen.getByText(/Schools set their own term-by-term sequencing/i),
    ).toBeVisible();
    expect(screen.getByLabelText("Jurisdiction")).toHaveValue("VIC");
  });

  it("filters nodes by Level 3 and Mathematics by default", () => {
    render(<ParentCurriculumExplorer initialItems={MOCK_CATALOGUE_ITEMS} />);

    expect(screen.getByText("VC2M3N01")).toBeVisible();
    expect(screen.getByText("Odd and even numbers")).toBeVisible();
    expect(screen.getByText("VC2M3A01")).toBeVisible();
    expect(
      screen.getByText("Inverse operations in addition and subtraction"),
    ).toBeVisible();

    // Level 5 and English should not be visible in default L3 Math view
    expect(screen.queryByText("VC2M5N01")).not.toBeInTheDocument();
    expect(screen.queryByText("VC2E3LA01")).not.toBeInTheDocument();
  });

  it("switches between Year 3 and Year 5 levels", async () => {
    const user = userEvent.setup();
    render(<ParentCurriculumExplorer initialItems={MOCK_CATALOGUE_ITEMS} />);

    const year5Radio = screen.getByRole("radio", { name: /Year 5 \(Level 5\)/i });
    await user.click(year5Radio);

    expect(
      screen.getByRole("heading", { name: /What your child learns in Year 5/i }),
    ).toBeVisible();
    expect(screen.getByText("VC2M5N01")).toBeVisible();
    expect(
      screen.getByText("Decimal place value to thousandths"),
    ).toBeVisible();
    expect(screen.queryByText("VC2M3N01")).not.toBeInTheDocument();
  });

  it("switches between Mathematics and English learning areas", async () => {
    const user = userEvent.setup();
    render(<ParentCurriculumExplorer initialItems={MOCK_CATALOGUE_ITEMS} />);

    const englishRadio = screen.getByRole("radio", { name: /English/i });
    await user.click(englishRadio);

    expect(screen.getByText("VC2E3LA01")).toBeVisible();
    expect(
      screen.getByText("Language variations and social context"),
    ).toBeVisible();
    expect(screen.queryByText("VC2M3N01")).not.toBeInTheDocument();

    // English strand tabs should be rendered
    expect(screen.getByRole("tab", { name: /Language/i })).toBeVisible();
    expect(screen.getByRole("tab", { name: /Literature/i })).toBeVisible();
    expect(screen.getByRole("tab", { name: /Literacy/i })).toBeVisible();
  });

  it("filters by strand tab within a learning area", async () => {
    const user = userEvent.setup();
    render(<ParentCurriculumExplorer initialItems={MOCK_CATALOGUE_ITEMS} />);

    // Click Algebra tab
    const algebraTab = screen.getByRole("tab", { name: /Algebra/i });
    await user.click(algebraTab);

    expect(screen.getByText("VC2M3A01")).toBeVisible();
    expect(screen.queryByText("VC2M3N01")).not.toBeInTheDocument();

    // Switch back to All Strands
    const allTab = screen.getByRole("tab", { name: /All Strands/i });
    await user.click(allTab);

    expect(screen.getByText("VC2M3N01")).toBeVisible();
    expect(screen.getByText("VC2M3A01")).toBeVisible();
  });

  it("filters by search keyword and allows clearing the search", async () => {
    const user = userEvent.setup();
    render(<ParentCurriculumExplorer initialItems={MOCK_CATALOGUE_ITEMS} />);

    const searchInput = screen.getByLabelText(/Filter skills by keyword/i);
    await user.type(searchInput, "inverse");

    expect(
      screen.getByText("Inverse operations in addition and subtraction"),
    ).toBeVisible();
    expect(screen.queryByText("Odd and even numbers")).not.toBeInTheDocument();

    // Search for non-existent keyword
    await user.clear(searchInput);
    await user.type(searchInput, "quantum physics");

    expect(screen.getByText("No matching skills found")).toBeVisible();
    const clearButton = screen.getByRole("button", { name: /Clear search query/i });
    await user.click(clearButton);

    expect(screen.getByText("Odd and even numbers")).toBeVisible();
  });

  it("opens the skill-detail modal with full explanation and home activities", async () => {
    const user = userEvent.setup();
    render(<ParentCurriculumExplorer initialItems={MOCK_CATALOGUE_ITEMS} />);

    const exploreButton = screen.getByRole("button", {
      name: /Explore details and home activities for VC2M3N01: Odd and even numbers/i,
    });
    await user.click(exploreButton);

    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);

    const modal = within(dialog);
    expect(
      modal.getByRole("heading", { name: "Odd and even numbers" }),
    ).toBeVisible();
    expect(modal.getByText(/What this skill means/i)).toBeVisible();
    expect(modal.getByText(/Why it matters for your child/i)).toBeVisible();
    expect(modal.getByText(/Everyday Home Activities/i)).toBeVisible();
    expect(modal.getByText("Pantry Pair Check")).toBeVisible();

    // Check outbound VCAA link inside modal
    const vcaaLink = modal.getByRole("link", { name: /View on official VCAA site/i });
    expect(vcaaLink).toHaveAttribute("target", "_blank");
    expect(vcaaLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(vcaaLink).toHaveAttribute(
      "href",
      "https://f10.vcaa.vic.edu.au/learning-areas/mathematics/curriculum",
    );

    // Close modal
    const closeBtn = modal.getByRole("button", { name: /Close/i });
    await user.click(closeBtn);
    expect(document.querySelector("dialog")).not.toBeInTheDocument();
  });
});

describe("CoverageBadge Component & Resolution", () => {
  it("resolves covered state (>=5 questions) to Ready to practise (success)", () => {
    const { state, meta } = resolveCoverageBadge({
      status: "covered",
      supportingContentCount: 8,
    });
    expect(state).toBe("covered");
    expect(meta.label).toBe("Ready to practise");
    expect(meta.variant).toBe("success");
  });

  it("resolves partial state (1–4 questions) to In development (warning)", () => {
    const { state, meta } = resolveCoverageBadge({
      status: "partial",
      supportingContentCount: 2,
    });
    expect(state).toBe("partial");
    expect(meta.label).toBe("In development");
    expect(meta.variant).toBe("warning");
  });

  it("resolves empty state (0 questions) to Coming soon (neutral)", () => {
    const { state, meta } = resolveCoverageBadge({
      status: "none",
      supportingContentCount: 0,
    });
    expect(state).toBe("empty");
    expect(meta.label).toBe("Coming soon");
    expect(meta.variant).toBe("neutral");
  });

  it("renders correctly as DOM element with accessibility attributes", () => {
    render(
      <CoverageBadge
        coverage={{
          status: "covered",
          supportingContentCount: 12,
          policyId: "curriculum-coverage-default",
          computedAt: "2026-08-28T00:00:00Z",
        }}
      />,
    );
    expect(screen.getByLabelText(/Practice coverage: Ready to practise/i)).toBeVisible();
  });
});
