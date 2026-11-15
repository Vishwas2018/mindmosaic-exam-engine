import Link from "next/link";

import { libraryHref, type LibraryQuery, type LibraryResult } from "../library-query";

const card = "rounded-2xl border border-royal/10 bg-white shadow-xs";
const select =
  "mt-1 block min-h-11 w-full rounded-xl border border-royal/15 bg-white px-3 text-sm text-[#1f1b24] focus-visible:outline-2 focus-visible:outline-royal";
const label = "block text-xs font-semibold text-[#6e6779]";

export function StatusPill({ status, served }: { status: "approved" | "awaiting"; served?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          status === "approved" ? "bg-royal/10 text-royal" : "bg-amber-50 text-amber-900"
        }`}
      >
        {status === "approved" ? "Human approved" : "Awaiting human approval"}
      </span>
      {served !== undefined && (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            served ? "bg-teal-50 text-teal-900" : "bg-[#f1eef5] text-[#4a4454]"
          }`}
        >
          {served ? "Served to children" : "Not served"}
        </span>
      )}
    </span>
  );
}

/**
 * Question library, after the Claude Design export: search, programme / year / subject / strand / review status
 * filters, removable chips, sort, a count with the visible range, and a table that scrolls inside itself. It is
 * driven by the URL, so it works without script and every state can be shared or reloaded.
 */
export function AdminLibraryView({ query, result }: { query: LibraryQuery; result: LibraryResult }) {
  const chips: { key: string; text: string; href: string }[] = [];
  const without = (key: keyof LibraryQuery) => libraryHref({ ...query, [key]: "", page: 1 });
  if (query.q) chips.push({ key: "q", text: `"${query.q}"`, href: without("q") });
  if (query.programme) {
    const text = result.options.programmes.find((p) => p.value === query.programme)?.label ?? query.programme;
    chips.push({ key: "programme", text, href: without("programme") });
  }
  if (query.year) chips.push({ key: "year", text: `Year ${query.year}`, href: without("year") });
  if (query.subject) chips.push({ key: "subject", text: query.subject, href: without("subject") });
  if (query.strand) chips.push({ key: "strand", text: query.strand, href: without("strand") });
  if (query.status) {
    chips.push({
      key: "status",
      text: query.status === "approved" ? "Human approved" : "Awaiting human approval",
      href: without("status"),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1f1b24]">Question library</h1>
          <p className="mt-1 text-xs text-[#6e6779]">
            Every authored question and whether a named person has approved it. Approval is not the same as the AI
            reviewer running.
          </p>
        </div>
      </div>

      <form method="get" action="/admin/questions" className={`${card} p-5`} aria-label="Filter questions">
        <label htmlFor="lib-q" className={label}>
          Search by id, prompt or strand
        </label>
        <input
          id="lib-q"
          name="q"
          type="search"
          defaultValue={query.q}
          placeholder="Search by id, prompt or strand"
          className={`${select} mt-1`}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="lib-programme" className={label}>
              Programme
            </label>
            <select id="lib-programme" name="programme" defaultValue={query.programme} className={select}>
              <option value="">All programmes</option>
              {result.options.programmes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lib-year" className={label}>
              Year
            </label>
            <select id="lib-year" name="year" defaultValue={query.year} className={select}>
              <option value="">All years</option>
              {result.options.years.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lib-subject" className={label}>
              Subject
            </label>
            <select id="lib-subject" name="subject" defaultValue={query.subject} className={select}>
              <option value="">All subjects</option>
              {result.options.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lib-strand" className={label}>
              Strand
            </label>
            <select id="lib-strand" name="strand" defaultValue={query.strand} className={select}>
              <option value="">All strands</option>
              {result.options.strands.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lib-status" className={label}>
              Review status
            </label>
            <select id="lib-status" name="status" defaultValue={query.status} className={select}>
              <option value="">Any status</option>
              <option value="awaiting">Awaiting human approval</option>
              <option value="approved">Human approved</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="lib-sort" className={label}>
              Sort
            </label>
            <select id="lib-sort" name="sort" defaultValue={query.sort} className={`${select} w-56`}>
              <option value="id">Question id (A to Z)</option>
              <option value="awaiting">Awaiting approval first</option>
            </select>
          </div>
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-royal px-5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
          >
            Apply
          </button>
        </div>
        {chips.length > 0 && (
          <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
            {chips.map((chip) => (
              <li key={chip.key}>
                <Link
                  href={chip.href}
                  aria-label={`Remove filter ${chip.text}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-royal/15 bg-royal/[0.04] px-3 text-xs text-[#1f1b24] hover:bg-royal/10"
                >
                  {chip.text} <span aria-hidden="true">×</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/admin/questions" className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-royal hover:underline">
                Clear all
              </Link>
            </li>
          </ul>
        )}
      </form>

      <p className="text-sm text-[#4a4454]" role="status">
        {result.total === result.overall
          ? `${result.total.toLocaleString("en-AU")} questions`
          : `${result.total.toLocaleString("en-AU")} of ${result.overall.toLocaleString("en-AU")} questions`}
        {result.total > 0 ? ` · showing ${result.from}–${result.to}` : ""}
      </p>

      {result.total === 0 ? (
        <div className={`${card} p-8 text-center`}>
          <p className="text-sm font-semibold text-[#1f1b24]">No questions match these filters</p>
          <p className="mt-1 text-xs text-[#6e6779]">Remove a filter or clear them all to see the whole library.</p>
          <Link href="/admin/questions" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
            Clear all filters
          </Link>
        </div>
      ) : (
        <div className={`${card} relative overflow-x-auto`}>
          <table className="w-full min-w-[760px] text-left text-xs">
            <caption className="sr-only">Questions matching the current filters</caption>
            <thead>
              <tr className="border-b border-royal/10 text-[11px] font-semibold uppercase tracking-wide text-[#6e6779]">
                <th scope="col" className="px-4 py-3">Question</th>
                <th scope="col" className="px-4 py-3">Programme</th>
                <th scope="col" className="px-4 py-3">Year</th>
                <th scope="col" className="px-4 py-3">Subject and strand</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-royal/5">
              {result.rows.map((row) => (
                <tr key={row.id}>
                  <td className="max-w-[320px] px-4 py-3 align-top">
                    <p className="font-mono text-[11px] text-royal">{row.id}</p>
                    <p className="mt-0.5 text-[#1f1b24]">{row.prompt}</p>
                  </td>
                  <td className="px-4 py-3 align-top text-[#4a4454]">{row.programmeLabel}</td>
                  <td className="px-4 py-3 align-top text-[#4a4454]">Year {row.yearLevel}</td>
                  <td className="px-4 py-3 align-top text-[#4a4454]">
                    {row.subject} · {row.strand}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusPill status={row.status} served={row.served} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={`/admin/questions/${encodeURIComponent(row.id)}`}
                      aria-label={`Open ${row.id}`}
                      className="inline-flex min-h-11 items-center rounded-xl border border-royal/15 px-3 font-semibold text-royal hover:bg-royal/5"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.pageCount > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3 text-sm">
          {result.page > 1 ? (
            <Link href={libraryHref({ ...query, page: result.page - 1 })} className="inline-flex min-h-11 items-center font-semibold text-royal hover:underline">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-[#6e6779]">
            Page {result.page} of {result.pageCount}
          </span>
          {result.page < result.pageCount ? (
            <Link href={libraryHref({ ...query, page: result.page + 1 })} className="inline-flex min-h-11 items-center font-semibold text-royal hover:underline">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
