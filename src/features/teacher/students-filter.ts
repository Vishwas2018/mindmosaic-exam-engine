import type { StudentStanding, StudentSummary } from "./analytics";

/**
 * Pure filter/paginate helpers for the Students List screen (19). Kept
 * separate from analytics.ts because these operate on presentation rows
 * (one per student-class membership) rather than raw attempts.
 */

export interface StudentListRow {
  studentId: string;
  displayName: string;
  yearLevel: number | null;
  classId: string;
  className: string;
  summary: StudentSummary;
}

export interface StudentListFilters {
  search: string;
  yearLevel: number | "all";
  band: StudentStanding | "all";
  classId: string | "all";
}

export const DEFAULT_STUDENT_LIST_FILTERS: StudentListFilters = {
  search: "",
  yearLevel: "all",
  band: "all",
  classId: "all",
};

export function filterStudentRows(
  rows: readonly StudentListRow[],
  filters: StudentListFilters,
): StudentListRow[] {
  const term = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (term && !row.displayName.toLowerCase().includes(term)) return false;
    if (filters.yearLevel !== "all" && row.yearLevel !== filters.yearLevel) return false;
    if (filters.band !== "all" && row.summary.standing !== filters.band) return false;
    if (filters.classId !== "all" && row.classId !== filters.classId) return false;
    return true;
  });
}

export interface PaginatedResult<T> {
  rows: T[];
  page: number;
  totalPages: number;
  totalCount: number;
}

export const STUDENTS_PAGE_SIZE = 10;

export function paginateRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number = STUDENTS_PAGE_SIZE,
): PaginatedResult<T> {
  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    totalCount,
  };
}
