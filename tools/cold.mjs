import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch1-scroll/node_modules/@playwright/test/index.mjs";
const b = await chromium.launch({ args: ["--no-proxy-server"] });
const profiles = [["cold server image cache + fast scroll (300px/20ms), no throttle", null, 300, 20], ["cold + Fast-3G-like network (1.6 Mbps, 150ms) + fast scroll (300px/20ms)", { latency: 150, down: 200000, up: 90000 }, 300, 20], ["cold + slow network + moderate scroll (100px/60ms)", { latency: 150, down: 200000, up: 90000 }, 100, 60]];
for (const [name, net, step, gap] of profiles) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  if (net) { const cdp = await ctx.newCDPSession(page); await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: net.latency, downloadThroughput: net.down, uploadThroughput: net.up }); }
  await page.goto("http://localhost:3400/", { waitUntil: "load" });
  await page.mouse.move(720, 450);
  const frames = [];
  for (let t = 0; t < 4700; t += step) {
    await page.mouse.wheel(0, step);
    await page.waitForTimeout(gap);
    frames.push(await page.evaluate(() => {
      const eff = (el) => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
      const s = document.querySelector('section[data-chapter="1"]');
      const st = s.firstElementChild.getBoundingClientRect();
      const layers = [...s.querySelectorAll("[data-hero-scene]")].map((l) => ({ scene: +l.dataset.heroScene, o: eff(l), state: l.dataset.photoState }));
      const cover = 1 - layers.filter((l) => l.state === "ready").reduce((a, l) => a * (1 - l.o), 1);
      const caption = [...s.querySelectorAll("p[aria-hidden='true'].grid > span")].map(eff);
      return { y: Math.round(scrollY), pinned: st.top <= 0 && st.bottom >= 900, cover, bad: layers.filter((l) => l.o > 0.02 && l.state !== "ready").length, capMax: Math.max(...caption), mounted: layers.length };
    }));
  }
  const pinned = frames.filter((f) => f.pinned);
  console.log(name);
  console.log(`  pinned frames ${pinned.length}; min photograph coverage ${Math.min(...pinned.map((f) => f.cover)).toFixed(3)}; frames with an undecoded photograph visible: ${pinned.filter((f) => f.bad).length}; min caption ${Math.min(...pinned.map((f) => f.capMax)).toFixed(2)}`);
  await ctx.close();
}
await b.close();
