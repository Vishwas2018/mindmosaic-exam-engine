import type { StudyPlan } from "../lib/study-plan";

export function VihaanStudyPlan({ plan, nextFocus }: { plan: StudyPlan; nextFocus: string }) {
  return (
    <div>
      <p className="mb-3 text-sm text-mm-muted">{plan.totalMinutesPerWeek} minutes per week. Initial focus: {nextFocus.replace(/_/g, " ")}.</p>
      <ol className="space-y-3">
        {plan.days.map(day => (
          <li key={day.day} className="flex flex-wrap justify-between gap-2 border-b border-mm-line py-3 text-sm text-ink">
            <span>Day {day.day}: {day.focus.replace(/_/g, " ")}</span>
            <span className="text-mm-muted">{day.minutes} minutes - {day.activity.replace(/_/g, " ")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
