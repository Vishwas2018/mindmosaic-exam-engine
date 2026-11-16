import Link from "next/link";

import type { AdminPaperRow, AdminPublicationData, AdminWritingPrompt } from "@/server/admin-governance-data";

import {
  ACTION_LABEL,
  type ActivityQuery,
  type ActivityResult,
} from "../activity-query";
import type { AdminSectionAvailability } from "../types";

const card = "rounded-2xl border border-royal/10 bg-white shadow-xs";
const h1 = "text-2xl font-semibold tracking-tight text-[#1f1b24]";
const h2 = "text-base font-semibold text-[#1f1b24]";
const muted = "text-xs text-[#6e6779]";
const field =
  "mt-1 block min-h-11 w-full rounded-xl border border-royal/15 bg-white px-3 text-sm text-[#1f1b24] focus-visible:outline-2 focus-visible:outline-royal";
const labelCls = "block text-xs font-semibold text-[#6e6779]";
const primaryBtn =
  "min-h-11 rounded-xl bg-royal px-5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal";

function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div>
      <h1 className={h1}>{title}</h1>
      {children && <p className={`mt-1 ${muted}`}>{children}</p>}
    </div>
  );
}

function Unavailable({ section, title }: { section: AdminSectionAvailability; title: string }) {
  return (
    <section className={`${card} p-6`} aria-labelledby="unavailable-title" role="status">
      <h2 id="unavailable-title" className={h2}>
        {title}
      </h2>
      <p className="mt-2 text-sm text-[#1f1b24]">{section.reason}</p>
      {section.requiredDependency && <p className={`mt-3 font-medium ${muted}`}>{section.requiredDependency}</p>}
    </section>
  );
}

const STATE_LABEL = { ready: "Ready", short: "Short", unavailable: "Not available" } as const;
const STATE_TONE = {
  ready: "bg-teal-50 text-teal-900",
  short: "bg-amber-50 text-amber-900",
  unavailable: "bg-[#f1eef5] text-[#4a4454]",
} as const;

/* ------------------------------------------------------------------ */
/* Paper review                                                        */
/* ------------------------------------------------------------------ */

