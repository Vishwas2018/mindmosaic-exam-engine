import { expect, test, type BrowserContext, type Page } from "@playwright/test";

/*
 * Chapters 3 and 4: keyboard focus placed BEFORE React hydrates must survive the swap from the server-rendered
 * natural-flow tree to the pinned tree (which replaces every DOM node). Every script is held back to reproduce a
 * slow connection, the page is released, and the same control must still hold focus, visible and unobscured,
 * with Tab and Shift+Tab continuing from it in the server-rendered order. Without the FocusKeeper the focused
 * node is removed, focus falls to <body> and the next Tab repeats the same control.
 */

async function holdScripts(page: Page) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/_next/static/**/*.js", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // The reproduction is only real while nothing has hydrated.
  expect(await page.evaluate(() => (document.querySelector('[data-scene="naplan"]') as HTMLElement).style.opacity)).toBe("1");
  return release;
}

const activeLabel = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return "<body>";
  // The progress rail appends "(current)" to the active button, which depends on scroll position, not identity.
  return (el.getAttribute("aria-label") || (el.textContent ?? "").trim().replace(/\s+/g, " ")).replace(/\(current\)$/, "").slice(0, 60);
};

/** Real Tab presses until focus is on the first control inside `section[data-chapter=N]`. */
async function tabIntoChapter(page: Page, chapter: number) {
  for (let i = 0; i < 120; i += 1) {
    await page.keyboard.press("Tab");
    if (await page.evaluate((c) => !!document.activeElement?.closest(`section[data-chapter="${c}"]`), chapter)) return;
  }
  throw new Error(`Tab never reached chapter ${chapter}`);
}

/** Runs in the page (serialised), so it cannot call helpers from this module. */
const probe = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  let opacity = 1;
  for (let n: Element | null = el; n; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const hit = document.elementFromPoint(cx, cy);
  return {
    label: (el.getAttribute("aria-label") || (el.textContent ?? "").trim().replace(/\s+/g, " ")).replace(/\(current\)$/, "").slice(0, 60),
    visible:
      opacity >= 0.99 && r.width > 0 && cx >= 0 && cx < innerWidth && cy >= 0 && cy < innerHeight && !!hit && (hit === el || el.contains(hit) || hit.contains(el)),
    opacity: Number(opacity.toFixed(3)),
    ring: cs.outlineStyle === "none" ? 0 : parseFloat(cs.outlineWidth),
    y: Math.round(scrollY),
  };
};

const pinnedChapter = (page: Page, chapter: number) =>
  page.waitForFunction(
    (c) => {
      const s = document.querySelector<HTMLElement>(`section[data-chapter="${c}"]`);
      return !!s && s.style.height !== "" && !!s.querySelector("[data-layer]");
    },
    chapter,
  );

const settled = async (page: Page) => {
  let y = -1;
  for (let stable = 0; stable < 5; ) {
    const now = await page.evaluate(() => Math.round(scrollY));
    stable = now === y ? stable + 1 : 0;
    y = now;
    await page.waitForTimeout(60);
  }
  return y;
};

/** The server-rendered stop before the chapter's first control, read on a separate held page. */
async function serverPrevious(page: Page, chapter: number) {
  const release = await holdScripts(page);
  await tabIntoChapter(page, chapter);
  await page.keyboard.press("Shift+Tab");
  const previous = await page.evaluate(activeLabel);
  release();
  await page.close(); // one held page at a time: concurrent loads of the production server were flaky
  return previous;
}

const CASES = [
  { chapter: 3, first: "Explore learning", next: "Try practice", afterFirst: "Try practice" },
  { chapter: 4, first: "Parent guide", next: "How we write and check questions", afterFirst: null },
] as const;

