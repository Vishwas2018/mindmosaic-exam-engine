// Extra recordings: reduced motion, reverse scroll, 1024x768, 768x1024, 375x812
import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch1-scroll/node_modules/@playwright/test/index.mjs";
import fs from "node:fs";
const port = process.argv[2];
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--no-proxy-server"] });
const jobs = [
  { name: "reduced-1440", w: 1440, h: 900, reduced: true, plan: [[0, 2600, 1]] },
  { name: "reverse-1440", w: 1440, h: 900, q: [[0.05, 0.7, 1], [0.7, 0.05, -1]] },
  { name: "tablet-1024x768", w: 1024, h: 768, q: [[0.0, 1.05, 1]] },
  { name: "tablet-768x1024", w: 768, h: 1024, plan: [[0, 2600, 1]] },
  { name: "mobile-375x812", w: 375, h: 812, plan: [[0, 2800, 1]] },
];
fs.mkdirSync("rec2", { recursive: true });
for (const job of jobs.filter((j) => !process.argv[3] || process.argv[3].split(",").includes(j.name))) {
  const ctx = await browser.newContext({ viewport: { width: job.w, height: job.h }, recordVideo: { dir: `rec2/${job.name}`, size: { width: Math.min(960, job.w), height: Math.round((Math.min(960, job.w) * job.h) / job.w / 2) * 2 } }, reducedMotion: job.reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${port}/`, { waitUntil: "load" }); await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.mouse.move(job.w / 2, job.h / 2);
  const qToY = (q) => page.evaluate((qq) => { const s = document.querySelector('section[data-chapter="1"]'); const hs = (s.offsetHeight / innerHeight) * 100; const f = hs / (hs - 100); return Math.round(s.getBoundingClientRect().top + scrollY + (qq / f) * s.offsetHeight); }, q);
  const legs = job.q ? await Promise.all(job.q.map(async ([a, b, d]) => [await qToY(a), await qToY(b), d])) : job.plan;
  await page.waitForTimeout(800);
  for (const [from, to, dir] of legs) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), from);
    await page.waitForTimeout(500);
    let y = await page.evaluate(() => scrollY);
    while (dir > 0 ? y < to : y > to) {
      await page.mouse.wheel(0, dir * 50);
      await page.waitForTimeout(70);
      y = await page.evaluate(() => scrollY);
    }
  }
  await page.waitForTimeout(600);
  await ctx.close();
  console.log("recorded", job.name);
}
await browser.close();
