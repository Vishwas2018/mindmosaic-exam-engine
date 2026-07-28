import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { summariseStudent } from "@/features/teacher/analytics";
import { StudentsTable } from "@/features/teacher/components/StudentsTable";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";
import { getClassRoster, listStudentAttempts } from "@/features/teacher/data";
import { loadTeacherPageContext } from "@/features/teacher/load-context";
import type { StudentListRow } from "@/features/teacher/students-filter";

export const metadata: Metadata = { title: "Students" };

export default async function TeacherStudentsPage() {
  const { supabase, teacher, classes } = await loadTeacherPageContext(undefined);

  if (classes.length === 0) {
    return (
      <TeacherShell
        title="Students"
        activeNav="students"
        classes={classes}
        activeClassId={null}
        teacherName={teacher.displayName}
      >
        <EmptyState
          title="No classes yet"
          description="Students appear here once your classes and rosters are set up."
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

  const rows: StudentListRow[] = rostersByClass.flatMap(({ teacherClass, roster }) =>
    roster.map((student) => ({
      studentId: student.studentId,
      displayName: student.displayName ?? "Unnamed student",
      yearLevel: student.yearLevel,
      classId: teacherClass.id,
      className: teacherClass.name,
      summary: summariseStudent(student.studentId, attempts),
    })),
  );

  return (
    <TeacherShell
      title="Students"
      activeNav="students"
      classes={classes}
      activeClassId={null}
      teacherName={teacher.displayName}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>All students</CardTitle>
            <CardDescription>
              {rows.length} student{rows.length === 1 ? "" : "s"} across {classes.length}{" "}
              class{classes.length === 1 ? "" : "es"}. Select a class in the filters to enable
              bulk assignment creation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <StudentsTable rows={rows} classes={classes} />
          </CardContent>
        </Card>
      </div>
    </TeacherShell>
  );
}
