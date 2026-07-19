import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/ui";
import {
  MIN_ATTEMPTS_FOR_SIGNAL,
  deriveContentInsights,
} from "@/features/admin-analytics";
import type {
  QuestionHealth,
  QuestionIntelligenceRow,
} from "@/features/admin-analytics";
import { AdminShell } from "@/features/admin-analytics/components/AdminShell";
import { InsightList } from "@/features/admin-analytics/components/InsightList";
import { QuestionIntelligenceExplorer } from "@/features/admin-analytics/components/QuestionIntelligenceExplorer";
import { StatCard } from "@/features/admin-analytics/components/StatCard";
import { TabbedSections } from "@/features/admin-analytics/components/TabbedSections";
import { fetchAdminQuestionIntelligence } from "@/server/admin-analytics";
import { requireAdminAccess } from "@/server/admin-access";

export const metadata: Metadata = { title: "Admin — Content Intelligence" };

/*
 * Per-user data behind auth cookies: never prerender. Without this, a build
 * without Supabase env vars would bake requireAdminAccess's "not configured"
 * shell into a static page and serve it to every visitor — including a real
 * signed-in admin — regardless of the runtime auth state. Same rule as
 * src/app/student/page.tsx and src/app/parent/page.tsx.
 */
export const dynamic = "force-dynamic";

/*
 * Content intelligence (design-explorations/ui-mockups/16-admin-intelligence.html):
 * how the question bank itself is performing. Every figure is a per-question
 * aggregate item statistic — content analytics, not student analytics; no
 * per-child rows exist on this surface (docs/PRIVACY_AND_BILLING_GUARDRAILS.md).
 * The mockup's edit/archive/flag actions need a content-management backend
 * that does not exist yet and are intentionally omitted.
 */

