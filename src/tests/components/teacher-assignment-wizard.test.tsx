import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssignmentCreateForm } from "@/features/teacher/components/AssignmentCreateForm";
import type { RosterStudent, TeacherClass } from "@/features/teacher/data";
import type { AssignmentSkill } from "@/features/teacher/mock-catalogue";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const ACTIVE_CLASS: TeacherClass = { id: "class-a", name: "5A", yearLevel: 5 };
const ROSTER: RosterStudent[] = [
  { studentId: "s1", displayName: "Ava Chen", yearLevel: 5 },
  { studentId: "s2", displayName: "Ben Diaz", yearLevel: 5 },
];
const SKILLS: AssignmentSkill[] = [
  { id: "numeracy-fractions", label: "Fractions & equivalence", subject: "numeracy" },
];

async function goToContentStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

describe("AssignmentCreateForm wizard", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ assignmentId: "assignment-1", assignedCount: 1 }),
      })),
    );
  });

  it("requires a student when targeting an individual", async () => {
    const user = userEvent.setup();
    render(
      <AssignmentCreateForm
        activeClass={ACTIVE_CLASS}
        roster={ROSTER}
        skills={SKILLS}
        blueprints={[]}
      />,
    );

    await user.click(screen.getByLabelText("One student"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select a student for this assignment.",
    );
  });

  it("requires a title before leaving the content step, then reaches review", async () => {
    const user = userEvent.setup();
    render(
      <AssignmentCreateForm
        activeClass={ACTIVE_CLASS}
        roster={ROSTER}
        skills={SKILLS}
        blueprints={[]}
      />,
    );

    await goToContentStep(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Give the assignment a name students will recognise.",
    );

    await user.type(screen.getByLabelText("Name"), "Fractions focus week");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Review before publishing")).toBeInTheDocument();
    expect(screen.getByText("Entire class (2)")).toBeInTheDocument();
  });

  it("publishes with the recipients, config and instructions from the wizard", async () => {
    const user = userEvent.setup();
    render(
      <AssignmentCreateForm
        activeClass={ACTIVE_CLASS}
        roster={ROSTER}
        skills={SKILLS}
        blueprints={[]}
      />,
    );

    await goToContentStep(user);
    await user.type(screen.getByLabelText("Name"), "Fractions focus week");
    await user.type(screen.getByLabelText("Instructions"), "Take your time.");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Publish assignment" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/teacher/assignments",
      expect.objectContaining({ method: "POST" }),
    );
    const [, requestInit] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.classId).toBe("class-a");
    expect(body.studentIds).toEqual(["s1", "s2"]);
    expect(body.config.title).toBe("Fractions focus week");
    expect(body.config.instructions).toBe("Take your time.");
    expect(push).toHaveBeenCalledWith("/teacher/assignments?class=class-a");
  });

  it("pre-selects students passed in from a bulk Students List action", async () => {
    render(
      <AssignmentCreateForm
        activeClass={ACTIVE_CLASS}
        roster={ROSTER}
        skills={SKILLS}
        blueprints={[]}
        initialSelectedIds={["s1"]}
      />,
    );

    expect(screen.getByLabelText("Ava Chen")).toBeChecked();
  });
});
