import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * Chapter 2 preview windows on phones, asserted on real visible boundaries.
 *
 * "Present in the DOM" and even toBeVisible() pass for an element that is half cut off by an
 * `overflow: hidden` ancestor, or pushed below the screen's own bottom edge. So every check here
 * measures the element's rendered box (text: its Range rects) and intersects it with the clip box of
 * each overflow-clipping ancestor up to the preview window, then with the viewport. An element only
 * counts as visible when nothing of it is cut off (within 1px of antialiasing).
 */

const PHONES = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;
const SCENES = ["naplan", "icas", "curriculum", "amc", "singapore", "selective"] as const;
const PLANNED = ["amc", "singapore", "selective"] as const;
const TOLERANCE = 1;

interface Cut {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Runs in the page. How many CSS px of `target` fall outside each clipping ancestor and the viewport. */
function measureCut(selectorOrEl: { scene: string; pick: string; text?: string }) {
  const scene = document.querySelector(`section[data-chapter="2"] [data-scene="${selectorOrEl.scene}"]`)!;
  const windowEl = scene.querySelector("[data-preview-window]")!;
  const all = [...windowEl.querySelectorAll<HTMLElement>(selectorOrEl.pick)];
  const matches = selectorOrEl.text === undefined ? all : all.filter((el) => (el.textContent ?? "").trim() === selectorOrEl.text);
  return matches.map((el) => {
    const boxes: DOMRect[] = [];
    const range = document.createRange();
    range.selectNodeContents(el);
    // An element is judged by its own border box and by the text it holds (text can overflow a box that is itself fine).
    boxes.push(el.getBoundingClientRect(), ...range.getClientRects());
    const clips: DOMRect[] = [];
    for (let node: HTMLElement | null = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      const clipsOverflow = style.overflowX !== "visible" || style.overflowY !== "visible";
      if (clipsOverflow && node !== el) clips.push(node.getBoundingClientRect());
      if (node === windowEl) break;
    }
    const viewport = new DOMRect(0, 0, window.innerWidth, window.innerHeight);
    const cut: Cut = { left: 0, right: 0, top: 0, bottom: 0 };
    for (const box of boxes) {
      if (box.width === 0 && box.height === 0) continue;
      for (const clip of [...clips, viewport]) {
        cut.left = Math.max(cut.left, clip.left - box.left);
        cut.right = Math.max(cut.right, box.right - clip.right);
        cut.top = Math.max(cut.top, clip.top - box.top);
        cut.bottom = Math.max(cut.bottom, box.bottom - clip.bottom);
      }
    }
    const r = el.getBoundingClientRect();
    return { text: (el.textContent ?? "").trim().slice(0, 60), size: [r.width, r.height], cut };
  });
}

async function cutsFor(page: Page, scene: string, pick: string, text?: string) {
  return page.evaluate(measureCut, { scene, pick, text });
}

async function expectFullyVisible(page: Page, scene: string, pick: string, expectedCount: number, text?: string) {
  const found = await cutsFor(page, scene, pick, text);
  expect(found, `${scene}: ${pick}${text ? ` "${text}"` : ""} count`).toHaveLength(expectedCount);
  for (const item of found) {
    expect(item.size[0], `${scene}: "${item.text}" has width`).toBeGreaterThan(0);
    expect(item.size[1], `${scene}: "${item.text}" has height`).toBeGreaterThan(0);
    for (const [side, px] of Object.entries(item.cut)) {
      expect(px, `${scene}: "${item.text}" cut off at its ${side} by ${px.toFixed(1)}px`).toBeLessThanOrEqual(TOLERANCE);
    }
  }
}

/** Brings one scene's preview window to the middle of the viewport and waits for it to be fitted. */
async function showScene(page: Page, scene: string): Promise<Locator> {
  const frame = page.locator(`section[data-chapter="2"] [data-scene="${scene}"] [data-preview-window]`);
  await frame.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(frame.locator("[data-preview-skeleton]")).toHaveCount(0);
  await expect(frame.locator("[data-preview-canvas]")).not.toHaveCSS("visibility", "hidden");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        const y = window.scrollY;
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(window.scrollY === y)));
      }),
  );
  return frame;
}

