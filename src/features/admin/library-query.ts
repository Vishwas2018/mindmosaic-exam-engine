/**
 * Pure filtering, sorting and paging for the Admin question library. Kept free of server imports so the rules are
 * unit-tested and the page only reads rows and renders what this returns.
 */

export type LibraryStatus = "approved" | "awaiting";

export interface LibraryRow {
  id: string;
  prompt: string;
  /** examStyle value, e.g. "naplan_style". */
  programme: string;
  programmeLabel: string;
  yearLevel: number;
  subject: string;
  strand: string;
  status: LibraryStatus;
  /** Served to children by the running deployment's gate. */
  served: boolean;
  revision?: number;
}

export const PAGE_SIZE = 25;
export const SORTS = ["id", "awaiting"] as const;
export type LibrarySort = (typeof SORTS)[number];

export interface LibraryQuery {
  q: string;
  programme: string;
  year: string;
  subject: string;
  strand: string;
  status: "" | LibraryStatus;
  sort: LibrarySort;
  page: number;
}

type Raw = Readonly<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parseLibraryQuery(raw: Raw): LibraryQuery {
  const status = one(raw.status);
  const sort = one(raw.sort);
  const page = Number.parseInt(one(raw.page), 10);
  return {
    q: one(raw.q).slice(0, 120),
    programme: one(raw.programme),
    year: one(raw.year),
    subject: one(raw.subject),
    strand: one(raw.strand),
    status: status === "approved" || status === "awaiting" ? status : "",
    sort: (SORTS as readonly string[]).includes(sort) ? (sort as LibrarySort) : "id",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export interface LibraryResult {
  rows: LibraryRow[];
  total: number;
  /** Rows in the whole library, before any filter. */
  overall: number;
  page: number;
  pageCount: number;
  from: number;
  to: number;
  options: {
    programmes: { value: string; label: string }[];
    years: string[];
    subjects: string[];
    strands: string[];
  };
}

function distinct<T>(values: Iterable<T>): T[] {
  return [...new Set(values)];
}

export function queryLibrary(all: readonly LibraryRow[], query: LibraryQuery): LibraryResult {
  const needle = query.q.toLowerCase();
  const matches = (row: LibraryRow, ignore?: "strand") =>
    (!query.programme || row.programme === query.programme) &&
    (!query.year || String(row.yearLevel) === query.year) &&
    (!query.subject || row.subject === query.subject) &&
    (ignore === "strand" || !query.strand || row.strand === query.strand) &&
    (!query.status || row.status === query.status) &&
    (!needle ||
      row.id.toLowerCase().includes(needle) ||
      row.prompt.toLowerCase().includes(needle) ||
      row.strand.toLowerCase().includes(needle));

  const filtered = all.filter((row) => matches(row));
  const sorted = [...filtered].sort((a, b) => {
    if (query.sort === "awaiting" && a.status !== b.status) return a.status === "awaiting" ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);

  return {
    rows,
    total,
    overall: all.length,
    page,
    pageCount,
    from: total === 0 ? 0 : start + 1,
    to: start + rows.length,
    options: {
      programmes: distinct(all.map((r) => r.programme))
        .sort()
        .map((value) => ({ value, label: all.find((r) => r.programme === value)!.programmeLabel })),
      years: distinct(all.map((r) => String(r.yearLevel))).sort((a, b) => Number(a) - Number(b)),
      subjects: distinct(all.map((r) => r.subject)).sort(),
      /* Strands offered are the ones that exist under the other current filters. */
      strands: distinct(all.filter((r) => matches(r, "strand")).map((r) => r.strand)).sort(),
    },
  };
}

/** The href for a library state, dropping empty and default values. */
export function libraryHref(query: Partial<LibraryQuery>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "" || (key === "sort" && value === "id") || (key === "page" && value === 1)) continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `/admin/questions?${text}` : "/admin/questions";
}
