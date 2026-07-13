/**
 * Independent money derivation: a table visual's own rows as the
 * authoritative price list, never a re-typed number in the explanation.
 * Every amount is converted to integer cents immediately — no floating-
 * point currency arithmetic anywhere past this module's boundary.
 */
import type { VisualAsset } from "@/schemas/visual.schema";
import { dollarsToCents, NumericDerivationError, numberToCents } from "./numeric";

type TableVisual = Extract<VisualAsset, { type: "table" }>;

export interface PriceListEntry {
  readonly item: string;
  readonly cents: number;
}

function cellToCents(cell: string | number): number | undefined {
  try {
    return typeof cell === "number" ? numberToCents(cell) : dollarsToCents(cell);
  } catch (error) {
    if (error instanceof NumericDerivationError) return undefined;
    throw error;
  }
}

const PRICE_HEADER_PATTERN = /price|cost|\$/i;
const ITEM_HEADER_PATTERN = /item|name|product/i;

/**
 * Extracts an (item, unit price) list from a table whose headers
 * unambiguously identify one item-name column and one price column.
 * Returns `undefined` — never a best-effort guess — when the table's
 * shape doesn't match this convention, or when any row's price cell
 * cannot be read as an exact currency amount.
 */
export function extractPriceList(table: TableVisual): readonly PriceListEntry[] | undefined {
  const priceIndex = table.data.headers.findIndex((header) => PRICE_HEADER_PATTERN.test(header));
  const itemIndex = table.data.headers.findIndex((header) => ITEM_HEADER_PATTERN.test(header));
  if (priceIndex === -1 || itemIndex === -1 || priceIndex === itemIndex) return undefined;

  const entries: PriceListEntry[] = [];
  for (const row of table.data.rows) {
    const itemCell = row[itemIndex];
    const priceCell = row[priceIndex];
    if (typeof itemCell !== "string" || priceCell === undefined) return undefined;
    const cents = cellToCents(priceCell);
    if (cents === undefined) return undefined;
    entries.push({ item: itemCell.trim(), cents });
  }
  return entries;
}

export function findPrice(priceList: readonly PriceListEntry[], item: string): number | undefined {
  const target = item.trim().toLocaleLowerCase("en-AU");
  const matches = priceList.filter((entry) => entry.item.toLocaleLowerCase("en-AU") === target);
  return matches.length === 1 ? matches[0].cents : undefined;
}

export function totalCents(lineItems: readonly { readonly unitCents: number; readonly quantity: number }[]): number {
  return lineItems.reduce((total, line) => total + line.unitCents * line.quantity, 0);
}
