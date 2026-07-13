/**
 * Independent money derivation: a table visual's own rows as the
 * authoritative price list, never a re-typed number in the explanation.
 * Every amount is converted to integer cents immediately — no floating-
 * point currency arithmetic anywhere past this module's boundary.
 */
import type { VisualAsset } from "@/schemas/visual.schema";
import { CORRECTNESS_LIMITS } from "../config";
import { dollarsToCents, NumericDerivationError, numberToCents } from "./numeric";
import { validateTableShape } from "./visual-lookup";

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
  // A table with duplicate headers, duplicate row labels, or a malformed
  // row width cannot be safely read as an unambiguous price list.
  if (validateTableShape(table) !== undefined) return undefined;

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

/**
 * Sums quantity x unit-price line items into an exact integer cent total.
 * Every operand is validated before any arithmetic runs: a non-integral,
 * negative, or excessive quantity, or a line-item count or running total
 * outside the configured bounds, fails closed with a stable
 * `NumericDerivationError` rather than silently producing a wrong or
 * overflowed total. `unitCents * quantity` and the running sum are plain
 * `number` operations, but only ever between validated, bounded integers —
 * always exact within `Number.MAX_SAFE_INTEGER`, never a float-currency
 * multiplication of dollar amounts.
 */
export function totalCents(lineItems: readonly { readonly unitCents: number; readonly quantity: number }[]): number {
  if (lineItems.length > CORRECTNESS_LIMITS.MONEY_MAX_LINE_ITEMS) {
    throw new NumericDerivationError(
      "money_limit_exceeded",
      `${lineItems.length} line items exceeds the supported limit of ${CORRECTNESS_LIMITS.MONEY_MAX_LINE_ITEMS}.`,
    );
  }

  let total = 0;
  for (const line of lineItems) {
    if (!Number.isInteger(line.quantity) || line.quantity < 0) {
      throw new NumericDerivationError(
        "money_value_invalid",
        `Quantity ${line.quantity} is not a non-negative integer.`,
      );
    }
    if (line.quantity > CORRECTNESS_LIMITS.MONEY_MAX_QUANTITY) {
      throw new NumericDerivationError(
        "money_limit_exceeded",
        `Quantity ${line.quantity} exceeds the supported limit of ${CORRECTNESS_LIMITS.MONEY_MAX_QUANTITY}.`,
      );
    }
    if (!Number.isInteger(line.unitCents)) {
      throw new NumericDerivationError("money_value_invalid", `Unit price of ${line.unitCents} cents is not an integer.`);
    }
    total += line.unitCents * line.quantity;
    if (Math.abs(total) > CORRECTNESS_LIMITS.MONEY_MAX_TOTAL_CENTS) {
      throw new NumericDerivationError(
        "money_limit_exceeded",
        `Running total exceeds the supported limit of ${CORRECTNESS_LIMITS.MONEY_MAX_TOTAL_CENTS} cents.`,
      );
    }
  }
  return total;
}
