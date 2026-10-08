// node perfm.mjs <port> <label> : LCP, CLS, image payload (initial and after the Chapter 1 scroll), scroll cost
import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch1-scroll/node_modules/@playwright/test/index.mjs";
const [port, label] = process.argv.slice(2);
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--no-proxy-server"] });
const out = {};
for (const [vp, w, h] of [["desktop-1440x900", 1440, 900], ["mobile-375x812", 375, 812]]) {
  const runs = [];
  for (let i = 0; i < 5; i += 1) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Performance.enable");
    const imgs = new Map();
    cdp.on("Network.responseReceived", (e) => { if (e.type === "Image") imgs.set(e.requestId, e.response.url); });
    const bytes = new Map();
    cdp.on("Network.loadingFinished", (e) => { if (imgs.has(e.requestId)) bytes.set(e.requestId, e.encodedDataLength); });
    await page.addInitScript(() => {
      window.__lcp = 0; window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(`http://localhost:${port}/`, { waitUntil: "load" });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const sum = () => [...bytes.values()].reduce((a, b) => a + b, 0);
    const initial = { count: bytes.size, kb: Math.round(sum() / 1024) };
    const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
    // Scroll the whole hero (and a little past it) the way a person does.
    await page.mouse.move(w / 2, h / 2);
    const target = w >= 1024 ? 5200 : 2600;
    let y = 0;
    while (y < target) { await page.mouse.wheel(0, 100); await page.waitForTimeout(40); y = await page.evaluate(() => scrollY); }
    await page.waitForTimeout(1500);
    const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
    const vitals = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: +window.__cls.toFixed(4) }));
    runs.push({ ...vitals, initial, after: { count: bytes.size, kb: Math.round(sum() / 1024) }, scriptMs: Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000), layouts: m1.LayoutCount - m0.LayoutCount, recalcs: m1.RecalcStyleCount - m0.RecalcStyleCount });
    await ctx.close();
  }
  out[vp] = {
    lcpMs: median(runs.map((r) => r.lcp)), cls: median(runs.map((r) => r.cls)),
    initialImages: median(runs.map((r) => r.initial.count)), initialKB: median(runs.map((r) => r.initial.kb)),
    afterScrollImages: median(runs.map((r) => r.after.count)), afterScrollKB: median(runs.map((r) => r.after.kb)),
    scrollScriptMs: median(runs.map((r) => r.scriptMs)), scrollLayouts: median(runs.map((r) => r.layouts)), scrollRecalcs: median(runs.map((r) => r.recalcs)),
  };
}
console.log(label, JSON.stringify(out, null, 1));
await browser.close();
