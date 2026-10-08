import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch1-scroll/node_modules/@playwright/test/index.mjs";
const rate = Number(process.argv[2] || 1);
const b = await chromium.launch({ args: ["--no-proxy-server"] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);
if (rate > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate });
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("  console", m.type(), m.text().slice(0, 160)); });
page.on("pageerror", (e) => console.log("  pageerror", String(e).slice(0, 200)));
const stabilize = async () => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}" });
  await page.evaluate(async () => { await document.fonts.ready; });
};
for (const [name, w, h] of [["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 390, 844]]) {
  const t0 = Date.now();
  await page.setViewportSize({ width: w, height: h });
  await stabilize();
  const t1 = Date.now();
  try { await page.goto("http://localhost:3400/", { waitUntil: "domcontentloaded", timeout: 20000 }); } catch (e) { console.log(name, "GOTO FAILED", e.message.split("\n")[0]); break; }
  const t2 = Date.now();
  await stabilize();
  await page.locator("main").first().waitFor({ state: "visible" });
  console.log(name, "setViewport", t1 - t0, "ms; goto", t2 - t1, "ms; total", Date.now() - t0, "ms");
}
await b.close();
