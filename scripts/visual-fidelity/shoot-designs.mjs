#!/usr/bin/env node
/** Renders Claude Design clean-screen exports to PNG at a fixed width (artboards carry their own frame size).
 *  node scripts/visual-fidelity/shoot-designs.mjs <clean-screens dir> <out dir> [filter regex] */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const [src, out, filter] = process.argv.slice(2);
const re = filter ? new RegExp(filter, "i") : null;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
for (const group of fs.readdirSync(src)) {
  const dir = path.join(src, group);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".html"))) {
    const id = `${group}/${f}`;
    if (re && !re.test(id)) continue;
    await page.goto("file:///" + path.resolve(dir, f).split(path.sep).join("/"), { waitUntil: "load" }).catch(() => {});
    await page.waitForTimeout(400);
    const o = path.join(out, group, f.replace(/\.clean\.html$|\.html$/, ".png"));
    fs.mkdirSync(path.dirname(o), { recursive: true });
    await page.screenshot({ path: o, fullPage: true });
    console.log("shot", id);
  }
}
await browser.close();
