import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://localhost:3020";
const SCREENSHOT_DIR = path.resolve("docs/audits/screenshots/p6");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-834", width: 834, height: 1194 },
  { name: "mobile-390", width: 390, height: 844 },
];

const PAGES = [
  {
    name: "parent-account",
    path: "/parent/account",
  },
  {
    name: "billing-handoff",
    path: "/parent/account/billing",
  },
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

      for (const target of PAGES) {
        const url = `${BASE_URL}${target.path}`;
        console.log(`Navigating to ${url} [${vp.name}]...`);
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);

        const outPath = path.join(
          SCREENSHOT_DIR,
          `${target.name}-${vp.name}.png`
        );
        await page.screenshot({ path: outPath, fullPage: true });
        console.log(`Saved screenshot: ${outPath}`);
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
