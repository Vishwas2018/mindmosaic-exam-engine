import { describe, expect, it } from "vitest";

import {
  compareChildren,
  hasResults,
  pickDefaultChildIndex,
} from "@/features/parent-dashboard/default-child";
import type { ChildProfile, ChildSummary } from "@/features/parent-dashboard/summary";

/*
 * Regression cover for a real incident: a parent had two children with the
 * same display name — one an accidental duplicate that had never been signed
 * into and had no exam data at all — and the dashboard opened on the empty
 * one, reporting "No exams from Child A yet" while two completed attempts sat
 * on the sibling. Two defects: the order of same-named children depended on
 * the order Postgres returned rows in, and the default was always index 0.
 */

type Child = Pick<ChildProfile, "id" | "displayName" | "createdAt">;
type Summary = Pick<ChildSummary, "attemptCount" | "unreadableAttemptCount">;

const child = (id: string, displayName: string | null, createdAt: string): Child => ({
  id,
  displayName,
  createdAt,
});
const summary = (attemptCount: number, unreadableAttemptCount = 0): Summary => ({
  attemptCount,
  unreadableAttemptCount,
});

/** Deterministic shuffles, so a failure reproduces rather than flakes. */
function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const perm of permutations(rest)) out.push([item, ...perm]);
  });
  return out;
}

describe("compareChildren", () => {
  it("orders by display name first, so the switcher still reads alphabetically", () => {
    const sorted = [
      child("c", "Child B", "2026-07-26T10:46:02Z"),
      child("a", "Aarav", "2026-07-26T10:45:43Z"),
      child("b", "Child A", "2026-07-26T10:51:02Z"),
    ].sort(compareChildren);
    expect(sorted.map((c) => c.displayName)).toEqual(["Aarav", "Child A", "Child B"]);
  });

  /*
   * The original bug in one assertion: two identical names made localeCompare
   * return 0, and a stable sort then preserved whatever order the rows
   * arrived in — from a query with no ORDER BY.
   */
  it("breaks a same-name tie by creation time, oldest first", () => {
    const older = child("older", "Child A", "2026-07-26T10:45:43.640Z");
    const newer = child("newer", "Child A", "2026-07-26T10:51:02.387Z");
    expect([newer, older].sort(compareChildren).map((c) => c.id)).toEqual(["older", "newer"]);
    expect([older, newer].sort(compareChildren).map((c) => c.id)).toEqual(["older", "newer"]);
  });

  it("falls back to id when name and creation time are both identical", () => {
    const a = child("aaa", "Child A", "2026-07-26T10:45:43.640Z");
    const b = child("bbb", "Child A", "2026-07-26T10:45:43.640Z");
    expect([b, a].sort(compareChildren).map((c) => c.id)).toEqual(["aaa", "bbb"]);
  });

  it("produces the same order from every possible input order", () => {
    const children = [
      child("dup-new", "Child A", "2026-07-26T10:51:02.387Z"),
      child("dup-old", "Child A", "2026-07-26T10:45:43.640Z"),
      child("sibling", "Child B", "2026-07-26T10:46:02.600Z"),
    ];
    const orders = permutations(children).map((perm) =>
      [...perm].sort(compareChildren).map((c) => c.id).join(","),
    );
    expect(new Set(orders).size).toBe(1);
    expect(orders[0]).toBe("dup-old,dup-new,sibling");
  });

  it("does not produce NaN comparisons for an unparseable timestamp", () => {
    const bad = child("bad", "Child A", "not-a-date");
    const good = child("good", "Child A", "2026-07-26T10:45:43.640Z");
    expect([bad, good].sort(compareChildren).map((c) => c.id)).toEqual(["good", "bad"]);
    expect([good, bad].sort(compareChildren).map((c) => c.id)).toEqual(["good", "bad"]);
  });

  it("treats a null display name as empty rather than throwing", () => {
    const sorted = [child("b", "Child A", "2026-07-01T00:00:00Z"), child("a", null, "2026-07-01T00:00:00Z")]
      .sort(compareChildren);
    expect(sorted.map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("hasResults", () => {
  it("is false only when the child has no attempts of any kind", () => {
    expect(hasResults(summary(0))).toBe(false);
    expect(hasResults(summary(1))).toBe(true);
  });

  /*
   * An attempt whose stored result failed validation still means the child
   * sat an exam, and the dashboard surfaces it explicitly — far better than
   * defaulting silently past them to a sibling.
   */
  it("counts unreadable attempts as results", () => {
    expect(hasResults(summary(0, 2))).toBe(true);
  });
});

describe("pickDefaultChildIndex", () => {
  /* The exact production shape: same name, duplicate first, results second. */
  it("prefers a child with results over a same-named sibling with none", () => {
    const summaries = [summary(0), summary(2)];
    expect(pickDefaultChildIndex(summaries)).toBe(1);
  });

  it("prefers a child with results over any earlier child with none", () => {
    expect(pickDefaultChildIndex([summary(0), summary(0), summary(3)])).toBe(2);
  });

  it("keeps the first child when nobody has results yet", () => {
    expect(pickDefaultChildIndex([summary(0), summary(0)])).toBe(0);
  });

  it("keeps the first child when everyone has results", () => {
    expect(pickDefaultChildIndex([summary(1), summary(9)])).toBe(0);
  });

  it("returns 0 for an empty list so callers can index without a guard", () => {
    expect(pickDefaultChildIndex([])).toBe(0);
  });

  /*
   * End to end over the real household: sort the children, then pick. The
   * answer must be Child A-with-results no matter what order the rows arrive
   * in — that arrival order is exactly what used to decide it.
   */
  it("selects the Child A with results from every possible row order", () => {
    const roster = [
      { child: child("dup", "Child A", "2026-07-26T10:45:43.640Z"), summary: summary(0) },
      { child: child("real", "Child A", "2026-07-26T10:51:02.387Z"), summary: summary(2) },
      { child: child("sibling", "Child B", "2026-07-26T10:46:02.600Z"), summary: summary(0) },
    ];

    for (const perm of permutations(roster)) {
      const sorted = [...perm].sort((a, b) => compareChildren(a.child, b.child));
      const index = pickDefaultChildIndex(sorted.map((entry) => entry.summary));
      expect(sorted.map((entry) => entry.child.id)).toEqual(["dup", "real", "sibling"]);
      expect(sorted[index].child.id).toBe("real");
    }
  });
});
