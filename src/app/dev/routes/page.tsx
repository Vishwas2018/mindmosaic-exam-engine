import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Dev — Route index",
  robots: { index: false, follow: false },
};

// TODO(stage-b): once B6 introduces the central `routes` constant, this page
// should render FROM it instead of this local array, so there is one source of
// truth for paths. Self-contained for now.
type Flag = "live" | "mock-data" | "dev-tool" | "programmatic" | "dynamic";

interface Entry { path: string; label: string; flags?: Flag[]; note?: string; linkable?: boolean }
interface Group { title: string; access: string; routes: Entry[] }

const GROUPS: Group[] = [
  {
    title: "Public",
    access: "No sign-in required",
    routes: [
      { path: "/", label: "Landing" },
      { path: "/practice", label: "Practice catalogue" },
      { path: "/practice/[program]", label: "Program configurator", flags: ["dynamic"], note: "pick a program from /practice", linkable: false },
      { path: "/showcase", label: "Component / visual renderer", flags: ["dev-tool"] },
      { path: "/about", label: "About" },
      { path: "/contact", label: "Contact" },
      { path: "/help", label: "Help centre" },
      { path: "/privacy", label: "Privacy policy" },
      { path: "/terms", label: "Terms of use" },
      { path: "/accessibility", label: "Accessibility" },
      { path: "/parent-guide", label: "Parent guide" },
      { path: "/student-tips", label: "Student tips" },
      { path: "/assessment-disclaimer", label: "Assessment disclaimer" },
    ],
  },
  {
    title: "Auth",
    access: "Entry points — sign-in / sign-up",
    routes: [
      { path: "/sign-in", label: "Parent/teacher sign in" },
      { path: "/sign-up", label: "Parent sign up" },
      { path: "/student-sign-in", label: "Student sign in (code + PIN)" },
      { path: "/auth/confirm", label: "Email confirm", note: "normally opened from email", linkable: false },
      { path: "/auth/reset", label: "Password reset", note: "normally opened from email", linkable: false },
    ],
  },
  {
    title: "Student",
    access: "Student role · /student* also needs an active subscription",
    routes: [
      { path: "/student", label: "Dashboard" },
      { path: "/student/learn", label: "Learn" },
      { path: "/student/assignments", label: "Assignments" },
      { path: "/student/engagement", label: "Progress" },
      { path: "/practice/session", label: "Skill practice session" },
      { path: "/exam", label: "Exam runner", flags: ["programmatic"], note: "reached after starting a session", linkable: false },
      { path: "/results", label: "Results history" },
    ],
  },
  {
    title: "Parent",
    access: "Parent role + active subscription",
    routes: [
      { path: "/parent", label: "Dashboard" },
      { path: "/parent/children", label: "Manage children" },
      { path: "/billing", label: "Billing & subscription" },
    ],
  },
  {
    title: "Teacher",
    access: "Teacher role",
    routes: [
      { path: "/teacher", label: "Overview" },
      { path: "/teacher/analytics", label: "Analytics" },
      { path: "/teacher/assignments", label: "Assignments" },
      { path: "/teacher/assignments/new", label: "New assignment", flags: ["mock-data"], note: "mock skills/blueprints catalogue" },
      { path: "/teacher/students", label: "Students" },
      { path: "/teacher/students/[id]", label: "Student detail", flags: ["dynamic", "mock-data"], note: "mock notes/flags; needs a student id", linkable: false },
      { path: "/teacher/marking", label: "Marking queue" },
      { path: "/teacher/marking/[attemptId]/[questionId]", label: "Mark a response", flags: ["dynamic"], linkable: false },
    ],
  },
  {
    title: "Admin",
    access: "Admin role",
    routes: [
      { path: "/admin", label: "Admin hub" },
      { path: "/admin/analytics", label: "Analytics" },
      { path: "/admin/intelligence", label: "Content intelligence" },
      { path: "/admin/operations", label: "Operations", flags: ["mock-data"], note: "mock background jobs" },
    ],
  },
];

const FLAG_LABEL: Record<Flag, string> = {
  live: "live", "mock-data": "mock data", "dev-tool": "dev tool",
  programmatic: "programmatic", dynamic: "dynamic",
};

export default function DevRoutesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const total = GROUPS.reduce((n, g) => n + g.routes.length, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium text-royal">Dev only · not in production</p>
      <h1 className="mt-2 text-3xl font-bold">Route index</h1>
      <p className="mt-2 text-muted">
        {total} routes. Role-gated groups need the matching sign-in; parent and
        student also need an active subscription.
      </p>

      <div className="mt-10 space-y-10">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-xl font-bold">{group.title}</h2>
            <p className="text-sm text-muted">{group.access}</p>
            <ul className="mt-4 divide-y rounded-xl border">
              {group.routes.map((r) => (
                <li key={r.path} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                  {r.linkable === false ? (
                    <span className="font-mono text-sm text-muted">{r.path}</span>
                  ) : (
                    <Link href={r.path} className="font-mono text-sm text-royal underline-offset-2 hover:underline">
                      {r.path}
                    </Link>
                  )}
                  <span className="text-sm">{r.label}</span>
                  {r.flags?.map((f) => (
                    <span key={f} className="rounded-full border px-2 py-0.5 text-xs text-muted">
                      {FLAG_LABEL[f]}
                    </span>
                  ))}
                  {r.note ? <span className="w-full text-xs text-muted">{r.note}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
