import { test, expect } from "../fixtures/auth.fixture";

/**
 * Stable post-merge smoke for the Scholarship Admin Portal (CI twin of hosted AR-06). Both banks load for an admin,
 * pool separation holds, the enforced CSP is present, and viewing writes nothing (no decision rows are created here).
 */
test("admin: both Scholarship banks load, pools split, CSP enforced, view is read-only", async ({ contextAs }) => {
  test.setTimeout(180_000);
  const page = await (await contextAs("admin")).newPage();
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.method() !== "HEAD" && !r.url().includes("/_next/")) {
      writes.push(`${r.method()} ${r.url()}`);
    }
  });
  const count = (n: number) =>
    expect(page.getByRole("status").filter({ hasText: /drafts match your filters/ })).toHaveText(
      `${n} drafts match your filters`,
      { timeout: 60_000 },
    );

  const core = await page.goto("/admin/review");
  await count(160);
  expect(core?.headers()["content-security-policy"] ?? "").toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(core?.headers()["content-security-policy-report-only"]).toBeUndefined();

  const codex = await page.goto("/admin/review?bank=vihaan-scholarship-500");
  await count(500);
  expect(codex?.headers()["content-security-policy"] ?? "").toContain("frame-ancestors 'none'");
  await page.getByLabel("Pool", { exact: true }).selectOption("practice");
  await count(400);
  await page.getByLabel("Pool", { exact: true }).selectOption("mock");
  await count(100);
  await page.getByLabel("Pool", { exact: true }).selectOption("");
  await expect(page.getByText(/Publication status: unpublished draft/i).first()).toBeVisible();

  expect(writes, writes.join("\n")).toEqual([]);
});
