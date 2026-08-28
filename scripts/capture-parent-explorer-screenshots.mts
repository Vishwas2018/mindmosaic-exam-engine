import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { e2eEnv } from "../e2e/fixtures/env";
import { signInWithPassword, buildAuthCookies } from "../e2e/fixtures/session-cookie";
import { PARENTS } from "../e2e/fixtures/identities";
import { seed } from "../e2e/fixtures/seed";

const PORT = 3210;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SCREENSHOTS_DIR = join(process.cwd(), "docs", "curriculum", "screenshots");

async function waitForServer(url: string, maxRetries = 60): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not become ready in time`);
}

async function main() {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  console.log("Seeding e2e test users...");
  await seed();

  console.log("Starting Next.js server with Webpack on port", PORT, "...");
  const server = spawn("npx", ["next", "dev", "--webpack", "-p", String(PORT)], {
    shell: true,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(PORT),
      NEXT_PUBLIC_SUPABASE_URL: e2eEnv.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: e2eEnv.supabaseAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: e2eEnv.supabaseServiceRoleKey,
    },
  });

  try {
    await waitForServer(`${BASE_URL}/parent/curriculum-explorer`);
    console.log("Server is ready! Launching Chromium...");

    const browser = await chromium.launch({
      args: ["--no-proxy-server"],
    });

    // Obtain signed in parent session
    const parent = PARENTS[0]!;
    const session = await signInWithPassword(parent.email, e2eEnv.fixturePassword);
    const cookies = buildAuthCookies(BASE_URL, e2eEnv.supabaseUrl, session);

    // 1. Desktop - Year 3 Mathematics
    console.log("Capturing 01-desktop-year3-mathematics.png...");
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    await desktopContext.addCookies(cookies);
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${BASE_URL}/parent/curriculum-explorer`, {
      waitUntil: "networkidle",
    });

    await desktopPage.screenshot({
      path: join(SCREENSHOTS_DIR, "01-desktop-year3-mathematics.png"),
      fullPage: false,
    });

    // 2. Desktop - Year 5 English
    console.log("Capturing 02-desktop-year5-english.png...");
    await desktopPage.getByRole("radio", { name: /Year 5 \(Level 5\)/i }).click();
    await desktopPage.getByRole("radio", { name: /English/i }).click();
    await desktopPage.waitForTimeout(500);

    await desktopPage.screenshot({
      path: join(SCREENSHOTS_DIR, "02-desktop-year5-english.png"),
      fullPage: false,
    });

    // 3. Desktop - Skill Detail Modal
    console.log("Capturing 03-desktop-skill-detail-modal.png...");
    const exploreBtn = desktopPage.locator("button:has-text('Explore skill & activities')").first();
    await exploreBtn.scrollIntoViewIfNeeded();
    await exploreBtn.click();
    await desktopPage.waitForTimeout(1000);

    await desktopPage.screenshot({
      path: join(SCREENSHOTS_DIR, "03-desktop-skill-detail-modal.png"),
      fullPage: false,
    });

    await desktopContext.close();

    // 4. Mobile - Year 3 Mathematics
    console.log("Capturing 04-mobile-year3-mathematics.png...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await mobileContext.addCookies(cookies);
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/parent/curriculum-explorer`, {
      waitUntil: "networkidle",
    });

    await mobilePage.screenshot({
      path: join(SCREENSHOTS_DIR, "04-mobile-year3-mathematics.png"),
      fullPage: false,
    });

    // 5. Mobile - Skill Detail Modal
    console.log("Capturing 05-mobile-skill-detail-modal.png...");
    const mobileExploreBtn = mobilePage.locator("button:has-text('Explore skill & activities')").first();
    await mobileExploreBtn.scrollIntoViewIfNeeded();
    await mobileExploreBtn.click();
    await mobilePage.waitForTimeout(1000);

    await mobilePage.screenshot({
      path: join(SCREENSHOTS_DIR, "05-mobile-skill-detail-modal.png"),
      fullPage: false,
    });

    await mobileContext.close();
    await browser.close();

    console.log("All 5 screenshots captured successfully!");
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
