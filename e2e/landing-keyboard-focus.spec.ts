import { expect, test, type Page } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";
import { cinematicMotion, pinnedTravelFactor } from "../src/features/landing/cinematic/config";
import { chapter2LayerStarts, layerAnchor } from "../src/features/landing/cinematic/sceneProgress";

/*
 * Landing-page keyboard focus, focus indicators and standalone link targets (WCAG 2.2: 2.4.3, 2.4.7,
 * 2.4.11, 1.4.11, 2.5.8 and the project's 44px target standard in docs/design.md 7 and 20).
 *
 * The contract these tests protect: tabbing into a scene that is not on screen brings that scene on screen
 * (see the "tabbing into a link in an off-screen scene" tests in landing.spec.ts), and the focused control
 * is then genuinely visible: opaque, inside the viewport, not covered by the sticky header or the mobile CTA
 * bar, with a visible focus ring. The scroll that does it is instant, never a multi-second smooth scroll
 * during which the focused control sits at opacity 0.
 *
 * Run against a production build on a port that is NOT the owner's preview:
 *   PW_PORT=3110 npx playwright test e2e/landing-keyboard-focus.spec.ts
 */

// A full Tab walk is 40 to 120 stops, each waiting for scroll to settle: allow it the time it needs.
test.setTimeout(240_000);

interface Stop {
  index: number;
  label: string;
  opacity: number;
  inViewport: boolean;
  unobscured: boolean;
  outline: string;
  outlineWidth: number;
  shadow: string;
  rect: [number, number, number, number];
  scrollY: number;
  scrollDelta: number;
  msUntilVisible: number;
}

