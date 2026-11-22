import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ProfileRole } from "@/features/auth/roles";

const authMock = vi.hoisted(() => ({
  status: "anonymous" as "anonymous" | "authenticated" | "loading",
  role: null as ProfileRole | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    status: authMock.status,
    role: authMock.role,
  }),
}));

import { ExamPatternStarter } from "@/features/exam-engine/exam-patterns/components/ExamPatternStarter";
import { getExamPattern } from "@/features/exam-engine/exam-patterns";
import type { PatternReadiness } from "@/features/exam-engine/exam-patterns/pattern-readiness";

const y3ModulePattern = getExamPattern("amc-y3-middle-primary-module")!;
const y5ModulePattern = getExamPattern("amc-y5-upper-primary-module")!;

const y3Readiness: PatternReadiness = {
  patternId: y3ModulePattern.id,
  state: "ready",
  requestedCount: 26,
  availableCount: 26,
  distinctPapers: 1,
  sources: [],
};

const y5Readiness: PatternReadiness = {
  patternId: y5ModulePattern.id,
  state: "ready",
  requestedCount: 27,
  availableCount: 27,
  distinctPapers: 1,
  sources: [],
};

describe("ExamPatternStarter role authorization & notices", () => {
  beforeEach(() => {
    authMock.status = "anonymous";
    authMock.role = null;
  });

  it("shows non-student notice and disables start button for admin", () => {
    authMock.status = "authenticated";
    authMock.role = "admin";

    render(<ExamPatternStarter pattern={y3ModulePattern} readiness={y3Readiness} />);

    const notice = screen.getByTestId("non-student-role-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/signed in as an administrator/i);
    expect(notice).toHaveTextContent(/only be sat by student accounts/i);

    const adminLink = screen.getByRole("link", { name: /admin dashboard/i });
    expect(adminLink).toHaveAttribute("href", "/admin");

    const studentLink = screen.getByRole("link", { name: /sign in with a student account/i });
    expect(studentLink).toHaveAttribute("href", "/sign-in");

    expect(screen.getByTestId("start-pattern")).toBeDisabled();
  });

  it("shows non-student notice and disables start button for parent on Year 5", () => {
    authMock.status = "authenticated";
    authMock.role = "parent";

    render(<ExamPatternStarter pattern={y5ModulePattern} readiness={y5Readiness} />);

    const notice = screen.getByTestId("non-student-role-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/signed in as a parent/i);

    const parentLink = screen.getByRole("link", { name: /parent dashboard/i });
    expect(parentLink).toHaveAttribute("href", "/parent");

    expect(screen.getByTestId("start-pattern")).toBeDisabled();
  });

  it("shows non-student notice and disables start button for teacher", () => {
    authMock.status = "authenticated";
    authMock.role = "teacher";

    render(<ExamPatternStarter pattern={y3ModulePattern} readiness={y3Readiness} />);

    const notice = screen.getByTestId("non-student-role-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveTextContent(/signed in as a teacher/i);

    const teacherLink = screen.getByRole("link", { name: /teacher dashboard/i });
    expect(teacherLink).toHaveAttribute("href", "/teacher");

    expect(screen.getByTestId("start-pattern")).toBeDisabled();
  });

  it("permits signed-in student without non-student notice", () => {
    authMock.status = "authenticated";
    authMock.role = "student";

    render(<ExamPatternStarter pattern={y3ModulePattern} readiness={y3Readiness} />);

    expect(screen.queryByTestId("non-student-role-notice")).not.toBeInTheDocument();
    expect(screen.getByTestId("start-pattern")).toBeEnabled();
  });

  it("permits guest on AMC practice module without non-student notice", () => {
    authMock.status = "anonymous";
    authMock.role = null;

    render(<ExamPatternStarter pattern={y3ModulePattern} readiness={y3Readiness} />);

    expect(screen.queryByTestId("non-student-role-notice")).not.toBeInTheDocument();
    expect(screen.getByTestId("start-pattern")).toBeEnabled();
  });
});
