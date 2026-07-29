import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { StudentDetailTabs } from "@/features/teacher/components/StudentDetailTabs";

describe("StudentDetailTabs", () => {
  it("defaults to the overview panel and switches to notes on demand", async () => {
    const user = userEvent.setup();
    render(
      <StudentDetailTabs
        overview={<p>Overview panel</p>}
        mastery={<p>Mastery panel</p>}
        notes={<p>Notes panel</p>}
      />,
    );

    expect(screen.getByText("Overview panel")).toBeInTheDocument();
    expect(screen.queryByText("Notes panel")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Notes & intervention" }));
    expect(screen.getByText("Notes panel")).toBeInTheDocument();
    expect(screen.queryByText("Overview panel")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Strand mastery" }));
    expect(screen.getByText("Mastery panel")).toBeInTheDocument();
  });
});
