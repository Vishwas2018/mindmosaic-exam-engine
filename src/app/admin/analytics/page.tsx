import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui";
import {
  derivePerformanceInsights,
  masteryPct,
  scoreBandLabel,
} from "@/features/admin-analytics";
import type { DimensionPerformance } from "@/features/admin-analytics";
import { AdminShell } from "@/features/admin-analytics/components/AdminShell";
import { InsightList } from "@/features/admin-analytics/components/InsightList";
import { StatCard } from "@/features/admin-analytics/components/StatCard";
import { TabbedSections } from "@/features/admin-analytics/components/TabbedSections";
import {
  BandBarChart,
  TrendLineChart,
} from "@/features/admin-analytics/components/charts";
import { fetchAdminAnalytics } from "@/server/admin-analytics";
import { requireAdminAccess } from "@/server/admin-access";

export const metadata: Metadata = { title: "Admin — Analytics" };

/*
 * Per-user data behind auth cookies: never prerender. Without this, a build
 * without Supabase env vars would bake requireAdminAccess's "not configured"
 * shell into a static page and serve it to every visitor — including a real
 * signed-in admin — regardless of the runtime auth state. Same rule as
 * src/app/student/page.tsx and src/app/parent/page.tsx.
 */
export const dynamic = "force-dynamic";

/*
 * Platform analytics (design-explorations/ui-mockups/14-analytics.html,
 * adapted): the mockup shows a teacher's class analytics with per-student
 * rows; teacher screens are a later phase and per-child listings do not
 * belong on an admin aggregate surface, so the same layout is applied to
 * platform-level aggregates only (docs/PRIVACY_AND_BILLING_GUARDRAILS.md).
 */

function formatMinutes(seconds: number | null): string {
  if (seconds === null) return "—";
  return `${Math.round(seconds / 60)} min`;
}

