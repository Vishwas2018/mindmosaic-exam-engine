// node jank.mjs <port> <label> <endY> : no video recording; rAF gaps and long tasks while wheeling 0..endY, 4 runs
import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch1-scroll/node_modules/@playwright/test/index.mjs";
const [port, label, endY] = process.argv.slice(2);
const b = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--no-proxy-server"] });
const rows = [];
for (let run = 0; run < 4; run++) {
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    window.__lt = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.duration); }).observe({ type: "longtask", buffered: true });
  });
  await page.goto(`http://localhost:${port}/`, { waitUntil: "load" });
  await page.mouse.move(720, 450);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__gaps = []; let l = performance.now(); const f = (t) => { window.__gaps.push(t - l); l = t; requestAnimationFrame(f); }; requestAnimationFrame(f); window.__lt.length = 0; });
  let y = 0;
  while (y < +endY) { await page.mouse.wheel(0, 50); await page.waitForTimeout(70); y = await page.evaluate(() => scrollY); }
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({ gaps: window.__gaps, lt: window.__lt }));
  const s = [...r.gaps].sort((a, b) => a - b);
  rows.push({ frames: r.gaps.length, p95: +s[Math.floor(s.length * 0.95)].toFixed(1), over25: r.gaps.filter((g) => g > 25).length, over50: r.gaps.filter((g) => g > 50).length, maxGap: Math.round(s.at(-1)), longtasks50: r.lt.filter((d) => d >= 50).length, maxTask: Math.round(Math.max(0, ...r.lt)) });
  await page.close();
}
console.log(label, "endY", endY);
for (const r of rows) console.log("  ", JSON.stringify(r));
await b.close();
