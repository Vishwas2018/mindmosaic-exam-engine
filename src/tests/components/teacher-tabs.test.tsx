import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TabPanel, Tabs } from "@/features/teacher/components/Tabs";

function Harness() {
  const [active, setActive] = useState<"a" | "b">("a");
  return (
    <div>
      <Tabs
        label="Demo tabs"
        tabs={[
          { key: "a", label: "Alpha" },
          { key: "b", label: "Beta" },
        ]}
        active={active}
        onChange={setActive}
      />
      <TabPanel tabKey="a" active={active}>
        Alpha content
      </TabPanel>
      <TabPanel tabKey="b" active={active}>
        Beta content
      </TabPanel>
    </div>
  );
}

describe("Tabs", () => {
  it("marks the active tab with aria-selected and renders only its panel", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Alpha content")).toBeInTheDocument();
    expect(screen.queryByText("Beta content")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Beta" }));

    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByText("Beta content")).toBeInTheDocument();
    expect(screen.queryByText("Alpha content")).not.toBeInTheDocument();
  });

  it("exposes the tablist under the supplied accessible label", () => {
    render(<Harness />);
    expect(screen.getByRole("tablist", { name: "Demo tabs" })).toBeInTheDocument();
  });
});
