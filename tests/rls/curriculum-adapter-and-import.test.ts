import type { Client } from "pg";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  CurriculumImportError,
  importCurriculumManifest,
  PostgresCurriculumCatalogue,
  SYNTHETIC_CONFLICTING_MANIFEST,
  SYNTHETIC_DISPLAY_LICENSED_MANIFEST,
  SYNTHETIC_NATIONAL_MANIFEST,
  SYNTHETIC_STORE_ONLY_MANIFEST,
  SYNTHETIC_VIC_MANIFEST,
} from "@/server/curriculum";

import { connect } from "./db";
import { asAnon, asAuthenticated, seed, STUDENT_A } from "./fixtures";

let client: Client;

const CURRICULUM_TABLES = [
  "curriculum_jurisdictions",
  "curriculum_licence_evidence",
  "curriculum_sources",
  "curriculum_releases",
  "curriculum_nodes",
  "curriculum_applicabilities",
  "curriculum_crosswalks",
  "curriculum_taxonomy_alignments",
  "curriculum_review_events",
] as const;

async function savepoint(body: () => Promise<void>): Promise<void> {
  await client.query("savepoint curr_adapter_sp");
  try {
    await body();
  } finally {
    await client.query("rollback to savepoint curr_adapter_sp");
    await client.query("release savepoint curr_adapter_sp");
  }
}

beforeEach(async () => {
  client = await connect();
  await client.query("begin");
  await seed(client);
});

afterEach(async () => {
  await client.query("rollback");
  await client.end();
});

describe("curriculum RLS role boundary enforcement", () => {
  it("denies anon access to all curriculum tables", async () => {
    await asAnon(client);
    for (const table of CURRICULUM_TABLES) {
      await savepoint(async () => {
        await expect(client.query(`select 1 from public.${table} limit 1`)).rejects.toMatchObject({
          code: "42501",
        });
      });
    }
  });

  it("denies authenticated student access to all curriculum tables", async () => {
    await asAuthenticated(client, STUDENT_A);
    for (const table of CURRICULUM_TABLES) {
      await savepoint(async () => {
        await expect(client.query(`select 1 from public.${table} limit 1`)).rejects.toMatchObject({
          code: "42501",
        });
      });
    }
  });
});

describe("curriculum import pipeline — transactional execution & idempotency", () => {
  it("performs dry-run without persisting rows", async () => {
    const report = await importCurriculumManifest(SYNTHETIC_NATIONAL_MANIFEST, {
      mode: "dry_run",
      client,
    });

    expect(report.success).toBe(true);
    expect(report.mode).toBe("dry_run");
    expect(report.counts.nodesInserted).toBe(3);

    // Verify nothing was persisted to database
    const nodesCount = await client.query(
      `select count(*)::int as count from public.curriculum_nodes where release_id = $1`,
      [SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseId],
    );
    expect(nodesCount.rows[0]?.count).toBe(0);
  });

  it("applies manifest and supports idempotent replay", async () => {
    const firstReport = await importCurriculumManifest(SYNTHETIC_NATIONAL_MANIFEST, {
      mode: "apply",
      client,
    });

    expect(firstReport.success).toBe(true);
    expect(firstReport.counts.evidenceInserted).toBe(1);
    expect(firstReport.counts.sourcesInserted).toBe(1);
    expect(firstReport.counts.releasesInserted).toBe(1);
    expect(firstReport.counts.nodesInserted).toBe(3);
    expect(firstReport.counts.applicabilitiesInserted).toBe(3);

    // Re-import exact same manifest: must succeed with 0 inserts and all skipped
    const replayReport = await importCurriculumManifest(SYNTHETIC_NATIONAL_MANIFEST, {
      mode: "apply",
      client,
    });

    expect(replayReport.success).toBe(true);
    expect(replayReport.counts.evidenceInserted).toBe(0);
    expect(replayReport.counts.evidenceSkipped).toBe(1);
    expect(replayReport.counts.sourcesInserted).toBe(0);
    expect(replayReport.counts.sourcesSkipped).toBe(1);
    expect(replayReport.counts.releasesInserted).toBe(0);
    expect(replayReport.counts.releasesSkipped).toBe(1);
    expect(replayReport.counts.nodesInserted).toBe(0);
    expect(replayReport.counts.nodesSkipped).toBe(3);
    expect(replayReport.counts.applicabilitiesInserted).toBe(0);
    expect(replayReport.counts.applicabilitiesSkipped).toBe(3);
  });

  it("rejects conflicting release replay and preserves database integrity", async () => {
    await importCurriculumManifest(SYNTHETIC_NATIONAL_MANIFEST, {
      mode: "apply",
      client,
    });

    await expect(
      importCurriculumManifest(SYNTHETIC_CONFLICTING_MANIFEST, {
        mode: "apply",
        client,
      }),
    ).rejects.toThrowError(CurriculumImportError);

    // Verify original release remains unaltered
    const releaseRow = await client.query(
      `select title, release_version from public.curriculum_releases where release_key = $1`,
      [SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseKey],
    );
    expect(releaseRow.rows[0]?.title).toBe(SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.title);
  });
});

