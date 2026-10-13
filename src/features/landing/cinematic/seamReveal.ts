import { cinematicMotion } from "./config";
import { easeInOut } from "./math";

/**
 * Pure maths for the Chapter 1 -> Chapter 2 mirror-mosaic seam. Everything is a function of the seam
 * progress `u` (0..1) and the stage size, so scrolling back retraces the same frames. Numbers live in
 * `cinematicMotion.chapterSeam`.
 */

const seam = cinematicMotion.chapterSeam;

export interface SeamGrid {
  rows: number;
  columns: number;
  /** Tile width and height, px. */
  tileWidth: number;
  tileHeight: number;
  /** Per-tile jitter, row-major. Fixed values, no randomness: the same stage size is always the same grid. */
  jitter: number[];
}

/** The tile grid for a stage of `width` x `height` px: `rows` to the height, roughly square tiles. */
export function seamGrid(width: number, height: number): SeamGrid {
  const rows = seam.rows;
  const tileHeight = height / rows;
  const columns = Math.max(seam.columns.min, Math.min(seam.columns.max, Math.round(width / tileHeight)));
  const jitter: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const n = Math.sin(column * 12.9898 + row * 78.233) * 43758.5453;
      jitter.push(n - Math.floor(n));
    }
  }
  return { rows, columns, tileWidth: width / columns, tileHeight, jitter };
}

/** How grown (0..1) the tile at `row`, `column` is at seam progress `u`. The right edge goes first. */
export function seamTileGrowth(grid: SeamGrid, row: number, column: number, u: number): number {
  const { distance, jitter, row: rowWeight } = seam.delayMix;
  const delay =
    ((grid.columns - 1 - column) / Math.max(1, grid.columns - 1)) * distance +
    grid.jitter[row * grid.columns + column]! * jitter +
    (row / Math.max(1, grid.rows - 1)) * rowWeight;
  const x = (u * seam.span - delay * seam.stagger) / seam.grow;
  return easeInOut(Math.min(1, Math.max(0, x)));
}

/**
 * The CSS `clip-path` for the revealed region at seam progress `u`: one rectangle per tile, each growing
 * from its centre (plus a 1px overlap so a finished reveal has no hairline gaps). `none` once `u` reaches 1,
 * so the finished state is exactly the unmasked stage.
 */
export function seamClipPath(grid: SeamGrid, u: number): string {
  if (u >= 1) return "none";
  let d = "";
  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const k = seamTileGrowth(grid, row, column, u);
      if (k <= 0) continue;
      const w = (grid.tileWidth + 1) * k;
      const h = (grid.tileHeight + 1) * k;
      const x = column * grid.tileWidth + (grid.tileWidth - w) / 2;
      const y = row * grid.tileHeight + (grid.tileHeight - h) / 2;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${h.toFixed(1)}h${(-w).toFixed(1)}Z`;
    }
  }
  return `path("${d || "M0 0Z"}")`;
}
