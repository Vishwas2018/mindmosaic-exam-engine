import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch2-app-previews/node_modules/@playwright/test/index.mjs";
import fs from "node:fs";
const [out, port = "3442"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const SCENES = ["naplan","icas","curriculum","amc","singapore","selective"];
const b = await chromium.launch({ args: ["--no-proxy-server"] });
for (const [w,h] of [[375,812],[390,844],[430,932]]) {
  const ctx = await b.newContext({ viewport: {width:w,height:h}, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  for (const id of SCENES) {
    const frame = page.locator(`section[data-chapter="2"] [data-scene="${id}"] [data-preview-window]`);
    await frame.evaluate(el => el.scrollIntoView({block:"center",behavior:"instant"}));
    await page.waitForFunction(() => !document.querySelector("[data-preview-skeleton]") || true);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    await frame.screenshot({ path: `${out}/${w}-${id}-window.png` });
    await page.screenshot({ path: `${out}/${w}-${id}-viewport.png` });
  }
  await ctx.close();
}
await b.close();
