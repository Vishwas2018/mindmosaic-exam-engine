import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminShell } from "@/features/admin-analytics/components/AdminShell";
import { AuthProvider } from "@/features/auth";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
  }),
}));

/** Every top-level teacher route — the drill-downs need an id and are reached by clicking a row. */
const TEACHER_ROUTES = [
  ["Overview", "/teacher"],
  ["Students", "/teacher/students"],
  ["Assignments", "/teacher/assignments"],
  ["Analytics", "/teacher/analytics"],
  ["Marking", "/teacher/marking"],
] as const;

function renderTeacherShell() {
  return render(
    <AuthProvider>
      <TeacherShell title="Overview" activeNav="overview" classes={[]} activeClassId={null} teacherName="Ms Kaur">
        <p>page body</p>
      </TeacherShell>
    </AuthProvider>,
  );
}

describe("TeacherShell navigation", () => {
  it("exposes every top-level teacher route in the sidebar", () => {
    renderTeacherShell();
    const sidebar = within(screen.getByRole("navigation", { name: "Teacher" }));
    for (const [label, href] of TEACHER_ROUTES) {
      expect(sidebar.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  /*
   * The sidebar holding the nav is `hidden lg:flex`, so below 1024px a
   * teacher had no navigation at all — none of the five teacher screens was
   * reachable from any other, and a display:none nav is skipped by Tab, so
   * it was a keyboard dead end too.
   */
  it("keeps every teacher route reachable below the lg breakpoint", () => {
    renderTeacherShell();
    const compact = within(screen.getByRole("navigation", { name: "Teacher, compact" }));
    for (const [label, href] of TEACHER_ROUTES) {
      expect(compact.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it.each(["Teacher", "Teacher, compact"] as const)(
    "offers a labelled way back to the public site in the %s nav",
    (navName) => {
      renderTeacherShell();
      const nav = within(screen.getByRole("navigation", { name: navName }));
      expect(nav.getByRole("link", { name: /back to site/i })).toHaveAttribute("href", "/");
    },
  );
});

describe("AdminShell navigation", () => {
  /*
   * The small-screen row used to carry only the three sections, leaving the
   * sidebar's other two destinations — the /admin hub and the way out to the
   * public site — reachable on desktop only.
   */
  it("reaches everything the sidebar does from the small-screen row", () => {
    render(
      <AdminShell active="analytics" title="Analytics">
        <p>page body</p>
      </AdminShell>,
    );

    const [sidebar, compact] = screen.getAllByRole("navigation", { name: "Admin sections" });
    for (const source of [sidebar, compact]) {
      const nav = within(source);
      expect(nav.getByRole("link", { name: "Analytics" })).toHaveAttribute("href", "/admin/analytics");
      expect(nav.getByRole("link", { name: "Content Intelligence" })).toHaveAttribute(
        "href",
        "/admin/intelligence",
      );
      expect(nav.getByRole("link", { name: "Operations" })).toHaveAttribute("href", "/admin/operations");
    }
    expect(within(compact).getByRole("link", { name: "Admin home" })).toHaveAttribute("href", "/admin");
    expect(within(compact).getByRole("link", { name: /back to site/i })).toHaveAttribute("href", "/");
  });
});