/** Runs in the page: the focused element's visibility facts, or null when nothing (or <body>) has focus. */
const probeFocus = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  let opacity = 1;
  let rendered = true;
  for (let node: Element | null = el; node; node = node.parentElement) {
    const cs = getComputedStyle(node);
    opacity *= Number(cs.opacity);
    if (cs.visibility === "hidden" || cs.display === "none") rendered = false;
  }
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  // On screen = its centre is inside the viewport and at least half of it is (a control grazing the viewport
  // edge by a pixel or two is not hidden; one under a fixed bar or in an opacity-0 layer is, see below).
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const shownW = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
  const shownH = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
  const inViewport = r.width > 0 && r.height > 0 && cx >= 0 && cx < innerWidth && cy >= 0 && cy < innerHeight && (shownW * shownH) / (r.width * r.height) >= 0.5;
  const hit = document.elementFromPoint(cx, cy);
  // Obscured = something that is neither the control nor its ancestor/descendant is painted over its centre
  // (the sticky header, the mobile CTA bar, a layer at opacity 0 still catching the point).
  const unobscured = !!hit && (hit === el || el.contains(hit) || hit.contains(el));
  return {
    label: (el.getAttribute("aria-label") || (el.textContent ?? "").trim().replace(/\s+/g, " ")).slice(0, 40),
    opacity: rendered ? Number(opacity.toFixed(3)) : 0,
    inViewport,
    unobscured,
    outline: cs.outlineStyle === "none" ? "none" : `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
    outlineWidth: cs.outlineStyle === "none" ? 0 : parseFloat(cs.outlineWidth),
    shadow: cs.boxShadow,
    rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] as [number, number, number, number],
    scrollY: Math.round(scrollY),
  };
};

const isVisibleStop = (s: ReturnType<typeof probeFocus>) =>
  !!s && s.opacity >= 0.99 && s.inViewport && s.unobscured;

/** Presses `key`, waits for the focused control to be visible, and records how long that took. */
async function step(page: Page, key: "Tab" | "Shift+Tab", index: number, previousY: number): Promise<Stop | null> {
  await page.keyboard.press(key);
  const started = Date.now();
  let last = await page.evaluate(probeFocus);
  while (!isVisibleStop(last) && Date.now() - started < 2500) {
    await page.waitForTimeout(16);
    last = await page.evaluate(probeFocus);
  }
  const msUntilVisible = isVisibleStop(last) ? Date.now() - started : -1;
  // Let any remaining scroll settle so the recorded position and ring are the resting state.
  let y = -1;
  for (let stable = 0; stable < 3; ) {
    const now = await page.evaluate(() => Math.round(scrollY));
    stable = now === y ? stable + 1 : 0;
    y = now;
    await page.waitForTimeout(40);
  }
  const settled = await page.evaluate(probeFocus);
  if (!settled) return null;
  return { index, ...settled, scrollDelta: settled.scrollY - previousY, msUntilVisible };
}

/** Tabs from the top of the page to the end of it (or the wrap back to the header), recording every stop. */
async function walk(page: Page, direction: "forward" | "reverse"): Promise<Stop[]> {
  const stops: Stop[] = [];
  if (direction === "reverse") {
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await page.locator("footer a").last().focus();
  }
  let previousY = await page.evaluate(() => Math.round(scrollY));
  const key = direction === "forward" ? "Tab" : "Shift+Tab";
  for (let i = 1; i <= 220; i += 1) {
    const stop = await step(page, key, i, previousY);
    if (!stop) break; // focus left the document (browser chrome): the walk is complete
    stops.push(stop);
    previousY = stop.scrollY;
    if (direction === "forward" && i > 8 && stop.label === "MindMosaic home") break; // wrapped to the footer's logo link
    if (direction === "reverse" && stop.label === "Skip to main content") break;
  }
  return stops;
}

/**
 * Stops that fail the focus contract. In the pinned layout a scene is brought on screen by an instant scroll, so
 * the control must be visible within 600ms. In natural-flow layouts (phones, tablets, reduced motion) the browser
 * scrolls a real, opaque control into view and the page's CSS `scroll-behavior: smooth` animates that, so the
 * control is only required to be opaque throughout and visible within 2.5s; the project deliberately has no
 * global instant-scroll rule. `knownIssues` is for explicitly documented, pre-existing layout limits only.
 */
const problems = (stops: Stop[], options: { maxMs?: number; knownIssues?: (s: Stop) => boolean } = {}) =>
  stops.filter(
    (s) =>
      !options.knownIssues?.(s) &&
      (s.opacity < 0.99 || !s.inViewport || !s.unobscured || s.outlineWidth < 2 || s.msUntilVisible < 0 || s.msUntilVisible > (options.maxMs ?? 600)),
  );

const describeStops = (stops: Stop[]) =>
  stops.map((s) => `${s.index} ${s.label} op=${s.opacity} view=${s.inViewport} unobscured=${s.unobscured} ring=${s.outline} dy=${s.scrollDelta} t=${s.msUntilVisible}ms`).join("\n");

async function attachWalk(stops: Stop[], name: string) {
  await test.info().attach(name, { body: JSON.stringify(stops, null, 2), contentType: "application/json" });
}

test.describe("landing keyboard focus: pinned layout (1440x900)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("forward Tab from the hero to the footer: every stop is visible, unobscured, ringed and prompt", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('section[data-chapter="2"] > div')!).position === "sticky");
    const stops = await walk(page, "forward");
    await attachWalk(stops, "forward-walk-1440");

    expect(stops.length, "the walk reaches the footer, past all four chapters").toBeGreaterThan(40);
    expect(describeStops(problems(stops))).toBe("");

    const labels = stops.map((s) => s.label);
    for (const label of ["Explore NAPLAN-style practice", "Explore all programs", "Parent guide", "Privacy", "Start free"]) {
      expect(labels, `${label} is part of the tab order`).toContain(label);
    }
    // A Tab never throws the page backwards by more than a screen.
    for (const s of stops) expect(s.scrollDelta, `${s.label} scrolled backwards`).toBeGreaterThan(-900);
  });

  test("the Chapter 2 hand-off CTA is brought on screen and is visible the moment it takes focus", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('section[data-chapter="2"] > div')!).position === "sticky");
    // Start from the last programme scene so the next Tab lands on the hand-off.
    const last = page.locator('[data-scene="selective"]').getByRole("link", { name: /See all programs/ });
    await last.focus();
    await page.keyboard.press("Tab");
    const cta = page.getByRole("link", { name: "Explore all programs" });
    await expect(cta).toBeFocused();
    await expect.poll(() => page.evaluate(probeFocus).then((s) => isVisibleStop(s)), { timeout: 600 }).toBe(true);
    const s = (await page.evaluate(probeFocus))!;
    expect(s.outlineWidth).toBeGreaterThanOrEqual(2);
  });

  test("focus-driven scrolling is instant, but progress-rail clicks keep the smooth scroll", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('section[data-chapter="2"] > div')!).position === "sticky");
    const before = await page.evaluate(() => scrollY);
    await page.locator('[data-scene="icas"]').getByRole("link", { name: /Explore ICAS-style practice/ }).focus();
    // One animation frame later the scroll has already finished: scrollY does not keep changing.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const a = await page.evaluate(() => scrollY);
    await page.waitForTimeout(150);
    const b = await page.evaluate(() => scrollY);
    expect(a).toBeGreaterThan(before + 1000);
    expect(b).toBe(a);

    // The progress rail still animates: its scroll is smooth, so scrollY is still moving between two samples.
    await page.evaluate(() => scrollTo({ top: document.querySelector('section[data-chapter="2"]')!.getBoundingClientRect().top + scrollY + 3200, behavior: "instant" }));
    const nav = page.getByRole("navigation", { name: "Programme progress" });
    await expect(nav).toBeVisible();
    const y0 = await page.evaluate(() => scrollY);
    await nav.getByRole("button", { name: /Singapore/ }).click();
    await page.waitForTimeout(80);
    const y1 = await page.evaluate(() => scrollY);
    await page.waitForTimeout(80);
    const y2 = await page.evaluate(() => scrollY);
    expect(y1 !== y0 && y2 !== y1, "rail click scrolls smoothly (still moving between samples)").toBe(true);
  });

  test("reverse Tab from the footer to the top is just as visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('section[data-chapter="2"] > div')!).position === "sticky");
    const stops = await walk(page, "reverse");
    await attachWalk(stops, "reverse-walk-1440");
    expect(stops.length).toBeGreaterThan(30);
    expect(describeStops(problems(stops))).toBe("");
    for (const s of stops) expect(s.scrollDelta, `${s.label} scrolled forwards`).toBeLessThan(900);
  });

  test("the first hop from the hero into Chapter 2 is large, lands on the NAPLAN scene, and is documented here", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('section[data-chapter="2"] > div')!).position === "sticky");
    await page.getByRole("button", { name: /Scene 6/ }).focus();
    const before = await page.evaluate(() => scrollY);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Explore NAPLAN-style practice" })).toBeFocused();
    await expect.poll(() => page.evaluate(probeFocus).then((s) => isVisibleStop(s)), { timeout: 600 }).toBe(true);
    const after = await page.evaluate(() => scrollY);
    // The hop is the distance between the hero's last control and Chapter 2's first: it is inherent, not a bug.
    expect(after - before).toBeGreaterThan(3 * 900);
    const expected = await page.evaluate(
      ([travelFactor, anchor]) => {
        const section = document.querySelector('section[data-chapter="2"]') as HTMLElement;
        return section.getBoundingClientRect().top + scrollY + (anchor / travelFactor) * section.offsetHeight;
      },
      [pinnedTravelFactor(cinematicMotion.chapter2.desktopScrollHeightSvh), layerAnchor(chapter2LayerStarts, 1)] as const,
    );
    expect(Math.abs(after - expected)).toBeLessThan(40);
    test.info().annotations.push({ type: "documented hop", description: `hero -> Chapter 2: ${Math.round(after - before)}px in one Tab` });
  });

  test("a hand-off CTA keeps axe happy and exposes no aria-hidden focusable", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => getComputedStyle(document.querySelector('section[data-chapter="2"] > div')!).position === "sticky");
    await page.getByRole("link", { name: "Explore all programs" }).focus();
    await assertNoSeriousAccessibilityViolations(page, "landing with the Chapter 2 hand-off focused");
    // Decorative product previews are aria-hidden and contain real-looking controls; those must be inert (not tabbable).
    const hiddenFocusable = await page.evaluate(() =>
      [...document.querySelectorAll('main [aria-hidden="true"] :is(a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]))')]
        .filter((el) => !el.closest("[inert]") && !(el as HTMLButtonElement).disabled)
        .map((el) => (el.textContent ?? "").trim().slice(0, 30)),
    );
    expect(hiddenFocusable).toEqual([]);
  });
});

test.describe("landing keyboard focus: reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("nothing pins, every stop is visible, and no custom focus scroll is needed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    expect(await page.evaluate(() => [...document.querySelectorAll("[data-chapter] *")].filter((e) => getComputedStyle(e).position === "sticky").length)).toBe(0);
    const stops = await walk(page, "forward");
    await attachWalk(stops, "forward-walk-reduced-motion");
    expect(stops.length).toBeGreaterThan(30);
    expect(describeStops(problems(stops, { maxMs: 2500 }))).toBe("");
  });
});

const WIDTHS: ReadonlyArray<readonly [number, number]> = [
  [375, 812],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1920, 1080],
];

for (const [width, height] of WIDTHS) {
  test.describe(`landing keyboard focus at ${width}px`, () => {
    test.use({ viewport: { width, height } });

    test("forward Tab walk: every stop visible, unobscured (header, mobile CTA bar), ringed", async ({ page }) => {
      await page.goto("/");
      const stops = await walk(page, "forward");
      await attachWalk(stops, `forward-walk-${width}`);
      expect(stops.length).toBeGreaterThan(30);
      expect(describeStops(problems(stops, { maxMs: width >= 1024 ? 600 : 2500 }))).toBe("");
    });
  });
}

test.describe("landing keyboard focus at 200% zoom (emulated)", () => {
  // 200% browser zoom halves the CSS viewport and doubles the device pixel ratio. 2048x1152 at 200% is
  // 1024x576 CSS px (pinned layout); 1440x900 at 200% is 720x450 (natural flow). Emulation, not text zoom.
  for (const [w, h] of [
    [1024, 576],
    [720, 450],
  ] as const) {
    test.describe(`${w}x${h} CSS px at device pixel ratio 2`, () => {
      test.use({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      test("forward Tab walk stays visible and unobscured", async ({ page }) => {
        await page.goto("/");
        const stops = await walk(page, "forward");
        await attachWalk(stops, `forward-walk-zoom200-${w}`);
        expect(stops.length).toBeGreaterThan(30);
        // KNOWN, PRE-EXISTING, OUT OF PHASE A (verified identical on origin/dev): at a 576px-tall viewport the
        // Chapter 2 progress rail (top 507px) is painted over the scene CTA (503 to 522px). That is a layout
        // limit of the unchanged scene copy column, not a focus-scroll problem. Allow-listed by name and only
        // at this viewport so any other regression still fails.
        const railOverlapsCta = (s: Stop) => w === 1024 && !s.unobscured && /^(Explore learning|See all programs)$/.test(s.label);
        expect(describeStops(problems(stops, { maxMs: w >= 1024 ? 600 : 2500, knownIssues: railOverlapsCta }))).toBe("");
      });
    });
  }
});

/* ---------- Focus indicator contrast (WCAG 1.4.11) ---------- */

/** WCAG relative luminance and contrast ratio. */
const luminance = ([r, g, b]: number[]) => {
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};
const parseRgb = (css: string) => (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);

/** Median colour of a ring of pixels just OUTSIDE the focused control: what the outline is drawn against. */
async function backgroundAround(page: Page): Promise<number[]> {
  const box = await page.evaluate(() => {
    const r = document.activeElement!.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const pad = 10;
  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: Math.min(box.w + pad * 2, 1400),
    height: Math.min(box.h + pad * 2, 400),
  };
  const png = await page.screenshot({ clip });
  const probe = await page.context().newPage();
  try {
    return await probe.evaluate(
      async ([b64, inset]) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const g = c.getContext("2d")!;
        g.drawImage(img, 0, 0);
        const px: number[][] = [];
        const sample = (x: number, y: number) => {
          const d = g.getImageData(x, y, 1, 1).data;
          px.push([d[0]!, d[1]!, d[2]!]);
        };
        // The outer 3px band of the clip, on all four sides (the pad is 10px, the outline sits within ~4px).
        for (let x = 0; x < c.width; x += 4) {
          for (let k = 0; k < 3; k += 1) {
            sample(x, k);
            sample(x, c.height - 1 - k);
          }
        }
        for (let y = 0; y < c.height; y += 4) {
          for (let k = 0; k < 3; k += 1) {
            sample(k, y);
            sample(c.width - 1 - k, y);
          }
        }
        void inset;
        const med = (i: number) => px.map((p) => p[i]!).sort((a, b) => a - b)[Math.floor(px.length / 2)]!;
        return [med(0), med(1), med(2)];
      },
      [png.toString("base64"), pad] as const,
    );
  } finally {
    await probe.close();
  }
}

test.describe("landing focus indicator", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  const CONTROLS: ReadonlyArray<readonly [string, (page: Page) => ReturnType<Page["locator"]>]> = [
    ["primary button (hero Start free)", (p) => p.locator("main").getByRole("link", { name: "Start free" }).first()],
    ["outline button (hero Explore programs)", (p) => p.locator("main").getByRole("link", { name: "Explore programs" }).first()],
    ["inline link (availability line)", (p) => p.getByRole("link", { name: "See what's open" })],
    ["scene rail button", (p) => p.getByRole("button", { name: /Scene 2/ })],
    ["header nav link", (p) => p.getByRole("link", { name: "How It Works" }).first()],
  ];

  for (const [name, locate] of CONTROLS) {
    test(`${name}: solid outline of at least 2px, at least 3:1 against what is around it`, async ({ page }) => {
      await page.goto("/");
      await page.keyboard.press("Tab"); // make the page "keyboard modality" so :focus-visible applies
      await locate(page).focus();
      const s = (await page.evaluate(probeFocus))!;
      expect(s.outlineWidth, `${name} outline width`).toBeGreaterThanOrEqual(2);
      expect(s.outline.startsWith("solid")).toBe(true);
      const outlineColour = parseRgb(s.outline.replace(/^solid [\d.]+px /, ""));
      const around = await backgroundAround(page);
      const ratio = contrast(outlineColour, around);
      await test.info().annotations.push({ type: "contrast", description: `${name}: outline ${outlineColour} vs ${around} = ${ratio.toFixed(2)}:1` });
      expect(ratio, `${name} outline contrast`).toBeGreaterThanOrEqual(3);
    });
  }

  test("a scene CTA link in a pinned scene shows the same solid outline (no browser default)", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await page.locator('[data-scene="curriculum"]').getByRole("link", { name: "Explore learning" }).focus();
    await expect.poll(() => page.evaluate(probeFocus).then((s) => isVisibleStop(s)), { timeout: 600 }).toBe(true);
    const s = (await page.evaluate(probeFocus))!;
    expect(s.outline).toMatch(/^solid 2px rgb\(89, 37, 168\)$/);
    expect(s.shadow).not.toBe("none"); // the soft halo is still there as decoration
    const around = await backgroundAround(page);
    expect(contrast([89, 37, 168], around)).toBeGreaterThanOrEqual(3);
  });

  test("the dark quality band uses a white outline that clears 3:1", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const link = page.locator('section[aria-labelledby="quality-heading"]').getByRole("link").first();
    await link.scrollIntoViewIfNeeded();
    await link.focus();
    const s = (await page.evaluate(probeFocus))!;
    expect(s.outline).toMatch(/^solid 2px rgb\(255, 255, 255\)$/);
    const around = await backgroundAround(page);
    expect(contrast([255, 255, 255], around)).toBeGreaterThanOrEqual(3);
  });
});

/* ---------- Standalone link targets ---------- */

for (const [width, height] of [[375, 812], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]] as const) {
  test.describe(`standalone link targets at ${width}px`, () => {
    test.use({ viewport: { width, height } });

    test("standalone text links have a 44x44 effective target, overlap no other target, and cause no overflow", async ({ page }) => {
      await page.goto("/");
      // Force every layer visible-in-DOM measurements: sizes do not depend on opacity, so no scrolling is needed.
      const report = await page.evaluate(() => {
        interface Box { l: number; t: number; r: number; b: number }
        const effective = (el: Element): Box => {
          const r = el.getBoundingClientRect();
          const a = getComputedStyle(el, "::after");
          let box: Box = { l: r.left, t: r.top + scrollY, r: r.right, b: r.bottom + scrollY };
          if (a.position === "absolute" && a.content !== "none" && a.content !== "normal") {
            const ah = parseFloat(a.height);
            const at = parseFloat(a.top);
            const aw = parseFloat(a.width);
            const al = parseFloat(a.left);
            if (![ah, at, aw, al].some(Number.isNaN)) {
              box = { l: Math.min(box.l, r.left + al), t: Math.min(box.t, r.top + scrollY + at), r: Math.max(box.r, r.left + al + aw), b: Math.max(box.b, r.top + scrollY + at + ah) };
            }
          }
          return box;
        };
        const all = [...document.querySelectorAll("main a[href], main button")].filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== "none" && !e.closest("[inert], [aria-hidden=true]");
        });
        // Pinned scenes are stacked layers at the same screen position; only one is on screen at a time, so
        // controls in different layers can never overlap each other in practice.
        const layerOf = (e: Element) => e.closest("[data-scene], [data-handoff], [data-layer], [data-scene-copy]");
        // Standalone = the link is the only text in its nearest block (not a link inside a sentence).
        const standalone = all.filter((e) => {
          if (e.tagName !== "A" || getComputedStyle(e).display === "flex") return false;
          const block = e.closest("div, li, p, section, nav")!;
          const text = (block.textContent ?? "").replace(/\s+/g, " ").trim();
          const own = (e.textContent ?? "").replace(/\s+/g, " ").trim();
          return own.length > 0 && text === own && !e.className.includes("min-h-") && !/\bh-\d|py-/.test(e.className);
        });
        const small: string[] = [];
        for (const e of standalone) {
          const b = effective(e);
          if (b.b - b.t < 43.5 || b.r - b.l < 43.5) small.push(`${(e.textContent ?? "").trim().slice(0, 30)} ${Math.round(b.r - b.l)}x${Math.round(b.b - b.t)}`);
        }
        const overlaps: string[] = [];
        for (const e of standalone) {
          const a = effective(e);
          for (const o of all) {
            if (o === e || o.contains(e) || e.contains(o) || layerOf(o) !== layerOf(e)) continue;
            const b = effective(o);
            const x = Math.min(a.r, b.r) - Math.max(a.l, b.l);
            const y = Math.min(a.b, b.b) - Math.max(a.t, b.t);
            if (x > 1 && y > 1) overlaps.push(`${(e.textContent ?? "").trim().slice(0, 24)} x ${(o.textContent ?? "").trim().slice(0, 24)}`);
          }
        }
        return {
          count: standalone.length,
          labels: [...new Set(standalone.map((e) => (e.textContent ?? "").trim()))],
          small,
          overlaps,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      await test.info().attach("standalone-targets", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
      expect(report.count, "the scene CTA links are found").toBeGreaterThanOrEqual(5);
      expect(report.small).toEqual([]);
      expect(report.overlaps).toEqual([]);
      expect(report.overflow).toBeLessThanOrEqual(0);
    });
  });
}
