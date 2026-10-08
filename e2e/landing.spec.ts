import { expect, test } from "@playwright/test";
import { PUBLIC_SIGNUP_ENABLED } from "../src/features/auth/signup-policy";
import { hero } from "../src/features/landing/content";
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

  test("Chapter 1 is driven by scroll alone: six scene buttons, no slideshow, timer or pause control", async ({ page }) => {
    await page.goto("/");
    const chapter = page.locator('section[data-chapter="1"]');
    await expect(chapter.locator("[data-hero-scene]").first().locator("img")).toHaveAttribute("src", /ch01-scene-01-learn-v1/);
    await expect(chapter.getByRole("button")).toHaveCount(6);
    await expect(page.getByRole("group", { name: /slide/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /slideshow|pause|play/i })).toHaveCount(0);
    await expect(chapter.locator("[aria-live]")).toHaveCount(0);
  });

  test("Chapter 1 never advances by itself: after ten seconds without scrolling it is still on scene 1", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Hero scenes" });
    await expect(nav.getByRole("button", { name: /^Scene 1 of 6/ })).toHaveAttribute("aria-current", "step");
    await page.waitForTimeout(10_000);
    await expect(nav.getByRole("button", { name: /^Scene 1 of 6/ })).toHaveAttribute("aria-current", "step");
    expect(await page.evaluate(() => scrollY)).toBe(0);
    // Still only scene 1 and its neighbours on the canvas, never all six photographs.
    expect(await page.locator('section[data-chapter="1"] [data-hero-scene]').count()).toBeLessThanOrEqual(4);
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

  test("Chapter 1 moves the camera gently with scroll (never more than 5%), and with reduced motion it stays still", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const scale = () =>
      page.evaluate(() => {
        const wrapper = document.querySelector('section[data-chapter="1"] [data-hero-scene="0"] img')!.parentElement!;
        return new DOMMatrix(getComputedStyle(wrapper).transform).a;
      });

    await page.goto("/");
    await expect.poll(scale).toBe(1);
    await page.mouse.move(720, 450);
    const seen: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      await page.mouse.wheel(0, 40);
      await page.waitForTimeout(40);
      seen.push(await scale());
    }
    expect(Math.max(...seen)).toBeGreaterThan(1);
    expect(Math.max(...seen)).toBeLessThanOrEqual(1.05);
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(1);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.mouse.wheel(0, 650);
    await expect.poll(scale).toBe(1);
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
      expect(copy.filter((o) => o > 0.05).length, `copy at q=${q.toFixed(3)}: ${copy}`).toBeLessThanOrEqual(1);
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
 * Chapter 1: six scroll-driven photographic scenes in one pinned stage. Like the Chapter 2 continuous-scroll
 * acceptance below, these scroll with a stream of real wheel events and judge every frame on the way past.
 */
test.describe("Chapter 1 six-scene scroll", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  type Frame = {
    y: number;
    overflow: number;
    stageTop: number;
    stageBottom: number;
    headline: number;
    headlineVisible: boolean;
    captions: number[];
    layers: { scene: number; opacity: number; state: string }[];
    coverage: number;
    active: string | null;
  };

  const sampleFrame = (page: import("@playwright/test").Page): Promise<Frame> =>
    page.evaluate(() => {
      const section = document.querySelector<HTMLElement>('section[data-chapter="1"]')!;
      const effective = (el: Element) => {
        let o = 1;
        for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
        return o;
      };
      const h1 = section.querySelector("h1")!;
      const h1Rect = h1.getBoundingClientRect();
      const stage = section.firstElementChild!.getBoundingClientRect();
      const layers = [...section.querySelectorAll<HTMLElement>("[data-hero-scene]")].map((layer) => ({
        scene: Number(layer.dataset.heroScene),
        opacity: effective(layer),
        state: layer.dataset.photoState ?? "",
      }));
      // Only a decoded photograph can cover anything, and coverage is how opaque the stack of them is.
      const coverage = 1 - layers.filter((l) => l.state === "ready").reduce((a, l) => a * (1 - l.opacity), 1);
      return {
        y: Math.round(scrollY),
        overflow: document.documentElement.scrollWidth - innerWidth,
        stageTop: Math.round(stage.top),
        stageBottom: Math.round(stage.bottom),
        headline: effective(h1),
        headlineVisible: h1Rect.bottom > 0 && h1Rect.top < innerHeight,
        captions: [...section.querySelectorAll("p[aria-hidden='true'].grid > span")].map(effective),
        layers,
        coverage,
        active: section.querySelector("nav[aria-label='Hero scenes'] [aria-current='step']")?.getAttribute("aria-label") ?? null,
      };
    });

  async function wheelThrough(
    page: import("@playwright/test").Page,
    direction: 1 | -1,
    options: { step?: number; gap?: number; to?: number } = {},
  ): Promise<Frame[]> {
    const { step = 60, gap = 16, to = 4700 } = options;
    const frames: Frame[] = [];
    // A reader pauses on the first screen before scrolling: let scene 1's photograph finish decoding.
    await expect(page.locator('section[data-chapter="1"] [data-hero-scene="0"]')).toHaveAttribute("data-photo-state", "ready", { timeout: 10_000 });
    await page.mouse.move(720, 450);
    if (direction === -1) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), to);
      await page.waitForTimeout(400);
    }
    for (let travelled = 0; travelled < to + step; travelled += step) {
      await page.mouse.wheel(0, direction * step);
      await page.waitForTimeout(gap);
      frames.push(await sampleFrame(page));
    }
    return frames;
  }

  const pinned = (f: Frame) => f.stageTop <= 0 && f.stageBottom >= 900;

  test("walks Learn, Practise, Prepare, Understand, Progress, Explore in order, with the headline and CTAs never leaving", async ({ page }) => {
    await page.goto("/");
    const frames = await wheelThrough(page, 1);
    const run = frames.filter(pinned);
    expect(run.length).toBeGreaterThan(50);
    const order: string[] = [];
    for (const f of run) {
      const scene = f.active?.match(/^Scene (\d) of 6/)?.[1];
      if (scene && order.at(-1) !== scene) order.push(scene);
      expect(f.headline, `headline opacity at y=${f.y}`).toBe(1);
      expect(f.headlineVisible, `headline on screen at y=${f.y}`).toBe(true);
    }
    expect(order).toEqual(["1", "2", "3", "4", "5", "6"]);
    for (const name of [hero.primaryCta.label, hero.secondaryCta.label]) {
      await expect(page.getByRole("link", { name }).first()).toBeAttached();
    }
  });

  test("never blanks, never doubles a caption, never shows the page behind a photograph, and never mounts more than two photographs ahead", async ({ page }) => {
    await page.goto("/");
    const frames = await wheelThrough(page, 1);
    const run = frames.filter(pinned);
    for (const f of run) {
      expect(Math.max(...f.captions), `a caption must be readable at y=${f.y}`).toBeGreaterThanOrEqual(0.15);
      expect(f.captions.filter((o) => o > 0.3).length, `two legible captions at y=${f.y}: ${f.captions}`).toBeLessThanOrEqual(1);
      expect(f.coverage, `photograph coverage at y=${f.y}`).toBeGreaterThanOrEqual(0.99);
      // Photographs are only ever mounted a couple of scenes AHEAD of the active one: never all six up front.
      const active = Number(f.active?.match(/^Scene (\d) of 6/)?.[1] ?? 1) - 1;
      expect(Math.max(...f.layers.map((l) => l.scene)), `furthest mounted photograph at y=${f.y}`).toBeLessThanOrEqual(active + 2);
    }
    for (const f of frames) expect(f.overflow, `horizontal overflow at y=${f.y}`).toBeLessThanOrEqual(0);
  });

  test("the stage releases exactly as fast as the page scrolls, with the headline still on screen", async ({ page }) => {
    await page.goto("/");
    const frames = await wheelThrough(page, 1);
    for (let i = 1; i < frames.length; i += 1) {
      const dy = frames[i]!.y - frames[i - 1]!.y;
      const moved = frames[i]!.stageBottom - frames[i - 1]!.stageBottom + dy;
      // Pinned frames keep the bottom edge at the viewport bottom; once released it moves 1:1 with scroll.
      // (A sample that straddles the release point is part pinned, part released, so only released pairs are exact.)
      if (frames[i]!.stageBottom < 900 && frames[i - 1]!.stageBottom < 900) {
        expect(Math.abs(moved), `stage bottom edge at y=${frames[i]!.y}`).toBeLessThanOrEqual(2);
      }
    }
    const releasing = frames.filter((f) => f.stageBottom < 900 && f.stageBottom > 450);
    expect(releasing.length).toBeGreaterThan(3);
    expect(releasing.some((f) => f.headlineVisible)).toBe(true);
  });

  test("has no copy-free stretch between the hero and Chapter 2's heading", async ({ page }) => {
    await page.goto("/");
    const runs: number[] = [];
    let current = 0;
    await page.mouse.move(720, 450);
    for (let y = 0; y < 5600; y += 40) {
      await page.mouse.wheel(0, 40);
      await page.waitForTimeout(12);
      const hasText = await page.evaluate(() => {
        const effective = (el: Element) => {
          let o = 1;
          for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
          return o;
        };
        return [...document.querySelectorAll('section[data-chapter="1"] :is(h1,p,li), section[data-chapter="2"] :is(h2,h3,p)')].some((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.bottom > 0 && r.top < innerHeight && effective(el) >= 0.5 && el.closest("[aria-hidden='true']") === null;
        });
      });
      if (hasText) {
        if (current) runs.push(current);
        current = 0;
      } else current += 40;
    }
    if (current) runs.push(current);
    // The old hero left about 630px with no copy at all.
    expect(Math.max(0, ...runs)).toBeLessThanOrEqual(200);
  });

  test("scrolling back retraces the same frames", async ({ page }) => {
    await page.goto("/");
    const down = await wheelThrough(page, 1, { step: 120, to: 4680 });
    const up = await wheelThrough(page, -1, { step: 120, to: 4680 });
    const byY = new Map(down.map((f) => [f.y, f]));
    let compared = 0;
    for (const f of up) {
      const match = byY.get(f.y);
      if (!match || !pinned(f) || !pinned(match)) continue;
      compared += 1;
      expect(Math.abs(Math.max(...match.captions) - Math.max(...f.captions)), `captions at y=${f.y}`).toBeLessThan(0.1);
      expect(Math.abs(match.coverage - f.coverage), `coverage at y=${f.y}`).toBeLessThan(0.05);
      // The navigator's current step is React state and may trail the scroll by one frame, so allow a neighbour.
      const scene = (frame: Frame) => Number(frame.active?.match(/^Scene (\d) of 6/)?.[1]);
      expect(Math.abs(scene(match) - scene(f)), `active scene at y=${f.y}`).toBeLessThanOrEqual(1);
    }
    expect(compared).toBeGreaterThan(10);
  });

  test("the navigator scrolls to a scene with native scrolling and nothing is intercepted", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Hero scenes" });
    await nav.getByRole("button", { name: /^Scene 4 of 6/ }).click();
    await expect(nav.getByRole("button", { name: /^Scene 4 of 6/ })).toHaveAttribute("aria-current", "step", { timeout: 8000 });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(1500);
    // Native scroll only: no snap, no overscroll lock, and a wheel event is never cancelled by the page.
    const behaviour = await page.evaluate(() => ({
      snap: getComputedStyle(document.documentElement).scrollSnapType,
      overflow: getComputedStyle(document.body).overflow,
      cancelled: !document.body.dispatchEvent(new WheelEvent("wheel", { deltaY: 40, cancelable: true, bubbles: true })),
    }));
    expect(behaviour.snap).toBe("none");
    expect(behaviour.overflow).not.toBe("hidden");
    expect(behaviour.cancelled).toBe(false);
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  });

  test("the navigator is keyboard operable with a visible focus ring", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("navigation", { name: "Hero scenes" }).getByRole("button", { name: /^Scene 3 of 6/ });
    await button.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(button).toBeFocused();
    const ring = await button.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(ring).not.toBe("none");
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-current", "step", { timeout: 8000 });
  });

  test("a failed photograph never covers the page and the last decoded one stays on screen", async ({ page }) => {
    await page.route(/_next\/image.*ch01-scene-03/, (route) => route.abort());
    await page.goto("/");
    const frames = await wheelThrough(page, 1);
    const run = frames.filter(pinned);
    for (const f of run) {
      expect(f.coverage, `coverage at y=${f.y}`).toBeGreaterThanOrEqual(0.99);
      for (const layer of f.layers) {
        // Nothing may be visible unless it decoded.
        if (layer.opacity > 0.02) expect(layer.state, `scene ${layer.scene + 1} visible at y=${f.y}`).toBe("ready");
      }
    }
    expect(await page.locator('section[data-chapter="1"] [data-hero-scene="2"]').getAttribute("data-photo-state")).toBe("error");
    // Later scenes still work after the failure.
    expect(run.some((f) => f.layers.some((l) => l.scene === 5 && l.state === "ready" && l.opacity > 0.9))).toBe(true);
  });

  test("a slow photograph holds the previous scene during a fast scroll instead of flashing a gap", async ({ page }) => {
    await page.route(/_next\/image.*ch01-scene-0[2-4]/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue();
    });
    await page.goto("/");
    const frames = await wheelThrough(page, 1, { step: 220, gap: 18 });
    for (const f of frames.filter(pinned)) {
      expect(f.coverage, `coverage at y=${f.y}`).toBeGreaterThanOrEqual(0.99);
      for (const layer of f.layers) {
        if (layer.opacity > 0.02) expect(layer.state, `scene ${layer.scene + 1} visible at y=${f.y}`).toBe("ready");
      }
    }
  });

  test("reduced motion: unpinned, no scroll-linked fades or camera, all six scenes as ordinary content", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const stage = page.locator('section[data-chapter="1"] > div').first();
    expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("static");
    const list = page.getByRole("list", { name: "Six ways MindMosaic helps" });
    await expect(list.getByRole("listitem")).toHaveCount(6);
    await expect(list).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Hero scenes" })).toBeHidden();
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(200);
    expect(await page.locator('section[data-chapter="1"] [data-hero-scene]').count()).toBe(1);
    const transform = await page
      .locator('section[data-chapter="1"] [data-hero-scene="0"] img')
      .evaluate((img) => getComputedStyle(img.parentElement!).transform);
    expect(transform === "none" || new DOMMatrix(transform).a === 1).toBe(true);
    await expect(page.locator("[data-mosaic-transition]")).toHaveAttribute("data-mosaic-transition", "static");
  });

  for (const [width, height] of [
    [375, 812],
    [768, 1024],
  ] as const) {
    test(`${width}px: natural flow with a compact six-scene list, no pinning and no overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      const chapter = page.locator('section[data-chapter="1"]');
      expect(await chapter.locator(":scope > div").first().evaluate((el) => getComputedStyle(el).position)).toBe("relative");
      await expect(page.getByRole("list", { name: "Six ways MindMosaic helps" }).getByRole("listitem")).toHaveCount(6);
      await expect(page.getByRole("navigation", { name: "Hero scenes" })).toBeHidden();
      // One full-bleed band photograph, and the six thumbnails are only requested once the list scrolls into view:
      // never six full-bleed pictures, and no extra image requests competing with the page at load.
      expect(await chapter.locator("[data-hero-scene]").count()).toBe(1);
      expect(await chapter.locator("img").count()).toBe(1);
      await page.getByRole("list", { name: "Six ways MindMosaic helps" }).scrollIntoViewIfNeeded();
      await expect(chapter.locator("img")).toHaveCount(7);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        sectionHeight: document.querySelector('section[data-chapter="1"]')!.getBoundingClientRect().height,
        viewport: innerHeight,
      }));
      expect(metrics.overflow).toBeLessThanOrEqual(0);
      // No long empty region: the whole chapter is a few screens, never a 500svh scroll.
      expect(metrics.sectionHeight).toBeLessThan(metrics.viewport * 3.2);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});
