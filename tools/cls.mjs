import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch1-scroll/node_modules/@playwright/test/index.mjs";
const port = process.argv[2];
const b = await chromium.launch({ args: ["--use-angle=d3d11", "--no-proxy-server"] });
for (let i = 0; i < 6; i++) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__shifts.push({ v: +e.value.toFixed(5), t: Math.round(e.startTime), s: e.sources.map((s) => (s.node?.nodeName ?? "?") + "." + String(s.node?.className ?? "").slice(0, 50) + " " + JSON.stringify(s.previousRect) + "->" + JSON.stringify(s.currentRect)) }); }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`http://localhost:${port}/`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const s = await page.evaluate(() => window.__shifts);
  console.log("run", i, s.length ? JSON.stringify(s).slice(0, 700) : "no shifts");
  await ctx.close();
}
await b.close();
