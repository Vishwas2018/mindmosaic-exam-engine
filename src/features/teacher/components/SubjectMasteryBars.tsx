import { ProgressBar } from "@/components/ui";
import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";

import type { SubjectMastery } from "../analytics";

function subjectLabel(subject: string): string {
  return SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS] ?? subject;
}

function toneFor(percentage: number): "purple" | "orange" | "success" {
  if (percentage >= 70) return "success";
  if (percentage >= 50) return "purple";
  return "orange";
}

/** Percentage-of-marks bars per subject, used for class and student views. */
export function SubjectMasteryBars({ mastery }: { mastery: SubjectMastery[] }) {
  if (mastery.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted">
        No scored attempts yet — mastery appears after students submit work.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {mastery.map((row) => (
        <ProgressBar
          key={row.subject}
          label={subjectLabel(row.subject)}
          value={row.percentage}
          showValue
          tone={toneFor(row.percentage)}
        />
      ))}
    </div>
  );
}
