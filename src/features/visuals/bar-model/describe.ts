import type { BarModelData } from "@/schemas/visual.schema";

import { displayedAmount, formatGiven } from "./amounts";
import { orderBars } from "./bar-order";

type Bar = BarModelData["bars"][number];

function amountPhrase(amount: ReturnType<typeof displayedAmount>): string {
  if (amount.kind === "value") return amount.text;
  if (amount.kind === "unknown") {
    return amount.isTarget ? "an unknown amount marked with a question mark" : `an unknown amount marked ${amount.text}`;
  }
  return "an amount with no number shown";
}

function barName(bar: Bar): string {
  return bar.stage ? `${bar.label} (${bar.stage})` : bar.label;
}

/**
 * Sentences describing the givens and relationships of a bar model, in
 * reading order. Built only from the JSON as the child sees it: it never
 * contains a solved value.
 */
export function describeBarModel(data: BarModelData): string[] {
  const lines: string[] = ["Schematic bar model, not drawn to scale."];
  const rows = orderBars(data);
  const barById = new Map(data.bars.map((bar) => [bar.id, bar]));
  const unitLabel = (id: string) => data.units.find((unit) => unit.id === id)?.label ?? "unit";
  const nameOf = (id: string) => {
    const bar = barById.get(id);
    return bar ? barName(bar) : id;
  };

  for (const unit of data.units) {
    lines.push(
      unit.value === undefined
        ? `Each ${unit.label ?? "unit"} is the same size, and that size is not given.`
        : `Each ${unit.label ?? "unit"} is ${formatGiven(unit.value)}.`,
    );
  }

  for (const bar of rows) {
    const parts = bar.segments.map((segment, index) => {
      const name = segment.label ? `${segment.label}: ` : "";
      if (segment.units !== undefined && segment.unitId !== undefined) {
        return `segment ${index + 1}, ${name}${segment.units} equal ${unitLabel(segment.unitId)}${segment.units === 1 ? "" : "s"}`;
      }
      return `segment ${index + 1}, ${name}${amountPhrase(displayedAmount(segment, data))}`;
    });
    lines.push(`Bar ${barName(bar)}, left to right: ${parts.join("; ")}.`);
  }

  for (const brace of data.braces) {
    const amount = amountPhrase(displayedAmount(brace, data));
    const label = brace.label ? ` labelled ${brace.label}` : "";
    if (brace.kind === "difference") {
      lines.push(
        `Difference brace${label} showing how much longer ${nameOf(brace.longerBarId as string)} is than ${nameOf(brace.shorterBarId as string)}: ${amount}.`,
      );
    } else if (brace.barIds) {
      lines.push(`Total brace${label} across the bars ${brace.barIds.map(nameOf).join(" and ")}: ${amount}.`);
    } else {
      const spans = brace.spans ?? [];
      const bar = data.bars.find((candidate) => candidate.segments.some((segment) => segment.id === spans[0]));
      const first = (bar?.segments.findIndex((segment) => segment.id === spans[0]) ?? 0) + 1;
      const last = first + spans.length - 1;
      lines.push(
        `${brace.kind === "total" ? "Total" : "Part"} brace${label} over ${spans.length === 1 ? `segment ${first}` : `segments ${first} to ${last}`} of ${bar ? nameOf(bar.id) : "a bar"}: ${amount}.`,
      );
    }
  }

  for (const relationship of data.relationships) {
    if (relationship.kind === "equal") {
      lines.push(`The bars ${relationship.barIds.map(nameOf).join(" and ")} have the same total.`);
      continue;
    }
    const found = data.quantities.find((candidate) => candidate.id === relationship.quantityId);
    const amount = found
      ? amountPhrase(
          displayedAmount({ display: found.display, value: found.value, unknown: found.unknown, target: found.target }, data),
        )
      : "an amount";
    if (relationship.kind === "add") {
      lines.push(`${nameOf(relationship.toStage)} is ${nameOf(relationship.fromStage)} with ${amount} added.`);
    } else if (relationship.kind === "remove") {
      lines.push(`${nameOf(relationship.toStage)} is ${nameOf(relationship.fromStage)} with ${amount} taken away.`);
    } else {
      lines.push(
        `${nameOf(relationship.fromBar)} gives ${amount} to ${nameOf(relationship.toBar)}. The combined total stays the same.`,
      );
    }
  }

  return lines;
}
