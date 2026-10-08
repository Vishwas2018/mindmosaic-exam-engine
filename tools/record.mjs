// node record.mjs <port> <label> <width> <height> <outDir> [before]
// Continuous wheel-stream recordings of Chapter 1 (after) or the old hero (before). Videos only; encoding is separate.
import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch1-scroll/node_modules/@playwright/test/index.mjs";
import fs from "node:fs";

const [port, label, w, h, outDir, mode = "after"] = process.argv.slice(2);
const W = +w, H = +h;
const size = { width: 960, height: Math.round((960 * H) / W / 2) * 2 };
const STEP = 50, GAP = 70;

// Chapter progress q -> page scroll y, from the live section geometry (same maths the page uses).
const qToY = (page, q) =>
  page.evaluate((qq) => {
    const section = document.querySelector('section[data-chapter="1"]');
    const heightSvh = (section.offsetHeight / innerHeight) * 100;
    const factor = heightSvh / (heightSvh - 100);
    return Math.round(section.getBoundingClientRect().top + scrollY + (qq / factor) * section.offsetHeight);
  }, q);

const after = {
  A: { from: 0, to: 700, idle: 2200, note: "initial load to first scroll" },
  B: { qFrom: 0.04, qTo: 0.42, note: "Learn -> Practise -> Prepare" },
  C: { qFrom: 0.27, qTo: 0.72, note: "Prepare -> Understand -> Progress" },
  D: { qFrom: 0.58, qTo: 0.86, note: "Progress -> Explore" },
  E: { qFrom: 0.78, qTo: 1.0, extra: 1500, note: "Explore -> Chapter 2" },
};
const before = {
  A: { from: 0, to: 700, idle: 2200, note: "initial load to first scroll" },
  B: { from: 0, to: 950, note: "the hero (one photograph)" },
  E: { from: 500, to: 2300, note: "hero -> Chapter 2" },
};

const browser = await chromium.launch({
  args: ["--use-angle=d3d11", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--no-proxy-server"],
});
fs.mkdirSync(outDir, { recursive: true });
const segments = mode === "before" ? before : after;
for (const [name, seg] of Object.entries(segments)) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: `${outDir}/${label}-${name}`, size },
  });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
  await page.mouse.move(W / 2, H / 2);
  let from = seg.from, to = seg.to;
  if (seg.qFrom !== undefined) {
    from = await qToY(page, seg.qFrom);
    to = (await qToY(page, seg.qTo)) + (seg.extra ?? 0);
  }
  if (seg.idle) await page.waitForTimeout(seg.idle);
  else {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.max(0, from - 150));
    await page.waitForTimeout(900);
  }
  let y = await page.evaluate(() => scrollY);
  const frames = [];
  await page.evaluate(() => {
    window.__d = [];
    let last = performance.now();
    const tick = (t) => { window.__d.push(t - last); last = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  while (y < to) {
    await page.mouse.wheel(0, STEP);
    await page.waitForTimeout(GAP);
    y = await page.evaluate(() => scrollY);
  }
  await page.waitForTimeout(700);
  const d = await page.evaluate(() => window.__d);
  const s = [...d].sort((a, b) => a - b);
  frames.push({ frames: d.length, p50: s[Math.floor(s.length * 0.5)], p95: s[Math.floor(s.length * 0.95)], max: s.at(-1), over25: d.filter((x) => x > 25).length, over50: d.filter((x) => x > 50).length });
  await ctx.close();
  console.log(label, name, seg.note, JSON.stringify(frames[0]));
}
await browser.close();
