import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BAKED_UI_ALT_WORDS,
  EVERY_TEST_PROMISE,
  PARENT_LAUNCHES_DRILL,
  PROHIBITED_PRODUCT_CLAIMS,
  TEN_QUESTION_DRILL,
} from "@/features/landing/copy-guards";
import { forParents, hero, productTour, programHighlights } from "@/features/landing/content";

/*
 * Negative controls: each guard must demonstrably fire on a known-bad
 * string, otherwise a green "never says X" test proves nothing. (An earlier
 * version of these patterns contained literal backspace characters in place
 * of \b and could never match.)
 */
describe("landing copy guards can actually fail", () => {
  it.each([
    "AI tutor",
    "Powered by AI",
    "Powered by A.I.",
    "A.I. tutor",
    "using A.I.",
    "using A.I. to teach",
    "Meet your AI tutor",
    "Questions that adapt to you",
    "adaptive questioning",
    "adaptive questioning for every child",
    "artificial intelligence",
    "artificial intelligence that knows your child",
  ])("flags prohibited product claim: %s", (text) => {
    expect(text).toMatch(PROHIBITED_PRODUCT_CLAIMS);
  });

  it.each([
    "Practise with fixed rules",
    "Said and daily",
    "Detailed explanations",
    "maintain",
    "Mia, I think a i is two letters",
    "a. i. am here",
    "email and fair play",
    "A.Is are not something we say",
    "Plain and simple",
  ])(
    "does not flag innocent text: %s",
    (text) => {
      expect(text).not.toMatch(PROHIBITED_PRODUCT_CLAIMS);
    },
  );

  it.each(["a 10-question fractions set", "ten questions on fractions", "10 question drill"])(
    "flags a ten-question drill: %s",
    (text) => {
      expect(text).toMatch(TEN_QUESTION_DRILL);
    },
  );

  it.each(["a five-question set", "5 questions on fractions", "a 15-question paper"])(
    "does not flag five-question copy: %s",
    (text) => {
      expect(text).not.toMatch(TEN_QUESTION_DRILL);
    },
  );

  it.each(["Every test's results list the skills", "after every test you get a drill", "Each test's results show"])(
    "flags an every-test promise: %s",
    (text) => {
      expect(text).toMatch(EVERY_TEST_PROMISE);
    },
  );

  it("flags a parent-side drill offer and baked-UI alt text", () => {
    expect("offer a five-question set to practise them").toMatch(PARENT_LAUNCHES_DRILL);
    expect("a 5 questions drill").toMatch(PARENT_LAUNCHES_DRILL);
    expect("A laptop showing a MindMosaic dashboard").toMatch(BAKED_UI_ALT_WORDS);
    expect("A student at a desk with a logo on the wall").toMatch(BAKED_UI_ALT_WORDS);
    expect("Two students smile as they work together").not.toMatch(BAKED_UI_ALT_WORDS);
  });
});

/*
 * Twice now a regex escape (\b) was written through a script that turned it
 * into a literal backspace (U+0008), silently disabling the check. A stray
 * control character in landing source or its tests is therefore a failure.
 * Tab, newline and carriage return are the only ones allowed.
 */
describe("landing sources contain no stray control characters", () => {
  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) return walk(full);
      return /\.(?:ts|tsx|css)$/.test(name) ? [full] : [];
    });
  }
  const root = process.cwd();
  const files = [
    ...walk(join(root, "src", "features", "landing")),
    ...walk(join(root, "src", "tests", "unit")).filter((file) => /landing/.test(file)),
    ...walk(join(root, "src", "tests", "components")).filter((file) => /landing/.test(file)),
    join(root, "e2e", "landing.spec.ts"),
  ];

  it("scans a meaningful set of files", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("finds no control characters other than tab, newline and carriage return", () => {
    const offenders = files.filter((file) => {
      const text = readFileSync(file, "utf8");
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code < 32 && code !== 9 && code !== 10 && code !== 13) return true;
      }
      return false;
    });
    expect(offenders).toEqual([]);
  });

  it("would catch a backspace (negative control)", () => {
    const text = "expect(x).toMatch(/" + String.fromCharCode(8) + "AI" + String.fromCharCode(8) + "/)";
    const hasControl = [...text].some((ch) => ch.charCodeAt(0) < 32 && ![9, 10, 13].includes(ch.charCodeAt(0)));
    expect(hasControl).toBe(true);
  });
});