function weekLabel(weekStart: string): string {
  const date = new Date(`${weekStart}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return weekStart;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const tableHead =
  "px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-muted";
const tableCell = "border-t border-royal/8 px-4 py-3 text-sm text-ink";

function DimensionTable({
  caption,
  nameHeader,
  rows,
}: {
  caption: string;
  nameHeader: string;
  rows: readonly DimensionPerformance[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={tableHead}>
              {nameHeader}
            </th>
            <th scope="col" className={tableHead}>
              Mastery
            </th>
            <th scope="col" className={tableHead}>
              Correct
            </th>
            <th scope="col" className={tableHead}>
              Incorrect
            </th>
            <th scope="col" className={tableHead}>
              Unanswered
            </th>
            <th scope="col" className={tableHead}>
              Attempts
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const mastery = masteryPct(row);
            return (
              <tr key={row.name}>
                <td className={`${tableCell} font-bold`}>{row.name}</td>
                <td className={tableCell}>
                  {mastery === null ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-20 overflow-hidden rounded-full bg-royal/10">
                        <span
                          className="block h-full rounded-full bg-royal"
                          style={{ width: `${mastery}%` }}
                        />
                      </span>
                      <span className="font-bold tabular-nums">{mastery}%</span>
                    </span>
                  )}
                </td>
                <td className={`${tableCell} tabular-nums text-success`}>
                  {row.questionsCorrect}
                </td>
                <td className={`${tableCell} tabular-nums text-error`}>
                  {row.questionsIncorrect}
                </td>
                <td className={`${tableCell} tabular-nums text-muted`}>
                  {row.questionsUnanswered}
                </td>
                <td className={`${tableCell} tabular-nums`}>{row.attempts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-royal/15 bg-white p-5">
      <h2 className="text-[15px] font-extrabold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  const access = await requireAdminAccess("/admin/analytics");

  if (access.status === "not_configured") {
    return (
      <AdminShell active="analytics" title="Analytics">
        <EmptyState
          title="Supabase isn't connected"
          description="Add your Supabase keys to .env.local to enable admin analytics. All figures on this screen come from pre-aggregated views — never individual students' rows."
        />
      </AdminShell>
    );
  }

  const data = await fetchAdminAnalytics(access.supabase);
  if (!data) {
    return (
      <AdminShell active="analytics" title="Analytics">
        <ErrorState description="The aggregate analytics views could not be read. Check that the admin_aggregate_views migration has been applied." />
      </AdminShell>
    );
  }

  const { totals, weekly, distribution, subjects, skills } = data;
  const hasAttempts = totals.totalAttempts > 0;
  const performanceInsights = derivePerformanceInsights(subjects);

  const sortedSkills = [...skills].sort(
    (a, b) => (masteryPct(a) ?? 0) - (masteryPct(b) ?? 0),
  );

  const overview = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Attempts" value={String(totals.totalAttempts)} />
        <StatCard
          label="Active students"
          value={String(totals.activeStudents)}
          detail="Distinct students with a submitted attempt"
        />
        <StatCard label="Sessions started" value={String(totals.totalSessions)} />
        <StatCard
          label="Avg score"
          value={totals.avgScorePct === null ? "—" : `${Math.round(totals.avgScorePct)}%`}
        />
        <StatCard
          label="Avg time"
          value={formatMinutes(totals.avgTimeSeconds)}
          detail="Per attempt"
        />
      </div>
      {hasAttempts ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard
            title="Average score trend"
            description="Weekly average objective score across all submitted attempts"
          >
            <TrendLineChart
              ariaLabel={`Weekly average score trend: ${weekly
                .map(
                  (week) =>
                    `week of ${weekLabel(week.weekStart)} ${week.avgScorePct === null ? "no data" : `${Math.round(week.avgScorePct)}%`}`,
                )
                .join(", ")}`}
              points={weekly.map((week) => ({
                label: weekLabel(week.weekStart),
                value: week.avgScorePct === null ? 0 : Math.round(week.avgScorePct),
              }))}
              maxValue={100}
            />
          </SectionCard>
          <SectionCard
            title="Score distribution"
            description="Submitted attempts by objective score band"
          >
            <BandBarChart
              ariaLabel={`Score distribution: ${distribution
                .map((band) => `${scoreBandLabel(band.bandStart)}: ${band.attempts}`)
                .join(", ")}`}
              bands={distribution.map((band) => ({
                label: scoreBandLabel(band.bandStart),
                value: band.attempts,
              }))}
            />
          </SectionCard>
        </div>
      ) : (
        <EmptyState
          title="No attempts yet"
          description="Charts appear once signed-in students submit server-scored attempts."
        />
      )}
    </div>
  );

  const subjectsPanel = (
    <div className="grid gap-6 xl:grid-cols-5">
      <div className="xl:col-span-3">
      <SectionCard
        title="Subject performance"
        description="Aggregate mastery of objective marks by subject"
      >
        {subjects.length > 0 ? (
          <DimensionTable
            caption="Subject performance"
            nameHeader="Subject"
            rows={[...subjects].sort(
              (a, b) => (masteryPct(b) ?? 0) - (masteryPct(a) ?? 0),
            )}
          />
        ) : (
          <p className="text-sm text-muted">No subject data yet.</p>
        )}
      </SectionCard>
      </div>
      <div className="xl:col-span-2">
        <h2 className="sr-only">Subject insights</h2>
        <InsightList insights={performanceInsights} />
      </div>
    </div>
  );

  const topicsPanel = (
    <SectionCard
      title="Topic performance"
      description="Aggregate mastery by skill, weakest first — the admin view of where content or practice volume is needed"
    >
      {sortedSkills.length > 0 ? (
        <DimensionTable
          caption="Skill performance, weakest first"
          nameHeader="Skill"
          rows={sortedSkills}
        />
      ) : (
        <p className="text-sm text-muted">No skill data yet.</p>
      )}
    </SectionCard>
  );

  const timePanel = hasAttempts ? (
    <div className="space-y-6">
      <SectionCard
        title="Average time per attempt"
        description="Weekly average minutes spent on a submitted attempt"
      >
        <TrendLineChart
          ariaLabel={`Weekly average attempt time in minutes: ${weekly
            .map(
              (week) =>
                `week of ${weekLabel(week.weekStart)} ${formatMinutes(week.avgTimeSeconds)}`,
            )
            .join(", ")}`}
          points={weekly.map((week) => ({
            label: weekLabel(week.weekStart),
            value:
              week.avgTimeSeconds === null
                ? 0
                : Math.round(week.avgTimeSeconds / 60),
          }))}
          unit="m"
        />
      </SectionCard>
      <SectionCard title="Weekly activity">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">Weekly activity</caption>
            <thead>
              <tr>
                <th scope="col" className={tableHead}>
                  Week of
                </th>
                <th scope="col" className={tableHead}>
                  Attempts
                </th>
                <th scope="col" className={tableHead}>
                  Active students
                </th>
                <th scope="col" className={tableHead}>
                  Avg score
                </th>
                <th scope="col" className={tableHead}>
                  Avg time
                </th>
              </tr>
            </thead>
            <tbody>
              {weekly.map((week) => (
                <tr key={week.weekStart}>
                  <td className={`${tableCell} font-bold`}>
                    {weekLabel(week.weekStart)}
                  </td>
                  <td className={`${tableCell} tabular-nums`}>{week.attempts}</td>
                  <td className={`${tableCell} tabular-nums`}>
                    {week.activeStudents}
                  </td>
                  <td className={`${tableCell} tabular-nums`}>
                    {week.avgScorePct === null
                      ? "—"
                      : `${Math.round(week.avgScorePct)}%`}
                  </td>
                  <td className={`${tableCell} tabular-nums`}>
                    {formatMinutes(week.avgTimeSeconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  ) : (
    <EmptyState
      title="No attempts yet"
      description="Time analysis appears once signed-in students submit server-scored attempts."
    />
  );

  return (
    <AdminShell
      active="analytics"
      title="Analytics"
      contextPill="All aggregates — no individual student data"
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Pre-aggregated views
        </span>
      }
    >
      <TabbedSections
        sections={[
          { id: "overview", label: "Platform Overview", content: overview },
          { id: "subjects", label: "Subjects", content: subjectsPanel },
          { id: "topics", label: "Topic Analysis", content: topicsPanel },
          { id: "time", label: "Time Analysis", content: timePanel },
        ]}
      />
    </AdminShell>
  );
}
