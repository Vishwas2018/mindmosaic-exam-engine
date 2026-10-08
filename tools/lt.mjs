import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch1-scroll/node_modules/@playwright/test/index.mjs";
const port = process.argv[2];
const b = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--no-proxy-server"] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  window.__ev = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ k: "longtask", t: Math.round(e.startTime), d: Math.round(e.duration), y: Math.round(scrollY) }); }).observe({ type: "longtask", buffered: true });
  const mo = new MutationObserver((muts) => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1 && (n.matches?.("[data-hero-scene]") || n.querySelector?.("[data-hero-scene]"))) window.__ev.push({ k: "mount-layer", t: Math.round(performance.now()), y: Math.round(scrollY) }); });
  document.addEventListener("DOMContentLoaded", () => mo.observe(document.body, { childList: true, subtree: true }));
});
await page.goto(`http://localhost:${port}/`, { waitUntil: "load" });
await page.mouse.move(720, 450);
await page.waitForTimeout(1500);
let y = 0;
while (y < 3800) { await page.mouse.wheel(0, 50); await page.waitForTimeout(70); y = await page.evaluate(() => scrollY); }
await page.waitForTimeout(500);
const ev = await page.evaluate(() => window.__ev);
for (const e of ev.filter((e) => e.k !== "longtask" || e.d >= 50)) console.log(JSON.stringify(e));
await b.close();
