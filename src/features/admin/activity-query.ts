/** Pure filtering and paging for the Admin activity history, so the rules are unit-tested. */

export type AdminActivityAction = "approved" | "writing_approved" | "published";

export interface AdminActivityEvent {
  id: string;
  /** ISO 8601 time. */
  at: string;
  /** A named person, or "System" for automated steps. */
  actor: string;
  action: AdminActivityAction;
  target: string;
  detail?: string;
  hash?: string;
}

export const ACTIVITY_PAGE_SIZE = 25;

export const ACTION_LABEL: Record<AdminActivityAction, string> = {
  approved: "Approved a question",
  writing_approved: "Approved a writing prompt",
  published: "Published",
};

export interface ActivityQuery {
  actor: string;
  action: "" | AdminActivityAction;
  /** YYYY-MM-DD, inclusive. */
  from: string;
  to: string;
  page: number;
}

type Raw = Readonly<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseActivityQuery(raw: Raw): ActivityQuery {
  const action = one(raw.action);
  const page = Number.parseInt(one(raw.page), 10);
  return {
    actor: one(raw.actor).slice(0, 120),
    action: action in ACTION_LABEL ? (action as AdminActivityAction) : "",
    from: DATE.test(one(raw.from)) ? one(raw.from) : "",
    to: DATE.test(one(raw.to)) ? one(raw.to) : "",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export interface ActivityResult {
  rows: AdminActivityEvent[];
  total: number;
  overall: number;
  page: number;
  pageCount: number;
  actors: string[];
}

export function queryActivity(all: readonly AdminActivityEvent[], query: ActivityQuery): ActivityResult {
  const filtered = all.filter(
    (e) =>
      (!query.actor || e.actor === query.actor) &&
      (!query.action || e.action === query.action) &&
      (!query.from || e.at.slice(0, 10) >= query.from) &&
      (!query.to || e.at.slice(0, 10) <= query.to),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / ACTIVITY_PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * ACTIVITY_PAGE_SIZE;
  return {
    rows: filtered.slice(start, start + ACTIVITY_PAGE_SIZE),
    total: filtered.length,
    overall: all.length,
    page,
    pageCount,
    actors: [...new Set(all.map((e) => e.actor))].sort(),
  };
}
