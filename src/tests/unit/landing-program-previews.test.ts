import { describe, expect, it } from "vitest";

import { getProgramBySlug } from "@/features/catalogue/catalogue";
import { ICAS_PREVIEW_CORE } from "@/features/landing/components/program-previews/IcasPreview";
import { COMING_SOON_PROGRAMMES } from "@/features/student/components/programmes/programme-catalog";

describe("Chapter 2 preview content stays true to the product", () => {
  it("shows the live catalogue's ICAS programme names and blurbs", () => {
    const slugs = ["icas-g3-numeracy", "icas-g3-reading", "icas-g3-language"];
    ICAS_PREVIEW_CORE.forEach((card, index) => {
      const program = getProgramBySlug(slugs[index]!);
      expect(program, slugs[index]).toBeDefined();
      expect(card.name).toBe(program!.name);
      expect(card.blurb).toBe(program!.blurb);
    });
  });

  it("names the AMC programme as the app's coming-soon page does", () => {
    const amc = COMING_SOON_PROGRAMMES.find((programme) => programme.slug === "australian-maths-competition")!;
    expect(amc.fullTitle).toBe("AMC (Australian Mathematics Competition)");
    expect(amc.focusAreas.map((area) => area.title)).toContain("Non-routine arithmetic & patterns");
  });
});
