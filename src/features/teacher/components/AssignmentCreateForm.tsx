"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Input, Select } from "@/components/ui";
import {
  STYLE_LABELS,
  SUBJECT_LABELS,
  YEAR_LABELS,
} from "@/features/exam-engine/components/describe-config";
import {
  EXAM_STYLE_OPTIONS,
  QUESTION_COUNT_OPTIONS,
  SUBJECT_OPTIONS,
  YEAR_LEVEL_OPTIONS,
} from "@/features/exam-engine/selection";
import type {
  ExamStyleFilter,
  QuestionCountOption,
  SubjectFilter,
  TimingMode,
  YearLevelFilter,
} from "@/features/exam-engine/selection";

import type { RosterStudent, TeacherClass } from "../data";

/**
 * Assignment creation form (the mockup's wizard flattened into one
 * accessible form — same choices, fewer steps). Posts to
 * /api/teacher/assignments; the server re-validates everything and RLS
 * re-checks class ownership independently of anything chosen here.
 */
export function AssignmentCreateForm({
  activeClass,
  roster,
}: {
  activeClass: TeacherClass;
  roster: RosterStudent[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [yearLevel, setYearLevel] = useState<YearLevelFilter>(
    activeClass.yearLevel === 3 || activeClass.yearLevel === 5
      ? activeClass.yearLevel
      : "mixed",
  );
  const [examStyle, setExamStyle] = useState<ExamStyleFilter>("naplan_style");
  const [subject, setSubject] = useState<SubjectFilter>("numeracy");
  const [questionCount, setQuestionCount] = useState<QuestionCountOption>(10);
  const [timing, setTiming] = useState<TimingMode>("untimed");
  const [dueDate, setDueDate] = useState("");
  const [assignToAll, setAssignToAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recipients = assignToAll
    ? roster.map((student) => student.studentId)
    : [...selectedIds];

  function toggleStudent(studentId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (title.trim().length === 0) {
      setError("Give the assignment a name students will recognise.");
      return;
    }
    if (recipients.length === 0) {
      setError("Select at least one student.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: activeClass.id,
          config: {
            yearLevel,
            examStyle,
            subject,
            questionCount,
            timing,
            bankId: "curated",
            title: title.trim(),
          },
          dueAt: dueDate
            ? new Date(`${dueDate}T23:59:59`).toISOString()
            : null,
          studentIds: recipients,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(
          body?.error === "students_not_in_class"
            ? "One of the selected students is no longer in this class. Refresh and try again."
            : "The assignment could not be created. Please try again.",
        );
        return;
      }
      router.push(`/teacher/assignments?class=${activeClass.id}`);
      router.refresh();
    } catch {
      setError("The assignment could not be created. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <section aria-labelledby="assignment-basics" className="space-y-4">
        <h2 id="assignment-basics" className="text-sm font-extrabold uppercase tracking-[0.06em] text-muted">
          Assignment
        </h2>
        <Input
          label="Name"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Fractions focus week"
          maxLength={120}
          required
        />
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          hint="Optional — leave empty for no due date."
        />
      </section>

      <section aria-labelledby="assignment-config" className="space-y-4">
        <h2 id="assignment-config" className="text-sm font-extrabold uppercase tracking-[0.06em] text-muted">
          Practice set
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Year level"
            value={String(yearLevel)}
            onChange={(event) =>
              setYearLevel(
                event.target.value === "mixed"
                  ? "mixed"
                  : (Number(event.target.value) as 3 | 5),
              )
            }
          >
            {YEAR_LEVEL_OPTIONS.map((option) => (
              <option key={String(option)} value={String(option)}>
                {YEAR_LABELS[String(option)]}
              </option>
            ))}
          </Select>
          <Select
            label="Style"
            value={examStyle}
            onChange={(event) => setExamStyle(event.target.value as ExamStyleFilter)}
          >
            {EXAM_STYLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {STYLE_LABELS[option]}
              </option>
            ))}
          </Select>
          <Select
            label="Subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value as SubjectFilter)}
          >
            {SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SUBJECT_LABELS[option]}
              </option>
            ))}
          </Select>
          <Select
            label="Questions"
            value={String(questionCount)}
            onChange={(event) =>
              setQuestionCount(
                event.target.value === "full"
                  ? "full"
                  : (Number(event.target.value) as 10 | 20 | 30),
              )
            }
          >
            {QUESTION_COUNT_OPTIONS.map((option) => (
              <option key={String(option)} value={String(option)}>
                {option === "full" ? "Full set" : `${option} questions`}
              </option>
            ))}
          </Select>
          <Select
            label="Timing"
            value={timing}
            onChange={(event) => setTiming(event.target.value as TimingMode)}
          >
            <option value="untimed">Untimed</option>
            <option value="timed">Timed</option>
          </Select>
        </div>
      </section>

      <fieldset className="space-y-3">
        <legend className="text-sm font-extrabold uppercase tracking-[0.06em] text-muted">
          Assign to
        </legend>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-royal/15 bg-white px-4 py-3">
            <input
              type="radio"
              name="target"
              className="h-4 w-4 accent-royal"
              checked={assignToAll}
              onChange={() => setAssignToAll(true)}
            />
            <span className="text-sm font-bold text-ink">
              Entire class ({roster.length} students)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-royal/15 bg-white px-4 py-3">
            <input
              type="radio"
              name="target"
              className="h-4 w-4 accent-royal"
              checked={!assignToAll}
              onChange={() => setAssignToAll(false)}
            />
            <span className="text-sm font-bold text-ink">Selected students</span>
          </label>
        </div>
        {!assignToAll && (
          <ul className="grid gap-2 rounded-2xl border border-royal/10 bg-white p-4 sm:grid-cols-2">
            {roster.map((student) => (
              <li key={student.studentId}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-royal"
                    checked={selectedIds.has(student.studentId)}
                    onChange={() => toggleStudent(student.studentId)}
                  />
                  {student.displayName ?? "Unnamed student"}
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="text-sm font-semibold text-error">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSubmitting} loadingLabel="Publishing">
          Publish assignment
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/teacher/assignments?class=${activeClass.id}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
