import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

import { EmptyState } from "@/components/ui";
import { summariseClass, summariseStudent } from "@/features/teacher/analytics";
import { topicAnalysis } from "@/features/teacher/analytics-reports";
import { TeacherAnalyticsView } from "@/features/teacher/components/TeacherAnalyticsView";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";
import { getClassRoster, listStudentAttempts } from "@/features/teacher/data";
import { loadTeacherPageContext } from "@/features/teacher/load-context";
import type { StudentListRow } from "@/features/teacher/students-filter";

export const metadata: Metadata = { title: "Teacher analytics" };

export default async function TeacherAnalyticsPage() {
  const { supabase, teacher, classes } = await loadTeacherPageContext(undefined);

  if (classes.length === 0) {
    return (
      <TeacherShell
        title="Analytics"
        activeNav="analytics"
        classes={classes}
        activeClassId={null}
        teacherName={teacher.displayName}
      >
        <EmptyState
          title="No classes yet"
          description="Analytics appear once your classes and rosters are set up."
          icon={<GraduationCap aria-hidden="true" className="h-6 w-6" />}
        />
      </TeacherShell>
    );
  }

  const rostersByClass = await Promise.all(
    classes.map(async (teacherClass) => ({
      teacherClass,
      roster: await getClassRoster(supabase, teacherClass.id),
    })),
  );
  const studentIds = [
    ...new Set(rostersByClass.flatMap(({ roster }) => roster.map((student) => student.studentId))),
  ];
  const attempts = await listStudentAttempts(supabase, studentIds);

  const studentRows: StudentListRow[] = rostersByClass.flatMap(({ teacherClass, roster }) =>
    roster.map((student) => ({
      studentId: student.studentId,
      displayName: student.displayName ?? "Unnamed student",
      yearLevel: student.yearLevel,
      classId: teacherClass.id,
      className: teacherClass.name,
      summary: summariseStudent(student.studentId, attempts),
    })),
  );

  const classOverview = summariseClass(studentIds, attempts);
  const topics = topicAnalysis(attempts);

  return (
    <TeacherShell
      title="Analytics"
      activeNav="analytics"
      classes={classes}
      activeClassId={null}
      teacherName={teacher.displayName}
    >
      <TeacherAnalyticsView
        classOverview={classOverview}
        studentRows={studentRows}
        topics={topics}
      />
    </TeacherShell>
  );
}
