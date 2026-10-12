import type { BarModelData } from "@/schemas/visual.schema";

import { displayedAmount } from "./amounts";
import { orderBars } from "./bar-order";

/**
 * Deterministic schematic layout for a bar model.
 *
 * Every number here comes from the JSON the child sees. The solved answer is
 * never an input: a segment's width depends only on its kind (unit, given,
 * unknown or blank) and, for a given value, on a fixed banding rule by digit
 * count - never on the value's size relative to the answer. The diagram is
 * labelled "not to scale" because widths are schematic.
 */

export const MIN_VIEW_WIDTH = 280;
const PAD = 16;
const TOP = 8;
const LABEL_ROW = 24;
const BAR_HEIGHT = 48;
const LANE = 38;
const ROW_GAP = 14;
const UNIT_WIDTH = 40;
const UNKNOWN_WIDTH = 64;
const MIN_GAP = 48;
const CHAR = 7.6;
const BRACE_RADIUS = 6;
const SIDE_LANE_PAD = 26;

export type SegmentKind = "value" | "units" | "unknown" | "blank";

export interface LaidOutSegment {
  id: string;
  kind: SegmentKind;
  isTarget: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  amount: string;
  /** x positions of the dividers between equal units. */
  unitTicks: number[];
}

export interface LaidOutBar {
  id: string;
  label: string;
  labelY: number;
  x: number;
  y: number;
  width: number;
  segments: LaidOutSegment[];
}

export interface LaidOutBrace {
  id: string;
  kind: "total" | "part" | "difference";
  isTarget: boolean;
  path: string;
  text: string;
  textX: number;
  textY: number;
  anchor: "start" | "middle";
}

export interface LaidOutGuide {
  id: string;
  x: number;
  y1: number;
  y2: number;
}

export interface BarModelLayout {
  width: number;
  height: number;
  bars: LaidOutBar[];
  braces: LaidOutBrace[];
  guides: LaidOutGuide[];
  /** Plain-text unit key lines, rendered as HTML under the diagram. */
  unitKey: string[];
  /** Relationship notes for amounts that no segment or brace shows. */
  notes: string[];
}

type Bar = BarModelData["bars"][number];
type Segment = Bar["segments"][number];

const estimate = (text: string) => text.length * CHAR;

