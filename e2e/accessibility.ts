import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import type { NodeResult, Result } from "axe-core";

/**
 * WCAG 2.1 SC 1.4.3 (Contrast Minimum) explicitly exempts "text that is
 * part of a logo or brand name" from contrast minimums — axe-core has no
 * way to know a given span is a logotype, so it flags the "Mosaic"
 * wordmark accent (used only by MindMosaicLogo and LandingLogo — see
 * brand/BRAND.md) as a color-contrast violation on light backgrounds.
 * This is the one, single, known-exempt node this filters out — every
 * other element, and every other rule (including color-contrast on
 * anything else), is still asserted normally below.
 *
 * Both accent classes are matched because the wordmark has worn both:
 * "Phase 3 Step 2: logo unification" (3e93f3d) moved it from
 * `text-royal-orange-tint` (#f7700c) to `text-brand-coral` (#ff555a) and
 * did not update this filter, so from that commit every axe-scanned page —
 * marketing home, auth, legal, results, the practice catalogue — failed on
 * the same single exempt node. Matching the accent classes rather than the
 * literal `class="..."` attribute also stops a future utility being added
 * alongside it from silently re-breaking the match.
 */
const LOGO_WORDMARK_ACCENT_CLASSES = ["text-brand-coral", "text-royal-orange-tint"];

function isExemptLogoWordmarkNode(violation: Result, node: NodeResult): boolean {
  return (
    violation.id === "color-contrast" &&
    LOGO_WORDMARK_ACCENT_CLASSES.some((accent) => node.html.includes(accent)) &&
    node.html.includes("Mosaic")
  );
}

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
  const withoutExemptWordmarkNodes = results.violations
    .map((violation) => ({
      ...violation,
      nodes: violation.nodes.filter((node) => !isExemptLogoWordmarkNode(violation, node)),
    }))
    .filter((violation) => violation.nodes.length > 0);
  const seriousOrCritical = withoutExemptWordmarkNodes.filter(
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
