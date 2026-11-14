import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = "C:/tmp/wt-pj-p2/docs/audits/screenshots/p2";
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "desktop-1440", width: 1440, height: 900 },
    { name: "tablet-834", width: 834, height: 1194 },
    { name: "mobile-390", width: 390, height: 844 },
  ];

  console.log("Starting Parent P2 Playwright responsive verification...");

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const url = "http://localhost:3016/parent";
    console.log(`Navigating to ${url} at ${vp.name}...`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });

    // Verify Child Switcher
    const switcher = page.locator('[aria-label="Filter by child"]');
    console.log(`[${vp.name}] Child switcher visible:`, await switcher.isVisible());

    // Verify 7-day activity strip
    const activityStrip = page.locator('[aria-label*="7-day activity"]').first();
    console.log(`[${vp.name}] 7-day activity strip visible:`, await activityStrip.isVisible());

    // Verify Marks Meter
    const marksMeter = page.locator('text=/\\d+ of \\d+ marks/').first();
    console.log(`[${vp.name}] Marks meter visible:`, await marksMeter.isVisible());

    // If mobile, check bottom navigation
    if (vp.width <= 768) {
      const bottomNav = page.locator('nav[aria-label="Parent navigation, mobile"]').first();
      console.log(`[${vp.name}] Bottom nav visible:`, await bottomNav.isVisible());
    }

    // Capture initial screenshot (Aisha active by default or All children)
    const fileAll = path.join(outDir, `family-overview-all-${vp.name}.png`);
    await page.screenshot({ path: fileAll, fullPage: false });
    console.log(`Saved screenshot: ${fileAll}`);

    // Click Aisha
    const aishaBtn = page.locator('button:has-text("Aisha")').first();
    if (await aishaBtn.isVisible()) {
      await aishaBtn.click();
      await page.waitForTimeout(300);
      const fileAisha = path.join(outDir, `family-overview-aisha-${vp.name}.png`);
      await page.screenshot({ path: fileAisha, fullPage: false });
      console.log(`Saved screenshot: ${fileAisha}`);
    }

    // Click Kabir (Not enough yet state)
    const kabirBtn = page.locator('button:has-text("Kabir")').first();
    if (await kabirBtn.isVisible()) {
      await kabirBtn.click();
      await page.waitForTimeout(300);
      const fileKabir = path.join(outDir, `family-overview-kabir-${vp.name}.png`);
      await page.screenshot({ path: fileKabir, fullPage: false });
      console.log(`Saved screenshot: ${fileKabir}`);
    }

    // Capture forced states on desktop
    if (vp.name === "desktop-1440") {
      for (const st of ["loading", "error", "offline"]) {
        await page.goto(`${url}?state=${st}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);
        const fileSt = path.join(outDir, `family-overview-state-${st}-desktop-1440.png`);
        await page.screenshot({ path: fileSt, fullPage: false });
        console.log(`Saved state screenshot: ${fileSt}`);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log("Parent P2 Playwright verification completed successfully!");
}

run().catch((err) => {
  console.error("Error during Parent P2 Playwright verification:", err);
  process.exit(1);
});
