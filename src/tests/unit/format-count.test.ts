import { describe, expect, it } from "vitest";

import { countLabel, plural } from "@/lib/format-count";

describe("countLabel / plural (MT-007)", () => {
  it("uses singular only for exactly 1", () => {
    expect(countLabel(1, "question")).toBe("1 question");
    expect(plural(1, "question")).toBe("question");
  });

  it("uses plural for 0 and many", () => {
    expect(countLabel(0, "question")).toBe("0 questions");
    expect(countLabel(2, "question")).toBe("2 questions");
    expect(countLabel(499, "question")).toBe("499 questions");
  });

  it("supports irregular plurals", () => {
    expect(countLabel(1, "strategy", "strategies")).toBe("1 strategy");
    expect(countLabel(3, "strategy", "strategies")).toBe("3 strategies");
  });
});
