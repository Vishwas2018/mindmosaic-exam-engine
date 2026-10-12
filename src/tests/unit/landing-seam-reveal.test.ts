import { describe, expect, it } from "vitest";

import { seamClipPath, seamGrid, seamTileGrowth } from "@/features/landing/cinematic/seamReveal";

describe("Chapter 1 -> 2 mirror-mosaic seam", () => {
  const grid = seamGrid(1440, 900);

  it("lays out six rows of roughly square tiles across the stage", () => {
    expect(grid.rows).toBe(6);
    expect(grid.columns).toBeGreaterThanOrEqual(4);
    expect(grid.columns).toBeLessThanOrEqual(24);
    expect(grid.tileHeight).toBe(150);
    expect(grid.tileWidth * grid.columns).toBeCloseTo(1440, 6);
    expect(grid.jitter).toHaveLength(grid.rows * grid.columns);
    // Deterministic: the same stage size is always the same grid.
    expect(seamGrid(1440, 900)).toEqual(grid);
  });

  it("starts fully hidden and ends as the plain, unmasked stage", () => {
    expect(seamClipPath(grid, 0)).toBe('path("M0 0Z")');
    expect(seamClipPath(grid, 1)).toBe("none");
    for (let row = 0; row < grid.rows; row += 1) {
      for (let column = 0; column < grid.columns; column += 1) {
        expect(seamTileGrowth(grid, row, column, 1)).toBe(1);
        expect(seamTileGrowth(grid, row, column, 0)).toBe(0);
      }
    }
  });

  it("sweeps from the right edge to the left and never un-grows as the user scrolls on", () => {
    const rightmost = seamTileGrowth(grid, 3, grid.columns - 1, 0.3);
    const leftmost = seamTileGrowth(grid, 3, 0, 0.3);
    expect(rightmost).toBeGreaterThan(leftmost);
    for (let row = 0; row < grid.rows; row += 1) {
      for (let column = 0; column < grid.columns; column += 1) {
        let previous = 0;
        for (let u = 0; u <= 1.0001; u += 0.02) {
          const growth = seamTileGrowth(grid, row, column, Math.min(1, u));
          expect(growth).toBeGreaterThanOrEqual(previous - 1e-12);
          previous = growth;
        }
      }
    }
  });

  it("is a pure function of progress: the same u is the same mask, forwards or backwards", () => {
    const us = [0.1, 0.35, 0.6, 0.9];
    const forwards = us.map((u) => seamClipPath(grid, u));
    const backwards = [...us].reverse().map((u) => seamClipPath(grid, u)).reverse();
    expect(backwards).toEqual(forwards);
  });
});
