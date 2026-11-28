#!/usr/bin/env node
/**
 * One-off migration of parent/student workspace components from the older utility vocabulary to the Claude Design
 * tokens (Instrument Sans semibold headings, mm-* colours, 24px cards with the artboard shadow).
 *   node scripts/visual-fidelity/token-sweep.mjs <file...>   — rewrites in place and prints a count per file.
 */
import fs from "node:fs";

const RULES = [
  // Cards
  [/rounded-2xl border border-royal\/10 bg-white p-6 shadow-sm/g, "rounded-3xl border border-mm-brand/10 bg-white p-5 shadow-[0_18px_50px_rgba(49,32,86,0.09)] sm:px-[26px] sm:py-6"],
  [/rounded-2xl border border-royal\/10 bg-white p-5 shadow-sm/g, "rounded-3xl border border-mm-brand/10 bg-white p-5 shadow-[0_18px_50px_rgba(49,32,86,0.09)]"],
  // Page titles
  [/text-3xl font-black tracking-\[-0\.03em\] text-ink sm:text-4xl/g, "font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.028em] text-mm-ink sm:text-4xl"],
  [/text-2xl font-extrabold tracking-\[-0\.025em\] text-ink sm:text-3xl/g, "font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.028em] text-mm-ink sm:text-4xl"],
  // Weights: the design never goes above 600
  [/\bfont-black\b/g, "font-semibold"],
  [/\bfont-extrabold\b/g, "font-semibold"],
  [/\bfont-bold\b/g, "font-semibold"],
  // Colours (same hues, design token names)
  [/\btext-royal\b/g, "text-mm-brand"],
  [/\bbg-royal\b/g, "bg-mm-brand"],
  [/\bborder-royal\b/g, "border-mm-brand"],
  [/\bring-royal\b/g, "ring-mm-brand"],
  [/\bdivide-royal\b/g, "divide-mm-brand"],
  [/\btext-ink\b(?!-)/g, "text-mm-ink"],
  [/\btext-muted\b(?!-)/g, "text-mm-ink-soft"],
  [/\bbg-page\b/g, "bg-mm-tint-soft"],
  [/\bbg-canvas\b/g, "bg-mm-tint-soft"],
  // Pill buttons -> design 12px-radius buttons
  [/inline-flex min-h-11 items-center justify-center rounded-full/g, "inline-flex min-h-11 items-center justify-center rounded-xl"],
  // Legacy "Grade" wording: Australian year levels
  [/>Grade \{/g, ">Year {"],
  [/`Grade \$\{/g, "`Year ${"],
  [/"Grade "/g, '"Year "'],
];

for (const f of process.argv.slice(2)) {
  const before = fs.readFileSync(f, "utf8");
  let s = before;
  let n = 0;
  for (const [re, to] of RULES) s = s.replace(re, () => (n++, to));
  // Headings: Instrument Sans, as in every artboard.
  s = s.replace(/<(h1|h2)([^>]*?)className="(?![^"]*font-\[family-name)([^"]*)"/g, (_m, tag, mid, cls) => {
    n++;
    return `<${tag}${mid}className="font-[family-name:var(--font-display)] tracking-[-0.02em] ${cls}"`;
  });
  if (s !== before) fs.writeFileSync(f, s);
  console.log(`${n.toString().padStart(4)}  ${f}`);
}
