/**
 * The one student nav definition, shared by StudentShell (the wide-viewport
 * nav) and StudentMobileNav (the disclosure below `lg`). The two components
 * each carried their own byte-identical copy of this array, so adding or
 * renaming a destination meant remembering to edit both — a nav item added
 * to one and forgotten in the other is invisible on exactly the viewports
 * that don't render it.
 *
 * Coverage: every route the inventory in src/app/dev/routes/page.tsx lists
 * under "Student" is here. /student, /student/learn, /student/assignments
 * and /student/engagement are the four screens this feature owns;
 * /practice and /results are owned elsewhere and only linked to. The
 * inventory's remaining two student entries are deliberately absent —
 * /practice/session is entered by choosing a skill inside /practice, and
 * /exam is reached programmatically once a session starts, so neither is a
 * destination a student can meaningfully navigate to cold.
 */
export type StudentNavKey = "home" | "learn" | "assignments" | "engagement";

export const STUDENT_NAV_ITEMS: ReadonlyArray<{
  key: StudentNavKey | "practice" | "results";
  label: string;
  href: string;
}> = [
  { key: "home", label: "Dashboard", href: "/student" },
  { key: "learn", label: "Learn", href: "/student/learn" },
  { key: "assignments", label: "Assignments", href: "/student/assignments" },
  { key: "engagement", label: "Progress", href: "/student/engagement" },
  { key: "practice", label: "Practice", href: "/practice" },
  { key: "results", label: "Results", href: "/results" },
];

/**
 * The way out of the signed-in area. The logo links home as well, but a
 * logo is a brand mark before it is a signpost — this is the labelled exit.
 */
export const BACK_TO_SITE = { label: "Back to site", href: "/" } as const;
