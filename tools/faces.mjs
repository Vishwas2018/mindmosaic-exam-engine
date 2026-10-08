import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch1-scroll/node_modules/@playwright/test/index.mjs";
const b = await chromium.launch({ args: ["--no-proxy-server"] });
for (const [label, w, h, reduced] of [["desktop 1440", 1440, 900, false], ["mobile 375", 375, 812, false], ["desktop reduced-motion", 1440, 900, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3400/", { waitUntil: "load" });
  await page.mouse.move(w / 2, h / 2);
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y < total; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(60); }
  await page.waitForTimeout(800);
  const imgs = await page.evaluate(() => [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth > 0).map((i) => { const u = new URL(i.currentSrc || i.src); const raw = u.searchParams.get("url") ?? u.pathname; return decodeURIComponent(raw).split("/").pop(); }));
  console.log(label, "-> distinct photographs rendered:", [...new Set(imgs)].length);
  console.log("   ", [...new Set(imgs)].join("\n    "));
  await ctx.close();
}
await b.close();
