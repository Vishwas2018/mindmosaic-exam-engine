import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Audit finding H-04: WCAG AA contrast, asserted at the token level.
 *
 * axe catches these only where a page happens to render the pairing, and
 * the specs that would have caught them had been failing on a stale
 * heading assertion long before reaching their axe call. A token that is
 * documented as "text on light" should not depend on someone rendering it
 * on the right background to find out it is 3.13:1.
 *
 * Ratios are computed from src/app/globals.css itself, so editing a token
 * to a lighter value fails here rather than in front of a child.
 */

const CSS = readFileSync(
  resolve(import.meta.dirname, "../../app/globals.css"),
  "utf8",
);

function token(name: string): string {
  const match = CSS.match(new RegExp(`^\\s*${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`, "m"));
  if (!match) throw new Error(`token ${name} not found, or is not a literal hex`);
  return match[1]!.toLowerCase();
}

function relativeLuminance(hex: string): number {
  const channels = hex.replace("#", "").match(/../g)!.map((pair) => parseInt(pair, 16));
  const linear = channels.map((value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrast(a: string, b: string): number {
  const [x, y] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Every light surface a foreground token can land on in this system. */
const LIGHT_SURFACES = {
  white: "#ffffff",
  "--mm-page": token("--mm-page"),
  "--mm-tint": token("--mm-tint"),
  "--mm-tint-quiet": token("--mm-tint-quiet"),
  "--mm-track": token("--mm-track"),
  "--mm-surface-quiet": token("--mm-surface-quiet"),
  "--mm-alert": token("--mm-alert"),
  "--mm-warm": token("--mm-warm"),
} as const;

const AA_NORMAL = 4.5;
const AA_LARGE = 3;

describe("colour tokens meet WCAG AA where they are used as text", () => {
  /*
   * The tokens whose documented job is "text on a light surface". Each must
   * clear 4.5:1 on every light surface, because none of them is scoped to
   * one background.
   */
  const TEXT_ON_LIGHT = [
    "--mm-ink",
    "--mm-ink-soft",
    "--mm-muted",
    "--mm-quiet",
    "--mm-muted-2",
    "--mm-coral-text",
    "--mm-coral-deep",
    "--mm-brand",
  ] as const;

  for (const name of TEXT_ON_LIGHT) {
    it(`${name} clears ${AA_NORMAL}:1 on every light surface`, () => {
      const fg = token(name);
      const failures = Object.entries(LIGHT_SURFACES)
        .map(([surface, bg]) => [surface, contrast(fg, bg)] as const)
        .filter(([, ratio]) => ratio < AA_NORMAL)
        .map(([surface, ratio]) => `${surface}: ${ratio.toFixed(2)}:1`);

      expect(failures, `${name} (${fg})`).toEqual([]);
    });
  }

  /*
   * --brand-coral is the wordmark's "Mosaic". It renders at 13px bold in
   * the footer and in mock chrome, so it needs the normal-text bar, not the
   * large-text one. It aliases --mm-coral-text; this pins that it resolves
   * to an accessible value rather than back to bright coral.
   */
  it("--brand-coral (the wordmark) resolves to the accessible coral", () => {
    expect(CSS).toMatch(/--brand-coral:\s*var\(--mm-coral-text\)/);
  });

  /*
   * --mm-coral is a background and decoration colour. Its own comment says
   * "never body copy", and this is why: it fails even the large-text bar on
   * the tinted surfaces. Pinned so nobody reaches for it as a text colour.
   */
  it("--mm-coral is not usable as text, which is why a separate text token exists", () => {
    const coral = token("--mm-coral");
    expect(contrast(coral, "#ffffff")).toBeLessThan(AA_NORMAL);
    expect(contrast(coral, token("--mm-tint"))).toBeLessThan(AA_LARGE);
  });

  /*
   * ...and the pairing that replaced faded ink on the coral tiles and
   * cards. Full-opacity ink on coral is what those surfaces now use.
   */
  it("full-opacity --mm-ink clears AA on a --mm-coral surface", () => {
    expect(contrast(token("--mm-ink"), token("--mm-coral"))).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  /* White on brand purple — the other tile tone on the results screen. */
  it("white clears AA on --mm-brand", () => {
    expect(contrast("#ffffff", token("--mm-brand"))).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});
