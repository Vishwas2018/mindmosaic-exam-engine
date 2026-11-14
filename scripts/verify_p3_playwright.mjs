import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = "C:/tmp/wt-pj-p3/docs/audits/screenshots/p3";
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "desktop-1440", width: 1440, height: 900 },
    { name: "tablet-834", width: 834, height: 1194 },
    { name: "mobile-390", width: 390, height: 844 },
  ];

  console.log("Starting Parent P3 Playwright verification...");

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 1. Verify Children List (/parent/children)
    const listUrl = "http://localhost:3017/parent/children";
    console.log(`Navigating to ${listUrl} at ${vp.name}...`);
    await page.goto(listUrl, { waitUntil: "networkidle", timeout: 15000 });

    // Assertions
    const paidPlaces = page.locator('#paid-places-heading');
    console.log(`[${vp.name}] Paid places visible:`, await paidPlaces.isVisible());

    const childrenHeading = page.locator('#your-children-heading');
    console.log(`[${vp.name}] Your children visible:`, await childrenHeading.isVisible());

    const howSignIn = page.locator('#how-signin-heading');
    console.log(`[${vp.name}] How your children sign in visible:`, await howSignIn.isVisible());

    // Capture Children List screenshot
    const fileList = path.join(outDir, `children-list-${vp.name}.png`);
    await page.screenshot({ path: fileList, fullPage: false });
    console.log(`Saved screenshot: ${fileList}`);

    // 2. Verify Child Profile: Aisha (/parent/children/child-aisha)
    const aishaUrl = "http://localhost:3017/parent/children/child-aisha";
    console.log(`Navigating to ${aishaUrl} at ${vp.name}...`);
    await page.goto(aishaUrl, { waitUntil: "networkidle", timeout: 15000 });

    const aishaH1 = page.locator('h1:has-text("Aisha")');
    console.log(`[${vp.name}] Aisha profile heading visible:`, await aishaH1.isVisible());

    const detailsHeading = page.locator('h2:has-text("Details")');
    console.log(`[${vp.name}] Details section visible:`, await detailsHeading.isVisible());

    const accessHeading = page.locator('h2:has-text("Student access")');
    console.log(`[${vp.name}] Student access section visible:`, await accessHeading.isVisible());

    // Capture Aisha Profile screenshot
    const fileProfile = path.join(outDir, `child-profile-aisha-${vp.name}.png`);
    await page.screenshot({ path: fileProfile, fullPage: false });
    console.log(`Saved screenshot: ${fileProfile}`);

    // Modal verification on desktop
    if (vp.name === "desktop-1440") {
      // 3. Open Print Sign-in Card Dialog
      const printBtn = page.locator('button:has-text("Sign-in card")').first();
      if (await printBtn.isVisible()) {
        await printBtn.click();
        await page.waitForTimeout(300);
        const fileCardModal = path.join(outDir, `child-signin-card-modal-desktop-1440.png`);
        await page.screenshot({ path: fileCardModal, fullPage: false });
        console.log(`Saved screenshot: ${fileCardModal}`);
        // Close modal
        await page.locator('button:has-text("Close")').click();
        await page.waitForTimeout(200);
      }

      // 4. Open PIN Reset Dialog
      const pinBtn = page.locator('button:has-text("Reset PIN")').first();
      if (await pinBtn.isVisible()) {
        await pinBtn.click();
        await page.waitForTimeout(300);
        const filePinModal = path.join(outDir, `child-pin-reset-confirm-modal-desktop-1440.png`);
        await page.screenshot({ path: filePinModal, fullPage: false });
        console.log(`Saved screenshot: ${filePinModal}`);
        // Click Keep it to close
        await page.locator('button:has-text("Keep it")').click();
        await page.waitForTimeout(200);
      }
    }

    // 5. Verify Paused Child: Maya (/parent/children/child-maya)
    const mayaUrl = "http://localhost:3017/parent/children/child-maya";
    await page.goto(mayaUrl, { waitUntil: "networkidle", timeout: 15000 });
    const fileMaya = path.join(outDir, `child-profile-maya-paused-${vp.name}.png`);
    await page.screenshot({ path: fileMaya, fullPage: false });
    console.log(`Saved screenshot: ${fileMaya}`);

    await context.close();
  }

  await browser.close();
  console.log("Parent P3 Playwright verification completed successfully!");
}

run().catch((err) => {
  console.error("Error during Parent P3 Playwright verification:", err);
  process.exit(1);
});