for (const phone of PHONES) {
  test.describe(`Chapter 2 previews at ${phone.width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(phone);
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    });

    test("each window sits whole inside the viewport and its screen fills it edge to edge", async ({ page }) => {
      for (const id of SCENES) {
        const frame = await showScene(page, id);
        const { box, canvas, viewport } = await frame.evaluate((el) => {
          const f = el.getBoundingClientRect();
          const c = el.querySelector("[data-preview-canvas]")!.getBoundingClientRect();
          // The canvas fills the frame's padding box: the 1px border is outside it.
          return {
            box: [f.left, f.top, f.right, f.bottom],
            canvas: [c.width, c.height, el.clientWidth, el.clientHeight],
            viewport: [window.innerWidth, window.innerHeight],
          };
        });
        expect(box[0]!, `${id} left`).toBeGreaterThanOrEqual(0);
        expect(box[2]!, `${id} right`).toBeLessThanOrEqual(viewport[0]!);
        expect(box[1]!, `${id} top`).toBeGreaterThanOrEqual(0);
        expect(box[3]!, `${id} bottom`).toBeLessThanOrEqual(viewport[1]!);
        expect(Math.abs(canvas[0]! - canvas[2]!), `${id} canvas width vs frame`).toBeLessThan(2);
        expect(Math.abs(canvas[1]! - canvas[3]!), `${id} canvas height vs frame`).toBeLessThan(2);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${id} no horizontal scroll`).toBe(true);
      }
    });

    test("NAPLAN answer options A to D are completely visible, option D included", async ({ page }) => {
      await showScene(page, "naplan");
      // The four option rows (labels), then each row's letter chip, radio and answer text.
      await expectFullyVisible(page, "naplan", '[role="radiogroup"] > label', 4);
      await expectFullyVisible(page, "naplan", '[role="radiogroup"] > label > span', 8);
      await expectFullyVisible(page, "naplan", '[role="radiogroup"] > label > input', 4);
      for (const letter of ["A", "B", "C", "D"]) {
        await expectFullyVisible(page, "naplan", '[role="radiogroup"] > label > span[aria-hidden="true"]', 1, letter);
      }
      // Option D is the last row: it must also end above the question card's own footer buttons.
      const gap = await page.evaluate(() => {
        const scene = document.querySelector('section[data-chapter="2"] [data-scene="naplan"]')!;
        const rows = scene.querySelectorAll('[role="radiogroup"] > label');
        const d = rows[rows.length - 1]!.getBoundingClientRect();
        const footerButton = [...scene.querySelectorAll("button")].find((b) => (b.textContent ?? "").includes("Next question"))!;
        return footerButton.getBoundingClientRect().top - d.bottom;
      });
      expect(gap, "option D ends above the Previous/Next row").toBeGreaterThan(0);
    });

    test("AMC Term 6 and all of its answer choices are completely visible", async ({ page }) => {
      await showScene(page, "amc");
      for (const term of ["Term 1", "Term 2", "Term 3", "Term 4", "Term 5", "Term 6"]) {
        await expectFullyVisible(page, "amc", "span", 1, term);
      }
      await expectFullyVisible(page, "amc", "div.border-dashed", 2, "?");
      // The five answer choices are the grid cells that carry a letter chip and a number; each cell and its parts.
      for (const [index, value] of ["47", "71", "95", "96", "191"].entries()) {
        const letter = String.fromCharCode(65 + index);
        await expectFullyVisible(page, "amc", "span", 1, value);
        await expectFullyVisible(page, "amc", "span", 1, letter);
      }
      await expectFullyVisible(page, "amc", "div.min-h-12", 5);
    });

    test("the MindMosaic logo, programme labels, planned badges and captions are completely visible", async ({ page }) => {
      for (const id of SCENES) {
        await showScene(page, id);
        // The logo lockup (mark + wordmark) as a whole, the mark, and both halves of the wordmark.
        await expectFullyVisible(page, id, '[role="img"][aria-label="MindMosaic"]', 1);
        await expectFullyVisible(page, id, 'img[src*="brand"]', 1);
        await expectFullyVisible(page, id, "span", 1, "Mind");
        await expectFullyVisible(page, id, "span", 1, "Mosaic");
        if (PLANNED.includes(id as (typeof PLANNED)[number])) {
          await expectFullyVisible(page, id, "span.border-dashed", 1);
          const badge = (await cutsFor(page, id, "span.border-dashed"))[0]!;
          expect(badge.text, id).toMatch(/^Planned\s*·.*in development$/);
          await expectFullyVisible(page, id, "span", 1, "Illustrative concept screen. Not available yet.");
        }
      }
    });

    test("every line of text in every preview is wholly on screen and rendered at a readable size", async ({ page }) => {
      for (const id of SCENES) {
        const frame = await showScene(page, id);
        const result = await frame.evaluate((el) => {
          const canvas = el.querySelector<HTMLElement>("[data-preview-canvas]")!;
          const scale = canvas.getBoundingClientRect().width / canvas.offsetWidth;
          const clipRects = (node: HTMLElement) => {
            const rects: DOMRect[] = [];
            for (let n: HTMLElement | null = node; n; n = n.parentElement) {
              const s = getComputedStyle(n);
              if (n !== node && (s.overflowX !== "visible" || s.overflowY !== "visible")) rects.push(n.getBoundingClientRect());
              if (n === el) break;
            }
            return rects;
          };
          const clipped: string[] = [];
          let smallest = Infinity;
          let smallestText = "";
          const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
          for (let t = walker.nextNode(); t; t = walker.nextNode()) {
            const text = (t.textContent ?? "").trim();
            const parent = t.parentElement;
            if (!text || !parent || getComputedStyle(parent).visibility === "hidden") continue;
            const range = document.createRange();
            range.selectNodeContents(t);
            const clips = [...clipRects(parent), new DOMRect(0, 0, window.innerWidth, window.innerHeight)];
            for (const rect of range.getClientRects()) {
              if (rect.width === 0 || rect.height === 0) continue;
              for (const clip of clips) {
                // A line cut part-way is a defect. A line wholly past the edge is the lesson's own scroll
                // content running on below the window (Learn), which a still frame is meant to crop.
                const sides = [
                  [clip.left - rect.left, rect.width],
                  [rect.right - clip.right, rect.width],
                  [clip.top - rect.top, rect.height],
                  [rect.bottom - clip.bottom, rect.height],
                ] as const;
                for (const [px, extent] of sides) {
                  if (px > 1 && px < extent - 1) clipped.push(`"${text.slice(0, 40)}" cut by ${px.toFixed(1)}px of ${extent.toFixed(1)}px`);
                }
              }
            }
            const size = parseFloat(getComputedStyle(parent).fontSize) * scale;
            if (size < smallest) {
              smallest = size;
              smallestText = text.slice(0, 40);
            }
          }
          return { clipped: [...new Set(clipped)], smallest, smallestText, scale };
        });
        expect(result.clipped, `${id}: clipped text`).toEqual([]);
        // The least readable line on any phone screen, as it actually renders (font-size times the fit scale).
        expect(result.smallest, `${id}: smallest rendered text is "${result.smallestText}" (scale ${result.scale.toFixed(2)})`).toBeGreaterThanOrEqual(8);
      }
    });
  });
}
