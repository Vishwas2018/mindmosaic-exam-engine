import {expect, type Page} from "@playwright/test";

type Viewport = {name: string; width: number; height: number};

type QualityMonitorOptions = {
  allowConsoleErrors?: RegExp[];
  allowConsoleWarnings?: RegExp[];
  allowRequestFailures?: RegExp[];
};

export async function stabilizePage(page: Page): Promise<void> {
  await page.emulateMedia({reducedMotion: "reduce"});
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition: none !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  });

  await page.evaluate(async () => {
    try {
      if ("fonts" in document && document.fonts && "ready" in document.fonts) {
        await document.fonts.ready;
      }
    } catch {
      // Ignore browsers that do not expose font loading APIs.
    }
  });
}

export async function setViewport(
  page: Page,
  viewport: Viewport,
): Promise<void> {
  await page.setViewportSize({width: viewport.width, height: viewport.height});
  await stabilizePage(page);
}

export async function visitAndStabilize(
  page: Page,
  path: string,
  options?: {readyLocator?: string; title?: RegExp},
): Promise<void> {
  await page.goto(path, {waitUntil: "domcontentloaded"});
  await stabilizePage(page);

  if (options?.readyLocator) {
    await page
      .locator(options.readyLocator)
      .first()
      .waitFor({state: "visible"});
  }

  if (options?.title) {
    await expect(page).toHaveTitle(options.title);
  }
}

export function createQualityMonitor(
  page: Page,
  options: QualityMonitorOptions = {},
) {
  const issues: string[] = [];
  const allowConsoleErrors = options.allowConsoleErrors ?? [];
  const allowConsoleWarnings = options.allowConsoleWarnings ?? [];
  const allowRequestFailures = options.allowRequestFailures ?? [];

  page.on("console", (message) => {
    const text = message.text();
    const isAllowed =
      (message.type() === "error" &&
        allowConsoleErrors.some((pattern) => pattern.test(text))) ||
      (message.type() === "warning" &&
        allowConsoleWarnings.some((pattern) => pattern.test(text)));

    if (message.type() === "error" && !isAllowed) {
      issues.push(`console.error: ${text}`);
    }

    if (message.type() === "warning" && !isAllowed) {
      issues.push(`console.warning: ${text}`);
    }
  });

  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    const failureText = request.failure()?.errorText ?? "unknown";
    const isSameOrigin = (() => {
      try {
        return new URL(url).origin === new URL(page.url()).origin;
      } catch {
        return false;
      }
    })();

    const isAllowed =
      allowRequestFailures.some((pattern) => pattern.test(url)) ||
      /ERR_ABORTED/i.test(failureText);

    if (isSameOrigin && !isAllowed) {
      issues.push(`requestfailed: ${url} (${failureText})`);
    }
  });

  page.on("response", (response) => {
    if (response.status() >= 500) {
      const url = response.url();
      const isSameOrigin = (() => {
        try {
          return new URL(url).origin === new URL(page.url()).origin;
        } catch {
          return false;
        }
      })();

      if (isSameOrigin) {
        issues.push(`response-status: ${response.status()} ${url}`);
      }
    }
  });

  return {
    assertClean: () => expect(issues).toEqual([]),
  };
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const htmlScrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
    const viewportWidth = window.innerWidth;
    return Math.max(htmlScrollWidth, bodyScrollWidth) - viewportWidth > 1;
  });

  expect(overflow).toBe(false);
}

export async function expectWithinViewport(
  page: Page,
  selector: string,
): Promise<void> {
  const withinViewport = await page
    .locator(selector)
    .evaluateAll((elements) => {
      return elements.some((element) => {
        const rect = element.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0;
        const intersectsViewport =
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0;
        return visible && intersectsViewport;
      });
    });

  expect(withinViewport).toBe(true);
}

export async function expectDialogWithinViewport(
  page: Page,
  testId: string,
): Promise<void> {
  await expect(page.getByTestId(testId)).toBeVisible();
  await expectWithinViewport(page, `[data-testid="${testId}"]`);
}