export function AdminPaperListView({ papers }: { papers: AdminPaperRow[] }) {
  const ready = papers.filter((p) => p.state === "ready").length;
  return (
    <div className="space-y-5">
      <PageHeader title="Paper review">
        Fixed-shape practice papers. A paper fixes the shape; questions are drawn from the gated bank when a child sits
        it, so readiness is a property of what has been approved, never of a count alone.
      </PageHeader>
      <p className="text-sm text-[#4a4454]" role="status">
        {papers.length} papers · {ready} ready to sit · {papers.length - ready} short or not available
      </p>
      <div className={`${card} relative overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-left text-xs">
          <caption className="sr-only">Practice papers and what the bank can fill</caption>
          <thead>
            <tr className="border-b border-royal/10 text-[11px] font-semibold uppercase tracking-wide text-[#6e6779]">
              <th scope="col" className="px-4 py-3">Paper</th>
              <th scope="col" className="px-4 py-3">Questions</th>
              <th scope="col" className="px-4 py-3">Time</th>
              <th scope="col" className="px-4 py-3">Can fill</th>
              <th scope="col" className="px-4 py-3">Readiness</th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-royal/5">
            {papers.map((p) => (
              <tr key={p.id}>
                <td className="max-w-[320px] px-4 py-3 align-top">
                  <p className="font-semibold text-[#1f1b24]">{p.label}</p>
                  <p className="font-mono text-[11px] text-royal">{p.id}</p>
                </td>
                <td className="px-4 py-3 align-top text-[#4a4454]">{p.questionCount}</td>
                <td className="px-4 py-3 align-top text-[#4a4454]">{p.timeMinutes} min</td>
                <td className="px-4 py-3 align-top text-[#4a4454]">
                  {p.availableCount} of {p.questionCount}
                  <span className="block">
                    {p.distinctPapers} distinct form{p.distinctPapers === 1 ? "" : "s"}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATE_TONE[p.state]}`}>
                    {STATE_LABEL[p.state]}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/admin/papers/${encodeURIComponent(p.id)}`}
                    aria-label={`Open ${p.label}`}
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
    </div>
  );
}

export function AdminPaperDetailView({ paper }: { paper: AdminPaperRow }) {
  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className={muted}>
        <Link href="/admin/papers" className="inline-flex min-h-11 items-center font-semibold text-royal hover:underline">
          Paper review
        </Link>{" "}
        / <span className="font-mono">{paper.id}</span>
      </nav>
      <div className={`${card} flex flex-wrap items-start justify-between gap-3 p-5`}>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[#1f1b24]">{paper.label}</h1>
          <p className={`mt-1 ${muted}`}>
            {paper.programmeLabel} · Year {paper.yearLevel} ·{" "}
            {paper.presentation === "full_length_practice" ? "Full-length practice" : "Practice module"}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATE_TONE[paper.state]}`}>
          {STATE_LABEL[paper.state]}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Questions", String(paper.questionCount), "the paper's size"],
          ["Time", `${paper.timeMinutes} min`, "the paper's time limit"],
          ["Bank can fill", `${paper.availableCount} of ${paper.questionCount}`, `${paper.distinctPapers} distinct form${paper.distinctPapers === 1 ? "" : "s"} without overlap`],
        ].map(([t, v, c]) => (
          <section key={t} className={`${card} p-5`} aria-label={t}>
            <h2 className="text-sm font-semibold text-[#1f1b24]">{t}</h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#1f1b24]">{v}</p>
            <p className={`mt-1 ${muted}`}>{c}</p>
          </section>
        ))}
      </div>

      {paper.state !== "ready" && (
        <p className="rounded-2xl border border-amber-500/20 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900" role="status">
          {paper.state === "short"
            ? "The approved bank cannot fill this paper in full yet, so it is offered only as a smaller practice module. It must not be presented as the full-length paper."
            : "Nothing can be drawn for this paper from the approved bank, so it is not offered."}
        </p>
      )}

      <section className={`${card} relative overflow-x-auto`} aria-labelledby="paper-sources">
        <h2 id="paper-sources" className={`${h2} p-5 pb-0`}>
          What each part draws on
        </h2>
        <table className="mt-3 w-full min-w-[520px] text-left text-xs">
          <caption className="sr-only">Question sources for this paper</caption>
          <thead>
            <tr className="border-b border-royal/10 text-[11px] font-semibold uppercase tracking-wide text-[#6e6779]">
              <th scope="col" className="px-5 py-3">Source</th>
              <th scope="col" className="px-5 py-3">Asked for</th>
              <th scope="col" className="px-5 py-3">Approved pool</th>
              <th scope="col" className="px-5 py-3">Can be met</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-royal/5">
            {paper.sources.map((s) => (
              <tr key={s.sourceId}>
                <td className="px-5 py-3 font-medium text-[#1f1b24]">{s.sourceId}</td>
                <td className="px-5 py-3 text-[#4a4454]">{s.requested}</td>
                <td className="px-5 py-3 text-[#4a4454]">{s.poolSize}</td>
                <td className="px-5 py-3">
                  <span className={s.satisfiable ? "font-semibold text-teal-800" : "font-semibold text-amber-900"}>
                    {s.satisfiable ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {paper.adaptations.length > 0 && (
        <section className={`${card} p-5`} aria-labelledby="paper-adapt">
          <h2 id="paper-adapt" className={h2}>
            How it differs from the assessment it is modelled on
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {paper.adaptations.map((a) => (
              <li key={a} className="rounded-full bg-royal/[0.06] px-3 py-1 text-xs text-[#4a4454]">
                {a.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className={muted}>
        Readiness is computed by running the real selection over the gated bank. Pinned per-question revisions are not
        recorded for papers yet, because questions are drawn when a child sits the paper.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Publication                                                         */
/* ------------------------------------------------------------------ */

const MODE_LABEL = { report: "Report", enforce: "Enforce", mixed: "Mixed" } as const;
const MODE_TONE = { report: "bg-amber-50 text-amber-900", enforce: "bg-teal-50 text-teal-900", mixed: "bg-royal/10 text-royal" } as const;

function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span aria-hidden="true" className={ok ? "text-teal-700" : "text-amber-700"}>
        {ok ? "✓" : "✗"}
      </span>
      <span className="text-[#1f1b24]">
        <span className="font-semibold">{label}</span>
        <span className="text-[#4a4454]"> · {detail}</span>
        <span className="sr-only">{ok ? " (passes)" : " (does not pass)"}</span>
      </span>
    </li>
  );
}

export function AdminPublicationView({ data }: { data: AdminPublicationData }) {
  const check = data.check;
  return (
    <div className="space-y-5">
      <PageHeader title="Publication">
        What children can actually be served, by programme gate, and what the publication records say. Publishing is
        done by a reviewed change to the repository&apos;s approval and manifest records, not from this screen.
      </PageHeader>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className={`${card} p-6`} aria-labelledby="pub-check">
            <h2 id="pub-check" className={h2}>
              Check a question
            </h2>
            <p className={`mt-1 ${muted}`}>The same checks the serving gate applies, for one question id.</p>
            <form method="get" action="/admin/publication" className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label htmlFor="pub-id" className={labelCls}>
                  Question id
                </label>
                <input id="pub-id" name="check" defaultValue={check?.id ?? ""} className={field} placeholder="g5-num-chart-001" />
              </div>
              <button type="submit" className={primaryBtn}>
                Check
              </button>
            </form>
            {check && (
              <div className="mt-4" role="status">
                {!check.inBank ? (
                  <p className="text-sm text-[#1f1b24]">
                    No authored question has the id <span className="font-mono">{check.id}</span>.
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[#1f1b24]">
                      <span className="font-mono">{check.id}</span>
                    </p>
                    <ul className="mt-2 grid gap-1.5">
                      <CheckRow ok label="Authored" detail="present in the question bank and valid against the schema" />
                      <CheckRow
                        ok={check.approved}
                        label="Human approved"
                        detail={
                          check.approved
                            ? `${check.approvedBy} signed revision ${check.revision}`
                            : "no verified human approval record"
                        }
                      />
                      <CheckRow
                        ok={check.inManifest}
                        label="Publication manifest"
                        detail={check.inManifest ? "a manifest record exists" : "no manifest record (curated content has none)"}
                      />
                      <CheckRow
                        ok={check.served}
                        label="Served to children"
                        detail={check.served ? "this deployment serves it" : "this deployment does not serve it"}
                      />
                    </ul>
                    <p className={`mt-3 ${muted}`}>
                      <Link href={`/admin/questions/${encodeURIComponent(check.id)}`} className="font-semibold text-royal hover:underline">
                        Open the question
                      </Link>
                    </p>
                  </>
                )}
              </div>
            )}
          </section>

          <section className={`${card} p-6`} aria-labelledby="pub-history">
            <h2 id="pub-history" className={h2}>
              Publication history
            </h2>
            {data.batches.length === 0 ? (
              <p className="mt-3 text-sm text-[#4a4454]">No publication batches are recorded.</p>
            ) : (
              <ol className="mt-4 grid gap-4 border-l border-royal/15 pl-4">
                {data.batches.slice(0, 12).map((b) => (
                  <li key={b.batchId}>
                    <p className="text-sm font-semibold text-[#1f1b24]">
                      {b.count} question{b.count === 1 ? "" : "s"} published
                    </p>
                    <p className={muted}>
                      Batch <span className="font-mono">{b.batchId}</span> ·{" "}
                      {new Date(b.publishedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium" })}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            {data.batches.length > 12 && <p className={`mt-3 ${muted}`}>Showing the 12 most recent of {data.batches.length} batches. The full list is in Activity.</p>}
          </section>
        </div>

        <aside className="space-y-4" aria-label="Programme gates">
          <section className={`${card} p-5`} aria-labelledby="pub-gates">
            <h2 id="pub-gates" className={h2}>
              Programme gates
            </h2>
            <p className={`mt-1 ${muted}`}>What each programme actually enforces at serve time.</p>
            <ul className="mt-3 grid gap-3">
              {data.gates.map((g) => (
                <li key={g.label} className="rounded-xl border border-royal/10 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1f1b24]">{g.label}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${MODE_TONE[g.mode]}`}>{MODE_LABEL[g.mode]}</span>
                  </div>
                  <p className={`mt-1 ${muted}`}>
                    {g.served.toLocaleString("en-AU")} served · {g.approved.toLocaleString("en-AU")} approved of{" "}
                    {g.authored.toLocaleString("en-AU")}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-xl bg-royal/[0.05] p-3 text-xs leading-relaxed text-[#4a4454]">
              Report mode serves questions without requiring approval and records what it would block. Enforce mode
              refuses to serve a question with no approval for its exact revision.
            </p>
          </section>
          <section className={`${card} p-5`} aria-labelledby="pub-evidence">
            <h2 id="pub-evidence" className={h2}>
              Evidence read
            </h2>
            <dl className="mt-2 grid gap-1.5 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-[#6e6779]">Manifest records</dt><dd className="font-semibold">{data.totals.manifests.toLocaleString("en-AU")}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#6e6779]">Human approvals</dt><dd className="font-semibold">{data.totals.approvals.toLocaleString("en-AU")}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#6e6779]">Served today</dt><dd className="font-semibold">{data.totals.served.toLocaleString("en-AU")}</dd></div>
            </dl>
            {data.evidenceProblems.length > 0 ? (
              <div role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-semibold">{data.evidenceProblems.length} evidence problem{data.evidenceProblems.length === 1 ? "" : "s"}</p>
                <ul className="mt-1 list-disc pl-4">
                  {data.evidenceProblems.slice(0, 5).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <p className="mt-1">While there are problems, a gate in enforce mode serves nothing.</p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-teal-800">No evidence problems were reported when this page loaded. Nothing here recomputes a hash.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

export function AdminWritingView({
  prompts,
  problems,
  marking,
}: {
  prompts: AdminWritingPrompt[];
  problems: string[];
  marking: AdminSectionAvailability;
}) {
  return (
    <div className="space-y-5">
      <PageHeader title="Writing review">
        Writing prompts that a named person has approved, and the marking queue. A child&apos;s response is never shown with
        their identity.
      </PageHeader>

      <Unavailable section={marking} title="Marking queue: not available yet" />

      <section className={`${card} relative overflow-x-auto`} aria-labelledby="writing-prompts">
        <h2 id="writing-prompts" className={`${h2} p-5 pb-0`}>
          Approved prompts ({prompts.length})
        </h2>
        {problems.length > 0 && (
          <p role="alert" className="mx-5 mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            {problems.length} writing approval problem{problems.length === 1 ? "" : "s"}. While there are problems, no
            writing prompt is served.
          </p>
        )}
        {prompts.length === 0 ? (
          <p className="p-5 text-sm text-[#4a4454]">No writing prompt has a human approval record, so no real writing task is served.</p>
        ) : (
          <table className="mt-3 w-full min-w-[640px] text-left text-xs">
            <caption className="sr-only">Approved writing prompts</caption>
            <thead>
              <tr className="border-b border-royal/10 text-[11px] font-semibold uppercase tracking-wide text-[#6e6779]">
                <th scope="col" className="px-5 py-3">Prompt</th>
                <th scope="col" className="px-5 py-3">Form</th>
                <th scope="col" className="px-5 py-3">Year</th>
                <th scope="col" className="px-5 py-3">Time</th>
                <th scope="col" className="px-5 py-3">Approved by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-royal/5">
              {prompts.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-[#1f1b24]">{p.title}</p>
                    <p className="font-mono text-[11px] text-royal">{p.id}</p>
                  </td>
                  <td className="px-5 py-3 capitalize text-[#4a4454]">{p.form}</td>
                  <td className="px-5 py-3 text-[#4a4454]">Year {p.yearLevel}</td>
                  <td className="px-5 py-3 text-[#4a4454]">{p.timeLimitMinutes} min</td>
                  <td className="px-5 py-3 text-[#4a4454]">
                    {p.approvedBy}
                    <span className="block">
                      {new Date(p.approvedAt).toLocaleDateString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium" })} · rev {p.revision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Support                                                             */
/* ------------------------------------------------------------------ */

export function AdminSupportView({ availability }: { availability: AdminSectionAvailability }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Support">
        Fixed-reason question reports and account issues. An administrator opens the question, never the child&apos;s record.
      </PageHeader>
      <Unavailable section={availability} title="Reports: not available yet" />
      <section className={`${card} p-6`} aria-labelledby="support-privacy">
        <h2 id="support-privacy" className={h2}>
          Privacy boundary
        </h2>
        <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm text-[#1f1b24]">
          <li>A report shows the question and a fixed reason, with no child name, answers or free text.</li>
          <li>A distress report is not handled here: it goes to a person under the safeguarding policy.</li>
          <li>From a report you can open the question for review, and unpublish through the publication records.</li>
        </ul>
        <p className={`mt-3 ${muted}`}>Until reports exist, a parent who finds a problem can use Help and contact.</p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

function activityHref(q: Partial<ActivityQuery>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === "" || (k === "page" && v === 1)) continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `/admin/activity?${s}` : "/admin/activity";
}

export function AdminActivityView({ query, result }: { query: ActivityQuery; result: ActivityResult }) {
  const filtered = Boolean(query.actor || query.action || query.from || query.to);
  return (
    <div className="space-y-5">
      <PageHeader title="Activity history">
        Who approved or published what, and when, read from the repository&apos;s append-only approval and manifest records.
        Automated steps are shown as System.
      </PageHeader>

      <form method="get" action="/admin/activity" className={`${card} p-5`} aria-label="Filter activity">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="act-actor" className={labelCls}>Who</label>
            <select id="act-actor" name="actor" defaultValue={query.actor} className={field}>
              <option value="">Anyone</option>
              {result.actors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="act-action" className={labelCls}>Action</label>
            <select id="act-action" name="action" defaultValue={query.action} className={field}>
              <option value="">Any action</option>
              {Object.entries(ACTION_LABEL).map(([value, text]) => (
                <option key={value} value={value}>{text}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="act-from" className={labelCls}>From</label>
            <input id="act-from" name="from" type="date" defaultValue={query.from} className={field} />
          </div>
          <div>
            <label htmlFor="act-to" className={labelCls}>To</label>
            <input id="act-to" name="to" type="date" defaultValue={query.to} className={field} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className={primaryBtn}>Apply</button>
          {filtered && (
            <Link href="/admin/activity" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
              Clear all
            </Link>
          )}
        </div>
      </form>

      <p className="text-sm text-[#4a4454]" role="status">
        {filtered ? `${result.total.toLocaleString("en-AU")} of ${result.overall.toLocaleString("en-AU")} events` : `${result.total.toLocaleString("en-AU")} events`}
      </p>

      {result.total === 0 ? (
        <div className={`${card} p-8 text-center`}>
          <p className="text-sm font-semibold text-[#1f1b24]">No activity in this range</p>
          <p className={`mt-1 ${muted}`}>Widen the dates or clear the filters.</p>
        </div>
      ) : (
        <ol className={`${card} divide-y divide-royal/5`} aria-label="Activity events">
          {result.rows.map((e) => (
            <li key={e.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-[#1f1b24]">
                  <span className="font-semibold">{e.actor}</span> · {ACTION_LABEL[e.action]}
                </p>
                <p className="break-words text-xs text-[#4a4454]">
                  <span className="font-mono">{e.target}</span>
                  {e.detail ? ` · ${e.detail}` : ""}
                </p>
                {e.hash && <p className="break-all font-mono text-[10px] text-royal">{e.hash}</p>}
              </div>
              <time dateTime={e.at} className="shrink-0 text-xs text-[#6e6779]">
                {new Date(e.at).toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" })}
              </time>
            </li>
          ))}
        </ol>
      )}

      {result.pageCount > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-3 text-sm">
          {result.page > 1 ? (
            <Link href={activityHref({ ...query, page: result.page - 1 })} className="inline-flex min-h-11 items-center font-semibold text-royal hover:underline">Previous</Link>
          ) : <span />}
          <span className={muted}>Page {result.page} of {result.pageCount}</span>
          {result.page < result.pageCount ? (
            <Link href={activityHref({ ...query, page: result.page + 1 })} className="inline-flex min-h-11 items-center font-semibold text-royal hover:underline">Next</Link>
          ) : <span />}
        </nav>
      )}
      <p className={muted}>
        Question reports, unpublishing and request-changes decisions are not recorded yet, so they do not appear here.
      </p>
    </div>
  );
}
