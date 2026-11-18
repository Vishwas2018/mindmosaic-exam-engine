import { describe, expect, it } from "vitest";

import { openBadge } from "@/features/landing/programme-badge";
import type { SubjectRow } from "@/features/landing/programme-status";

const row = (status: SubjectRow["status"]): SubjectRow => ({ name: "x", detail: "x", status });

describe("programme detail badge (MT-001)", () => {
  it("says not open when no subject can be started", () => {
    expect(openBadge([{ year: 3, subjects: [row("not_available")] }, { year: 5, subjects: [row("not_available")] }])).toBe(
      "Not open yet — questions are still being reviewed",
    );
  });
  it("names only the years with an open subject, and says some subjects", () => {
    expect(openBadge([{ year: 3, subjects: [row("available"), row("not_available")] }, { year: 5, subjects: [row("not_available")] }])).toBe(
      "Some subjects open for Year 3",
    );
  });
  it("says open only when every subject is open", () => {
    expect(openBadge([{ year: 3, subjects: [row("available")] }, { year: 5, subjects: [row("available")] }])).toBe("Open for Years 3 and 5");
  });
});
