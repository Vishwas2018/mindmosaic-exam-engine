import type { BarModelData } from "@/schemas/visual.schema";

type Bar = BarModelData["bars"][number];

const STAGE_RANK = { before: 0, after: 2 } as const;

/**
 * The top-to-bottom row order of the bars. Shared by the layout and the
 * structural validator so both agree on what "adjacent" means.
 *
 * Bars keep their array order, except that when a bar belongs to a
 * comparison group the whole group is emitted at that position, with staged
 * bars ordered before (top) to after (bottom). Unstaged bars sit between.
 */
export function orderBars(data: Pick<BarModelData, "bars" | "groups">): Bar[] {
  const byId = new Map(data.bars.map((bar, index) => [bar.id, { bar, index }]));
  const emitted = new Set<string>();
  const rows: Bar[] = [];

  for (const bar of data.bars) {
    if (emitted.has(bar.id)) continue;
    const group = data.groups.find((candidate) => candidate.barIds.includes(bar.id));
    if (!group) {
      emitted.add(bar.id);
      rows.push(bar);
      continue;
    }
    const members = group.barIds
      .map((id) => byId.get(id))
      .filter((entry): entry is { bar: Bar; index: number } => entry !== undefined && !emitted.has(entry.bar.id))
      .sort((a, b) => {
        const rankA = a.bar.stage ? STAGE_RANK[a.bar.stage] : 1;
        const rankB = b.bar.stage ? STAGE_RANK[b.bar.stage] : 1;
        return rankA - rankB || a.index - b.index;
      });
    for (const member of members) {
      emitted.add(member.bar.id);
      rows.push(member.bar);
    }
  }
  return rows;
}
