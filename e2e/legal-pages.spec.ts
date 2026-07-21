import { expect, test } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";

const LEGAL_LINKS: ReadonlyArray<{ label: string; href: string; heading: string }> = [
  { label: "Privacy", href: "/privacy", heading: "Privacy Policy" },
  { label: "Terms", href: "/terms", heading: "Terms of Service" },
  { label: "Accessibility", href: "/accessibility", heading: "Accessibility Statement" },
];

test.describe("footer legal links", () => {
  for (const { label, href, heading } of LEGAL_LINKS) {
    test(`"${label}" footer link resolves to a real page, not a "#" placeholder`, async ({
      page,
    }) => {
      await page.goto("/");

      const link = page.getByRole("contentinfo").getByRole("link", { name: label });
      await expect(link).toHaveAttribute("href", href);
      expect(await link.getAttribute("href")).not.toBe("#");

      await link.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });
  }
});

test.describe("legal pages: draft banner and accessibility", () => {
  for (const { href, heading } of LEGAL_LINKS) {
    test(`${href} shows the draft-review banner and has no serious/critical a11y violations`, async ({
      page,
    }) => {
      await page.goto(href);

      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(
        page.getByText(/DRAFT — requires legal\/professional review before public launch/i),
      ).toBeVisible();

      await assertNoSeriousAccessibilityViolations(page, `${href} page`);
    });
  }
});