describe("landing content keeps to the guards", () => {
  it("never offers the student-only drill in the parent section", () => {
    expect(JSON.stringify(forParents)).not.toMatch(PARENT_LAUNCHES_DRILL);
  });

  /*
   * The parent view aggregates results by subject (summary.ts bySubject) and
   * lists individual attempts. It has no program-level aggregation, so no
   * parent copy may promise patterns or comparisons across programs.
   */
  it("promises only subject-level patterns in the parent section, never cross-program ones", () => {
    const parentCopy = JSON.stringify(forParents);
    expect(parentCopy).not.toMatch(/\bacross (?:\w+ )*programs?\b/i);
    expect(parentCopy).not.toMatch(/\bprograms? (?:patterns?|comparisons?)\b/i);
    expect(parentCopy).toMatch(/across subjects/i);
    expect("patterns across subjects and programs").toMatch(/\bacross (?:\w+ )*programs?\b/i);
  });

  it("describes campaign photography only, never interface or branding", () => {
    for (const image of [...hero.slides, productTour.image, programHighlights.image, forParents.image]) {
      expect(image.alt).not.toMatch(BAKED_UI_ALT_WORDS);
    }
  });

  /*
   * docs/design.md §39.2: prefer compositions where a child's face is not the
   * focal point, and cap face-visible shots at 1-2 per page. Every campaign
   * image declares a `treatment`, so this is checkable without inspecting
   * pixels. The intended split is: hero Learn and parent show people; the tour and
   * programs visuals are hands-only.
   */
  describe("photography follows docs/design.md section 39.2", () => {
    /*
     * §39.2 applies to the WHOLE landing page. This is the single list of every
     * campaign photograph the page can show: each hero slide, plus the tour,
     * programs and parent images. The face-visible budget is checked across
     * all of them together, never per section.
     */
    const landingCampaign: ReadonlyArray<{ name: string; image: { treatment: string; alt: string; src: string } }> = [
      ...hero.slides.map((slide) => ({ name: `hero:${slide.id}`, image: slide })),
      { name: "tour", image: productTour.image },
      { name: "programs", image: programHighlights.image },
      { name: "parent", image: forParents.image },
    ];
    const faceVisible = landingCampaign.filter(({ image }) => image.treatment === "face-visible");

    it("declares a known treatment for every campaign image", () => {
      for (const { image } of landingCampaign) {
        expect(["face-visible", "hands-only", "abstract"]).toContain(image.treatment);
      }
    });

    it("shows at most two face-visible photographs across the whole landing page", () => {
      expect(faceVisible.length).toBeLessThanOrEqual(2);
    });

    it("spends that face-visible budget on exactly the hero Learn slide and the parent photo", () => {
      expect(faceVisible.map(({ name }) => name)).toEqual(["hero:learn", "parent"]);
    });

    it("keeps the hero a six-slide campaign", () => {
      expect(hero.slides).toHaveLength(6);
    });

    it("keeps the tour and programs visuals hands-only", () => {
      expect(productTour.image.treatment).toBe("hands-only");
      expect(programHighlights.image.treatment).toBe("hands-only");
    });

    it("gives decorative imagery an empty alt and information-bearing imagery a real one", () => {
      expect(programHighlights.image.alt).toBe("");
      for (const { name, image } of landingCampaign) {
        if (name !== "programs") expect(image.alt.length).toBeGreaterThan(10);
      }
    });

    it("never describes a face-free image as showing a face or person's expression", () => {
      for (const { image } of landingCampaign.filter(({ image: i }) => i.treatment !== "face-visible")) {
        expect(image.alt).not.toMatch(/\b(?:face|faces|smil\w*|portrait|student smiles|smile)\b/i);
      }
    });
  });

  it("serves every campaign image from the campaign folder and the file exists", () => {
    for (const image of [...hero.slides, productTour.image, programHighlights.image, forParents.image]) {
      expect(image.src.startsWith("/landing/campaign/")).toBe(true);
      expect(existsSync(join(process.cwd(), "public", image.src))).toBe(true);
    }
  });

  it("keeps the product story as DOM text, not image text", () => {
    expect(hero.demo.question).toMatch(/12 metres long and 8 metres wide/);
    expect(productTour.flow.map((step) => step.label)).toEqual(["Learn", "Practise", "Progress"]);
  });
});
