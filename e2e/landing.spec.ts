import { expect, test } from "@playwright/test";
import { PUBLIC_SIGNUP_ENABLED } from "../src/features/auth/signup-policy";
import { cinematicMotion } from "../src/features/landing/cinematic/config";
import { PROHIBITED_PRODUCT_CLAIMS } from "../src/features/landing/copy-guards";

/*
 * The October 2026 home-page redesign: nine sections telling one story —
 * learn, practise, prepare, understand progress. The header carries five
 * real destinations (/programs and /how-it-works landed in public-pages
 * Step 4). Every assertion below checks a fact, not a layout: real
 * routes, real status labels, and no claim the product can't back.
 */

/** Every header link, and the route it must reach. */
const HEADER_LINKS: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Programs", "/programs"],
  ["How It Works", "/how-it-works"],
  ["Plans", "/pricing"],
  ["Resources", "/resources"],
  ["About", "/about"],
];

test.describe("home page", () => {
  test("every header link reaches a real page, not a 404", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, href] of HEADER_LINKS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const response = await page.request.get(href);
      expect(response.ok(), `${href} should resolve, not 404`).toBeTruthy();
    }
  });

  test("the header CTA reads 'Start free' and links to the primary entry route", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("banner").getByRole("link", { name: "Start free", exact: true });
    await expect(cta).toHaveAttribute("href", PUBLIC_SIGNUP_ENABLED ? "/sign-up" : "/practice");
  });

  test("the hero states the two-line promise, both CTAs and the availability line", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toContainText("Learn with purpose.");
    await expect(hero).toContainText("Practise with confidence.");
    await expect(page.getByRole("link", { name: "Explore programs" }).first()).toBeVisible();
    await expect(page.getByText(/Available now: NAPLAN-style and ICAS-style/)).toBeVisible();
  });

  test("Chapter 1 is a six-scene scroll story: scene copy and photographs, no slideshow, timers or pause control", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const chapter = page.locator('section[data-chapter="1"]');
    await expect(chapter.locator("[data-scene-copy]")).toHaveCount(6);
    await expect(chapter.locator("[data-scene-layer]")).toHaveCount(6);
    await expect(chapter.locator("[data-scene-layer] img").first()).toHaveAttribute("src", /ch01-scene-01-learn-v1/);
    // The only buttons are the six scene navigator buttons.
    await expect(chapter.getByRole("button")).toHaveCount(6);
    await expect(page.getByRole("group", { name: /slide/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /slideshow|pause|play/i })).toHaveCount(0);
  });

  test("Chapter 1 has no horizontal overflow and hands off to Chapter 2", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("heading", { level: 2, name: "Choose your pathway." })).toBeAttached();
  });

  test("the story runs Chapter 1, Chapter 2 (programmes, then its hand-off), then Chapter 3, then Chapter 4", async ({ page }) => {
    await page.goto("/");
    const tops = await page.evaluate(() => {
      const top = (text: string) => {
        const heading = [...document.querySelectorAll("h1, h2, h3, p")].find((el) => el.textContent?.trim() === text);
        return heading ? heading.getBoundingClientRect().top + window.scrollY : Number.NaN;
      };
      return [
        top("Choose your pathway."),
        top("NAPLAN-style practice"),
        top("See how MindMosaic works."),
        top("One concept. Four connected steps."),
        top("Progress that stays understandable."),
      ];
    });
    expect(tops.every(Number.isFinite)).toBe(true);
    // Chapter 2's layers share one pinned stage (so their order is scroll order, not page position);
    // all of them sit after the Chapter 1 hero and before the product tour.
    const heroBottom = await page.evaluate(() => {
      const hero = document.querySelector('section[data-chapter="1"]')!.getBoundingClientRect();
      return hero.bottom + window.scrollY;
    });
    for (const top of tops.slice(0, 3)) {
      expect(top).toBeGreaterThanOrEqual(heroBottom - 1);
      expect(top).toBeLessThan(tops[3]!);
    }
    expect(tops[4]!).toBeGreaterThan(tops[3]!);
    await expect(page.getByText("Find the right program.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Clearer support for parents." })).toHaveCount(0);
  });

  test("Chapter 1 pins on desktop, unpins when the window narrows, and never pins under reduced motion", async ({
    page,
  }) => {
    const stagePosition = () =>
      page.evaluate(() => getComputedStyle(document.querySelector('section[data-chapter="1"] > div')!).position);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    expect(await stagePosition()).toBe("sticky");
    await page.setViewportSize({ width: 800, height: 900 });
    expect(await stagePosition()).toBe("relative");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    expect(await stagePosition()).toBe("static");
  });

  test("Chapter 1 changes scene copy and photograph with scroll alone, without ever zooming a photograph", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const state = () =>
      page.evaluate(() => {
        const copies = [...document.querySelectorAll<HTMLElement>('section[data-chapter="1"] [data-scene-copy]')];
        const layer = document.querySelector<HTMLElement>('section[data-chapter="1"] [data-scene-layer]')!;
        return {
          currentCopy: copies.findIndex((el) => el.getAttribute("aria-hidden") !== "true"),
          layerTransform: getComputedStyle(layer).transform,
        };
      });
    await page.goto("/");
    await expect.poll(async () => (await state()).currentCopy).toBe(0);
    // Scene 2 holds from t = 1, i.e. one sixth of the pinned travel (380svh of 900px).
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      const s = document.querySelector('section[data-chapter="1"]')!;
      window.scrollTo({ top: (1.2 / 6) * (s.getBoundingClientRect().height - innerHeight), behavior: "instant" });
    });
    await expect.poll(async () => (await state()).currentCopy).toBe(1);
    // Photographs never scale or pan: no transform on any layer.
    expect((await state()).layerTransform).toBe("none");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.mouse.wheel(0, 650);
    // Reduced motion: nothing is choreographed, scene 1 stays and the rest are in the readable list.
    await expect.poll(async () => (await state()).currentCopy).toBe(0);
    await expect(page.locator('section[data-chapter="1"] article')).toHaveCount(5);
  });

  test("Chapter 2 replaces the old Programs section and shows real status for every programme", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Find the right program." })).toHaveCount(0);
    const chapter = page.locator('section[data-chapter="2"]');
    for (const [scene, status] of [
      ["naplan", "Available now · Years 3 & 5"],
      ["icas", "Available now · Years 3 & 5"],
      ["curriculum", "Limited · Years 3 & 5"],
      ["amc", "In development"],
      ["singapore", "In development"],
      ["selective", "In development"],
    ] as const) {
      await expect(chapter.locator(`[data-scene="${scene}"]`)).toContainText(status);
    }
  });

  test("Chapter 4 replaces the old ForParents section and shows the sample parent view", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Clearer support for parents." })).toHaveCount(0);
    const chapter = page.locator('section[data-chapter="4"]');
    await expect(chapter).toBeAttached();
    await expect(chapter.getByText("Aisha · Year 3").first()).toBeAttached();
    await expect(chapter.getByText("Sample").first()).toBeAttached();
  });

  test("the trust section links only to real policy pages and shows no invented testimonials", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: "Built carefully. Not generated carelessly." }),
    });
    await expect(section.locator("blockquote")).toHaveCount(0);
    for (const href of ["/privacy", "/accessibility", "/terms", "/assessment-disclaimer"]) {
      await expect(section.locator(`a[href="${href}"]`)).toHaveCount(1);
      const response = await page.request.get(href);
      expect(response.ok(), `${href} should resolve, not 404`).toBeTruthy();
    }
  });

  test("the quality section makes no claim of educator review", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Automated publication checks")).toBeVisible();
    await expect(page.getByText(/educator review|reviewed by teachers/i)).toHaveCount(0);
  });

  test("the FAQ opens and closes on activation, and never shows a real Family price", async ({ page }) => {
    await page.goto("/");
    const first = page.getByRole("button", { name: "Which year levels and programs does MindMosaic support?" });
    await expect(page.getByText(/Curriculum lessons are limited and open to signed-in students/)).toBeHidden();
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/Curriculum lessons are limited and open to signed-in students/)).toBeVisible();
    await first.click();
    await expect(page.getByText(/Curriculum lessons are limited and open to signed-in students/)).toBeHidden();

    await expect(page.getByText("$14.99")).toHaveCount(0);
    await expect(page.getByText("$149")).toHaveCount(0);
  });

  test("the footer wires every column to a real route", async ({ page }) => {
    await page.goto("/");
    for (const [column, label, href] of [
      ["Product", "Plans", "/pricing"],
      ["Programs", "All programs", "/programs"],
      ["Support", "Help and contact", "/help"],
    ] as const) {
      const nav = page.getByRole("navigation", { name: column });
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const response = await page.request.get(href);
      expect(response.ok(), `${href} should resolve, not 404`).toBeTruthy();
    }
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Privacy", exact: true }),
    ).toHaveAttribute("href", "/privacy");
  });

  test("sign-up affordances match the current public signup policy", async ({ page }) => {
    await page.goto("/");
    const count = await page.locator('a[href="/sign-up"]').count();
    if (PUBLIC_SIGNUP_ENABLED) {
      expect(count).toBeGreaterThan(0);
    } else {
      expect(count).toBe(0);
    }
  });

  /*
   * Acceptance bar for this rebuild (handoff/MOTION_SPEC.md /
   * FACT_LOG.md): no horizontal scroll at any of the three reference
   * widths. A single stray full-bleed element (the footer's mosaic
   * strip is the obvious risk, being deliberately edge-to-edge) is
   * enough to introduce one.
   */
  for (const width of [375, 768, 1024, 1440, 1920] as const) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth, `scrollWidth (${scrollWidth}) should not exceed clientWidth (${clientWidth})`).toBeLessThanOrEqual(
        clientWidth,
      );
    });
  }
});


