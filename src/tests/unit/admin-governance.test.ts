// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  ACTIVITY_PAGE_SIZE,
  parseActivityQuery,
  queryActivity,
  type AdminActivityEvent,
} from "@/features/admin/activity-query";
import {
  getAdminActivityEvents,
  getAdminPaper,
  getAdminPapers,
  getAdminPublication,
  getAdminWriting,
} from "@/server/admin-governance-data";

function event(id: string, at: string, actor: string, action: AdminActivityEvent["action"]): AdminActivityEvent {
  return { id, at, actor, action, target: id };
}

describe("admin activity query", () => {
  const events = [
    event("a", "2026-11-10T01:00:00.000Z", "Ada", "approved"),
    event("b", "2026-11-12T01:00:00.000Z", "System", "published"),
    event("c", "2026-11-14T01:00:00.000Z", "Ada", "writing_approved"),
  ];
  const q = (raw: Record<string, string>) => parseActivityQuery(raw);

  it("filters by who, action and an inclusive date range", () => {
    expect(queryActivity(events, q({ actor: "Ada" })).rows.map((e) => e.id)).toEqual(["a", "c"]);
    expect(queryActivity(events, q({ action: "published" })).rows.map((e) => e.id)).toEqual(["b"]);
    expect(queryActivity(events, q({ from: "2026-11-11", to: "2026-11-12" })).rows.map((e) => e.id)).toEqual(["b"]);
    expect(queryActivity(events, q({ from: "2026-11-15" })).total).toBe(0);
  });

  it("ignores values it does not recognise and pages", () => {
    expect(q({ action: "<x>", from: "yesterday", page: "-1" })).toMatchObject({ action: "", from: "", page: 1 });
    const many = Array.from({ length: ACTIVITY_PAGE_SIZE + 5 }, (_, i) => event(`e${i}`, "2026-11-10T00:00:00.000Z", "Ada", "approved"));
    expect(queryActivity(many, q({ page: "2" })).rows).toHaveLength(5);
    expect(queryActivity(many, q({ page: "9" })).page).toBe(2);
  });
});

/* Reads the real bank, approval records and manifests. */
describe("admin governance data", () => {
  it("lists every practice paper shape with real readiness and consistent counts", () => {
    const papers = getAdminPapers();
    expect(papers.length).toBeGreaterThan(10);
    for (const p of papers) {
      expect(["ready", "short", "unavailable"]).toContain(p.state);
      expect(p.availableCount).toBeLessThanOrEqual(p.questionCount);
      if (p.state === "ready") expect(p.availableCount).toBe(p.questionCount);
    }
    const first = papers[0]!;
    expect(getAdminPaper(first.id)?.label).toBe(first.label);
    expect(getAdminPaper("no-such-paper")).toBeNull();
  });

  it("answers a per-question publication check from the real records", () => {
    const events = getAdminActivityEvents();
    const approvedId = events.find((e) => e.action === "approved")!.target;
    const approved = getAdminPublication(approvedId).check!;
    expect(approved).toMatchObject({ id: approvedId, inBank: true, approved: true });
    expect(approved.approvedBy).toBeTruthy();
    const missing = getAdminPublication("no-such-question").check!;
    expect(missing).toMatchObject({ inBank: false, approved: false, inManifest: false, served: false });
    expect(getAdminPublication().check).toBeNull();
  });

  it("groups the publication history by batch without losing manifests", () => {
    const data = getAdminPublication();
    expect(data.batches.reduce((n, b) => n + b.count, 0)).toBe(data.totals.manifests);
    const times = data.batches.map((b) => b.publishedAt);
    expect([...times].sort().reverse()).toEqual(times);
  });

  it("builds activity from approvals and publications, newest first, naming System for automated steps", () => {
    const events = getAdminActivityEvents();
    expect(events.length).toBeGreaterThan(0);
    const times = events.map((e) => e.at);
    expect([...times].sort().reverse()).toEqual(times);
    expect(events.filter((e) => e.action === "published").every((e) => e.actor === "System")).toBe(true);
    expect(events.filter((e) => e.action === "approved").every((e) => e.actor !== "System")).toBe(true);
  });

  it("lists approved writing prompts only from verified approval records", () => {
    const { prompts, problems } = getAdminWriting();
    expect(Array.isArray(problems)).toBe(true);
    for (const p of prompts) {
      expect(p.approvedBy).toBeTruthy();
      expect(p.id).toMatch(/^[a-z0-9]/);
    }
  });
});
