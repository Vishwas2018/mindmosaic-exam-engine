#!/usr/bin/env node
/** Prints boxes and computed styles of elements whose own text matches, in a design export.
 *  node inspect-design.mjs <file.html> <width> <text1> [text2 ...] */
import path from "node:path";
import { chromium } from "@playwright/test";
const [file, width, ...texts] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(width), height: 1000 } });
await p.goto("file:///" + path.resolve(file).split(path.sep).join("/"));
await p.waitForTimeout(300);
const res = await p.evaluate((texts) => {
  const out = [];
  const pick = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    return { tag: el.tagName, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      font: `${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily.split(",")[0]}`, color: cs.color, bg: cs.backgroundColor,
      radius: cs.borderRadius, border: cs.border, pad: cs.padding, shadow: cs.boxShadow.slice(0, 60) }; };
  for (const t of texts) {
    const all = [...document.querySelectorAll("body *")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() === t));
    for (const el of all.slice(0, 1)) {
      out.push({ t, self: pick(el), parents: [1, 2, 3, 4, 5, 6].map((i) => { let x = el; for (let k = 0; k < i && x; k++) x = x.parentElement; return x ? pick(x) : null; }) });
    }
  }
  const asideCandidates = [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.x === 0 && r.y === 0 && r.width > 300 && r.height > 600; }).slice(0, 4).map(pick);
  return { out, asideCandidates, docW: document.documentElement.scrollWidth };
}, texts);
console.log(JSON.stringify(res, null, 1));
await b.close();
