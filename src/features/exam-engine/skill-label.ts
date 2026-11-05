/**
 * Display text for a question's skill.
 *
 * `metadata.skill` is free text in the bank: most items carry a readable label
 * ("Add two three-digit numbers involving regrouping") but some still carry the
 * dotted taxonomy code they were authored under ("num.prod.number.skip-counting").
 * A child must never see the code. This turns a code into its last segment as a
 * sentence ("Skip counting") and leaves readable labels exactly as they are.
 *
 * It is for display only. Grouping, matching and recommendations keep using the
 * raw value, so changing a label here can never change what a result is grouped by.
 */
const TAXONOMY_CODE = /^[a-z0-9]+(?:\.[a-z0-9][a-z0-9-]*)+$/i;

export function skillDisplayLabel(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  if (!TAXONOMY_CODE.test(value)) return value;
  const tail = value.split(".").pop() ?? value;
  const words = tail.replace(/[-_]+/g, " ").trim();
  return words.length > 0 ? words.charAt(0).toUpperCase() + words.slice(1) : value;
}
