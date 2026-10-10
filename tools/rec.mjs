import { chromium } from "file:///C:/Users/vishw/Vish/Vish/.worktrees/landing-ch2-app-previews/node_modules/@playwright/test/index.mjs";
import fs from "node:fs";
const [out, port] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const VIEWS = [[375,812,"m375"],[390,844,"m390"],[430,932,"m430"],[1440,900,"d1440"]];
const b = await chromium.launch({ args: ["--use-angle=d3d11","--enable-gpu-rasterization","--ignore-gpu-blocklist","--no-proxy-server"] });
for (const [w,h,label] of VIEWS) {
  const size = { width: w < 800 ? w : 960, height: w < 800 ? h : 600 };
  const ctx = await b.newContext({ viewport:{width:w,height:h}, recordVideo:{ dir:`${out}/${label}`, size } });
  const page = await ctx.newPage();
  const errs=[]; page.on("pageerror",e=>errs.push(String(e))); page.on("console",m=>{if(m.type()==="error")errs.push(m.text())});
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil:"networkidle" });
  await page.mouse.move(w/2,h/2);
  const t0 = Date.now();
  const bounds = await page.evaluate(()=>{const s=document.querySelector('section[data-chapter="2"]');const r=s.getBoundingClientRect();return [Math.max(0,r.top+scrollY-300), r.bottom+scrollY-innerHeight+200]});
  await page.evaluate(y=>window.scrollTo({top:y,behavior:"instant"}),bounds[0]); await page.waitForTimeout(1200);
  const log=[]; const mark=async(tag)=>log.push({t:((Date.now()-t0)/1000).toFixed(1),tag,y:await page.evaluate(()=>Math.round(scrollY)),scene:await page.evaluate(()=>{let best=null,bd=1e9;for(const s of document.querySelectorAll('section[data-chapter="2"] [data-scene]')){const r=s.getBoundingClientRect();const d=Math.abs(r.top+r.height/2-innerHeight/2);const op=getComputedStyle(s).opacity;if(+op>0.5&&d<bd){bd=d;best=s.dataset.scene}}return best})});
  await page.evaluate(()=>{window.__d=[];let l=performance.now();const k=t=>{window.__d.push(t-l);l=t;requestAnimationFrame(k)};requestAnimationFrame(k)});
  const dir=async(sign,to)=>{let y=await page.evaluate(()=>scrollY),n=0;while(sign>0?y<to:y>to){await page.mouse.wheel(0,50*sign);await page.waitForTimeout(70);y=await page.evaluate(()=>scrollY);if(++n%10===0)await mark(sign>0?"down":"up")}};
  await mark("start"); await dir(1,bounds[1]); await page.waitForTimeout(800); await mark("bottom"); await dir(-1,bounds[0]); await page.waitForTimeout(800); await mark("top");
  const d=await page.evaluate(()=>window.__d); const s=[...d].sort((a,b)=>a-b);
  fs.writeFileSync(`${out}/${label}.log.json`,JSON.stringify({errs,frames:d.length,p95:s[Math.floor(s.length*.95)],max:s.at(-1),over50:d.filter(x=>x>50).length,log},null,0));
  await ctx.close(); console.log(label,"frames",d.length,"p95",s[Math.floor(s.length*.95)].toFixed(1),"max",s.at(-1).toFixed(0),">50ms",d.filter(x=>x>50).length,"errs",errs.length);
}
await b.close();