describe("PostgresCurriculumCatalogue — query filters & pagination", () => {
  beforeEach(async () => {
    await importCurriculumManifest(SYNTHETIC_NATIONAL_MANIFEST, { mode: "apply", client });
    await importCurriculumManifest(SYNTHETIC_VIC_MANIFEST, { mode: "apply", client });
    await importCurriculumManifest(SYNTHETIC_DISPLAY_LICENSED_MANIFEST, { mode: "apply", client });
    await importCurriculumManifest(SYNTHETIC_STORE_ONLY_MANIFEST, { mode: "apply", client });
  });

  it("filters by jurisdiction and school sector", async () => {
    const catalogue = new PostgresCurriculumCatalogue({ client });

    const nationalResult = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
    });
    expect(nationalResult.items.length).toBeGreaterThanOrEqual(3);
    for (const item of nationalResult.items) {
      expect(item.release.jurisdictionCode).toBe("AU");
      expect(item.release.schoolSectors).toContain("government");
    }

    const vicResult = await catalogue.query({
      jurisdictionCode: "VIC",
      schoolSector: "government",
    });
    expect(vicResult.items).toHaveLength(1);
    expect(vicResult.items[0]!.node.nodeKey).toBe("syn-vic-l3-num-01");
    expect(vicResult.items[0]!.applicability[0]!.levelCodes).toContain("SYN-VIC-L3");
  });

  it("filters by node kind and parent node ID", async () => {
    const catalogue = new PostgresCurriculumCatalogue({ client });
    const learningAreaResult = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      nodeKinds: ["learning_area"],
    });

    expect(learningAreaResult.items).toHaveLength(1);
    const parentNodeId = learningAreaResult.items[0]!.node.nodeId;

    const childrenResult = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      parentNodeId,
    });

    expect(childrenResult.items).toHaveLength(2);
    for (const child of childrenResult.items) {
      expect(child.node.parentNodeId).toBe(parentNodeId);
    }
  });

  it("supports deterministic cursor-based pagination", async () => {
    const catalogue = new PostgresCurriculumCatalogue({ client });

    const page1 = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      pageSize: 2,
    });

    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      pageSize: 2,
      cursor: page1.nextCursor!,
    });

    expect(page2.items.length).toBeGreaterThanOrEqual(1);
    // Ensure disjoint pages (no duplicated items)
    const page1Ids = new Set(page1.items.map((i) => i.node.nodeId));
    for (const item of page2.items) {
      expect(page1Ids.has(item.node.nodeId)).toBe(false);
    }
  });

  it("suppresses official text for metadata-only and store-only sources", async () => {
    const catalogue = new PostgresCurriculumCatalogue({ client });

    // Store-only source
    const storeOnlyResult = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      releaseIds: [SYNTHETIC_STORE_ONLY_MANIFEST.releases[0]!.releaseId],
      includeOfficialText: true,
    });

    expect(storeOnlyResult.items).toHaveLength(1);
    expect(storeOnlyResult.items[0]!.source.licence.officialTextAccess).toBe("store_only");
    expect(storeOnlyResult.items[0]!.node.officialText).toBeUndefined();

    // Metadata-only source
    const metadataResult = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      releaseIds: [SYNTHETIC_NATIONAL_MANIFEST.releases[0]!.releaseId],
      includeOfficialText: true,
    });

    for (const item of metadataResult.items) {
      expect(item.node.officialText).toBeUndefined();
    }
  });

  it("projects official text only for verified display licence", async () => {
    const catalogue = new PostgresCurriculumCatalogue({ client });

    const displayResult = await catalogue.query({
      jurisdictionCode: "AU",
      schoolSector: "government",
      releaseIds: [SYNTHETIC_DISPLAY_LICENSED_MANIFEST.releases[0]!.releaseId],
      includeOfficialText: true,
    });

    expect(displayResult.items).toHaveLength(1);
    const item = displayResult.items[0]!;
    expect(item.source.licence.officialTextAccess).toBe("display");
    expect(item.licenceEvidence.permitsDisplay).toBe(true);
    expect(item.node.officialText).toBeDefined();
    expect(item.node.officialText?.text).toContain("Synthetic licensed text");
  });

  it("retrieves release by ID via getRelease", async () => {
    const catalogue = new PostgresCurriculumCatalogue({ client });
    const releaseId = SYNTHETIC_VIC_MANIFEST.releases[0]!.releaseId;

    const release = await catalogue.getRelease(releaseId);
    expect(release).not.toBeNull();
    expect(release!.releaseKey).toBe(SYNTHETIC_VIC_MANIFEST.releases[0]!.releaseKey);
    expect(release!.jurisdictionCode).toBe("VIC");
  });
});
