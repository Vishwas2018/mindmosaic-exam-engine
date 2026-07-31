import fs from "node:fs";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DashboardLoading,
  ExamLoading,
  PageLoading,
  RouteError,
} from "@/components/route-boundaries";

/**
 * There were no error or loading boundaries anywhere in src/app, so any
 * throw — including mid-exam — fell through to Next.js's own error page, and
 * any awaited segment showed nothing while it loaded. These pin the
 * behaviour that replaced that.
 */

describe("RouteError", () => {
  const error = Object.assign(new Error("boom"), { digest: "abc123" });

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders the message and a working retry that calls Next's reset", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<RouteError error={error} reset={reset} segment="/test" retryLabel="Try again" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  /* An opaque failure with nothing behind it is what made the billing card
     undiagnosable. The message stays off the screen; it must not vanish. */
  it("logs the error server-side with its digest", () => {
    render(<RouteError error={error} reset={vi.fn()} segment="/parent" />);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("/parent"),
      expect.objectContaining({ digest: "abc123" }),
    );
  });

  it("shows the digest as a support reference", () => {
    render(<RouteError error={error} reset={vi.fn()} segment="/test" />);
    expect(screen.getByText("abc123")).toBeInTheDocument();
  });

  it("omits the reference line when there is no digest", () => {
    render(<RouteError error={new Error("no digest")} reset={vi.fn()} segment="/test" />);
    expect(screen.queryByText(/reference:/i)).not.toBeInTheDocument();
  });

  it("offers a way out that isn't the back button", () => {
    render(
      <RouteError
        error={error}
        reset={vi.fn()}
        segment="/exam"
        escape={{ href: "/practice", label: "Back to practice" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Back to practice" })).toHaveAttribute(
      "href",
      "/practice",
    );
  });
});

describe("loading skeletons", () => {
  /* A silent skeleton is a blank screen to a screen reader. */
  it.each([
    ["dashboard", <DashboardLoading key="d" label="Loading your dashboard" />, "Loading your dashboard"],
    ["page", <PageLoading key="p" label="Loading your results" />, "Loading your results"],
    ["exam", <ExamLoading key="e" />, "Getting your exam ready"],
  ])("%s loading state announces itself", (_name, element, label) => {
    render(element);
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0);
  });

  it("renders no blank page — the exam skeleton has visible structure", () => {
    const { container } = render(<ExamLoading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(4);
  });
});

/**
 * The boundaries only work if the files exist at the right paths — Next.js
 * discovers them by convention, so a missing file fails silently by falling
 * back to the default error page. This asserts coverage rather than trusting
 * that someone remembered.
 */
describe("route boundary coverage", () => {
  it("has a global error boundary", () => {
    expect(fs.existsSync("src/app/global-error.tsx")).toBe(true);
  });

  it.each([
    "src/app/error.tsx",
    "src/app/exam/error.tsx",
    "src/app/results/error.tsx",
    "src/app/parent/error.tsx",
    "src/app/student/error.tsx",
    "src/app/teacher/error.tsx",
    "src/app/admin/error.tsx",
    "src/app/billing/error.tsx",
    "src/app/practice/error.tsx",
    "src/app/auth/error.tsx",
  ])("%s exists", (path) => {
    expect(fs.existsSync(path)).toBe(true);
  });

  /*
   * /practice and /teacher deliberately have no loading.tsx of their own:
   * both have notFound()-calling descendants, and a Suspense boundary above
   * one streams a 200 before the 404 can be set. The teacher loaders live on
   * the two subsegments that have no such descendant. Enforced in
   * src/tests/unit/route-loading-boundaries.test.ts.
   */
  it.each([
    "src/app/exam/loading.tsx",
    "src/app/results/loading.tsx",
    "src/app/parent/loading.tsx",
    "src/app/student/loading.tsx",
    "src/app/admin/loading.tsx",
    "src/app/billing/loading.tsx",
    "src/app/teacher/analytics/loading.tsx",
    "src/app/teacher/assignments/loading.tsx",
  ])("%s exists", (path) => {
    expect(fs.existsSync(path)).toBe(true);
  });

  /* error.tsx must be a Client Component or Next refuses to use it — and
     the failure mode is the default error page, i.e. exactly the thing
     these files exist to prevent. */
  it.each(
    fs
      .readdirSync("src/app", { recursive: true, encoding: "utf8" })
      .filter((entry) => entry.endsWith("error.tsx"))
      .map((entry) => `src/app/${entry.replace(/\\/g, "/")}`),
  )('%s is a Client Component', (path) => {
    expect(fs.readFileSync(path, "utf8").startsWith('"use client"')).toBe(true);
  });
});
