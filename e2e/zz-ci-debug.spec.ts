import { expect, test } from "@playwright/test";

// TEMPORARY CI diagnostics for the screen-validation landing-shell timeout. Delete before merge.
test("ci debug: landing shell steps with timing", async ({ page }) => {
  test.setTimeout(60_000);
  const log: string[] = [];
  const t0 = Date.now();
  const mark = (s: string) => log.push(`${Date.now() - t0}ms ${s}`);
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && mark(`console.${m.type()}: ${m.text().slice(0, 200)}`));
  page.on("pageerror", (e) => mark(`pageerror: ${String(e).slice(0, 300)}`));
  page.on("requestfailed", (r) => mark(`requestfailed: ${r.url().slice(0, 120)} ${r.failure()?.errorText}`));
  page.on("response", (r) => r.url().includes("/_next/image") && mark(`img ${r.status()} ${decodeURIComponent(r.url()).split("url=")[1]?.slice(0, 70)}`));
  const stabilize = async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
  };
  try {
    for (const [name, w, h] of [["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 390, 844]] as const) {
      mark(`${name}: setViewport`);
      await page.setViewportSize({ width: w, height: h });
      await stabilize();
      mark(`${name}: goto`);
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 20_000 });
      mark(`${name}: dcl`);
      await stabilize();
      await page.locator("main").first().waitFor({ state: "visible", timeout: 10_000 });
      mark(`${name}: main visible`);
      await expect(page.getByRole("heading", { level: 1, name: /Learn with purpose/i })).toBeVisible({ timeout: 10_000 });
      mark(`${name}: h1 visible`);
      await expect(page.getByRole("link", { name: "Start free" }).first()).toBeVisible({ timeout: 10_000 });
      mark(`${name}: start free visible`);
    }
    mark("done");
  } catch (error) {
    mark(`FAILED: ${String(error).split("\n")[0]}`);
  }
  throw new Error("CI-DEBUG\n" + log.join("\n"));
});