test.describe("pinned layout (1440x900): focus before hydration survives the tree swap", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const { chapter, first, next, afterFirst } of CASES) {
    /** Hold scripts, Tab into the chapter, release, and wait until focus is back on `first`, visible and settled. */
    async function restored(context: BrowserContext) {
      const page = await context.newPage();
      const release = await holdScripts(page);
      await tabIntoChapter(page, chapter);
      expect(await page.evaluate(activeLabel)).toBe(first);
      await page.evaluate(() => {
        const w = window as unknown as { __focusins: number };
        w.__focusins = 0;
        document.addEventListener("focusin", () => (w.__focusins += 1), true);
      });
      release();
      await pinnedChapter(page, chapter);
      // Focus returns to the same control, visible, unobscured and ringed, without another key press.
      await expect.poll(() => page.evaluate(probe).then((s) => !!s && s.visible && s.label === first), { timeout: 1500 }).toBe(true);
      expect((await page.evaluate(probe))!.ring).toBeGreaterThanOrEqual(2);
      await settled(page);
      expect((await page.evaluate(probe))!, "still on the control once scrolling settles").toMatchObject({ label: first, visible: true });
      // One restoring focus, no loop.
      expect(await page.evaluate(() => (window as unknown as { __focusins: number }).__focusins)).toBeLessThanOrEqual(2);
      return page;
    }

    test(`chapter ${chapter}: "${first}" keeps focus once hydrated and Tab advances to "${next}"`, async ({ context }) => {
      const page2 = await restored(context);
      // Tab walks forward from the restored control and never falls to <body>. Chapter 3's next stop is the next scene
      // link; in Chapter 4 the pinned layout's progress rail sits between "Parent guide" and the quality band link
      // (the rail is absent from the server-rendered page, so this walk is longer there).
      const stops: string[] = [];
      for (let i = 0; i < 8 && stops.at(-1) !== next; i += 1) {
        await page2.keyboard.press("Tab");
        await settled(page2);
        stops.push((await page2.evaluate(probe))?.label ?? "<body>");
      }
      expect(stops, "never lost focus to <body>").not.toContain("<body>");
      expect(stops.at(-1), `stops: ${stops.join(" > ")}`).toBe(next);
      if (afterFirst) expect(stops[0]).toBe(afterFirst);
      expect((await page2.evaluate(probe))!.visible).toBe(true);
    });

    test(`chapter ${chapter}: Shift+Tab from the restored "${first}" goes to the server-rendered previous stop`, async ({ page, context }) => {
      const previous = await serverPrevious(page, chapter);
      expect(previous).not.toBe("<body>");
      const page2 = await restored(context);
      await page2.keyboard.press("Shift+Tab");
      await settled(page2);
      expect((await page2.evaluate(probe))!.label).toBe(previous);
    });

    test(`chapter ${chapter}: user input during recovery is not fought, and focus is not stolen`, async ({ page }) => {
      const release = await holdScripts(page);
      await tabIntoChapter(page, chapter);
      release();
      await pinnedChapter(page, chapter);
      await expect.poll(() => page.evaluate(probe).then((s) => s?.label), { timeout: 1500 }).toBe(first);
      const before = await page.evaluate(() => Math.round(scrollY));
      // A wheel gesture releases the bounded hold at once: the page must follow the user, not snap back.
      await page.mouse.move(700, 400);
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => Math.round(scrollY))).toBeGreaterThan(before + 300);
    });
  }

  test("focus the user placed elsewhere before hydration is untouched (hero control, skip link)", async ({ page }) => {
    const release = await holdScripts(page);
    await page.keyboard.press("Tab"); // skip link
    const label = await page.evaluate(activeLabel);
    release();
    await pinnedChapter(page, 3);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(activeLabel)).toBe(label);
    expect(await page.evaluate(() => Math.round(scrollY))).toBeLessThan(5);
  });
});

test.describe("natural flow: the tree never swaps, so nothing is restored and nothing scrolls", () => {
  for (const [name, viewport, reducedMotion] of [
    ["reduced motion at 1440x900", { width: 1440, height: 900 }, "reduce"],
    ["a short desktop viewport (1280x633)", { width: 1280, height: 633 }, "no-preference"],
    ["a phone (390x844)", { width: 390, height: 844 }, "no-preference"],
  ] as const) {
    test.describe(name, () => {
      test.use({ viewport, contextOptions: { reducedMotion } });
      for (const { chapter, first } of CASES) {
        test(`chapter ${chapter}: same node stays focused, no focus churn, no new scroll`, async ({ page }) => {
          const release = await holdScripts(page);
          await tabIntoChapter(page, chapter);
          expect(await page.evaluate(activeLabel)).toBe(first);
          await page.evaluate(() => {
            (document.activeElement as HTMLElement).setAttribute("data-diag", "1");
            const w = window as unknown as { __out: number };
            w.__out = 0;
            document.addEventListener("focusout", () => (w.__out += 1), true);
          });
          const yBefore = await settled(page); // the browser's own focus scroll has finished
          release();
          // Natural flow has no pinned-stage signal to wait for: give hydration (and any swap, were there one) ample time.
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(2500);
          const after = await page.evaluate(() => ({
            marked: document.activeElement?.getAttribute("data-diag") === "1",
            out: (window as unknown as { __out: number }).__out,
            y: Math.round(scrollY),
          }));
          expect(after.marked, "the very same DOM node is still focused").toBe(true);
          expect(after.out).toBe(0);
          expect(after.y).toBe(yBefore);
        });
      }
    });
  }
});