function truncate(text: string, maxChars: number): string {
  if (maxChars <= 1) return "";
  return text.length <= maxChars ? text : `${text.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

function givenWidth(value: number): number {
  const digits = String(Math.floor(value)).length;
  return 48 + 14 * (digits - 1) + (Number.isInteger(value) ? 0 : 12);
}

function naturalWidth(segment: Segment, data: BarModelData): number {
  if (segment.units !== undefined) return segment.units * UNIT_WIDTH;
  const shown = displayedAmount(segment, data);
  return shown.kind === "value" ? givenWidth(Number(shown.text)) : UNKNOWN_WIDTH;
}

function segmentKind(segment: Segment, data: BarModelData): SegmentKind {
  if (segment.units !== undefined) return "units";
  return displayedAmount(segment, data).kind;
}

/** Short amount text for notes: a given number, "?" or a symbol. */
function noteAmount(quantity: BarModelData["quantities"][number]): string {
  const shown = displayedAmount(quantity, { quantities: [quantity] });
  return shown.kind === "blank" ? "an amount" : shown.text || "an amount";
}

export function layoutBarModel(data: BarModelData): BarModelLayout {
  const rows = orderBars(data);
  const widths = new Map<string, number[]>(
    rows.map((bar) => [bar.id, bar.segments.map((segment) => naturalWidth(segment, data))]),
  );
  const total = (id: string) => (widths.get(id) ?? []).reduce((sum, width) => sum + width, 0);
  const pad = (id: string, extra: number) => {
    const list = widths.get(id);
    if (list && extra > 0) list[list.length - 1] += extra;
  };

  // Schematic adjustments that depend only on declared relationships.
  for (let pass = 0; pass < 2; pass += 1) {
    for (const brace of data.braces) {
      if (brace.kind !== "difference" || !brace.longerBarId || !brace.shorterBarId) continue;
      const gap = total(brace.longerBarId) - total(brace.shorterBarId);
      if (brace.value === 0) {
        if (gap > 0) pad(brace.shorterBarId, gap);
        else pad(brace.longerBarId, -gap);
      } else if (gap < MIN_GAP) {
        pad(brace.longerBarId, MIN_GAP - gap);
      }
    }
    for (const relationship of data.relationships) {
      if (relationship.kind !== "equal") continue;
      const widest = Math.max(...relationship.barIds.map(total));
      relationship.barIds.forEach((id) => pad(id, widest - total(id)));
    }
  }

  const widest = Math.max(...rows.map((bar) => total(bar.id)));
  const wholeBarBraces = data.braces.filter((brace) => brace.barIds);
  const sideColumns = wholeBarBraces.map((brace) => {
    const amount = displayedAmount(brace, data).text;
    const text = [brace.label, amount].filter(Boolean).join(": ");
    return SIDE_LANE_PAD + Math.min(estimate(text), 110);
  });
  const sideWidth = sideColumns.reduce((sum, column) => sum + column, 0);
  const width = Math.max(MIN_VIEW_WIDTH, PAD * 2 + widest + sideWidth);
  const maxChars = Math.floor((width - PAD * 2) / CHAR);

  const aboveCount = new Map<string, number>();
  const belowCount = new Map<string, number>();
  const segmentBar = new Map<string, string>();
  data.bars.forEach((bar) => bar.segments.forEach((segment) => segmentBar.set(segment.id, bar.id)));
  const rowOf = new Map(rows.map((bar, index) => [bar.id, index]));

  interface Placement {
    brace: BarModelData["braces"][number];
    barId: string;
    side: "above" | "below";
  }
  const placements: Placement[] = [];
  for (const brace of data.braces) {
    if (brace.barIds) continue;
    let barId: string;
    let side: "above" | "below";
    if (brace.kind === "difference") {
      const longer = brace.longerBarId as string;
      const shorter = brace.shorterBarId as string;
      barId = (rowOf.get(longer) ?? 0) >= (rowOf.get(shorter) ?? 0) ? longer : shorter;
      side = "below";
    } else {
      barId = segmentBar.get((brace.spans as string[])[0]) as string;
      side = brace.side ?? (brace.kind === "total" ? "above" : "below");
    }
    placements.push({ brace, barId, side });
    const counts = side === "above" ? aboveCount : belowCount;
    counts.set(barId, (counts.get(barId) ?? 0) + 1);
  }

  // Vertical stacking.
  const barTop = new Map<string, number>();
  const laneTops = new Map<string, { above: number; below: number }>();
  let cursor = TOP;
  for (const bar of rows) {
    cursor += LABEL_ROW;
    const above = cursor;
    cursor += (aboveCount.get(bar.id) ?? 0) * LANE;
    barTop.set(bar.id, cursor);
    cursor += BAR_HEIGHT;
    laneTops.set(bar.id, { above, below: cursor });
    cursor += (belowCount.get(bar.id) ?? 0) * LANE + ROW_GAP;
  }
  const height = cursor;

  const bars: LaidOutBar[] = rows.map((bar) => {
    const y = barTop.get(bar.id) as number;
    let x = PAD;
    const list = widths.get(bar.id) as number[];
    const segments = bar.segments.map((segment, index) => {
      const segmentWidth = list[index];
      const shown = displayedAmount(segment, data);
      const kind = segmentKind(segment, data);
      const unitTicks: number[] = [];
      if (segment.units !== undefined) {
        const each = segmentWidth / segment.units;
        for (let tick = 1; tick < segment.units; tick += 1) unitTicks.push(x + each * tick);
      }
      const laid: LaidOutSegment = {
        id: segment.id,
        kind,
        isTarget: shown.isTarget,
        x,
        y,
        width: segmentWidth,
        height: BAR_HEIGHT,
        label: truncate(segment.label ?? "", Math.floor((segmentWidth - 8) / 7)),
        amount: shown.text,
        unitTicks,
      };
      x += segmentWidth;
      return laid;
    });
    const stage = bar.stage ? ` (${bar.stage})` : "";
    return {
      id: bar.id,
      label: truncate(`${bar.label}${stage}`, maxChars),
      labelY: y - (aboveCount.get(bar.id) ?? 0) * LANE - 8,
      x: PAD,
      y,
      width: total(bar.id),
      segments,
    };
  });
  const barById = new Map(bars.map((bar) => [bar.id, bar]));

  const braces: LaidOutBrace[] = [];
  const guides: LaidOutGuide[] = [];
  const usedAbove = new Map<string, number>();
  const usedBelow = new Map<string, number>();

  const horizontalBrace = (x1: number, x2: number, tipY: number, direction: 1 | -1, r = BRACE_RADIUS) => {
    const mid = (x1 + x2) / 2;
    const run = Math.max(0, (x2 - x1) / 2);
    const k = Math.min(r, run / 2);
    const bendY = tipY + direction * k;
    const peakY = bendY + direction * k;
    if (x2 - x1 < 4) return `M ${x1} ${tipY} L ${x1} ${peakY}`;
    return [
      `M ${x1} ${tipY}`,
      `Q ${x1} ${bendY} ${x1 + k} ${bendY}`,
      `L ${mid - k} ${bendY}`,
      `Q ${mid} ${bendY} ${mid} ${peakY}`,
      `Q ${mid} ${bendY} ${mid + k} ${bendY}`,
      `L ${x2 - k} ${bendY}`,
      `Q ${x2} ${bendY} ${x2} ${tipY}`,
    ].join(" ");
  };

  for (const { brace, barId, side } of placements) {
    const bar = barById.get(barId) as LaidOutBar;
    const shown = displayedAmount(brace, data);
    const used = side === "above" ? usedAbove : usedBelow;
    const slot = used.get(barId) ?? 0;
    used.set(barId, slot + 1);
    const lanes = laneTops.get(barId) as { above: number; below: number };

    let x1: number;
    let x2: number;
    if (brace.kind === "difference") {
      const longer = barById.get(brace.longerBarId as string) as LaidOutBar;
      const shorter = barById.get(brace.shorterBarId as string) as LaidOutBar;
      x1 = PAD + shorter.width;
      x2 = PAD + longer.width;
    } else {
      const first = bar.segments.find((segment) => segment.id === (brace.spans as string[])[0]) as LaidOutSegment;
      const last = bar.segments.find(
        (segment) => segment.id === (brace.spans as string[])[(brace.spans as string[]).length - 1],
      ) as LaidOutSegment;
      x1 = first.x;
      x2 = last.x + last.width;
    }

    const direction: 1 | -1 = side === "above" ? -1 : 1;
    const laneTop = side === "above" ? lanes.above + slot * LANE : lanes.below + slot * LANE;
    // Above: the lane nearest the bar is the first one declared.
    const aboveIndex = (aboveCount.get(barId) ?? 1) - 1 - slot;
    const tipY = side === "above" ? lanes.above + (aboveIndex + 1) * LANE - 4 : laneTop + 4;

    const text = truncate([brace.label, shown.text].filter(Boolean).join(": "), maxChars);
    const half = estimate(text) / 2;
    const mid = Math.min(Math.max((x1 + x2) / 2, PAD + half), width - PAD - half);
    const peakY = tipY + direction * BRACE_RADIUS * 2;
    braces.push({
      id: brace.id,
      kind: brace.kind,
      isTarget: shown.isTarget,
      path: horizontalBrace(x1, x2, tipY, direction),
      text,
      textX: mid,
      textY: side === "above" ? peakY - 6 : peakY + 17,
      anchor: "middle",
    });

    if (brace.kind === "difference") {
      const longer = barById.get(brace.longerBarId as string) as LaidOutBar;
      const shorter = barById.get(brace.shorterBarId as string) as LaidOutBar;
      const lowerIsLonger = barId === longer.id;
      guides.push({
        id: `${brace.id}-guide`,
        x: lowerIsLonger ? x1 : x2,
        y1: (lowerIsLonger ? shorter : longer).y + BAR_HEIGHT,
        y2: tipY,
      });
    }
  }

  // Whole-bar totals sit in reserved columns to the right of every bar.
  let columnX = PAD + widest + 8;
  wholeBarBraces.forEach((brace, index) => {
    const spanned = (brace.barIds as string[]).map((id) => barById.get(id) as LaidOutBar);
    const top = Math.min(...spanned.map((bar) => bar.y));
    const bottom = Math.max(...spanned.map((bar) => bar.y + BAR_HEIGHT));
    const shown = displayedAmount(brace, data);
    const r = BRACE_RADIUS;
    const mid = (top + bottom) / 2;
    const k = Math.min(r, (bottom - top) / 4);
    const x = columnX;
    const text = truncate([brace.label, shown.text].filter(Boolean).join(": "), 15);
    braces.push({
      id: brace.id,
      kind: "total",
      isTarget: shown.isTarget,
      path: [
        `M ${x} ${top}`,
        `Q ${x + k} ${top} ${x + k} ${top + k}`,
        `L ${x + k} ${mid - k}`,
        `Q ${x + k} ${mid} ${x + 2 * k} ${mid}`,
        `Q ${x + k} ${mid} ${x + k} ${mid + k}`,
        `L ${x + k} ${bottom - k}`,
        `Q ${x + k} ${bottom} ${x} ${bottom}`,
      ].join(" "),
      text,
      textX: x + 2 * k + 6,
      textY: mid + 5,
      anchor: "start",
    });
    columnX += sideColumns[index];
  });

  const unitKey = data.units.map((unit) => {
    const name = unit.label ?? "unit";
    return unit.value === undefined ? `Each ${name} is the same size.` : `1 ${name} = ${unit.value}`;
  });

  // Stage labels alone establish no maths, so every relationship is also
  // stated in words under the diagram.
  const barName = (id: string) => {
    const bar = data.bars.find((candidate) => candidate.id === id);
    return bar ? (bar.stage ? `${bar.label} (${bar.stage})` : bar.label) : id;
  };
  const notes: string[] = [];
  for (const relationship of data.relationships) {
    if (relationship.kind === "equal") {
      notes.push(`${relationship.barIds.map(barName).join(" and ")} have the same amount.`);
      continue;
    }
    const quantity = data.quantities.find((candidate) => candidate.id === relationship.quantityId);
    const amount = quantity ? noteAmount(quantity) : "an amount";
    if (relationship.kind === "add") {
      notes.push(`From ${barName(relationship.fromStage)} to ${barName(relationship.toStage)}: add ${amount}.`);
    } else if (relationship.kind === "remove") {
      notes.push(`From ${barName(relationship.fromStage)} to ${barName(relationship.toStage)}: take away ${amount}.`);
    } else {
      notes.push(`${barName(relationship.fromBar)} gives ${amount} to ${barName(relationship.toBar)}. The total stays the same.`);
    }
  }

  return { width, height, bars, braces, guides, unitKey, notes };
}
