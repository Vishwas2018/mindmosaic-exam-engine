"use client";

import { useState } from "react";
import { Download } from "lucide-react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, ProgressBar } from "@/components/ui";
import { SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";

import type { ClassOverview } from "../analytics";
import type { TopicAnalysisPoint } from "../analytics-reports";
import type { StudentListRow } from "../students-filter";
import { StandingBadge } from "./StandingBadge";
import { SubjectMasteryBars } from "./SubjectMasteryBars";
import { Tabs } from "./Tabs";

type AnalyticsTab = "students" | "class" | "topics";

const TABS: { key: AnalyticsTab; label: string }[] = [
  { key: "students", label: "Student reports" },
  { key: "class", label: "Class overview" },
  { key: "topics", label: "Topic analysis" },
];

function subjectLabel(subject: string): string {
  return SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS] ?? subject;
}

function topicTone(percentage: number): "purple" | "orange" | "success" {
  if (percentage >= 70) return "success";
  if (percentage >= 50) return "purple";
  return "orange";
}

export function TeacherAnalyticsView({
  classOverview,
  studentRows,
  topics,
}: {
  classOverview: ClassOverview;
  studentRows: StudentListRow[];
  topics: TopicAnalysisPoint[];
}) {
  const [tab, setTab] = useState<AnalyticsTab>("students");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs label="Report view" tabs={TABS} active={tab} onChange={setTab} />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled
          title="Report export is coming soon"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Export report
        </Button>
      </div>

      {tab === "students" && (
        <Card>
          <CardHeader>
            <CardTitle>Student reports</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0 pb-2">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-royal/10 text-left">
                  <th className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                    Student
                  </th>
                  <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                    Class
                  </th>
                  <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                    Avg score
                  </th>
                  <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                    Attempts
                  </th>
                  <th className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                    Standing
                  </th>
                </tr>
              </thead>
              <tbody>
                {studentRows.map((row) => (
                  <tr
                    key={`${row.classId}:${row.studentId}`}
                    className="border-b border-royal/5"
                  >
                    <td className="px-6 py-3 font-bold text-ink">{row.displayName}</td>
                    <td className="px-4 py-3 text-muted">{row.className}</td>
                    <td className="px-4 py-3 font-bold tabular-nums text-ink">
                      {row.summary.averagePercentage === null
                        ? "—"
                        : `${row.summary.averagePercentage}%`}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {row.summary.attemptCount}
                    </td>
                    <td className="px-6 py-3">
                      <StandingBadge standing={row.summary.standing} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "class" && (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card className="p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
                Students
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-ink">
                {classOverview.studentCount}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {classOverview.activeThisWeekCount} active this week
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
                Avg score
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-ink">
                {classOverview.averagePercentage === null
                  ? "—"
                  : `${classOverview.averagePercentage}%`}
              </p>
              <p className="mt-0.5 text-xs text-muted">Objective marks across attempts</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
                At risk
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-error">
                {classOverview.atRiskCount}
              </p>
              <p className="mt-0.5 text-xs text-muted">Students needing attention</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
                Subjects tracked
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-ink">
                {classOverview.subjectMastery.length}
              </p>
              <p className="mt-0.5 text-xs text-muted">With at least one scored attempt</p>
            </Card>
          </section>
          <Card>
            <CardHeader>
              <CardTitle>Subject mastery</CardTitle>
            </CardHeader>
            <CardContent>
              <SubjectMasteryBars mastery={classOverview.subjectMastery} />
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "topics" && (
        <Card>
          <CardHeader>
            <CardTitle>Topic analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topics.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                No scored attempts yet — topic analysis appears once students submit work.
              </p>
            ) : (
              topics.map((point) => (
                <div key={point.subject} className="flex items-center gap-4">
                  <div className="flex-1">
                    <ProgressBar
                      label={subjectLabel(point.subject)}
                      value={point.percentage}
                      showValue
                      tone={topicTone(point.percentage)}
                    />
                  </div>
                  <Badge variant="neutral" className="shrink-0">
                    {point.studentCount} student{point.studentCount === 1 ? "" : "s"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