function QualityList({
  title,
  emptyText,
  rows,
}: {
  title: string;
  emptyText: string;
  rows: readonly QuestionIntelligenceRow[];
}) {
  return (
    <section className="rounded-2xl border border-royal/15 bg-white">
      <div className="flex items-center justify-between border-b border-royal/10 px-5 py-4">
        <h3 className="text-[15px] font-extrabold text-ink">{title}</h3>
        <span className="rounded-full bg-royal/8 px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-royal">
          {rows.length}
        </span>
      </div>
      {rows.length > 0 ? (
        <ul className="divide-y divide-royal/8">
          {rows.map((row) => (
            <li key={row.questionId} className="flex items-center gap-3 px-5 py-3">
              <span className="w-28 shrink-0 font-mono text-xs text-muted">
                {row.questionId}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                {row.promptExcerpt}
              </span>
              <span className="text-sm font-bold tabular-nums text-muted">
                {row.accuracyPct === null ? "—" : `${row.accuracyPct}%`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-muted">{emptyText}</p>
      )}
    </section>
  );
}

export default async function AdminIntelligencePage() {
  const access = await requireAdminAccess("/admin/intelligence");

  if (access.status === "not_configured") {
    return (
      <AdminShell active="intelligence" title="Content Intelligence">
        <EmptyState
          title="Supabase isn't connected"
          description="Add your Supabase keys to .env.local to enable content intelligence. This screen reads per-question aggregate statistics — never individual students' answers."
        />
      </AdminShell>
    );
  }

  const data = await fetchAdminQuestionIntelligence(access.supabase);
  if (!data) {
    return (
      <AdminShell active="intelligence" title="Content Intelligence">
        <ErrorState description="The aggregate question statistics view could not be read. Check that the admin_aggregate_views migration has been applied." />
      </AdminShell>
    );
  }

  const { questions, unattempted } = data;
  const insights = deriveContentInsights(questions, unattempted);

  const byHealth = (health: QuestionHealth) =>
    questions.filter((row) => row.health === health);
  const tooEasy = byHealth("too_easy");
  const tooHard = byHealth("too_hard");
  const lowDisc = byHealth("low_discrimination");
  const lowSignal = byHealth("insufficient_data");

  const withAccuracy = questions.filter((row) => row.accuracyPct !== null);
  const avgAccuracy =
    withAccuracy.length > 0
      ? Math.round(
          withAccuracy.reduce((sum, row) => sum + (row.accuracyPct ?? 0), 0) /
            withAccuracy.length,
        )
      : null;

  const performance = (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Live questions"
          value={String(questions.length)}
          detail="Delivered in at least one attempt"
        />
        <StatCard
          label="Avg accuracy"
          value={avgAccuracy === null ? "—" : `${avgAccuracy}%`}
        />
        <StatCard
          label="Needs review"
          value={String(tooEasy.length + tooHard.length + lowDisc.length)}
          detail="Too easy, too hard or low discrimination"
        />
        <StatCard
          label="Not yet delivered"
          value={String(unattempted.length)}
          detail="Bank questions with no attempts"
        />
      </div>
      {questions.length > 0 ? (
        <QuestionIntelligenceExplorer questions={questions} />
      ) : (
        <EmptyState
          title="No question statistics yet"
          description="Item statistics appear once signed-in students submit server-scored attempts."
        />
      )}
    </div>
  );

  const quality = (
    <div className="grid gap-6 xl:grid-cols-2">
      <QualityList
        title="Too easy"
        emptyText="No items flagged as too easy."
        rows={tooEasy}
      />
      <QualityList
        title="Too hard"
        emptyText="No items flagged as too hard."
        rows={tooHard}
      />
      <QualityList
        title="Low discrimination"
        emptyText="No items with weak ability separation."
        rows={lowDisc}
      />
      <QualityList
        title={`Fewer than ${MIN_ATTEMPTS_FOR_SIGNAL} attempts`}
        emptyText="Every live item has enough attempts to judge."
        rows={lowSignal}
      />
    </div>
  );

  const strands = [
    ...new Set([
      ...questions.map((row) => row.strand),
      ...unattempted.map((row) => row.strand),
    ]),
  ].sort();
  const coverage = (
    <section className="rounded-2xl border border-royal/15 bg-white p-5">
      <h3 className="text-[15px] font-extrabold text-ink">Strand coverage</h3>
      <p className="mt-0.5 text-xs text-muted">
        Live coverage counts questions that have been delivered; authored
        questions with no attempts yet are listed separately.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">Question coverage by strand</caption>
          <thead>
            <tr>
              {["Strand", "Live questions", "Awaiting delivery", "Avg accuracy", "Needs review"].map(
                (header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wider text-muted"
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {strands.map((strand) => {
              const live = questions.filter((row) => row.strand === strand);
              const pending = unattempted.filter((row) => row.strand === strand);
              const accurate = live.filter((row) => row.accuracyPct !== null);
              const strandAccuracy =
                accurate.length > 0
                  ? Math.round(
                      accurate.reduce(
                        (sum, row) => sum + (row.accuracyPct ?? 0),
                        0,
                      ) / accurate.length,
                    )
                  : null;
              const needsReview = live.filter((row) =>
                ["too_easy", "too_hard", "low_discrimination"].includes(row.health),
              ).length;
              return (
                <tr key={strand}>
                  <td className="border-t border-royal/8 px-4 py-3 text-sm font-bold text-ink">
                    {strand}
                  </td>
                  <td className="border-t border-royal/8 px-4 py-3 text-sm tabular-nums text-ink">
                    {live.length}
                  </td>
                  <td className="border-t border-royal/8 px-4 py-3 text-sm tabular-nums text-muted">
                    {pending.length}
                  </td>
                  <td className="border-t border-royal/8 px-4 py-3 text-sm font-bold tabular-nums text-ink">
                    {strandAccuracy === null ? "—" : `${strandAccuracy}%`}
                  </td>
                  <td className="border-t border-royal/8 px-4 py-3 text-sm">
                    {needsReview > 0 ? (
                      <span className="inline-flex items-center rounded-full border border-warning/15 bg-warning/10 px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-warning">
                        {needsReview}
                      </span>
                    ) : (
                      <span className="text-sm text-muted">
                        {live.length > 0 ? "None" : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <AdminShell
      active="intelligence"
      title="Content Intelligence"
      contextPill="Question bank statistics — content analytics, not student analytics"
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success/10 px-3 py-1.5 text-xs font-bold text-success">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          Aggregate item statistics
        </span>
      }
    >
      <TabbedSections
        sections={[
          { id: "performance", label: "Question Performance", content: performance },
          { id: "quality", label: "Content Quality", content: quality },
          { id: "coverage", label: "Topic Coverage", content: coverage },
          {
            id: "insights",
            label: "Insights",
            content: <InsightList insights={insights} />,
          },
        ]}
      />
    </AdminShell>
  );
}
