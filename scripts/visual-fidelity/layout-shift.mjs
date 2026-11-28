#!/usr/bin/env node
/** Measures what moves when the Parent / Student control is switched on a sign-in route.
 *  node layout-shift.mjs <base-url> [path] — prints the boxes for each role and the deltas; exits 1 on any shift. */
import { chromium } from "@playwright/test";
const [base, route = "/sign-in?role=parent"] = process.argv.slice(2);
const b = await chromium.launch();
let shifted = false;
for (const width of [1440, 834, 390]) {
  const p = await b.newPage({ viewport: { width, height: 1000 } });
  await p.goto(base + route, { waitUntil: "networkidle" });
  const measure = () => p.evaluate(() => {
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height), x: Math.round(r.x), w: Math.round(r.width) }; };
    const tabs = document.querySelector('[role="tablist"]');
    const card = tabs?.closest(".mm-rise");
    const submit = document.querySelector('form button[type="submit"]');
    return { tabs: box(tabs), card: box(card), submit: box(submit), h1: box(document.querySelector("h1")), scrollW: document.documentElement.scrollWidth };
  });
  const a = await measure();
  await p.getByRole("tab", { name: "Student" }).click();
  await p.waitForTimeout(300);
  const s = await measure();
  await p.getByRole("tab", { name: "Parent" }).click();
  await p.waitForTimeout(300);
  const back = await measure();
  const d = (k, f) => (s[k] && a[k] ? s[k][f] - a[k][f] : null);
  const deltas = { tabsY: d("tabs", "y"), h1Y: d("h1", "y"), cardY: d("card", "y"), cardH: d("card", "h"), cardX: d("card", "x"), submitY: d("submit", "y") };
  const roundTrip = JSON.stringify(a) === JSON.stringify(back);
  if (!roundTrip) console.log("  round trip differs:", JSON.stringify(a), JSON.stringify(back));
  const bad = Object.values(deltas).some((v) => v !== 0 && v !== null) || !roundTrip;
  shifted ||= bad;
  console.log(`${width}px ${bad ? "SHIFT" : "stable"}`, JSON.stringify(deltas), `parentFormSubmitY=${a.submit?.y} studentSubmitY=${s.submit?.y}`);
  await p.close();
}
await b.close();
process.exit(shifted ? 1 : 0);
