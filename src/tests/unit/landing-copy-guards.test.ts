import { existsSync } from "node:fs";
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
    "Powered by AI",
    "Meet your AI tutor",
    "Questions that adapt to you",
    "adaptive questioning for every child",
    "artificial intelligence that knows your child",
  ])("flags prohibited product claim: %s", (text) => {
    expect(text).toMatch(PROHIBITED_PRODUCT_CLAIMS);
  });

  it.each(["Practise with fixed rules", "Said and daily", "Detailed explanations", "maintain"])(
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

describe("landing content keeps to the guards", () => {
  it("never offers the student-only drill in the parent section", () => {
    expect(JSON.stringify(forParents)).not.toMatch(PARENT_LAUNCHES_DRILL);
  });

  it("describes campaign photography only, never interface or branding", () => {
    for (const image of [hero.image, productTour.image, programHighlights.image, forParents.image]) {
      expect(image.alt).not.toMatch(BAKED_UI_ALT_WORDS);
    }
  });

  it("serves every campaign image from the campaign folder and the file exists", () => {
    for (const image of [hero.image, productTour.image, programHighlights.image, forParents.image]) {
      expect(image.src.startsWith("/landing/campaign/")).toBe(true);
      expect(existsSync(join(process.cwd(), "public", image.src))).toBe(true);
    }
  });

  it("keeps the product story as DOM text, not image text", () => {
    expect(hero.demo.question).toMatch(/12 metres long and 8 metres wide/);
    expect(productTour.flow.map((step) => step.label)).toEqual(["Learn", "Practise", "Progress"]);
  });
});
