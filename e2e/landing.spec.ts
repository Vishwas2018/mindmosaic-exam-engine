import { expect, test } from "@playwright/test";
import { PUBLIC_SIGNUP_ENABLED } from "../src/features/auth/signup-policy";
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

  test("Chapter 1 is one fixed photograph: no slideshow, timers or pause control", async ({ page }) => {
    await page.goto("/");
    const chapter = page.locator('section[data-chapter="1"]');
    await expect(chapter.locator("img")).toHaveCount(1);
    await expect(chapter.locator("img")).toHaveAttribute("src", /ch01-hero-primary-v1\.webp/);
    await expect(chapter.getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("group", { name: /slide/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /slideshow|pause|play/i })).toHaveCount(0);
  });

  test("Chapter 1 has no horizontal overflow and hands off to Chapter 2", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("heading", { level: 2, name: "Choose your pathway." })).toBeAttached();
  });

  test("the story runs Chapter 1, Chapter 2 (programmes, then its hand-off), then How it works", async ({ page }) => {
    await page.goto("/");
    const tops = await page.evaluate(() => {
      const top = (text: string) => {
        const heading = [...document.querySelectorAll("h1, h2, h3")].find((el) => el.textContent?.trim() === text);
        return heading ? heading.getBoundingClientRect().top + window.scrollY : Number.NaN;
      };
      return [
        top("Choose your pathway."),
        top("NAPLAN-style practice"),
        top("See how MindMosaic works."),
        top("See MindMosaic in action."),
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
    await expect(page.getByText("Find the right program.")).toHaveCount(0);
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

  test("Chapter 1 zooms the photograph with scroll, and with reduced motion it stays still", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const scale = () =>
      page.evaluate(() => {
        const wrapper = document.querySelector('section[data-chapter="1"] img')!.parentElement!;
        return new DOMMatrix(getComputedStyle(wrapper).transform).a;
      });

    await page.goto("/");
    await expect.poll(scale).toBeGreaterThan(1.04);
    await page.mouse.wheel(0, 650);
    await expect.poll(scale).toBeLessThan(1.02);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.mouse.wheel(0, 650);
    await expect.poll(scale).toBe(1);
  });

  test("the product tour is labelled as a preview and never pretends to play", async ({ page }) => {
    await page.goto("/");
    const tour = page.locator("section", { has: page.getByRole("heading", { name: "See MindMosaic in action." }) });
    await expect(tour.getByText("Preview", { exact: true })).toBeVisible();
    await expect(tour.getByText("Video coming soon")).toBeVisible();
    await expect(tour.locator("video")).toHaveCount(0);
    await expect(tour.getByRole("button", { name: /watch|play/i })).toHaveCount(0);
    await expect(tour.getByRole("link", { name: "Read how it works" })).toHaveAttribute("href", "/how-it-works");
  });

  test("the learning demo switches between Learn, Practise and Prepare", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("article", { name: "Sample lesson" })).toBeVisible();

    await page.getByRole("tab", { name: "Practise" }).click();
    const practice = page.getByRole("article", { name: "Sample practice question" });
    await expect(practice).toBeVisible();
    await practice.getByRole("radio", { name: /^B/ }).click();
    await practice.getByRole("button", { name: "Check answer" }).click();
    await expect(practice.getByRole("status")).toContainText("Correct");

    await page.getByRole("tab", { name: "Prepare" }).click();
    await expect(page.getByRole("article", { name: "Sample test sitting" })).toBeVisible();
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

  test("the parent section shows the illustrative weekly summary, labelled as such", async ({ page }) => {
    await page.goto("/");
    const summary = page.getByRole("article", { name: "Sample weekly summary" });
    await expect(summary.getByText("Aisha · Year 3")).toBeVisible();
    await expect(summary.getByText("Sample", { exact: true })).toBeVisible();
  });

  test("the personalisation section describes rule-based suggestions, not AI", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: "Learning that responds to the student." }),
    });
    await expect(section.getByText(/fixed rules/)).toBeVisible();
    await expect(section.getByText(PROHIBITED_PRODUCT_CLAIMS)).toHaveCount(0);
    await expect(section.getByRole("article", { name: "Sample skill breakdown after a test" })).toContainText("Sample");
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
  const scrollToProgress = (page: PwPage, progress: number) =>
    page.evaluate((q) => {
      const section = document.querySelector('section[data-chapter="2"]') as HTMLElement;
      const heightSvh = (section.offsetHeight / window.innerHeight) * 100;
      const factor = heightSvh / (heightSvh - 100);
      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY + (q / factor) * section.offsetHeight);
    }, progress);

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

  test("loads photographs on demand, never all four at once", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(await chapter2Images(page)).toBe(0);
    await scrollToProgress(page, SCENE_PROGRESS[0]!);
    await expect.poll(() => chapter2Images(page)).toBeGreaterThan(0);
    expect(await chapter2Images(page)).toBeLessThan(4);
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

  test("ends on the Chapter 3 hand-off and releases into the next section", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await scrollToProgress(page, 0.99);
    await expect(page.getByRole("heading", { level: 2, name: "See how MindMosaic works." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "See how learning works." })).toBeAttached();
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

  test("keeps a clean heading outline: chapter h2, six scene h3s, then the hand-off h2", async ({ page }) => {
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
      "H2 See how MindMosaic works.",
    ]);
  });
});
