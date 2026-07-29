"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Search } from "lucide-react";

import { Badge, Button, buttonClasses, EmptyState, Input, Select } from "@/components/ui";

import type { StudentStanding } from "../analytics";
import type { TeacherClass } from "../data";
import { formatLastActive } from "../format";
import {
  DEFAULT_STUDENT_LIST_FILTERS,
  filterStudentRows,
  paginateRows,
  STUDENTS_PAGE_SIZE,
  type StudentListRow,
} from "../students-filter";
import { StandingBadge } from "./StandingBadge";

const BAND_OPTIONS: { value: StudentStanding | "all"; label: string }[] = [
  { value: "all", label: "All performance bands" },
  { value: "on_track", label: "On track" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "at_risk", label: "At risk" },
];

function rowKey(row: StudentListRow): string {
  return `${row.classId}:${row.studentId}`;
}

export function StudentsTable({
  rows,
  classes,
}: {
  rows: StudentListRow[];
  classes: TeacherClass[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(DEFAULT_STUDENT_LIST_FILTERS.search);
  const [classId, setClassId] = useState(DEFAULT_STUDENT_LIST_FILTERS.classId);
  const [yearLevel, setYearLevel] = useState(DEFAULT_STUDENT_LIST_FILTERS.yearLevel);
  const [band, setBand] = useState(DEFAULT_STUDENT_LIST_FILTERS.band);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const yearOptions = useMemo(() => {
    const values = new Set<number>();
    for (const row of rows) if (row.yearLevel !== null) values.add(row.yearLevel);
    return [...values].sort((a, b) => a - b);
  }, [rows]);

  const filtered = useMemo(
    () => filterStudentRows(rows, { search, classId, yearLevel, band }),
    [rows, search, classId, yearLevel, band],
  );

  const { rows: pageRows, totalPages, totalCount } = paginateRows(filtered, page);

  const selectedRows = rows.filter((row) => selected.has(rowKey(row)));
  const selectedClassIds = new Set(selectedRows.map((row) => row.classId));
  const canBulkAssign = selectedRows.length > 0 && selectedClassIds.size === 1;

  function toggleRow(row: StudentListRow) {
    setSelected((current) => {
      const next = new Set(current);
      const key = rowKey(row);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function togglePage() {
    setSelected((current) => {
      const next = new Set(current);
      const allOnPageSelected = pageRows.every((row) => next.has(rowKey(row)));
      for (const row of pageRows) {
        if (allOnPageSelected) next.delete(rowKey(row));
        else next.add(rowKey(row));
      }
      return next;
    });
  }

  function createAssignmentForSelected() {
    if (!canBulkAssign) return;
    const [onlyClassId] = selectedClassIds;
    const studentIds = selectedRows.map((row) => row.studentId).join(",");
    router.push(`/teacher/assignments/new?class=${onlyClassId}&students=${studentIds}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          placeholder="Search students…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Class"
          value={classId}
          onChange={(event) => {
            setClassId(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All classes</option>
          {classes.map((teacherClass) => (
            <option key={teacherClass.id} value={teacherClass.id}>
              {teacherClass.name}
            </option>
          ))}
        </Select>
        <Select
          label="Year level"
          value={String(yearLevel)}
          onChange={(event) => {
            setYearLevel(event.target.value === "all" ? "all" : Number(event.target.value));
            setPage(1);
          }}
        >
          <option value="all">All years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </Select>
        <Select
          label="Performance band"
          value={band}
          onChange={(event) => {
            setBand(event.target.value as StudentStanding | "all");
            setPage(1);
          }}
        >
          {BAND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-royal/10 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-muted">
          {selectedRows.length > 0
            ? `${selectedRows.length} selected`
            : `${totalCount} student${totalCount === 1 ? "" : "s"}`}
        </p>
        {selectedRows.length > 0 && !canBulkAssign && (
          <p className="text-xs font-semibold text-warning">
            Select students from a single class to create a bulk assignment.
          </p>
        )}
        <Button
          type="button"
          size="sm"
          disabled={!canBulkAssign}
          onClick={createAssignmentForSelected}
        >
          <ClipboardList aria-hidden="true" className="h-4 w-4" />
          Create assignment for selected
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No students match these filters"
          description="Try widening the search, class, year or performance band filters."
          icon={<Search aria-hidden="true" className="h-6 w-6" />}
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-royal/10 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-royal/10 text-left">
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all students on this page"
                    className="h-4 w-4 accent-royal"
                    checked={pageRows.length > 0 && pageRows.every((row) => selected.has(rowKey(row)))}
                    onChange={togglePage}
                  />
                </th>
                <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                  Student
                </th>
                <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                  Class
                </th>
                <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                  Last session
                </th>
                <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                  Avg score
                </th>
                <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                  Mastery
                </th>
                <th className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-royal/5 transition hover:bg-soft-purple/60"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.displayName}`}
                      className="h-4 w-4 accent-royal"
                      checked={selected.has(rowKey(row))}
                      onChange={() => toggleRow(row)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/teacher/students/${row.studentId}?class=${row.classId}`}
                      className="font-bold text-ink hover:text-royal"
                    >
                      {row.displayName}
                    </a>
                    {row.yearLevel !== null && (
                      <span className="ml-2">
                        <Badge variant="neutral">Year {row.yearLevel}</Badge>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{row.className}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatLastActive(row.summary.lastActiveAt)}
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums text-ink">
                    {row.summary.averagePercentage === null
                      ? "—"
                      : `${row.summary.averagePercentage}%`}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {row.summary.strongestSubject ?? "—"}
                  </td>
                  <td className="px-6 py-3">
                    <StandingBadge standing={row.summary.standing} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between gap-3 border-t border-royal/10 px-4 py-3">
            <p className="text-xs font-semibold text-muted">
              Page {page} of {totalPages} · {STUDENTS_PAGE_SIZE} per page
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className={buttonClasses({ variant: "secondary", size: "sm" })}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
