import Link from "next/link";

import type { AdminOverviewData, AdminSectionAvailability, AdminView, AdminProgrammeGate } from "../types";

const card = "rounded-2xl border border-royal/10 bg-white shadow-xs";

const MODE_LABEL: Record<AdminProgrammeGate["mode"], string> = {
  report: "Report mode",
  enforce: "Enforce mode",
  mixed: "Mixed",
};
const MODE_TONE: Record<AdminProgrammeGate["mode"], string> = {
  report: "bg-amber-50 text-amber-900",
  enforce: "bg-teal-50 text-teal-900",
  mixed: "bg-royal/10 text-royal",
};

function Unavailable({ section }: { section: AdminSectionAvailability }) {
  return (
    <>
      <p className="mt-2 text-sm font-semibold text-[#1f1b24]">Not available yet</p>
      <p className="mt-1 text-xs leading-relaxed text-[#6e6779]">{section.reason}</p>
      {section.requiredDependency && (
        <p className="mt-2 text-[11px] font-medium text-[#6e6779]">{section.requiredDependency}</p>
      )}
    </>
  );
}

function QueueCard({
  title,
  count,
  caption,
  tone,
  section,
  action,
}: {
  title: string;
  count?: number;
  caption: string;
  tone?: "warn";
  section?: AdminSectionAvailability;
  action?: React.ReactNode;
}) {
  const unavailable = section && !section.isAvailable;
  return (
    <section className={`${card} flex flex-col p-5`} aria-label={title}>
      <h3 className="text-sm font-semibold text-[#1f1b24]">{title}</h3>
      {unavailable ? (
        <Unavailable section={section} />
      ) : (
        <>
          <p className={`mt-2 text-4xl font-semibold tracking-tight ${tone === "warn" ? "text-[#8a3b12]" : "text-[#1f1b24]"}`}>
            {count ?? 0}
          </p>
          <p className="mt-1 text-xs text-[#6e6779]">{caption}</p>
        </>
      )}
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}

/**
 * Admin Overview, after the Claude Design export: the three-layer reminder, three review queues, what families
 * reported, and the publication gate per programme. A queue with no backing data says what it is waiting for
 * instead of showing a number.
 */
export function AdminOverviewView({
  overview,
  source,
  onOpen,
}: {
  overview: AdminOverviewData;
  source: "dev" | "preview";
  onOpen: (view: AdminView) => void;
}) {
  const linkClass = "text-sm font-semibold text-royal hover:underline";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1f1b24]">Overview</h1>
        <span className="rounded-full border border-royal/10 bg-white px-3 py-1 text-xs font-medium text-[#6e6779]">
          {source === "preview" ? "Illustrative sample data" : "Live DEV data"}
        </span>
      </div>

      <section className="rounded-2xl border border-royal/15 bg-royal/[0.04] p-4" aria-label="Three separate things">
        <p className="text-xs font-semibold text-[#1f1b24]">Three separate things</p>
        <dl className="mt-2 grid gap-2 text-xs text-[#4a4454] sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-royal">Agent review</dt>
            <dd>Automated checks and the AI reviewer.</dd>
          </div>
          <div>
            <dt className="font-semibold text-royal">Human approval</dt>
            <dd>A named person signs off a revision.</dd>
          </div>
          <div>
            <dt className="font-semibold text-teal-800">Published</dt>
            <dd>The approved revision is live to children.</dd>
          </div>
        </dl>
      </section>

      <div>
        <h2 className="text-lg font-semibold text-[#1f1b24]">Review queues</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <QueueCard
            title="Awaiting a person"
            count={overview.awaitingPerson}
            caption={`Authored, with no human approval recorded (of ${overview.authored} questions)`}
            action={
              <Link href="/admin/questions?status=awaiting&sort=awaiting" className={linkClass}>
                Open in library
              </Link>
            }
          />
          <QueueCard
            title="Flagged by the AI reviewer"
            count={overview.flagged.count}
            caption="Needs a person to look before anything else"
            tone="warn"
            section={overview.flagged}
          />
          <QueueCard
            title="Writing responses to mark"
            count={overview.writing.count}
            caption="Children waiting on a human mark"
            section={overview.writing}
            action={
              overview.writing.isAvailable ? (
                <button type="button" onClick={() => onOpen("writing")} className={linkClass}>
                  Open writing review
                </button>
              ) : undefined
            }
          />
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className={`${card} p-6`} aria-labelledby="ov-reports">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="ov-reports" className="text-lg font-semibold text-[#1f1b24]">
              Reported by families
            </h2>
            <button type="button" onClick={() => onOpen("support")} className={linkClass}>
              All reports
            </button>
          </div>
          {overview.reports.isAvailable ? (
            <p className="mt-3 text-xs text-[#6e6779]">Open reports are listed in Support.</p>
          ) : (
            <Unavailable section={overview.reports} />
          )}
        </section>

        <section className={`${card} p-6`} aria-labelledby="ov-publication">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="ov-publication" className="text-lg font-semibold text-[#1f1b24]">
              Publication status
            </h2>
            <button type="button" onClick={() => onOpen("publication")} className={linkClass}>
              Publication
            </button>
          </div>
          <p className="mt-1 text-xs text-[#6e6779]">What children can actually be served today, by programme gate.</p>
          <ul className="mt-4 grid gap-3">
            {overview.programmes.map((p) => (
              <li key={p.label} className="flex items-center justify-between gap-3 rounded-xl border border-royal/10 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1f1b24]">{p.label}</p>
                  <p className="text-xs text-[#6e6779]">
                    {p.served.toLocaleString("en-AU")} served · {p.approved.toLocaleString("en-AU")} with a human approval
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${MODE_TONE[p.mode]}`}>
                  {MODE_LABEL[p.mode]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-royal/[0.05] p-3 text-xs leading-relaxed text-[#4a4454]">
            Report mode means the gate records what it would block but still serves the question. Only enforce mode
            requires a human approval before a child sees it.
          </p>
        </section>
      </div>
    </div>
  );
}
