import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const PORT = 3018;
const BASE_URL = `http://localhost:${PORT}`;

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-834", width: 834, height: 1112 },
  { name: "mobile-390", width: 390, height: 844 },
];

const OUT_DIR = path.resolve("docs/audits/screenshots/p4");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  console.log(`Starting P4 Playwright verification on ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  const pagesToTest = [
    {
      route: "/parent/children/child-aisha/progress",
      slug: "child-progress-aisha",
      name: "Aisha's Progress Dashboard (Journey 4 Artboards #17 & #18)",
    },
    {
      route: "/parent/children/child-kabir/progress",
      slug: "child-progress-kabir-below-floor",
      name: "Kabir's Progress - Below Evidence Floor (Artboard #09 State 1)",
    },
    {
      route: "/parent/children/child-maya/progress",
      slug: "child-progress-maya-nothing-yet",
      name: "Maya's Progress - No Finished Papers (Artboard #09 State 2)",
    },
    {
      route: "/parent/results/res-reading-301",
      slug: "result-reading-301",
      name: "Paper Result Detail - NAPLAN-style Reading (Artboard #31)",
    },
    {
      route: "/parent/results/res-reading-301/review",
      slug: "answer-review-reading-all",
      name: "Worked Answer Review - All Questions (Artboard #08)",
    },
  ];

  for (const pageItem of pagesToTest) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      try {
        console.log(`Navigating to ${BASE_URL}${pageItem.route} [${vp.name}]...`);
        await page.goto(`${BASE_URL}${pageItem.route}`, {
          waitUntil: "networkidle",
          timeout: 20000,
        });

        // Wait for main content to render
        await page.waitForSelector("h1", { timeout: 10000 });

        const filename = `${pageItem.slug}-${vp.name}.png`;
        const filePath = path.join(OUT_DIR, filename);
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`Saved screenshot: ${filename}`);
      } catch (err) {
        console.error(`Error capturing ${pageItem.route} on ${vp.name}:`, err.message);
      } finally {
        await context.close();
      }
    }
  }

  // Also capture answer review with filter clicked ("Not correct")
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}/parent/results/res-reading-301/review`, {
        waitUntil: "networkidle",
        timeout: 20000,
      });
      // Click "Not correct 3"
      const notCorrectBtn = page.getByRole("button", { name: /Not correct/i });
      if (await notCorrectBtn.count() > 0) {
        await notCorrectBtn.click();
        await page.waitForTimeout(500);
        const filename = `answer-review-reading-filtered-not-correct-desktop-1440.png`;
        const filePath = path.join(OUT_DIR, filename);
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`Saved screenshot: ${filename}`);
      }
    } catch (err) {
      console.error(`Error capturing filtered answer review:`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log("Playwright P4 verification complete!");
}

run().catch((err) => {
  console.error("Verification script failed:", err);
  process.exit(1);
});
