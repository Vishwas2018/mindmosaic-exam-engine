"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Calculator,
  CheckCheck,
  ClipboardList,
  Clock3,
  Layers,
  SpellCheck,
} from "lucide-react";

import { Badge, Card, EmptyState, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";

import {
  assignmentTitle,
  describeAssignmentConfig,
  dueLabel,
  dueState,
  groupAssignments,
  type DueState,
} from "../classify";
import type { StudentAssignment } from "../types";

/**
 * Read-only assignments list (mockup 10). Tabs are pure client state; all
 * data arrives pre-fetched from the server component. There is no "Start"
 * action yet — running an assignment through the exam engine is a separate
 * thread — so cards present status, due dates and scores only.
 */

type TabId = "todo" | "in_progress" | "completed";

const SUBJECT_ICONS = {
  numeracy: Calculator,
  reading: BookOpen,
  language: SpellCheck,
  mixed: Layers,
} as const;

const DUE_TONE: Record<DueState, string> = {
  overdue: "text-error",
  due_soon: "text-warning",
  upcoming: "text-muted",
  no_due_date: "text-muted",
};

const ACCENT: Record<string, string> = {
  overdue: "border-l-error",
  due_soon: "border-l-royal-orange",
  upcoming: "border-l-royal/20",
  no_due_date: "border-l-royal/20",
  in_progress: "border-l-royal",
  completed: "border-l-success",
};

function StatusBadge({
  assignment,
  now,
}: {
  assignment: StudentAssignment;
  now: Date;
}) {
  if (assignment.status === "submitted") {
    return <Badge variant="success">Completed</Badge>;
  }
  if (assignment.status === "in_progress") {
    return <Badge variant="purple">In progress</Badge>;
  }
  const state = dueState(assignment.dueAt, now);
  if (state === "overdue") return <Badge variant="error">Overdue</Badge>;
  if (state === "due_soon") return <Badge variant="warning">Due soon</Badge>;
  return <Badge variant="purple">Assigned</Badge>;
}

function AssignmentCard({
  assignment,
  now,
}: {
  assignment: StudentAssignment;
  now: Date;
}) {
  const Icon =
    (assignment.config.subject && SUBJECT_ICONS[assignment.config.subject]) ||
    ClipboardList;
  const accent =
    assignment.status === "submitted"
      ? ACCENT.completed
      : assignment.status === "in_progress"
        ? ACCENT.in_progress
        : ACCENT[dueState(assignment.dueAt, now)];
  const detail = describeAssignmentConfig(assignment.config);
  const due = dueLabel(assignment.dueAt, now);
  const score = assignment.score;

  return (
    <Card
      variant="outlined"
      className={cn("flex items-center gap-4 border-l-4 p-5", accent)}
    >
      <div
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-royal/8 text-royal"
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[15px] font-extrabold text-ink">
            {assignmentTitle(assignment)}
          </h3>
          <StatusBadge assignment={assignment} now={now} />
        </div>
        <p className="mt-1 truncate text-sm text-muted">
          {[assignment.className && `Class: ${assignment.className}`, detail]
            .filter(Boolean)
            .join(" · ") || "Details to come from your teacher"}
        </p>
        {assignment.status !== "submitted" && due && (
          <p
            className={cn(
              "mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold",
              DUE_TONE[dueState(assignment.dueAt, now)],
            )}
          >
            <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
            {due}
          </p>
        )}
        {assignment.status === "submitted" && assignment.submittedAt && (
          <p className="mt-1.5 text-xs font-semibold text-muted">
            Completed{" "}
            {new Intl.DateTimeFormat("en-AU", {
              day: "numeric",
              month: "short",
            }).format(new Date(assignment.submittedAt))}
          </p>
        )}
      </div>
      {score && (
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "text-lg font-black tabular-nums",
              score.objectivePercentage >= 75 ? "text-success" : "text-warning",
            )}
          >
            {Math.round(score.objectivePercentage)}%
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-muted">
            {score.correctCount} / {score.totalQuestions} correct
          </p>
        </div>
      )}
    </Card>
  );
}

function TabEmpty({ tab }: { tab: TabId }) {
  const copy: Record<TabId, { title: string; description: string }> = {
    todo: {
      title: "Nothing waiting for you",
      description:
        "New assignments from your teacher will appear here as soon as they are set.",
    },
    in_progress: {
      title: "Nothing in progress",
      description:
        "When you start an assignment it will appear here so you can pick it up again.",
    },
    completed: {
      title: "No completed assignments yet",
      description:
        "When you finish an assignment it will appear here, along with your score.",
    },
  };
  return (
    <EmptyState
      title={copy[tab].title}
      description={copy[tab].description}
      icon={<CheckCheck aria-hidden="true" className="h-6 w-6" />}
    />
  );
}

export function AssignmentsView({
  assignments,
}: {
  assignments: StudentAssignment[];
}) {
  const [tab, setTab] = useState<TabId>("todo");
  /* One clock per render pass keeps every card's dueness consistent. */
  const now = useMemo(() => new Date(), []);
  const grouped = useMemo(
    () => groupAssignments(assignments, now),
    [assignments, now],
  );

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No assignments yet"
        description="When your teacher sets work for your class it will show up here, with due dates and your results. Until then, free practice is always open."
        icon={<ClipboardList aria-hidden="true" className="h-6 w-6" />}
        action={
          <Link href="/" className={buttonClasses({ variant: "orange" })}>
            Go to practice
          </Link>
        }
      />
    );
  }

  const tabs: { id: TabId; label: string; items: StudentAssignment[] }[] = [
    { id: "todo", label: "To do", items: grouped.toDo },
    { id: "in_progress", label: "In progress", items: grouped.inProgress },
    { id: "completed", label: "Completed", items: grouped.completed },
  ];
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <div>
      {grouped.overdueCount > 0 && (
        <div
          role="status"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-error/15 bg-error/5 px-4 py-3"
        >
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-error" />
          <p className="text-sm font-semibold text-error">
            {grouped.overdueCount === 1
              ? "1 assignment is overdue."
              : `${grouped.overdueCount} assignments are overdue.`}{" "}
            Complete {grouped.overdueCount === 1 ? "it" : "them"} as soon as you
            can.
          </p>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Assignment status"
        className="mb-6 flex items-center gap-1 border-b border-royal/10"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={t.id === tab}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors",
              t.id === tab
                ? "border-royal text-royal"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums",
                t.id === tab ? "bg-royal/10 text-royal" : "bg-royal/5 text-muted",
              )}
            >
              {t.items.length}
            </span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active.id}`}
        aria-labelledby={`tab-${active.id}`}
        className="space-y-4"
      >
        {active.items.length === 0 ? (
          <TabEmpty tab={active.id} />
        ) : (
          active.items.map((assignment) => (
            <AssignmentCard
              key={assignment.assignmentId}
              assignment={assignment}
              now={now}
            />
          ))
        )}
      </div>
    </div>
  );
}
