import { test, expect } from "../fixtures/auth.fixture";

/**
 * /admin/* carries an ENFORCED Content-Security-Policy on loopback and Vercel Preview (DEV). Admin pages render per
 * request, so Next nonces its own scripts. This spec proves the policy is enforced AND that real admin screens still
 * hydrate and work under it, with zero violations.
 */
const ADMIN_PAGES = [
  "/admin",
  "/admin/questions",
  "/admin/review",
  "/admin/review?bank=vihaan-scholarship-500",
  "/admin/papers",
  "/admin/publication",
  "/admin/writing",
  "/admin/support",
  "/admin/activity",
  "/admin/analytics",
  "/admin/intelligence",
  "/admin/operations",
];

test.describe("Admin CSP is enforced", () => {
  test("every admin page serves an enforced nonce policy, hydrates, and raises no CSP violation", async ({
    contextAs,
  }) => {
    test.setTimeout(240_000);
    const page = await (await contextAs("admin")).newPage();
    const violations: string[] = [];
    await page.addInitScript(() => {
      (window as unknown as { __cspViolations: string[] }).__cspViolations = [];
      document.addEventListener("securitypolicyviolation", (e) => {
        (window as unknown as { __cspViolations: string[] }).__cspViolations.push(
          `${e.violatedDirective} blocked ${e.blockedURI || "inline"} (${e.sourceFile ?? ""}:${e.lineNumber})`,
        );
      });
    });
    page.on("console", (msg) => {
      if (/Content Security Policy|Refused to/i.test(msg.text())) violations.push(`console: ${msg.text()}`);
    });

    for (const path of ADMIN_PAGES) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBeLessThan(400);
      const headers = response?.headers() ?? {};
      const policy = headers["content-security-policy"] ?? "";
      expect(policy, `${path} enforced policy`).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
      expect(policy, path).toContain("frame-ancestors 'none'");
      expect(policy, path).toContain("object-src 'none'");
      expect(headers["content-security-policy-report-only"], `${path} must not also be report-only`).toBeUndefined();
      await expect(page.getByRole("heading", { level: 1 }).first(), path).toBeVisible();
      // The nonce on the response must reach Next's own inline scripts, otherwise nothing hydrates.
      const unnonced = await page.evaluate(
        () =>
          Array.from(document.querySelectorAll("script:not([src])")).filter(
            (s) => !(s as HTMLScriptElement).nonce,
          ).length,
      );
      expect(unnonced, `${path} inline scripts without a nonce`).toBe(0);
      violations.push(
        ...(await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations)).map(
          (v) => `${path}: ${v}`,
        ),
      );
    }

    // Hydration proof: a client-side control must respond (a blocked bundle would leave it inert).
    await page.goto("/admin/review");
    const pool = page.getByLabel("Pool", { exact: true });
    await expect(pool).toBeVisible();
    await pool.selectOption("practice");
    await expect(
      page.getByRole("status").filter({ hasText: /drafts match your filters/ }),
    ).toBeVisible();

    expect(violations, violations.join("\n")).toEqual([]);
  });

  test("non-admin pages keep the report-only policy", async ({ page }) => {
    const response = await page.goto("/pricing");
    const headers = response?.headers() ?? {};
    expect(headers["content-security-policy"]).toBeUndefined();
    expect(headers["content-security-policy-report-only"]).toContain("default-src");
  });
});
