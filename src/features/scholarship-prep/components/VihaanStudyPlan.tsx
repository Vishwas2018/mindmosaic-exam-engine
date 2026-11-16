"use client";

import type { StudyPlan, StudyPlanDay } from "../lib/study-plan";

export function VihaanStudyPlan({
  plan,
  nextFocus,
  onLaunchDay,
}: {
  plan: StudyPlan;
  nextFocus: string;
  onLaunchDay?: (day: StudyPlanDay) => void;
}) {
  return (
    <div data-testid="vihaan-study-plan">
      <p className="mb-3 text-sm text-mm-muted">
        {plan.totalMinutesPerWeek} minutes per week (60 minutes daily). Current priority:{" "}
        <span className="font-semibold text-ink">{nextFocus.replace(/_/g, " ")}</span>.
      </p>
      <ol className="space-y-3">
        {plan.days.map((day) => (
          <li
            key={day.day}
            className="rounded-xl border border-mm-line bg-mm-page/50 p-4 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink">
                  Day {day.day}: {day.focus.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-mm-muted">
                  {day.minutes} minutes · {day.activity.replace(/_/g, " ")}
                  {day.targetTopics.length > 0
                    ? ` · Weak topics: ${day.targetTopics.slice(0, 2).join(", ")}`
                    : ""}
                </p>
              </div>
              {onLaunchDay && (
                <button
                  type="button"
                  data-testid={`study-plan-launch-day-${day.day}`}
                  onClick={() => onLaunchDay(day)}
                  className="rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
                >
                  Start 60-min Session
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {day.blocks.map((block) => (
                <div
                  key={`${day.day}-${block.label}`}
                  className="rounded-lg border border-mm-line/80 bg-white px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-ink">{block.minutes}m</span>{" "}
                  <span className="text-mm-muted">{block.label}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