export async function configureExam(
  page: Page,
  options: {
    yearLevel: string;
    examStyle: string;
    subject: string;
    questionCount: string;
    timing: string;
  },
): Promise<void> {
  await page.getByTestId("select-year-level").selectOption(options.yearLevel);
  await page.getByTestId("select-exam-style").selectOption(options.examStyle);
  await page.getByTestId("select-subject").selectOption(options.subject);
  await page
    .getByTestId("select-question-count")
    .selectOption(options.questionCount);
  await page.getByTestId("select-timing").selectOption(options.timing);
}

export const A11Y_VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1024, height: 800 },
] as const;

/**
 * Flags interactive elements smaller than the 44px touch-target minimum
 * (Apple HIG / Material baseline). Checkbox/radio inputs are measured by
 * their wrapping `<label>` (the actual clickable area) rather than the
 * native control box, since a small input inside a large label is the
 * normal, accessible pattern.
 */
export async function expectMinimumTouchTargets(
  page: Page,
  selector: string,
  options?: { min?: number },
): Promise<void> {
  const min = options?.min ?? 44;
  const violations = await page.locator(selector).evaluateAll((elements, min) => {
    const measured = new Set<Element>();
    const bad: string[] = [];
    for (const element of elements) {
      const isCheckLike =
        element.tagName === "INPUT" &&
        ["checkbox", "radio"].includes((element as HTMLInputElement).type);
      const target = (isCheckLike && element.closest("label")) || element;
      if (measured.has(target)) continue;
      measured.add(target);

      const style = window.getComputedStyle(target);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const rect = target.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      if (rect.width < min || rect.height < min) {
        const label =
          target.getAttribute("aria-label") ||
          target.textContent?.trim().slice(0, 40) ||
          target.tagName;
        bad.push(`${label} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
      }
    }
    return bad;
  }, min);

  expect(violations, `Touch targets under ${min}px: ${violations.join(", ")}`).toEqual([]);
}

/**
 * Tabs through the page, asserting every stop has a visible focus indicator
 * (outline or box-shadow) and is actually on-screen. Stops once the tab
 * order loops back to an already-seen stop (repeated twice, to tolerate a
 * single benign re-entry) rather than after a fixed count, so it works
 * across pages with very different control counts. Returns the ordered list
 * of stable keys (data-testid, id, or tag+text) it visited, so a caller can
 * assert specific controls appear in the expected relative order.
 */
export async function walkTabOrderAndAssertVisibleFocus(
  page: Page,
  options?: { maxSteps?: number },
): Promise<string[]> {
  const maxSteps = options?.maxSteps ?? 80;
  await page.keyboard.press("Tab");
  const sequence: string[] = [];
  const seen = new Set<string>();
  let repeats = 0;

  for (let i = 0; i < maxSteps; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const hasIndicator =
        (style.outlineStyle !== "none" && style.outlineWidth !== "0px") ||
        style.boxShadow !== "none";
      const key =
        el.getAttribute("data-testid") ||
        el.getAttribute("aria-label") ||
        el.id ||
        `${el.tagName}:${(el.textContent ?? "").trim().slice(0, 30)}`;
      return { key, visible: rect.width > 0 && rect.height > 0, hasIndicator };
    });

    if (!info) break;
    if (!info.visible) {
      throw new Error(`Focus stop "${info.key}" is not visible on screen`);
    }
    if (!info.hasIndicator) {
      throw new Error(`Focus stop "${info.key}" has no visible focus indicator`);
    }

    if (seen.has(info.key)) {
      repeats += 1;
      if (repeats > 1) break;
    } else {
      seen.add(info.key);
      sequence.push(info.key);
    }
    await page.keyboard.press("Tab");
  }

  return sequence;
}

export async function startExamSession(
  page: Page,
  options: {
    path: string;
    yearLevel: string;
    examStyle: string;
    subject: string;
    questionCount: string;
    timing: string;
  },
): Promise<void> {
  await visitAndStabilize(page, options.path, {readyLocator: "main"});
  await expect(
    page.getByRole("heading", {name: "Set up an exam"}),
  ).toBeVisible();
  await configureExam(page, options);
  await page.getByTestId("start-exam").click();
  await expect(page).toHaveURL(/\/exam/);
}
