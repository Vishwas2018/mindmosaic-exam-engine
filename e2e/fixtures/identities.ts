/**
 * The full manifest of deterministic fixture identities this suite seeds.
 * Every email lives under one reserved local-only domain so seed/cleanup can
 * always find (and only ever touch) rows this suite created — see
 * ./cleanup.ts. Fixed keys, not randomly generated ones, are what make the
 * seed idempotent and the storageState files reusable across runs.
 */

/** Reserved for e2e fixtures only. A real household can never use this domain. */
export const FIXTURE_EMAIL_DOMAIN = "e2e.mindmosaic.local";

/**
 * Mirrors the alias-email format in src/features/auth/student-alias.ts
 * (`buildAliasEmail`) so a fixture student authenticates through the exact
 * same signInWithPassword call a real student's code+PIN sign-in makes.
 * Duplicated rather than imported: e2e/ is test tooling with its own module
 * resolution, and this is a stable, documented ("D1") format, not an
 * implementation detail likely to drift silently.
 */
export function studentAliasEmail(loginCode: string): string {
  return `childcode+${loginCode.toLowerCase()}@students.mindmosaic.internal`;
}

export type ParentKey =
  | "parent-no-children"
  | "parent-one-child"
  | "parent-multi-children"
  | "household-expired"
  | "household-active-premium";

export type StudentKey =
  | "student-no-attempts"
  | "student-completed-attempt"
  | "student-second-child";

export type TeacherKey = "teacher-no-students" | "teacher-with-students";

export interface ParentIdentity {
  readonly kind: "parent";
  readonly key: ParentKey;
  readonly email: string;
  readonly displayName: string;
}

export interface StudentIdentity {
  readonly kind: "student";
  readonly key: StudentKey;
  /** Formatted login code a parent would hand to this child, e.g. "E2ST-UD01". */
  readonly loginCode: string;
  readonly email: string;
  readonly displayName: string;
  readonly parent: ParentKey;
}

export interface TeacherIdentity {
  readonly kind: "teacher";
  readonly key: TeacherKey;
  readonly email: string;
  readonly displayName: string;
}

export interface AdminIdentity {
  readonly kind: "admin";
  readonly key: "admin";
  readonly email: string;
  readonly displayName: string;
}

export type Identity = ParentIdentity | StudentIdentity | TeacherIdentity | AdminIdentity;

const parentEmail = (key: string) => `${key}@${FIXTURE_EMAIL_DOMAIN}`;

export const PARENTS: readonly ParentIdentity[] = [
  { kind: "parent", key: "parent-no-children", email: parentEmail("parent-no-children"), displayName: "Parent No Children" },
  { kind: "parent", key: "parent-one-child", email: parentEmail("parent-one-child"), displayName: "Parent One Child" },
  { kind: "parent", key: "parent-multi-children", email: parentEmail("parent-multi-children"), displayName: "Parent Multi Children" },
  { kind: "parent", key: "household-expired", email: parentEmail("household-expired"), displayName: "Household Expired" },
  { kind: "parent", key: "household-active-premium", email: parentEmail("household-active-premium"), displayName: "Household Active Premium" },
];

export const STUDENTS: readonly StudentIdentity[] = [
  {
    kind: "student",
    key: "student-no-attempts",
    loginCode: "E2STUD01",
    email: studentAliasEmail("E2STUD01"),
    displayName: "Student No Attempts",
    parent: "parent-one-child",
  },
  {
    kind: "student",
    key: "student-completed-attempt",
    loginCode: "E2STUD02",
    email: studentAliasEmail("E2STUD02"),
    displayName: "Student Completed Attempt",
    parent: "parent-multi-children",
  },
  {
    kind: "student",
    key: "student-second-child",
    loginCode: "E2STUD03",
    email: studentAliasEmail("E2STUD03"),
    displayName: "Student Second Child",
    parent: "parent-multi-children",
  },
];

export const TEACHERS: readonly TeacherIdentity[] = [
  { kind: "teacher", key: "teacher-no-students", email: parentEmail("teacher-no-students"), displayName: "Teacher No Students" },
  { kind: "teacher", key: "teacher-with-students", email: parentEmail("teacher-with-students"), displayName: "Teacher With Students" },
];

export const ADMIN: AdminIdentity = {
  kind: "admin",
  key: "admin",
  email: parentEmail("admin"),
  displayName: "Admin",
};

export const ALL_IDENTITIES: readonly Identity[] = [...PARENTS, ...STUDENTS, ...TEACHERS, ADMIN];

/** roster: which student(s) `teacher-with-students` can see. */
export const TEACHER_WITH_STUDENTS_ROSTER: readonly StudentKey[] = ["student-completed-attempt"];
