// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getAdminLibraryRows, getAdminOverviewData, getAdminQuestionDetail } from "@/server/admin-library-data";

/* Reads the real authored bank and the real approval records; nothing here is mocked data. */
describe("admin overview and library data", () => {
  const rows = getAdminLibraryRows();
  const overview = getAdminOverviewData();

  it("counts every authored question once, approved plus awaiting", () => {
    expect(rows.length).toBeGreaterThan(0);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    expect(overview.authored).toBe(rows.length);
    expect(overview.approved + overview.awaitingPerson).toBe(overview.authored);
    expect(overview.approved).toBe(rows.filter((r) => r.status === "approved").length);
  });

  it("splits publication status by programme group without losing or inventing questions", () => {
    expect(overview.programmes.reduce((n, p) => n + p.authored, 0)).toBe(overview.authored);
    for (const programme of overview.programmes) {
      expect(programme.approved).toBeLessThanOrEqual(programme.authored);
      expect(programme.served).toBeLessThanOrEqual(programme.authored);
    }
  });

  it("states what the queues without data are waiting for instead of inventing a number", () => {
    for (const section of [overview.flagged, overview.writing, overview.reports]) {
      expect(section.isAvailable).toBe(false);
      expect(section.reason).toBeTruthy();
    }
    expect(overview.flagged.count).toBeUndefined();
  });

  it("never puts an answer key or explanation on a library row", () => {
    const keys = new Set(rows.flatMap((r) => Object.keys(r)));
    expect([...keys].sort()).toEqual(
      ["id", "prompt", "programme", "programmeLabel", "revision", "served", "status", "strand", "subject", "yearLevel"]
        .filter((k) => keys.has(k))
        .sort(),
    );
    expect(keys.has("answerKey")).toBe(false);
    expect(keys.has("explanation")).toBe(false);
  });

  it("returns the full record for one question and nothing for an unknown id", () => {
    const first = rows[0]!;
    const detail = getAdminQuestionDetail(first.id);
    expect(detail?.question.id).toBe(first.id);
    expect(detail?.row.status).toBe(first.status);
    expect(getAdminQuestionDetail("no-such-question")).toBeNull();
  });
});
