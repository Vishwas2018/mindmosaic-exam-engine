import { describe, expect, it } from "vitest";

import {
  PAGE_SIZE,
  libraryHref,
  parseLibraryQuery,
  queryLibrary,
  type LibraryRow,
} from "@/features/admin/library-query";

function row(id: string, over: Partial<LibraryRow> = {}): LibraryRow {
  return {
    id,
    prompt: `Prompt for ${id}`,
    programme: "naplan_style",
    programmeLabel: "NAPLAN-style",
    yearLevel: 3,
    subject: "Numeracy",
    strand: "Number",
    status: "awaiting",
    served: false,
    ...over,
  };
}

const ROWS: LibraryRow[] = [
  row("a-1"),
  row("a-2", { yearLevel: 5, status: "approved", served: true }),
  row("b-1", { programme: "icas_style", programmeLabel: "ICAS-style", subject: "Reading", strand: "Inference" }),
  row("b-2", { yearLevel: 5, subject: "Reading", strand: "Vocabulary", prompt: "Choose the synonym" }),
];

const q = (raw: Record<string, string>) => parseLibraryQuery(raw);

describe("admin question library query", () => {
  it("filters by each facet and combines them", () => {
    expect(queryLibrary(ROWS, q({ year: "5" })).rows.map((r) => r.id)).toEqual(["a-2", "b-2"]);
    expect(queryLibrary(ROWS, q({ programme: "icas_style" })).rows.map((r) => r.id)).toEqual(["b-1"]);
    expect(queryLibrary(ROWS, q({ subject: "Reading", year: "5" })).rows.map((r) => r.id)).toEqual(["b-2"]);
    expect(queryLibrary(ROWS, q({ status: "approved" })).rows.map((r) => r.id)).toEqual(["a-2"]);
  });

  it("searches id, prompt and strand, case-insensitively", () => {
    expect(queryLibrary(ROWS, q({ q: "SYNONYM" })).rows.map((r) => r.id)).toEqual(["b-2"]);
    expect(queryLibrary(ROWS, q({ q: "inference" })).rows.map((r) => r.id)).toEqual(["b-1"]);
    expect(queryLibrary(ROWS, q({ q: "a-1" })).rows.map((r) => r.id)).toEqual(["a-1"]);
  });

  it("reports an honest total and range, and an empty result is empty", () => {
    const all = queryLibrary(ROWS, q({}));
    expect(all).toMatchObject({ total: 4, overall: 4, from: 1, to: 4 });
    const none = queryLibrary(ROWS, q({ q: "nothing matches" }));
    expect(none).toMatchObject({ total: 0, overall: 4, from: 0, to: 0, pageCount: 1 });
  });

  it("sorts awaiting-approval first when asked, id order otherwise", () => {
    expect(queryLibrary(ROWS, q({ sort: "awaiting" })).rows.map((r) => r.id)).toEqual(["a-1", "b-1", "b-2", "a-2"]);
    expect(queryLibrary(ROWS, q({})).rows.map((r) => r.id)).toEqual(["a-1", "a-2", "b-1", "b-2"]);
  });

  it("offers only strands that exist under the other filters", () => {
    expect(queryLibrary(ROWS, q({ subject: "Reading" })).options.strands).toEqual(["Inference", "Vocabulary"]);
    expect(queryLibrary(ROWS, q({ programme: "naplan_style", subject: "Numeracy" })).options.strands).toEqual(["Number"]);
  });

  it("pages in blocks and clamps an out-of-range page", () => {
    const many = Array.from({ length: PAGE_SIZE * 2 + 3 }, (_, i) => row(`id-${String(i).padStart(3, "0")}`));
    const second = queryLibrary(many, q({ page: "2" }));
    expect(second).toMatchObject({ page: 2, pageCount: 3, from: PAGE_SIZE + 1, to: PAGE_SIZE * 2 });
    expect(queryLibrary(many, q({ page: "99" })).page).toBe(3);
    expect(queryLibrary(many, q({ page: "-4" })).page).toBe(1);
  });

  it("ignores values it does not recognise rather than trusting the URL", () => {
    const parsed = q({ status: "<script>", sort: "drop table", page: "abc" });
    expect(parsed).toMatchObject({ status: "", sort: "id", page: 1 });
  });

  it("builds short, stable hrefs", () => {
    expect(libraryHref({})).toBe("/admin/questions");
    expect(libraryHref({ year: "5", status: "awaiting", sort: "id", page: 1 })).toBe("/admin/questions?year=5&status=awaiting");
  });
});
