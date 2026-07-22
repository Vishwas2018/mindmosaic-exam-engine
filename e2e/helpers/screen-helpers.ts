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
