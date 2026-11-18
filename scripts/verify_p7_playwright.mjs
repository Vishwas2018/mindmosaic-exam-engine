import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PORT = process.env.PORT || "3021";
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve("docs/audits/screenshots/p7");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-834", width: 834, height: 1194 },
  { name: "mobile-390", width: 390, height: 844 },
];

async function capture() {
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      // 1. Help Centre Overview
      const url = `${BASE_URL}/parent/help`;
      console.log(`Navigating to ${url} [${vp.name}]...`);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);

      const outOverview = path.join(
        SCREENSHOT_DIR,
        `parent-help-centre-${vp.name}.png`
      );
      await page.screenshot({ path: outOverview, fullPage: true });
      console.log(`Saved screenshot: ${outOverview}`);

      // 2. Article Detail View ("My child has forgotten their PIN")
      // Click the first category "Getting your child signed in"
      const categoryBtn = page.locator("button:has-text('Getting your child signed in')");
      if (await categoryBtn.count() > 0) {
        await categoryBtn.first().click();
        await page.waitForTimeout(400);

        const outArticle = path.join(
          SCREENSHOT_DIR,
          `parent-help-article-${vp.name}.png`
        );
        await page.screenshot({ path: outArticle, fullPage: true });
        console.log(`Saved screenshot: ${outArticle}`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