/*
 * Chapter 2: the pinned six-scene programme story. Progress is driven by the
 * page's own scroll, so these tests scroll to chapter progress values rather
 * than wheel through it.
 */
const SCENES = ["naplan", "icas", "curriculum", "amc", "singapore", "selective"] as const;
// Mirrors cinematicMotion.chapter2: the middle of each scene window.
const SCENE_PROGRESS = [0.145, 0.295, 0.445, 0.595, 0.745, 0.89] as const;

type PwPage = import("@playwright/test").Page;

test.describe("Chapter 2 programmes", () => {
  const scrollToProgress = async (page: PwPage, progress: number) => {
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector('section[data-chapter="2"] > div')!).position === "sticky",
    );
    await page.evaluate((q) => {
      const section = document.querySelector('section[data-chapter="2"]') as HTMLElement;
      const heightSvh = (section.offsetHeight / window.innerHeight) * 100;
      const factor = heightSvh / (heightSvh - 100);
      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY + (q / factor) * section.offsetHeight);
    }, progress);
  };

  // A scene's backdrop cross-fades but its text takes turns, so what a visitor sees is the heading's
  // effective opacity (its own times every ancestor's), not the section's.
  const sceneOpacities = (page: PwPage) =>
    page.evaluate(() =>
      [...document.querySelectorAll('section[data-chapter="2"] [data-scene]')].map((scene) => {
        let opacity = 1;
        for (let el: Element | null = scene.querySelector("h3"); el && el !== scene.parentElement; el = el.parentElement) {
          opacity *= Number(getComputedStyle(el).opacity);
        }
        return Number(opacity.toFixed(2));
      }),
    );

  const chapter2Images = (page: PwPage) =>
    page.evaluate(
      () =>
        [...document.querySelectorAll("img")].filter((img) =>
          decodeURIComponent(img.getAttribute("src") ?? "").includes("chapter-02-programs"),
        ).length,
    );

  test("pins a 680svh stage on desktop and shows exactly one scene at each scene progress", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const stage = page.locator('section[data-chapter="2"] > div');
    expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
    const heightSvh = await page.evaluate(() => {
      const section = document.querySelector('section[data-chapter="2"]') as HTMLElement;
      return Math.round((section.offsetHeight / window.innerHeight) * 100);
    });
    expect(heightSvh).toBe(680);

    for (const [index, id] of SCENES.entries()) {
      await scrollToProgress(page, SCENE_PROGRESS[index]!);
      await expect.poll(() => sceneOpacities(page)).toEqual(SCENES.map((_, i) => (i === index ? 1 : 0)));
      await expect(page.locator(`[data-scene="${id}"]`).getByRole("heading", { level: 3 })).toBeVisible();
    }
  });

  test("is not hijacked: ordinary scroll, no snap, no timer advancing scenes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");
    await scrollToProgress(page, SCENE_PROGRESS[0]!);
    const expected = SCENES.map((_, i) => (i === 0 ? 1 : 0));
    await expect.poll(() => sceneOpacities(page)).toEqual(expected);
    await page.waitForTimeout(1500);
    expect(await sceneOpacities(page)).toEqual(expected);
  });

  test("loads photographs on demand, never all six at once", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(await chapter2Images(page)).toBe(0);
    await scrollToProgress(page, SCENE_PROGRESS[0]!);
    await expect.poll(() => chapter2Images(page)).toBeGreaterThan(0);
    expect(await chapter2Images(page)).toBeLessThan(6);
  });

  test("the progress navigator marks the current programme and scrolls normally when used", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await scrollToProgress(page, SCENE_PROGRESS[2]!);
    const nav = page.getByRole("navigation", { name: "Programme progress" });
    await expect(nav.getByRole("button", { name: /Curriculum/ })).toHaveAttribute("aria-current", "step");
    await expect(nav.getByRole("button")).toHaveCount(6);

    const amc = nav.getByRole("button", { name: /AMC/ });
    await amc.focus();
    await page.keyboard.press("Enter");
    await expect(amc).toHaveAttribute("aria-current", "step", { timeout: 5000 });
    await expect(page.locator('[data-scene="amc"]').getByRole("heading", { level: 3 })).toBeVisible();
  });

  test("tabbing into a link in an off-screen scene brings that scene into view", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await scrollToProgress(page, SCENE_PROGRESS[0]!);
    await page.locator('[data-scene="icas"]').getByRole("link", { name: /Explore ICAS-style practice/ }).focus();
    await expect.poll(() => sceneOpacities(page)).toEqual(SCENES.map((_, i) => (i === 1 ? 1 : 0)));
  });

  test("ends on the Chapter 3 hand-off and releases into Chapter 3", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await scrollToProgress(page, 0.99);
    await expect(page.locator('[data-handoff="chapter-3"] p', { hasText: "See how MindMosaic works." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "One concept. Four connected steps." })).toBeAttached();
  });

  for (const width of [375, 768] as const) {
    test(`at ${width}px nothing pins: six readable scenes in natural flow, no overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const stage = page.locator('section[data-chapter="2"] > div');
      expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("relative");
      await expect(page.getByRole("navigation", { name: "Programme progress" })).toHaveCount(0);
      expect(await sceneOpacities(page)).toEqual([1, 1, 1, 1, 1, 1]);
      for (const [index, id] of SCENES.entries()) {
        const scene = page.locator(`[data-scene="${id}"]`);
        await scene.scrollIntoViewIfNeeded();
        await expect(scene.getByRole("heading", { level: 3 })).toBeVisible();
        await expect(scene).toContainText(`0${index + 1} / 06`);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("crossing the 1024px breakpoint switches between pinned and natural flow without reloading", async ({
    page,
  }) => {
    const position = () =>
      page.evaluate(() => getComputedStyle(document.querySelector('section[data-chapter="2"] > div')!).position);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    expect(await position()).toBe("sticky");
    await page.setViewportSize({ width: 1023, height: 900 });
    await expect.poll(position).toBe("relative");
    await expect.poll(() => sceneOpacities(page)).toEqual([1, 1, 1, 1, 1, 1]);
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect.poll(position).toBe("sticky");
  });

  test("reduced motion removes pinning and choreography: every scene is ordinary content", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const stage = page.locator('section[data-chapter="2"] > div');
    expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("static");
    expect(await sceneOpacities(page)).toEqual([1, 1, 1, 1, 1, 1]);
    await expect(page.getByRole("navigation", { name: "Programme progress" })).toHaveCount(0);
    for (const id of SCENES) {
      await page.locator(`[data-scene="${id}"]`).scrollIntoViewIfNeeded();
      await expect(page.locator(`[data-scene="${id}"]`).getByRole("heading", { level: 3 })).toBeVisible();
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("keeps a clean heading outline: chapter h2, six scene h3s, and the hand-off is not a heading", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/");
    const outline = await page.evaluate(() =>
      [...document.querySelectorAll('section[data-chapter="2"] h2, section[data-chapter="2"] h3')].map(
        (el) => `${el.tagName} ${el.textContent?.trim()}`,
      ),
    );
    expect(outline).toEqual([
      "H2 Choose your pathway.",
      "H3 NAPLAN-style practice",
      "H3 ICAS-style practice",
      "H3 Curriculum learning",
      "H3 AMC-style problem solving",
      "H3 Singapore Maths",
      "H3 Selective & scholarship preparation",
    ]);
  });
});


/*
 * Chapter 3: "How it works". One pinned stage with a persistent product frame
 * whose state changes. Progress is driven by the page's own scroll, so tests
 * scroll to chapter progress values rather than wheel through it.
 */
const CH3_SCENES = ["learn", "practise", "understand", "next"] as const;
// Middle of each scene window in cinematicMotion.chapter3.layerStarts.
const CH3_PROGRESS = [0.185, 0.395, 0.605, 0.825] as const;

test.describe("Chapter 3 how it works", () => {
  // The pinned layout only exists once the page has hydrated at a desktop width; wait for it before measuring.
  const scrollToProgress = async (page: PwPage, progress: number) => {
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector('section[data-chapter="3"] > div')!).position === "sticky",
    );
    await page.evaluate((q) => {
      const section = document.querySelector('section[data-chapter="3"]') as HTMLElement;
      const heightSvh = (section.offsetHeight / window.innerHeight) * 100;
      const factor = heightSvh / (heightSvh - 100);
      // The page uses smooth scrolling; jump instantly so the frame under test is the one we asked for.
      window.scrollTo({
        top: section.getBoundingClientRect().top + window.scrollY + (q / factor) * section.offsetHeight,
        behavior: "instant",
      });
    }, progress);
  };

  /** Effective opacity of an element: its own times every ancestor's, up to the chapter. */
  const effectiveOpacity = (page: PwPage, selector: string) =>
    page.evaluate((sel) => {
      const root = document.querySelector('section[data-chapter="3"]')!;
      let el: Element | null = root.querySelector(sel);
      if (!el) return -1;
      let opacity = 1;
      for (; el && el !== root; el = el.parentElement) opacity *= Number(getComputedStyle(el).opacity);
      return Number(opacity.toFixed(2));
    }, selector);

  const headingOpacities = (page: PwPage) =>
    page.evaluate(() => {
      const root = document.querySelector('section[data-chapter="3"]')!;
      return [...root.querySelectorAll("h3")].map((h) => {
        let o = 1;
        for (let el: Element | null = h; el && el !== root; el = el.parentElement) o *= Number(getComputedStyle(el).opacity);
        return Number(o.toFixed(2));
      });
    });

  const settled = (page: PwPage, expected: number[]) => expect.poll(() => headingOpacities(page)).toEqual(expected);

  test("replaces the learning demo, product tour and personalisation sections on the home page", async ({ page }) => {
    await page.goto("/");
    for (const name of ["See how learning works.", "See MindMosaic in action.", "Learning that responds to the student."]) {
      await expect(page.getByRole("heading", { name })).toHaveCount(0);
    }
    await expect(page.getByRole("heading", { level: 2, name: "One concept. Four connected steps." })).toBeAttached();
    expect(await page.locator('section[data-chapter="3"] img').evaluateAll((imgs) =>
      imgs.filter((img) => !(img.getAttribute("src") ?? "").includes("brand")).length,
    )).toBe(0);
  });

  test("pins a 500svh stage on desktop and shows exactly one scene's copy at each scene progress", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const stage = page.locator('section[data-chapter="3"] > div');
    await expect.poll(() => stage.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
    const heightSvh = await page.evaluate(() => {
      const section = document.querySelector('section[data-chapter="3"]') as HTMLElement;
      return Math.round((section.offsetHeight / window.innerHeight) * 100);
    });
    expect(heightSvh).toBe(500);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe("none");

    for (const [index, id] of CH3_SCENES.entries()) {
      await scrollToProgress(page, CH3_PROGRESS[index]!);
      await settled(page, CH3_SCENES.map((_, i) => (i === index ? 1 : 0)));
      await expect(page.locator(`section[data-chapter="3"] [data-scene="${id}"] h3`)).toBeVisible();
    }
  });

  test("Practise to Understand is the same question changing state, not a new card", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const questionState = 'section[data-chapter="3"] [aria-label="Sample practice question and review"]';

    await scrollToProgress(page, CH3_PROGRESS[1]!);
    await expect.poll(() => effectiveOpacity(page, questionState)).toBe(1);
    const chapter = page.locator('section[data-chapter="3"]');
    await expect(chapter.getByText("Selected", { exact: true })).toBeVisible();
    await expect(chapter.getByText("Correct answer", { exact: true })).toHaveCount(0);
    // Mark the live question element; it must be the same node after the transition.
    await page.evaluate((sel) => document.querySelector(sel)!.setAttribute("data-same-node", "yes"), questionState);

    await scrollToProgress(page, CH3_PROGRESS[2]!);
    await expect.poll(() => effectiveOpacity(page, questionState)).toBe(1);
    expect(await page.locator(`${questionState}[data-same-node="yes"]`).count()).toBe(1);
    await expect(chapter.getByText("Correct answer", { exact: true })).toBeVisible();
    await expect(chapter.getByText(/Your answer · not correct/)).toBeVisible();
    await expect(chapter.getByText(/Count all the equal parts/)).toBeVisible();
    await expect(chapter.getByText("Selected", { exact: true })).toHaveCount(0);
  });

  test("scene copy takes turns and the product frame is never blank across the whole chapter", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const frame = 'section[data-chapter="3"] [aria-label="Sample practice question and review"]';
    for (let q = 0.2; q <= 0.8; q += 0.025) {
      await scrollToProgress(page, q);
      await page.waitForTimeout(110);
      const copy = await headingOpacities(page);
      // A faint outgoing/incoming overlap (<= 25%) is the hand-over itself; two headings both legible would be a defect.
      expect(copy.filter((o) => o > 0.3).length, `copy at q=${q.toFixed(3)}: ${copy}`).toBeLessThanOrEqual(1);
    }
    // The question state itself stays fully visible across the Practise/Understand boundary.
    for (const q of [0.465, 0.48, 0.5, 0.52, 0.535]) {
      await scrollToProgress(page, q);
      await page.waitForTimeout(150);
      expect(await effectiveOpacity(page, frame), `question at q=${q}`).toBe(1);
    }
  });

  test("the progress navigator marks the current step and scrolls normally when used", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await scrollToProgress(page, CH3_PROGRESS[0]!);
    const nav = page.getByRole("navigation", { name: "How it works progress" });
    await expect(nav.getByRole("button")).toHaveCount(4);
    await expect(nav.getByRole("button", { name: /Learn/ })).toHaveAttribute("aria-current", "step");

    const understand = nav.getByRole("button", { name: /Understand/ });
    await understand.focus();
    await page.keyboard.press("Enter");
    await expect(understand).toHaveAttribute("aria-current", "step", { timeout: 5000 });
    await settled(page, [0, 0, 1, 0]);
  });

  test("tabbing into a link in an off-screen scene brings that scene into view", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await scrollToProgress(page, CH3_PROGRESS[0]!);
    await page.locator('section[data-chapter="3"] [data-scene="practise"]').getByRole("link", { name: "Try practice" }).focus();
    await settled(page, [0, 1, 0, 0]);
  });

  test("the last scene is a labelled sample with conditional wording, then hands off to Chapter 4", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await scrollToProgress(page, CH3_PROGRESS[3]!);
    const chapter = page.locator('section[data-chapter="3"]');
    await expect(chapter.getByText("After an eligible test, MindMosaic can highlight", { exact: false })).toBeVisible();
    await expect(chapter.getByText("Suggestions follow fixed rules applied to the student's answers.")).toBeVisible();
    await expect(chapter.getByText("Sample", { exact: true }).first()).toBeVisible();
    await expect(chapter.getByText("Practise next")).toBeVisible();
    await expect(chapter.getByText(PROHIBITED_PRODUCT_CLAIMS)).toHaveCount(0);

    await scrollToProgress(page, 0.99);
    await expect(chapter.getByText("See progress clearly.")).toBeVisible();
    await expect(page.locator('section[data-chapter="4"]')).toBeAttached();
    await expect(page.getByRole("heading", { name: "Progress that stays understandable." })).toBeAttached();
  });

  for (const width of [375, 768] as const) {
    test(`at ${width}px nothing pins: natural flow with the question repeated for Understand, no overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const stage = page.locator('section[data-chapter="3"] > div');
      expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("relative");
      await expect(page.getByRole("navigation", { name: "How it works progress" })).toHaveCount(0);
      for (const id of CH3_SCENES) {
        const scene = page.locator(`section[data-chapter="3"] [data-scene="${id}"]`);
        await scene.scrollIntoViewIfNeeded();
        await expect(scene.getByRole("heading", { level: 3 })).toBeVisible();
      }
      for (const id of ["practise", "understand"]) {
        await expect(page.locator(`[data-scene="${id}"]`).getByText("What fraction of the bar is shaded?")).toBeVisible();
      }
      await expect(page.locator('[data-scene="understand"]').getByText("Correct answer", { exact: true })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("crossing the 1024px breakpoint switches between pinned and natural flow without reloading", async ({ page }) => {
    const position = () =>
      page.evaluate(() => getComputedStyle(document.querySelector('section[data-chapter="3"] > div')!).position);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect.poll(position).toBe("sticky");
    await page.setViewportSize({ width: 1023, height: 900 });
    await expect.poll(position).toBe("relative");
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect.poll(position).toBe("sticky");
  });

  test("reduced motion removes pinning and choreography: every state is complete and readable", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const stage = page.locator('section[data-chapter="3"] > div');
    expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("relative");
    await expect(page.getByRole("navigation", { name: "How it works progress" })).toHaveCount(0);
    expect(await headingOpacities(page)).toEqual([1, 1, 1, 1]);
    const chapter = page.locator('section[data-chapter="3"]');
    await chapter.locator('[data-scene="understand"]').scrollIntoViewIfNeeded();
    await expect(chapter.getByText("Correct answer", { exact: true })).toBeVisible();
    await expect(chapter.getByText(/Count all the equal parts/)).toBeVisible();
    await chapter.locator('[data-scene="next"]').scrollIntoViewIfNeeded();
    await expect(chapter.getByText("40%")).toBeVisible();
    await expect(chapter.getByText("Fractions of a collection").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("keeps a clean heading outline: one chapter h2 and four scene h3s", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/");
    const outline = await page.evaluate(() =>
      [...document.querySelectorAll('section[data-chapter="3"] h2, section[data-chapter="3"] h3')].map(
        (el) => `${el.tagName} ${el.textContent?.trim()}`,
      ),
    );
    expect(outline).toEqual([
      "H2 One concept. Four connected steps.",
      "H3 Learn the concept.",
      "H3 Practise it.",
      "H3 Understand the mistake.",
      "H3 Know what to work on next.",
    ]);
  });
});

/*
 * Chapter 4: "Progress & parents". One pinned stage with an assembling progress mosaic.
 * Progress is driven by the page's own scroll, so tests scroll to chapter progress values.
 */
const CH4_SCENES = ["latest", "subjects", "parent"] as const;
// Middle of each scene window in cinematicMotion.chapter4.layerStarts [0.10, 0.37, 0.64, 0.93]
const CH4_PROGRESS = [0.235, 0.505, 0.785] as const;

test.describe("Chapter 4 progress and parents", () => {
  const scrollToProgress = async (page: PwPage, progress: number) => {
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector('section[data-chapter="4"] > div')!).position === "sticky",
    );
    await page.evaluate((q) => {
      const section = document.querySelector('section[data-chapter="4"]') as HTMLElement;
      const heightSvh = (section.offsetHeight / window.innerHeight) * 100;
      const factor = heightSvh / (heightSvh - 100);
      window.scrollTo({
        top: section.getBoundingClientRect().top + window.scrollY + (q / factor) * section.offsetHeight,
        behavior: "instant",
      });
    }, progress);
  };

  const headingOpacities = (page: PwPage) =>
    page.evaluate(() => {
      const root = document.querySelector('section[data-chapter="4"]')!;
      return [...root.querySelectorAll("h3")].map((h) => {
        let o = 1;
        for (let el: Element | null = h; el && el !== root; el = el.parentElement) o *= Number(getComputedStyle(el).opacity);
        return Number(o.toFixed(2));
      });
    });

  const settled = (page: PwPage, expected: number[]) => expect.poll(() => headingOpacities(page)).toEqual(expected);

  test("contains zero photographic images, image elements, or media slots", async ({ page }) => {
    await page.goto("/");
    const chapter = page.locator('section[data-chapter="4"]');
    await expect(chapter.locator("img")).toHaveCount(0);
    await expect(chapter.locator("canvas")).toHaveCount(0);
    await expect(chapter.locator("video")).toHaveCount(0);
  });

  test("pins a 400svh stage on desktop and shows exactly one scene copy at each scene progress", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const stage = page.locator('section[data-chapter="4"] > div');
    await expect.poll(() => stage.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
    const heightSvh = await page.evaluate(() => {
      const section = document.querySelector('section[data-chapter="4"]') as HTMLElement;
      return Math.round((section.offsetHeight / window.innerHeight) * 100);
    });
    expect(heightSvh).toBe(400);

    for (const [index, id] of CH4_SCENES.entries()) {
      await scrollToProgress(page, CH4_PROGRESS[index]!);
      await settled(page, CH4_SCENES.map((_, i) => (i === index ? 1 : 0)));
      await expect(page.locator(`section[data-chapter="4"] [data-scene="${id}"] h3`)).toBeVisible();
    }
  });

  test("Scene 3 displays the assembled parent mosaic with derived sample data", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await scrollToProgress(page, CH4_PROGRESS[2]!);
    const chapter = page.locator('section[data-chapter="4"]');
    await expect(chapter.getByText("Aisha · Year 3")).toBeVisible();
    await expect(chapter.getByText("Parent view · Read only")).toBeVisible();
    await expect(chapter.getByText("Sample", { exact: true }).first()).toBeVisible();
    await expect(chapter.getByText("80%").first()).toBeVisible();
    await expect(chapter.getByText("70%").first()).toBeVisible();
    await expect(chapter.getByText("60%").first()).toBeVisible();
    await expect(chapter.getByText("Strong").first()).toBeVisible();
    await expect(chapter.getByText("Good").first()).toBeVisible();
    await expect(chapter.getByText("Building").first()).toBeVisible();
    await expect(chapter.getByText(PROHIBITED_PRODUCT_CLAIMS)).toHaveCount(0);
  });

  test("the progress navigator marks the current step and scrolls normally when used", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await scrollToProgress(page, CH4_PROGRESS[0]!);
    const nav = page.getByRole("navigation", { name: "Progress & parents progress" });
    await expect(nav.getByRole("button")).toHaveCount(3);
    await expect(nav.getByRole("button", { name: /Latest/ })).toHaveAttribute("aria-current", "step");

    const parentBtn = nav.getByRole("button", { name: /Parent view/ });
    await parentBtn.focus();
    await page.keyboard.press("Enter");
    await expect(parentBtn).toHaveAttribute("aria-current", "step", { timeout: 5000 });
    await settled(page, [0, 0, 1]);
  });

  for (const width of [375, 768] as const) {
    test(`at ${width}px nothing pins: natural flow with all 3 scenes complete and no overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const stage = page.locator('section[data-chapter="4"] > div');
      expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("relative");
      await expect(page.getByRole("navigation", { name: "Progress & parents progress" })).toHaveCount(0);
      for (const id of CH4_SCENES) {
        const scene = page.locator(`section[data-chapter="4"] [data-scene="${id}"]`);
        await scene.scrollIntoViewIfNeeded();
        await expect(scene.getByRole("heading", { level: 3 })).toBeVisible();
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("crossing the 1024px breakpoint switches between pinned and natural flow without reloading", async ({ page }) => {
    const position = () =>
      page.evaluate(() => getComputedStyle(document.querySelector('section[data-chapter="4"] > div')!).position);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect.poll(position).toBe("sticky");
    await page.setViewportSize({ width: 1023, height: 900 });
    await expect.poll(position).toBe("relative");
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect.poll(position).toBe("sticky");
  });

  test("reduced motion removes pinning and choreography: every scene is complete and readable", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const stage = page.locator('section[data-chapter="4"] > div');
    expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("relative");
    await expect(page.getByRole("navigation", { name: "Progress & parents progress" })).toHaveCount(0);
    expect(await headingOpacities(page)).toEqual([1, 1, 1]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("keeps a clean heading outline: chapter h2 and three scene h3s", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto("/");
    const outline = await page.evaluate(() =>
      [...document.querySelectorAll('section[data-chapter="4"] h2, section[data-chapter="4"] h3')].map(
        (el) => `${el.tagName} ${el.textContent?.trim()}`,
      ),
    );
    expect(outline).toEqual([
      "H2 Progress that stays understandable.",
      "H3 See what happened.",
      "H3 See the pattern.",
      "H3 See the bigger picture.",
    ]);
  });
});

/*
 * Continuous-scroll acceptance. These tests scroll the way a person does (a stream of
 * wheel events), not by jumping to settled scene progress, and judge every frame
 * on the way past each chapter boundary: is something readable, are two things
 * legible at once, does a photograph panel ever dip to show the page behind it, and
 * does a released stage leave exactly as fast as the page scrolls.
 */
test.describe("Continuous scroll across chapters", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  type Frame = {
    y: number;
    overflow: number;
    chapters: Record<string, { top: number; bottom: number; text: number; photoCoverage: number; photos: number; loaded: number }>;
  };

  const sampleFrame = (page: import("@playwright/test").Page): Promise<Frame> =>
    page.evaluate(() => {
      const effective = (el: Element, stop: Element | null) => {
        let o = 1;
        for (let e: Element | null = el; e && e !== stop; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
        return o;
      };
      const frame: Frame = { y: Math.round(scrollY), overflow: document.documentElement.scrollWidth - innerWidth, chapters: {} };
      for (const section of document.querySelectorAll<HTMLElement>("section[data-chapter]")) {
        const r = section.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        let text = 0;
        for (const t of section.querySelectorAll("h2, h3, p")) {
          const tr = t.getBoundingClientRect();
          if (tr.width === 0 || tr.bottom < 0 || tr.top > innerHeight) continue;
          text = Math.max(text, effective(t, section.parentElement));
        }
        const photos = [...section.querySelectorAll("img")].filter((i) => i.getBoundingClientRect().width > 0);
        const alphas = photos.map((i) => effective(i, section.parentElement));
        frame.chapters[section.dataset.chapter!] = {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          text,
          photoCoverage: 1 - alphas.reduce((a, o) => a * (1 - o), 1),
          photos: photos.length,
          loaded: photos.filter((i, n) => alphas[n]! > 0.1 && i.complete && i.naturalWidth > 0).length,
        };
      }
      return frame;
    });

  /** Scrolls with real wheel events in small steps, sampling after every one; optionally only across [from, to]. */
  async function wheelThrough(
    page: import("@playwright/test").Page,
    direction: 1 | -1,
    step = 60,
    range?: { from: number; to: number },
  ): Promise<Frame[]> {
    const frames: Frame[] = [];
    const total = range ? range.to - range.from : await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    if (range) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), direction === 1 ? range.from : range.to);
      // Let the scenes mounted for this position start and finish loading, as a reader pausing at the chapter's start would.
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(250);
    }
    await page.mouse.move(720, 450);
    for (let travelled = 0; travelled < total + step; travelled += step) {
      await page.mouse.wheel(0, direction * step);
      await page.waitForTimeout(14);
      frames.push(await sampleFrame(page));
    }
    return frames;
  }

  test("never goes blank or doubles up while wheeling through every pinned chapter", async ({ page }) => {
    await page.goto("/");
    const frames = await wheelThrough(page, 1);
    for (const chapter of ["2", "3", "4"]) {
      const pinned = frames.filter((f) => {
        const c = f.chapters[chapter];
        return c && c.top <= 0 && c.bottom >= 900;
      });
      expect(pinned.length, `chapter ${chapter} pinned frames`).toBeGreaterThan(40);
      const weakest = Math.min(...pinned.map((f) => f.chapters[chapter]!.text));
      expect(weakest, `chapter ${chapter}: weakest foreground over the whole pinned run`).toBeGreaterThanOrEqual(0.12);
    }
    for (const f of frames) expect(f.overflow, `horizontal overflow at y=${f.y}`).toBeLessThanOrEqual(0);
  });

  test("a stage releases exactly as fast as the page scrolls (no jump at the hand-off)", async ({ page }) => {
    await page.goto("/");
    const frames = await wheelThrough(page, 1);
    for (let i = 1; i < frames.length; i += 1) {
      const dy = frames[i]!.y - frames[i - 1]!.y;
      for (const chapter of Object.keys(frames[i]!.chapters)) {
        const before = frames[i - 1]!.chapters[chapter];
        if (!before) continue;
        const moved = frames[i]!.chapters[chapter]!.bottom - before.bottom + dy;
        expect(Math.abs(moved), `chapter ${chapter} bottom edge at y=${frames[i]!.y}`).toBeLessThanOrEqual(2);
      }
    }
  });

  test("Chapter 2 photographs stack: the panel never dips and a visible one is always loaded", async ({ page }) => {
    await page.goto("/");
    const frames = await wheelThrough(page, 1, 30, { from: 1700, to: 7100 });
    const timing = cinematicMotion.chapter2;
    const pinned = frames.filter((f) => {
      const c = f.chapters["2"];
      return c && c.top <= 0 && c.bottom >= 900;
    });
    // Chapter progress of a frame: how far the pinned travel has run.
    const progressOf = (f: Frame) => -f.chapters["2"]!.top / (f.chapters["2"]!.bottom - f.chapters["2"]!.top - 900);
    // A photograph that is even slightly visible must already be decoded and loaded.
    for (const f of pinned) {
      const c = f.chapters["2"]!;
      if (c.photoCoverage > 0.1) expect(c.loaded, `visible panel without its photograph at y=${f.y}`).toBeGreaterThan(0);
    }
    // NAPLAN -> ICAS are two consecutive photographs: across their whole cross-fade the page must never show through.
    const handover = pinned.filter((f) => Math.abs(progressOf(f) - timing.layerStarts.icas) <= timing.crossfade);
    expect(handover.length, "frames sampled across the NAPLAN to ICAS hand-over").toBeGreaterThan(8);
    for (const f of handover) {
      expect(f.chapters["2"]!.photoCoverage, `photograph coverage at y=${f.y}`).toBeGreaterThanOrEqual(0.99);
    }
  });

  test("scrolling back up retraces the same frames", async ({ page }) => {
    await page.goto("/");
    const down = await wheelThrough(page, 1, 120);
    const up = await wheelThrough(page, -1, 120);
    const byY = new Map(down.map((f) => [f.y, f]));
    let compared = 0;
    for (const f of up) {
      const match = byY.get(f.y);
      const a = match?.chapters["2"];
      const b = f.chapters["2"];
      if (!a || !b || a.top > 0 || a.bottom < 900) continue;
      compared += 1;
      expect(Math.abs(a.text - b.text), `foreground at y=${f.y} must not depend on direction`).toBeLessThan(0.1);
    }
    expect(compared).toBeGreaterThan(10);
  });
});
