import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PinInput } from "@/features/auth/components/PinInput";

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <PinInput id="pin" label="Your PIN" value={value} onChange={setValue} />
      <output data-testid="value">{value}</output>
    </>
  );
}

const box = (n: number) => screen.getByLabelText(new RegExp(`your pin, number ${n} of 6`, "i"));
const value = () => screen.getByTestId("value").textContent;

describe("PinInput", () => {
  it("fills one box at a time and moves forward", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(box(1));
    await user.keyboard("424");
    expect(value()).toBe("424");
    expect(box(4)).toHaveFocus();
  });

  it("ignores anything that is not a digit", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(box(1));
    await user.keyboard("a-4b2");
    expect(value()).toBe("42");
  });

  it("spreads a pasted PIN across the boxes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(box(1));
    await user.paste("123456");
    expect(value()).toBe("123456");
    expect(box(6)).toHaveFocus();
  });

  it("removes digits with Backspace and steps back from an empty box", async () => {
    const user = userEvent.setup();
    render(<Harness initial="123" />);
    await user.click(box(4));
    await user.keyboard("{Backspace}");
    expect(value()).toBe("12");
    expect(box(3)).toHaveFocus();
  });

  it("names every box with the visible label (WCAG 2.5.3) and masks the digits", () => {
    render(<Harness initial="123456" />);
    for (let n = 1; n <= 6; n += 1) {
      expect(box(n)).toHaveAttribute("type", "password");
    }
    expect(screen.getByRole("group", { name: "Your PIN" })).toBeInTheDocument();
  });
});
