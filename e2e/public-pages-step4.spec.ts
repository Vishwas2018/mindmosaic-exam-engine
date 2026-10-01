import { expect, test, type Page } from "@playwright/test";

/*
 * Public-pages Step 4: Programs, Program detail, How It Works, Plans,
 * Resources, Resource detail, About, Help & contact — plus the three
 * redirects that replaced their old interim/retired destinations.
 */

const PAGES = [
  { path: "/programs", heading: "Programs" },
  { path: "/programs/naplan-style", heading: "NAPLAN-style" },
  { path: "/programs/icas-style", heading: "ICAS-style" },
  { path: "/resources", heading: "Resources" },
  { path: "/resources/how-we-check-questions", heading: "How we write and check questions" },
  { path: "/how-it-works", heading: null },
  { path: "/help", heading: "Help and contact" },
  { path: "/pricing", heading: "Free to practise." },
  { path: "/about", heading: null },
] as const;

/** Tabs forward from the top of the page until `locator` is the focused element, or gives up. */
async function tabUntilFocused(page: Page, locator: ReturnType<Page["getByRole"]>, maxTabs = 40) {
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate((el) => el === document.activeElement).catch(() => false)) return;
  }
  throw new Error("Element was not reached by keyboard within the tab budget");
}

async function hasVisibleFocusRing(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return false;
    const style = getComputedStyle(el);
    const hasOutline = style.outlineStyle !== "none" && style.outlineWidth !== "0px";
    const hasRing = style.boxShadow !== "none" && style.boxShadow !== "";
    return hasOutline || hasRing;
  });
}

test.describe("public pages step 4 — viewport", () => {
  for (const { path } of PAGES) {
    for (const width of [375, 768, 1440] as const) {
      test(`${path}: no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const [scrollWidth, clientWidth] = await page.evaluate(() => [
          document.documentElement.scrollWidth,
          document.documentElement.clientWidth,
        ]);
        expect(
          scrollWidth,
          `${path}: scrollWidth (${scrollWidth}) should not exceed clientWidth (${clientWidth}) at ${width}px`,
        ).toBeLessThanOrEqual(clientWidth);
      });
    }
  }
});

test.describe("public pages step 4 — reduced motion", () => {
  for (const { path, heading } of PAGES) {
    test(`${path}: renders with no console errors under prefers-reduced-motion`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      if (heading) {
        await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      } else {
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
      expect(errors, `console errors under reduced motion on ${path}:\n${errors.join("\n")}`).toEqual([]);
    });
  }

  test("/programs: year picker still works with reduced motion on", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/programs");
    await page.getByRole("radio", { name: /^Year 5/ }).click();
    await expect(page.getByRole("heading", { name: "Open for Year 5" })).toBeVisible();
  });

  test("/help: FAQ accordion still works with reduced motion on", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/help");
    await page.getByRole("button", { name: /forgot my parent password/i }).click();
    await expect(page.getByText(/forgot password.*on the log in page/i)).toBeVisible();
  });
});

test.describe("public pages step 4 — keyboard", () => {
  test("/programs: year radio buttons are keyboard-reachable with a visible focus ring", async ({ page }) => {
    await page.goto("/programs");
    const year5 = page.getByRole("radio", { name: /^Year 5/ });
    await tabUntilFocused(page, year5);
    expect(await hasVisibleFocusRing(page)).toBe(true);
  });

  test("/programs/naplan-style: the Start free link is keyboard-reachable with a visible focus ring", async ({
    page,
  }) => {
    await page.goto("/programs/naplan-style");
    const startFree = page.getByRole("complementary", { name: "Get started" }).getByRole("link", {
      name: "Start free",
    });
    await tabUntilFocused(page, startFree);
    expect(await hasVisibleFocusRing(page)).toBe(true);
  });

  test("/help: the first FAQ button is keyboard-reachable, and Enter toggles it", async ({ page }) => {
    await page.goto("/help");
    const first = page.getByRole("button", { name: /child can.t sign in/i });
    await tabUntilFocused(page, first);
    expect(await hasVisibleFocusRing(page)).toBe(true);
    // Open by default; Enter should close it.
    await expect(page.getByText(/exactly 6 digits/i)).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/exactly 6 digits/i)).toBeHidden();
  });

  test("/resources: a published-article link is keyboard-reachable with a visible focus ring", async ({
    page,
  }) => {
    await page.goto("/resources");
    const link = page.getByRole("link", { name: /student tips/i });
    await tabUntilFocused(page, link);
    expect(await hasVisibleFocusRing(page)).toBe(true);
  });
});

test.describe("public pages step 4 — redirects", () => {
  test("/methodology redirects permanently to /how-it-works", async ({ page }) => {
    const response = await page.request.get("/methodology", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain("/how-it-works");
  });

  test("/contact redirects permanently to /help#contact", async ({ page }) => {
    const response = await page.request.get("/contact", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain("/help#contact");
  });

  test("/plans redirects permanently to /pricing", async ({ page }) => {
    const response = await page.request.get("/plans", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain("/pricing");
  });
});

test.describe("public pages step 4 — unknown slugs", () => {
  test("/programs/not-a-real-program 404s", async ({ page }) => {
    const response = await page.goto("/programs/not-a-real-program");
    expect(response?.status()).toBe(404);
  });

  test("/resources/not-a-real-article 404s", async ({ page }) => {
    const response = await page.goto("/resources/not-a-real-article");
    expect(response?.status()).toBe(404);
  });
});
