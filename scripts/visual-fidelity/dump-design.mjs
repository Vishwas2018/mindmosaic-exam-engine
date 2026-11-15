#!/usr/bin/env node
/** Dumps the rendered DOM of a design export with each element's key computed styles inline (for implementation).
 *  node dump-design.mjs <file.html> <width> <out.txt> */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
const [file, width, out] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(width), height: 1000 } });
await p.goto("file:///" + path.resolve(file).split(path.sep).join("/"));
await p.waitForTimeout(300);
const txt = await p.evaluate(() => {
  const keys = ["display", "gridTemplateColumns", "flexDirection", "gap", "padding", "margin", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "color", "backgroundColor", "backgroundImage", "border", "borderRadius", "boxShadow", "opacity", "textTransform"];
  const defaults = { display: "block", gap: "normal", padding: "0px", margin: "0px", backgroundColor: "rgba(0, 0, 0, 0)", backgroundImage: "none", border: "", borderRadius: "0px", boxShadow: "none", opacity: "1", textTransform: "none", letterSpacing: "normal", gridTemplateColumns: "none", flexDirection: "row" };
  const lines = [];
  const walk = (el, depth, parentCs) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none") return;
    const r = el.getBoundingClientRect();
    const st = [];
    for (const k of keys) {
      let v = cs[k];
      if (k === "fontFamily") v = v.split(",")[0];
      if (k === "border" && /^0px/.test(v)) continue;
      if (defaults[k] !== undefined && v === defaults[k]) continue;
      if (parentCs && ["fontFamily", "fontSize", "fontWeight", "lineHeight", "color", "letterSpacing", "textTransform"].includes(k) && parentCs[k] === cs[k]) continue;
      st.push(`${k}:${v.length > 90 ? v.slice(0, 90) + "…" : v}`);
    }
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).filter(Boolean).join(" ");
    const attrs = ["href", "aria-label", "role", "type", "placeholder"].map((a) => el.getAttribute(a) ? `${a}=${el.getAttribute(a)}` : "").filter(Boolean).join(" ");
    lines.push(`${"  ".repeat(depth)}<${el.tagName.toLowerCase()}${attrs ? " " + attrs : ""}> [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] {${st.join("; ")}}${own ? ` "${own.slice(0, 120)}"` : ""}`);
    if (el.tagName === "svg") return;
    for (const c of el.children) walk(c, depth + 1, cs);
  };
  walk(document.body, 0, null);
  return lines.join("\n");
});
fs.writeFileSync(out, txt);
console.log(out, txt.split("\n").length, "lines");
await b.close();
