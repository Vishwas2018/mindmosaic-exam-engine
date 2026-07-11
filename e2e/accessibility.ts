import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/**
 * Fails the test if axe-core finds any "serious" or "critical" impact
 * violation on the current page. "minor"/"moderate" findings are not
 * asserted here — they're worth tracking but would make this an
 * over-strict gate on ongoing design decisions rather than a check for
 * "this page is unusable with assistive technology", which is what the
 * hardening pass requires.
 */
export async function assertNoSeriousAccessibilityViolations(
  page: Page,
  context?: string,
): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const seriousOrCritical = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );

  if (seriousOrCritical.length > 0) {
    const summary = seriousOrCritical
      .map(
        (violation) =>
          `- [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length} node(s))`,
      )
      .join("\n");
    throw new Error(
      `Serious/critical accessibility violations${context ? ` on ${context}` : ""}:\n${summary}`,
    );
  }

  expect(seriousOrCritical).toEqual([]);
}
